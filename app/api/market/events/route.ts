import {NextResponse} from 'next/server'
import {marketEvents} from '../../../../lib/market/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!(process.env.NEXT_PUBLIC_SUPABASE_URL&&(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)))return NextResponse.json({ok:true,configured:false,events:[],message:'Supabase server credentials are not configured.'});return NextResponse.json({ok:true,configured:true,events:await marketEvents(100)})}