import {NextResponse} from 'next/server'
import {recentSignals} from '../../../lib/signals/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(req:Request){
 if(!(process.env.NEXT_PUBLIC_SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)))return NextResponse.json({ok:true,configured:false,signals:[],message:'Supabase server credentials are not configured.'})
 try{const url=new URL(req.url),limit=Number(url.searchParams.get('limit')||100);return NextResponse.json({ok:true,configured:true,signals:await recentSignals(limit)})}
 catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Signals failed'},{status:500})}
}