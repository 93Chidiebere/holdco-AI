import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, companyName: string, role?: User["role"]) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// HoldCo AI parent / platform-owner accounts. These see EVERY holding company.
const PLATFORM_OWNER_EMAILS = ["platform@holdco.ai", "owner@holdco.ai"];

interface RegisteredCompany {
  id: string;
  name: string;
  owner_email: string;
  owner_name: string;
  created_at: string;
}

function recordCompany(c: RegisteredCompany) {
  try {
    const all: RegisteredCompany[] = JSON.parse(localStorage.getItem("holdco_companies") || "[]");
    if (!all.some((x) => x.id === c.id)) {
      all.push(c);
      localStorage.setItem("holdco_companies", JSON.stringify(all));
    }
  } catch {
    localStorage.setItem("holdco_companies", JSON.stringify([c]));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("holdco_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Platform owner shortcut
    if (PLATFORM_OWNER_EMAILS.includes(email.toLowerCase())) {
      const platformUser: User = {
        id: "platform-owner",
        email,
        name: "HoldCo AI Platform",
        role: "superadmin",
        holding_company_id: "platform",
        holding_company_name: "HoldCo AI (Platform)",
      };
      setUser(platformUser);
      localStorage.setItem("holdco_user", JSON.stringify(platformUser));
      return true;
    }

    const storedRole = localStorage.getItem(`holdco_role_${email}`) as User["role"] | null;
    const mockUser: User = {
      id: "1",
      email,
      name: localStorage.getItem(`holdco_name_${email}`) || email.split("@")[0],
      role: storedRole || "admin",
      holding_company_id: localStorage.getItem(`holdco_companyid_${email}`) || "hc-1",
      holding_company_name: localStorage.getItem(`holdco_company_${email}`) || "Demo Holdings",
    };
    setUser(mockUser);
    localStorage.setItem("holdco_user", JSON.stringify(mockUser));
    return true;
  };

  const signup = async (name: string, email: string, _password: string, companyName: string, role: User["role"] = "admin"): Promise<boolean> => {
    const companyId = `hc-${Date.now()}`;
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      holding_company_id: companyId,
      holding_company_name: companyName,
    };
    localStorage.setItem(`holdco_role_${email}`, role);
    localStorage.setItem(`holdco_name_${email}`, name);
    localStorage.setItem(`holdco_company_${email}`, companyName);
    localStorage.setItem(`holdco_companyid_${email}`, companyId);
    recordCompany({
      id: companyId,
      name: companyName,
      owner_email: email,
      owner_name: name,
      created_at: new Date().toISOString(),
    });
    setUser(mockUser);
    localStorage.setItem("holdco_user", JSON.stringify(mockUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("holdco_user");
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
