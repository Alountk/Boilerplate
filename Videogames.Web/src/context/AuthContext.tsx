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
  sendRegistrationCode: (email: string) => Promise<void>;
  confirmRegistrationCode: (email: string, code: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (idToken: string) => Promise<void>;
  logout: () => void;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // user arranca null en server y cliente para hidratar idéntico.
  // Se carga desde localStorage en un efecto post-montaje; loading=true
  // mientras tanto evita flashes/redirecciones en guards.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authService = new AuthService();
    setUser(authService.getCurrentUser());
    setLoading(false);
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

  const sendRegistrationCode = async (email: string) => {
    const authService = new AuthService();
    await authService.sendRegistrationCode(email);
  };

  const confirmRegistrationCode = async (email: string, code: string): Promise<boolean> => {
    const authService = new AuthService();
    const response = await authService.confirmRegistrationCode(email, code);
    return !!response.verified;
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
        sendRegistrationCode,
        confirmRegistrationCode,
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
