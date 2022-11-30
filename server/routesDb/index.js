const { core, core2core, typeOfField, theCore, coreTypeOfField, Op } = require('../db/scheme')
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const parser = require('simple-excel-to-json')
const cyrillicToTranslit = new CyrillicToTranslit()
const json2xls = require('json2xls')
const fs = require('fs')
const path = require('path')

const cache = []

const actions = {
    skip: "skip",
    update: "update",
    supplement: "supplement"
}

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

        let theCores
        if(item) {
            theCores = await theCore.findOne({
                where: {
                    idTheCore: item.childCoreId,
                },
                include: core
            })

            res.json({ok: true, cores: theCores.cores})
        } else {
            res.json({ok: false})
        }
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

    app.get('/fieldsValuesExport', async (req, res) => {
        const cores = await core.findAll({
            include: {
                model: theCore,
                include: {
                    model: typeOfField
                }
            }
        })

        let fieldsValues = []

        for(let i = 0; i < cores.length; i++) {
            let core = cores[i]
            fieldsValues.push({
                idCore: core.idCore,
                fields: [],
            })

            for(let j = 0; j < core.theCores.length; j++) {
                let aTheCore = core.theCores[j]

                for(let k = 0; k < aTheCore.typeOfFields.length; k++) {
                    let field = aTheCore.typeOfFields[k]

                    fieldsValues[i].fields.push({
                        idTypeOfField: field.idTypeOfField,
                        name: field.name
                    })
                }
            }
        }

        let result = []
        let uniq = []

        for(let i = 0; i < fieldsValues.length; i++) {
            let fields = fieldsValues[i].fields
            uniq[i] = []
            result[i] = []

            for(let j = 0; j < fields.length; j++) {
                let field = fields[j]

                if(uniq[i].indexOf(field.idTypeOfField) === -1) {
                    uniq[i].push(field.idTypeOfField)
                }
            }
        }

        for(let i = 0; i < fieldsValues.length; i++) {
            let fields = fieldsValues[i].fields

            for(let j = 0; j < fields.length; j++) {
                let field = fields[j]

                for(let u = 0; u < uniq[i].length; u++) {
                    let index = uniq[i].indexOf(field.idTypeOfField)

                    if(index > -1) {
                        result[i].push(field)
                        uniq[i] = uniq[i].filter(elem => elem != field.idTypeOfField)
                        break
                    }
                }
            }
        }

        res.json({ok: true, fieldsValues: result})
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
        const { uniqueSuffix, file2field, relations } = req.body
        let prepareRelations = []
        let aCore
        let newTheCore

        const readFile = cache.find(c => c.id === uniqueSuffix).readFile[0]

        // res.json(readFile)

        console.log()
        console.log('start upload..')
        console.log()

        let wasOverlaped = []

        for(let i = 0; i < readFile.length; i++) {
            let fileItem = readFile[i]
            prepareRelations[i] = []
            wasOverlaped[i] = []

            // Проверка на совпадения
            for(let g = 0; g < file2field.length; g++) {
                let f2f = file2field[g]

                for(let j = 0; j < f2f.fields.length; j++) {
                    let field = f2f.fields[j]

                    if(field.item.length && f2f.uniqueField === field.idTypeOfField) {
                        let data = fileItem[`${field.item[0].name}`]
                        let baseField = await coreTypeOfField.findOne({
                            where: {
                                value: data,
                            },
                            include: {
                                model: typeOfField,
                                where: {
                                    idTypeOfField: f2f.uniqueField
                                }
                            }
                        })
                        // console.log({field, item: field.item, name: field.item[0].name, value: data})
                        // console.log({baseField: baseField?.toJSON()})
                        if(baseField) {
                            wasOverlaped[i].push(baseField.theCoreIdTheCore)
                        }
                    }
                }
            }
        }
        // res.send()
        // res.json(wasOverlaped)
        // return

        for(let i = 0; i < readFile.length; i++) {
            let fileItem = readFile[i]
            prepareRelations[i] = []

            if(wasOverlaped[i].length) {
                for(let w = 0; w < wasOverlaped[i].length; w++) {
                    let theCoreIdTheCore = wasOverlaped[i][w]
                    
                    for(let g = 0; g < file2field.length; g++) {
                        let f2f = file2field[g]
                    
                        for(let j = 0; j < f2f.fields.length; j++) {
                            let field = f2f.fields[j]

                            if(field.item.length) {
                                let data = fileItem[`${field.item[0].name}`]

                                if(f2f.action === actions.update) {
                                    await coreTypeOfField.update({
                                        value: data
                                    }, {
                                        where: {
                                            theCoreIdTheCore,
                                            typeOfFieldIdTypeOfField: field.idTypeOfField
                                        }
                                    })
                                    // console.log({theCoreIdTheCore,
                                    //     typeOfFieldIdTypeOfField: field.idTypeOfField,
                                    //     data})
                                }
                                if(f2f.action === actions.supplement) {
                                    if(f2f.supplementFields.indexOf(field.idTypeOfField) > -1) {
                                        let toSupplement = await coreTypeOfField.findOne({
                                            where: {
                                                theCoreIdTheCore,
                                                typeOfFieldIdTypeOfField: field.idTypeOfField
                                            }
                                        })
                                        if(toSupplement) {
                                            // res.json(toSupplement.toJSON())
                                            // return
                                            let value = toSupplement.value
                                            value += `\n${data}`
                                            await coreTypeOfField.update({
                                                value
                                            }, {
                                                where: {
                                                    theCoreIdTheCore,
                                                    typeOfFieldIdTypeOfField: field.idTypeOfField
                                                }
                                            })
                                        }
                                    }
                                }
                                if(f2f.action === actions.skip) {
                                    continue
                                }
                            }
                        }
                    }
                }
            } else {
                for(let g = 0; g < file2field.length; g++) {
                    let f2f = file2field[g]

                    // Проверка заполнены ли поля в file2field items
                    for(let j = 0; j < f2f.fields.length; j++) {
                        let field = f2f.fields[j]

                        if(field.item.length) {
                            aCore = await core.findOne({
                                where: {
                                    idCore: f2f.idCore
                                }
                            })
                            newTheCore = await theCore.create()
                            await aCore.addTheCore(newTheCore)
                            prepareRelations[i].push({
                                idCore: f2f.idCore,
                                newTheCore
                            })
                            break
                        }
                    }

                    // Если newTheCore было создано (тоесть были заполнены поля),
                    // тогда записываем данные по полям
                    if(newTheCore) {
                        for(let j = 0; j < f2f.fields.length; j++) {
                            let field = f2f.fields[j]

                            if(field.item.length) {
                                let data = fileItem[`${field.item[0].name}`]
                                let TOF = await typeOfField.findOne({
                                    where: {
                                        idTypeOfField: field.idTypeOfField
                                    }
                                })
                                await newTheCore.addTypeOfField(TOF, { through: { value: data } })
                            }
                        }

                        newTheCore = null
                    }
                }
            }
        }

        // Привязка сущностей в соответствии со схемой relations
        for(let i = 0; i < relations.length; i++) {
            let relation = relations[i]
            let parent = false
            let child = false

            for(let j = 0; j < prepareRelations.length; j++) {
                let pr = prepareRelations[j]

                if(pr.length) {
                    for(let h = 0; h < pr.length; h++) {
                        if(relation.parentCoreId === pr[h].idCore) {
                            parent = pr[h]
                            break
                        }
                    }
                    for(let h = 0; h < pr.length; h++) {
                        if(relation.childCoreId === pr[h].idCore) {
                            child = pr[h]
                            break
                        }
                    }

                    if(Object.keys(parent).length &&
                       Object.keys(child).length) 
                    {
                        await core2core.create({
                            parentCoreId: parent.newTheCore.idTheCore,
                            childCoreId: child.newTheCore.idTheCore,
                        })
                    }
                    parent = false
                    child = false
                }
            }
        }

        console.log()
        console.log('success')
        console.log()

        res.json({ok: true})
    })

    app.post('/exportToExcel', async (req, res) => {
        const { cores } = req.body

        let isSplited = true
        let cnt = 0
        cores.forEach(aCore => {
            cnt += aCore?.exportField?.length
        })
        if(cnt > 1) {
            isSplited = false
        }

        let fieldsAndValue = []
        let allData = {}

        for(let i = 0; i < cores.length; i++) {
            let aCore = cores[i]
            allData[`${aCore.name}`] = []

            for(let g = 0; g < aCore?.exportField?.length; g++) {
                let idExportField = aCore.exportField[g]

                let data = await coreTypeOfField.findAll({
                    where: {
                        typeOfFieldIdTypeOfField: idExportField,
                    },
                    include: [{
                        model: theCore,
                        include: {
                            model: core,
                            where: {
                                idCore: aCore.idCore
                            }
                        }
                    }, {
                        model: typeOfField
                    }],
                })

                allData[`${aCore.name}`].push(data)
            }
        }

        // res.json(allData)
        // return

        let rows = []
        
        for(let i = 0; i < Object.values(allData).length; i++) {
            let data = allData[Object.keys(allData)[i]]
            rows[i] = []

            for(let g = 0; g < data.length; g++) {
                let row = {}
                rows[i][g] = []

                for(let k = 0; k < data[g].length; k++) {
                    if(data[g][k]?.theCore) {
                        row = {}
                        row[`${Object.keys(allData)[i]}:${data[g][k].typeOfField.name}`] = []
                        row[`${Object.keys(allData)[i]}:${data[g][k].typeOfField.name}`] = data[g][k].value
                        rows[i][g].push(row)
                    }
                }
            }
        }

        // res.json(rows)
        // return

        let itteratorsData = 0
        let itteratorsCors = 0
        let iData = 0
        let FAVS = []
        rows = rows.filter(row => row.length)

        // res.json(rows[0][0][0]) // rows[сущность][поле][значение]
        // return

        while(true) {

            let FAV = {}
            let headElem = rows[itteratorsCors][itteratorsData][iData]
            // console.log({itteratorsCors, itteratorsData, iData})

            // res.json(headElem)
            // return

            FAV[`${Object.keys(headElem)[0]}`] = Object.values(headElem)[0]
            FAVS.push(FAV)

            iData++
            if(iData >= rows[0][0].length) {
                iData = 0
                itteratorsData++

                if(itteratorsData >= rows[itteratorsCors]?.length) {
                    itteratorsCors++
                    itteratorsData = 0

                    if(itteratorsCors >= rows.length) {
                        // res.json(FAVS)
                        // return
                        if(isSplited) {
                            FAVS.forEach(fav => {
                                let t = {}
                                let s = Object.values(fav)[0].split('\r\n')

                                s.forEach(elem => {
                                    if(elem) {
                                        t[`${Object.keys(fav)[0]}`] = elem
                                        fieldsAndValue.push(t)
                                    }
                                })
                            })
                        } else {
                            FAVS.forEach(fav => {
                                let t = {}

                                t[`${Object.keys(fav)[0]}`] = Object.values(fav)[0]
                                fieldsAndValue.push(t)
                            })
                        }

                        break
                    }
                }
            }
        }

        let result = []

        let itterators = Array(Math.floor(fieldsAndValue.length / rows[0][0].length)).fill(0)

        for(let i = 0; i < itterators.length; i++) {
            itterators[i] += i * rows[0][0].length
        }

        let iterat = 0
        let t = {}

        while(true) {

            let i = itterators[iterat]

            let elem = fieldsAndValue[i]
            t[`${Object.keys(elem)[0]}`] = Object.values(elem)[0]

            iterat++
            if(iterat >= itterators.length) {
                iterat = 0
                for(let h = 0; h < itterators.length; h++) {
                    itterators[h]++
                }

                result.push(t)
                t = {}
            }
            if(itterators[itterators.length - 1] >= fieldsAndValue.length) break
        }

        res.xls('data.xlsx', result)
        // res.json(result)
    })

    app.post('/test', async (req, res) => {
        var jsonArr = [{
            "foo:foo": 'bar',
            "qux:foo": 'moo',
            "poo:foo": 123,
            "stux:foo": new Date()
        },
        {
            "foo:foo": 'bar',
            "qux:foo": 'moo',
            "poo:foo": 345,
            "stux:foo": new Date()
        }];

        res.xls('data.xlsx', jsonArr)
    })
}