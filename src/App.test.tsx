// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { ApiRequestError } from "@/api/withdrawals";
import type { WithdrawalApi } from "@/types/withdrawal";

function buildApi(overrides?: Partial<WithdrawalApi>): WithdrawalApi {
  return {
    createWithdrawal: vi.fn(async () => ({ id: "wd_1" })),
    getWithdrawal: vi.fn(async () => ({
      id: "wd_1",
      amount: 150,
      destination: "TTRON123",
      currency: "USDT" as const,
      status: "processing" as const,
      created_at: new Date().toISOString(),
    })),
    ...overrides,
  };
}

async function fillValidForm() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/amount/i), "150");
  await user.type(screen.getByLabelText(/destination/i), "TTRON123");
  await user.click(screen.getByRole("checkbox", { name: /i confirm/i }));

  return user;
}

describe("Withdraw page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("submits happy path and shows created withdrawal", async () => {
    const api = buildApi();
    render(<App api={api} />);

    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: /submit withdrawal/i }));

    await screen.findByText(/created withdrawal:/i);

    expect(api.createWithdrawal).toHaveBeenCalledTimes(1);
    expect(api.getWithdrawal).toHaveBeenCalledWith("wd_1");
    expect(screen.getByText(/status: processing/i)).toBeInTheDocument();
  });

  it("shows understandable API conflict error for 409", async () => {
    const api = buildApi({
      createWithdrawal: vi.fn(async () => {
        throw new ApiRequestError("Conflict: duplicate operation", 409);
      }),
    });

    render(<App api={api} />);

    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: /submit withdrawal/i }));

    await screen.findByText(/conflict: duplicate operation/i);
    expect(screen.getByText(/current state: error/i)).toBeInTheDocument();
  });

  it("protects from double submit while request is loading", async () => {
    const createWithdrawal = vi.fn(
      () =>
        new Promise<{ id: string }>((resolve) => {
          setTimeout(() => resolve({ id: "wd_2" }), 120);
        })
    );
    const api = buildApi({ createWithdrawal });
    render(<App api={api} />);

    const user = await fillValidForm();
    const submitButton = screen.getByRole("button", { name: /submit withdrawal/i });

    await Promise.all([user.click(submitButton), user.click(submitButton)]);

    await waitFor(() => {
      expect(createWithdrawal).toHaveBeenCalledTimes(1);
    });
  });

  it("restores last successful withdrawal after reload within 5 minutes", async () => {
    const api = buildApi();
    const firstRender = render(<App api={api} />);

    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: /submit withdrawal/i }));
    await screen.findByText(/created withdrawal:/i);

    firstRender.unmount();
    render(<App api={api} />);

    await screen.findByText(/created withdrawal: wd_1/i);
    expect(screen.getByText(/current state: success/i)).toBeInTheDocument();
  });
});
