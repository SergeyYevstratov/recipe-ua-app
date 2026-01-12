<template>
  <div class="container">
    <section class="card hero">
      <div class="hero__left">
        <h1 class="hero__title">Підбір рецептів за інгредієнтами</h1>
        <p class="hero__text">
          Введи інгредієнти українською мовою — додаток автоматично перекладе їх для пошуку у базі рецептів.
        </p>

        <div class="inputRow">
          <input
            class="input"
            v-model="input"
            placeholder="Наприклад: курка, рис, помідор"
            @keydown.enter="search"
          />
          <button class="btn primary" :disabled="loading" @click="search">
            {{ loading ? 'Пошук…' : 'Знайти рецепти' }}
          </button>
          <button class="btn" :disabled="loading" @click="clear">Очистити</button>
        </div>

        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <span class="pill">Порада: вводь 1–3 інгредієнти</span>
          <span class="pill" v-if="!hasKey">Калорійність приблизна</span>
          <span class="pill" v-else>Калорійність з USDA FDC</span>
        </div>

        <div v-if="history.length" style="margin-top:12px;">
          <div class="muted" style="margin-bottom:8px;">Історія пошуку</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn" v-for="h in history" :key="h" @click="useHistory(h)">
              {{ h }}
            </button>
            <button class="btn" @click="clearHist">Очистити історію</button>
          </div>
        </div>
      </div>

      <div class="hero__panel">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <h2 style="margin:0;">Швидкі приклади</h2>
        </div>
        <div class="sep"></div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn good" @click="setExample('курка')">курка</button>
          <button class="btn good" @click="setExample('яйце, сир')">яйце, сир</button>
          <button class="btn good" @click="setExample('картопля, цибуля')">картопля, цибуля</button>
          <button class="btn good" @click="setExample('рис, помідор')">рис, помідор</button>
        </div>

        <div class="sep"></div>
        <div class="muted" style="line-height:1.55;">
          Улюблені рецепти доступні у вкладці «Улюблене».
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:14px;">
      <div class="card__pad">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <h2 style="margin:0;">Результати</h2>
          <div class="muted" v-if="searched">Знайдено: <b>{{ meals.length }}</b></div>
        </div>
        <div class="sep"></div>

        <div v-if="error" class="muted">{{ error }}</div>
        <div v-else-if="!searched" class="muted">
          Поки що порожньо. Введи інгредієнти та натисни «Знайти рецепти».
        </div>
        <div v-else-if="meals.length === 0" class="muted">
          За заданими інгредієнтами рецептів не знайдено.
        </div>

        <div v-else class="list">
          <div v-for="m in meals" :key="m.idMeal" class="card recipe">
            <router-link :to="`/recipe/${m.idMeal}`" title="Відкрити рецепт">
              <div class="recipe__img">
                <img :src="m.strMealThumb" :alt="titleUa(m.strMeal)" loading="lazy" />
              </div>
              <div class="recipe__body">
                <div class="recipe__title">{{ titleUa(m.strMeal) }}</div>
                <div class="recipe__meta">
                  <span class="pill">Рецепт</span>
                  <span class="pill">ID: {{ m.idMeal }}</span>
                </div>
              </div>
            </router-link>

            <div style="padding:0 12px 12px; display:flex; gap:10px;">
              <button class="btn" @click="open(m.idMeal)">Переглянути</button>
              <button class="btn" @click="fav(m)">
                {{ isFav(m.idMeal) ? 'В улюбленому ✓' : 'Додати в улюблене' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { filterByIngredient, rankMealsByMatches, normalizeIngredientForApi } from '../services/mealdb'
import { hasFdcKey as _hasKey } from '../services/fdc'
import { getHistory, pushHistory, clearHistory, isFavorite, toggleFavorite } from '../services/storage'
import { translateMealTitle } from '../i18n/ua'

const router = useRouter()

const input = ref('')
const loading = ref(false)
const meals = ref([])
const error = ref('')
const searched = ref(false)
const hasKey = _hasKey()
const history = ref([])

function titleUa(t){
  return translateMealTitle(t)
}

function open(id){
  router.push(`/recipe/${id}`)
}

function isFav(id){
  return isFavorite(id)
}

function fav(m){
  toggleFavorite(m)
  // щоб оновився напис на кнопці
  meals.value = meals.value.slice()
}

function loadHistory(){
  history.value = getHistory()
}

function useHistory(h){
  input.value = h
  search()
}

function clearHist(){
  clearHistory()
  loadHistory()
}

function clear(){
  input.value = ''
  meals.value = []
  error.value = ''
  searched.value = false
}

function setExample(v){
  input.value = v
  search()
}

async function search(){
  error.value = ''
  searched.value = true
  meals.value = []

  const raw = input.value.trim()
  if (!raw){
    error.value = 'Введи хоча б один інгредієнт.'
    return
  }

  // запис у історію
  pushHistory(raw)
  loadHistory()

  const originalIngredients = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
  const apiIngredients = originalIngredients.map(normalizeIngredientForApi)

  loading.value = true
  try{
    const lists = []
    for (const ing of apiIngredients){
      const list = await filterByIngredient(ing)
      lists.push(list)
    }
    meals.value = rankMealsByMatches(lists).slice(0, 60)
  }catch(e){
    error.value = e?.message || 'Сталася помилка під час пошуку.'
  }finally{
    loading.value = false
  }
}

onMounted(loadHistory)
</script>
