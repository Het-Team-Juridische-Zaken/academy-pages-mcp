// Bouwt de canvasLayout voor een pagina met één tekstblok.
// De Graph Pages-API verwacht de inhoud als web parts binnen secties/kolommen,
// niet als losse HTML. Dit zet jouw HTML-fragment in één tekst-webpart.

export function textCanvas(innerHtml) {
  return {
    horizontalSections: [
      {
        layout: "oneColumn",
        id: "1",
        emphasis: "none",
        columns: [
          {
            id: "1",
            width: 12,
            webparts: [
              {
                "@odata.type": "#microsoft.graph.textWebPart",
                innerHtml,
              },
            ],
          },
        ],
      },
    ],
  };
}
