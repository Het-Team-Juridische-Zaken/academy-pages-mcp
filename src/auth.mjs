// Authenticatie via MSAL device-code flow.
// De gebruiker logt één keer in (via een korte code op microsoft.com/devicelogin);
// het token wordt gecached, dus daarna gaat het stil. De MCP-server ziet het token,
// nooit Claude of de gebruiker in platte tekst.

import { PublicClientApplication, LogLevel } from "@azure/msal-node";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = process.env.ACADEMY_MCP_HOME || join(homedir(), ".academy-pages-mcp");
const CACHE_FILE = join(CACHE_DIR, "token-cache.json");

// Standaard: de publieke Microsoft Graph CLI-app (device-code werkt zonder eigen registratie).
// Productie: eigen Entra-app, zie README.
const CLIENT_ID = process.env.GRAPH_CLIENT_ID || "14d82eec-204b-4c2f-b7e8-296a70dab67e";
const TENANT = process.env.GRAPH_TENANT || "stamadvocaten.onmicrosoft.com";
const SCOPES = (process.env.GRAPH_SCOPES || "Sites.ReadWrite.All").split(/\s+/).filter(Boolean);

const cachePlugin = {
  beforeCacheAccess: async (ctx) => {
    if (existsSync(CACHE_FILE)) ctx.tokenCache.deserialize(readFileSync(CACHE_FILE, "utf8"));
  },
  afterCacheAccess: async (ctx) => {
    if (ctx.cacheHasChanged) {
      mkdirSync(CACHE_DIR, { recursive: true });
      writeFileSync(CACHE_FILE, ctx.tokenCache.serialize(), { mode: 0o600 });
    }
  },
};

const pca = new PublicClientApplication({
  auth: { clientId: CLIENT_ID, authority: `https://login.microsoftonline.com/${TENANT}` },
  cache: { cachePlugin },
  system: { loggerOptions: { loggerCallback() {}, piiLoggingEnabled: false, logLevel: LogLevel.Error } },
});

export async function getToken({ onDeviceCode } = {}) {
  const cache = pca.getTokenCache();
  const accounts = await cache.getAllAccounts();
  if (accounts.length) {
    try {
      const r = await pca.acquireTokenSilent({ account: accounts[0], scopes: SCOPES });
      if (r?.accessToken) return r.accessToken;
    } catch {
      // token verlopen of geen refresh mogelijk -> val terug op device code
    }
  }
  const r = await pca.acquireTokenByDeviceCode({
    scopes: SCOPES,
    deviceCodeCallback: (resp) => (onDeviceCode ? onDeviceCode(resp) : console.error(resp.message)),
  });
  return r.accessToken;
}

export const authConfig = { CLIENT_ID, TENANT, SCOPES };
