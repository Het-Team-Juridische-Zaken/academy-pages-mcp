// Menu (navigatie) beheren via de SharePoint REST-API.
// De Graph-API kan geen QuickLaunch-menu aanpassen, daarom praten we hier
// rechtstreeks met SharePoint. Dat vereist een SharePoint-token (andere scope
// dan Graph): de app heeft daarvoor de delegated permissie AllSites.Manage nodig.

import { getToken } from "./auth.mjs";

const SITE_URL = (process.env.SP_SITE_URL || "https://stamadvocaten.sharepoint.com/sites/Academy").replace(/\/+$/, "");
const ORIGIN = new URL(SITE_URL).origin;
const SP_SCOPES = [`${ORIGIN}/.default`];

async function sp(path, { method = "GET", body, onDeviceCode } = {}) {
  const token = await getToken({ scopes: SP_SCOPES, onDeviceCode });
  const res = await fetch(`${SITE_URL}/_api${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json;odata=nometadata",
      ...(body ? { "Content-Type": "application/json;odata=nometadata" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SharePoint ${method} ${path} -> ${res.status} ${res.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

// Het QuickLaunch-menu ophalen (twee niveaus diep), zodat je een parent-id kunt kiezen.
export async function listMenu(opts) {
  const r = await sp(`/web/navigation/quicklaunch?$expand=Children/Children`, opts);
  const map = (n) => ({ id: n.Id, title: n.Title, url: n.Url, children: (n.Children || []).map(map) });
  return (r.value || []).map(map);
}

// Een menu-item toevoegen. Zonder parentId komt het bovenaan; met parentId onder dat menu.
// Doe dit pas NADAT de pagina gepubliceerd is (een link naar een concept faalt).
export async function addMenuItem({ title, pageUrl, parentId }, opts) {
  const body = { Title: title, Url: pageUrl, IsExternal: false };
  const path = parentId
    ? `/web/navigation/getnodebyid(${parentId})/children`
    : `/web/navigation/quicklaunch`;
  const node = await sp(path, { method: "POST", body, ...opts });
  return { id: node.Id, title: node.Title, url: node.Url };
}
