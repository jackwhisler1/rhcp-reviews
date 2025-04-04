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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: any) => void;
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
