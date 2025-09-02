// ============================================================================
// 通用认证模块导出 - Next.js + Supabase
// ============================================================================

// 服务端认证
export * from './server/server-auth'

// 客户端组件
export { AuthProvider, useAuth } from './client/auth-context'
export { AuthGuard, withAuth } from './client/auth-guard'
export { LoginForm } from './client/login-form'
export { default as AuthCallback } from './client/auth-callback'

// 工具函数
export { createClient as createSupabaseClient } from './utils/supabase-client'
export { createClient as createServerSupabaseClient, createAdminClient } from './utils/supabase-server'
export { withSupabaseSessionRefresh, authMiddlewareConfig } from './utils/supabase-middleware'

// 配置
export * from './config/auth-config'

// 类型定义
export * from './types/auth-types'