<template>
  <div class="container">
    <div class="card">
      <div class="card__pad">
        <h1 style="margin:0 0 8px;">Улюблені рецепти</h1>
        <div class="muted" style="line-height:1.55;">
          Тут зберігаються рецепти, які ти додав(ла) в улюблене. Дані зберігаються у браузері (LocalStorage).
        </div>

        <div class="sep"></div>

        <div v-if="items.length === 0" class="muted">
          Поки що немає улюблених рецептів. На головній або в деталях натисни «Додати в улюблене».
        </div>

        <div v-else class="list">
          <div v-for="m in items" :key="m.idMeal" class="card recipe">
            <router-link :to="`/recipe/${m.idMeal}`" title="Відкрити рецепт">
              <div class="recipe__img">
                <img :src="m.strMealThumb" :alt="titleUa(m.strMeal)" loading="lazy" />
              </div>
              <div class="recipe__body">
                <div class="recipe__title">{{ titleUa(m.strMeal) }}</div>
                <div class="recipe__meta">
                  <span class="pill">Улюблене</span>
                </div>
              </div>
            </router-link>

            <div style="padding:0 12px 12px;">
              <button class="btn" @click="remove(m)">Прибрати</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavorites, toggleFavorite } from '../services/storage'
import { translateMealTitle } from '../i18n/ua'

const items = ref([])

function load(){
  items.value = getFavorites()
}

function remove(m){
  toggleFavorite(m)
  load()
}

function titleUa(t){
  return translateMealTitle(t)
}

onMounted(load)
</script>
