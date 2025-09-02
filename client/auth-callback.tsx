"use client";

// ============================================================================
// 通用OAuth认证回调组件 - Next.js + Supabase
// ============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase-client";
import type { Session } from "@supabase/supabase-js";

// 注意：这些UI组件需要根据项目的UI库进行调整
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AuthCallbackProps {
  /**
   * 认证成功后重定向路径
   */
  successRedirect?: string;
  /**
   * 认证失败后重定向路径
   */
  errorRedirect?: string;
  /**
   * 成功延迟时间(ms)
   */
  successDelay?: number;
  /**
   * 失败延迟时间(ms)
   */
  errorDelay?: number;
}

export default function AuthCallback({
  successRedirect = "/",
  errorRedirect = "/login",
  successDelay = 1500,
  errorDelay = 3000
}: AuthCallbackProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("正在处理认证...");
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const currentUrl = new URL(window.location.href);
        
        // 检查OAuth错误参数
        const oauthError =
          currentUrl.searchParams.get("error_description") ||
          currentUrl.searchParams.get("error");
        if (oauthError) {
          throw new Error(decodeURIComponent(oauthError));
        }

        const hasCode = !!currentUrl.searchParams.get("code");
        let session: Session | null = null;

        const supabase = createClient();
        
        if (hasCode) {
          try {
            // 尝试使用code换取session
            const { data, error } = await supabase.auth.exchangeCodeForSession(
              currentUrl.toString()
            );
            if (error) throw error;
            session = data.session;
          } catch (e: any) {
            // 当缺少 code_verifier 或重复进入回调时，回退到 getSession
            console.warn("exchangeCodeForSession失败，回退到getSession:", e.message);
            const { data } = await supabase.auth.getSession();
            session = data.session;
          } finally {
            // 清理 URL 上的 code 等查询参数
            window.history.replaceState(
              {},
              document.title,
              currentUrl.pathname
            );
          }
        } else {
          // 没有code参数，直接获取session
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data.session;
        }

        if (session) {
          setStatus("success");
          setMessage("认证成功！正在跳转...");
          setTimeout(() => {
            router.push(successRedirect);
          }, successDelay);
        } else {
          throw new Error("未获取到认证会话");
        }
      } catch (error: any) {
        console.error("认证回调错误:", error);
        setStatus("error");
        setMessage(error.message || "认证失败，请重试");

        // 延迟跳转到登录页面
        setTimeout(() => {
          router.push(errorRedirect);
        }, errorDelay);
      }
    };

    handleAuthCallback();
  }, [router, successRedirect, errorRedirect, successDelay, errorDelay]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "border-blue-500/50 bg-blue-500/10";
      case "success":
        return "border-green-500/50 bg-green-500/10";
      case "error":
        return "border-red-500/50 bg-red-500/10";
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "loading":
        return "处理认证中";
      case "success":
        return "认证成功";
      case "error":
        return "认证失败";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <CardTitle className="text-xl">{getStatusTitle()}</CardTitle>
        </CardHeader>

        <CardContent>
          <Alert className={`${getStatusColor()} border`}>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>

          {status === "error" && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                即将跳转到登录页面...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                即将跳转到首页...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}