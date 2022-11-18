<template>
  <v-app dark>
    <v-main>
      <v-container>
        <headerVue ></headerVue>
        <Nuxt />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import headerVue from '../components/header/header.vue';

export default {
  name: 'DefaultLayout',
  data () {
    return {
    }
  },
  components: { headerVue },
}
</script>
