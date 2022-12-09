<template>
    <v-dialog
      v-model="isShowMsg"
      persistent
      max-width="290"
    >
      <v-card>
        <v-card-title class="text-h4">
          Подтвердите действие
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red darken-1"
            text
            @click="$emit('cancel')"
          >
            Отмена
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="$emit('confirm')"
          >
            Подтверждаю
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: [ 'isShowMsg' ],
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