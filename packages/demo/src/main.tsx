// @ts-ignore
import "@/global.css";
// @ts-ignore
import "@radix-ui/themes/styles.css";
// @ts-ignore
import "@raideno/auto-form/styles.css";

import { Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme radius="none" accentColor="lime" appearance="light">
      <App />
    </Theme>
  </StrictMode>
);
