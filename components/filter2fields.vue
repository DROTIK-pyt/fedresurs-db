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
                    
                </v-row>
            </v-container>
            </v-card-text>
            <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
                color="blue darken-1"
                text
                @click="$emit('closeFilter')"
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
        
    }),
    async beforeMount() {
        
    },
}
</script>

<style scoped></style>