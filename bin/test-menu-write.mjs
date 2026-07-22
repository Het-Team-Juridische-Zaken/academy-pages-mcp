#!/usr/bin/env node
// Test: voegt een menu-item toe en verwijdert het meteen weer (opruimen).
import { addMenuItem } from "../src/sharepoint.mjs";
import { getToken } from "../src/auth.mjs";

const SITE = (process.env.SP_SITE_URL || "https://stamadvocaten.sharepoint.com/sites/Academy").replace(/\/+$/, "");
const ORIGIN = new URL(SITE).origin;

const node = await addMenuItem({ title: "ZZ-menu-test", pageUrl: "/sites/Academy/SitePages/Home.aspx" });
console.log("ADDED:", JSON.stringify(node));

const token = await getToken({ scopes: [`${ORIGIN}/.default`] });
const res = await fetch(`${SITE}/_api/web/navigation/getnodebyid(${node.id})`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "X-HTTP-Method": "DELETE", "IF-MATCH": "*", Accept: "application/json;odata=nometadata" },
});
console.log("DELETE status:", res.status);
