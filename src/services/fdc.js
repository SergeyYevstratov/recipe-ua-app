const BASE = 'https://api.nal.usda.gov/fdc/v1'

// Мінімальний офлайн-словничок (ккал на 100 г) як fallback
const FALLBACK_KCAL_100G = {
  'egg': 155, 'eggs': 155, 'яйце': 155,
  'chicken': 165, 'курка': 165, 'курятина': 165,
  'rice': 130, 'рис': 130,
  'tomato': 18, 'помідор': 18, 'томат': 18,
  'potato': 77, 'картопля': 77,
  'onion': 40, 'цибуля': 40,
  'garlic': 149, 'часник': 149,
  'cheese': 402, 'сир': 402,
  'milk': 42, 'молоко': 42,
  'butter': 717, 'масло': 717,
  'pasta': 131, 'макарони': 131,
  'beef': 250, 'яловичина': 250,
  'pork': 242, 'свинина': 242,
  'fish': 206, 'риба': 206
}

function getKey(){
  return import.meta.env.VITE_FDC_API_KEY || ''
}

export function hasFdcKey(){
  return !!getKey()
}

export async function estimateKcalForIngredient(name){
  // Повертає: { kcalPer100g, source: 'FDC' | 'fallback' }
  const key = getKey()
  if (!key){
    const v = (name || '').trim().toLowerCase()
    const kcal = FALLBACK_KCAL_100G[v] ?? null
    return { kcalPer100g: kcal, source: 'fallback' }
  }

  // 1) пошук
  const q = encodeURIComponent(name)
  const searchUrl = `${BASE}/foods/search?query=${q}&pageSize=1&api_key=${encodeURIComponent(key)}`
  const sr = await fetch(searchUrl)
  if (!sr.ok){
    return { kcalPer100g: null, source: 'FDC' }
  }
  const sdata = await sr.json()
  const first = (sdata.foods && sdata.foods[0]) ? sdata.foods[0] : null
  if (!first) return { kcalPer100g: null, source: 'FDC' }

  // 2) деталі
  const detailsUrl = `${BASE}/food/${first.fdcId}?api_key=${encodeURIComponent(key)}`
  const dr = await fetch(detailsUrl)
  if (!dr.ok){
    return { kcalPer100g: null, source: 'FDC' }
  }
  const d = await dr.json()

  // Шукаємо "Energy" в kcal
  const nutrients = d.foodNutrients || []
  const energy = nutrients.find(n =>
    (n.nutrient && String(n.nutrient.name).toLowerCase() === 'energy' && String(n.nutrient.unitName).toLowerCase() === 'kcal')
  )

  const kcal = energy ? Number(energy.amount) : null
  // amount часто вже "per 100g" (залежить від foodPortions/serving size), але для курсової ок як орієнтир.
  return { kcalPer100g: Number.isFinite(kcal) ? kcal : null, source: 'FDC' }
}

export function tryParseGrams(measure){
  // Дуже грубо: витягуємо число з рядка і якщо є "g/гр" — це грами.
  const m = (measure || '').toLowerCase()
  const num = Number((m.match(/([0-9]+([\.,][0-9]+)?)/)?.[1] || '').replace(',', '.'))
  if (!Number.isFinite(num)) return null
  if (m.includes('g') || m.includes('гр')) return num
  return null
}
