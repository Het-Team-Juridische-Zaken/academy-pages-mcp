#!/bin/bash
# Academy-tool aanzetten in Claude Desktop (macOS).
# Dubbelklik dit bestand. Het voegt de connector toe aan je Claude-config.
set -euo pipefail

CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "Academy-tool installeren in Claude..."
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "LET OP: 'node' is niet gevonden op deze Mac. De tool heeft Node nodig."
  echo "Vraag even IT of Edgar om Node te installeren, en draai dit daarna opnieuw."
  echo ""
  read -p "Druk op Enter om te sluiten."
  exit 1
fi

if [ ! -f "$CFG" ]; then
  echo "De Claude-config is niet gevonden op:"
  echo "  $CFG"
  echo "Is Claude Desktop wel geinstalleerd en minstens een keer gestart?"
  echo ""
  read -p "Druk op Enter om te sluiten."
  exit 1
fi

cp "$CFG" "$CFG.bak-$(date +%Y%m%d%H%M%S)"

python3 - "$CFG" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d.setdefault("mcpServers", {})
d["mcpServers"]["academy-pages"] = {
    "command": "npx",
    "args": ["-y", "github:Het-Team-Juridische-Zaken/academy-pages-mcp"],
    "env": {
        "SP_SITE_URL": "https://stamadvocaten.sharepoint.com/sites/Academy",
        "GRAPH_TENANT": "stamadvocaten.onmicrosoft.com",
        "GRAPH_CLIENT_ID": "646a6353-f18d-4566-84a9-73b2a8d9f23d",
        "GRAPH_SCOPES": "Sites.ReadWrite.All",
    },
}
json.dump(d, open(p, "w"), indent=2, ensure_ascii=False)
print("Gelukt: de Academy-tool is toegevoegd aan Claude.")
PY

echo ""
echo "KLAAR. Doe nu nog twee dingen:"
echo "  1. Sluit Claude Desktop helemaal af en start het opnieuw."
echo "  2. De eerste keer dat je de tool gebruikt, log je een keer in met je HTJZ-account."
echo ""
read -p "Druk op Enter om te sluiten."
