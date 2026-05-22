# Multer Storage for AliYun OSS

[![npm version](https://img.shields.io/npm/v/multer-aliyun-oss.svg)](https://www.npmjs.com/package/multer-aliyun-oss)
[![license](https://img.shields.io/npm/l/multer-aliyun-oss.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A [Multer](https://github.com/expressjs/multer) storage engine for [Alibaba Cloud OSS](https://www.alibabacloud.com/product/object-storage-service), with optional [Base44](https://base44.com) integration to automatically record upload metadata.

Dependencies: [@ali-oss](https://github.com/ali-sdk/ali-oss)

---

## What's New

**Base44 Integration** — Extended the original storage engine so every successful upload automatically creates a record in a Base44 entity. This makes it easy to build full-stack apps where file uploads are tracked in a database without writing any extra backend code.

---

## Install

```sh
npm install --save multer-aliyun-oss
```

## Usage

```js
const multer = require('multer');
const MAO = require('multer-aliyun-oss');

const upload = multer({
    storage: MAO({
        config: {
            region: '<region>',
            accessKeyId: '<accessKeyId>',
            accessKeySecret: '<accessKeySecret>',
            bucket: '<bucket>',
        },
        // optional path prefix — string or function
        destination: ''
    })
});
```

## File Information

Each uploaded file exposes:

| Field | Description | Storage |
| --- | --- | --- |
| `fieldname` | Field name from the form | |
| `originalname` | Original filename from the client | |
| `encoding` | Encoding type | |
| `mimetype` | MIME type | |
| `size` | File size in bytes | |
| `destination` | Folder the file was saved to | `DiskStorage` |
| `filename` | Filename within `destination` | `DiskStorage` |
| `path` | Full path to the file | `DiskStorage` |
| `buffer` | Buffer of the entire file | `MemoryStorage` |

## Option

### destination

`String` or `Function`

```js
// same signature as multer native
destination(req, file, callback) {
    callback(null, 'images');
}
```

---

## Base44 Integration

Connect this storage engine to your [Base44](https://base44.com) app to automatically record uploaded file metadata in a Base44 entity.

### Setup

Install the optional Base44 SDK:

```sh
npm install @base44/sdk
```

### Usage

Pass a `base44` option with your app ID, credentials, and the entity name where records should be saved:

```js
const multer = require('multer');
const MAO = require('multer-aliyun-oss');

const upload = multer({
    storage: MAO({
        config: {
            region: '<region>',
            accessKeyId: '<accessKeyId>',
            accessKeySecret: '<accessKeySecret>',
            bucket: '<bucket>',
        },
        destination: 'uploads',
        base44: {
            appId: '<your-base44-app-id>',       // found in the Base44 editor URL
            email: '<user@example.com>',          // Base44 account email
            password: '<password>',               // Base44 account password
            entityName: 'UploadedFile',           // entity name in your Base44 app
            entityFields: {                       // optional extra fields on every record
                source: 'web-upload'
            }
        }
    })
});
```

After each successful OSS upload, the storage engine creates a record in the specified Base44 entity:

| Field | Value |
| --- | --- |
| `filename` | OSS filename |
| `url` | Public URL of the uploaded file |
| `path` | OSS path prefix |
| `size` | File size in bytes |
| `mimetype` | MIME type |
| `originalname` | Original filename from the client |
| `uploadedAt` | ISO timestamp of the upload |

The `req.file` object will also include a `base44RecordId` field with the newly created record's ID.

### Finding your Base44 App ID

Open your app in the Base44 editor — the app ID is the segment in the URL:

```
https://base44.com/apps/<app-id>/...
```

---

## Contact

<angusyoung@mrxcool.com>
