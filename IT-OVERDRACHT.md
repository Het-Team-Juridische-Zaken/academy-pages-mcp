# Overdracht aan IT: schrijfbare Academy-pagina-tool

Korte notitie om door te sturen. Doel: één beslissing en één kleine klus.

## Wat we willen
Claude laten bijdragen aan de HTJZ Academy (SharePoint) zonder de huidige PowerShell-omweg. Dan kan Claude concept-pagina's rechtstreeks maken, bijwerken en publiceren, en kunnen collega's met toegang bijdragen in plaats van dat alles via één werkplek loopt.

## Wat het is
Een klein hulpprogramma (een MCP-connector) dat praat met de standaard Microsoft Graph Pages-API. Het prototype is gebouwd en getest: de tool start, meldt zijn vier acties (pagina maken, bijwerken, publiceren, opsommen) en werkt technisch. De code staat op `~/Developer/academy-pages-mcp` (zie de README voor details). Een live demo kan in vijf minuten met een device-code login.

## De enige echte beslissing: welke rechten
De tool heeft schrijftoegang tot de Academy nodig (Microsoft Graph). Kies één van twee:

1. **Namens de gebruiker (delegated).** Simpel en veilig. De gebruiker logt één keer in en de tool doet alleen wat die persoon zelf al mag. Voorwaarde: de gebruiker heeft bewerkrechten op de Academy. Goed als een handjevol mensen bijdraagt.
2. **Namens de app zelf (app-only).** De tool kan altijd schrijven, ongeacht wie hem gebruikt. Nodig als echt iedereen met toegang moet kunnen bijdragen. Vraagt om admin consent en een afscherming van wie de tool mag aanroepen.

**Advies:** beperk de schrijftoegang met de Graph-permissie `Sites.Selected` tot **alleen de Academy-site**, in plaats van `Sites.ReadWrite.All` (alle sites). Dan kan de tool niets buiten de Academy.

## Wat IT concreet doet (klein, circa 1 tot 2 uur)
1. Registreer een Entra-app "Academy Pages".
2. Ken de Graph-permissie toe:
   - Delegated: `Sites.ReadWrite.All` (of `Sites.Selected`) + "Allow public client flows" aan (voor de device-code login).
   - App-only: `Sites.Selected` (aanbevolen) of `Sites.ReadWrite.All` als application-permissie + admin consent + een client secret of certificaat.
3. Bij `Sites.Selected`: geef de app schrijfrechten op precies de Academy-site.
4. Zet de client-id (en bij app-only de auth-gegevens) in de connector-config. De rest staat klaar.

## Beveiliging in één zin
Het gaat om schrijftoegang tot uitsluitend de Academy-site, niet tot dossiers, mail of andere sites. Met `Sites.Selected` is dat ook technisch afgedwongen.

## Contact
Vragen over de werking of een demo: via Edgar. De technische details en de exacte config staan in de README bij de code.
