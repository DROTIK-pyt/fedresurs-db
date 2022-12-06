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
                        :key="field.idCore"
                    >
                        <h4>{{ field.name }}</h4>
                        <div
                            v-for="item in field.items"
                            :key="item.idTypeOfField"
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
        this.fields.forEach((field, i) => {
            this.fieldsExport.push({
                name: field.name,
                idCore: field.idCore,
                items: [],
            })
            if(field?.theCores.length) {
                let index = 0
                field?.theCores[0]?.typeOfFields?.forEach(elem => {
                    this.fieldsExport[i].items.push({
                        name: elem.name,
                        idTypeOfField: elem.idTypeOfField,
                        values: [],
                    })

                    elem.coreTypeOfFields.forEach(CTOF => {
                        this.fieldsExport[i].items[index].values.push({
                            value: CTOF.value,
                            theCoreIdTheCore: CTOF.theCoreIdTheCore
                        })
                    })
                    index++
                })
            }
        })
    },
}
</script>

<style scoped></style>