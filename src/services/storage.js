const K_FAV = 'recipeua_favorites_v1'
const K_HIST = 'recipeua_history_v1'

function safeParse(json, fallback){
  try{ return JSON.parse(json) }catch{ return fallback }
}

export function getFavorites(){
  return safeParse(localStorage.getItem(K_FAV) || '[]', [])
}

export function isFavorite(idMeal){
  return getFavorites().some(x => x.idMeal === idMeal)
}

export function toggleFavorite(meal){
  const list = getFavorites()
  const idx = list.findIndex(x => x.idMeal === meal.idMeal)
  if (idx >= 0){
    list.splice(idx, 1)
  }else{
    list.unshift({
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strMealThumb: meal.strMealThumb
    })
  }
  localStorage.setItem(K_FAV, JSON.stringify(list.slice(0, 200)))
  return list
}

export function getHistory(){
  return safeParse(localStorage.getItem(K_HIST) || '[]', [])
}

export function pushHistory(query){
  const q = (query || '').trim()
  if (!q) return getHistory()
  const list = getHistory().filter(x => x.toLowerCase() !== q.toLowerCase())
  list.unshift(q)
  const cut = list.slice(0, 10)
  localStorage.setItem(K_HIST, JSON.stringify(cut))
  return cut
}

export function clearHistory(){
  localStorage.removeItem(K_HIST)
}
