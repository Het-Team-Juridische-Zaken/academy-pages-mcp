#!/usr/bin/env node
// Losse demo, buiten Claude om: maakt één concept-pagina aan via Graph.
// Bewijst dat pagina's rechtstreeks via de API worden gemaakt, zonder PowerShell.
//
//   npm run demo            -> maakt concept-pagina ZZ-MCP-demo.aspx
//   npm run demo -- publish -> maakt hem en publiceert hem meteen
//
// Eerste keer: er verschijnt een device-code login. Volg de instructie, daarna gaat het stil.

import { createConceptPage, publishPage } from "../src/graph.mjs";

const onDeviceCode = (resp) => console.log("\n>>> LOGIN NODIG:\n" + resp.message + "\n");
const doPublish = process.argv.includes("publish");

const name = "ZZ-MCP-demo";
const title = "MCP-demo (concept)";
const bodyHtml =
  "<p>Deze pagina is aangemaakt door het prototype <strong>academy-pages-mcp</strong>, rechtstreeks via de Microsoft Graph API. Geen PowerShell.</p>" +
  "<h2>Werkt het?</h2><p>Als je dit ziet: ja. Dit is een testpagina, hij mag weg.</p>";

const page = await createConceptPage({ name, title, bodyHtml }, { onDeviceCode });
console.log("\nCONCEPT AANGEMAAKT:\n" + JSON.stringify(page, null, 2));

if (doPublish) {
  const pub = await publishPage({ id: page.id }, { onDeviceCode });
  console.log("\nGEPUBLICEERD:\n" + JSON.stringify(pub, null, 2));
} else {
  console.log("\nStaat als CONCEPT (niet gepubliceerd). Voeg 'publish' toe om te publiceren.");
}
