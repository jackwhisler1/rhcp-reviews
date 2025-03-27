export interface AuthFormData {
  email: string;
  username?: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  image?: string | null;
  token?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegistrationError {
  email?: string[];
  username?: string[];
  password?: string[];
  general?: string[];
  [key: string]: string[] | undefined;
}

export interface AuthFormProps {
  onSubmit: (formData: AuthFormData) => Promise<void>;
  isLogin?: boolean;
  errors?: RegistrationError;
}
