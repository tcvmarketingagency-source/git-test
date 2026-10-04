import {NextResponse} from 'next/server'
import {configured,summary} from '../../../../lib/cost/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Server data connection is not configured.'});try{return NextResponse.json({ok:true,...await summary()})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Cost summary failed'},{status:500})}}