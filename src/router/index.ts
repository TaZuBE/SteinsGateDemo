import { createRouter, createWebHistory } from 'vue-router'
import BlankView from '@/BlankView.vue'
import Study from '@/views/study/Study.vue'
import ChemistryInference from '@/views/study/chemistryInference/ChemistryInference.vue'
import Debug from '@/views/debug/Debug,.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/study/blank'
    },
    {
      path: '/study',
      name: 'study',
      component: Study,
      redirect: '/study/blank',
      
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
    {
      path: '/debug',
      name: 'debug',
      component: Debug,
    },
  ],
})

export default router
