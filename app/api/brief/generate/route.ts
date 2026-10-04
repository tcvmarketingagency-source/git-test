import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/founder-memory/storage'
import {generateDailySnapshot,isoDateIST} from '../../../../lib/founder-memory/engine'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Supabase server credentials are not configured.'});try{const body=await req.json().catch(()=>({}));return NextResponse.json({ok:true,configured:true,...await generateDailySnapshot(String(body.founder_key||'primary'),String(body.date||isoDateIST()))})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Daily brief generation failed'},{status:500})}}