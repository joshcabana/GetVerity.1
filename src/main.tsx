import { createRoot } from "react-dom/client";
import "./index.css";
import ConfigErrorScreen from "@/components/ConfigErrorScreen";
import { getMissingRuntimeEnvKeys } from "@/lib/runtimeEnv";
import { initSentry } from "@/lib/sentry";

// Kick off Sentry loading in parallel with bootstrap (non-blocking)
initSentry();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("[Verity] Root element #root is missing.");
}

const root = createRoot(rootElement);

const bootstrap = async () => {
  const missingKeys = getMissingRuntimeEnvKeys();
  if (missingKeys.length > 0) {
    root.render(<ConfigErrorScreen missingKeys={missingKeys} />);
    return;
  }

  const { default: App } = await import("./App.tsx");
  root.render(<App />);
};

bootstrap().catch((error) => {
  console.error("[Verity] Failed to bootstrap app:", error);
  // Report bootstrap failures to Sentry
  import("@/lib/sentry").then(({ Sentry }) => Sentry.captureException(error)).catch(() => {});
  root.render(<ConfigErrorScreen missingKeys={["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]} />);
});
