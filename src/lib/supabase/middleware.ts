import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DUMMY_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.dummy'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DUMMY_JWT
  const pathname = request.nextUrl.pathname

  // Bypass hoàn toàn cho static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return supabaseResponse
  }

  // Bypass nếu không có Supabase config
  if (url === 'https://placeholder.supabase.co') {
    return supabaseResponse
  }

  // ============================================================
  // CHECK ADMIN ROUTES - dùng cookie nhanh, không cần gọi Supabase
  // ============================================================
  if (pathname.startsWith('/admin')) {
    const adminRoleCookie = request.cookies.get('issac_admin_role')
    if (adminRoleCookie?.value) {
      // Admin cookie tồn tại → cho qua ngay (không cần verify Supabase)
      return supabaseResponse
    }
    // Không có cookie → check Supabase session nhanh
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })
    // Dùng getSession() (local check, không network) để nhanh hơn
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      redirectUrl.searchParams.set('role', 'admin')
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  // ============================================================
  // CHECK MEMBER ROUTES - cần session Supabase
  // ============================================================
  if (pathname.startsWith('/member')) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })
    // getSession() check local JWT - nhanh, không cần network call
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Refresh session token nếu cần (cập nhật cookie)
    await supabase.auth.getUser()
    return supabaseResponse
  }

  // Các route khác (/, /login, /register, v.v.) → cho qua tự do
  return supabaseResponse
}
