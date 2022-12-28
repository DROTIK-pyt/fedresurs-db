<template>
    <v-row align="baseline">
        <v-col
        cols="12"
        sm="10"
        >
            <v-row align="baseline">
                <v-col
                cols="12"
                sm="5"
                >
                    <v-file-input
                        v-model="files"
                        color="deep-purple accent-4"
                        counter
                        label="Выберите файл Excel"
                        multiple
                        placeholder="Импорт"
                        prepend-icon="mdi-paperclip"
                        outlined
                        :show-size="1000"
                        :accept="accepts.join(', ')"
                    >
                        <template v-slot:selection="{ index, text }">
                        <v-chip
                            v-if="index < 2"
                            color="deep-purple accent-4"
                            dark
                            label
                            small
                        >
                            {{ text }}
                        </v-chip>

                        <span
                            v-else-if="index === 2"
                            class="text-overline grey--text text--darken-3 mx-2"
                        >
                            +{{ files.length - 2 }} File(s)
                        </span>
                        </template>
                    </v-file-input>
                </v-col>
                <v-col
                cols="12"
                sm="4"
                >
                    <v-btn
                        depressed
                        color="primary"
                        @click="uploadToBase"
                        :loading="loading2base"
                    >
                        Загрузить в базу
                    </v-btn>
                    <span>
                        Загружено: {{ perCentUploaded }}
                    </span>
                    <v-spacer></v-spacer>
                </v-col>
            </v-row>
        </v-col>
        <v-col
        cols="12"
        sm="2"
        >
        <v-btn
            depressed
            color="error"
            @click="clearCache"
        >
            Сброс кеша
        </v-btn>
        </v-col>
        <v-col
        cols="12"
        sm="3"
        class=""
        >
        <div class="preloader" v-if="loadingData">
            <h3 class="mb-3">Заголовки</h3>
            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
        <div v-else class="main-headings">
        <h3 class="mb-3">Заголовки</h3>
            <draggable
                class="list-group pr-2"
                tag="ul"
                v-model="list"
                v-bind="dragOptions"
                @start="drag = true"
                @end="drag = false"
            >
                <transition-group type="transition" :name="!drag ? 'flip-list' : null">
                <li
                    class="list-group-item"
                    v-for="element in list"
                    :key="element.name"
                >
                    <i
                    :class="
                        element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
                    "
                    @click="element.fixed = !element.fixed"
                    aria-hidden="true"
                    ></i>
                    {{ element.name }}
                </li>
                </transition-group>
            </draggable>
        </div>
        </v-col>
        <v-col
            cols="12"
            sm="9"
        >
        <v-row class="overflowed">
            <v-col
            cols="12"
            sm="12"
            >
            <v-tabs
                v-model="tabs"
                centered
            >
                <v-tab>
                    Данные
                </v-tab>
                <v-tab>
                    Связи
                </v-tab>
            </v-tabs>
            </v-col>
            <v-col
            cols="12"
            sm="12"
            >
                <v-tabs-items v-model="tabs">
                    <v-tab-item>
                        <v-col
                        cols="12"
                        sm="12"
                        v-for="(core, index) in fieldsSystem"
                        :key="core?.idCore"
                        class="bordered"
                        >
                            <h2 class="mb-3 bordered-black px-2" v-if="core?.idCore">{{ core.name }}</h2>
                            <v-row v-if="core?.idCore">
                                <v-col
                                    cols="12"
                                    sm="3"
                                    v-for="field in core.fields"
                                    :key="field.tag"
                                >
                                <h4 class="mb-1 bordered px-1">{{ field.name }} -> <small>{{ field.type }}</small></h4>
                                <draggable
                                    class="list-group bordered pa-3"
                                    tag="ul"
                                    v-model="field.item"
                                    v-bind="dragOptions"
                                    @start="drag = true"
                                    @end="drag = false"
                                >
                                    <transition-group type="transition" :name="!drag ? 'flip-list' : null">
                                    <li
                                        class="list-group-item"
                                        v-for="element in field.item"
                                        :key="element.tag+core.name"
                                    >
                                        <i
                                        :class="
                                            element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
                                        "
                                        aria-hidden="true"
                                        ></i>
                                        {{ element.name }}
                                    </li>
                                    </transition-group>
                                </draggable>
                                </v-col>
                                <v-col
                                    cols="12"
                                    sm="3"
                                >
                                    <h4 class="mb-1 bordered px-1">Уникальное поле</h4>
                                    <v-select
                                    :items="uniqueFields[index]"
                                    label="поле.."
                                    outlined
                                    item-value="idTypeOfField"
                                    item-text="name"
                                    v-model="core.uniqueField"
                                    ></v-select>
                                </v-col>
                                <v-col
                                    cols="12"
                                    sm="3"
                                >
                                    <h4 class="mb-1 bordered px-1">Действие</h4>
                                    <v-select
                                    :items="whatDoWeDo"
                                    label="Действие"
                                    outlined
                                    item-value="action"
                                    item-text="text"
                                    v-model="core.action"
                                    ></v-select>
                                </v-col>
                                <v-col
                                    cols="12"
                                    sm="3"
                                    v-if="core.action === `supplement`"
                                >
                                    <h4 class="mb-1 bordered px-1">Что дополнить</h4>
                                    <v-select
                                    :items="uniqueFields"
                                    label="Поля.."
                                    outlined
                                    item-value="idTypeOfField"
                                    item-text="name"
                                    multiple
                                    v-model="core.supplementFields"
                                    ></v-select>
                                </v-col>
                            </v-row>
                        </v-col>
                    </v-tab-item>
                    <v-tab-item>
                        <v-col
                        cols="12"
                        sm="12"
                        class="bordered"
                        >
                            <v-btn
                                depressed
                                color="primary"
                                @click="addRelation"
                                class="mb-5"
                            >
                                Добавить связь
                            </v-btn>
                            <div class="d-flex justify-space-between" v-for="relation, index in relations" :key="index">
                                <v-autocomplete
                                    clearable
                                    item-text="name"
                                    item-value="idCore"
                                    v-model="relation.parentCoreId"
                                    label="Сущность"
                                    :items="cores"
                                    class="mr-3"
                                    filled
                                ></v-autocomplete>
                                <v-icon
                                    x-large
                                >
                                    mdi-redo
                                </v-icon>
                                <v-autocomplete
                                    clearable
                                    item-text="name"
                                    item-value="idCore"
                                    v-model="relation.childCoreId"
                                    label="Сущность"
                                    :items="cores"
                                    class="ml-3"
                                    filled
                                ></v-autocomplete>
                                <v-btn
                                    depressed
                                    color="error"
                                    @click="deleteRelation(index)"
                                    class="ml-3"
                                >
                                    Удалить
                                </v-btn>
                            </div>
                        </v-col>
                    </v-tab-item>
                </v-tabs-items>
            </v-col>
        </v-row>
        </v-col>
        <errorMsgVue
            :isShowMsg="isShowError"
            :msgText="errorMsg"
            @closeErrorMsg="isShowError = false; errorMsg = ''"
        ></errorMsgVue>
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')
const { v4: uuidv4 } = require('uuid')

import draggable from 'vuedraggable'
import errorMsgVue from '../components/errorMsg.vue'

export default {
    name: "PageUploads",
    data: () => ({
        accepts: [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "application/vnd.ms-excel.addin.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
        ],
        files: [],
        list: [],
        fieldsSystem: [],
        drag: false,
        loadingData: false,
        loading2base: false,

        isShowError: false,
        errorMsg: "",

        perCentUploaded: "",

        // Подготовить вывод действий на случай совпадения полей сущности
        whatDoWeDo: [
            {
                text: "Обновить / Загрузить",
                action: "update"
            },
            {
                text: "Пропустить",
                action: "skip"
            },
            {
                text: "Дополнить",
                action: "supplement"
            },
        ],
        uniqueFields: {},

        tabs: null,

        cores: [],
        relations: [],
    }),
    methods: {
        async perCentUploadedData() {
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/percentUploaded`)
            const result = await data.json()

            if(result.ok) {
                this.perCentUploaded = `${result.perCent}%`
            }
        },
        async checkTokens() {
            let accessToken = localStorage.getItem("accessToken")
            let sessionId = localStorage.getItem("sessionId")

            if(accessToken && sessionId) {
                const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/checkTokens`, {
                    method: "POST",
                    headers: {
                        // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                        accessToken,
                        sessionId
                    })
                })

                const result = await data.json()

                if(!result.ok) {
                    let refreshToken = localStorage.getItem("refreshToken")

                    if(refreshToken) {
                        const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/refresh`, {
                            method: "POST",
                            headers: {
                                // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                                'Content-Type': 'application/json;charset=utf-8'
                            },
                            body: JSON.stringify({
                                refreshToken,
                                sessionId
                            })
                        })

                        const result = await data.json()
                        if(result.ok) {
                            localStorage.setItem("accessToken", result.accessToken)
                            localStorage.setItem("refreshToken", result.refreshToken)
                        } else {
                            this.$router.push("/")
                            return false
                        }
                    } else {
                        this.$router.push("/")
                        return false
                    }
                }
            } else {
                this.$router.push("/")
                return false
            }
        },
        addRelation() {
            this.checkTokens()
            
            this.relations.push({
                parentCoreId: 0,
                childCoreId: 0
            })
        },
        deleteRelation(index) {
            this.checkTokens()

            this.relations.splice(index, 1)
        },
        async clearCache() {
            this.checkTokens()

            await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/clearCache`, {
                method: "DELETE",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    uniqueSuffix: localStorage.getItem('uniqueSuffix')
                })
            })

            this.getFieldsSystem()

            this.list = []
            this.files = []
        },
        async getFieldsSystem() {
            this.checkTokens()

            const listItems = JSON.parse(localStorage.getItem('list'))
            const fieldsSystem = JSON.parse(localStorage.getItem('fieldsSystem'))

            if(listItems)
                this.list = listItems

            if(fieldsSystem)
                this.fieldsSystem = fieldsSystem

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValues`)
            const result = await data.json()

            const data2 = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const resultCores = await data2.json()

            resultCores.cores.forEach(core => {
                this.cores.push({
                    idCore: core.idCore,
                    name: core.name
                })
            })

            if(result.ok) {
                this.fieldsSystem = []
                resultCores.cores.forEach((core, index) => {
                    this.fieldsSystem.push({
                        idCore: core.idCore,
                        name: core.name,
                        fields: [],
                        action: "update"
                    })
                    this.uniqueFields[index] = []

                    result.fieldsValues.forEach(field => {
                        let types = []
                        field.cores.forEach(c => types.push(c.idCore))

                        if(types.indexOf(this.fieldsSystem[index].idCore) > -1) {
                            this.fieldsSystem[index].fields.push({
                                item: [],
                                name: field.name,
                                tag: field.tag,
                                idTypeOfField: field.idTypeOfField,
                                type: field.classOfField.name,
                                core2type: types,
                            })

                            this.uniqueFields[index].push({
                                name: field.name,
                                idTypeOfField: field.idTypeOfField
                            })
                        }
                    })
                })
            }

            // this.fieldsSystem.forEach(uf => {
            //     uf.fields.forEach(field => {
            //         this.uniqueFields.push({
            //             name: field.name,
            //             idTypeOfField: field.idTypeOfField
            //         })
            //     })
            // })
        },
        async uploadToBase() {
            this.checkTokens()

            const checkPerCentIntervalId = setInterval(async () => {
                this.perCentUploadedData()
            }, 500)

            this.loading2base = true

            if(!localStorage.getItem('uniqueSuffix')) {
                this.loading2base = false
                
                this.isShowError = true
                this.errorMsg = "Данные не были загружены. Очистите кеш, загрузите файл и повторите попытку."
                clearInterval(checkPerCentIntervalId)

                return
            }

            fetch(`${serverSetting.baseUrl}:${serverSetting.port}/uploadToBase`, {
                method: "POST",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    uniqueSuffix: localStorage.getItem('uniqueSuffix'),
                    file2field: this.fieldsSystem,
                    relations: this.relations,
                    cond: this.cond
                })
            })
            .then(data => data.json())
            .then(result => {
                if(!result.ok) {
                    this.isShowError = true
                    this.errorMsg = "Данные не были загружены. Очистите кеш, загрузите файл и повторите попытку."
                }
                this.loading2base = false

                clearInterval(checkPerCentIntervalId)
            })
        },
    },
    components: {draggable, errorMsgVue},
    computed: {
        dragOptions() {
            return {
                animation: 200,
                group: "description",
                disabled: false,
                ghostClass: "ghost"
            };
        }
    },
    watch: {
        async files() {
            this.checkTokens()

            if(this.files.length) {
                this.loadingData = true

                let formData = new FormData()
                const uniqueSuffix = uuidv4()

                formData.append('uniqueSuffix', uniqueSuffix)
                formData.append('xlxsFile', this.files[0], this.files[0].name)

                const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/getHeadFieldsExcel`, {
                    method: "POST",
                    headers: {
                        // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                        // 'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: formData
                })

                const result = await data.json()
                
                result.heading.forEach(head => {
                    this.list.push({
                        name: head
                    })
                })

                localStorage.setItem('list', JSON.stringify(this.list))
                localStorage.setItem('fieldsSystem', JSON.stringify(this.fieldsSystem))
                localStorage.setItem('uniqueSuffix', uniqueSuffix)

                this.loadingData = false

                // console.log(this.list)
            } else {
                this.list = []
                this.fieldsSystem = []
            }
        }
    },
    async beforeMount() {
        this.getFieldsSystem()
    },
    beforeDestroy() {
        localStorage.setItem('list', JSON.stringify(this.list))
        localStorage.setItem('fieldsSystem', JSON.stringify(this.fieldsSystem))
    }
}
</script>

<style scoped>
.overflowed {
    height: 75vh;
    overflow-y: auto;
}
.bordered, .bordered-black {
    border: 1px solid #ccc;
}
.bordered-black {
    border-color: #000;
}
.list-group-item {
    text-overflow: ellipsis;
    overflow: hidden;
}
.h-100 {
    height: 100%;
}
.main-headings, .preloader {
    height: 450px;
    min-width: 270px;
    overflow-x: hidden;
    overflow-y: auto;
}
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #000;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #000 transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
ul {
    list-style-type: none;
    padding: 0;
    min-height: 40px;
}
ul span {
    min-height: 40px;
    width: 100%;
    display: inline-block;
}
ul li {
    padding: 7px 5px;
    border: 1px solid #ccc;
    border-radius: 6px;
}
ul li:not(:last-child) {
    margin-bottom: 10px;
}
.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}
</style>