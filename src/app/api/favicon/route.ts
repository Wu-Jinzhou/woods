import { NextResponse } from 'next/server'

/**
 * Simple favicon proxy to avoid CORS blocks on clients.
 * Uses Google's favicon service server-side and returns the image with permissive CORS headers.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('url')

  if (!target) {
    return new NextResponse('Missing url', { status: 400 })
  }

  try {
    const encoded = encodeURIComponent(target)
    const upstream = `https://www.google.com/s2/favicons?sz=64&domain_url=${encoded}`

    const res = await fetch(upstream, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`Upstream favicon failed: ${res.status}`)
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/png'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    // Fallback to a transparent 1x1 PNG
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7X8p8AAAAASUVORK5CYII=',
      'base64'
    )
    return new NextResponse(transparentPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}
