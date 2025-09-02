// ============================================================================
// 通用认证类型定义 - Next.js + Supabase
// ============================================================================

import type { User } from '@supabase/supabase-js'

/**
 * 认证会话信息
 */
export interface AuthSession {
  user: {
    id: string
    email: string
    user_metadata: Record<string, any>
  }
  access_token: string
}

/**
 * 用户基础档案信息
 */
export interface UserProfile {
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  
  // 可扩展的业务字段（根据项目需求调整）
  [key: string]: any
}

/**
 * 认证上下文类型
 */
export interface AuthContextType {
  user: User | null
  session: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithGitHub: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

/**
 * 统一API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * 认证错误类型
 */
export interface AuthError {
  message: string
  status?: number
  code?: string
}

/**
 * OAuth提供商类型
 */
export type OAuthProvider = 'google' | 'github' | 'facebook' | 'twitter' | 'apple'

/**
 * 认证配置类型
 */
export interface AuthConfig {
  /**
   * 启用的OAuth提供商
   */
  enabledProviders: OAuthProvider[]
  /**
   * 是否启用邮箱密码登录
   */
  enableEmailLogin: boolean
  /**
   * 默认重定向URL
   */
  defaultRedirectTo: string
  /**
   * 会话配置
   */
  session: {
    autoRefresh: boolean
    persistSession: boolean
  }
}

/**
 * 用户权限检查结果
 */
export interface PermissionCheckResult {
  authorized: boolean
  user?: UserProfile
  reason?: string
}

/**
 * 存储过程返回格式
 */
export interface ProcedureResult<T = any> {
  success: boolean
  code: string
  message: string
  data?: T
  profile?: T
}

/**
 * 用户创建/更新数据
 */
export interface UserUpdateData {
  email?: string
  full_name?: string
  avatar_url?: string
  
  // 可扩展的业务字段
  [key: string]: any
}