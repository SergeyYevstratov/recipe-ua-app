const BASE = 'https://www.themealdb.com/api/json/v1/1'

// TheMealDB здебільшого очікує інгредієнти англійською.
// Робимо невеликий словник UA->EN (для курсової достатньо).
const UA_TO_EN = {
  'курка': 'chicken',
  'курятина': 'chicken',
  'яйце': 'egg',
  'яйця': 'eggs',
  'рис': 'rice',
  'помідор': 'tomato',
  'томат': 'tomato',
  'картопля': 'potato',
  'цибуля': 'onion',
  'часник': 'garlic',
  'сир': 'cheese',
  'молоко': 'milk',
  'масло': 'butter',
  'макарони': 'pasta',
  'яловичина': 'beef',
  'свинина': 'pork',
  'риба': 'fish',
  'морква': 'carrot',
  'огірок': 'cucumber',
  'капуста': 'cabbage',
  'перець': 'pepper',
  'олія': 'oil',
  'борошно': 'flour',
  'цукор': 'sugar',
  'сіль': 'salt'
}

function norm(s){
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function normalizeIngredientForApi(userValue){
  const v = norm(userValue)
  return UA_TO_EN[v] || v
}

export async function filterByIngredient(userIngredient){
  const ing = encodeURIComponent(normalizeIngredientForApi(userIngredient))
  const r = await fetch(`${BASE}/filter.php?i=${ing}`)
  if (!r.ok) throw new Error('Не вдалося отримати список рецептів')
  const data = await r.json()
  return data.meals || []
}

export async function lookupMeal(id){
  const r = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`)
  if (!r.ok) throw new Error('Не вдалося отримати деталі рецепта')
  const data = await r.json()
  return (data.meals && data.meals[0]) ? data.meals[0] : null
}

export function extractIngredients(meal){
  const out = []
  for (let i=1;i<=20;i++){
    const ing = (meal[`strIngredient${i}`] || '').trim()
    const meas = (meal[`strMeasure${i}`] || '').trim()
    if (!ing) continue
    out.push({ name: ing, measure: meas })
  }
  return out
}

export function rankMealsByMatches(lists){
  // Замість "жорсткого" перетину робимо рейтинг:
  // скільки разів рецепт зустрівся серед інгредієнтів (1..N).
  const counts = new Map() // idMeal -> { meal, count }
  for (const list of lists){
    for (const m of list){
      const cur = counts.get(m.idMeal)
      if (cur) cur.count += 1
      else counts.set(m.idMeal, { meal: m, count: 1 })
    }
  }
  return Array.from(counts.values())
    .sort((a,b) => b.count - a.count)
    .map(x => ({ ...x.meal, _matchCount: x.count }))
}
