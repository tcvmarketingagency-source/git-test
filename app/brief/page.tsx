'use client'
import {useEffect,useMemo,useState} from 'react'
import {AlertCircle,ArrowRight,CalendarDays,ChevronLeft,ChevronRight,Database,Factory,History,Loader2,RefreshCw,Sparkles,Target,TrendingUp,Zap} from 'lucide-react'

function istToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function shiftDate(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
function formatDate(date:string){return new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).format(new Date(date+'T12:00:00'))}
function deltaLabel(v:any){if(v===undefined||v===null)return 'Stored context';if(v===0)return 'No change';return (v>0?'+':'')+v+' vs previous'}
function countSource(status:any){return Number(status?.market_events||0)+Number(status?.problem_clusters||0)+Number(status?.opportunities||0)}

export default function Brief(){
 const [date,setDate]=useState(istToday()),[data,setData]=useState<any>({}),[history,setHistory]=useState<any[]>([]),[loading,setLoading]=useState(true),[generating,setGenerating]=useState(false),[error,setError]=useState('')
 const load=async()=>{setLoading(true);setError('');try{const [briefRes,historyRes]=await Promise.all([fetch('/api/brief?date='+encodeURIComponent(date),{cache:'no-store'}),fetch('/api/brief/history?limit=30',{cache:'no-store'})]);const a=await briefRes.json(),b=await historyRes.json();setData(a);setHistory(b.snapshots||[]);if(a.ok===false)setError(a.error||'Unable to load founder brief.')}catch(e){setError(e instanceof Error?e.message:'Unable to load founder brief.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[date])
 const generate=async()=>{setGenerating(true);setError('');try{const r=await fetch('/api/brief/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date})});const j=await r.json();if(!j.ok)throw new Error(j.error||j.message||'Snapshot generation failed');setData({ok:true,configured:true,date,snapshot:j.snapshot,items:j.items||[]});const h=await fetch('/api/brief/history?limit=30',{cache:'no-store'}).then(r=>r.json());setHistory(h.snapshots||[])}catch(e){setError(e instanceof Error?e.message:'Snapshot generation failed')}finally{setGenerating(false)}}
 const snapshot=data.snapshot,counts=snapshot?.counts||{},delta=snapshot?.delta||{},health=snapshot?.founder_context?.intelligence_health||{}
 const empty=!countSource(counts)
 const dateLabel=useMemo(()=>formatDate(date),[date])
 const providerStates=health.provider_config||{}
 return <main className="p6b-shell">
  <header className="p6b-top">
   <div><div className="p6b-eyebrow">VENTUREOS / PHASE 6 / DAILY INTELLIGENCE</div><h1 className="p6b-title">Daily Founder Brief</h1><p className="p6b-subtitle">A persistent daily operating brief that combines market movement, problem momentum, opportunity signals and founder memory into one traceable decision surface.</p></div>
   <div className="p6b-controls">
    <button className="p6b-btn" onClick={()=>setDate(shiftDate(date,-1))} aria-label="Previous day"><ChevronLeft size={14}/></button>
    <button className="p6b-btn date"><CalendarDays size={13}/>{dateLabel}</button>
    <button className="p6b-btn" onClick={()=>setDate(shiftDate(date,1))} disabled={date>=istToday()} aria-label="Next day"><ChevronRight size={14}/></button>
    <button className="p6b-btn primary" onClick={generate} disabled={generating||!data.configured}>{generating?<><RefreshCw size={13} className="spin"/> Generating…</>:<><Sparkles size={13}/> Generate snapshot</>}</button>
   </div>
  </header>

  {error&&<div className="p6b-banner"><AlertCircle size={15}/><div><b>Brief request failed</b><span>{error}</span></div></div>}

  {!data.configured&&<div className="p6b-banner"><Database size={15}/><div><b>Data layer needs configuration</b><span>{data.message||'Connect the server-side Supabase credentials before the intelligence brief can persist data.'}</span></div></div>}

  {data.configured&&loading?<div className="p6b-panel p6b-empty" style={{minHeight:300}}><Loader2 size={22} className="spin"/><strong>Loading founder intelligence…</strong><span>Retrieving the selected snapshot and daily history.</span></div>:
   data.configured&&snapshot?<>

    <section className="p6b-hero">
      <div><span className="p6b-hero-kicker">{snapshot.status==='awaiting_intelligence'?'AWAITING INTELLIGENCE':'TODAY’S FOUNDER BRIEF'}</span><h2>{snapshot.headline||'Founder Intelligence Brief'}</h2><p>{snapshot.executive_summary}</p></div>
      <div className="p6b-health"><small>INTELLIGENCE COVERAGE</small><strong>{health.coverage_percent??(empty?0:100)}%</strong><span>{empty?'No Phase 3–5 records are available yet.':'Brief is using the current evidence-backed pipeline.'}</span></div>
    </section>

    {empty?<div className="p6b-banner info"><Zap size={15}/><div><b>The brief is healthy, but the upstream intelligence pipeline is empty.</b><span>Connect or run research ingestion → signal/problem processing → market intelligence → opportunity processing. This page intentionally shows zero-state data instead of fabricating insights.</span></div></div>:null}

    <section className="p6b-kpis">
      {[
       ['Market changes',counts.market_events,delta.market_events?.delta,TrendingUp],
       ['Problem clusters',counts.problem_clusters,delta.problem_clusters?.delta,Target],
       ['Opportunities',counts.opportunities,delta.opportunities?.delta,Factory],
       ['Founder decisions',counts.decisions,delta.decisions?.delta,History],
       ['Memory records',counts.memory,undefined,Database]
      ].map(([label,value,d,Icon]:any)=><div className="p6b-kpi" key={label}><div className="p6b-kpi-top"><span>{label}</span><Icon size={12} /></div><b>{Number(value||0).toLocaleString()}</b><small className="p6b-delta">{deltaLabel(d)}</small></div>)}
    </section>

    <section className="p6b-grid">
      <div className="p6b-panel">
        <div className="p6b-head"><div><strong>What changed since yesterday</strong><span>Highest-signal market events stored by the intelligence pipeline.</span></div><TrendingUp size={15}/></div>
        {(snapshot.what_changed||[]).length?<div className="p6b-list">{snapshot.what_changed.map((x:any)=><article className="p6b-row" key={x.id}><div className="p6b-score">{Math.round(x.impact||0)}</div><div className="p6b-row-main"><b>{x.title}</b><p>{x.summary||'No event description stored.'}</p><small>{x.sources||0} sources · {Math.round(x.confidence||0)} confidence · momentum {Math.round(x.momentum||0)}</small></div><div className="p6b-row-value">impact</div></article>)}</div>:<div className="p6b-empty"><TrendingUp size={20}/><strong>No market changes yet</strong><span>Once Phase 4 market intelligence has records, the daily brief will rank the highest-impact changes here.</span></div>}
      </div>

      <div className="p6b-stack">
        <div className="p6b-panel"><div className="p6b-head"><div><strong>What deserves attention</strong><span>Founder-specific action surface.</span></div><Target size={15}/></div>{(snapshot.attention_items||[]).length?<div className="p6b-callout">{snapshot.attention_items.map((x:any)=><div className="p6b-action" key={x.title}><b>{x.title}</b><p>{x.reason}</p></div>)}</div>:<div className="p6b-empty compact"><strong>No priority action detected</strong><span>Priority actions appear only when the current evidence-backed opportunity layer surfaces them.</span></div>}</div>
        <div className="p6b-panel"><div className="p6b-head"><div><strong>Founder memory context</strong><span>Context carried into today’s intelligence brief.</span></div></div><div className="p6b-memory">{(snapshot.founder_context?.markets||[]).length||(snapshot.founder_context?.preferred_business_models||[]).length?<div className="p6b-tags">{[...(snapshot.founder_context?.markets||[]),...(snapshot.founder_context?.preferred_business_models||[])].slice(0,10).map((x:string)=><span className="p6b-tag" key={x}>{x}</span>)}</div>:<div className="p6b-empty compact"><strong>Founder context is empty</strong><span>Add Founder DNA, decisions or lessons in Founder Memory to make the brief more personalized.</span></div>}<p className="p6b-muted">{snapshot.founder_context?.memory_count||0} persistent memory records available.</p><a className="p6b-link" href="/memory">Open Founder Memory <ArrowRight size={11}/></a></div></div>
      </div>
    </section>

    <section className="p6b-insights">
      <div className="p6b-panel"><div className="p6b-head"><div><strong>Accelerating problems</strong><span>Problem clusters with positive momentum.</span></div><Target size={14}/></div>{(snapshot.accelerating_problems||[]).length?<div className="p6b-list">{snapshot.accelerating_problems.map((x:any)=><article className="p6b-row" key={x.id}><div className="p6b-score green">{Math.round(x.momentum||0)}</div><div className="p6b-row-main"><b>{x.title}</b><p>{x.summary||'No problem description stored.'}</p><small>Demand {Math.round(x.demand||0)} · Pain {Math.round(x.pain||0)} · {x.signals||0} signals</small></div></article>)}</div>:<div className="p6b-empty compact"><strong>No accelerating problems</strong><span>Positive-momentum problem clusters will appear after signal processing runs.</span></div>}</div>
      <div className="p6b-panel"><div className="p6b-head"><div><strong>Opportunity highlights</strong><span>Current Phase 5 rankings carried into the daily brief.</span></div><Sparkles size={14}/></div>{(snapshot.opportunity_highlights||[]).length?<div className="p6b-opportunities">{snapshot.opportunity_highlights.map((x:any)=><a className="p6b-opportunity" href={'/opportunities/'+x.id} key={x.id}><div><b>{x.title}</b><p>{x.summary||'No opportunity summary stored.'}</p></div><span className="p6b-opportunity-score">{Math.round(x.score||0)}</span></a>)}</div>:<div className="p6b-empty compact"><strong>No opportunities ranked</strong><span>Run Opportunity Radar processing to populate this section.</span></div>}</div>
    </section>

    {empty&&<section className="p6b-panel" style={{marginTop:13}}><div className="p6b-head"><div><strong>Pipeline coverage</strong><span>Upstream layers that feed the Daily Founder Brief.</span></div></div><div className="p6b-coverage">
      <div className="p6b-coverage-card"><span>Market intelligence</span><b>{counts.market_events||0}</b><small>{providerStates.tavily?'Tavily configured':'Provider not configured'}</small></div>
      <div className="p6b-coverage-card"><span>Problem intelligence</span><b>{counts.problem_clusters||0}</b><small>Derived from processed signals</small></div>
      <div className="p6b-coverage-card"><span>Opportunity intelligence</span><b>{counts.opportunities||0}</b><small>Phase 5 Opportunity Radar</small></div>
    </div></section>}

   </>:data.configured?<div className="p6b-panel p6b-empty" style={{minHeight:320}}><Sparkles size={22}/><strong>No snapshot for {dateLabel}</strong><span>Generate a persistent daily checkpoint. The generator reads only stored Phase 3–5 intelligence and Founder Memory.</span><button className="p6b-btn primary" onClick={generate} disabled={generating}>{generating?'Generating…':'Generate snapshot'}</button></div>:null}

  <section className="p6b-panel p6b-history"><div className="p6b-head"><div><strong>Daily history</strong><span>Each generated brief becomes a permanent timeline checkpoint.</span></div><History size={14}/></div>{history.length?<div className="p6b-timeline">{history.map((x:any)=><button key={x.id} className={'p6b-history-card '+(x.snapshot_date===date?'active':'')} onClick={()=>setDate(x.snapshot_date)}><div className="p6b-history-date">{formatDate(x.snapshot_date)}</div><div className="p6b-history-title">{x.headline||'Founder Intelligence Brief'}</div><div className="p6b-history-meta">{x.counts?.market_events||0} market · {x.counts?.problem_clusters||0} problems · {x.counts?.opportunities||0} opportunities</div></button>)}</div>:<div className="p6b-empty compact"><History size={18}/><strong>No daily checkpoints yet</strong><span>Your first generated snapshot will appear here.</span></div>}</section>
  <div className="p6b-footer-note">VentureOS Phase 6 · evidence-first founder intelligence · {new Date().getFullYear()}</div>
 </main>
}
