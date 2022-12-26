<template>
    <v-row align="center" justify="center">
        <v-col cols="12" sm="4" class="justify-center">
            <v-text-field
                v-model="login"
                label="Логин"
                filled
            ></v-text-field>
            <v-text-field
                v-model="password"
                label="Пароль"
                type="password"
                filled
            ></v-text-field>
            <v-row>
                <v-col cols="12" sm="12">
                    <p class="mb-0">
                        {{ errorMsg }}
                    </p>
                </v-col>
                <v-col cols="12" sm="4" offset-sm="4">
                    <v-btn
                        depressed
                        color="primary"
                        @click="auth"
                    >
                        Авторизация
                    </v-btn>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')

export default {
    layout: "login",
    data: () => ({
        login: "",
        password: "",
        errorMsg: "",
    }),
    methods: {
        async checkTokens({ accessToken, sessionId }) {
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

                if(result.ok) {
                    this.$router.go(-1)
                }
            }
        },
        async auth() {
            const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/auth`, {
                method: "POST",
                headers: {
                    // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    login: this.login,
                    password: this.password
                })
            })

            const result = await data.json()

            if(result.ok) {
                localStorage.setItem("accessToken", result.accessToken)
                localStorage.setItem("refreshToken", result.refreshToken)
                localStorage.setItem("sessionId", result.sessionId)

                this.$router.push("/import")
            } else {
                this.errorMsg = "Неверные данные. В доступе отказано."
            }
        },
    },
    async beforeMount() {
        const data = {
            accessToken: localStorage.getItem("accessToken"),
            sessionId: localStorage.getItem("sessionId")
        }
        this.checkTokens(data)
    }
}
</script>

<style scoped>

</style>