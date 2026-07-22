# Entra-app aanmaken, stap voor stap (Optie A, delegated)

Voor wie dit doet zonder technische voorkennis. Je maakt een "app-registratie" aan: dat is niets meer dan een naampje waaronder de tool namens jou mag inloggen. Duurt ongeveer 10 minuten. Je hoeft niets te programmeren.

Wat je nodig hebt: inloggen met je HTJZ-account. Aan het eind stuur je mij één stukje tekst (de "client-id"), dan zet ik de rest klaar.

## Stap 1 - Ga naar het beheerscherm
1. Open in je browser: **entra.microsoft.com**
2. Log in met je HTJZ-account.

## Stap 2 - Maak de app aan
1. Klik links op **Applications** en dan op **App registrations**.
2. Klik bovenaan op **+ New registration**.
3. Bij **Name** typ je: `Academy Pages`
4. Laat de rest staan zoals het is (accounts in deze organisatie; geen redirect-URI invullen).
5. Klik onderaan op **Register**.

Je komt nu op de overzichtspagina van de app.

## Stap 3 - Kopieer de client-id (dit stuur je mij)
1. Op de **Overview**-pagina zie je **Application (client) ID**: een lange code met streepjes.
2. Klik op het kopieer-icoontje ernaast.
3. Bewaar die even (plak hem straks in een bericht aan mij).

## Stap 4 - Zet de inlog-manier aan
1. Klik links op **Authentication**.
2. Scroll naar beneden naar **Advanced settings**.
3. Bij **Allow public client flows** zet je de schakelaar op **Yes**.
4. Klik bovenaan op **Save**.

## Stap 5 - Geef de app de juiste rechten
1. Klik links op **API permissions**.
2. Klik op **+ Add a permission**.
3. Kies **Microsoft Graph**.
4. Kies **Delegated permissions** (namens de gebruiker).
5. Typ in het zoekveld: `Sites.ReadWrite.All`
6. Vink het aan en klik op **Add permissions**.

## Stap 6 - Goedkeuren (let op: dit is de enige stap die beheerdersrechten vraagt)
1. Nog steeds op **API permissions**: klik op de knop **Grant admin consent for [HTJZ]**.
2. Bevestig met **Yes**.
3. In de kolom **Status** moet er een groen vinkje "Granted" komen te staan.

**Werkt deze knop niet, of krijg je "you need admin approval"?** Dan is dit precies het ene klusje voor IT: vraag Paola om op deze app op "Grant admin consent" te klikken. De rest heb je dan al gedaan.

## Klaar
Stuur mij de **client-id** uit stap 3. Dan zet ik die in de configuratie en is de tool klaar voor gebruik.

## Twee dingen die mis kunnen gaan
- **"New registration" is grijs of geblokkeerd** (stap 2): dan staat in jullie tenant het zelf aanmaken van apps uit. Dat is dan het enige dat IT even moet doen (of aanzetten, of de app voor je maken).
- **De goedkeuring in stap 6** kan alleen een beheerder. Als jij die rechten niet hebt, is dat de enige klik die naar IT gaat.
