#!/usr/bin/env node
// Test: leest het Academy-menu via de SharePoint-API (bewijst dat het SP-token werkt).
import { listMenu } from "../src/sharepoint.mjs";

const onDeviceCode = (resp) => console.log("\n>>> LOGIN NODIG:\n" + resp.message + "\n");
const menu = await listMenu({ onDeviceCode });
console.log("MENU (top + subitems):");
for (const s of menu) {
  console.log(`- [${s.id}] ${s.title}`);
  for (const c of s.children || []) console.log(`    - [${c.id}] ${c.title}`);
}
