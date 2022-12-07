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
                :loading="loading"
                :disabled="loading"
            >
                Фильтры
            </v-btn>
        </v-col>
        <v-col sm="12" cols="12" v-for="(entity, index) in cores" :key="entity.idCore">
            <h2>{{ entity.name }}</h2>
            <v-select
                v-model="entity.exportField"
                :items="fields[index]"
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
        {{ cores }}
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')
import filter2fields from '../components/filter2fields.vue'

export default {
    data: () => ({
        cores: [],
        fields: [],
        fieldsInFilter: [],
        isShow: false,
        loading: true,

        filters: [],
    }),
    components: {filter2fields},
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
        async showFilters() {
            this.checkTokens()

            this.isShow = true
        },
        async getDataCores() {
            this.checkTokens()

            const dataCores = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const resultCores = await dataCores.json()

            if(resultCores.ok) {
                this.cores = resultCores.cores
                this.fieldsInFilter = resultCores.cores

                this.cores.forEach(aCore => {
                    aCore.exportField = []
                })
            }
        },
        async getFieldsExport() {
            this.checkTokens()

            const dataTypeOfField = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValuesExport`)
            const resultTypeOfField = await dataTypeOfField.json()

            if(resultTypeOfField.ok) {
                this.fields = resultTypeOfField.fieldsValues
                this.fieldsInFilter = resultTypeOfField.fieldsValuesExport
            }

            this.loading = false
        },
        getAllData() {
            this.checkTokens()
            
            this.getDataCores()

            this.getFieldsExport()
        },
    },
    async beforeMount() {        
        this.getAllData()
    },
}
</script>

<style scoped>

</style>