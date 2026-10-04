import {NextResponse} from 'next/server'
import {providerHealth} from '../../../../lib/execution/providers'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){return NextResponse.json({ok:true,providers:providerHealth()})}