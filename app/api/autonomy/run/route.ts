import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/autonomy/storage'
import {advanceRun,startRun} from '../../../../lib/autonomy/engine'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60
export async function POST(req:Request){
  if(!configured())return NextResponse.json({ok:false,error:'Supabase server credentials are not configured'},{status:503})
  try{
    const body=await req.json().catch(()=>({}))
    if(body.action==='advance'&&body.run_key)return NextResponse.json({ok:true,...await advanceRun(String(body.run_key))})
    const run=await startRun(String(body.founder_key||'primary'),body.mode==='supervised'?'supervised':'autonomous')
    return NextResponse.json({ok:true,started_run_key:run.run_key,...await advanceRun(run.run_key)})
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Autonomy run failed'},{status:409})}
}