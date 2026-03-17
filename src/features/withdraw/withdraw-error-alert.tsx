import { useShallow } from "zustand/react/shallow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { WithdrawStoreHook } from "./types";

interface WithdrawErrorAlertProps {
  useWithdrawStore: WithdrawStoreHook;
}

export function WithdrawErrorAlert({ useWithdrawStore }: WithdrawErrorAlertProps) {
  const { status, errorMessage } = useWithdrawStore(useShallow((state) => ({ status: state.status, errorMessage: state.errorMessage })));

  if (status !== "error" || !errorMessage) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>Request failed</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}