export type UiStatus = "idle" | "loading" | "success" | "error";

export type WithdrawalStatus = "pending" | "processing" | "completed" | "failed";

export interface WithdrawalDetails {
  id: string;
  amount: number;
  destination: string;
  currency: "USDT";
  status: WithdrawalStatus;
  created_at: string;
}

export interface WithdrawalApi {
  createWithdrawal: (input: {
    amount: number;
    destination: string;
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
  getWithdrawal: (id: string) => Promise<WithdrawalDetails>;
}
