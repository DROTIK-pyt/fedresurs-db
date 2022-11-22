const { company, fieldsInfoOfCompany, historyPublic, contactPerson, status, event, fieldsCompany, Op } = require('../db/scheme')
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const parser = require('simple-excel-to-json')
const cyrillicToTranslit = new CyrillicToTranslit()

const cache = []

function ExcelDateToJSDate(serial) {
    let utc_days  = Math.floor(serial - 25569);
    let utc_value = utc_days * 86400;                                        
    let date_info = new Date(utc_value * 1000);
 
    let fractional_day = serial - Math.floor(serial) + 0.0000001;
 
    let total_seconds = Math.floor(86400 * fractional_day);
 
    let seconds = total_seconds % 60;
 
    total_seconds -= seconds;
 
    let hours = Math.floor(total_seconds / (60 * 60));
    let minutes = Math.floor(total_seconds / 60) % 60;
 
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
 }

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
        const items = await company.findAll()

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

    app.post('/companyViaId', async (req, res) => {
        const { idCompany } = req.body
        console.log(cache[0].readFile)

        const items = await company.findAll({
            where: {
                idCompany
            }
        })

        const aCompany = items[0]
        // const contact = await aCompany.getContactPeople()

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

    app.post('/getHeadFieldsExcel', upload.single('xlxsFile'), async (req, res) => {
        const { file } = req
        const { uniqueSuffix } = req.body

        let fieldsValues = await fieldsInfoOfCompany.findAll()

        const readFile = parser.parseXls2Json(req.originalSrc)
        readFile[0].forEach(field => {
            field['Сообщение:_дата'] = ExcelDateToJSDate(field['Сообщение:_дата']).toLocaleDateString()
        })

        cache.push({
            id: uniqueSuffix,
            readFile 
        })

        res.json({ok: true, fieldsValues, uniqueSuffix, heading: Object.keys(readFile[0][0])})
    })

    app.get('/fieldsValues', async (req, res) => {
        const fieldsValues = await fieldsInfoOfCompany.findAll()

        res.json({ok: true, fieldsValues})
    })

    app.post('/cacheItem', async (req, res) => {
        const { uniqueSuffix } = req.body        

        res.json({ok: true, readFile: cache.find(item => item.id === uniqueSuffix)?.readFile})
    })

    app.delete('/clearCache', async (req, res) => {
        const { uniqueSuffix } = req.body

        if(uniqueSuffix) {
            const item = cache.find(element => element.id === uniqueSuffix)
            const index = cache.indexOf(item)

            if(index > -1) {
                cache.splice(index, 1)

                res.json({ok: true})
            } else {
                res.json({ok: false})
            }
        } else {
            res.json({ok: false})
        }
    })

    app.post('/uploadToBase', async(req, res) => {
        const { uniqueSuffix, file2field } = req.body

        const readFile = cache.find(c => c.id === uniqueSuffix).readFile[0]

        console.log('start upload..', cache)
        
        for(let i = 0; i < readFile.length; i++) {
            let rf = readFile[i]

            let aCompany = await company.create()

            for(let g = 0; g < file2field.length; g++) {
                let f2f = file2field[g]

                let idInfo = f2f.idInfo
                let value = rf[`${f2f.item[0].name}`]

                await fieldsCompany.create({
                    value,
                    companyIdCompany: aCompany.idCompany,
                    infoOfCompanyIdInfo: idInfo
                })
            }
        }

        console.log('success')

        res.json({ok: true})
    })
}