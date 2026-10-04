import { NextResponse } from 'next/server'
import { configured } from '../../../lib/product-factory/storage'
import { products, productDetail } from '../../../lib/product-factory/engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!configured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      products: [],
      message: 'Server data connection is not configured.'
    })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (id) {
      const detail = await productDetail(Number(id))
      if (!detail) {
        return NextResponse.json({ ok: false, error: 'Product not found.' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, configured: true, ...detail })
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      products: await products()
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Product Factory failed.'
    }, { status: 500 })
  }
}

