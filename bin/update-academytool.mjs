#!/usr/bin/env node
// Werkt het nieuwsbericht "De-Academy-tool" bij via Graph (stil, gecachet token):
// tekst + banner + byline, publiceren, en controleren dat het nieuws blijft (PromotedState=2).
import { siteId } from "../src/graph.mjs";
import { getToken } from "../src/auth.mjs";
import { textCanvas } from "../src/canvas.mjs";
import { readFileSync } from "node:fs";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SITE = (process.env.SP_SITE_URL || "https://stamadvocaten.sharepoint.com/sites/Academy").replace(/\/+$/, "");
const ORIGIN = new URL(SITE).origin;
const BANNER = `${ORIGIN}/sites/Academy/SiteAssets/academytool-header.png`;

const sid = await siteId();
const gtok = await getToken();
const stok = await getToken({ scopes: [`${ORIGIN}/.default`] });

async function g(path, { method = "GET", body } = {}) {
  const r = await fetch(`${GRAPH}${path}`, { method, headers: { Authorization: `Bearer ${gtok}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); if (!r.ok) throw new Error(`G ${method} ${path} ${r.status}: ${t}`); return t ? JSON.parse(t) : null;
}
async function sp(path) {
  const r = await fetch(`${SITE}/_api${path}`, { headers: { Authorization: `Bearer ${stok}`, Accept: "application/json;odata=nometadata" } });
  const t = await r.text(); if (!r.ok) throw new Error(`SP ${path} ${r.status}: ${t}`); return t ? JSON.parse(t) : null;
}

const list = await g(`/sites/${sid}/pages/microsoft.graph.sitePage?$select=id,name,webUrl`);
const pg = (list.value || []).find((p) => p.name === "De-Academy-tool.aspx");
if (!pg) { console.log("PAGINA NIET GEVONDEN"); process.exit(1); }

const html = readFileSync(process.env.HOME + "/htjz-academy-assets/content-news-academytool.html", "utf8");
await g(`/sites/${sid}/pages/${pg.id}/microsoft.graph.sitePage`, {
  method: "PATCH",
  body: {
    canvasLayout: textCanvas(html),
    titleArea: { layout: "imageAndTitle", imageWebUrl: BANNER, showAuthor: true, authorByline: ["i:0#.f|membership|edgarstam@htjz.nl"], enableGradientEffect: true },
  },
});
await g(`/sites/${sid}/pages/${pg.id}/microsoft.graph.sitePage/publish`, { method: "POST" });

const items = await sp(`/web/lists/getbytitle('Site Pages')/items?$filter=FileLeafRef eq 'De-Academy-tool.aspx'&$select=Id,PromotedState`);
const ps = items.value?.[0]?.PromotedState;
console.log("KLAAR | url=" + pg.webUrl + " | PromotedState=" + ps + (ps === 2 ? " (nieuws)" : " (LET OP: geen nieuws!)"));
