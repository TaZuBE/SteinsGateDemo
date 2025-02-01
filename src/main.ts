import 'virtual:uno.css'
import './assets/css/main.css'
import 'vue-toastification/dist/index.css'
import 'material-icons/iconfont/material-icons.css'

import Toast from 'vue-toastification'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)


app.use(router)
app.use(Toast)

app.mount('#app')
