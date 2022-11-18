<template>
    <v-row>
        <v-col
        cols="12"
        sm="12"
        >
            <nav>
                <nuxt-link to="/" active-class="active-btn">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Импорт
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/dataBaseTable" active-class="active-btn">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Компании
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/fieldsCompany" active-class="active-btn">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Поля компаний
                    </v-btn>
                </nuxt-link>
            </nav>
        </v-col>
    </v-row>
</template>

<script>
export default {
    
}
</script>

<style scoped>
a {
    text-decoration: none;
}
.nuxt-link-exact-active button {
    background-color: #F57F17 !important;
    border-color: #F57F17 !important;
}
</style>