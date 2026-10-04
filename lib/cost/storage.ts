import { ventureosConfigured, ventureosRequest, ventureosRpc } from '@/lib/tenant/rest'
const request = ventureosRequest
const rpc = ventureosRpc
export const configured=()=>ventureosConfigured()
function monthStart(d=new Date()){return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)).toISOString().slice(0,10)}
function monthEnd(d=new Date()){return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).toISOString().slice(0,10)}
function dayStart(){return new Date(Date.now()-24*60*60*1000).toISOString()}
export async function account(){const rows=await request('ventureos_credit_accounts?select=*&account_key=eq.primary&limit=1');return rows?.[0]??null}
export async function subscription(){const rows=await request('ventureos_subscriptions?select=*&account_key=eq.primary&order=created_at.desc&limit=1');return rows?.[0]??null}
export async function providers(){return request('ventureos_providers?select=*&order=category.asc,provider_key.asc')}
export async function providerAccounts(){const rows=await request('ventureos_provider_accounts?select=*,provider:ventureos_providers(*)&account_key=eq.primary&order=id.asc');const envByProvider:any={openai:'OPENAI_API_KEY',tavily:'TAVILY_API_KEY',firecrawl:'FIRECRAWL_API_KEY',exa:'EXA_API_KEY'};return (rows||[]).map((r:any)=>({...r,secret_configured:Boolean(envByProvider[r.provider?.provider_key]&&process.env[envByProvider[r.provider.provider_key]])}))}
export async function transactions(limit=100){return request('ventureos_credit_transactions?select=*&order=created_at.desc&limit='+Math.min(limit,500))}
export async function usage(limit=500){return request('ventureos_provider_usage?select=*&order=recorded_at.desc&limit='+Math.min(limit,1000))}
export async function setBudget(input:any){const rows=await request('ventureos_credit_accounts?account_key=eq.primary',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'active',monthly_limit:Number(input.monthly_limit||0),daily_limit:Number(input.daily_limit||0),alert_percent:Number(input.alert_percent??75),warning_percent:Number(input.warning_percent??85),soft_stop_percent:Number(input.soft_stop_percent??90),hard_stop_percent:Number(input.hard_stop_percent??100),period_start:monthStart(),period_end:monthEnd(),updated_at:new Date().toISOString()})});return rows?.[0]??null}
export async function grant(input:any){return rpc('ventureos_grant_credits',{p_account_key:'primary',p_amount:Number(input.amount),p_reason:input.reason||'Subscription credit grant',p_source:input.source||'billing',p_reference_id:input.reference_id||null})}
export async function reserve(input:any){return rpc('ventureos_reserve_credits',{p_account_key:'primary',p_amount:Number(input.amount),p_reason:input.reason||'Reserved intelligence spend',p_source:input.source||'system',p_reference_id:input.reference_id||null,p_request_id:input.request_id||null})}
export async function consume(input:any){return rpc('ventureos_consume_credits',{p_account_key:'primary',p_amount:Number(input.amount),p_reservation_id:input.reservation_id||null,p_reason:input.reason||'Provider intelligence usage',p_source:input.source||'provider',p_reference_id:input.reference_id||null,p_request_id:input.request_id||null})}
export async function release(input:any){return rpc('ventureos_release_credits',{p_account_key:'primary',p_amount:Number(input.amount),p_reason:input.reason||'Released intelligence reservation',p_source:input.source||'system',p_reference_id:input.reference_id||null})}
export async function recordUsage(input:any){const cost=Number(input.actual_cost||0);const row=await request('ventureos_provider_usage',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({provider_id:input.provider_id||null,provider:String(input.provider||'unknown'),operation:String(input.operation||'unknown'),request_id:input.request_id||null,units:Number(input.units||0),actual_cost:cost,currency:String(input.currency||'INR'),opportunity_id:input.opportunity_id||null,product_id:input.product_id||null,category:String(input.category||'research'),metadata:input.metadata||{}})});if(cost>0)await consume({amount:cost,reason:'Reconciled provider usage: '+input.provider+' / '+input.operation,source:'provider_usage',reference_id:input.request_id||null,request_id:input.request_id||null});return row?.[0]??null}
export async function summary(){
 if(!configured())return{configured:false}
 const [a,s,ps,pa,u,tx]=await Promise.all([account(),subscription(),providers(),providerAccounts(),usage(1000),transactions(1000)])
 const now=Date.now(),month=monthStart(),monthRows=u.filter((x:any)=>String(x.recorded_at||'').slice(0,10)>=month),last7=u.filter((x:any)=>new Date(x.recorded_at).getTime()>=now-7*86400000)
 const monthlyBudget=Number(a?.monthly_limit||0),consumed=Number(a?.consumed_balance||0),reserved=Number(a?.reserved_balance||0),available=Number(a?.balance||0)
 const daily=last7.reduce((n:number,x:any)=>n+Number(x.actual_cost||0),0)/7
 const nowDate=new Date();const elapsed=Math.max(1,nowDate.getUTCDate());const daysInMonth=new Date(Date.UTC(nowDate.getUTCFullYear(),nowDate.getUTCMonth()+1,0)).getUTCDate();const runRate=consumed/elapsed;const forecast=monthRows.length?Math.max(consumed,runRate*daysInMonth,daily*daysInMonth):0
 const percent=monthlyBudget>0?(consumed/monthlyBudget)*100:0
 const categories:any={};const providerSpend:any={}
 for(const x of monthRows){const c=String(x.category||'research');categories[c]=(categories[c]||0)+Number(x.actual_cost||0);const p=String(x.provider||'unknown');providerSpend[p]=(providerSpend[p]||0)+Number(x.actual_cost||0)}
 const opp:any={},prod:any={};for(const x of monthRows){if(x.opportunity_id)opp[x.opportunity_id]=(opp[x.opportunity_id]||0)+Number(x.actual_cost||0);if(x.product_id)prod[x.product_id]=(prod[x.product_id]||0)+Number(x.actual_cost||0)}
 const efficiency=consumed>0?monthRows.reduce((n:number,x:any)=>n+Number(x.units||0),0)/consumed:0
 const state=monthlyBudget<=0?'unconfigured':percent>=Number(a.hard_stop_percent||100)?'hard_stop':percent>=Number(a.soft_stop_percent||90)?'soft_stop':percent>=Number(a.warning_percent||85)?'warning':percent>=Number(a.alert_percent||75)?'alert':'healthy'
 return {configured:true,account:a,subscription:s,providers:ps,providerAccounts:pa,summary:{monthlyBudget,consumed,reserved,available,forecast,percent,state,dailyAverage:daily,efficiency},categories,providerSpend,opportunitySpend:opp,productSpend:prod,transactions:tx.slice(0,60),usage:monthRows.slice(0,100)}
}
