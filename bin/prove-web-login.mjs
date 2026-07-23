#!/usr/bin/env node
// PROEF: bewijst dat een webserver namens de ingelogde gebruiker (browser-login, delegated)
// een pagina op de Academy kan maken EN het menu kan lezen. Maakt een testpagina als de
// ingelogde gebruiker en verwijdert die meteen weer.
//
// Gebruik:
//   1. Voeg in de Entra-app de redirect-URI http://localhost:8080/auth/callback toe.
//   2. env GRAPH_CLIENT_ID=... GRAPH_TENANT=... node bin/prove-web-login.mjs
//   3. Open http://localhost:8080/login in de browser en log in met je HTJZ-account.

import express from "express";
import { buildAuthUrl, redeemCode, tokenForResource } from "../src/web-auth.mjs";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SITE = "https://stamadvocaten.sharepoint.com/sites/Academy";
const ORIGIN = new URL(SITE).origin;

async function api(base, path, tok, { method = "GET", body } = {}) {
  const r = await fetch(path.startsWith("http") ? path : `${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${tok}`, Accept: base.includes("graph") ? "application/json" : "application/json;odata=nometadata", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}: ${t}`);
  return t ? JSON.parse(t) : null;
}

const app = express();
let verifier = null;

app.get("/login", async (_req, res) => {
  const a = await buildAuthUrl();
  verifier = a.verifier;
  res.redirect(a.url);
});

app.get("/auth/callback", async (req, res) => {
  try {
    const result = await redeemCode(req.query.code, verifier);
    const who = result.account?.username || "onbekend";
    const graphTok = result.accessToken;

    // 1. Namens de gebruiker: site opzoeken + conceptpagina maken.
    const site = await api(GRAPH, `/sites/stamadvocaten.sharepoint.com:/sites/Academy`, graphTok);
    const page = await api(GRAPH, `/sites/${site.id}/pages`, graphTok, {
      method: "POST",
      body: { "@odata.type": "#microsoft.graph.sitePage", name: "ZZ-web-login-proof.aspx", title: "Web-login proef", pageLayout: "article",
        canvasLayout: { horizontalSections: [{ layout: "oneColumn", id: "1", columns: [{ id: "1", width: 12, webparts: [{ "@odata.type": "#microsoft.graph.textWebPart", innerHtml: "<p>Proef: aangemaakt via browser-login, namens de gebruiker.</p>" }] }] }] } },
    });

    // 2. Namens de gebruiker: SharePoint-token + menu lezen (bewijst ook de SP-scope).
    const spTok = await tokenForResource(result.account, [`${ORIGIN}/.default`]);
    const menu = await api(`${SITE}/_api`, `/web/navigation/quicklaunch`, spTok);

    // 3. Opruimen: testpagina weg.
    await api(GRAPH, `/sites/${site.id}/pages/${page.id}`, graphTok, { method: "DELETE" });

    const msg = `Ingelogd als ${who}. Pagina aangemaakt EN verwijderd als deze gebruiker. Menu-items gelezen: ${menu.value?.length ?? 0}.`;
    console.log("PROOF OK -", msg);
    res.send(`<h2>Gelukt</h2><p>${msg}</p><p>Je kunt dit venster sluiten.</p>`);
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    console.error("PROOF FOUT:", e.message);
    res.status(500).send("Fout: " + e.message);
  }
});

app.listen(8080, () => console.error("Open in je browser: http://localhost:8080/login"));
