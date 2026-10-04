import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/autonomy/storage'
import {schedulerTick} from '../../../../lib/autonomy/engine'
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60
export async function GET(req:Request){
  if(!configured())return NextResponse.json({ok:true,configured:false,message:'Supabase server credentials are not configured.'})
  const secret=process.env.CRON_SECRET;if(secret&&req.headers.get('authorization')!=='Bearer '+secret)return NextResponse.json({ok:false,error:'Unauthorized'},{status:401})
  try{return NextResponse.json({ok:true,configured:true,...await schedulerTick('primary')})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Autonomy cron failed'},{status:500})}
}
