import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, companyName: string, role?: User["role"]) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("holdco_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("holdco_token"));

  useEffect(() => {
    if (token) {
      // Validate token or fetch me
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Invalid token");
      })
      .then(data => {
        setUser(data);
        localStorage.setItem("holdco_user", JSON.stringify(data));
      })
      .catch(() => {
        logout();
      });
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("holdco_token", data.access_token);

      // Fetch user profile
      const userRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        localStorage.setItem("holdco_user", JSON.stringify(userData));
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, companyName: string, role: User["role"] = "admin"): Promise<boolean> => {
    try {
      // Create holding company (Mock logic for now, should ideally be an API call)
      // For this step, we just pass holding_company_id or assume backend handles it.
      // We will send standard user create data to backend.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          role,
          holding_company_id: "hc-" + Date.now() // Ideally created first via /api/platform
        })
      });

      if (!res.ok) return false;
      
      // Auto login after signup
      return await login(email, password);
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("holdco_user");
    localStorage.removeItem("holdco_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

