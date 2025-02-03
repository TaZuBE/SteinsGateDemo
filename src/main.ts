import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import 'virtual:uno.css'
import './assets/css/main.css'
import 'vue-toastification/dist/index.css'
import 'material-icons/iconfont/material-icons.css'
import { aliases, md } from 'vuetify/iconsets/md'

import Toast from 'vue-toastification'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md,
    },
  },
})

app.use(router)
app.use(Toast)
app.use(vuetify)

app.mount('#app')
