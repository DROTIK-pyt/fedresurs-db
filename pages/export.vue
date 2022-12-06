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

        filters: null,
    }),
    components: {filter2fields},
    methods: {
        closeFilter(filters) {
            this.isShow = false

            this.filters = filters
        },
        async exportToExcel() {
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
            this.isShow = true
        },
        async getAllData() {
            const dataCores = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const resultCores = await dataCores.json()

            if(resultCores.ok) {
                this.cores = resultCores.cores
                this.fieldsInFilter = resultCores.cores

                this.cores.forEach(aCore => {
                    aCore.exportField = []
                })
            }

            const dataTypeOfField = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValuesExport`)
            const resultTypeOfField = await dataTypeOfField.json()

            if(resultTypeOfField.ok) {
                this.fields = resultTypeOfField.fieldsValues
                this.fieldsInFilter = resultTypeOfField.fieldsValuesExport
            }

            this.loading = false
        },
    },
    async beforeMount() {
        this.getAllData()
    },
}
</script>

<style scoped>

</style>