





'use client'
import {useEffect,useMemo,useState} from "react";
import {Activity,BarChart3,Bell,BrainCircuit,CircleDollarSign,Database,FlaskConical,Gauge,LayoutDashboard,Menu,Package,Radar,Search,Settings2,Sparkles,Target,X,Zap,ChevronRight} from "lucide-react";
import {data} from "./data";

const nav=[
 ["Command Center",LayoutDashboard],["Daily Brief",Sparkles],["Market Pulse",Activity],["Problem Atlas",Target],
 ["Opportunity Radar",Radar],["Research Lab",FlaskConical],["Product Factory",Package],["Portfolio",BarChart3],
 ["Cost OS",CircleDollarSign],["Sources",Database],["Founder Memory",BrainCircuit],["Settings",Settings2]
] as const;

export default function Page(){
 const [open,setOpen]=useState(false),[active,setActive]=useState("Command Center"),[q,setQ]=useState(""),[drawer,setDrawer]=useState<string|null>(null),[costLive,setCostLive]=useState<any>(null);\n useEffect(()=>{fetch("/api/cost/summary",{cache:"no-store"}).then(r=>r.json()).then(j=>j.ok&&setCostLive(j)).catch(()=>{})},[]);
 const opps=useMemo(()=>data.opportunities.filter(o=>!q||o[1].toLowerCase().includes(q.toLowerCase())||o[2].toLowerCase().includes(q.toLowerCase())),[q]);
 return <div className="app">
  <aside className={"side "+(open?"open":"")}>
    <div className="brand"><span className="mark">V</span><div><b>VentureOS</b><small>Founder Intelligence</small></div></div>
    <div className="navlabel">Command</div>    {nav.slice(0,8).map(([n,I])=><button key={n} className={"nav "+(active===n?"sel":"")} onClick={()=>{if(n==="Daily Brief")window.location.href="/brief";else if(n==="Research Lab")window.location.href="/research";else if(n==="Problem Atlas")window.location.href="/problems";else if(n==="Market Pulse")window.location.href="/market";else if(n==="Opportunity Radar")window.location.href="/opportunities";else if(n==="Product Factory")window.location.href="/factory";else if(n==="Portfolio")window.location.href="/portfolio";else if(n==="Cost OS")window.location.href="/cost";else{setActive(n);setOpen(false)}}}><I size={16}/>{n}</button>)}
    <div className="navlabel control">Control</div>
    {nav.slice(8).map(([n,I])=><button key={n} className={"nav "+(active===n?"sel":"")} onClick={()=>{if(n==="Cost OS")window.location.href="/cost";else if(n==="Sources")window.location.href="/sources";else if(n==="Founder Memory")window.location.href="/memory";else{setActive(n);setOpen(false)}}}><I size={16}/>{n}</button>)}
    <div className="sidefoot"><span className="dot"/> Intelligence core ready<div>Phase 9 • Cost OS + Unified Billing</div></div>
  </aside>
  <main className="main">
    <header className="top">
      <button className="icon mobile" onClick={()=>setOpen(true)}><Menu size={17}/></button>
      <div className="search"><Search size={15}/><input value={q} onChange={(e:any)=>setQ(e.target.value)} placeholder="Ask VentureOS — market, problem, company or opportunity…"/><kbd>⌘K</kbd></div>
      <button className="icon"><Bell size={16}/></button>
      <div className="profile"><span>Founder mode</span><b>OV</b></div>
    </header>
    <div className="eyebrow">VENTURE INTELLIGENCE OS / {active}</div>
    <section className="hero"><div><h1>Good morning, Rohit.</h1><p>Saturday · 03 October 2026 · Last intelligence scan <strong>{data.lastScan}</strong></p></div><span className="badge"><i className="dot"/> {data.mode}</span></section>
    <section className="metrics">      {data.metrics.map(([a,b,c])=><div className="card metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}
    </section>
    <section className="grid two">
      <div className="card">
        <div className="head"><div><b>Today’s Founder Brief</b><small>Five-minute intelligence summary</small></div><button className="live" onClick={()=>setDrawer("Evidence Explorer")}><i className="dot"/> Evidence linked</button></div>
        <div className="brief"><p className="lead">{data.brief}</p>
          <div className="briefgrid">{data.briefs.map(([a,b,c])=><article key={a}><label>{a}</label><p>{b}</p><button onClick={()=>setDrawer(a)}>Evidence · {c} sources <ChevronRight size={11}/></button></article>)}</div>
        </div>
      </div>
      <div className="card">
        <div className="head"><div><b>Market Changes</b><small>Overnight movement</small></div><Gauge size={15}/></div>
        <div className="list">{data.changes.map(([a,b,c])=><div className="change" key={a}><i className="changeDot"/><div><b>{a}</b><small>{b}</small></div><em>{c}</em></div>)}</div>
      </div>
    </section>    <section className="grid two">
      <div className="card">
        <div className="head"><div><b>Opportunity Radar</b><small>Ranked by evidence, demand and founder fit</small></div><Radar size={15}/></div>
        <div className="list">{opps.map(o=><div className="opp" key={o[1]}>
          <div><div className="opptitle"><span>{o[0]}</span><b>{o[1]}</b></div><small>{o[2]}</small>
            {[["Demand",o[4]],["Evidence",o[5]],["Momentum",o[6]]].map(x=><div className="barrow" key={x[0] as string}><label>{x[0] as string}</label><div><i style={{width:(x[1] as number)+"%"}}/></div><span>{x[1] as number}</span></div>)}
          </div>
          <button className="score" onClick={()=>setDrawer(o[1] as string)}>{o[3]}</button>
        </div>)}</div>
      </div>
      <div className="card">
        <div className="head"><div><b>Product Portfolio</b><small>Current venture lifecycle</small></div><Package size={15}/></div>
        <div className="portfolio">{data.portfolio.map(p=><div className="product" key={p[0]}>
          <div><b>{p[0]}</b><em>{p[1]}</em></div><div className="progress"><i style={{width:(p[2] as number)+"%"}}/></div>
          <small><span>{p[3]}</span><span>{p[2]}%</span></small>
        </div>)}
        <div className="mini">{[["Ideas","143"],["Building","5"],["Live","7"],["Killed","34"]].map(x=><div key={x[0]}><small>{x[0]}</small><b>{x[1]}</b></div>)}</div></div>
      </div>
    </section>    <section className="grid two">
      <div className="card">
        <div className="head"><div><b>Cost OS</b><small>Live internal intelligence spend</small></div><CircleDollarSign size={15}/></div>
        <div className="cost">{costLive?.configured?<><div className="costtop"><div><strong>₹{Number(costLive.summary?.consumed||0).toLocaleString("en-IN")}</strong><small>of ₹{Number(costLive.summary?.monthlyBudget||0).toLocaleString("en-IN")} monthly budget</small></div>
          <div><b>₹{Number(costLive.summary?.available||0).toLocaleString("en-IN")}</b><small>available</small></div></div>
          <div className="costbar"><i style={{width:Math.min(100,Number(costLive.summary?.percent||0))+"%"}}/></div>
          <dl><dt>Reserved</dt><dd>₹{Number(costLive.summary?.reserved||0).toLocaleString("en-IN")}</dd><dt>Forecast</dt><dd>₹{Number(costLive.summary?.forecast||0).toLocaleString("en-IN")}</dd><dt>State</dt><dd>{String(costLive.summary?.state||"unconfigured").replace("_"," ")}</dd><dt>Efficiency</dt><dd>{Number(costLive.summary?.efficiency||0).toFixed(2)} units/₹</dd></dl></>:<div><strong>Not configured</strong><small>Open Cost OS to configure intelligence budgets and guardrails.</small></div>}</div>
      </div>
      <div className="card">
        <div className="head"><div><b>Provider Ledger</b><small>VentureOS-owned provider COGS</small></div><Zap size={15}/></div>
        <div className="providers">{costLive?.configured?Object.entries(costLive.providerSpend||{}).slice(0,5).map(([name,v]:any)=><div className="provider" key={name}><span>{name}</span><div><i style={{width:Math.min(100,Number(v)/Math.max(Number(costLive.summary?.consumed||1),1)*100)+"%"}}/></div><b>₹{Number(v||0).toLocaleString("en-IN")}</b></div>):<footer>Provider accounting is not configured yet. Cost OS keeps vendor credentials server-side and records actual COGS when usage is metered.</footer>}
          {costLive?.configured&&<footer><a href="/cost" style={{color:"#74dff7",textDecoration:"none"}}>Open Cost OS →</a></footer>}
        </div>
      </div>
    </section>
    <footer className="pagefoot"><span>VentureOS Phase 1 · Founder Command Center</span><span>Backend contracts ready for provider/Supabase wiring</span></footer>
  </main>  {drawer&&<div className="overlay" onClick={()=>setDrawer(null)}>
    <aside className="drawer" onClick={(e:any)=>e.stopPropagation()}>
      <div className="drawerhead"><div><div className="eyebrow">EVIDENCE / INTELLIGENCE</div><h2>{drawer}</h2></div><button className="icon" onClick={()=>setDrawer(null)}><X size={15}/></button></div>
      <p className="drawerintro">Every production conclusion will carry evidence, confidence and source classification. Phase 1 exposes this traceability interaction model.</p>
      {data.evidence.map(e=><article className="evidence" key={e[0]}><b>{e[0]}</b><p>{e[1]}</p><span>{e[2]} · {e[3]}% confidence</span></article>)}
      <div className="next"><b>Next phase</b><p>Connect Supabase, provider adapters and the research scheduler. Current API contracts are intentionally ready for that backend handoff.</p></div>
    </aside>
  </div>}
 </div>
}
