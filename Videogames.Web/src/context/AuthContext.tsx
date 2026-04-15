"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { User } from "../domain/models/User";
import { AuthService } from "../infrastructure/services/AuthService";
import {
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
} from "../domain/ports/IAuthService";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (idToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const authService = new AuthService();
    return authService.getCurrentUser();
  });
  const loading = false;

  const login = async (credentials: LoginRequest) => {
    const authService = new AuthService();
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const authService = new AuthService();
    const response = await authService.register(data);
    if (response.user) {
      setUser(response.user);
    }
  };

  const logout = () => {
    const authService = new AuthService();
    authService.logout();
    setUser(null);
  };

  const updateUser = async (id: string, data: UpdateUserRequest) => {
    const authService = new AuthService();
    const updatedUser = await authService.updateUser(id, data);
    setUser(updatedUser);
  };

  const loginWithGoogle = async (idToken: string) => {
    const authService = new AuthService();
    const response = await authService.loginWithGoogle(idToken);
    setUser(response.user);
  };

  const loginWithApple = async (idToken: string) => {
    const authService = new AuthService();
    const response = await authService.loginWithApple(idToken);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        logout,
        updateUser,
        isAuthenticated: !!user,
        loading,
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
