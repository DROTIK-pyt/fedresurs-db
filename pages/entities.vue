<template>
    <div class="root mt-5">
        <v-row>
            <v-col
                cols="12"
                sm="12"
            >
            <h1>БУДЬТЕ ВНИМАТЕЛЬНЫ!</h1>
            <p class="mb-4">
                Действия на этой странице затрагивают данные ВСЕХ сущностей и будут необратимы.<br />
                Рекомендуется посещать эту страницу при крайней необходимости.
            </p>
            <h2>Добавление сущности</h2>
            <div class="d-flex align-center">
                <v-btn
                    dark
                    color="indigo"
                    class="mr-3"
                    :loading="loading2addEntity"
                    :disabled="loading2addEntity"
                    @click="addField"
                >
                    Добавить
                </v-btn>
                <v-switch
                    v-model="showInTable"
                    label="Видеть в таблице"
                ></v-switch>
            </div>
            </v-col>
            <v-col
            cols="12"
            sm="10"
            >
                <v-text-field
                    v-model="newFieldName"
                    label="Новая сущность"
                    outlined
                    :error-messages="errorAdded"
                ></v-text-field>
            </v-col>
        </v-row>
        <v-row v-if="!loading">
            <v-col
                cols="12"
                sm="12"
            >
            <h2>Активные сущности</h2>
            <div class="d-flex align-center">
                <v-btn
                    dark
                    color="indigo"
                    class="mr-3"
                    :loading="loading2saveEntity"
                    :disabled="loading2saveEntity"
                    @click="saveChanges"
                >
                    Сохранить
                </v-btn>
                <v-switch
                    v-model="toDelete"
                    label="Режим удаления"
                ></v-switch>
            </div>
            <div v-show="toDelete">
                <p>
                    Осторожно! Действия необратимы и после удаления - данные сущностей теряются.
                    <br />Если режим был включен, а вы не собираетесь удалять поля - рекомендуется выключить режим удаления.
                </p>
            </div>
            </v-col>
            <v-col cols="12" sm="9" v-for="fieldsOfCompony of fieldsOfComponiesData" :key="fieldsOfCompony.tag">
                <v-row>
                    <v-col
                    cols="12"
                    sm="10"
                    >
                        <div class="d-flex justify-space-between">
                            <v-text-field
                                v-model="fieldsOfCompony.name"
                                label="Наименование сущности"
                                outlined
                                :error-messages="errorChanged"
                                class="mr-6"
                            ></v-text-field>
                            <v-switch
                                v-model="fieldsOfCompony.showInTable"
                                label="Видеть в таблице"
                            ></v-switch>
                        </div>
                    </v-col>
                    <v-col
                    cols="12"
                    sm="2"
                    >
                    <v-btn
                        icon
                        color="pink"
                        class="mt-2"
                        v-if="toDelete"
                        @click="deleteField(fieldsOfCompony)"
                        >
                        <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
        <v-row v-else>
            <v-col
            cols="12"
            sm="12"
            >
            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            </v-col>
        </v-row>
    </div>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')

export default {
    name: "entities",
    data: () => ({
        fieldsOfComponiesData: [],
        newFieldName: "",
        errorAdded: "",
        errorChanged: "",
        toDelete: false,
        loading: true,

        showInTable: false,

        loading2addEntity: false,
        loading2saveEntity: false,
    }),
    components: {},
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
                            this.loading2addEntity = false
                            this.loading2saveEntity = false
                            this.$router.push("/")
                            return false
                        }
                    } else {
                        this.loading2addEntity = false
                        this.loading2saveEntity = false
                        this.$router.push("/")
                        return false
                    }
                }
            } else {
                this.loading2addEntity = false
                this.loading2saveEntity = false
                this.$router.push("/")
                return false
            }
        },
        async addField() {
            this.loading2addEntity = true

            this.checkTokens()

            this.errorAdded = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/add-new-entity`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    newFieldName: this.newFieldName,
                    showInTable: this.showInTable
                })
            })

            const result = await data.json()
            if(!result.ok) {
                this.errorAdded = result.msg
            }

            this.newFieldName = ""
            this.showInTable = false

            this.getAllData()

            this.loading2addEntity = false
        },
        async saveChanges() {
            this.loading2saveEntity = true

            this.checkTokens()

            this.errorChanged = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    fieldsOfComponiesData: this.fieldsOfComponiesData
                })
            })
            const result = await data.json()
            if(!result.ok) {
                this.errorChanged = result.msg
            }

            this.getAllData()

            this.loading2saveEntity = false
        },
        async deleteField({idCore}) {
            this.checkTokens()

            await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idCore
                })
            })

            this.getAllData()
        },
        async getAllData() {
            this.checkTokens()

            // Получить сущности
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/cores`)
            const fieldsOfComponies = await data.json()
            console.log(fieldsOfComponies)

            // Вставить их в таблицу
            this.fieldsOfComponiesData = []

            fieldsOfComponies.cores.forEach(field => {
                this.fieldsOfComponiesData.unshift({
                    name: field.name,
                    idCore: field.idCore,
                    showInTable: field.showInTable,
                })
            })
        }
    },
    async beforeMount() {        
        this.getAllData()

        this.loading = false
    }
}
</script>

<style scoped>
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
</style>