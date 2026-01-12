
/**
 * Словниковий переклад EN->UA (офлайн) для курсової.
 * Заміни робляться по цілих словах/фразах (RegExp), щоб не було артефактів.
 */

const ING_MAP = {
  "flour": "борошно",
  "wholegrain": "цільнозерновий",
  "spelt": "полба",
  "butter": "вершкове масло",
  "egg": "яйце",
  "eggs": "яйця",
  "salt": "сіль",
  "pepper": "перець",
  "milk": "молоко",
  "cheese": "сир",
  "parmesan": "пармезан",
  "parmesan cheese": "сир пармезан",
  "cream cheese": "крем‑сир",
  "tomato": "помідор",
  "tomatoes": "помідори",
  "plum tomatoes": "сливові помідори",
  "mini tomatoes": "помідори чері",
  "vinegar": "оцет",
  "white vinegar": "білий оцет",
  "honey": "мед",
  "basil": "базилік",
  "olive oil": "оливкова олія",
  "oil": "олія",
  "nutmeg": "мускатний горіх",
  "soy sauce": "соєвий соус",
  "mayonnaise": "майонез",
  "sriracha": "соус шрірача",
  "rice": "рис",
  "onion": "цибуля",
  "garlic": "часник",
  "cucumber": "огірок",
  "carrot": "морква",
  "carrots": "морква",
  "beef": "яловичина",
  "ground beef": "яловичий фарш",
  "pork": "свинина",
  "chicken": "курка",
}

const MEASURE_MAP = {
  "pinch": "дрібка",
  "topping": "для подачі",
  "tbsp": "ст. л.",
  "tsp": "ч. л.",
  "cup": "склянка",
  "cups": "склянки",
  "ml": "мл",
  "g": "г",
}

const PHRASE_MAP = {
  "bring to a boil": "доведіть до кипіння",
  "reduce heat": "зменште вогонь",
  "in the meantime": "тим часом",
  "in the mean time": "тим часом",
  "pour over": "полийте",
  "pour in": "вилийте",
  "take out": "дістаньте",
  "avoid too much liquid": "уникайте зайвої рідини",
  "decorate with": "прикрасіть",
  "press it into": "втисніть у",
  "put it in the fridge": "поставте в холодильник",
  "prick the bottom": "наколіть дно",
  "with a fork": "виделкою",
  "with a spoon": "ложкою",
  "season with": "приправте",
  "mix well": "добре перемішайте",
  "stir well": "добре перемішайте",
  "degrees c": "°C",
}

const WORD_MAP = {
  "add": "додайте",
  "place": "покладіть",
  "put": "покладіть",
  "wash": "помийте",
  "rinse": "промийте",
  "dry": "висушіть",
  "peel": "очистіть",
  "chop": "подрібніть",
  "slice": "наріжте",
  "mix": "змішайте",
  "combine": "змішайте",
  "stir": "перемішайте",
  "cook": "готуйте",
  "cover": "накрийте",
  "until": "поки",
  "ready": "готово",
  "serve": "подавайте",
  "meanwhile": "тим часом",
  "bake": "випікайте",
  "dough": "тісто",
  "crust": "основа",
  "filling": "начинка",
  "grated": "тертий",
  "the": "",
}

const TITLE_PHRASES = {
  // кілька типових фраз у назвах
  "chicken": "курка",
  "beef": "яловичина",
  "pork": "свинина",
  "fish": "риба",
  "rice": "рис",
  "salad": "салат",
  "soup": "суп",
  "pizza": "піца",
  "pasta": "паста",
  "cake": "торт",
  "bread": "хліб",
  "pie": "пиріг",
  "cookies": "печиво",
  "cookie": "печиво",
  "with": "з",
  "and": "та",
  "in": "у",
  "of": "",
}

function norm(s){
  return (s || '').toString().trim()
}

function escapeRegExp(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceBounded(text, from, to){
  const re = new RegExp(`(^|[^A-Za-z])${escapeRegExp(from)}([^A-Za-z]|$)`, 'gi')
  return text.replace(re, (m, p1, p2) => `${p1}${to}${p2}`)
}

function replacePhrase(text, from, to){
  const re = new RegExp(`(^|[^A-Za-z])${escapeRegExp(from)}([^A-Za-z]|$)`, 'gi')
  return text.replace(re, (m, p1, p2) => `${p1}${to}${p2}`)
}

function cap(s){
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function smartCapLine(s){
  const str = (s || '').trim()
  if (!str) return ''
  const m = str.match(/^([0-9]+\.?\s*)(.*)$/)
  if (m){
    return m[1] + cap(m[2])
  }
  return cap(str)
}

export function translateIngredient(name){
  const raw = norm(name)
  if (!raw) return name
  let t = raw

  const ingKeys = Object.keys(ING_MAP).sort((a,b)=> b.length - a.length)
  for (const k of ingKeys){
    t = replacePhrase(t, k, ING_MAP[k])
  }

  const mKeys = Object.keys(MEASURE_MAP).sort((a,b)=> b.length - a.length)
  for (const k of mKeys){
    t = replaceBounded(t, k, MEASURE_MAP[k])
  }

  return smartCapLine(t)
}

export function translateIngredientsList(list){
  return (list || []).map(it => ({ ...it, name: translateIngredient(it.name) }))
}

export function translateInstructions(text){
  if (!text) return ''
  const parts = String(text).split(/\n+/)
  const out = parts.map(p => translateLine(p))
  return out.join('\n\n').trim()
}

function translateLine(line){
  let t = (line || '').toString().trim()
  if (!t) return ''

  const phraseKeys = Object.keys(PHRASE_MAP).sort((a,b)=> b.length - a.length)
  for (const k of phraseKeys){
    t = replacePhrase(t, k, PHRASE_MAP[k])
  }

  const ingKeys = Object.keys(ING_MAP).sort((a,b)=> b.length - a.length)
  for (const k of ingKeys){
    t = replacePhrase(t, k, ING_MAP[k])
  }

  const wordKeys = Object.keys(WORD_MAP).sort((a,b)=> b.length - a.length)
  for (const k of wordKeys){
    t = replaceBounded(t, k, WORD_MAP[k])
  }

  const mKeys = Object.keys(MEASURE_MAP).sort((a,b)=> b.length - a.length)
  for (const k of mKeys){
    t = replaceBounded(t, k, MEASURE_MAP[k])
  }

  t = t.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').trim()
  return smartCapLine(t)
}

export function translateMealTitle(title){
  // Легкий словниковий переклад назв страв (без сторонніх API)
  if (!title) return ''
  let t = String(title).trim()
  let low = t.toLowerCase()

  const keys = Object.keys(TITLE_PHRASES).sort((a,b)=> b.length - a.length)
  for (const k of keys){
    low = replaceBounded(low, k, TITLE_PHRASES[k])
  }
  low = low.replace(/\s{2,}/g, ' ').trim()

  // зробимо кожне слово з великої (для заголовків)
  return low.split(' ').filter(Boolean).map(w => cap(w)).join(' ')
}
