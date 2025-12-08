import { User } from "../models/User";

export interface LoginRequest {
  email: string;
  password: string; // Backend expects password, but usually frontend sends password. Checking LoginDto.
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  recaptchaToken?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
}

export interface IAuthService {
  login(credentials: LoginRequest): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<AuthResponse>;
  logout(): void;
  getCurrentUser(): User | null;
  updateUser(id: string, data: UpdateUserRequest): Promise<User>;
}
