/**
 * @Author Angus <angusyoung@mrxcool.com>
 * @Description Multer storage for Aliyun OSS
 * @Since 2018/8/17
 */
const { promisify } = require('util');
const Path = require('path');
const crypto = require('crypto');
const OSS = require('ali-oss');

const ERROR_NO_CLIENT = new Error('oss client undefined');

// keep same signature as multer native
function getRandomFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : `${raw.toString('hex')}${Path.extname(file.originalname)}`);
  });
}

class AliYunOssStorage {
    constructor({ config, destination = '', filename = getRandomFilename, base44 = null }) {
        this.client = new OSS(config);
        this.getDestination = typeof destination === 'string' ? (req, file, cb) => cb(null, destination) : destination;
        this.getFilename = filename;
        this.base44Config = base44;
        this._base44Client = null;
    }

    _initBase44Client() {
        if (this._base44Client) return Promise.resolve(this._base44Client);
        if (!this.base44Config || !this.base44Config.appId) return Promise.resolve(null);

        let sdk;
        try {
            sdk = require('@base44/sdk');
        } catch (e) {
            console.warn('multer-aliyun-oss: @base44/sdk not found. Run: npm install @base44/sdk');
            return Promise.resolve(null);
        }

        const client = sdk.createClient({ appId: this.base44Config.appId });

        if (this.base44Config.email && this.base44Config.password) {
            return client.auth.loginViaEmailPassword(this.base44Config.email, this.base44Config.password)
                .then(() => {
                    this._base44Client = client;
                    return client;
                });
        }

        this._base44Client = client;
        return Promise.resolve(client);
    }

    _handleFile(req, file, cb) {
        if (!this.client) {
            return cb(ERROR_NO_CLIENT);
        }

        const getDestination = promisify(this.getDestination);
        const getFilename = promisify(this.getFilename);

        let size = 0;
        let fileInfo = null;

        Promise.all([
            getDestination(req, file),
            getFilename(req, file)
        ])
            .then(([destination, filename]) => {
                // add listener here because if put in upper scope,
                // the uploaded file will be 0 byte (very weird!).
                file.stream.on('data', chunk => {
                    size += Buffer.byteLength(chunk);
                });
                return this.client.putStream(`${destination}/${filename}`, file.stream);
            })
            .then(({ url, name }) => {
                const lastSlashIndex = name.lastIndexOf('/');
                fileInfo = {
                    destination: name.substr(0, lastSlashIndex),
                    filename: name.substr(lastSlashIndex + 1),
                    path: name.substr(0, lastSlashIndex),
                    url,
                    size
                };

                if (!this.base44Config || !this.base44Config.entityName) {
                    return null;
                }

                return this._initBase44Client().then(b44 => {
                    if (!b44) return null;
                    return b44.entities[this.base44Config.entityName].create({
                        filename: fileInfo.filename,
                        url: fileInfo.url,
                        path: fileInfo.path,
                        size: fileInfo.size,
                        mimetype: file.mimetype,
                        originalname: file.originalname,
                        uploadedAt: new Date().toISOString(),
                        ...(this.base44Config.entityFields || {})
                    });
                });
            })
            .then(base44Record => {
                cb(null, {
                    ...fileInfo,
                    ...(base44Record ? { base44RecordId: base44Record.id } : {})
                });
            })
            .catch(cb);
    }

    _removeFile(req, file, cb) {
        if (!this.client) {
            return cb(ERROR_NO_CLIENT);
        }
        this.client
            .delete(file.filename)
            .then(result => cb(null, result))
            .catch(cb);
    }
}

module.exports = function (opts) {
    // error first
    if (typeof opts !== 'object' || opts === null) {
        throw new TypeError('Expected object for argument options');
    }
    return new AliYunOssStorage(opts);
};
