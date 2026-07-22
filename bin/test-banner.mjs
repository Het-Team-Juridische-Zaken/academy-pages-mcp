#!/usr/bin/env node
// Test: maakt een conceptpagina MET banner via Graph, leest de titleArea terug,
// en ruimt daarna de testpagina('s) op. Gebruikt het gecachete token (geen nieuwe login).

import { siteId, createConceptPage } from "../src/graph.mjs";
import { getToken } from "../src/auth.mjs";

const banner = "https://stamadvocaten.sharepoint.com/sites/Academy/SiteAssets/banner-htjz-header.png";

const page = await createConceptPage({
  name: "ZZ-MCP-banner-test",
  title: "Banner test (concept)",
  bodyHtml: "<p>Test of de banner via Graph werkt.</p>",
  bannerUrl: banner,
});
console.log("CREATED:", JSON.stringify(page));

const sid = await siteId();
const token = await getToken();

const got = await fetch(
  `https://graph.microsoft.com/v1.0/sites/${sid}/pages/${page.id}/microsoft.graph.sitePage?$select=id,title,titleArea,webUrl`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await got.json();
console.log("TITLEAREA:", JSON.stringify(data.titleArea, null, 2));

// opruimen: deze testpagina + de eerdere demo-pagina
const cleanup = [page.id, ...process.argv.slice(2)];
for (const id of cleanup) {
  const del = await fetch(`https://graph.microsoft.com/v1.0/sites/${sid}/pages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("DELETE", id, "->", del.status);
}
