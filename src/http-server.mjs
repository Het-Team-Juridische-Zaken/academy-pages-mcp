#!/usr/bin/env node
// CASCO webversie van de Academy-tool: dezelfde tools, maar als HTTP-dienst (remote MCP),
// zodat hij centraal op Azure kan draaien en collega's niets hoeven te installeren.
//
// ⚠️ NOG NIET PRODUCTIEKLAAR - AUTHENTICATIE:
// Deze casco gebruikt nog het lokale, gecachete token (via getToken). Dat betekent dat de
// server als EEN gebruiker werkt. Dat is prima om de HTTP-kant lokaal te testen, maar MAG NIET
// zo naar productie. Voor productie moet elke gebruiker per sessie inloggen via OAuth met Entra
// (delegated, Optie A), zodat de server namens die persoon werkt. Dat stuk wordt afgewired
// zodra IT de Entra web-app (redirect-URI + secret) heeft klaargezet. Zie IT-AZURE-HOSTING.md.

import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createConceptPage, updatePageText, publishPage, listPages } from "./graph.mjs";
import { listMenu, addMenuItem } from "./sharepoint.mjs";

const ok = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: String(e?.message || e) }] });

function buildServer() {
  const server = new McpServer({ name: "academy-pages-mcp-web", version: "0.2.0" });

  server.tool("academy_create_concept_page",
    "Maak een nieuwe concept-pagina op de HTJZ Academy. name, title, bodyHtml; optioneel bannerUrl en ownerEmail.",
    { name: z.string(), title: z.string(), bodyHtml: z.string(), bannerUrl: z.string().optional(), ownerEmail: z.string().optional() },
    async (a) => { try { return ok(await createConceptPage(a)); } catch (e) { return fail(e); } });

  server.tool("academy_update_page_text",
    "Werk de tekst van een pagina bij (blijft concept tot publiceren). id, bodyHtml.",
    { id: z.string(), bodyHtml: z.string() },
    async (a) => { try { return ok(await updatePageText(a)); } catch (e) { return fail(e); } });

  server.tool("academy_publish_page", "Publiceer een pagina. id.",
    { id: z.string() },
    async (a) => { try { return ok(await publishPage(a)); } catch (e) { return fail(e); } });

  server.tool("academy_list_pages", "Lijst de pagina's op (id, name, title, webUrl).",
    {}, async () => { try { return ok(await listPages()); } catch (e) { return fail(e); } });

  server.tool("academy_list_menu", "Toon het menu (QuickLaunch) met de id's.",
    {}, async () => { try { return ok(await listMenu()); } catch (e) { return fail(e); } });

  server.tool("academy_add_menu_item",
    "Zet een gepubliceerde pagina in het menu. title, pageUrl; optioneel parentId.",
    { title: z.string(), pageUrl: z.string(), parentId: z.number().optional() },
    async (a) => { try { return ok(await addMenuItem(a)); } catch (e) { return fail(e); } });

  return server;
}

const app = express();
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, name: "academy-pages-mcp-web", version: "0.2.0" }));

// Stateful MCP over Streamable HTTP: een sessie per initialize.
const transports = {};

app.post("/mcp", async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  let transport;
  if (sid && transports[sid]) {
    transport = transports[sid];
  } else if (!sid && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => { transports[id] = transport; },
    });
    transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
    await buildServer().connect(transport);
  } else {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "Geen geldige MCP-sessie" }, id: null });
    return;
  }
  await transport.handleRequest(req, res, req.body);
});

const handleSession = async (req, res) => {
  const sid = req.headers["mcp-session-id"];
  if (!sid || !transports[sid]) { res.status(400).send("Geen geldige MCP-sessie"); return; }
  await transports[sid].handleRequest(req, res);
};
app.get("/mcp", handleSession);
app.delete("/mcp", handleSession);

const port = process.env.PORT || 8080;
app.listen(port, () => console.error(`[academy-pages-mcp-web] luistert op poort ${port} (CASCO: auth nog niet productieklaar)`));
