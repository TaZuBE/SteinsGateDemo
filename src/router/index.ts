import { createRouter, createWebHistory } from 'vue-router'
import BlankView from '@/BlankView.vue'
import Study from '../study/Study.vue'
import ChemistryInference from '../study/chemistryInference/ChemistryInference.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BlankView,
    },
    {
      path: '/study',
      name: 'study',
      component: Study,
      
      children: [
        {
          path: 'blank',
          name: 'study-blank',
          component: BlankView,
        },
        {
          path: 'chemistry-inference',
          name: "chemistry-inference",
          component: ChemistryInference,
        },
      ],
    },
  ],
})

export default router
