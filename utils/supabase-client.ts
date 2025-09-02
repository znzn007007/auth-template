"use client"

// ============================================================================
// Supabase浏览器端客户端配置 - 通用模板
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'

// 注意：这些配置需要根据项目的配置文件进行调整
// 示例假设使用类似的配置结构
const CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
}

export function createClient() {
  return createBrowserClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'  // 推荐使用PKCE流程提高安全性
      }
    }
  )
}

// 创建单例实例（可选）
let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}