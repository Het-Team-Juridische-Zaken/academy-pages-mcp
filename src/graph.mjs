// Praat met de Microsoft Graph Pages-API om Academy-pagina's te maken/bijwerken/publiceren.
// Nieuwe pagina's zijn standaard een DRAFT (concept) tot je ze publiceert. Dat past bij
// het model "iedereen levert, de eigenaar publiceert".

import { getToken } from "./auth.mjs";
import { textCanvas } from "./canvas.mjs";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SITE_URL = (process.env.SP_SITE_URL || "https://stamadvocaten.sharepoint.com/sites/Academy").replace(/\/+$/, "");

async function graph(path, { method = "GET", body, onDeviceCode } = {}) {
  const token = await getToken({ onDeviceCode });
  const res = await fetch(path.startsWith("http") ? path : `${GRAPH}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Graph ${method} ${path} -> ${res.status} ${res.statusText}: ${text}`);
  return text ? JSON.parse(text) : null;
}

let _siteId = null;
export async function siteId(opts) {
  if (_siteId) return _siteId;
  const u = new URL(SITE_URL);
  const info = await graph(`/sites/${u.hostname}:${u.pathname}`, opts);
  _siteId = info.id;
  return _siteId;
}

export async function createConceptPage({ name, title, bodyHtml, bannerUrl, ownerEmail }, opts) {
  const sid = await siteId(opts);
  const fileName = name.endsWith(".aspx") ? name : `${name}.aspx`;
  const body = {
    "@odata.type": "#microsoft.graph.sitePage",
    name: fileName,
    title,
    pageLayout: "article",
    canvasLayout: textCanvas(bodyHtml),
  };
  const titleArea = { showPublishedDate: false };
  if (bannerUrl) {
    titleArea.layout = "imageAndTitle";
    titleArea.imageWebUrl = bannerUrl;
    titleArea.enableGradientEffect = true;
  }
  if (ownerEmail) {
    titleArea.showAuthor = true;
    titleArea.authorByline = [`i:0#.f|membership|${ownerEmail}`];
  }
  if (bannerUrl || ownerEmail) body.titleArea = titleArea;
  const page = await graph(`/sites/${sid}/pages`, { method: "POST", body, ...opts });
  return { id: page.id, name: page.name, title: page.title, webUrl: page.webUrl, status: "concept (niet gepubliceerd)" };
}

export async function updatePageText({ id, bodyHtml }, opts) {
  const sid = await siteId(opts);
  await graph(`/sites/${sid}/pages/${id}/microsoft.graph.sitePage`, {
    method: "PATCH",
    body: { canvasLayout: textCanvas(bodyHtml) },
    ...opts,
  });
  return { id, status: "bijgewerkt (concept tot publiceren)" };
}

export async function publishPage({ id }, opts) {
  const sid = await siteId(opts);
  await graph(`/sites/${sid}/pages/${id}/microsoft.graph.sitePage/publish`, { method: "POST", ...opts });
  return { id, status: "gepubliceerd" };
}

export async function listPages(opts) {
  const sid = await siteId(opts);
  const r = await graph(`/sites/${sid}/pages/microsoft.graph.sitePage?$select=id,name,title,webUrl`, opts);
  return (r.value || []).map((p) => ({ id: p.id, name: p.name, title: p.title, webUrl: p.webUrl }));
}
