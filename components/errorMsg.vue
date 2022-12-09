<template>
    <v-dialog
      v-model="isShowMsg"
      persistent
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h4">
          Ошибка
        </v-card-title>
        <v-card-text class="text-h6">{{ msgText }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$emit('closeErrorMsg')"
          >
            Хорошо
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: [ 'isShowMsg', 'msgText' ],
}
</script>

<style scoped>
.v-application .text-h6 {
    font-size: 1.2rem !important;
    font-weight: 500;
    line-height: 1.5rem;
    letter-spacing: 0.0125em !important;
    font-family: "Roboto", sans-serif !important;
}
</style>