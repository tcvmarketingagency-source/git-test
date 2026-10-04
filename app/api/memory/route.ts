import {NextResponse} from 'next/server'
import {configured} from '../../../lib/founder-memory/storage'
import {getFounderContext} from '../../../lib/founder-memory/engine'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(req:Request){if(!configured())return NextResponse.json({ok:true,configured:false,profile:null,prefs:[],decisions:[],lessons:[],memory:[],preferenceVector:{},message:'Supabase server credentials are not configured.'});try{const u=new URL(req.url);return NextResponse.json({ok:true,configured:true,...await getFounderContext(u.searchParams.get('founder')||'primary')})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Founder memory failed'},{status:500})}}