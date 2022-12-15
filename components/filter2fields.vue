<template>
    <v-dialog
        persistent
        width="600px"
        v-model="isShow"
        @#click:outside="$emit('closeFilter')"
    >
        <v-card>
            <v-card-title>
                <span class="text-h5">Фильтры по полям</span>
            </v-card-title>
            <v-card-text>
            <v-container>
                <v-row>
                    <v-col
                        cols="12"
                        sm="12"
                        v-for="field in fieldsExport"
                        :key="field.name"
                    >
                        <h4>{{ field.name }}</h4>
                        <div
                            v-for="item in field.items"
                            :key="item.name"
                        >
                            <v-autocomplete
                                v-model="filters[`${field.idCore}`]"
                                multiple
                                :items="item.values"
                                item-text="value"
                                item-value="theCoreIdTheCore"
                                :label="item.name"
                            ></v-autocomplete>    
                        </div>
                    </v-col>
                </v-row>
            </v-container>
            </v-card-text>
            <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                color="blue darken-1"
                text
                @click="$emit('closeFilter', filters)"
            >
                Принять
            </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: ['isShow', 'fields'],
    data: () => ({
        fieldsExport: [],
        filters: {},
    }),
    async beforeMount() {
        const keys = Object.keys(this.fields)
        
        // console.log(this.fields)

        keys.forEach(k => {
            let tValues = []
            let vals = {}
            let idCore = k
            let name = this.fields[k][0].name

            this.fields[k].forEach(field => {
                if(field.items.length > 0) {

                    field.items.forEach(theCore => {
                        theCore.typeOfFields.forEach(TOF => {
                            if(TOF.coreTypeOfField.value != "") {
                                let value = {
                                    value: TOF.coreTypeOfField.value,
                                    theCoreIdTheCore: TOF.coreTypeOfField.theCoreIdTheCore,
                                    idTypeOfField: TOF.idTypeOfField,
                                    nameField: TOF.name
                                }
                                tValues.push(value)
                            }
                        })
                    })
                }
            })

            tValues.forEach(val => {
                if(!vals[`${val.idTypeOfField}`])
                    vals[`${val.idTypeOfField}`] = {
                        name: val.nameField,
                        values: []
                    }
                
                vals[`${val.idTypeOfField}`].values.push({
                    theCoreIdTheCore: val.theCoreIdTheCore,
                    value: val.value,
                })
            })

            // console.log(vals)
            this.fieldsExport.push({
                idCore,
                name,
                items: vals
            })
            // console.log({
            //     idCore,
            //     name,
            //     items: {
            //         values,
            //         name: values[0].name,
            //         idTypeOfField: values[0].idTypeOfField,
            //     }
            // })
        })

        
    },
}
</script>

<style scoped></style>