# Fact-check viewer

A standalone, single-file viewer for sentence-by-sentence fact-check documents. Paste or drop in a `factCheckDocument.js` (or `.json`) file and the viewer renders it.

**Everything stays in your browser.** There is no server. The file is parsed locally with the browser's `FileReader` API (or, for shared links, decoded from the URL fragment), so it's safe to use with embargoed material.

## Use it

Open the hosted page (see below) and either:

- **Drop a file** — drag your `factCheckDocument.js` or a `.json` file onto the drop zone.
- **Paste** — paste the contents of either format into the textarea and click **Load document**.
- **Share via URL** — append `#data_b64=<base64-utf8-json>` to the page URL. The viewer decodes the fragment locally and boots straight into the document. Browsers never send fragments to the server, so the payload stays client-side. Both standard and URL-safe base64 are accepted.

To swap to a different document, click **Load different document** in the bottom-right corner. This also clears any `#data_b64` from the URL.

## Document format

The viewer expects an object with at least a `title` and a `claims` array:

```js
window.factCheckDocument = {
  "title": "My fact-check",
  "subtitle": "Sentence-by-sentence / clause-by-clause fact check",
  "passage": "The original text being checked...",
  "claims": [
    {
      "id": "C1",
      "claim": "Some claim from the passage",
      "verdict": "green",            // green | yellow | red | blue | purple
      "check": "What I found when checking it",
      "snippet": "exact passage text to highlight",
      "sourceQuote": "...",
      "sources": [{ "title": "NYT", "url": "https://..." }]
    }
  ]
}
```

A pure JSON object (without the `window.factCheckDocument =` wrapper) also works.

## Running locally

Just open `index.html` in a browser. No build step, no dependencies.

## Security note

The paste/upload feature parses input as either JSON (preferred) or, as a fallback, executes it as JavaScript inside an isolated `Function` scope. Because the JS fallback runs code, **only paste files you trust** — i.e. ones you generated yourself or got from a trusted source. There's no way for the file to phone home from this page (no network calls are made), but malicious JS could still mess with the page you're looking at.
