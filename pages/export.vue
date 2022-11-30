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
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')

export default {
    data: () => ({
        cores: [],
        fields: [],
    }),
    components: {},
    methods: {
        async exportToExcel() {
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/exportToExcel`, {
                method: "POST",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    cores: this.cores
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
        async getAllData() {
            const dataCores = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const resultCores = await dataCores.json()

            if(resultCores.ok) {
                this.cores = resultCores.cores

                this.cores.forEach(aCore => {
                    aCore.exportField = []
                })
            }

            const dataTypeOfField = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValuesExport`)
            const resultTypeOfField = await dataTypeOfField.json()

            if(resultTypeOfField.ok) {
                this.fields = resultTypeOfField.fieldsValues
            }
        },
    },
    async beforeMount() {
        this.getAllData()
    },
}
</script>

<style scoped>

</style>