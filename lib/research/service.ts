import type {ProviderHealth,ProviderName,ResearchRequest,ResearchRun,ResearchSource} from './types'
import {tavilySearch} from './providers/tavily'
import {firecrawlSearch} from './providers/firecrawl'
import {exaSearch} from './providers/exa'

const adapters:{[K in ProviderName]:(x:ResearchRequest)=>Promise<ResearchSource[]>}={tavily:tavilySearch,firecrawl:firecrawlSearch,exa:exaSearch}
export function providerHealth():ProviderHealth[]{
  return (Object.keys(adapters) as ProviderName[]).map(provider=>{
    const env=provider==='tavily'?'TAVILY_API_KEY':provider==='firecrawl'?'FIRECRAWL_API_KEY':'EXA_API_KEY'
    return {provider,configured:!!process.env[env],status:process.env[env]?'ready':'missing_key'}
  })
}
export async function runResearch(input:ResearchRequest):Promise<ResearchRun>{
  const start=new Date()
  const requested:ProviderName[]=input.mode==='max'?['tavily','exa','firecrawl']:['tavily','exa']
  const configured=requested.filter(p=>providerHealth().find(x=>x.provider===p)?.configured)
  const sources:ResearchSource[]=[];const errors:string[]=[]
  await Promise.all(configured.map(async p=>{try{sources.push(...await adapters[p](input))}catch(e){errors.push(`${p}: ${e instanceof Error?e.message:'unknown error'}`)}}))
  const map=new Map<string,ResearchSource>()
  for(const s of sources){const key=s.url.replace(/#.*$/,'').replace(/\/$/,'');if(!map.has(key))map.set(key,{...s,url:key})}
  const merged=[...map.values()].slice(0,30)
  return {id:`run_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,query:input.query,mode:input.mode??'normal',
    startedAt:start.toISOString(),completedAt:new Date().toISOString(),status:merged.length?(errors.length?'partial':'completed'):'failed',
    providers:configured,sources:merged,error:errors.length?errors.join(' | '):undefined}
}
