const CACHE_KEY = 'recipeua_translate_cache_v1'

function loadCache(){
  try{ return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }catch{ return {} }
}
function saveCache(cache){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) }catch{}
}
function cacheKey(text, from, to){
  return `${from}|${to}|${text}`
}

/**
 * Переклад EN->UK через безкоштовний онлайн-сервіс з кешуванням.
 * ВАЖЛИВО: сервіс має ліміт довжини запиту, тому довгі тексти перекладаємо частинами.
 */
export async function translateText(text, from='en', to='uk'){
  const t = (text || '').toString().trim()
  if (!t) return ''
  const cache = loadCache()
  const key = cacheKey(t, from, to)
  if (cache[key]) return cache[key]

  try{
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${from}|${to}`
    const r = await fetch(url)
    if (!r.ok) throw new Error('translate http')
    const data = await r.json()
    const out = data?.responseData?.translatedText
    if (typeof out === 'string' && out.trim()){
      cache[key] = out.trim()
      saveCache(cache)
      return cache[key]
    }
  }catch(e){
    // ignore
  }
  return t
}

// Розбиває довгий текст на шматки <= limit, намагаючись ділити по реченнях/переносах.
function chunkText(text, limit=450){
  const t = (text || '').toString()
  const blocks = t.split(/\n\n+/) // абзаци
  const chunks = []

  for (const b of blocks){
    const s = b.trim()
    if (!s) continue

    if (s.length <= limit){
      chunks.push(s)
      continue
    }

    // розбиваємо на речення
    const sentences = s.split(/(?<=[.!?])\s+/)
    let cur = ''
    for (const sent of sentences){
      if (!sent) continue
      if ((cur + ' ' + sent).trim().length <= limit){
        cur = (cur ? cur + ' ' : '') + sent
      }else{
        if (cur) chunks.push(cur.trim())
        // якщо саме речення занадто довге — ріжемо по limit
        if (sent.length > limit){
          for (let i=0;i<sent.length;i+=limit){
            chunks.push(sent.slice(i, i+limit))
          }
          cur = ''
        }else{
          cur = sent
        }
      }
    }
    if (cur) chunks.push(cur.trim())
  }

  return chunks
}

export async function translateTextLong(text, from='en', to='uk'){
  const t = (text || '').toString().trim()
  if (!t) return ''
  const cache = loadCache()
  const key = cacheKey(`LONG:${t}`, from, to)
  if (cache[key]) return cache[key]

  const chunks = chunkText(t, 450)
  const translatedChunks = []
  for (const ch of chunks){
    const tr = await translateText(ch, from, to)
    translatedChunks.push(tr)
  }

  const joined = translatedChunks.join('\n\n').trim()
  cache[key] = joined
  saveCache(cache)
  return joined
}

export async function translateLines(lines, from='en', to='uk'){
  const uniq = Array.from(new Set((lines || []).map(x => (x||'').toString().trim()).filter(Boolean)))
  if (!uniq.length) return {}

  const result = {}
  const chunk = []
  let size = 0

  async function flush(){
    if (!chunk.length) return
    const joined = chunk.join('\n')
    const tr = await translateText(joined, from, to)
    const outLines = String(tr).split(/\n/)

    for (let i=0;i<chunk.length;i++){
      const src = chunk[i]
      const dst = outLines[i] || src
      result[src] = dst
    }
    chunk.length = 0
    size = 0
  }

  for (const s of uniq){
    if (size + s.length + 1 > 450){
      await flush()
    }
    chunk.push(s)
    size += s.length + 1
  }
  await flush()
  return result
}
