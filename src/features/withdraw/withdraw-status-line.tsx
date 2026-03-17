import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import type { WithdrawStoreHook } from "./types";

interface WithdrawStatusLineProps {
  useWithdrawStore: WithdrawStoreHook;
}

export function WithdrawStatusLine({ useWithdrawStore }: WithdrawStatusLineProps) {
  const status = useWithdrawStore((state) => state.status);

  const badgeVariant: ComponentProps<typeof Badge>["variant"] =
    status === "success" ? "default" : status === "error" ? "destructive" : status === "loading" ? "secondary" : "outline";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Current state: {status}</span>
      <Badge variant={badgeVariant}>State</Badge>
    </div>
  );
}