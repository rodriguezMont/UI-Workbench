import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import { Toaster } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { Workbench } from "./workbench/Workbench";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      <Workbench />
      <Toaster />
    </TooltipProvider>
  </StrictMode>,
);
