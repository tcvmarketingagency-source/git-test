import {providerHealth as researchProviders,runResearch} from '../research/service'
import {persistResearch} from '../research/storage'
import {processMarketIntelligence} from '../market/processor'
import {processOpportunityRadar} from '../opportunities/processor'
import {generateDailySnapshot,isoDateIST} from '../founder-memory/engine'
import {prepareExecution} from '../execution/engine'
import {productDetail,generateProductFromOpportunity} from '../product-factory/engine'
import {configured as costConfigured,summary as costSummary} from '../cost/storage'
import * as db from './storage'

export const AUTONOMY_STEPS=[
  {key:'preflight',label:'System preflight'},
  {key:'research',label:'Research ingestion'},
  {key:'market_intelligence',label:'Market intelligence'},
  {key:'opportunity_radar',label:'Opportunity validation'},
  {key:'founder_brief',label:'Founder brief'},
  {key:'approval_gate',label:'Founder approval gate'},
  {key:'product_generation',label:'MVP generation'},
  {key:'execution_prepare',label:'Execution preparation'}
] as const

function runKey(){return 'auto_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function now(){return new Date().toISOString()}

export async function overview(founderKey='primary'){
  if(!db.configured())return{configured:false,policy:null,run:null,steps:[],candidates:[],events:[],message:'Supabase server credentials are not configured.'}
  const [policy,run,events,candidates]=await Promise.all([db.policy(founderKey),db.latestRun(founderKey),db.events(40),db.candidates(0,12)])
  const runSteps=run?await db.steps(run.run_key):[]
  return{configured:true,policy,run,steps:runSteps,candidates,events,providerHealth:researchProviders()}
}

export async function startRun(founderKey='primary',mode:'supervised'|'autonomous'='autonomous'){
  if(!db.configured())throw new Error('Supabase server credentials are not configured')
  const existing=await db.activeRun(founderKey)
  if(existing)return existing
  const key=runKey()
  const run=await db.createRun({run_key:key,founder_key:founderKey,mode,status:'queued',current_step:'preflight',metadata:{engine:'ventureos_autonomy_v1',started_by:'founder'},output:{}})
  await db.createSteps(AUTONOMY_STEPS.map((s,i)=>({run_key:key,step_key:s.key,order_index:i,status:'pending'})))
  await db.event({run_key:key,event_type:'run_started',stage:'preflight',message:'Autonomous loop started',payload:{mode}})
  return run
}

function findCurrent(rows:any[]){
  return rows.find(r=>r.status!=='completed'&&r.status!=='skipped')||null
}
function budgetReady(s:any,p:any){
  if(!p)return{ok:true,warning:null}
  const limit=Number(s?.monthlyBudget||0),consumed=Number(s?.consumed||0)
  if(limit<=0)return{ok:true,warning:'Cost OS has no active monthly budget; execution remains provider-gated.'}
  return{ok:consumed<limit*(Number(p.daily_budget_percent||25)/100)||consumed===0,warning:null}
}

async function executeStep(run:any,current:any,policy:any){
  const key=current.step_key
  await db.updateStep(run.run_key,key,{status:'running',started_at:now(),error:null,output:{}})
  await db.updateRun(run.run_key,{status:'running',current_step:key})
  try{
    let output:any={}
    if(key==='preflight'){
      const research=researchProviders()
      const configuredResearch=research.filter(x=>x.configured).map(x=>x.provider)
      let cost:any={configured:false,summary:null}
      if(costConfigured())cost=await costSummary()
      const budget=budgetReady(cost.summary,policy)
      output={supabase:db.configured(),researchProviders:research,configuredResearch,costState:cost.summary?.state||'unconfigured',budget,billingConfigured:cost.configured!==false,liveExecutionRequiresApproval:true}
      await db.event({run_key:run.run_key,event_type:'preflight',stage:key,message:configuredResearch.length?'Preflight passed with provider readiness checks':'Preflight complete; research providers require configuration',payload:output})
    }
    if(key==='research'){
      const health=researchProviders();const available=health.filter(x=>x.configured)
      if(!available.length){output={blocked:true,reason:'No research provider is configured',required:['TAVILY_API_KEY','EXA_API_KEY','FIRECRAWL_API_KEY']};await db.updateStep(run.run_key,key,{status:'blocked',output,completed_at:now(),error:'No research provider is configured'});await db.event({run_key:run.run_key,event_type:'blocked',stage:key,message:output.reason,payload:output});return output}
      const query=process.env.VENTUREOS_DAILY_QUERY||'What changed in AI, SaaS, automation, SMB software and emerging business problems in the last 24 hours?'
      const research=await runResearch({query,mode:'normal',maxResults:12})
      const persisted=await persistResearch(research)
      output={status:research.status,providers:research.providers,sources:research.sources.length,persisted,error:research.error||null}
      if(research.status==='failed')throw new Error(research.error||'Research returned no usable sources')
    }
    if(key==='market_intelligence'){
      if(!db.configured())throw new Error('Supabase is required for market intelligence')
      output=await processMarketIntelligence(750)
    }
    if(key==='opportunity_radar'){
      if(!db.configured())throw new Error('Supabase is required for Opportunity Radar')
      output=await processOpportunityRadar(120)
      const list=await db.candidates(Number(policy?.minimum_opportunity_score||75),Math.max(3,Number(policy?.max_products_per_run||1)*5))
      output={...output,candidates:list}
    }
    if(key==='founder_brief'){
      output=await generateDailySnapshot(run.founder_key,isoDateIST())
    }
    if(key==='approval_gate'){
      const list=await db.candidates(Number(policy?.minimum_opportunity_score||75),Math.max(3,Number(policy?.max_products_per_run||1)*5))
      const candidate=list[0]||null
      if(!candidate){
        output={waiting:false,candidates:[],reason:'No opportunity currently clears the configured score threshold.'}
      }else if(policy?.require_approval_for_product!==false){
        output={waiting:true,candidate,reason:'Founder approval is required before Product Factory generation.'}
        await db.updateStep(run.run_key,key,{status:'awaiting_approval',output,completed_at:null,error:null})
        await db.updateRun(run.run_key,{status:'awaiting_approval',selected_opportunity_id:candidate.id,output:{candidate}})
        await db.event({run_key:run.run_key,event_type:'approval_required',stage:key,message:'Founder approval is required before MVP generation',payload:{opportunity_id:candidate.id,title:candidate.title,score:candidate.overall_score}})
        return output
      }else{
        output={waiting:false,auto_approved:true,candidate}
        await db.updateRun(run.run_key,{selected_opportunity_id:candidate.id})
      }
    }
    if(key==='product_generation'){
      const opportunityId=Number(run.approved_opportunity_id||run.selected_opportunity_id||0)
      if(!opportunityId)throw new Error('No approved opportunity is attached to the run')
      const result=await generateProductFromOpportunity(opportunityId,run.founder_key)
      output={product_id:result.product?.id,product:result.product,artifacts:result.artifacts?.length||0,features:result.features?.length||0,run_id:result.runId}
    }
    if(key==='execution_prepare'){
      const opportunityId=Number(run.approved_opportunity_id||run.selected_opportunity_id||0)
      if(!opportunityId)throw new Error('No approved opportunity is attached to the run')
      const latestProduct=await db.productsForOpportunity(opportunityId)
      const p=latestProduct[0]
      if(!p)throw new Error('Product generation did not create a product')
      const exec=await prepareExecution(Number(p.id),'dry_run',run.founder_key)
      output={product_id:p.id,execution_run:exec,live_deployment:false,reason:'Phase 11 never bypasses the Phase 10 live execution approval boundary.'}
    }
    const doneStatus=output?.blocked?'blocked':'completed'
    await db.updateStep(run.run_key,key,{status:doneStatus,output,completed_at:doneStatus==='completed'||doneStatus==='blocked'?now():null})
    await db.event({run_key:run.run_key,event_type:doneStatus,stage:key,message:AUTONOMY_STEPS.find(s=>s.key===key)?.label||key,payload:{summary:output}})
    return output
  }catch(e){
    const message=e instanceof Error?e.message:String(e)
    await db.updateStep(run.run_key,key,{status:'failed',error:message,completed_at:now()})
    await db.event({run_key:run.run_key,event_type:'failed',stage:key,message,payload:{}})
    throw e
  }
}

export async function advanceRun(runKey:string){
  const run=await db.runByKey(runKey);if(!run)throw new Error('Autonomous run not found')
  if(run.status==='awaiting_approval')return overview(run.founder_key)
  const policy=await db.policy(run.founder_key)
  const rows=await db.steps(runKey)
  let current=findCurrent(rows)
  if(!current){
    await db.updateRun(runKey,{status:'completed',completed_at:now(),current_step:null})
    return overview(run.founder_key)
  }
  for(const previous of rows){
    if(previous.order_index<current.order_index&&previous.status!=='completed'&&previous.status!=='blocked'){
      throw new Error('Autonomous step blocked by '+previous.step_key)
    }
  }
  const result=await executeStep(run,current,policy)
  if(result?.waiting){
    return overview(run.founder_key)
  }
  const after=await db.steps(runKey)
  const failed=after.some((x:any)=>x.status==='failed')
  const blocked=after.some((x:any)=>x.status==='blocked')
  const complete=after.every((x:any)=>x.status==='completed'||x.status==='blocked')
  const next=failed?'partial':complete?'completed':'queued'
  if(next==='completed')await db.updateRun(runKey,{status:'completed',completed_at:now(),current_step:null})
  else await db.updateRun(runKey,{status:next})
  return overview(run.founder_key)
}

export async function approveOpportunity(runKey:string,opportunityId:number){
  const run=await db.runByKey(runKey);if(!run)throw new Error('Autonomous run not found')
  const candidate=await db.opportunity(opportunityId);if(!candidate)throw new Error('Opportunity not found')
  const threshold=Number((await db.policy(run.founder_key))?.minimum_opportunity_score||75)
  if(Number(candidate.overall_score||0)<threshold)throw new Error('Opportunity is below the current autonomous threshold')
  const rows=await db.steps(runKey)
  const gate=rows.find((x:any)=>x.step_key==='approval_gate')
  await db.updateRun(runKey,{approved_opportunity_id:opportunityId,selected_opportunity_id:opportunityId,status:'queued',current_step:'product_generation',metadata:{...(run.metadata||{}),approved_at:now()}})
  await db.updateStep(runKey,'approval_gate',{status:'completed',completed_at:now(),output:{approved:true,opportunity_id:opportunityId,title:candidate.title}})
  if(gate?.status==='awaiting_approval')await db.event({run_key:runKey,event_type:'approval_granted',stage:'approval_gate',message:'Founder approved opportunity for Product Factory generation',payload:{opportunity_id:opportunityId}})
  return advanceRun(runKey)
}

export async function schedulerTick(founderKey='primary'){
  const p=await db.policy(founderKey)
  if(!p?.enabled||!p.schedule_enabled)return{action:'disabled'}
  const active=await db.activeRun(founderKey)
  if(active)return{action:'advance',run:await advanceRun(active.run_key)}
  const latest=await db.latestRun(founderKey)
  const cadence=Number(p.cadence_hours||24)
  if(latest&&Date.now()-new Date(latest.created_at).getTime()<cadence*3600000)return{action:'waiting',next_after:new Date(new Date(latest.created_at).getTime()+cadence*3600000).toISOString()}
  const run=await startRun(founderKey,'autonomous')
  const result=await advanceRun(run.run_key)
  return{action:'started',run:result}
}