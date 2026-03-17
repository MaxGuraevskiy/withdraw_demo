let started = false;

export async function registerMockApi() {
  if (started || typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  await navigator.serviceWorker.register("/mock-api-sw.js", {
    scope: "/",
  });

  await navigator.serviceWorker.ready;
  started = true;
}