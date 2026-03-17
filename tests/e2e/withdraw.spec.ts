import { expect, test, type Page } from "@playwright/test";

async function fillValidForm(page: Page, destination = "TTRON123") {
  await page.getByLabel("Amount").fill("150");
  await page.getByLabel("Destination").fill(destination);
  await page.getByRole("checkbox", { name: /I confirm this withdrawal/i }).click();
}

test("happy-path submit shows created withdrawal and status", async ({ page }) => {
  await page.goto("/");
  await fillValidForm(page);

  await page.getByRole("button", { name: /submit withdrawal/i }).click();

  await expect(page.getByText(/Current state: success/i)).toBeVisible();
  await expect(page.getByText(/Created withdrawal: wd_/i)).toBeVisible();
  await expect(page.getByText(/Status: processing/i)).toBeVisible();
});

test("shows understandable API conflict error", async ({ page }) => {
  await page.goto("/");
  await fillValidForm(page, "conflict-address");

  await page.getByRole("button", { name: /submit withdrawal/i }).click();

  await expect(page.getByText(/Current state: error/i)).toBeVisible();
  await expect(page.getByText(/Conflict: a withdrawal with this idempotency key already exists./i)).toBeVisible();
});

test("protects from double submit while loading", async ({ page }) => {
  await page.goto("/");
  await fillValidForm(page);

  const submitButton = page.getByRole("button", { name: /submit withdrawal/i });
  await submitButton.dblclick();

  await expect(page.getByRole("button", { name: /submitting/i })).toBeDisabled();
  await expect(page.getByText(/Current state: success/i)).toBeVisible();
});