# Fact-check viewer

A standalone, single-file viewer for sentence-by-sentence fact-check documents. Paste or drop in a `factCheckDocument.js` (or `.json`) file and the viewer renders it.

**Everything stays in your browser.** There is no server. The file is parsed locally with the browser's `FileReader` API, so it's safe to use with embargoed material.

## Use it

Open the hosted page (see below) and either:

- **Drop a file** — drag your `factCheckDocument.js` or a `.json` file onto the drop zone.
- **Paste** — paste the contents of either format into the textarea and click **Load document**.

To swap to a different document, click **Load different document** in the bottom-right corner.

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

## Hosting it on GitHub Pages

1. Create a new public GitHub repo, e.g. `factcheck-viewer`.
2. Add `index.html` (and optionally this `README.md`) to the repo.
3. Push to `main`.
4. In the repo, go to **Settings → Pages**. Under **Build and deployment**, set the source to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. After ~1 minute the site is live at `https://<your-username>.github.io/factcheck-viewer/`.

That's it — share the URL with collaborators.

## Running locally

Just open `index.html` in a browser. No build step, no dependencies.

## Security note

The paste/upload feature parses input as either JSON (preferred) or, as a fallback, executes it as JavaScript inside an isolated `Function` scope. Because the JS fallback runs code, **only paste files you trust** — i.e. ones you generated yourself or got from a trusted source. There's no way for the file to phone home from this page (no network calls are made), but malicious JS could still mess with the page you're looking at.
