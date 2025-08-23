import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";
import "@radix-ui/themes/styles.css";

import { App } from "./app";
import { Theme } from "@radix-ui/themes";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme radius="none" accentColor="lime">
      <App />
    </Theme>
  </StrictMode>
);
