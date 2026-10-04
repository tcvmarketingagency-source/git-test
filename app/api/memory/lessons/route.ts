import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/founder-memory/storage'
import {recordLesson} from '../../../../lib/founder-memory/engine'
export const runtime='nodejs'
export async function POST(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,message:'Supabase server credentials are not configured.'});try{return NextResponse.json({ok:true,configured:true,lesson:await recordLesson(await req.json())})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Lesson recording failed'},{status:500})}}