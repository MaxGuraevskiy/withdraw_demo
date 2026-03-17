import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiNetworkError, ApiRequestError } from "@/api/withdrawals";
import { createIdempotencyKey } from "@/lib/idempotency";
import type { UiStatus, WithdrawalApi, WithdrawalDetails } from "@/types/withdrawal";

const LAST_WITHDRAWAL_TTL_MS = 5 * 60 * 1000;

function getEditingState(state: WithdrawState) {
  if (state.status === "loading") {
    return {
      status: state.status,
      errorMessage: state.errorMessage,
      canRetry: state.canRetry,
      latestWithdrawal: state.latestWithdrawal,
      latestWithdrawalSavedAt: state.latestWithdrawalSavedAt,
      activeIdempotencyKey: state.activeIdempotencyKey,
    };
  }

  return {
    status: "idle" as const,
    errorMessage: null,
    canRetry: false,
    latestWithdrawal: null,
    latestWithdrawalSavedAt: null,
    activeIdempotencyKey: null,
  };
}

export interface WithdrawState {
  amountInput: string;
  destination: string;
  confirm: boolean;
  status: UiStatus;
  errorMessage: string | null;
  canRetry: boolean;
  activeIdempotencyKey: string | null;
  latestWithdrawal: WithdrawalDetails | null;
  latestWithdrawalSavedAt: number | null;
  setAmountInput: (value: string) => void;
  setDestination: (value: string) => void;
  setConfirm: (value: boolean) => void;
  submit: () => Promise<void>;
  retry: () => Promise<void>;
}

function getFormValidation(state: WithdrawState): {
  parsedAmount: number;
  isValid: boolean;
} {
  const parsedAmount = Number(state.amountInput);
  const destination = state.destination.trim();

  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && destination.length > 0 && state.confirm;

  return { parsedAmount, isValid };
}

function getErrorMessage(error: unknown): { text: string; canRetry: boolean } {
  if (error instanceof ApiNetworkError) {
    return {
      text: error.message,
      canRetry: true,
    };
  }

  if (error instanceof ApiRequestError && error.status === 409) {
    return {
      text: error.message,
      canRetry: false,
    };
  }

  if (error instanceof Error) {
    return {
      text: error.message,
      canRetry: false,
    };
  }

  return {
    text: "Unexpected error. Please try again.",
    canRetry: false,
  };
}

export function createWithdrawStore(api: WithdrawalApi) {
  return create<WithdrawState>()(
    persist(
      (set, get) => ({
        amountInput: "",
        destination: "",
        confirm: false,
        status: "idle",
        errorMessage: null,
        canRetry: false,
        activeIdempotencyKey: null,
        latestWithdrawal: null,
        latestWithdrawalSavedAt: null,
        setAmountInput: (value) => {
          set((state) => {
            if (state.amountInput === value) {
              return state;
            }

            return {
              amountInput: value,
              ...getEditingState(state),
            };
          });
        },
        setDestination: (value) => {
          set((state) => {
            if (state.destination === value) {
              return state;
            }

            return {
              destination: value,
              ...getEditingState(state),
            };
          });
        },
        setConfirm: (value) => {
          set((state) => {
            if (state.confirm === value) {
              return state;
            }

            return {
              confirm: value,
              ...getEditingState(state),
            };
          });
        },
        submit: async () => {
          const state = get();
          if (state.status === "loading") {
            return;
          }

          const { isValid, parsedAmount } = getFormValidation(state);
          if (!isValid) {
            return;
          }

          const idempotencyKey = state.activeIdempotencyKey ?? createIdempotencyKey();

          set({
            status: "loading",
            errorMessage: null,
            canRetry: false,
            activeIdempotencyKey: idempotencyKey,
          });

          try {
            const created = await api.createWithdrawal({
              amount: parsedAmount,
              destination: state.destination.trim(),
              idempotencyKey,
            });

            const details = await api.getWithdrawal(created.id);

            set({
              status: "success",
              latestWithdrawal: details,
              latestWithdrawalSavedAt: Date.now(),
              errorMessage: null,
              canRetry: false,
              activeIdempotencyKey: null,
            });
          } catch (error) {
            const parsedError = getErrorMessage(error);

            set((current) => ({
              status: "error",
              errorMessage: parsedError.text,
              canRetry: parsedError.canRetry,
              activeIdempotencyKey: parsedError.canRetry ? current.activeIdempotencyKey : null,
            }));
          }
        },
        retry: async () => {
          const state = get();
          if (!state.canRetry || state.status === "loading") {
            return;
          }

          await get().submit();
        },
      }),
      {
        name: "withdraw-last-request-v1",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          latestWithdrawal: state.latestWithdrawal,
          latestWithdrawalSavedAt: state.latestWithdrawalSavedAt,
        }),
        merge: (persistedState, currentState) => {
          const typedPersisted = persistedState as Partial<WithdrawState> | undefined;
          const savedAt = typeof typedPersisted?.latestWithdrawalSavedAt === "number" ? typedPersisted.latestWithdrawalSavedAt : null;
          const latestWithdrawal = typedPersisted?.latestWithdrawal ?? null;

          const isFresh =
            latestWithdrawal !== null &&
            savedAt !== null &&
            Date.now() - savedAt <= LAST_WITHDRAWAL_TTL_MS;

          return {
            ...currentState,
            latestWithdrawal: isFresh ? latestWithdrawal : null,
            latestWithdrawalSavedAt: isFresh ? savedAt : null,
            status: isFresh ? "success" : currentState.status,
          };
        },
      }
    )
  );
}
