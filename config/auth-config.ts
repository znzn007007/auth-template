// ============================================================================
// 通用认证配置 - Next.js + Supabase
// ============================================================================

import type { AuthConfig, OAuthProvider } from '../types/auth-types'

/**
 * 基础认证配置
 * 根据项目需求调整这些配置
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  // 启用的OAuth提供商
  enabledProviders: ['google', 'github'] as OAuthProvider[],
  
  // 是否启用邮箱密码登录
  enableEmailLogin: true,
  
  // 默认重定向URL
  defaultRedirectTo: '/',
  
  // 会话配置
  session: {
    autoRefresh: true,
    persistSession: true
  }
}

/**
 * Supabase配置（从环境变量读取）
 */
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}

/**
 * 认证路由配置
 */
export const AUTH_ROUTES = {
  login: '/login',
  signup: '/signup',
  callback: '/auth/callback',
  resetPassword: '/auth/reset-password',
  dashboard: '/dashboard',
  home: '/',
} as const

/**
 * OAuth重定向URL配置
 * 根据部署环境自动调整
 */
export const getOAuthRedirectUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  
  return {
    callback: `${baseUrl}${AUTH_ROUTES.callback}`,
    resetPassword: `${baseUrl}${AUTH_ROUTES.resetPassword}`,
  }
}

/**
 * 安全配置
 */
export const SECURITY_CONFIG = {
  // 密码要求
  password: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
  },
  
  // 会话配置
  session: {
    // 会话超时时间（秒）
    maxAge: 7 * 24 * 60 * 60, // 7天
    
    // 是否在浏览器关闭时清除会话
    clearOnBrowserClose: false,
  },
  
  // 限流配置（可选，需要在应用层实现）
  rateLimit: {
    loginAttempts: 5,      // 登录尝试次数
    lockoutDuration: 300,   // 锁定时间（秒）
  }
}

/**
 * UI配置
 */
export const UI_CONFIG = {
  // 默认主题
  theme: {
    primary: '#0070f3',
    background: '#ffffff',
    text: '#000000',
  },
  
  // 加载状态文本
  loadingText: {
    verifying: '验证身份中...',
    signingIn: '登录中...',
    signingUp: '注册中...',
    redirecting: '正在跳转...',
  },
  
  // 错误消息
  errorMessages: {
    networkError: '网络错误，请检查连接',
    invalidCredentials: '邮箱或密码错误',
    emailNotConfirmed: '请检查邮箱并确认注册',
    weakPassword: '密码强度不够',
    emailAlreadyExists: '邮箱已被注册',
    unknownError: '发生未知错误，请重试',
  }
}

/**
 * 开发环境配置
 */
export const DEV_CONFIG = {
  // 是否显示调试信息
  enableDebugLogs: process.env.NODE_ENV === 'development',
  
  // 测试用户（仅开发环境）
  testUsers: process.env.NODE_ENV === 'development' ? [
    {
      email: 'test@example.com',
      password: 'testpass123',
      name: 'Test User'
    }
  ] : [],
  
  // 是否跳过邮箱确认（仅开发环境）
  skipEmailConfirmation: process.env.NODE_ENV === 'development',
}

/**
 * 根据环境获取完整配置
 */
export const getAuthConfig = (): AuthConfig & {
  supabase: typeof SUPABASE_CONFIG;
  routes: typeof AUTH_ROUTES;
  security: typeof SECURITY_CONFIG;
  ui: typeof UI_CONFIG;
  dev: typeof DEV_CONFIG;
} => {
  return {
    ...DEFAULT_AUTH_CONFIG,
    supabase: SUPABASE_CONFIG,
    routes: AUTH_ROUTES,
    security: SECURITY_CONFIG,
    ui: UI_CONFIG,
    dev: DEV_CONFIG,
  }
}

/**
 * 验证环境变量是否完整
 */
export const validateAuthConfig = (): { valid: boolean; missingVars: string[] } => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  return {
    valid: missingVars.length === 0,
    missingVars
  }
}