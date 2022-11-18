const { company, fieldsInfoOfCompany, historyPublic, contactPerson, status, event, fieldsCompany, Op } = require('../db/scheme')
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const cyrillicToTranslit = new CyrillicToTranslit()

module.exports = function(app, upload) {

    app.get('/get-semi-fields', async (req, res) => {
        const fields = await fieldsInfoOfCompany.findAll({
            attributes: [ 'tag', 'name' ],
            limit: 4
        })

        res.json(fields)
    })

    app.get('/fields', async (req, res) => {
        const fields = await fieldsInfoOfCompany.findAll({
            attributes: [ 'tag', 'name' ],
        })

        res.json(fields)
    })

    app.post('/add-new-field', async (req, res) => {
        const { newFieldName } = req.body

        if (newFieldName != "") {
            const foundFields = await fieldsInfoOfCompany.findAll({
                where: {    
                    name: newFieldName
                }
            })

            if(foundFields.length === 0) {
                await fieldsInfoOfCompany.create({
                    name: newFieldName,
                    tag: cyrillicToTranslit.transform(newFieldName, '-').toLowerCase()
                })
            } else {
                res.json({ok: false, msg: "Есть совпадения по именам."})
                return
            }
        } else {
            res.json({ok: false, msg: "Поля не должны быть пустыми."})
            return
        }
        res.json({ok: true})
    })

    app.put('/fields', async (req, res) => {
        const { fieldsOfComponiesData } = req.body

        let field
        for(let i = 0; i < fieldsOfComponiesData.length; i++) {
            field = fieldsOfComponiesData[i]

            if(field.name != "") {
                const foundFields = await fieldsInfoOfCompany.findAll({
                    where: {    
                        name: field.name
                    }
                })
                if(foundFields.length === 0) {
                    await fieldsInfoOfCompany.update({
                        name: field.name,
                        tag: cyrillicToTranslit.transform(field.name, '-').toLowerCase()
                    }, {
                        where: {
                            tag: field.tag
                        }
                    })
                }
            } else {
                res.json({ok: false, msg: "Поля не должны быть пустыми."})
                return
            }
        }
        res.json({ok: true})
    })

    app.delete('/fields', async (req, res) => {
        const { tag } = req.body

        await fieldsInfoOfCompany.destroy({
            where: {
                tag
            }
        })

        res.json({ok: true})
    })

    app.get('/company', async (req, res) => {
        const items = await company.findAll({
            limit: 30,
        })

        let results = []
        let fieldsValues = await fieldsCompany.findAll()

        for (let i = 0; i < items.length; i++) {
            let fvs = {}
            fieldsValues.forEach(fv => {
                if(fv.companyIdCompany === items[i].idCompany) {
                    fvs[`${fv.infoOfCompanyIdInfo}`] = fv.value
                }
            })

            let fields = await items[i].getInfoOfCompanies()

            let result = {}
            fields.forEach(field => {
                result[`${field.tag}`] = fvs[`${field.idInfo}`]
            })

            result[`idCompany`] = items[i].idCompany

            results.push(result)
        }

        res.json({ok: true, results})
    })
}