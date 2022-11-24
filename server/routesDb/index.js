const { core, core2core, typeOfField, theCore, coreTypeOfField, Op } = require('../db/scheme')
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
    app.post('/field', async (req, res) => {
        const { idEntity } = req.body

        const data = await theCore.findOne({
            where: {
                idTheCore: idEntity
            },
            include: {
                model: core
            },
        })

        res.json(data)
    })

    app.post('/fields', async (req, res) => {
        const { idCore } = req.body

        const data = await core.findOne({
            where: {
                idCore
            },
            include: {
                model: theCore,
                include: {
                    model: typeOfField
                }
            },
        })

        const heading = []

        if(data?.theCores.length) {
            data.theCores[0].typeOfFields.forEach(field => {
                heading.push({
                    name: field.name,
                    tag: field.tag,
                    showInColumnTable: field.showInColumnTable
                })
            })
            res.json({ok: true, fields: data, headers: heading})
        } else {
            res.json({ok: true, fields: data})
        }
    })

    app.post('/linkedFields', async (req, res) => {
        const { idTheCore } = req.body
        console.log(idTheCore)

        const item = await core2core.findOne({
            where: {
                parentCoreId: idTheCore
            }
        })

        const data = await theCore.findOne({
            where: {
                idTheCore: item.childCoreId
            },
            include: {
                model: typeOfField
            }
        })

        res.json({ok: true, fields: data})
    })

    app.get('/entities', async (req, res) => {
        const data = await core.findAll({
            where: {
                showInTable: true
            }
        })

        res.json({ok: true, entities: data})
    })

    app.post('/add-new-field', async (req, res) => {
        const { newFieldName } = req.body

        if (newFieldName != "") {
            const foundFields = await typeOfField.findAll({
                where: {    
                    name: newFieldName
                }
            })

            if(foundFields.length === 0) {
                await typeOfField.create({
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

    app.post('/add-new-entity', async (req, res) => {
        const { newFieldName, showInTable } = req.body

        if (newFieldName != "") {
            const foundFields = await core.findAll({
                where: {    
                    name: newFieldName
                }
            })

            if(foundFields.length === 0) {
                await core.create({
                    name: newFieldName,
                    showInTable
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
                await typeOfField.update({
                    name: field.name,
                    tag: cyrillicToTranslit.transform(field.name, '-').toLowerCase(),
                    showInColumnTable: field.showInColumnTable
                }, {
                    where: {
                        tag: field.tag
                    }
                })
            } else {
                res.json({ok: false, msg: "Поля не должны быть пустыми."})
                return
            }
        }
        res.json({ok: true})
    })

    app.put('/cores', async (req, res) => {
        const { fieldsOfComponiesData } = req.body

        let field
        for(let i = 0; i < fieldsOfComponiesData.length; i++) {
            field = fieldsOfComponiesData[i]

            if(field.name != "") {
                await core.update({
                    name: field.name,
                    showInTable: field.showInTable
                }, {
                    where: {
                        idCore: field.idCore
                    }
                })
            } else {
                res.json({ok: false, msg: "Поля не должны быть пустыми."})
                return
            }
        }
        res.json({ok: true})
    })

    app.delete('/fields', async (req, res) => {
        const { tag } = req.body

        await typeOfField.destroy({
            where: {
                tag
            }
        })

        res.json({ok: true})
    })

    app.post('/entityViaId', async (req, res) => {
        const { idEntity } = req.body

        const item = await theCore.findOne({
            where: {
                idTheCore: idEntity,
            },
            include: typeOfField
        })

        res.json({ok: true, item})
    })

    app.post('/linkedEntity', async (req, res) => {
        const { idTheCore } = req.body

        const item = await core2core.findOne({
            where: {
                parentCoreId: idTheCore
            }
        })

        const theCores = await theCore.findOne({
            where: {
                idTheCore: item.childCoreId,
            },
            include: core
        })

        res.json({ok: true, cores: theCores.cores})
    })

    app.post('/getHeadFieldsExcel', upload.single('xlxsFile'), async (req, res) => {
        const { file } = req
        const { uniqueSuffix } = req.body

        let fieldsValues = await typeOfField.findAll()

        const readFile = parser.parseXls2Json(req.originalSrc)
        readFile[0].forEach(field => {
            if(field['Сообщение:_дата'])
                field['Сообщение:_дата'] = ExcelDateToJSDate(field['Сообщение:_дата']).toLocaleDateString()
        })

        cache.push({
            id: uniqueSuffix,
            readFile 
        })

        res.json({ok: true, fieldsValues, uniqueSuffix, heading: Object.keys(readFile[0][0])})
    })

    app.get('/fieldsValues', async (req, res) => {
        const fieldsValues = await typeOfField.findAll()

        res.json({ok: true, fieldsValues})
    })

    app.get('/cores', async (req, res) => {
        const cores = await core.findAll()

        res.json({ok: true, cores})
    })

    app.delete('/cores', async (req, res) => {
        const { idCore } = req.body
        await core.destroy({
            where: { idCore }
        })

        res.json({ok: true})
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
        const { uniqueSuffix, file2field, relations, cond } = req.body

        const readFile = cache.find(c => c.id === uniqueSuffix).readFile[0]

        console.log('start upload..')

        let prepareRelations = []
        let newTheCore
        let wasOverlaped = false

        for(let i = 0; i < readFile.length; i++) {
            let item = readFile[i]
            prepareRelations[i] = []

            for(let g = 0; g < file2field.length; g++) {
                let f2f = file2field[g]

                let aCore = await core.findOne({
                    where: {
                        idCore: f2f.idCore
                    }
                })

                // Проверить наличие совпадений полей сущности и предпринять меры

                // for(let k = 0; k < f2f.fields.length; k++) {
                //     let field = f2f.fields[k]

                //     if(field.item.length) {
                //         let data = item[`${field.item[0].name}`]
                //         let baseField = await typeOfField.findOne({
                //             where: {
                //                 idTypeOfField: field.idTypeOfField
                //             }
                //         })

                //         const overlap = 
                //     }
                // }

                // if(wasOverlaped) {
                //     continue
                // }

                newTheCore = await theCore.create()

                await aCore.addTheCore(newTheCore)

                for(let k = 0; k < f2f.fields.length; k++) {
                    let field = f2f.fields[k]

                    if(field.item.length) {
                        let data = item[`${field.item[0].name}`]
                        let baseField = await typeOfField.findOne({
                            where: {
                                idTypeOfField: field.idTypeOfField
                            }
                        })
                        await newTheCore.addTypeOfField(baseField, { through: { value: data } })
                    }
                }

                prepareRelations[i].push({
                    idCore: f2f.idCore,
                    newTheCore,
                })
            }
        }

        let parent = false, 
            child = false

        console.log()
        console.log('start create realtions')

        for(let g = 0, t = 0, r = 0; ; ) {
            let pr = prepareRelations[t]
            let relation = relations[g]
        
            if(relation.parentCoreId === pr[r]?.idCore) {
                parent = pr[r]
                r++
                continue
            }
            if (relation.childCoreId === pr[r]?.idCore) {
                child = pr[r]

                await core2core.create({
                    parentCoreId: parent.newTheCore.idTheCore,
                    childCoreId: child.newTheCore.idTheCore,
                })

                parent = false
                child = false
                g = 0
                r++
                continue
            }
        
            g++
            r++
            if(g >= relations.length) {
                g = 0
            }
            if(r >= pr.length) {
                parent = false
                child = false
                t++
                r = 0
            }
            if(t >= prepareRelations.length) {
                break
            }
        }

        console.log()
        console.log('success')

        res.json({ok:true})
    })
}