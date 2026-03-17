import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WithdrawStoreHook } from "./types";
import { WithdrawErrorAlert } from "./withdraw-error-alert";
import { WithdrawForm } from "./withdraw-form";
import { WithdrawStatusLine } from "./withdraw-status-line";
import { WithdrawSuccessAlert } from "./withdraw-success-alert";

interface WithdrawPageProps {
  useWithdrawStore: WithdrawStoreHook;
}

export function WithdrawPage({ useWithdrawStore }: WithdrawPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Withdraw Console</CardTitle>
            <CardDescription>Create and track USDT withdrawals with idempotent requests and clear statuses.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <WithdrawForm useWithdrawStore={useWithdrawStore} />
            <WithdrawStatusLine useWithdrawStore={useWithdrawStore} />
            <WithdrawErrorAlert useWithdrawStore={useWithdrawStore} />
            <WithdrawSuccessAlert useWithdrawStore={useWithdrawStore} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}