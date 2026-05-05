import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

interface PermissionTooltipProps {
  children: ReactNode;
  hasPermission: boolean;
  message?: string;
}

export default function PermissionTooltip({
  children,
  hasPermission,
  message = "You don't have permission to perform this action. Contact your admin.",
}: PermissionTooltipProps) {
  if (hasPermission) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-not-allowed">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-center">
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
