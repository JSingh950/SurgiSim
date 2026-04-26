import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import SolanaProvider from "@/components/SolanaProvider";
import { frontendEnv } from "@/lib/config";
import "./index.css";

const application = frontendEnv.isConfigured ? (
  <Auth0Provider
    domain={frontendEnv.auth0Domain}
    clientId={frontendEnv.auth0ClientId}
    cacheLocation="localstorage"
    useRefreshTokens
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: frontendEnv.auth0Audience,
    }}
  >
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </Auth0Provider>
) : (
  <App />
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{application}</React.StrictMode>,
);
