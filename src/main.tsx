import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { registerMockApi } from "@/mocks/register-mock-api";

async function bootstrap() {
  if (import.meta.env.VITE_API_MODE === "mock") {
    await registerMockApi();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void bootstrap();
