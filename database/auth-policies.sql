-- ============================================================================
-- 通用认证安全策略 (RLS) - Next.js + Supabase
-- ============================================================================

-- 注意：此脚本设置Row Level Security (RLS) 策略
-- 确保在执行此脚本之前已经创建了基础表结构

-- ============================================================================
-- 启用 RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles 表的 RLS 策略
-- ============================================================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "service_role_full_access_profiles" ON public.profiles;

-- 用户只能读取自己的档案
CREATE POLICY "read_own_profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 用户只能更新自己的档案
CREATE POLICY "update_own_profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 用户只能插入自己的档案
CREATE POLICY "insert_own_profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service Role 拥有完全访问权限（用于服务端管理操作）
CREATE POLICY "service_role_full_access_profiles"
    ON public.profiles
    FOR ALL
    USING (COALESCE(auth.jwt() ->> 'role','') = 'service_role');

-- ============================================================================
-- 索引优化
-- ============================================================================

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

-- ============================================================================
-- 权限验证函数
-- ============================================================================

-- 检查用户是否有权限访问资源
CREATE OR REPLACE FUNCTION public.check_user_permission(
    resource_user_id UUID,
    required_permission TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查当前用户是否已认证
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 检查是否为资源所有者
    IF auth.uid() = resource_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- 检查是否为 Service Role
    IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- 这里可以添加更多权限检查逻辑
    -- 例如：管理员权限、团队成员权限等
    
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- 安全工具函数
-- ============================================================================

-- 获取当前认证用户的ID（安全版本）
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN auth.uid();
END;
$$;

-- 检查用户是否为管理员（可扩展）
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 检查 Service Role
    IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
        RETURN TRUE;
    END IF;
    
    -- 这里可以添加基于用户档案的管理员检查
    -- 例如：检查 profiles 表中的 role 字段
    
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- 审计日志（可选）
-- ============================================================================

-- 创建审计日志表（如果需要记录敏感操作）
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 启用审计日志表的 RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 审计日志策略
CREATE POLICY "read_own_audit_logs"
    ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "service_role_full_access_audit_logs"
    ON public.audit_logs
    FOR ALL
    USING (COALESCE(auth.jwt() ->> 'role','') = 'service_role');

-- 审计日志记录函数
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_old_values,
        p_new_values
    );
END;
$$;

-- ============================================================================
-- 安全测试和验证
-- ============================================================================

-- 测试RLS策略是否正常工作
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    test_result TEXT := '';
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- 这个函数应该在应用层面进行测试，因为需要真实的认证上下文
    -- 此处提供测试框架
    
    test_result := 'RLS policies configured. Test with real authenticated users.';
    
    -- 可以添加基本的表结构验证
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        test_result := test_result || ' ✓ profiles table exists.';
    ELSE
        test_result := test_result || ' ✗ profiles table missing.';
    END IF;
    
    -- 检查RLS是否启用
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        test_result := test_result || ' ✓ RLS enabled on profiles.';
    ELSE
        test_result := test_result || ' ✗ RLS not enabled on profiles.';
    END IF;
    
    RETURN test_result;
END;
$$;

-- 运行RLS测试
SELECT public.test_rls_policies();