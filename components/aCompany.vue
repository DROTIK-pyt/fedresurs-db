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

                <v-card-text v-html="infoOfCompany">
                </v-card-text>

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
const CyrillicToTranslit = require('cyrillic-to-translit-js')
const cyrillicToTranslit = new CyrillicToTranslit()

export default {
    props: [ "isOpen", "company", "contact" ],
    data: () => ({

    }),
    methods: {},
    computed: {
        naimenovanie() {
            if (this.company.naimenovanie) {
                return this.company.naimenovanie
            }
            const kyes = Object.keys(this.company)
            return this.company[keys[0]]
        },
        infoOfCompany() {
            let keys = Object.keys(this.company)
            const aCompany = this.company

            let resultText = ``

            keys.forEach(key => {
                if(key != "createdAt" && key != "updatedAt" && key != "idCompany")
                    resultText += `${cyrillicToTranslit.reverse(key)}: ${aCompany[key]}<br />`
            })

            resultText += `<br />`

            keys = Object.keys(this.contact)
            const aContact = this.contact

            keys.forEach(key => {
                if(key == "otherInfo") {
                    resultText += `Прочая информация: ${aContact[key]}<br />`
                }
                else if(key == "phone") {
                    resultText += `Телефон: ${aContact[key]}<br />`
                }
                else if(key == "email") {
                    resultText += `E-mail: ${aContact[key]}<br />`
                }
                else if(key == "requisits") {
                    resultText += `Реквизиты: ${aContact[key]}<br />`
                }
                else if(key != "createdAt" &&
                        key != "updatedAt" &&
                        key != "contactCompany" &&
                        key != "idCompany" &&
                        key != "idContactPerson") {
                    resultText += `${cyrillicToTranslit.reverse(key)}: ${aContact[key]}<br />`
                }
            })

            return resultText
        },
    },
}
</script>

<style scoped>

</style>