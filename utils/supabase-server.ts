/* Service Layer - Server Only */
import 'server-only'

// ============================================================================
// Supabase服务端客户端配置 - 通用模板
// ============================================================================

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// 注意：这些配置需要根据项目的配置文件进行调整
const CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }
}

/**
 * 创建服务端Supabase客户端（使用用户身份）
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions['options'] }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component 中直接 set 可能报错；依赖 middleware 兜底刷新会话
          }
        }
      }
    }
  )
}

/**
 * 创建管理员权限的Supabase客户端（绕过RLS）
 * 注意：仅用于服务端管理操作，不要暴露到客户端
 */
export function createAdminClient() {
  return createServerClient(
    CONFIG.supabase.url,
    CONFIG.supabase.serviceKey,  // 使用Service Role Key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * 获取配置信息（用于其他服务）
 */
export function getSupabaseConfig() {
  return {
    url: CONFIG.supabase.url,
    anonKey: CONFIG.supabase.anonKey,
    serviceKey: CONFIG.supabase.serviceKey,
  }
}