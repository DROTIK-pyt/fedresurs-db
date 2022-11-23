<template>
    <v-row>
        <v-dialog
            v-model="isOpen"
            width="500"
            >
            <v-card>
                <v-card-title class="text-h5 grey lighten-2">
                    {{ naimenovanie }}
                </v-card-title>

                <v-card-text v-html="text">
                </v-card-text>

                <v-card-text>
                    <v-autocomplete
                    v-if="allEntities.length"
                    v-model="entity"
                    :items="allEntities"
                    item-text="name"
                    item-value="idCore"
                    label="Выберите сущность"
                    solo
                    ></v-autocomplete>
                    <p v-else>
                        Связанных сущностей нет.
                    </p>
                </v-card-text>
                <v-card-text v-if="information" v-html="information"></v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="primary"
                    text
                    @click="$emit('closeView')"
                >
                    Ок
                </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')

export default {
    props: [ "isOpen", "theEntity" ],
    data: () => ({
        allEntities: [],
        entity: "",

        information: "",
    }),
    methods: {
        async getLinkedEntities({idTheCore}) {
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/linkedEntity`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idEntity: idTheCore
                })
            })
            const result = await data.json()
            const ids = []

            result.items.forEach(item => {
                ids.push(item.childCoreId)
            })

            for(let i = 0; i < ids.length; i++) {
                let id = ids[i]

                const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/field`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8',
                    },
                    body: JSON.stringify({
                        idEntity: id
                    })
                })
                const result = await data.json()

                if(result?.cores) {
                    result.cores.forEach(core => {
                        this.allEntities.push({
                            name: core.name,
                            idCore: core.idCore
                        })
                    })
                }
            }
        },
    },
    computed: {
        text() {
            let result = ``
            this.theEntity.typeOfFields.forEach(field => {
                result += `${field.name}: ${field.coreTypeOfField.value} <br />`
            })
            return result
        },
        naimenovanie() {
            const n = this.theEntity.typeOfFields.find(field => field.tag === "naimenovanie")
            if(n) {
                return n.coreTypeOfField.value
            } else {
                return this.theEntity.typeOfFields[0].coreTypeOfField.value
            }
        }
    },
    watch: {
        async entity() {
            this.information = ""

            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/fields`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    idCore: this.entity
                })
            })
            const result = await data.json()

            result.fields.theCores.forEach(core => {
                core.typeOfFields.forEach(field => {
                    this.information += `${field.name}: ${field.coreTypeOfField.value}<br />`
                })
                this.information += "<br/>"
            })
        },
    },
    async beforeMount() {
        this.getLinkedEntities(this.theEntity)
    },
    beforeDestroy() {
        this.allEntities = []
        this.entity = ""
    },
}
</script>

<style scoped>

</style>