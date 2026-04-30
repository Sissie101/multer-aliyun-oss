# Multer Storage for AliYun OSS

Dependencies [@ali-oss](https://github.com/ali-sdk/ali-oss)

## Install

```npm
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
        // to set path prefix for files, could be string or function
        destination: ''
    })
});
```

## File information

Each file contains the following information:

Key | Description | Note
--- | --- | ---
`fieldname` | Field name specified in the form |
`originalname` | Name of the file on the user's computer |
`encoding` | Encoding type of the file |
`mimetype` | Mime type of the file |
`size` | Size of the file in bytes |
`destination` | The folder to which the file has been saved | `DiskStorage`
`filename` | The name of the file within the `destination` | `DiskStorage`
`path` | The full path to the uploaded file | `DiskStorage`
`buffer` | A `Buffer` of the entire file | `MemoryStorage`

## Option

### destination

`String` or `Function`

```
// same signature as multer native
destination (req, file, callback) {
    callback(null, 'images')
}
```

## Base44 Integration

Connect this storage engine to your [Base44](https://base44.com) app to automatically record uploaded file metadata in a Base44 entity.

### Setup

Install the optional Base44 SDK:

```npm
npm install @base44/sdk
```

### Usage

Pass a `base44` option with your app ID, credentials, and the entity name where file records should be saved:

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

After each successful OSS upload, the storage engine creates a record in the specified Base44 entity with:

Field | Value
--- | ---
`filename` | OSS filename
`url` | Public URL of the uploaded file
`path` | OSS path prefix
`size` | File size in bytes
`mimetype` | MIME type
`originalname` | Original filename from the client
`uploadedAt` | ISO timestamp of the upload

The file info object on `req.file` will also include a `base44RecordId` field with the newly created record's ID.

### Finding your Base44 App ID

Open your app in the Base44 editor. The app ID is the segment in the URL:
```
https://base44.com/apps/<app-id>/...
```

## Contact

<angusyoung@mrxcool.com>
