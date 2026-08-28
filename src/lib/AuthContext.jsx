import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Supabase auth error:", error);
        setAuthError({
          type: "unknown",
          message: error.message,
        });
        setUser(null);
        setIsAuthenticated(false);
      } else {
        setUser(data.session?.user ?? null);
        setIsAuthenticated(!!data.session);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: "auth_required",
        message: error.message,
      });
    } else {
      setUser(data.user);
      setIsAuthenticated(true);
      setAuthError(null);
    }

    setIsLoadingAuth(false);
    setAuthChecked(true);

    return data.user;
  };

  const checkAppState = async () => {
    setAuthChecked(true);
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};