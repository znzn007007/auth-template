"use client";

// ============================================================================
// 通用客户端认证上下文 - Next.js + Supabase
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, type AuthChangeEvent } from "@supabase/supabase-js";
import { createClient } from "../utils/supabase-client";

const supabase = createClient();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGitHub: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * 自定义重定向URL（可选）
   */
  redirectTo?: string;
}

export function AuthProvider({ children, redirectTo }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultRedirectTo = redirectTo || `${window?.location?.origin}/auth/callback`;

  useEffect(() => {
    // 只在客户端执行，避免 SSR 问题
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // 获取初始用户状态 - 使用安全的 getUser() 方法
    const getInitialUser = async () => {
      try {
        const {
          data: { user },
          error
        } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Failed to get user:", error);
          setUser(null);
          setSession(null);
        } else {
          setUser(user);
          // 仍需要session来获取访问令牌等，但不依赖其中的用户信息
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        console.error("Failed to get user:", error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // 监听认证状态变化 - 注意：这里的user参数是可信的
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // onAuthStateChange 中的用户信息是可信的，因为它来自服务器推送
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: defaultRedirectTo,
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: defaultRedirectTo,
      },
    });
    return { error };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: defaultRedirectTo,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window?.location?.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}