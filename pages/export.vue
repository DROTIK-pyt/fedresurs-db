<template>
    <v-row>
        <v-col>
            <h1>Экспорт в Excel</h1>
            <v-btn
                depressed
                color="primary"
                @click="exportToExcel"
            >
                Экспорт
            </v-btn>
            <v-btn
                depressed
                color="success"
                @click="showFilters"
                :loading="loadingFilters"
                :disabled="loading"
            >
                Фильтры
            </v-btn>
        </v-col>
        <v-col sm="12" cols="12" v-for="(entity, index) in cores" :key="entity.idCore">
            <h2>{{ entity.name }}</h2>
            <v-select
                v-model="entity.exportField"
                :items="fields[index]?.allFields"
                :loading="loading"
                label="Поля"
                item-text="name"
                item-value="idTypeOfField"
                multiple
                chips
                hint="Выьерите поля, которые нужно экспортировать"
                persistent-hint
            ></v-select>
        </v-col>
        <v-col>
            <v-btn
                depressed
                color="primary"
                @click="exportToExcel"
            >
                Экспорт
            </v-btn>
        </v-col>
        <filter2fields
            :fields="fieldsInFilter"
            :isShow="isShow"
            @closeFilter="closeFilter"
            v-if="isShow"
        ></filter2fields>
        <errorMsgVue
            :isShowMsg="isShowError"
            :msgText="errorMsg"
            @closeErrorMsg="isShowError = false; errorMsg = ''"
        ></errorMsgVue>
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')
import filter2fields from '../components/filter2fields.vue'
import errorMsgVue from '../components/errorMsg.vue'

export default {
    data: () => ({
        cores: [],
        fields: [],
        fieldsInFilter: {},
        isShow: false,
        loading: true,
        loadingFilters: true,

        filters: [],

        isShowError: false,
        errorMsg: "",

        abortControllerInstance: null,
    }),
    components: {filter2fields, errorMsgVue},
    methods: {
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
        closeFilter(filters) {
            this.checkTokens()

            this.isShow = false

            this.filters = filters
        },
        async exportToExcel() {
            this.checkTokens()

            let isExportReady = false
            this.cores.forEach(aCore => {
                if(aCore.exportField.length > 0) {
                    isExportReady = true
                    return
                }
            })
            if(!isExportReady) {
                this.isShowError = true
                this.errorMsg = "Выберите поля для выгрузки."

                return
            }

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/exportToExcel`, {
                method: "POST",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    cores: this.cores,
                    filters: this.filters
                })
            })

            const excel = await data.blob()
            const url = URL.createObjectURL(excel)
            const a = document.createElement('a')
            a.href = url
            a.download = 'report.xlsx'
            a.style.display = 'none'
            a.click()
        },
        showFilters() {
            this.checkTokens()

            this.isShow = true
        },
        async getDataCores() {
            this.checkTokens()

            const dataCores = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const resultCores = await dataCores.json()

            if(resultCores.ok) {
                this.cores = resultCores.cores
                // this.fieldsInFilter = resultCores.cores

                this.cores.forEach(aCore => {
                    aCore.exportField = []
                })
            }
        },
        async getFieldsExportByPage(page = 1, idCore = 1) {
            console.log("start", {page, idCore})

            fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsExportGetCount`, {
                signal: this.abortControllerInstance.signal,
                method: "POST",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    idCore
                })
            })
            .then(result => result.json())
            .then(max => {
                console.log(max)
                fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsExport`, {
                    signal: this.abortControllerInstance.signal,
                    method: "POST",
                    headers: {
                        // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                        page,
                        idCore,
                        max
                    })
                })
                .then(data => data.json())
                .then(values => {
                    this.loadingFilters = false
                    console.log(values.items)

                    if(values.items) {
                        if(page == 1) this.fieldsInFilter[idCore] = []

                        this.fieldsInFilter[idCore] = this.fieldsInFilter[idCore].concat(values)
                        console.log(this.fieldsInFilter)

                        page++
                        this.getFieldsExportByPage(page, idCore)
                    } else if(idCore < 5) {
                        page = 1
                        idCore++
                        this.getFieldsExportByPage(page, idCore)
                    }
                })
                .catch(() => {
                    this.loadingFilters = false
                })
            })
            return
        },
        async getFieldsExport() {
            this.checkTokens()

            const dataTypeOfField = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValuesExport`)
            const resultTypeOfField = await dataTypeOfField.json()

            if(resultTypeOfField.ok) {
                this.fields = resultTypeOfField.fieldsValues
            }

            this.loading = false
        },
        getAllData() {
            this.checkTokens()
            
            this.getDataCores()

            this.getFieldsExport()
        },
    },
    beforeMount() {
        this.getFieldsExportByPage()

        this.abortControllerInstance = new AbortController()
        
        this.getAllData()
    },
    beforeDestroy() {
        this.abortControllerInstance.abort()
    }
}
</script>

<style scoped>

</style>