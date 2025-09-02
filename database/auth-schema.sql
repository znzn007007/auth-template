-- ============================================================================
-- 通用认证数据库架构 - Next.js + Supabase
-- ============================================================================

-- 注意：此脚本假设你已经启用了Supabase Auth
-- 在Supabase项目中，auth.users表会自动创建

-- ============================================================================
-- 用户档案扩展表
-- ============================================================================

-- 创建 profiles 表（用户扩展信息）
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    
    -- 可扩展的业务字段（根据项目需求添加）
    -- plan TEXT DEFAULT 'free',
    -- quota INTEGER DEFAULT 0,
    -- subscription_status TEXT DEFAULT 'none',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================================================
-- 核心存储过程
-- ============================================================================

-- 获取或创建用户档案
CREATE OR REPLACE FUNCTION public.get_or_create_profile(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    profile_record public.profiles;
BEGIN
    -- 尝试获取现有档案
    SELECT * INTO profile_record
    FROM public.profiles
    WHERE user_id = user_uuid;

    -- 如果不存在，创建新档案
    IF NOT FOUND THEN
        INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
        SELECT 
            user_uuid,
            COALESCE(au.email, ''),
            COALESCE(au.raw_user_meta_data->>'full_name', ''),
            COALESCE(au.raw_user_meta_data->>'avatar_url', '')
        FROM auth.users au
        WHERE au.id = user_uuid
        RETURNING * INTO profile_record;
        
        -- 如果仍然没有找到用户，返回错误
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'USER_NOT_FOUND',
                'message', 'User not found in auth.users'
            );
        END IF;
        
        -- 返回新创建的档案
        RETURN jsonb_build_object(
            'success', true,
            'code', 'CREATED',
            'message', 'Profile created successfully',
            'profile', row_to_json(profile_record)
        );
    END IF;

    -- 返回现有档案
    RETURN jsonb_build_object(
        'success', true,
        'code', 'FOUND',
        'message', 'Profile found',
        'profile', row_to_json(profile_record)
    );
END;
$$;

-- 更新用户档案信息
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_uuid UUID,
    profile_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    updated_profile public.profiles;
BEGIN
    -- 更新用户档案
    UPDATE public.profiles
    SET 
        email = COALESCE(profile_data->>'email', email),
        full_name = COALESCE(profile_data->>'full_name', full_name),
        avatar_url = COALESCE(profile_data->>'avatar_url', avatar_url),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = user_uuid
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'User profile not found'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'UPDATED',
        'message', 'Profile updated successfully',
        'profile', row_to_json(updated_profile)
    );
END;
$$;

-- ============================================================================
-- 自动化触发器
-- ============================================================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;

-- 为 profiles 表创建 updated_at 触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- auth.users 同步到 profiles 表
-- ============================================================================

-- 同步函数：将 auth.users 的变更同步到 profiles 表
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_users()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 新用户注册时自动创建 profile
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.profiles (user_id, email, full_name, avatar_url, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
            TIMEZONE('utc'::text, NOW()),
            TIMEZONE('utc'::text, NOW())
        )
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
    END IF;
    
    -- 用户信息更新时同步到 profiles
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.profiles
        SET 
            email = NEW.email,
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', public.profiles.full_name),
            avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', public.profiles.avatar_url),
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE user_id = NEW.id;
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS _trg_sync_profile_from_auth_users ON auth.users;
CREATE TRIGGER _trg_sync_profile_from_auth_users
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_from_auth_users();

-- ============================================================================
-- 测试数据和验证函数
-- ============================================================================

-- 测试数据库设置是否正确
CREATE OR REPLACE FUNCTION public.test_auth_setup()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_result JSONB;
BEGIN
    -- 模拟创建用户档案
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (test_user_id, 'test@example.com', 'Test User');
    
    -- 测试获取档案
    SELECT public.get_or_create_profile(test_user_id) INTO test_result;
    
    -- 清理测试数据
    DELETE FROM public.profiles WHERE user_id = test_user_id;
    
    -- 检查结果
    IF (test_result->>'success')::boolean THEN
        RETURN 'Auth setup test passed ✓';
    ELSE
        RETURN 'Auth setup test failed ✗: ' || (test_result->>'message');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- 清理可能的测试数据
        DELETE FROM public.profiles WHERE user_id = test_user_id;
        RETURN 'Auth setup test error: ' || SQLERRM;
END;
$$;

-- 运行测试
SELECT public.test_auth_setup();