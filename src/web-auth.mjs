// Per-gebruiker inloggen via de browser (OAuth authorization code + PKCE) met Entra.
// Dit is het "risicovolle" stuk voor de gehoste versie: bewijzen dat een webserver
// namens de ingelogde persoon kan werken (delegated, Optie A).
//
// Voor productie op Azure wordt dit een confidential client met een secret in Key Vault;
// voor deze lokale proef gebruiken we de bestaande publieke app met PKCE (geen secret nodig).

import { PublicClientApplication, CryptoProvider } from "@azure/msal-node";

const CLIENT_ID = process.env.GRAPH_CLIENT_ID || "646a6353-f18d-4566-84a9-73b2a8d9f23d";
const TENANT = process.env.GRAPH_TENANT || "stamadvocaten.onmicrosoft.com";
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:8080/auth/callback";
const GRAPH_SCOPES = ["Sites.ReadWrite.All", "offline_access", "openid", "profile"];

const pca = new PublicClientApplication({
  auth: { clientId: CLIENT_ID, authority: `https://login.microsoftonline.com/${TENANT}` },
});
const cryptoProvider = new CryptoProvider();

// Stap 1: bouw de login-URL (met PKCE). Bewaar de verifier voor de callback.
export async function buildAuthUrl() {
  const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
  const url = await pca.getAuthCodeUrl({
    scopes: GRAPH_SCOPES,
    redirectUri: REDIRECT_URI,
    codeChallenge: challenge,
    codeChallengeMethod: "S256",
  });
  return { url, verifier };
}

// Stap 2: wissel de code in voor tokens (namens de ingelogde gebruiker).
export async function redeemCode(code, verifier) {
  const result = await pca.acquireTokenByCode({
    code,
    scopes: GRAPH_SCOPES,
    redirectUri: REDIRECT_URI,
    codeVerifier: verifier,
  });
  return result; // bevat accessToken (Graph) + account
}

// Stap 3: haal stil een token op voor een andere resource (bv. SharePoint) via hetzelfde account.
export async function tokenForResource(account, scopes) {
  const r = await pca.acquireTokenSilent({ account, scopes });
  return r.accessToken;
}

export const authConfig = { CLIENT_ID, TENANT, REDIRECT_URI };
