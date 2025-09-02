# 通用认证模块 - Next.js + Supabase

一套完整的、可复用的认证系统模板，基于 Next.js 15 和 Supabase，支持多种认证方式和完整的用户管理功能。

## ✨ 特性

- 🔐 **多种认证方式**: 邮箱密码、Google OAuth、GitHub OAuth
- 🛡️ **安全第一**: 使用 Supabase Auth 的安全最佳实践
- 🎨 **组件化设计**: 开箱即用的 React 组件
- 📱 **响应式UI**: 适配移动端和桌面端
- 🔄 **会话管理**: 自动刷新和持久化
- 🗄️ **RLS 安全**: Row Level Security 数据保护
- 🚀 **TypeScript**: 完整的类型定义
- ⚡ **性能优化**: SSR 友好，避免布局偏移

## 📁 文件结构

```
auth-template/
├── server/                    # 服务端认证逻辑
│   └── server-auth.ts        # 核心服务端认证函数
├── client/                    # 客户端认证组件  
│   ├── auth-context.tsx      # React认证上下文
│   ├── login-form.tsx        # 登录表单组件
│   ├── auth-guard.tsx        # 路由保护组件
│   └── auth-callback.tsx     # OAuth回调页面
├── utils/                     # 工具函数
│   ├── supabase-client.ts    # 浏览器端Supabase客户端
│   ├── supabase-server.ts    # 服务端Supabase客户端
│   └── supabase-middleware.ts # 中间件配置
├── database/                  # 数据库模板
│   ├── auth-schema.sql       # 用户表和存储过程
│   └── auth-policies.sql     # RLS安全策略
├── types/                     # TypeScript类型
│   └── auth-types.ts         # 认证相关类型定义
├── config/                    # 配置模板
│   ├── auth-config.ts        # 认证配置
│   └── .env.template         # 环境变量模板
└── README.md                 # 使用说明
```

## 🚀 快速开始

### 1. 复制模板文件

将整个 `auth-template` 文件夹复制到你的新项目中：

```bash
cp -r auth-template /path/to/your/new-project/
```

### 2. 配置环境变量

复制环境变量模板并填入实际值：

```bash
cd your-new-project
cp auth-template/config/.env.template .env.local
```

编辑 `.env.local`：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 应用配置
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 在项目设置中获取 URL 和 API Keys
3. 在 SQL Editor 中执行数据库迁移：

```sql
-- 1. 执行基础架构
-- 复制 auth-template/database/auth-schema.sql 的内容到 SQL Editor

-- 2. 执行安全策略  
-- 复制 auth-template/database/auth-policies.sql 的内容到 SQL Editor
```

### 4. 配置 OAuth 提供商（可选）

在 Supabase 项目的 Authentication > Providers 中配置：

**Google:**
1. 在 [Google Cloud Console](https://console.cloud.google.com) 创建 OAuth 应用
2. 设置重定向 URI: `https://your-project-id.supabase.co/auth/v1/callback`
3. 在 Supabase 中填入 Client ID 和 Client Secret

**GitHub:**
1. 在 GitHub Settings > Developer settings 创建 OAuth 应用
2. 设置 Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
3. 在 Supabase 中填入 Client ID 和 Client Secret

### 5. 集成到 Next.js 项目

#### 5.1 更新 layout.tsx

```tsx
// app/layout.tsx
import { AuthProvider } from './auth-template/client/auth-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### 5.2 创建登录页面

```tsx
// app/login/page.tsx
import { LoginForm } from '../auth-template/client/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm 
        title="欢迎登录"
        redirectTo="/dashboard"
        enableGoogleLogin={true}
        enableGitHubLogin={true}
      />
    </div>
  )
}
```

#### 5.3 创建认证回调页面

```tsx
// app/auth/callback/page.tsx
import AuthCallback from '../../auth-template/client/auth-callback'

export default function CallbackPage() {
  return <AuthCallback />
}
```

#### 5.4 保护需要认证的页面

```tsx
// app/dashboard/page.tsx
import { AuthGuard } from '../auth-template/client/auth-guard'

export default function DashboardPage() {
  return (
    <AuthGuard redirectTo="/login">
      <div>
        <h1>用户仪表盘</h1>
        {/* 你的受保护内容 */}
      </div>
    </AuthGuard>
  )
}
```

#### 5.5 配置中间件

```tsx
// middleware.ts
import { withSupabaseSessionRefresh, authMiddlewareConfig } from './auth-template/utils/supabase-middleware'

export async function middleware(request: NextRequest) {
  return await withSupabaseSessionRefresh(request)
}

export const config = authMiddlewareConfig
```

## 📚 使用指南

### 认证上下文使用

```tsx
import { useAuth } from './auth-template/client/auth-context'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>加载中...</div>
  if (!user) return <div>请先登录</div>

  return (
    <div>
      <p>欢迎, {user.email}!</p>
      <button onClick={signOut}>退出登录</button>
    </div>
  )
}
```

### 服务端认证检查

```tsx
// Server Component 或 Server Action
import { getCurrentUserId, authenticateUser } from './auth-template/server/server-auth'

export default async function ServerPage() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    redirect('/login')
  }

  const user = await authenticateUser()
  
  return (
    <div>
      <h1>欢迎 {user.email}</h1>
    </div>
  )
}
```

### 权限检查

```tsx
import { checkUserPermission } from './auth-template/server/server-auth'

export async function protectedAction(resourceUserId: string) {
  const { authorized, user } = await checkUserPermission(resourceUserId)
  
  if (!authorized) {
    throw new Error('无权限访问')
  }
  
  // 执行受保护操作
}
```

## 🎨 自定义配置

### 修改UI样式

所有UI组件都支持自定义样式，通过 className 属性传入：

```tsx
<LoginForm 
  className="my-custom-style"
  title="自定义标题"
  enableEmailLogin={false}  // 禁用邮箱登录
/>
```

### 扩展用户档案

在数据库架构中添加业务字段：

```sql
-- 在 profiles 表中添加字段
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN company TEXT;
```

更新类型定义：

```tsx
// types/auth-types.ts
export interface UserProfile {
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: string        // 新增
  company?: string     // 新增
  created_at: string
  updated_at: string
}
```

### 添加新的OAuth提供商

在配置文件中添加：

```tsx
// config/auth-config.ts
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  enabledProviders: ['google', 'github', 'facebook'], // 添加 facebook
  // ...
}
```

在认证上下文中添加方法：

```tsx
// client/auth-context.tsx
const signInWithFacebook = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: defaultRedirectTo,
    },
  });
  return { error };
};
```

## 🔧 高级功能

### 自定义邮件模板

在 Supabase 项目的 Authentication > Email Templates 中自定义：
- 确认邮箱模板
- 重置密码模板
- 邀请用户模板

### 多因素认证 (MFA)

```tsx
import { supabase } from './auth-template/utils/supabase-client'

// 启用 MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My App'
})

// 验证 MFA
const { data, error } = await supabase.auth.mfa.verify({
  factorId: 'factor-id',
  challengeId: 'challenge-id',
  code: '123456'
})
```

### 社交登录自定义参数

```tsx
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

## 🚨 常见问题

### Q: OAuth 回调失败
**A**: 检查以下配置：
1. Supabase 项目中的 Site URL 设置
2. OAuth 应用中的重定向 URI 配置
3. 环境变量 `NEXT_PUBLIC_SITE_URL` 是否正确

### Q: RLS 权限错误
**A**: 确保：
1. 已执行 `auth-policies.sql` 脚本
2. 使用 `createAdminClient()` 进行管理操作
3. 检查用户是否已正确认证

### Q: 会话无法持久化
**A**: 检查：
1. 中间件是否正确配置
2. Cookie 设置是否允许跨站点
3. HTTPS 配置（生产环境）

### Q: TypeScript 类型错误
**A**: 确保：
1. 已导入正确的类型定义
2. 根据项目结构调整导入路径
3. 扩展的业务字段已更新类型

## 📋 检查清单

部署前确保完成以下步骤：

- [ ] ✅ 复制模板文件到项目
- [ ] ✅ 配置环境变量 (`.env.local`)
- [ ] ✅ 创建 Supabase 项目并获取密钥
- [ ] ✅ 执行数据库迁移脚本
- [ ] ✅ 配置 OAuth 提供商（如需要）
- [ ] ✅ 集成认证组件到 Next.js 项目
- [ ] ✅ 配置中间件
- [ ] ✅ 测试登录/注册流程
- [ ] ✅ 测试受保护页面访问
- [ ] ✅ 测试退出登录功能

## 🛡️ 安全建议

1. **环境变量安全**
   - 永不提交 `.env.local` 到版本控制
   - 使用不同环境的不同密钥
   - 定期轮换 Service Role Key

2. **生产环境配置**
   - 启用 HTTPS
   - 配置正确的 CORS 策略
   - 使用强密码策略

3. **监控和日志**
   - 启用 Supabase 审计日志
   - 监控异常登录活动
   - 实施速率限制

## 🔄 更新和维护

定期检查和更新：
- Supabase SDK 版本
- Next.js 版本
- 依赖包安全更新
- OAuth 应用配置

## 🤝 贡献

欢迎提出改进建议和 Bug 报告！

## 📄 许可证

MIT License - 可自由使用和修改