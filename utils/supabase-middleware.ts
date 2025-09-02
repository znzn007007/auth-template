/* Service Layer - Server Only */
import 'server-only'

// ============================================================================
// Supabase中间件配置 - 通用模板
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 注意：这些配置需要根据项目的配置文件进行调整
const CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
}

/**
 * Supabase会话刷新中间件
 * 用于在Next.js中间件中自动刷新用户会话
 * 
 * 使用方法：
 * 在 middleware.ts 中导入并使用：
 * 
 * ```typescript
 * import { withSupabaseSessionRefresh } from './auth-template/utils/supabase-middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   return await withSupabaseSessionRefresh(request)
 * }
 * ```
 */
export async function withSupabaseSessionRefresh(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            if (options?.maxAge) {
              res.cookies.set({ 
                name, 
                value, 
                maxAge: options.maxAge, 
                path: options.path ?? '/' 
              })
            } else {
              res.cookies.set(name, value, { path: options?.path ?? '/' })
            }
          })
        }
      }
    }
  )

  // 触发一次 getSession 来确保刷新逻辑执行
  await supabase.auth.getSession()

  return res
}

/**
 * 路径匹配配置（用于middleware.ts）
 */
export const authMiddlewareConfig = {
  matcher: [
    /*
     * 匹配所有路径，除了以下路径：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 其他静态资源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}