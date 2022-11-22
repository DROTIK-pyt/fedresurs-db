<template>
    <v-row>
        <v-col
        cols="12"
        sm="9"
        >
        <v-card>
            <v-card-title>
            <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Поиск..."
                single-line
                hide-details
            ></v-text-field>
            </v-card-title>
            <v-data-table
            :headers="headers"
            :items="companies"
            :search="search"
            >
            <template v-slot:item.actions="{ item }">
                <v-icon
                    small
                    class="mr-2"
                    @click="ShowCompany(item)"
                >
                    mdi-eye
                </v-icon>
            </template>
            </v-data-table>
        </v-card>
        </v-col>
        <v-col
        cols="12"
        sm="3"
        >
        </v-col>
        <aCompanyVue
            v-if="isOpenShowCompany"
            :isOpen="isOpenShowCompany"
            :company="aCompany"
            :contact="aContact"
            @closeView="closeShowCompany"
        ></aCompanyVue>
    </v-row>
</template>

<script>
import aCompanyVue from '../components/aCompany.vue'

const serverSetting = require('../server/config/serverSetting.json')

export default {
    name: "DataBasetable",
    data: () => ({
        search: "",
        headers: [
            { text: 'Действия', value: 'actions', sortable: false },
        ],
        companies: [],

        aCompany: "",
        aContact: "",
        isOpenShowCompany: false
    }),
    methods: {
        async getAllData() {
            // Получить 3 поля компаний для таблицы
            let data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/get-semi-fields`)
            const semiFields = await data.json()

            // Вставить поля в header
            semiFields.forEach(field => {
                this.headers.unshift({
                    text: `${field.name}`,
                    value: `${field.tag}`,
                    sortable: false
                }) 
            })

            // Получить данные компаний по столбцам
            data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/company`)
            const companies = await data.json()

            // Вставить данные компаний
            if(companies.ok) {
                this.companies = companies.results
            }
        },
        async ShowCompany({ idCompany }) {
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/companyViaId`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idCompany
                })
            })
            const companies = await data.json()
            console.log(companies)

            const company = companies.results.shift()
            const contact = companies.contact

            this.aCompany = company
            this.aContact = contact
            this.isOpenShowCompany = true
        },
        closeShowCompany() {
            this.isOpenShowCompany = false
        },
    },
    components: {aCompanyVue},
    async beforeMount() {
        this.getAllData()
    },
}
</script>

<style scoped>

</style>