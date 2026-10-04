import {NextResponse} from 'next/server'
import {ingestSignals} from '../../../../lib/signals/processor'
export const runtime='nodejs';export const maxDuration=60
export async function GET(req:Request){
 const auth=req.headers.get('authorization'),secret=process.env.CRON_SECRET
 if(secret&&auth!=='Bearer '+secret)return NextResponse.json({ok:false,error:'Unauthorized'},{status:401})
 try{const result=await ingestSignals({limit:200});return NextResponse.json({ok:true,phase:3,result})}
 catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Signal cron failed'},{status:500})}
}