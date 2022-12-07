<template>
    <v-row>
        <v-col
        cols="12"
        sm="9"
        >
        <v-autocomplete
        v-model="entity"
        :items="allEntities"
        item-text="name"
        item-value="idCore"
        label="Выберите сущность"
        solo
        ></v-autocomplete>
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
            :items="entities"
            :search="search"
            >
            <template v-slot:item.actions="{ item }">
                <v-icon
                    small
                    class="mr-2"
                    @click="showEntity(item)"
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
        <theEntityVue
            v-if="isOpenShowEntity"
            :isOpen="isOpenShowEntity"
            :theEntity="theEntity"
            @closeView="closeshowEntity"
        ></theEntityVue>
    </v-row>
</template>

<script>
import theEntityVue from '../components/theEntity.vue'

const serverSetting = require('../server/config/serverSetting.json')

export default {
    name: "DataBasetable",
    data: () => ({
        search: "",
        headers: [
            { text: 'Действия', value: 'actions', sortable: false },
        ],
        entities: [],

        allEntities: [],
        entity: "",

        theEntity: "",
        isOpenShowEntity: false
    }),
    watch: {
        entity() {
            this.getAllDataFields(this.entity)

            this.search = ""
        }
    },
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
        async getAllData() {
            this.checkTokens()

            // Получить все возможные сущности
            let data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/entities`)
            const result = await data.json()

            // Вставить сущности в выпадающее поле
            this.allEntities = result.entities
        },
        async getAllDataFields(idCore) {
            this.checkTokens()

            // Предварительно очистить заголовки
            this.headers = [{ text: 'Действия', value: 'actions', sortable: false },]
            this.entities = []

            // Получить поля сущности для таблицы
            let data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fields`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idCore
                })
            })
            const semiFields = await data.json()

            // Вставить поля в header
            semiFields.headers.forEach(field => {
                if(field.showInColumnTable) {
                    this.headers.unshift({
                        text: `${field.name}`,
                        value: `${field.tag}`,
                        sortable: false
                    }) 
                }
            })

            // Получить данные сущности по столбцам
            const entities = semiFields.fields

            // Вставить данные сущности
            let elem = {}

            entities.theCores.forEach(entity => {
                entity.typeOfFields.forEach(field => {
                    if(field.coreTypeOfField.value) {
                        elem[`${field.tag}`] = field.coreTypeOfField.value
                    } else {
                        elem[`${field.tag}`] = "Нет данных"
                    }
                })
                elem['idEntity'] = entity.idTheCore
                this.entities.push(elem)
                elem = {}
            })
        },
        async showEntity({idEntity}) {
            this.checkTokens()

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/entityViaId`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idEntity
                })
            })
            const entities = await data.json()

            this.theEntity = entities.item
            this.isOpenShowEntity = true
        },
        closeshowEntity() {
            this.checkTokens()

            this.isOpenShowEntity = false

            this.theEntity = false
        },
    },
    components: {theEntityVue},
    async beforeMount() {
        this.checkTokens()
        
        this.getAllData()
    },
}
</script>

<style scoped>

</style>