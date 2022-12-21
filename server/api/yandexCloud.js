const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')

const settings = {
    credentials: {
      accessKeyId: 'YCAJEAhd_PedwPn_Xs2-waWYY',
      secretAccessKey: 'YCM6MIogI9uksAwbUFzXjFMJyJDBfgYDK8AvEnJC'
    },
    endpoint: 'https://storage.yandexcloud.net',
    s3ForcePathStyle: true,
    region: 'ru-central1',
    apiVersion: 'latest'
}

const s3 = new S3(settings)

async function uploadFile(binary, fileName, bucket) {
    const params = {
        Bucket: bucket,
        Key: fileName,
        Body: binary
    }

    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err, err.stack)
        } else {
            console.log(`Success load to YC ${fileName}`)
            console.log(data)
        }    
    })
}

// protected
const listAllKeys = (params, out = []) => new Promise((resolve, reject) => {
    s3.listObjectsV2(params).promise()
        .then(({Contents, IsTruncated, NextContinuationToken}) => {
        out.push(...Contents);
        !IsTruncated ? resolve(out) : resolve(listAllKeys(Object.assign(params, {ContinuationToken: NextContinuationToken}), out));
    })
    .catch(reject);
})

async function listObjectInBucket(bucket) {
    return await listAllKeys({Bucket: bucket})
}

async function getDownloadLinks(list = [], bucket) {
    let urls = []

    for(let l = 0; l < list.length; l++) {
        if(list[l].Size > 0) {
            let url = await s3.getSignedUrlPromise('getObject', {
                Bucket: bucket,
                Expires: 3600,
                Key: list[l].Key
            })

            urls.push({url, name: list[l].Key})
        }
    }

    return urls
}

async function getDownloadLink(key = "", bucket) {
    let url = await s3.getSignedUrlPromise('getObject', {
        Bucket: bucket,
        Expires: 3600,
        Key: key
    })

    return url
}

async function deleteObjects(list = [], bucket) {
    let Objects = []
    
    list.forEach(item => {
        Objects.push({Key: item.name})
    })

    await s3.deleteObjects({
        Bucket: bucket,
        Delete: { Objects }
    }).promise()

    console.log('Delete success.')
    return true
}

module.exports = {
    uploadFile,
    listObjectInBucket,
    getDownloadLinks,
    getDownloadLink,
    deleteObjects
}