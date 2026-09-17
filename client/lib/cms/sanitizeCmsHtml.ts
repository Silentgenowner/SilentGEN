import sanitizeHtml from "sanitize-html";

/*
|--------------------------------------------------------------------------
| SANITIZE CMS HTML
|--------------------------------------------------------------------------
|
| Word/PDF import અથવા Rich Text Editorમાંથી આવતું HTML
| customer page પર render થાય તે પહેલાં clean રાખવા માટે.
|
|--------------------------------------------------------------------------
*/

export function sanitizeCmsHtml(
  html: string
) {
  return sanitizeHtml(
    String(html || ""),
    {
      allowedTags: [
        "p",
        "br",

        "h1",
        "h2",
        "h3",
        "h4",

        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "del",

        "ul",
        "ol",
        "li",

        "blockquote",

        "hr",

        "a",

        "code",
        "pre",

        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "th",
        "td",

        "span",
      ],

      allowedAttributes: {
        a: [
          "href",
          "target",
          "rel",
        ],

        td: [
          "colspan",
          "rowspan",
        ],

        th: [
          "colspan",
          "rowspan",
        ],
      },

      allowedSchemes: [
        "http",
        "https",
        "mailto",
        "tel",
      ],

      allowProtocolRelative:
        false,
    }
  );
}

export default sanitizeCmsHtml;