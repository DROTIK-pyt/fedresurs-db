const { Scheme, Op } = require('../db/scheme')
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const parser = require('simple-excel-to-json')
const cyrillicToTranslit = new CyrillicToTranslit()
const json2xls = require('json2xls')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const path = require('node:path')

const cache = []

const sessions = []

let currentSuffix = ""
let lengthDocument = 0
let wrote2base = 0

const actions = require("../config/importActions.json")
const classesFields = require("../config/fieldsClass.json")

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

 var rounded = function(number){
    return +number.toFixed(4);
}

module.exports = function(app, upload, jwt) {
    app.get('/percentUploaded', async (req, res) => {
        res.json({ ok: true, perCent: rounded(wrote2base/lengthDocument)*100, lengthDocument, wrote2base })
    })

    app.post('/field', async (req, res) => {
        const { idEntity } = req.body

        const data = await Scheme.theCore.findOne({
            where: {
                idTheCore: idEntity
            },
            include: {
                model: Scheme.core
            },
        })

        res.json(data)
    })

    app.post('/fields', async (req, res) => {
        const { page, idCore, max } = req.body
        let limit = 400
        let offset = limit * page - limit

        if(max < 0) {
            res.json({ok: false, fields: {}})
            return
        }

        console.log({offset, page})
        if (offset >= max) {
            res.json({ok: false, fields: {}})
            return
        }

        const data = await Scheme.core.findOne({
            where: {
                idCore
            },
        })

        const theCores = await data.getTheCores({
            limit,
            offset,
            include: [{
                model: Scheme.typeOfField,
            }]
        })

        if(theCores.length) {
            res.json({ok: true, fields: {theCores}})
            return
        }
        res.json({ok: false, fields: {}})
        return
    })

    app.get('/getIdsCore', async (req, res) => {
        const cores = await Scheme.core.findAll({
            attributes: ['idCore']
        })

        res.json(cores)
    })

    app.post('/allHeaders', async (req, res) => {
        const { idCore } = req.body

        const data = await Scheme.core.findOne({
            where: {
                idCore
            },
        })

        const theCores = await data.getTheCores({
            limit: 1,
            include: [{
                model: Scheme.typeOfField,
            }]
        })

        const heading = []

        if(theCores.length) {
            theCores[0].typeOfFields.forEach(field => {
                heading.push({
                    name: field.name,
                    tag: field.tag,
                    showInColumnTable: field.showInColumnTable
                })
            })
            res.json({ok: true, headers: heading})
            return
        } else {
            res.json({ok: false})
            return
        }
    })

    app.post('/linkedFields', async (req, res) => {
        const { idTheCore } = req.body

        const item = await Scheme.core2core.findOne({
            where: {
                parentCoreId: idTheCore
            }
        })

        const data = await Scheme.theCore.findOne({
            where: {
                idTheCore: item.childCoreId
            },
            include: {
                model: Scheme.typeOfField
            }
        })

        res.json({ok: true, fields: data})
    })

    app.get('/entities', async (req, res) => {
        let data = []
                
        data = await Scheme.core.findAll({
            where: {
                showInTable: true
            }
        })

        res.json({ok: true, entities: data})
    })

    app.post('/add-new-field', async (req, res) => {
        const { newFieldName, class2field, cores2type } = req.body

        if (newFieldName != "") {
            const foundFields = await Scheme.typeOfField.findAll({
                where: {    
                    name: newFieldName
                }
            })

            if(foundFields.length === 0) {
                const TOF = await Scheme.typeOfField.create({
                    name: newFieldName,
                    tag: cyrillicToTranslit.transform(newFieldName, '-').toLowerCase()
                })
                const c2f = await Scheme.classOfField.findOne({
                    where: {
                        type: class2field
                    }
                })
                const aCores = await Scheme.core.findAll({
                    where: {
                        idCore: {
                            [Op.in]: cores2type
                        }
                    }
                })
                if(aCores) {
                    for(let c = 0; c < aCores.length; c++) {
                        let aCore = aCores[c]

                        TOF.addCore(aCore)
                    }
                }

                if(c2f) c2f.addTypeOfField(TOF)
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
            const foundFields = await Scheme.core.findAll({
                where: {    
                    name: newFieldName
                }
            })

            if(foundFields.length === 0) {
                await Scheme.core.create({
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
                await Scheme.typeOfField.update({
                    name: field.name,
                    tag: cyrillicToTranslit.transform(field.name, '-').toLowerCase(),
                    showInColumnTable: field.showInColumnTable,
                    showInFilter: field.showInFilter
                }, {
                    where: {
                        tag: field.tag
                    }
                })

                const TOF = await Scheme.typeOfField.findOne({
                    where: {
                        tag: cyrillicToTranslit.transform(field.name, '-').toLowerCase()
                    },
                    include: {
                        model: Scheme.core
                    }
                })
                const c2f = await Scheme.classOfField.findOne({
                    where: {
                        type: field.classOfField
                    },
                })

                const aCores = await Scheme.core.findAll({
                    where: {
                        idCore: {
                            [Op.in]: field.cores
                        }
                    }
                })

                console.log({cores: field.cores})

                await TOF.setCores(null)

                for(let c = 0; c < aCores.length; c++) {
                    let aCore = aCores[c]

                    TOF.addCore(aCore)
                }

                if(c2f) {
                    await c2f.addTypeOfField(TOF)
                }
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
                await Scheme.core.update({
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

        await Scheme.typeOfField.destroy({
            where: {
                tag
            }
        })

        res.json({ok: true})
    })

    app.post('/entityViaId', async (req, res) => {
        const { idEntity } = req.body

        const item = await Scheme.theCore.findOne({
            where: {
                idTheCore: idEntity,
            },
            include: Scheme.typeOfField
        })

        res.json({ok: true, item})
    })

    app.post('/linkedEntity', async (req, res) => {
        const { idTheCore } = req.body

        const item = await Scheme.core2core.findOne({
            where: {
                parentCoreId: idTheCore
            }
        })

        let theCores
        if(item) {
            theCores = await Scheme.theCore.findOne({
                where: {
                    idTheCore: item.childCoreId,
                },
                include: Scheme.core
            })

            res.json({ok: true, cores: theCores.cores})
        } else {
            res.json({ok: false})
        }
    })

    app.post('/getHeadFieldsExcel', upload.single('xlxsFile'), async (req, res) => {
        const { file } = req
        const { uniqueSuffix } = req.body

        let fieldsValues = await Scheme.typeOfField.findAll()

        console.log("Начата конвертация xls 2 json.")
        const readFile = parser.parseXls2Json(req.originalSrc)
        console.log("конвертация завершена.")
        console.log("")

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
        const fieldsValues = await Scheme.typeOfField.findAll({
            include: [Scheme.classOfField, Scheme.core]
        })

        // res.json(fieldsValues)
        // return

        const cores = await Scheme.core.findAll()

        const class2fields = await Scheme.classOfField.findAll()

        res.json({ok: true, fieldsValues, class2fields, cores})
    })

    app.get('/fieldsValuesExport', async (req, res) => {
        const cores = await Scheme.core.findAll()

        let fieldsValues = []

        for(let i = 0; i < cores.length; i++) {
            let core = cores[i]
            const fields = await core.getTypeOfFields()

            fieldsValues.push({
                idCore: core.idCore,
                name: core.name,
                allFields: fields
            })
        }

        res.json({ok: true, fieldsValues})
    })

    app.post('/fieldsExportGetCount', async (req, res) => {
        const { idCore } = req.body

        const aCore = await Scheme.core.findOne({
            where: {
                idCore
            }
        })

        if(aCore) {
            const max = await aCore.countTheCores()
            res.json(max)
            return
        }
        res.json(-1)
    })

    app.post('/fieldsExport', async (req, res) => {
        const { page, idCore, max } = req.body
        let limit = 1000
        let offset = limit * page - limit
        let isOfssetAboveMax = false

        console.log({ page, idCore, max })

        if(max < 0) {
            res.json({items: []})
            return
        }

        if(offset >= max) {
            res.json({items: []})
            return
        }

        const aCore = await Scheme.core.findOne({
            where: {
                idCore
            }
        })

        if(aCore) {
            const theCores = await aCore.getTheCores({
                limit,
                offset,
                include: [{
                    model: Scheme.typeOfField,
                }]
            })

            res.json({ 
                name: aCore.name,
                idCore: aCore.idCore,
                items: theCores,
                isOfssetAboveMax
            })
            return
        }

        res.json({items: []})
    })

    app.post('/fieldsCount', async (req, res) => {
        const { idCore } = req.body

        const aCore = await Scheme.core.findOne({
            where: {
                idCore
            }
        })

        if(aCore) {
            const max = await aCore.countTheCores()
            res.json(max)
            return
        }
        res.json(-1)
    })

    app.get('/cores', async (req, res) => {
        const cores = await Scheme.core.findAll()

        res.json({ok: true, cores})
    })

    app.delete('/cores', async (req, res) => {
        const { idCore } = req.body
        await Scheme.core.destroy({
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

        // res.json(file2field)
        // return

        const readFile = cache.find(c => c.id === uniqueSuffix).readFile[0]
        currentSuffix = uniqueSuffix
        lengthDocument = readFile.length - 1

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

                let baseField = []
                if(f2f?.uniqueField) {
                    baseField = await Scheme.coreTypeOfField.findAll({
                        include: {
                            model: Scheme.typeOfField,
                            where: {
                                idTypeOfField: f2f.uniqueField
                            },
                            include: {
                                model: Scheme.classOfField
                            }
                        }
                    })
                }

                // res.json(baseField)
                // return

                for(let j = 0; j < f2f.fields.length; j++) {
                    let field = f2f.fields[j]

                    if(field.item.length && f2f.uniqueField === field.idTypeOfField) {
                        let data = fileItem[`${field.item[0].name}`]

                        let isFound = baseField.find(f => f.value === data)
                        
                        if(isFound) {
                            // res.json(isFound)
                            // return
                            wasOverlaped[i].push(isFound.theCoreIdTheCore)
                        }
                    }
                }
            }
        }
        // res.send()
        // res.json(wasOverlaped)
        // return

        for(let i = 0; i < readFile.length; i++) {
            wrote2base = i

            let fileItem = readFile[i]
            prepareRelations[i] = []
            // res.json(wasOverlaped)
            // return

            if(wasOverlaped[i].length) {
                for(let w = 0; w < wasOverlaped[i].length; w++) {
                    let theCoreIdTheCore = wasOverlaped[i][w]
                    let filledFields = []

                    const aTheCore = await Scheme.theCore.findOne({
                        where: {
                            idTheCore: theCoreIdTheCore
                        },
                        include: [
                            {
                                model: Scheme.typeOfField
                            },
                            {
                                model: Scheme.core
                            }
                        ]
                    })
                    aTheCore.typeOfFields.forEach(TOF => filledFields.push(TOF.tag))
                    
                    for(let g = 0; g < file2field.length; g++) {
                        let f2f = file2field[g]
                    
                        for(let j = 0; j < f2f.fields.length && f2f.name === aTheCore.cores[0].name; j++) {
                            let field = f2f.fields[j]

                            if(field.item.length) {
                                let data = fileItem[`${field.item[0].name}`]

                                // res.json(aTheCore.typeOfFields)
                                // return

                                if(f2f.action === actions.update) {
                                    if(filledFields.indexOf(field.tag) > -1) {
                                        await Scheme.coreTypeOfField.update({
                                            value: data
                                        }, {
                                            where: {
                                                theCoreIdTheCore,
                                                typeOfFieldIdTypeOfField: field.idTypeOfField
                                            }
                                        })
                                    } else {
                                        let TOF = await Scheme.typeOfField.findOne({
                                            where: {
                                                idTypeOfField: field.idTypeOfField
                                            }
                                        })
                                        await aTheCore.addTypeOfField(TOF, { through: { value: data } })
                                    }
                                    // console.log({theCoreIdTheCore,
                                    //     typeOfFieldIdTypeOfField: field.idTypeOfField,
                                    //     data})
                                }
                                if(f2f.action === actions.supplement && f2f?.supplementFields) {
                                    if(f2f.supplementFields.indexOf(field.idTypeOfField) > -1) {
                                        let toSupplement = await Scheme.coreTypeOfField.findOne({
                                            where: {
                                                theCoreIdTheCore,
                                                typeOfFieldIdTypeOfField: field.idTypeOfField
                                            },
                                            include: {
                                                model: Scheme.typeOfField,
                                                include: {
                                                    model: Scheme.classOfField
                                                }
                                            }
                                        })
                                        if(toSupplement) {
                                            let { type } = toSupplement.typeOfField.classOfField
                                            let datas = toSupplement.value.split('\r\n') // Данные которые уже есть в базе
                                            let values = false // Входные данные из файла

                                            if(data) {
                                                values = data.split('\r\n')
                                            }

                                            switch(type) {
                                                case classesFields.phoneNumber:
                                                    if(values) {
                                                        let toCompareDatas = []
                                                        let toCompareValues = []
                                                        let notAllowedSymbols = "+()- ".split("")

                                                        datas.forEach(d => {
                                                            notAllowedSymbols.forEach(na => {
                                                                d = d.replaceAll(na, "")
                                                            })

                                                            if(d[0] === "7" || d[0] === "8") d = d.slice(1)
                                                            toCompareDatas.push(d)
                                                        })

                                                        values.forEach(d => {
                                                            notAllowedSymbols.forEach(na => {
                                                                d = d.replaceAll(na, "")
                                                            })

                                                            if(d[0] === "7" || d[0] === "8") d = d.slice(1)
                                                            toCompareValues.push(d)
                                                        })
                                                        toCompareDatas = toCompareDatas.filter(d => d != "")
                                                        toCompareValues = toCompareValues.filter(d => d != "")
                                                        
                                                        toCompareDatas = [...new Set([...toCompareDatas, ...toCompareValues])]

                                                        let result = []
                                                        values.forEach((d, index) => {
                                                            notAllowedSymbols.forEach(na => {
                                                                d = d.replaceAll(na, "")
                                                            })

                                                            if(d[0] === "7" || d[0] === "8") d = d.slice(1)
                                                            if(toCompareDatas.indexOf(d) > -1) result.push(values[index])
                                                        })

                                                        let value = result.join('\n')
                                                        toSupplement.value = value
                                                        await toSupplement.save()
                                                    }
                                                break
                                                case classesFields.universal:
                                                    datas = [...new Set([...datas, ...values])]

                                                    let value = datas.join('\n')

                                                    toSupplement.value = value
                                                    await toSupplement.save()
                                                break
                                            }
                                        }
                                    }
                                }
                                if(f2f.action === actions.skip) {
                                    continue
                                }
                            }
                        }
                    }
                    // res.json(aTheCore.cores[0])
                    // return
                    // if(aTheCore.cores[0].idCore === 1) {
                    //     res.json({filledFields, uploadedFields})
                    //     return
                    // }
                }
            } else {
                for(let g = 0; g < file2field.length; g++) {
                    let f2f = file2field[g]

                    // Проверка заполнены ли поля в file2field items
                    for(let j = 0; j < f2f.fields.length; j++) {
                        let field = f2f.fields[j]

                        if(field.item.length) {
                            aCore = await Scheme.core.findOne({
                                where: {
                                    idCore: f2f.idCore
                                }
                            })
                            newTheCore = await Scheme.theCore.create()
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
                                let TOF = await Scheme.typeOfField.findOne({
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
                        await Scheme.core2core.create({
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

        lengthDocument = 0
        wrote2base = 0
        currentSuffix = ""

        res.json({ok: true})
    })

    app.post('/exportToExcel', async (req, res) => {
        const { cores, filters } = req.body
        const filterKeyCores = Object.keys(filters).map(f => +f) || []
        const filterIdTheCoreValues = Object.values(filters) || []

        for(let filterCurrentIndex = 0; filterCurrentIndex < filterIdTheCoreValues.length; filterCurrentIndex++) {
            if(!filterIdTheCoreValues[filterCurrentIndex].length) {
                filterIdTheCoreValues.splice(filterCurrentIndex, 1)
                filterKeyCores.splice(filterCurrentIndex, 1)
            }
        }
        
        // res.json({filterKeyCores, filterIdTheCoreValues})
        // return

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

                let index = filterKeyCores.indexOf(aCore.idCore)

                // res.json(filterIdTheCoreValues[index])
                // return

                let data
                if(index > -1) {
                    data = await Scheme.coreTypeOfField.findAll({
                        where: {
                            typeOfFieldIdTypeOfField: idExportField,
                        },
                        include: [{
                            model: Scheme.theCore,
                            where: {
                                idTheCore: {
                                    [Op.in]: filterIdTheCoreValues[index]
                                }
                            },
                            include: {
                                model: Scheme.core,
                                where: {
                                    idCore: aCore.idCore
                                }
                            }
                        }, {
                            model: Scheme.typeOfField,
                        }],
                    })
                } else {
                    data = await Scheme.coreTypeOfField.findAll({
                        where: {
                            typeOfFieldIdTypeOfField: idExportField,
                        },
                        include: [{
                            model: Scheme.theCore,
                            include: {
                                model: Scheme.core,
                                where: {
                                    idCore: aCore.idCore
                                }
                            }
                        }, {
                            model: Scheme.typeOfField,
                        }],
                    })
                }

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

        // res.json(rows)
        // return

        // res.json(rows[0][0][0]) // rows[сущность][поле][значение]
        // return

        while(true) {

            let FAV = {}
            let headElem = rows[itteratorsCors][itteratorsData][iData]
            // console.log({itteratorsCors, itteratorsData, iData})

            try {
                FAV[`${Object.keys(headElem)[0]}`] = Object.values(headElem)[0]
                FAVS.push(FAV)
            } catch {
                // res.json(headElem)
                // return
            }

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
                                let s = Object.values(fav)[0].split('\n')

                                s.forEach(elem => {
                                    let t = {}
                                    if(elem) {
                                        t[`${Object.keys(fav)[0]}`] = elem
                                        fieldsAndValue.push(t)
                                    }
                                })
                            })
                        } else {
                            FAVS.forEach(fav => {
                                let t = {}
                                t[`${Object.keys(fav)[0]}`] = Object.values(fav)[0].replaceAll('\n', '\r')
                                // if(Object.keys(fav)[0] === "Контакты:Телефон" && Object.values(fav)[0].length > 20) {
                                //     res.json(t)
                                //     return
                                // }
                                fieldsAndValue.push(t)
                            })
                        }

                        break
                    }
                }
            }
        }
        // res.json(FAVS)
        // return

        let result = []

        // console.log(fieldsAndValue.length, rows[0][0].length)
        // console.log(fieldsAndValue.length / rows[0][0].length)
        // console.log(Math.round(fieldsAndValue.length / rows[0][0].length))
        let itterators = Array(Math.round(fieldsAndValue.length / rows[0][0].length)).fill(0)

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

        if(isSplited) {
            let key = Object.keys(result[0])[0]
            let set = []

            result.forEach(r => {
                set.push(Object.values(r)[0])
            })

            set = [...new Set(set)]
            result = []

            set.forEach(s => {
                let t = {}
                t[`${key}`] = s
                result.push(t)
            })
        }

        res.xls('data.xlsx', result)
        // res.json(result)
    })

    app.get('/testServer', async (req, res) => {
        res.json({ok: true, msg: "Server is running."})
    })

    app.get('/testReq', async (req, res) => {

        // const array = [];
        //     while (true) {
        //     // увеличение массива на каждой итерации
        //     array.push(new Array(10000000));

        //     const memory = process.memoryUsage();
        //     console.log((memory.heapUsed / 1024 / 1024 / 1024).toFixed(4), 'GB');
        // }
        let max = 0
        setInterval(async () => {
            await Scheme.coreTypeOfField.findAll({
                limit: 100000
            })

            const memory = process.memoryUsage()
            if(memory.heapUsed > max) {
                max = memory.heapUsed
            }
            console.log(`Max heap used: ${(max / 1024 / 1024).toFixed(4)}`, 'Mb')

        }, 2000)

        // res.json(data)
    })
}