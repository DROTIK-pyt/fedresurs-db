const baseSettings = require('./config/serverSetting.json')
const {} = require('./db/index')

const express = require("express")
const cors = require('cors')
const multer  = require('multer')
const path = require('path')
const json2xls = require('json2xls')
const jwt = require('jsonwebtoken')
// const base64 = require('base-64')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../static/uploads')
    },
    filename: function (req, file, cb) {
        let arr = file.originalname.split('.')
        const extension = arr.slice(-1)[0]

        req.originalSrc = path.resolve(`../static/uploads/${req.body.uniqueSuffix}.${extension}`)

        cb(null, `${req.body.uniqueSuffix}.${extension}`)
    }
})
const upload = multer({ dest: 'uploads/', storage: storage  })

const app = express()
app.use(cors())
app.use(express.json({ limit: '500kb', parameterLimit: 10000 })) // for parsing application/json
app.use(express.urlencoded({ extended: true, limit: '500kb', parameterLimit: 10000 }))
app.use(json2xls.middleware)

app.use(express.static('static'))

require('./routesDb/index')(app, upload, jwt) // Урлы запросов
require('./auth/index')(app, upload, jwt) // Авторизация
require('./api/index')(app, upload, jwt) // API

app.listen(baseSettings.port, () => {
    console.log(`Server start on ${baseSettings.baseUrl}:${baseSettings.port}/`)
})