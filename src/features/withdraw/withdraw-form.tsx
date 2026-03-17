import type { FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WithdrawStoreHook } from "./types";

interface WithdrawFormProps {
  useWithdrawStore: WithdrawStoreHook;
}

export function WithdrawForm({ useWithdrawStore }: WithdrawFormProps) {
  const {
    amountInput,
    destination,
    confirm,
    status,
    canRetry,
    setAmountInput,
    setDestination,
    setConfirm,
    submit,
    retry,
  } = useWithdrawStore(
    useShallow((state) => ({
      amountInput: state.amountInput,
      destination: state.destination,
      confirm: state.confirm,
      status: state.status,
      canRetry: state.canRetry,
      setAmountInput: state.setAmountInput,
      setDestination: state.setDestination,
      setConfirm: state.setConfirm,
      submit: state.submit,
      retry: state.retry,
    }))
  );

  const parsedAmount = Number(amountInput);
  const isFormValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && destination.trim().length > 0 && confirm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USDT)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          placeholder="100"
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          name="destination"
          type="text"
          placeholder="TRON wallet address"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="confirm" name="confirm" checked={confirm} onCheckedChange={(checked) => setConfirm(checked === true)} />
        <Label htmlFor="confirm">I confirm this withdrawal request.</Label>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={!isFormValid || status === "loading"}>
          {status === "loading" ? "Submitting..." : "Submit Withdrawal"}
        </Button>

        {status === "error" && canRetry ? (
          <Button type="button" variant="secondary" onClick={() => void retry()}>
            Retry
          </Button>
        ) : null}
      </div>
    </form>
  );
}