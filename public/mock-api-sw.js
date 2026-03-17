const storage = new Map();
const idempotencyIndex = new Map();

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleCreateWithdrawal(request) {
  await sleep(500);

  let body = {};
  try {
    body = await request.clone().json();
  } catch {
    body = {};
  }

  const destination = String(body.destination || "");
  const idempotencyKey = request.headers.get("Idempotency-Key") || body.idempotency_key;

  if (!idempotencyKey) {
    return jsonResponse({ message: "idempotency_key is required" }, 400);
  }

  if (destination.toLowerCase().includes("conflict")) {
    return jsonResponse(
      { message: "Conflict: a withdrawal with this idempotency key already exists." },
      409
    );
  }

  if (destination.toLowerCase().includes("network")) {
    return Response.error();
  }

  const existingId = idempotencyIndex.get(idempotencyKey);
  if (existingId) {
    return jsonResponse({ id: existingId }, 200);
  }

  const id = `wd_${Math.random().toString(36).slice(2, 10)}`;
  const created = {
    id,
    amount: Number(body.amount || 0),
    destination,
    currency: "USDT",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  storage.set(id, created);
  idempotencyIndex.set(idempotencyKey, id);

  return jsonResponse({ id }, 201);
}

async function handleGetWithdrawal(url) {
  await sleep(250);

  const id = url.pathname.replace("/v1/withdrawals/", "");
  const stored = storage.get(id);

  if (!stored) {
    return jsonResponse({ message: "Withdrawal not found." }, 404);
  }

  return jsonResponse({
    ...stored,
    status: "processing",
  });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const { method } = event.request;

  if (url.pathname === "/v1/withdrawals" && method === "POST") {
    event.respondWith(handleCreateWithdrawal(event.request));
    return;
  }

  if (url.pathname.startsWith("/v1/withdrawals/") && method === "GET") {
    event.respondWith(handleGetWithdrawal(url));
  }
});