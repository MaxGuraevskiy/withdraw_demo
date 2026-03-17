import { useShallow } from "zustand/react/shallow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { WithdrawStoreHook } from "./types";

interface WithdrawSuccessAlertProps {
  useWithdrawStore: WithdrawStoreHook;
}

export function WithdrawSuccessAlert({ useWithdrawStore }: WithdrawSuccessAlertProps) {
  const { status, latestWithdrawal } = useWithdrawStore(
    useShallow((state) => ({ status: state.status, latestWithdrawal: state.latestWithdrawal }))
  );

  if (status !== "success" || !latestWithdrawal) return null;

  return (
    <Alert>
      <AlertTitle>Created withdrawal: {latestWithdrawal.id}</AlertTitle>
      <AlertDescription>
        <p>
          Amount: {latestWithdrawal.amount} {latestWithdrawal.currency}
        </p>
        <p>Status: {latestWithdrawal.status}</p>
      </AlertDescription>
    </Alert>
  );
}