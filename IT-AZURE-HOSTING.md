# De Academy-tool centraal hosten op Azure

Doel: de Academy-tool één keer centraal draaien, zodat collega's niets meer installeren (geen Node, geen Terminal, geen beveiligingsmelding). Ze gebruiken hem gewoon in Claude.

Nu draait de tool lokaal op elke Mac (via Node). Dat is te technisch gebleken voor de meeste collega's. De oplossing: de tool als kleine webdienst op Azure, waar Claude via een URL mee verbindt (een "remote connector").

## Stand van zaken: het risicovolle deel is bewezen
Het lastigste onderdeel (per-gebruiker inloggen) is al gebouwd en getest. In een lokale proef logde een gebruiker via de browser in met het HTJZ-account (OAuth authorization code + PKCE, Entra), waarna de webdienst **namens die persoon** een pagina op de Academy aanmaakte en weer verwijderde, en het menu las. De delegated route (Optie A) werkt dus in een hosted webmodel. Wat resteert is vooral hosting en productie-afronding, geen open vraag meer.

Voor de proef is in de app-registratie de redirect-URI `http://localhost:8080/auth/callback` toegevoegd (publieke client + PKCE, geen secret). Voor productie wordt dit een confidential client met een secret (in Key Vault) en de Azure-URL als redirect.

## Architectuur in het kort
- Een kleine Node-webdienst (de MCP-connector) die over HTTPS draait.
- De code staat op GitHub (`github.com/Het-Team-Juridische-Zaken/academy-pages-mcp`); Azure deployt daarvandaan.
- Claude (Desktop en claude.ai) verbindt met de dienst via een URL, het mooist org-breed aangezet via de beheerdersinstellingen van claude.ai, zodat niemand handmatig iets hoeft toe te voegen.

## De belangrijkste keuze: hoe loggen mensen in
- **Aanrader: per gebruiker (delegated, Optie A).** Elke collega logt één keer in met het eigen HTJZ-account; de dienst werkt namens die persoon en kan alleen wat die persoon zelf mag. Dit houdt de veilige lijn vast die we eerder kozen. Vereist een Entra-app als "web"-app met een redirect-URI en een secret.
- **Alternatief: namens de app zelf (app-only).** Simpeler te bouwen, maar dan schrijft de dienst met één krachtige identiteit voor iedereen. Dat is precies het model dat we bewust niet kozen. Alleen overwegen met strikte toegangscontrole op wie de connector mag gebruiken.

## Wat IT op Azure inricht
1. **Hosting**: een Azure Container App of App Service (Linux, Node 20+), met een HTTPS-endpoint. Klein verbruik, naar verwachting enkele euro's per maand.
2. **Entra-app (web)**: een app-registratie met platform "Web", een redirect-URI naar de dienst, en een client secret (bewaren in Azure Key Vault). Delegated Graph-permissie `Sites.ReadWrite.All` en SharePoint `AllSites.Manage` (net als de huidige app, maar nu als web-app i.p.v. publieke client).
3. **Config**: de dienst krijgt via omgeving/Key Vault de client-id, tenant, secret en de site-URL mee.
4. **Deploy vanaf GitHub**: koppel de repo, of gebruik een container-image; auto-deploy bij een nieuwe versie.

## Wat Claude/beheer doet
- De connector als URL toevoegen. Voor het hele team in één keer: via de organisatie-instellingen van claude.ai (connectors), zodat collega's niets hoeven te doen.

## Wat ik lever
- De webversie van de tool (de code), inclusief het inlogstuk, klaar om te deployen.
- Deze instructie plus de exacte config-waarden.

## Wat er hetzelfde blijft
De tool doet nog steeds: pagina maken (tekst, banner, eigenaar), publiceren en in het menu zetten. Alleen de plek waar hij draait verandert (van elke Mac naar Azure), en het inloggen wordt een nette weblogin in plaats van een code in de terminal.

## Extra functie: wekelijks overzicht (aangevraagd)
Zodra de dienst op Azure draait, komt er een wekelijkse taak bij: die kijkt welke pagina's de afgelopen 7 dagen op de Academy zijn gepubliceerd of bijgewerkt, en post daar één kort overzichtsbericht van in huisstijl (als nieuws). Alleen posten als er iets nieuws is; lege weken overslaan.

Technisch: dit is een timer (bijvoorbeeld een Azure Container Apps job of een Function met timer-trigger) die de bestaande dienst aanroept. **Let op de auth:** deze taak draait 's nachts zonder dat er een gebruiker inlogt, dus die kan niet "namens een gebruiker" (delegated) werken. Voor alleen dit wekelijkse overzichtsbericht is een **app-only** toegang nodig (de app post het zelf), strikt beperkt tot posten op de Academy-site (bij voorkeur via `Sites.Selected` op alleen die site). Dat is een gecontroleerde, afgebakende uitzondering: het gaat om één automatisch systeembericht, geen gebruiker-impersonatie. De rest van de tool (mensen die zelf pagina's maken) blijft gewoon per gebruiker (delegated).
