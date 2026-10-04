import {NextResponse} from 'next/server'
import {configured} from '../../../lib/autonomy/storage'
import {overview} from '../../../lib/autonomy/engine'
import {updatePolicy} from '../../../lib/autonomy/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(req:Request){
  if(!configured())return NextResponse.json({ok:true,configured:false,message:'Supabase server credentials are not configured.'})
  try{return NextResponse.json({ok:true,...await overview('primary')})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Autonomy overview failed'},{status:500})}
}
export async function PATCH(req:Request){
  if(!configured())return NextResponse.json({ok:false,error:'Supabase server credentials are not configured'},{status:503})
  try{const body=await req.json();return NextResponse.json({ok:true,policy:await updatePolicy(String(body.founder_key||'primary'),body)})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Policy update failed'},{status:400})}
}
