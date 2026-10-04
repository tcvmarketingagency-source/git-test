
import {NextResponse} from 'next/server'
import {portfolio} from '../../../lib/portfolio/engine'
import {configured} from '../../../lib/portfolio/storage'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){if(!configured())return NextResponse.json({ok:true,configured:false,products:[],counts:null,message:'Server data connection is not configured.'});try{return NextResponse.json({ok:true,...await portfolio()})}catch(e){return NextResponse.json({ok:false,error:e instanceof Error?e.message:'Portfolio failed'},{status:500})}}
