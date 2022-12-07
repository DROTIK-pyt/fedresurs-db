<template>
    <div class="root mt-5">
        <v-row>
            <v-col
                cols="12"
                sm="12"
            >
            <h1>БУДЬТЕ ВНИМАТЕЛЬНЫ!</h1>
            <p class="mb-4">
                Действия на этой странице затрагивают данные ВСЕХ компаний и будут необратимы.<br />
                Рекомендуется посещать эту страницу при крайней необходимости.
            </p>
            <h2>Добавление поля</h2>
            <div class="d-flex align-center">
                <v-btn
                    dark
                    color="indigo"
                    class="mr-3"
                    @click="addField"
                >
                    Добавить
                </v-btn>
            </div>
            </v-col>
            <v-col
            cols="12"
            sm="10"
            >
                <v-select
                    :items="classOfFields"
                    item-text="name"
                    item-value="type"
                    label="Класс поля"
                    v-model="class2field"
                    solo
                ></v-select>
                <v-text-field
                    v-model="newFieldName"
                    label="Новое поле"
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
            <h2>Активные поля компаний</h2>
            <div class="d-flex align-center">
                <v-btn
                    dark
                    color="indigo"
                    class="mr-3"
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
                    Осторожно! Действия необратимы и после удаления - данные компаний теряются.
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
                        <div class="d-flex justify-space-between align-end">
                            <v-select
                                :items="classOfFields"
                                item-text="name"
                                v-model="fieldsOfCompony.classOfField"
                                item-value="type"
                                label="Класс поля"
                                class="mr-4"
                                solo
                            ></v-select>
                            <v-text-field
                                v-model="fieldsOfCompony.name"
                                label="Наименование поля"
                                outlined
                                :error-messages="errorChanged"
                                class="mr-5"
                            ></v-text-field>
                            <div>
                                <v-switch
                                    v-model="fieldsOfCompony.showInColumnTable"
                                    label="Видимость колонки"
                                ></v-switch>
                                <v-switch
                                    v-model="fieldsOfCompony.showInFilter"
                                    label="Использовать в фильтре"
                                ></v-switch>
                            </div>
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
                        @click="deleteField(fieldsOfCompony.tag)"
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
    name: "FieldsOfCompony",
    data: () => ({
        fieldsOfComponiesData: [],
        newFieldName: "",
        errorAdded: "",
        errorChanged: "",
        toDelete: false,
        loading: true,
        classOfFields: [],
        class2field: "",

        disabledBtnSave: true,
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
        async addField() {
            this.checkTokens()

            this.errorAdded = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/add-new-field`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    newFieldName: this.newFieldName,
                    class2field: this.class2field
                })
            })

            const result = await data.json()
            if(!result.ok) {
                this.errorAdded = result.msg
            }

            this.newFieldName = ""

            this.getAllData()
        },
        async saveChanges() {
            this.checkTokens()

            this.errorChanged = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fields`, {
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
        },
        async deleteField(tag) {
            this.checkTokens()

            await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fields`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    tag
                })
            })

            this.getAllData()
        },
        async getAllData() {
            this.checkTokens()
            
            // Получить поля компаний
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fieldsValues`)
            const fieldsOfComponies = await data.json()
            // console.log(fieldsOfComponies.fieldsValues)

            // Вставить их в данные
            this.fieldsOfComponiesData = []

            fieldsOfComponies.fieldsValues.forEach(field => {
                // console.log(field.classOfField?.type)

                this.fieldsOfComponiesData.unshift({
                    name: field.name,
                    tag: field.tag,
                    showInColumnTable: field.showInColumnTable,
                    showInFilter: field.showInFilter,
                    classOfField: field.classOfField?.type ? field.classOfField?.type : "universal"
                })
            })

            fieldsOfComponies.class2fields.forEach(c2f => {
                this.classOfFields.push({
                    name: c2f.name,
                    type: c2f.type,
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
.v-select {
    max-width: 400px;
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
</style>