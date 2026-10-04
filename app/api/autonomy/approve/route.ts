import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/autonomy/storage'
import {approveOpportunity} from '../../../../lib/autonomy/engine'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60
export async function POST(req:Request){
  if(!configured())return NextResponse.json({ok:false,error:'Supabase server credentials are not configured'},{status:503})
  try{
    const body=await req.json();const runKey=String(body.run_key||'');const opportunityId=Number(body.opportunity_id)
    if(!runKey||!Number.isFinite(opportunityId))return NextResponse.json({ok:false,error:'run_key and opportunity_id are required'},{status:400})
    return NextResponse.json({ok:true,...await approveOpportunity(runKey,opportunityId)})
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Approval failed'},{status:409})}
}
