import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'super-secret-simaru-key-32-chars-max'
const encodedKey = new TextEncoder().encode(secretKey)

export async function proxy(request: NextRequest) {
  const cookie = request.cookies.get('session')?.value
  
  // Protect /requester, /admin, /approver routes
  const isDashboardRoute = 
    request.nextUrl.pathname.startsWith('/requester') || 
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/approver') ||
    request.nextUrl.pathname === '/'

  if (isDashboardRoute) {
    if (!cookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(cookie, encodedKey, {
        algorithms: ['HS256'],
      })

      const role = payload.role as string

      // Handle root redirect based on role
      if (request.nextUrl.pathname === '/') {
        if (role === 'REQUESTOR') return NextResponse.redirect(new URL('/requester', request.url))
        if (role === 'APPROVER') return NextResponse.redirect(new URL('/approver', request.url))
        // Aggregator and Super Admin go to /admin
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Handle specific routes
      if (request.nextUrl.pathname.startsWith('/requester') && role !== 'REQUESTOR') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (request.nextUrl.pathname.startsWith('/admin') && !['AGGREGATOR', 'SUPER_ADMIN'].includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      if (request.nextUrl.pathname.startsWith('/approver') && role !== 'APPROVER') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

    } catch (err) {
      // Invalid token - clear cookie and redirect
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session')
      return response
    }
  }

  // Prevent logged in users from seeing login page
  if (request.nextUrl.pathname === '/login') {
    if (request.nextUrl.searchParams.has('logout')) {
      const response = NextResponse.next()
      response.cookies.delete('session')
      return response
    }

    if (cookie) {
      try {
        const { payload } = await jwtVerify(cookie, encodedKey, { algorithms: ['HS256'] })
        const role = payload.role as string
        if (role === 'REQUESTOR') return NextResponse.redirect(new URL('/requester', request.url))
        if (role === 'APPROVER') return NextResponse.redirect(new URL('/approver', request.url))
        return NextResponse.redirect(new URL('/admin', request.url))
      } catch (err) {
        // Just continue to login if token is invalid
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
