import type {ResearchRequest,ResearchSource} from '../types'
export async function firecrawlSearch(input:ResearchRequest):Promise<ResearchSource[]> {
  const key=process.env.FIRECRAWL_API_KEY
  if(!key) throw new Error('FIRECRAWL_API_KEY is not configured')
  const r=await fetch('https://api.firecrawl.dev/v2/search',{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
    body:JSON.stringify({query:input.query,limit:Math.min(input.maxResults??6,10),
      sources:[{type:'web'}],scrapeOptions:{formats:['markdown'],onlyMainContent:true}}),cache:'no-store'})
  if(!r.ok) throw new Error(`Firecrawl ${r.status}`)
  const j=await r.json() as {data?:Array<Record<string,unknown>>,results?:Array<Record<string,unknown>>}
  return (j.data??j.results??[]).map(x=>({
    provider:'firecrawl' as const,url:String(x.url??x.sourceURL??''),title:x.title?String(x.title):undefined,
    snippet:x.description?String(x.description):x.markdown?String(x.markdown).slice(0,700):undefined,
    content:x.markdown?String(x.markdown):undefined,publishedAt:x.publishedDate?String(x.publishedDate):null,raw:x
  })).filter(x=>x.url)
}

