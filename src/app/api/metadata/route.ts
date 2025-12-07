
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
    if (url.includes('arxiv.org/pdf/')) {
      const absUrl = url.replace('/pdf/', '/abs/').replace('.pdf', '')
      const response = await fetch(absUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      const html = await response.text()
      const $ = cheerio.load(html)
      const title = $('meta[property="og:title"]').attr('content') || $('title').text()
      const description = $('meta[property="og:description"]').attr('content') || ''
      
      return NextResponse.json({
        title: title?.replace(' [math.GM]', '') || url.split('/').pop(),
        description,
        image: null
      })
    }

    // 3. General Scraping
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(url).origin
      }
    })

    const contentType = response.headers.get('content-type') || ''
    
    // PDF Handling
    if (contentType.includes('application/pdf') || (url.endsWith('.pdf') && !contentType.includes('text/html'))) {
       let parser = null
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
      image: image
    })

  } catch (error) {
    return NextResponse.json({ 
      title: url, 
      description: '', 
      image: '' 
    })
  }
}
