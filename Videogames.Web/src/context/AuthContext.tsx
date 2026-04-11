"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  logout: () => void;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user only on client side after mount
    if (typeof window !== "undefined") {
      const authService = new AuthService();
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    }
  }, []);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
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
