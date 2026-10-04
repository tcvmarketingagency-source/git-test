'use client'
import {useEffect,useState} from 'react'
import {ArrowLeft,ArrowRight,CheckCircle2,Cloud,Code2,Database,ExternalLink,FileText,GitBranch,Loader2,Play,RefreshCw,Rocket,ShieldCheck,Sparkles,TriangleAlert,Workflow} from 'lucide-react'

const stepIcons:any={spec_validation:ShieldCheck,build_agent_scaffold:Code2,github_provision:GitBranch,figma_handoff:Sparkles,supabase_schema:Database,vercel_deploy:Rocket,build_verification:CheckCircle2}
function pretty(v:string){return String(v||'').replace(/_/g,' ').replace(/\b\w/g,function(s){return s.toUpperCase()})}
function tone(s:string){return s==='completed'?'completed':s==='running'?'running':s==='failed'||s==='blocked'?'failed':''}
export default function ExecutionDetail({params}:{params:Promise<{id:string}>}){
 const [id,setId]=useState(''),[data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{params.then(function(x){setId(x.id)})},[params])
 const load=async()=>{if(!id)return;setLoading(true);setError('');try{const r=await fetch('/api/execution?product_id='+id,{cache:'no-store'}),j=await r.json();if(!j.ok)throw new Error(j.error||'Execution workspace unavailable');setData(j)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoading(false)}}
 useEffect(()=>{load()},[id])
 const prepare=async(mode:string)=>{
  setBusy(true);setError('')
  try{const r=await fetch('/api/execution/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:Number(id),mode,requested_by:'founder'})}),j=await r.json();if(!j.ok)throw new Error(j.error||'Preparation failed');setData(j);await load()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 const runNext=async(stepKey?:string)=>{
  if(!data?.run?.run_key)return
  setBusy(true);setError('')
  try{const r=await fetch('/api/execution/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run_key:data.run.run_key,step_key:stepKey})}),j=await r.json();if(!j.ok)throw new Error(j.error||'Execution failed');setData(j)}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 if(loading)return <main className="p10-shell"><div className="p10-panel p10-empty"><Loader2 size={24} className="p10-spin"/><strong>Loading execution workspace…</strong><span>Reading execution run, provider state and artifacts.</span></div></main>
 if(error&&!data)return <main className="p10-shell"><div className="p10-banner danger"><TriangleAlert size={15}/><div><b>Execution workspace unavailable</b><span>{error}</span></div></div></main>
 const p=data?.product,run=data?.run,steps=data?.steps||[],arts=data?.artifacts||[],providers=data?.providers||{}
 const completed=steps.filter((x:any)=>x.status==='completed').length,total=steps.length||7
 const next=steps.find((x:any)=>x.status==='pending')
 return <main className="p10-shell">
  <div className="p10-detail-nav"><a className="p10-btn" href="/execution"><ArrowLeft size={13}/> Execution</a><a className="p10-btn" href={'/factory/'+p.id}><FileText size={13}/> Product spec</a><span className="p10-id">PRODUCT #{String(p.id).padStart(3,'0')}</span></div>
  {error&&<div className="p10-banner danger"><TriangleAlert size={15}/><div><b>Execution action failed</b><span>{error}</span></div></div>}
  <section className="p10-hero"><div><div className="p10-eyebrow">EXECUTION WORKSPACE / PRODUCT FACTORY HANDOFF</div><h1>{p.name}</h1><p>{p.thesis}</p><div className="p10-tags"><span>{p.target_customer}</span><span>{p.business_model}</span><span>{p.status}</span>{p.repository_url&&<span>GitHub connected</span>}</div></div><div className="p10-hero-state"><small>EXECUTION STATUS</small><b>{pretty(p.execution_status||'not_started')}</b><span>{completed}/{total} pipeline steps completed</span></div></section>

  <section className="p10-steps">{steps.map(function(s:any,i:number){const I=stepIcons[s.step_key]||Workflow;return <div key={s.step_key} className={'p10-step '+tone(s.status)}><div className="p10-step-top"><span className="p10-step-num">{String(i+1).padStart(2,'0')}</span><I size={12} className="p10-step-icon"/></div><b>{s.step_key.replace(/_/g,' ')}</b><small>{s.status==='pending'?'Waiting':s.error||s.output?.message||'Ready'}</small></div>})}</section>

  {!run&&<div className="p10-banner info"><Cloud size={15}/><div><b>Execution has not started.</b><span>Prepare a dry-run first to materialize the complete execution plan. Live mode is available only when provider integrations are configured.</span></div></div>}

  <section className="p10-detail-grid">
   <div className="p10-panel"><div className="p10-head"><div><b>Execution timeline</b><span>Every external action is persisted with status, provider and error detail.</span></div><Workflow size={15}/></div>{steps.length?<div className="p10-list">{steps.map(function(s:any,i:number){const I=stepIcons[s.step_key]||Workflow;return <div className="p10-row" key={s.step_key}><div className="p10-row-num">{i+1}</div><div className="p10-row-main"><b>{pretty(s.step_key)}</b><span>{pretty(s.provider)} · {s.status} {s.completed_at?'· '+new Date(s.completed_at).toLocaleString():''}</span>{s.output?.url&&<a href={s.output.url} target="_blank" rel="noreferrer" className="p10-product-bottom" style={{display:'inline-flex',marginTop:5,color:'#74ddfa',fontSize:7,textDecoration:'none'}}>Open output <ExternalLink size={10}/></a>}</div><div className="p10-row-error">{s.error||''}</div></div>})}</div>:<div className="p10-empty compact"><span>Prepare execution to create the timeline.</span></div>}</div>
   <aside>
    <div className="p10-panel" style={{marginBottom:13}}><div className="p10-head"><div><b>Run control</b><span>{run?pretty(run.status):'No active run'}</span></div><Play size={15}/></div><div className="p10-run-panel">{run&&<div className="p10-run-status"><b>{run.mode==='live'?'LIVE EXECUTION':'DRY RUN'}</b><span>{run.run_key.slice(0,22)}…</span></div>}<div className="p10-run-actions">{!run?<><button className="p10-primary" onClick={()=>prepare('dry_run')} disabled={busy}>{busy?<><RefreshCw size={12} className="p10-spin"/> Preparing…</>:<><ShieldCheck size={12}/> Prepare dry run</>}</button><button className="p10-btn" onClick={()=>prepare('live')} disabled={busy}>Prepare live</button></>:<><button className="p10-primary" onClick={()=>runNext()} disabled={busy||!next}>{busy?<><RefreshCw size={12} className="p10-spin"/> Running…</>:next?<><Play size={12}/> Run next: {pretty(next.step_key)}</>:<><CheckCircle2 size={12}/> All steps complete</>}</button>{next&&<button className="p10-btn" onClick={()=>runNext(next.step_key)} disabled={busy}>Run selected</button>}</>}</div><div className="p10-legend">Dry run creates and validates the execution package without requiring vendor-side mutations. Live execution uses server credentials and is fully auditable.</div></div></div>

    <div className="p10-panel"><div className="p10-head"><div><b>Provider readiness</b><span>Current environment only.</span></div><ShieldCheck size={15}/></div><div className="p10-provider-grid" style={{gridTemplateColumns:'1fr 1fr'}}>{Object.entries(providers).map(function(e:any){const [k,v]=e;return <div className="p10-provider" key={k}><div className="p10-provider-top"><b>{v.label}</b><i className={'p10-dot '+(v.configured?'on':'')}/></div><span>{v.configured?'Configured':'Missing '+v.hint}</span></div>})}</div></div>
   </aside>
  </section>

  <section className="p10-panel"><div className="p10-head"><div><b>Execution artifacts</b><span>Scaffold files, Figma handoff and Supabase migration artifacts.</span></div><FileText size={15}/></div>{arts.length?<div className="p10-artifacts">{arts.map(function(a:any){return <div className="p10-artifact" key={a.id}><b>{a.title}</b><span>{a.path||a.artifact_type} · {a.status}</span>{a.external_url&&<a href={a.external_url} target="_blank" rel="noreferrer">Open external output →</a>}</div>})}</div>:<div className="p10-empty compact"><FileText size={18}/><strong>No execution artifacts yet</strong><span>Run the scaffold step to materialize the execution package.</span></div>}</section>

  <footer className="p10-footer"><span>VentureOS Phase 10 · Execution Layer</span><span>GitHub · Figma · Supabase · Vercel · Build Agent</span></footer>
 </main>
}