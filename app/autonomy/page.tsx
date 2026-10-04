'use client'
import {useEffect,useMemo,useState} from 'react'
import {Bot,CheckCircle2,Clock3,Gauge,Lock,PauseCircle,Play,RefreshCw,ShieldCheck,Sparkles,Target,TriangleAlert,Workflow,Zap} from 'lucide-react'
const STEP_LABELS:any={preflight:'System preflight',research:'Research ingestion',market_intelligence:'Market intelligence',opportunity_radar:'Opportunity validation',founder_brief:'Founder brief',approval_gate:'Founder approval gate',product_generation:'MVP generation',execution_prepare:'Execution preparation'}
function score(n:any){return Math.round(Number(n||0))}
function statusTone(s:string){if(s==='completed')return 'done';if(s==='running')return 'run';if(s==='awaiting_approval')return 'wait';if(s==='failed'||s==='blocked'||s==='partial')return 'bad';return 'idle'}
export default function Autonomy(){
 const [data,setData]=useState<any>({}),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/autonomy',{cache:'no-store'}),j=await r.json();if(!j.ok)throw new Error(j.error||'Autonomy unavailable');setData(j)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoading(false)}}
 useEffect(()=>{load()},[])
 const run=data.run||null,steps=data.steps||[],policy=data.policy||{},candidates=data.candidates||[],providers=data.providerHealth||[]
 const waiting=run?.status==='awaiting_approval'
 const active=run&&['queued','running','awaiting_approval'].includes(run.status)
 const topCandidates=useMemo(()=>candidates.slice(0,5),[candidates])
 const savePolicy=async(next:any)=>{setSaving(true);setMessage('');try{const r=await fetch('/api/autonomy',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});const j=await r.json();if(!j.ok)throw new Error(j.error||'Policy update failed');setData((x:any)=>({...x,policy:j.policy}));setMessage('Autonomy policy saved.')}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setSaving(false)}}
 const runNow=async()=>{setBusy(true);setError('');setMessage('');try{const r=await fetch('/api/autonomy/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'autonomous'})});const j=await r.json();if(!j.ok)throw new Error(j.error||'Autonomy run failed');setMessage('Autonomous loop advanced one production stage.');await load()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 const advance=async()=>{if(!run?.run_key)return;setBusy(true);try{const r=await fetch('/api/autonomy/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'advance',run_key:run.run_key})});const j=await r.json();if(!j.ok)throw new Error(j.error||'Stage advance failed');await load()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 const approve=async(id:number)=>{if(!run?.run_key)return;setBusy(true);setError('');try{const r=await fetch('/api/autonomy/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run_key:run.run_key,opportunity_id:id})});const j=await r.json();if(!j.ok)throw new Error(j.error||'Approval failed');setMessage('Opportunity approved. Product Factory generation is now queued.');await load()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
 if(loading)return <main className="p11-shell"><div className="p11-empty"><RefreshCw className="p11-spin"/><strong>Loading Autonomous Loop…</strong><span>Reading policy, run state, opportunity candidates and control-plane events.</span></div></main>
 return <main className="p11-shell">
  <header className="p11-top"><div><div className="p11-eyebrow">VENTUREOS / PHASE 11 / AUTONOMOUS LOOP</div><h1>Autonomous Venture Loop</h1><p>Research the world, validate market movement, rank opportunities, produce the founder brief and stop at explicit human approval boundaries before product generation or live execution.</p></div><div className="p11-actions"><button className="p11-btn" onClick={load}><RefreshCw size={14}/> Refresh</button><button className="p11-primary" onClick={runNow} disabled={busy||waiting}>{busy?<RefreshCw size={14} className="p11-spin"/>:<Play size={14}/>} Run loop</button></div></header>
  {error&&<div className="p11-banner danger"><TriangleAlert size={15}/><div><b>Control-plane error</b><span>{error}</span></div></div>}
  {message&&<div className="p11-banner success"><CheckCircle2 size={15}/><div><b>{message}</b></div></div>}
  <section className="p11-hero">
   <div className="p11-status-card"><div className="p11-status-icon"><Bot size={20}/></div><div><span>LOOP STATUS</span><b>{run?String(run.status).replace('_',' ').toUpperCase():'NO RUN'}</b><small>{run?.current_step?STEP_LABELS[run.current_step]:'Ready for next scheduled cycle'}</small></div><i className={'p11-live-dot '+(active?'on':'')}/></div>
   <div className="p11-status-card"><div className="p11-status-icon"><Clock3 size={20}/></div><div><span>CADENCE</span><b>{policy.schedule_enabled?'Every '+policy.cadence_hours+'h':'MANUAL'}</b><small>{policy.enabled?'Autonomy enabled':'Autonomy paused'}</small></div></div>
   <div className="p11-status-card"><div className="p11-status-icon"><Target size={20}/></div><div><span>THRESHOLD</span><b>{score(policy.minimum_opportunity_score)}</b><small>Minimum opportunity score</small></div></div>
   <div className="p11-status-card"><div className="p11-status-icon"><ShieldCheck size={20}/></div><div><span>GUARDRAIL</span><b>HUMAN GATE</b><small>Product + live execution approval</small></div></div>
  </section>
  <section className="p11-grid">
   <div className="p11-panel">
    <div className="p11-head"><div><b>Current run</b><span>{run?run.run_key:'No active run'}</span></div>{active&&<button className="p11-ghost" onClick={advance} disabled={busy}>{busy?'Advancing…':'Advance stage'} <Workflow size={12}/></button>}</div>
    {!run?<div className="p11-empty compact"><PauseCircle size={20}/><strong>No autonomous run has started.</strong><span>Run the loop manually or let the scheduled control plane start the next eligible cycle.</span></div>:
     <div className="p11-steps">{steps.map((s:any)=><div className={'p11-step '+statusTone(s.status)} key={s.step_key}><div className="p11-step-index">{s.order_index+1}</div><div className="p11-step-body"><div><b>{STEP_LABELS[s.step_key]||s.step_key}</b><span>{s.status.replace('_',' ')}</span></div><small>{s.error||s.output?.reason||s.output?.message||s.output?.status||'Awaiting execution.'}</small></div><div className="p11-step-mark">{s.status==='completed'?<CheckCircle2 size={14}/>:s.status==='running'?<RefreshCw size={14} className="p11-spin"/>:s.status==='awaiting_approval'?<Lock size={14}/>:s.status==='failed'||s.status==='blocked'?<TriangleAlert size={14}/>:<span/>}</div></div>)}</div>}
   </div>
   <div className="p11-panel">
    <div className="p11-head"><div><b>Autonomy policy</b><span>Bounded automation, not an uncontrolled agent.</span></div><Gauge size={15}/></div>
    <div className="p11-policy">
      <label><span>Autonomy enabled</span><input type="checkbox" checked={!!policy.enabled} onChange={(e:any)=>savePolicy({...policy,enabled:e.target.checked})} disabled={saving}/></label>
      <label><span>Scheduled loop</span><input type="checkbox" checked={!!policy.schedule_enabled} onChange={(e:any)=>savePolicy({...policy,schedule_enabled:e.target.checked})} disabled={saving}/></label>
      <div className="p11-field"><span>Cadence hours</span><input type="number" min="1" max="168" value={policy.cadence_hours||24} onChange={(e:any)=>savePolicy({...policy,cadence_hours:Number(e.target.value)})}/></div>
      <div className="p11-field"><span>Opportunity threshold</span><input type="number" min="0" max="100" value={policy.minimum_opportunity_score||75} onChange={(e:any)=>savePolicy({...policy,minimum_opportunity_score:Number(e.target.value)})}/></div>
      <div className="p11-field"><span>Daily cost allowance</span><input type="number" min="1" max="100" value={policy.daily_budget_percent||25} onChange={(e:any)=>savePolicy({...policy,daily_budget_percent:Number(e.target.value)})}/></div>
      <label className="locked"><span><Lock size={12}/> Product approval gate</span><b>Required</b></label>
      <label className="locked"><span><Lock size={12}/> Live deployment gate</span><b>Required</b></label>
    </div>
   </div>
  </section>
  <section className="p11-grid">
   <div className="p11-panel">
    <div className="p11-head"><div><b>Opportunity candidates</b><span>Only candidates above the configured threshold can enter the Product Factory.</span></div><Sparkles size={15}/></div>
    {topCandidates.length?<div className="p11-candidates">{topCandidates.map((x:any,i:number)=><article className="p11-candidate" key={x.id}><div className="p11-rank">0{i+1}</div><div className="p11-candidate-main"><div className="p11-candidate-title"><b>{x.title}</b><span>{score(x.overall_score)} score</span></div><p>{x.summary||'No summary stored.'}</p><div className="p11-tags"><span>Demand {score(x.demand_score)}</span><span>Evidence {score(x.evidence_quality_score)}</span><span>Momentum {score(x.momentum_score)}</span><span>Confidence {score(x.confidence)}</span></div></div>{waiting&&<button className="p11-approve" onClick={()=>approve(Number(x.id))} disabled={busy}><CheckCircle2 size={13}/> Approve</button>}</article>)}</div>:<div className="p11-empty compact"><Target size={20}/><strong>No candidates above threshold.</strong><span>Run Opportunity Radar after research data is available.</span></div>}
   </div>
   <div className="p11-panel">
    <div className="p11-head"><div><b>Provider readiness</b><span>Server-side research adapters only.</span></div><Zap size={15}/></div>
    <div className="p11-providers">{providers.map((p:any)=><div className="p11-provider" key={p.provider}><div><b>{p.provider}</b><span>{p.status}</span></div><i className={p.configured?'on':''}/></div>)}</div>
    <div className="p11-note"><Lock size={12}/><span>Phase 11 never stores provider secrets in browser state. It also never bypasses Phase 10 live execution approval.</span></div>
   </div>
  </section>
  <section className="p11-panel">
   <div className="p11-head"><div><b>Autonomous event stream</b><span>Auditable history of who/what changed the loop.</span></div><Workflow size={15}/></div>
   {data.events?.length?<div className="p11-events">{data.events.slice(0,20).map((e:any)=><div className="p11-event" key={e.id}><span>{new Date(e.created_at).toLocaleTimeString()}</span><div><b>{e.message}</b><small>{e.stage||'system'} · {e.event_type}</small></div></div>)}</div>:<div className="p11-empty compact"><Clock3 size={18}/><strong>No autonomous events yet</strong><span>Run history will appear here as the loop advances.</span></div>}
  </section>
  <footer className="p11-footer"><span>VentureOS Phase 11 · Autonomous Loop Control Plane</span><span>Bounded · auditable · cost-aware · human-gated</span></footer>
 </main>
}