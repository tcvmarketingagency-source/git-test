import crypto from 'node:crypto'
import {NextResponse} from 'next/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){
 const secret=process.env.BILLING_WEBHOOK_SECRET
 if(!secret)return NextResponse.json({ok:true,configured:false,message:'Billing webhook secret is not configured.'})
 const signature=req.headers.get('x-ventureos-signature')||''
 const raw=await req.text()
 const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex')
 if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return NextResponse.json({ok:false,error:'Invalid billing webhook signature'},{status:401})
 const event=JSON.parse(raw)
 return NextResponse.json({ok:true,accepted:true,event_type:event.type||'unknown',received_at:new Date().toISOString()})
}