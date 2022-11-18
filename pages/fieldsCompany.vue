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
            <v-col cols="12" sm="9" v-for="fieldsOfCompony of fieldsOfComponiesData" :key="fieldsOfCompony">
                <v-row>
                    <v-col
                    cols="12"
                    sm="10"
                    
                    >
                        <v-text-field
                            v-model="fieldsOfCompony.name"
                            label="Наименование поля компании"
                            outlined
                            :error-messages="errorChanged"
                        ></v-text-field>
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
    }),
    components: {},
    methods: {
        async addField() {
            this.errorAdded = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/add-new-field`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    newFieldName: this.newFieldName
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
            // Получить поля компаний
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fields`)
            const fieldsOfComponies = await data.json()

            console.log(fieldsOfComponies)

            // Вставить их в данные
            this.fieldsOfComponiesData = []

            fieldsOfComponies.forEach(field => {
                this.fieldsOfComponiesData.unshift({
                    name: field.name,
                    tag: field.tag,
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