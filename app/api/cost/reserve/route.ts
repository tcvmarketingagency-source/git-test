import {NextResponse} from 'next/server'
import {configured,reserve} from '../../../../lib/cost/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});try{return NextResponse.json({ok:true,configured:true,result:await reserve(await req.json())})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Reservation denied'},{status:409})}}