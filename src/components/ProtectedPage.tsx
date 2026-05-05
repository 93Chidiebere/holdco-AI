import { Navigate } from "react-router-dom";
import { usePermissions, Permission } from "@/hooks/usePermissions";

interface ProtectedPageProps {
  permission: Permission;
  children: React.ReactNode;
}

export default function ProtectedPage({ permission, children }: ProtectedPageProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
