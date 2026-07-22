#!/usr/bin/env node
// MCP-server "academy-pages-mcp": geeft Claude vier tools om Academy-pagina's te beheren,
// rechtstreeks via de Microsoft Graph API. Geen PowerShell.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createConceptPage, updatePageText, publishPage, listPages } from "./graph.mjs";

const server = new McpServer({ name: "academy-pages-mcp", version: "0.1.0" });

// De eerste keer moet de gebruiker inloggen: de device-code-boodschap gaat naar stderr,
// die de MCP-host in zijn logs toont.
const onDeviceCode = (resp) => process.stderr.write(`\n[academy-pages-mcp] LOGIN: ${resp.message}\n`);

const ok = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: String(e?.message || e) }] });

server.tool(
  "academy_create_concept_page",
  "Maak een nieuwe concept-pagina (draft, niet gepubliceerd) op de HTJZ Academy. Geef name (bestandsnaam zonder pad, bv 'Mijn-onderwerp'), title en bodyHtml (een HTML-fragment met h2/p/ul). Optioneel: bannerUrl (volledige URL van een banner in SiteAssets voor de header) en ownerEmail (zet de eigenaar-byline, bv inciatar@htjz.nl).",
  { name: z.string(), title: z.string(), bodyHtml: z.string(), bannerUrl: z.string().optional(), ownerEmail: z.string().optional() },
  async (a) => { try { return ok(await createConceptPage(a, { onDeviceCode })); } catch (e) { return fail(e); } }
);

server.tool(
  "academy_update_page_text",
  "Werk de tekst van een bestaande pagina bij. De wijziging blijft concept tot je publiceert. Geef id (uit create of list) en bodyHtml.",
  { id: z.string(), bodyHtml: z.string() },
  async (a) => { try { return ok(await updatePageText(a, { onDeviceCode })); } catch (e) { return fail(e); } }
);

server.tool(
  "academy_publish_page",
  "Publiceer een pagina (maakt de laatste versie live). Geef id. Doe dit als eigenaar, of na akkoord van de eigenaar.",
  { id: z.string() },
  async (a) => { try { return ok(await publishPage(a, { onDeviceCode })); } catch (e) { return fail(e); } }
);

server.tool(
  "academy_list_pages",
  "Lijst de pagina's op de Academy op (id, name, title, webUrl). Handig om te zien of iets al bestaat en om een id op te halen.",
  {},
  async () => { try { return ok(await listPages({ onDeviceCode })); } catch (e) { return fail(e); } }
);

await server.connect(new StdioServerTransport());
process.stderr.write("[academy-pages-mcp] gestart (stdio)\n");
