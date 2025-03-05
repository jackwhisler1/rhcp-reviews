export interface User {
  id: number;
  username: string;
  email: string;
  image?: string;
  token: string;
}

export interface AuthFormData {
  email: string;
  username?: string;
  password: string;
}

export interface RegistrationError {
  email?: string[];
  username?: string[];
  password?: string[];
  general?: string[];
  [key: string]: any;
}
export interface AuthFormData {
  email: string;
  password: string;
  username?: string; // Optional for type, but required in registration
}

export interface AuthFormProps {
  onSubmit: (formData: AuthFormData) => Promise<void>;
  isLogin?: boolean;
  errors?: RegistrationError;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token: string;
  refreshToken?: string;
}
