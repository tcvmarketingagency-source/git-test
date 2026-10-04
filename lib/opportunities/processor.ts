import {buildOpportunity,founderFitFromEnv,scoreRationales} from './engine'
import {allClusterMembers,competitors,createRun,evidenceRows,finishRun,linkEvidence,marketEvents,opportunityClusters,upsertOpportunity,upsertScore} from './storage'

export async function processOpportunityRadar(limit=100){
 const runId='opp_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);await createRun(runId)
 let created=0,updated=0,evidenceLinks=0
 try{
  const [clusters,members,events,competition,evidence]=await Promise.all([opportunityClusters(limit),allClusterMembers(5000),marketEvents(200),competitors(200),evidenceRows(2000)]) as [any[],any[],any[],any[],any[]]
  const byCluster=new Map<number,any[]>();for(const m of members){const k=Number(m.cluster_id);if(!byCluster.has(k))byCluster.set(k,[]);byCluster.get(k)!.push(m)}
  const founderFit=founderFitFromEnv()
  for(const cluster of clusters){
   const cm=byCluster.get(Number(cluster.id))||[];if(!cm.length)continue
   const opportunity=buildOpportunity(cluster,cm,events,competition,evidence,founderFit)
   const saved=await upsertOpportunity({...opportunity,updated_at:new Date().toISOString()}) as any
   if(saved)updated++;
   for(const score of scoreRationales(opportunity)){await upsertScore({opportunity_id:saved.id,dimension:score.dimension,score:score.score,rationale:score.rationale,evidence_count:opportunity.evidence_count})}
   const ids=new Set(cm.map((m:any)=>Number(m.signal_id)));const linked=evidence.filter((e:any)=>ids.has(Number(e.signal_id))).slice(0,30)
   for(const e of linked){await linkEvidence({opportunity_id:saved.id,evidence_id:e.id,relation:e.evidence_score>=75?'supports':'context',weight:Number(e.evidence_score||0)/100});evidenceLinks++}
  }
  await finishRun(runId,{clusters_processed:clusters.length,opportunities_created:created,opportunities_updated:updated,evidence_links:evidenceLinks})
  return {runId,clustersProcessed:clusters.length,opportunitiesCreated:created,opportunitiesUpdated:updated,evidenceLinks,founderFitConfigured:founderFit!==null}
 }catch(e){await finishRun(runId,{error:e instanceof Error?e.message:'Opportunity processing failed',opportunities_created:created,opportunities_updated:updated,evidence_links:evidenceLinks});throw e}
}