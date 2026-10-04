import type {ResearchSource} from '../research/types'
import {clusterDescription,clusterKey,clusterName,momentum,normalizeSource} from './engine'
import {createProcessingRun,finishProcessingRun,insertSignal,researchSources,signalByHash,upsertCluster,upsertEntity,upsertMembership,recentSignals} from './storage'

async function embed(text:string):Promise<number[]|null>{
 const key=process.env.OPENAI_API_KEY;if(!key)return null
 const r=await fetch('https://api.openai.com/v1/embeddings',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'text-embedding-3-small',input:text.slice(0,8000)})})
 if(!r.ok)throw new Error('Embedding provider '+r.status)
 const j=await r.json();return j.data?.[0]?.embedding||null
}
function uniq<T>(v:T[]){return [...new Set(v)]}
export async function ingestSignals(opts:{limit?:number;sourceRunId?:string}){
 const runId='signal_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);await createProcessingRun(runId,opts.sourceRunId||null)
 let created=0,deduped=0,clusterCount=0,embedded=0
 try{
  const raw=await researchSources(opts.limit||100) as any[]
  const selected=opts.sourceRunId?raw.filter(x=>x.run_id===opts.sourceRunId):raw
  const batch=selected.slice(0,Math.min(opts.limit||100,200))
  const affected=new Set<string>()
  for(const row of batch){
   const src:ResearchSource={provider:row.provider,url:row.url,title:row.title||undefined,snippet:row.snippet||undefined,content:row.content||undefined,publishedAt:row.published_at||null,score:row.score==null?null:Number(row.score),raw:row.raw_json}
   const n=normalizeSource(src,row.run_id)
   const existing=await signalByHash(n.contentHash) as any
   let signal:any
   if(existing){
    deduped++;signal=await (async()=>{const {updateSignal}=await import('./storage');const r=await updateSignal(existing.id,{occurrence_count:Number(existing.occurrence_count||1)+1,last_seen_at:new Date().toISOString(),demand_score:Math.max(Number(existing.demand_score||0),n.demandScore),pain_intensity:Math.max(Number(existing.pain_intensity||0),n.painIntensity)});return r||existing})()
   }else{
    let vector:number[]|null=null
    if(process.env.OPENAI_API_KEY){try{vector=await embed(n.normalizedText);if(vector)embedded++}catch{vector=null}}
    signal=await insertSignal({...n,embedding:vector}) as any;created++
   }
   affected.add(clusterKey({...signal,metadata:signal.metadata||n.metadata}))
   await upsertEntity(signal.entityName||signal.entityDomain||'Unknown',signal.entityDomain,signal.id)
  }
  const signals=await recentSignals(1000) as any[]
  const now=Date.now(),week=7*24*60*60*1000
  for(const key of affected){
   const members=signals.filter(s=>clusterKey({signalType:s.signal_type,industry:s.industry,metadata:s.metadata||{painTag:'Operational friction'}})===key)
   if(!members.length)continue
   const current=members.filter(s=>now-new Date(s.last_seen_at).getTime()<=week).length
   const previous=members.filter(s=>{const age=now-new Date(s.last_seen_at).getTime();return age>week&&age<=week*2}).length
   const sample=members[0], avg=(field:string)=>members.reduce((a,s)=>a+Number(s[field]||0),0)/members.length
   const mk=momentum(current,previous)
   const inds=uniq(members.map(s=>s.industry).filter(Boolean) as string[]), auds=uniq(members.map(s=>s.audience).filter(Boolean) as string[])
   const cluster=await upsertCluster({cluster_key:key,name:clusterName({metadata:sample.metadata||{},industry:sample.industry,audience:sample.audience}),description:clusterDescription({metadata:sample.metadata||{},industry:sample.industry,audience:sample.audience}),signal_count:members.length,evidence_count:uniq(members.map(s=>s.source_url)).length,momentum_score:mk,pain_score:Math.round(avg('pain_intensity')),demand_score:Math.round(avg('demand_score')),confidence:Math.round(avg('classification_confidence')),industries:inds,audiences:auds,status:members.length>=3?'emerging':'watch',last_updated_at:new Date().toISOString()})
   clusterCount++
   const slice=members.slice(0,50);for(const s of slice){await upsertMembership(cluster.id,s.id,1)}
  }
  await finishProcessingRun(runId,{processed_sources:batch.length,created_signals:created,deduped_signals:deduped,clusters_updated:clusterCount,embeddings_created:embedded})
  return {runId,processedSources:batch.length,createdSignals:created,dedupedSignals:deduped,clustersUpdated:clusterCount,embeddingsCreated:embedded}
 }catch(error){await finishProcessingRun(runId,{error:error instanceof Error?error.message:'Signal processing failed',created_signals:created,deduped_signals:deduped,clusters_updated:clusterCount,embeddings_created:embedded});throw error}
}
