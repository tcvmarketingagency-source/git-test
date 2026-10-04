import type {ResearchRequest,ResearchSource} from '../types'
export async function tavilySearch(input:ResearchRequest):Promise<ResearchSource[]> {
  const key=process.env.TAVILY_API_KEY
  if(!key) throw new Error('TAVILY_API_KEY is not configured')
  const r=await fetch('https://api.tavily.com/search',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({api_key:key,query:input.query,search_depth:input.mode==='normal'?'basic':'advanced',
      topic:'general',max_results:Math.min(input.maxResults??8,10),include_answer:false,
      include_raw_content:input.mode!=='normal'}),cache:'no-store'})
  if(!r.ok) throw new Error(`Tavily ${r.status}`)
  const j=await r.json() as {results?:Array<Record<string,unknown>>}
  return (j.results??[]).map(x=>({
    provider:'tavily' as const,url:String(x.url??''),title:x.title?String(x.title):undefined,
    snippet:x.content?String(x.content):undefined,content:x.raw_content?String(x.raw_content):undefined,
    publishedAt:x.published_date?String(x.published_date):null,
    score:typeof x.score==='number'?x.score:null,raw:x
  })).filter(x=>x.url)
}

