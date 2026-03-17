import type { WithdrawalApi, WithdrawalDetails } from "@/types/withdrawal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export class ApiNetworkError extends Error {
  constructor(message = "Network request failed") {
    super(message);
    this.name = "ApiNetworkError";
  }
}

function toAbsoluteUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}

export class HttpWithdrawalApi implements WithdrawalApi {
  async createWithdrawal(input: {
    amount: number;
    destination: string;
    idempotencyKey: string;
  }): Promise<{ id: string }> {
    let response: Response;

    try {
      response = await fetch(toAbsoluteUrl("/v1/withdrawals"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify({
          amount: input.amount,
          destination: input.destination,
          currency: "USDT",
          idempotency_key: input.idempotencyKey,
        }),
      });
    } catch {
      throw new ApiNetworkError(
        "Network error. Check your connection and retry without changing the form."
      );
    }

    const payload = await readJson(response);

    if (!response.ok) {
      if (response.status === 409) {
        throw new ApiRequestError(
          parseErrorMessage(
            payload,
            "This operation is already being processed. Please wait for status update."
          ),
          409
        );
      }

      throw new ApiRequestError(
        parseErrorMessage(payload, "Failed to create withdrawal request."),
        response.status
      );
    }

    const id = (payload as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || id.length === 0) {
      throw new ApiRequestError("Withdrawal id is missing in API response.", 500);
    }

    return { id };
  }

  async getWithdrawal(id: string): Promise<WithdrawalDetails> {
    let response: Response;

    try {
      response = await fetch(toAbsoluteUrl(`/v1/withdrawals/${id}`));
    } catch {
      throw new ApiNetworkError(
        "Network error while reading created withdrawal. Please retry."
      );
    }

    const payload = await readJson(response);

    if (!response.ok) {
      throw new ApiRequestError(
        parseErrorMessage(payload, "Failed to load withdrawal status."),
        response.status
      );
    }

    const details = payload as WithdrawalDetails | null;
    if (!details || typeof details.id !== "string") {
      throw new ApiRequestError("Withdrawal details are malformed.", 500);
    }

    return details;
  }
}

export function createDefaultWithdrawalApi(): WithdrawalApi {
  return new HttpWithdrawalApi();
}
