"use client";

// ============================================================================
// 通用登录表单组件 - Next.js + Supabase
// ============================================================================

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

// 注意：这些UI组件需要根据项目的UI库进行调整
// 示例使用 shadcn/ui，可替换为其他UI库
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 图标组件，可替换为其他图标库
import { Chrome, Github, Mail, Lock, Loader2 } from "lucide-react";

interface LoginFormProps {
  /**
   * 自定义标题
   */
  title?: string;
  /**
   * 自定义描述文字
   */
  description?: string;
  /**
   * 登录成功后重定向路径
   */
  redirectTo?: string;
  /**
   * 是否启用邮箱密码登录
   */
  enableEmailLogin?: boolean;
  /**
   * 是否启用Google登录
   */
  enableGoogleLogin?: boolean;
  /**
   * 是否启用GitHub登录
   */
  enableGitHubLogin?: boolean;
  /**
   * 自定义样式类名
   */
  className?: string;
}

export function LoginForm({
  title = "欢迎回来",
  description = "选择登录方式",
  redirectTo = "/",
  enableEmailLogin = true,
  enableGoogleLogin = true,
  enableGitHubLogin = true,
  className = ""
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signInWithGitHub } = useAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);
        
      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // 成功时 Supabase 会自动重定向到 OAuth 页面
    } catch (err: any) {
      setError("Google登录失败");
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signInWithGitHub();
      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // 成功时由 Supabase 负责浏览器重定向
    } catch (err: any) {
      setError("GitHub登录失败");
      setIsLoading(false);
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 邮箱密码登录 */}
        {enableEmailLogin && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "注册" : "登录"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                className="text-sm"
              >
                {isSignUp ? "已有账号？点击登录" : "没有账号？点击注册"}
              </Button>
            </div>
          </form>
        )}

        {/* 分隔线 */}
        {enableEmailLogin && (enableGoogleLogin || enableGitHubLogin) && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">或</span>
            </div>
          </div>
        )}

        {/* OAuth登录按钮 */}
        <div className="space-y-3">
          {enableGoogleLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isLoading ? "登录中..." : "使用 Google 登录"}
            </Button>
          )}

          {enableGitHubLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGitHubSignIn}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              {isLoading ? "登录中..." : "使用 GitHub 登录"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}