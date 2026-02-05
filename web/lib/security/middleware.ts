import { NextRequest, NextResponse } from 'next/server'
import { sanitizeObject, sanitizeText } from './xss'

export async function sanitizeRequestBody(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitizedBody = sanitizeObject(body)
    
    const sanitizedRequest = new NextRequest(request, {
      body: JSON.stringify(sanitizedBody),
      headers: request.headers,
    })
    
    return sanitizedRequest
  } catch {
    return request
  }
}

// CSP (Content Security Policy) middleware
export function withSecurityHeaders() {
  return function securityHeaders(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    
    const csp = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ')
    
    const response = NextResponse.next()
    
    response.headers.set('Content-Security-Policy', csp)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
}