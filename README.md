# academy-pages-mcp (prototype)

Een kleine MCP-server waarmee Claude **rechtstreeks** concept-pagina's op de HTJZ Academy (SharePoint) kan maken, bijwerken en publiceren, via de Microsoft Graph API. Dus **zonder de PowerShell-omweg** die we nu gebruiken.

Dit is een prototype om te laten zien dat het werkt en om IT te laten beoordelen voor uitrol. Het gaat om schrijftoegang tot het kennissysteem van de firma, dus de uiteindelijke keuze (welke rechten, welke app) ligt bij Edgar en IT.

## Waarom
Nu bouwt Claude Academy-pagina's via PowerShell op één Mac met een gecachete verbinding. Dat werkt, maar alleen daar, en collega's zonder die opstelling kunnen niet zelf bijdragen. Met deze tool als connector in de Cowork-omgeving kan iedereen met toegang concept-pagina's laten bouwen, net zoals de bestaande file-tools (uploaden, verplaatsen) werken.

## Wat het doet
Vier tools voor Claude:

| Tool | Wat het doet |
|---|---|
| `academy_create_concept_page` | Maakt een nieuwe pagina als **concept** (draft, niet live). Argumenten: `name`, `title`, `bodyHtml`. |
| `academy_update_page_text` | Werkt de tekst van een pagina bij (blijft concept tot publiceren). Argumenten: `id`, `bodyHtml`. |
| `academy_publish_page` | Publiceert een pagina. Argument: `id`. |
| `academy_list_pages` | Lijst de pagina's op (id, naam, titel, url). |
| `academy_list_menu` | Toont het menu (QuickLaunch) met de id's, om een parent te kiezen. |
| `academy_add_menu_item` | Zet een gepubliceerde pagina in het menu (optioneel onder een sectie). |

Nieuwe pagina's zijn standaard **concept**. Dat sluit aan bij het model "iedereen levert, de eigenaar publiceert": Claude bouwt het concept, de eigenaar publiceert (of vraagt Claude dat te doen).

## De echte beslissing: rechten
De tool heeft schrijftoegang tot de Academy nodig (Graph-scope `Sites.ReadWrite.All`). Twee smaken:

- **Delegated (namens de ingelogde gebruiker).** Veilig en simpel. De gebruiker logt één keer in (device-code), en de tool doet alleen wat die gebruiker zelf mag. Nadeel: de gebruiker moet al bewerkrechten op de Academy hebben.
- **App-only (namens de app zelf).** De tool kan altijd schrijven, ongeacht wie hem gebruikt. Krachtiger en echt "iedereen kan bijdragen", maar dan moet de omgeving zelf bewaken wie de tool mag aanroepen. Vraagt om governance.

Dit is de knoop die IT doorhakt. De code werkt met allebei; standaard staat delegated.

## Demo draaien (zonder dat IT iets registreert)
Voor een snelle demo gebruikt de tool standaard de publieke Microsoft Graph CLI-app, zodat je geen eigen app-registratie nodig hebt. Je logt één keer in met je eigen account.

```bash
cd ~/Developer/academy-pages-mcp
npm install
npm run demo            # maakt een concept-testpagina ZZ-MCP-demo.aspx
npm run demo -- publish # maakt hem en publiceert hem
```

Bij de eerste run verschijnt een device-code login (ga naar de getoonde URL, voer de code in, log in met je HTJZ-account). Daarna is het token gecached en gaat het stil.

> Let op: sommige tenants vragen admin-goedkeuring voor `Sites.ReadWrite.All`. Als de login zegt dat goedkeuring nodig is, moet een Entra-beheerder dat één keer goedkeuren. Dat is precies de IT-stap hieronder.

## Toevoegen aan Claude (Desktop/Cowork)
Zet dit in de MCP-configuratie (bij Claude Desktop: `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "academy-pages": {
      "command": "node",
      "args": ["/Users/edgarstam/Developer/academy-pages-mcp/src/index.mjs"],
      "env": {
        "SP_SITE_URL": "https://stamadvocaten.sharepoint.com/sites/Academy",
        "GRAPH_TENANT": "stamadvocaten.onmicrosoft.com",
        "GRAPH_CLIENT_ID": "646a6353-f18d-4566-84a9-73b2a8d9f23d",
        "GRAPH_SCOPES": "Sites.ReadWrite.All"
      }
    }
  }
}
```

Daarna heeft Claude de vier tools hierboven.

## Voor productie (de nette versie, IT-taak)
1. Registreer een eigen Entra-app "Academy Pages" (in plaats van de Graph CLI-app).
2. Kies de rechtenvorm:
   - **Delegated**: Graph-permissie `Sites.ReadWrite.All` (delegated) + "Allow public client flows" aan (voor device-code). Gebruikers hebben eigen bewerkrechten nodig.
   - **App-only**: Graph-permissie `Sites.ReadWrite.All` (application) + admin consent, en een client secret of certificaat. Zet dan een gate op wie de tool mag gebruiken.
3. Overweeg de scope te beperken tot alleen de Academy-site met `Sites.Selected` in plaats van `Sites.ReadWrite.All` (schrijftoegang tot precies één site, niet alle sites). Netter en veiliger.
4. Zet de client-id (en bij app-only de auth-gegevens) in de env van de connector.

## Menu-beheer (extra permissie nodig)
De Graph-API kan geen SharePoint-menu (QuickLaunch) aanpassen, dus `academy_list_menu` en `academy_add_menu_item` praten met de SharePoint REST-API. Dat vereist een SharePoint-token, en dus een **extra delegated permissie** op de app: **SharePoint > AllSites.Manage** (naast de Graph-permissie), met admin consent. De page-acties (tekst, banner, byline, publiceren) werken op Graph; alleen het menu gebruikt SharePoint.

## Beperkingen van dit prototype
- Delegated device-code is bedoeld voor persoonlijk gebruik per persoon; voor de hele firma zonder per-persoon login is app-only met een gate of `Sites.Selected` de nette route.
- De banner verwijst naar een bestaande afbeelding in SiteAssets (de tool uploadt zelf geen banners).

## Bestanden
- `src/index.mjs` - de MCP-server en de tools.
- `src/graph.mjs` - de Graph Pages-API-aanroepen (maken/bijwerken/publiceren, banner + byline).
- `src/sharepoint.mjs` - de SharePoint REST-aanroepen voor het menu.
- `src/auth.mjs` - device-code login met tokencache (Graph- en SharePoint-scope).
- `src/canvas.mjs` - zet een HTML-fragment om in een tekst-webpart.
- `bin/demo.mjs` - losse demo buiten Claude om.
