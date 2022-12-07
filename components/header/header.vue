<template>
    <v-row>
        <v-col
        cols="12"
        sm="12"
        >
            <nav class="d-flex justify-start align-start">
                <nuxt-link to="/import" active-class="active-btn">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Импорт
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/export" active-class="active-btn" class="ml-1">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Экспорт
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/dataBaseTable" active-class="active-btn" class="ml-1">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Таблица сущностей
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/fieldsCompany" active-class="active-btn" class="ml-1">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Поля сущностей
                    </v-btn>
                </nuxt-link>
                <nuxt-link to="/entities" active-class="active-btn" class="ml-1">
                    <v-btn
                    depressed
                    dark
                    color="purple"
                    >
                        Сущности
                    </v-btn>
                </nuxt-link>
                <v-spacer></v-spacer>
                <v-btn
                    depressed
                    dark
                    color="red"
                    @click="logout"
                    class="ml-a"
                >
                    Выйты
                </v-btn>
            </nav>
        </v-col>
    </v-row>
</template>

<script>
const serverSetting = require('../../server/config/serverSetting.json')

export default {
    methods: {
        async logout() {
            const sessionId = localStorage.getItem("sessionId")
            if(sessionId) {
                await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/logout`, {
                    method: "POST",
                    headers: {
                        // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                        sessionId
                    })
                })
            }

            localStorage.setItem("accessToken", null)
            localStorage.setItem("refreshToken", null)
            localStorage.setItem("sessionId", null)
        }
    }
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
.ml-a {
    margin-left: auto;
}
</style>