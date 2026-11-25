import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import { TokenPreview } from "./workbench/TokenPreview";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <TokenPreview />
  </StrictMode>,
);
