<template>
  <div class="container">
    <div class="card">
      <div class="card__pad">
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
          <button class="btn" @click="$router.back()">← Назад</button>
          <button class="btn" v-if="meal" @click="toggleFav">
            {{ fav ? 'В улюбленому ✓' : 'Додати в улюблене' }}
          </button>
        </div>

        <div class="sep"></div>

        <div v-if="loading" class="muted">Завантаження…</div>
        <div v-else-if="error" class="muted">{{ error }}</div>
        <div v-else-if="!meal" class="muted">Рецепт не знайдено.</div>

        <div v-else>
          <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start;">
            <div style="flex: 0 0 340px; max-width: 100%;">
              <img
                :src="meal.strMealThumb"
                :alt="titleFinal"
                style="width:100%; border-radius:16px; border:1px solid var(--line);"
              />
            </div>

            <div style="flex:1; min-width: 260px;">
              <h1 style="margin:0 0 8px;">{{ titleFinal }}</h1>

              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
                <span class="pill" v-if="meal.strArea">Кухня: {{ meal.strArea }}</span>
                <span class="pill" v-if="meal.strCategory">Категорія: {{ meal.strCategory }}</span>
                <a class="pill" v-if="meal.strYoutube" :href="meal.strYoutube" target="_blank" rel="noreferrer">
                  Відео на YouTube
                </a>
                <span class="pill" v-if="translating">Перекладаю…</span>
              </div>

              <div class="card card--soft" style="box-shadow:none;">
                <div class="card__pad">
                  <div class="kcal">
                    <div>
                      <div class="muted">Орієнтовна калорійність (сума інгредієнтів)</div>
                      <div class="kcal__big">{{ kcalTotal ?? '—' }} ккал</div>
                    </div>
                    <button class="btn primary" :disabled="kcalLoading" @click="calcKcal">
                      {{ kcalLoading ? 'Рахую…' : 'Порахувати' }}
                    </button>
                  </div>

                  <div class="kcal__note" style="margin-top:8px;">
                    <span v-if="!hasKey">
                      Порада: додай <b>VITE_FDC_API_KEY</b> у файл <b>.env</b>, щоб точніше підтягувати калорії з USDA FDC.
                    </span>
                    <span v-else>
                      Джерело: USDA FoodData Central (Energy kcal) + fallback‑словник.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="sep"></div>

          <div class="grid">
            <section class="card">
              <div class="card__pad">
                <h2 style="margin:0 0 8px;">Інгредієнти</h2>
                <div class="muted" style="margin-bottom:10px;">
                  (Кількості з TheMealDB; грами можуть бути не вказані — тоді калорії приблизні.)
                </div>

                <ul style="margin:0; padding-left:18px;">
                  <li v-for="(it, idx) in ingredientsFinal" :key="idx" style="margin:6px 0;">
                    <b>{{ it.name }}</b>
                    <span class="muted" v-if="it.measure"> — {{ measureUa(it.measure) }}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section class="card">
              <div class="card__pad">
                <h2 style="margin:0 0 8px;">Приготування</h2>
                <p style="margin:0; white-space:pre-wrap; line-height:1.6;">
                  {{ instructionsFinal }}
                </p>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { lookupMeal, extractIngredients } from '../services/mealdb'
import { estimateKcalForIngredient, tryParseGrams, hasFdcKey as _hasKey } from '../services/fdc'
import { translateIngredientsList, translateInstructions, translateMealTitle, translateIngredient } from '../i18n/ua'
import { isFavorite, toggleFavorite } from '../services/storage'
import { translateText, translateTextLong, translateLines } from '../services/translate'

const props = defineProps({ id: String })

const meal = ref(null)
const ingredients = ref([])
const loading = ref(false)
const error = ref('')

const kcalTotal = ref(null)
const kcalLoading = ref(false)
const hasKey = _hasKey()

const fav = ref(false)

// офлайн-версії (словник)
const ingredientsUaOffline = computed(() => translateIngredientsList(ingredients.value))
const instructionsUaOffline = computed(() => translateInstructions(meal.value?.strInstructions || ''))
const titleUaOffline = computed(() => translateMealTitle(meal.value?.strMeal || ''))

// онлайн-переклад (кешується); якщо недоступний — лишається офлайн
const translating = ref(false)
const titleUaOnline = ref('')
const instructionsUaOnline = ref('')
const ingMapOnline = ref({})

const titleFinal = computed(() => (titleUaOnline.value || titleUaOffline.value || (meal.value?.strMeal || '')))
const instructionsFinal = computed(() => (instructionsUaOnline.value || instructionsUaOffline.value || (meal.value?.strInstructions || '')))
const ingredientsFinal = computed(() => {
  const list = ingredientsUaOffline.value || []
  return list.map(it => ({
    ...it,
    name: ingMapOnline.value[it._srcName || it.name] || it.name
  }))
})

onMounted(async () => {
  loading.value = true
  try{
    meal.value = await lookupMeal(props.id)
    ingredients.value = meal.value ? extractIngredients(meal.value).map(x => ({...x, _srcName: x.name })) : []
    fav.value = meal.value ? isFavorite(meal.value.idMeal) : false

    // Паралельно перекладаємо онлайн, щоб було "повністю" українською
    translating.value = true
    const tasks = []

    if (meal.value?.strMeal){
      tasks.push(
        translateText(meal.value.strMeal, 'en', 'uk').then(t => {
          // якщо переклад відрізняється від оригіналу — застосуємо
          titleUaOnline.value = t && t.trim() ? t.trim() : ''
        })
      )
    }

    if (meal.value?.strInstructions){
      tasks.push(
        translateTextLong(meal.value.strInstructions, 'en', 'uk').then(t => {
          instructionsUaOnline.value = t && t.trim() ? t.trim() : ''
        })
      )
    }

    const names = ingredients.value.map(x => x.name).filter(Boolean)
    tasks.push(
      translateLines(names, 'en', 'uk').then(map => {
        ingMapOnline.value = map || {}
      })
    )

    await Promise.allSettled(tasks)
  }catch(e){
    error.value = e?.message || 'Помилка завантаження рецепта.'
  }finally{
    loading.value = false
    translating.value = false
  }
})

function toggleFav(){
  if (!meal.value) return
  toggleFavorite(meal.value)
  fav.value = isFavorite(meal.value.idMeal)
}

function measureUa(measure){
  let m = (measure || '').toString()
  m = m.replace(/ml/gi, ' мл').replace(/tbsp/gi, ' ст. л.').replace(/tsp/gi, ' ч. л.').replace(/pinch/gi, 'дрібка')
  const parts = m.split(' ').filter(Boolean)
  if (parts.length >= 2){
    const last = parts[parts.length-1]
    const tr = translateIngredient(last)
    parts[parts.length-1] = tr.toLowerCase()
    m = parts.join(' ')
  }
  return m.trim()
}

async function calcKcal(){
  kcalLoading.value = true
  kcalTotal.value = null

  try{
    const tasks = ingredients.value.map(async it => {
      const grams = tryParseGrams(it.measure)
      const { kcalPer100g } = await estimateKcalForIngredient(it.name)

      if (!kcalPer100g) return 0
      if (grams != null) return (kcalPer100g * grams) / 100
      return kcalPer100g
    })

    const results = await Promise.all(tasks)
    const total = results.reduce((a,b) => a + b, 0)

    kcalTotal.value = total ? Math.round(total) : null
  }catch(e){
    kcalTotal.value = null
  }finally{
    kcalLoading.value = false
  }
}


</script>
