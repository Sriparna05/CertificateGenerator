import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CertificateProvider } from "./contexts/CertificateContext.tsx";

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// );
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CertificateProvider>
      {" "}
      {/* Wrap yoAur App */}
      <App />
    </CertificateProvider>
  </StrictMode>
);
