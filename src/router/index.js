import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import RecipeDetails from '../pages/RecipeDetails.vue'
import Favorites from '../pages/Favorites.vue'
import About from '../pages/About.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/recipe/:id', component: RecipeDetails, props: true },
    { path: '/favorites', component: Favorites },
    { path: '/about', component: About },
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
