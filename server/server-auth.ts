// ============================================================================
// 通用服务端认证系统 - Next.js + Supabase
// ============================================================================

/* Service Layer - Server Only */
import { createClient as createServerSupabase } from '../utils/supabase-server'
import type { AuthSession, UserProfile } from '../types/auth-types'

/**
 * 服务端认证 - 获取当前用户会话（安全方式）
 * @returns 用户会话信息或null
 */
export async function getServerSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createServerSupabase()

    // ✅ 使用 getUser() 验证用户身份 - 这是安全的方式
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // 获取访问令牌（如果需要）- 注意这里仍需要session，但只用于获取token
    const { data: { session } } = await supabase.auth.getSession()

    return {
      user: {
        id: user.id,
        email: user.email!,
        user_metadata: user.user_metadata || {}
      },
      access_token: session?.access_token || ''
    }
  } catch (error) {
    console.error('getServerSession error:', error)
    return null
  }
}

/**
 * 服务端认证 - 获取当前用户ID
 * @returns 用户ID或null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession()
  return session?.user?.id || null
}

/**
 * 服务端认证 - 验证用户身份并返回用户资料
 * @returns 用户资料或null
 */
export async function authenticateUser(): Promise<UserProfile | null> {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return null
    }

    const supabase = await createServerSupabase()

    // 获取或创建用户profile
    const { data: result, error } = await supabase
      .rpc('get_or_create_profile', {
        user_uuid: session.user.id
      })

    if (error) {
      console.error('获取用户资料失败:', error)
      return null
    }

    // 处理存储过程返回结果
    if (result && typeof result === 'object') {
      const profileResult = result as any
      if (!profileResult.success) {
        console.error('获取用户资料失败:', profileResult.message)
        return null
      }

      const profile = profileResult.profile
      if (!profile) {
        console.error('用户资料为空')
        return null
      }

      return {
        ...profile,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url
      }
    }

    return null
  } catch (error) {
    console.error('authenticateUser error:', error)
    return null
  }
}

/**
 * 检查用户是否已认证
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId()
  return userId !== null
}

/**
 * 获取用户基本信息（不包含业务字段）
 * @param userId 用户ID
 * @returns 用户基本信息
 */
export async function getUserBasicInfo(userId: string): Promise<{
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
} | null> {
  try {
    const supabase = await createServerSupabase()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('user_id, email, full_name, avatar_url, created_at, updated_at')
      .eq('user_id', userId)
      .single()

    if (error || !profile) {
      return null
    }

    return {
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }
  } catch (error) {
    console.error('getUserBasicInfo error:', error)
    return null
  }
}

/**
 * 验证用户权限（可扩展业务权限检查）
 * @param userId 用户ID
 * @param permission 权限名称（可选）
 * @returns 权限检查结果
 */
export async function checkUserPermission(
  userId: string, 
  permission?: string
): Promise<{ authorized: boolean; user?: UserProfile }> {
  try {
    const user = await authenticateUser()
    
    if (!user || user.user_id !== userId) {
      return { authorized: false }
    }

    // 这里可以添加具体的权限检查逻辑
    // 例如：检查用户角色、订阅状态等
    
    return { authorized: true, user }
  } catch (error) {
    console.error('checkUserPermission error:', error)
    return { authorized: false }
  }
}