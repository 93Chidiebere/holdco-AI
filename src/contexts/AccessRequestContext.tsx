import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type AccessModule = "manage_capital" | "manage_scenarios";

export interface AccessRequest {
  id: string;
  user_email: string;
  user_name: string;
  module: AccessModule;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decided_at?: string;
  decided_by?: string;
}

interface AccessRequestContextType {
  requests: AccessRequest[];
  grantsFor: (email: string) => AccessModule[];
  hasGrant: (email: string, module: AccessModule) => boolean;
  pendingFor: (email: string, module: AccessModule) => AccessRequest | undefined;
  submitRequest: (user_email: string, user_name: string, module: AccessModule, reason: string) => void;
  approve: (id: string, deciderEmail: string) => void;
  reject: (id: string, deciderEmail: string) => void;
  cancel: (id: string, requesterEmail: string) => void;
  revoke: (email: string, module: AccessModule) => void;
}

const STORAGE_REQUESTS = "holdco_access_requests";
const STORAGE_GRANTS = "holdco_access_grants"; // { [email]: AccessModule[] }

const AccessRequestContext = createContext<AccessRequestContextType | null>(null);

export function AccessRequestProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<AccessRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_REQUESTS) || "[]"); } catch { return []; }
  });
  const [grants, setGrants] = useState<Record<string, AccessModule[]>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_GRANTS) || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(requests));
  }, [requests]);
  useEffect(() => {
    localStorage.setItem(STORAGE_GRANTS, JSON.stringify(grants));
  }, [grants]);

  const grantsFor = useCallback((email: string) => grants[email] || [], [grants]);
  const hasGrant = useCallback((email: string, module: AccessModule) => (grants[email] || []).includes(module), [grants]);
  const pendingFor = useCallback(
    (email: string, module: AccessModule) =>
      requests.find((r) => r.user_email === email && r.module === module && r.status === "pending"),
    [requests]
  );

  const submitRequest = (user_email: string, user_name: string, module: AccessModule, reason: string) => {
    setRequests((prev) => {
      // Avoid duplicate pending
      if (prev.some((r) => r.user_email === user_email && r.module === module && r.status === "pending")) return prev;
      return [
        ...prev,
        {
          id: `req-${Date.now()}`,
          user_email,
          user_name,
          module,
          reason,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ];
    });
  };

  const approve = (id: string, deciderEmail: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved", decided_at: new Date().toISOString(), decided_by: deciderEmail } : r
      )
    );
    const req = requests.find((r) => r.id === id);
    if (req) {
      setGrants((prev) => {
        const list = prev[req.user_email] || [];
        if (list.includes(req.module)) return prev;
        return { ...prev, [req.user_email]: [...list, req.module] };
      });
    }
  };

  const reject = (id: string, deciderEmail: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "rejected", decided_at: new Date().toISOString(), decided_by: deciderEmail } : r
      )
    );
  };

  const cancel = (id: string, requesterEmail: string) => {
    setRequests((prev) =>
      prev.filter((r) => !(r.id === id && r.user_email === requesterEmail && r.status === "pending"))
    );
  };

  const revoke = (email: string, module: AccessModule) => {
    setGrants((prev) => ({ ...prev, [email]: (prev[email] || []).filter((m) => m !== module) }));
  };

  return (
    <AccessRequestContext.Provider value={{ requests, grantsFor, hasGrant, pendingFor, submitRequest, approve, reject, cancel, revoke }}>
      {children}
    </AccessRequestContext.Provider>
  );
}

export function useAccessRequests() {
  const ctx = useContext(AccessRequestContext);
  if (!ctx) throw new Error("useAccessRequests must be used within AccessRequestProvider");
  return ctx;
}
