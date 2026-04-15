import { createRouter, createWebHashHistory } from 'vue-router'
import AiMakeup from '../views/AiMakeup.vue'
import Culture from '../views/Culture.vue'
import CultureDetail from '../views/CultureDetail.vue'
import Costume from '../views/Costume.vue'
import CostumeDetail from '../views/CostumeDetail.vue'

const routes = [
  {
    path: '/',
    name: 'ai-makeup',
    component: AiMakeup,
  },
  {
    path: '/culture',
    name: 'culture',
    component: Culture,
  },
  {
    path: '/culture/:id',
    name: 'culture-detail',
    component: CultureDetail,
    props: true,
  },
  {
    path: '/costume',
    name: 'costume',
    component: Costume,
  },
  {
    path: '/costume/:id',
    name: 'costume-detail',
    component: CostumeDetail,
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
