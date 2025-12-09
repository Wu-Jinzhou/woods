
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { PDFParse } from 'pdf-parse'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const parsedUrl = (() => {
      try {
        return new URL(url)
      } catch {
        return null
      }
    })()
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const isAlignmentForum = parsedUrl?.hostname.includes('alignmentforum.org')
    const baseHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    if (isAlignmentForum) {
      baseHeaders['Referer'] = 'https://www.alignmentforum.org/'
      baseHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
    } else if (parsedUrl) {
      baseHeaders['Referer'] = parsedUrl.origin
    }

    // 1. Check for DOI (Digital Object Identifier)
    const doiMatch = url.match(/(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i)
    if (doiMatch) {
      const doi = doiMatch[1]
      try {
        const crossrefRes = await fetch(`https://api.crossref.org/works/${doi}`)
        if (crossrefRes.ok) {
          const data = await crossrefRes.json()
          const item = data.message
          const title = item.title?.[0] || item['container-title']?.[0] || url
          const authors = item.author?.map((a: any) => `${a.given} ${a.family}`).join(', ')
          const description = authors ? `By ${authors}` : ''
          
          return NextResponse.json({
            title: title,
            description: description,
            image: null
          })
        }
      } catch (e) {
        console.error('Crossref fetch failed:', e)
      }
    }

    // 2. ArXiv PDF Handling
    const isArxivPdf = url.includes('arxiv.org/pdf/')
    const isArxivAbs = url.includes('arxiv.org/abs/')
    if (isArxivPdf || isArxivAbs) {
      const absUrl = isArxivPdf ? url.replace('/pdf/', '/abs/').replace('.pdf', '') : url
      const response = await fetch(absUrl, { headers: baseHeaders })
      const html = await response.text()
      const $ = cheerio.load(html)
      const rawTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="citation_title"]').attr('content') || $('title').text()
      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="citation_abstract"]').attr('content') ||
        $('blockquote.abstract').text().replace(/^Abstract:\s*/, '') ||
        ''
      const cleanedTitle = rawTitle?.replace(/\s*\[[^\]]+]\s*/g, '').trim()

      return NextResponse.json({
        title: cleanedTitle || url.split('/').pop(),
        description: description.trim(),
        image: null
      })
    }

    // 3. General Scraping
    let response: Response
    try {
      response = await fetch(url, { headers: baseHeaders, redirect: 'follow', cache: 'no-store' })
    } catch (e) {
      return NextResponse.json({
        title: url,
        description: '',
        image: null
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        title: url,
        description: '',
        image: null
      })
    }

    const contentType = response.headers.get('content-type') || ''
    
    // PDF Handling
    if (contentType.includes('application/pdf') || (url.endsWith('.pdf') && !contentType.includes('text/html'))) {
       let parser: PDFParse | null = null
       try {
         const arrayBuffer = await response.arrayBuffer()
         const buffer = Buffer.from(arrayBuffer)
         
         parser = new PDFParse({ data: buffer })
         const info = await parser.getInfo()
         const textResult = await parser.getText()
         
         // Clean up PDF title
         let pdfTitle = info.info?.Title || url.split('/').pop() || 'Untitled PDF'
         if (pdfTitle === 'Untitled' || !pdfTitle.trim()) {
            pdfTitle = url.split('/').pop() || 'Untitled PDF'
         }

         const description = textResult.text 
            ? textResult.text.substring(0, 200).replace(/\s+/g, ' ').trim() + '...' 
            : 'PDF Document'

         await parser.destroy()

         return NextResponse.json({
           title: pdfTitle,
           description: description,
           image: null
         })
       } catch (e) {
         console.error('PDF parse failed:', e)
         if (parser) await parser.destroy()
         return NextResponse.json({
           title: url.split('/').pop() || 'Untitled PDF',
           description: 'PDF Document',
           image: null
         })
       }
    }

    // Blocked PDF check
    if (url.endsWith('.pdf') && contentType.includes('text/html')) {
      return NextResponse.json({
        title: url.split('/').pop() || 'Untitled PDF',
        description: 'PDF Document (Metadata unavailable)',
        image: null
      })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const title = 
      $('meta[property="og:title"]').attr('content') || 
      $('title').text() || 
      $('meta[name="twitter:title"]').attr('content') ||
      url

    const description = 
      $('meta[property="og:description"]').attr('content') || 
      $('meta[name="description"]').attr('content') || 
      $('meta[name="twitter:description"]').attr('content') ||
      ''

    const image = 
      $('meta[property="og:image"]').attr('content') || 
      $('meta[name="twitter:image"]').attr('content') ||
      ''

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image || `/api/favicon?url=${encodeURIComponent(url)}`
    })

  } catch (error) {
    return NextResponse.json({ 
      title: url, 
      description: '', 
      image: '' 
    })
  }
}
