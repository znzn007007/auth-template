"use client";

// ============================================================================
// 通用认证保护组件 - Next.js + Supabase
// ============================================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * 未登录时重定向的路径
   */
  redirectTo?: string;
  /**
   * 自定义加载组件
   */
  loadingComponent?: React.ReactNode;
  /**
   * 自定义重定向组件
   */
  redirectingComponent?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  redirectTo = "/login",
  loadingComponent,
  redirectingComponent 
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // 使用useEffect处理重定向，避免在渲染期间调用router.push
  useEffect(() => {
    if (!loading && !user && isHydrated) {
      router.push(redirectTo);
    }
  }, [user, loading, router, isHydrated, redirectTo]);

  // 默认加载组件
  const defaultLoadingComponent = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {isHydrated ? "验证身份中..." : "加载中..."}
        </p>
      </div>
    </div>
  );

  // 默认重定向组件
  const defaultRedirectingComponent = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在跳转...</p>
      </div>
    </div>
  );

  // 在服务器端渲染或认证状态加载中时，显示加载状态
  if (!isHydrated || loading) {
    return loadingComponent || defaultLoadingComponent;
  }

  // 如果未登录，显示重定向状态（重定向会在useEffect中处理）
  if (!user) {
    return redirectingComponent || defaultRedirectingComponent;
  }

  // 显示受保护的内容
  return <div className="min-h-screen bg-background">{children}</div>;
}

/**
 * 高阶组件版本的认证保护
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    loadingComponent?: React.ReactNode;
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard 
        redirectTo={options?.redirectTo}
        loadingComponent={options?.loadingComponent}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };
}