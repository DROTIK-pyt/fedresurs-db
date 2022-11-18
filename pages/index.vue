<template>
    <v-row>
        <v-col
        cols="12"
        sm="4"
        >
            <v-file-input
                v-model="files"
                color="deep-purple accent-4"
                counter
                label="Выберите файл Excel"
                multiple
                placeholder="Импорт"
                prepend-icon="mdi-paperclip"
                outlined
                :show-size="1000"
                :accept="accepts.join(', ')"
            >
                <template v-slot:selection="{ index, text }">
                <v-chip
                    v-if="index < 2"
                    color="deep-purple accent-4"
                    dark
                    label
                    small
                >
                    {{ text }}
                </v-chip>

                <span
                    v-else-if="index === 2"
                    class="text-overline grey--text text--darken-3 mx-2"
                >
                    +{{ files.length - 2 }} File(s)
                </span>
                </template>
            </v-file-input>
        </v-col>
    </v-row>
</template>

<script>
export default {
    name: "PageUploads",
    data: () => ({
        accepts: [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "application/vnd.ms-excel.addin.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
        ],
        files: [],
    }),
    methods: {},
    components: {},
    computed: {},
    beforeMount() {},
}
</script>

<style scoped>

</style>