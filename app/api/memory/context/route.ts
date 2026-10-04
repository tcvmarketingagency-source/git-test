import {NextResponse} from 'next/server'
import {configured} from '../../../../lib/founder-memory/storage'
import {retrieveFounderContext} from '../../../../lib/founder-memory/engine'
export const runtime='nodejs'
export async function GET(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,results:[],preferenceVector:{},message:'Supabase server credentials are not configured.'});try{const u=new URL(req.url);return NextResponse.json({ok:true,configured:true,...await retrieveFounderContext(u.searchParams.get('q')||'',u.searchParams.get('founder')||'primary')})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Founder context retrieval failed'},{status:500})}}