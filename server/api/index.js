const { Scheme, Op } = require('../db/scheme')
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const parser = require('simple-excel-to-json')
const cyrillicToTranslit = new CyrillicToTranslit()
const json2xls = require('json2xls')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
// const path = require('path')

const cache = []

const sessions = []

const actions = require("../config/importActions.json")
const classesFields = require("../config/fieldsClass.json")


module.exports = function(app, upload, jwt) {
    app.post("/addUser", async (req, res) => {
        const { login, password } = req.body

        if(login != "" && password != "") {
            await Scheme.user.create({
                login, password
            })

            res.json({ok: true, msg: "User added."})
        } else {
            res.json({ok: false, msg: "Error. Some data is wrong."})
        }
    })
}