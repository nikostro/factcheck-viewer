# Fact-check viewer

A standalone, single-file viewer for sentence-by-sentence fact-check documents. Paste or drop in a `factCheckDocument.js` (or `.json`) file and the viewer renders it.

**Everything stays in your browser.** There is no server. The file is parsed locally with the browser's `FileReader` API (or, for shared links, decoded from the URL fragment), so it's safe to use with embargoed material.

## Use it

Open the hosted page (see below) and either:

- **Drop a file** — drag your `factCheckDocument.js` or a `.json` file onto the drop zone.
- **Paste** — paste the contents of either format into the textarea and click **Load document**.
- **Share via URL** — append `#data_b64=<base64-utf8-json>` to the page URL. The viewer decodes the fragment locally and boots straight into the document. Browsers never send fragments to the server, so the payload stays client-side. Both standard and URL-safe base64 are accepted.

To swap to a different document, click **New fact check** at the bottom of the passage pane. This also clears any `#data_b64` from the URL.

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
      "sources": [
        {
          "title": "NYT",
          "url": "https://...",
          "quote": "the substantiating quote from this source"
        }
      ],
      "correction": "~wrong text~ *corrected text* -- short justification [source](https://...)"
    }
  ]
}
```

A pure JSON object (without the `window.factCheckDocument =` wrapper) also works.

### Source quotes

Each entry in `sources` should carry a `quote` — the substantiating excerpt from that source. The viewer renders one card per source: clicking anywhere on the card opens the URL in a new tab, the small copy-icon button copies the URL to the clipboard. Sources without a `quote` still render as link-only cards.

> **Note**: the older top-level `sourceQuote` field on the claim is no longer rendered. Put each quote on its corresponding source instead.

### Proposed corrections

For yellow/red claims you can include a `correction` string. It renders inside an amber "Proposed correction" box on the claim card. The viewer parses a tiny markdown subset:

- `~text~` → strikethrough (the wrong wording)
- `*text*` or `**text**` → bold (the corrected wording)
- `[label](url)` → external link (only `http://` / `https://` URLs are linked)

Anything else is rendered as plain text. Convention:

```
~wrong~ *updated* [optional surrounding context] -- short justification [source label](url)
```

The **Copy correction** button writes both rich HTML and plain markdown to the clipboard. Pasting into Google Docs, Gmail, or Slack preserves the strikethrough, bold, and hyperlinks; pasting into a plain-text editor gets the raw markdown.

## Running locally

Just open `index.html` in a browser. No build step, no dependencies.

## Development

Tests run in headless Chromium via Playwright. From a clean clone:

    npm install
    npx playwright install --with-deps chromium
    npm test

`npm run test:ui` opens Playwright's debug UI for iterating on a single spec.

CI runs the suite on every push and pull request. The GitHub Pages deploy is gated on tests passing for `main` — a red `main` will not be served.

**One-time repo setting**: under *Settings → Pages*, set *Source* to **GitHub Actions** (not "Deploy from a branch"). Without this, Pages will keep auto-deploying from `main` regardless of test status.

## Security note

The paste/upload feature parses input as either JSON (preferred) or, as a fallback, executes it as JavaScript inside an isolated `Function` scope. Because the JS fallback runs code, **only paste files you trust** — i.e. ones you generated yourself or got from a trusted source. There's no way for the file to phone home from this page (no network calls are made), but malicious JS could still mess with the page you're looking at.
