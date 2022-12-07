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
    app.post('/auth', async (req, res) => {
        const { login, password } = req.body

        const anUser = await Scheme.user.findOne({
            where: {
                login, password
            }
        })

        if(anUser) {
            let signature = uuidv4()
            let sessionId = uuidv4()

            sessions.push({
                id: sessionId,
                signature
            })

            let accessToken = jwt.sign({
                userId: anUser.idUser
            }, signature, { expiresIn: "1m" })
            let refreshToken = uuidv4()

            anUser.signature = signature
            anUser.refreshToken = refreshToken
            await anUser.save()

            res.json({ok: true, accessToken, refreshToken, sessionId})
        } else
            res.json({ok: false})
    })

    app.post('/checkTokens', async (req,res) => {
        const { accessToken, sessionId } = req.body
        if(accessToken) {
            const signature = sessions.find(s => sessionId === s.id)?.signature

            jwt.verify(accessToken, signature, err => {
                if(err) {
                    res.json({ok: false, error: err.name})
                } else {
                    res.json({ok: true})
                }
            })
        } else {
            res.json({ok: false})
        }
    })

    app.post('/refresh', async (req, res) => {
        const { refreshToken, sessionId } = req.body

        const signature = sessions.find(s => sessionId === s.id)?.signature

        if(refreshToken && sessionId && signature) {
            const anUser = await Scheme.user.findOne({
                where: {
                    refreshToken, signature
                }
            })
            if(anUser) {
                let signature = uuidv4()
                let refreshToken = uuidv4()

                sessions.map(s => {
                    if(s.id === sessionId) {
                        s.signature = signature
                        return
                    }
                })

                let accessToken = jwt.sign({
                    userId: anUser.idUser
                }, signature, { expiresIn: "1m" })

                anUser.signature = signature
                anUser.refreshToken = refreshToken
                await anUser.save()

                res.json({ok: true, refreshToken, accessToken})
            } else {
                res.json({ok: false})
            }
        } else {
            res.json({ok: false})
        }
    })

    app.post('/logout', async (req, res) => {
        const { sessionId } = req.body
        const signature = sessions.find(s => sessionId === s.id)?.signature

        if(signature) {
            const anUser = await Scheme.user.findOne({
                where: {
                    signature
                }
            })

            anUser.signature = null
            anUser.refreshToken = null,
            await anUser.save()

            sessions.forEach((el, index) => {
                if(el.id === sessionId) {
                    sessions.splice(index, 1)
                    return
                }
            })
        } 
        res.json({ok: true})
    })
}