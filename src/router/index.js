import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import RecipeDetails from '../pages/RecipeDetails.vue'
import Favorites from '../pages/Favorites.vue'
import About from '../pages/About.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/recipe/:id', component: RecipeDetails, props: true },
    { path: '/favorites', component: Favorites },
    { path: '/about', component: About },
  ],
  scrollBehavior() { return { top: 0 } }
})
