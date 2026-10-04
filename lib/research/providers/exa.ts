import type {ResearchRequest,ResearchSource} from '../types'
export async function exaSearch(input:ResearchRequest):Promise<ResearchSource[]> {
  const key=process.env.EXA_API_KEY
  if(!key) throw new Error('EXA_API_KEY is not configured')
  const r=await fetch('https://api.exa.ai/search',{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
    body:JSON.stringify({query:input.query,type:input.mode==='normal'?'auto':'neural',numResults:Math.min(input.maxResults??8,10),
      contents:{text:{maxCharacters:input.mode==='normal'?5000:12000}}}),cache:'no-store'})
  if(!r.ok) throw new Error(`Exa ${r.status}`)
  const j=await r.json() as {results?:Array<Record<string,unknown>>}
  return (j.results??[]).map(x=>({
    provider:'exa' as const,url:String(x.url??''),title:x.title?String(x.title):undefined,
    snippet:x.text?String(x.text).slice(0,800):undefined,content:x.text?String(x.text):undefined,
    publishedAt:x.publishedDate?String(x.publishedDate):null,score:typeof x.score==='number'?x.score:null,raw:x
  })).filter(x=>x.url)
}

