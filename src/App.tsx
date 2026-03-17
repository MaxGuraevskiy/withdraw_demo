import { useMemo } from "react";
import { createDefaultWithdrawalApi } from "@/api/withdrawals";
import { WithdrawPage } from "@/features/withdraw/withdraw-page";
import { createWithdrawStore } from "@/store/withdraw-store";
import type { WithdrawalApi } from "@/types/withdrawal";

interface AppProps {
  api?: WithdrawalApi;
}

const defaultApi = createDefaultWithdrawalApi();

export function App({ api = defaultApi }: AppProps) {
  const useWithdrawStore = useMemo(() => createWithdrawStore(api), [api]);

  return <WithdrawPage useWithdrawStore={useWithdrawStore} />;
}
