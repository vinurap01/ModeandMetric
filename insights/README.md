# Insights: adding an article

Articles are plain HTML pages. All styling lives in `assets/css/site.css` (the "Insights" block), so
an article only ever contains content and metadata. This file and `_template/` are never deployed
(`.vercelignore`).

## URLs

- Index: `/insights/` → `insights/index.html`
- Article: `/insights/<slug>/` → `insights/<slug>/index.html`
- Slug: lowercase words joined by hyphens, describing the topic, 3-6 words, no dates or stop-word
  padding. Example: `size-charts-and-buying-confidence`. Never change a slug once published.

## Add an article

1. **Copy** `insights/_template/` to `insights/<slug>/`.
2. **Fill every `TODO`** in the new `index.html`:
   - `<title>`: under ~60 characters before ` | Mode & Metric`.
   - Meta description: 140-160 characters, unique.
   - Replace `article-slug` in the canonical, `og:url` and JSON-LD `mainEntityOfPage`.
   - `og:title` / `og:description` / `og:image` (absolute URL; brand card if no featured image).
   - Dates: `article:published_time`, JSON-LD `datePublished` / `dateModified`, and the visible
     `<time>`. All `YYYY-MM-DD` in attributes.
   - JSON-LD `headline` = the h1; breadcrumb item 3 `name` = the h1.
3. **Write the content** inside `.article-body`, replacing the sample copy:
   - One h1 (in the header). h2 for sections, h3 only under an h2.
   - Elements available: paragraphs, `ul`/`ol`, `blockquote` (+ optional `footer` for the source),
     `figure` (plain image, or `.shot` frame for store screenshots), `figure.figure-wide`,
     and `p.article-related` for an inline pointer to another article.
   - Delete the featured image `<figure>` if there isn't one.
   - Read time ≈ words ÷ 230, rounded up (or delete that span).
4. **Images** go in `assets/images/insights/<slug>/`: JPEG, ~1600px wide for featured/wide images,
   ~1000px for inline, ideally under 250 KB, with real `width`/`height` and specific `alt` text.
   Featured image gets `fetchpriority="high"`; all others `loading="lazy"`.
5. **More insights**: list 1-3 related articles (copy rows from `insights/index.html`, using `h3`
   instead of `h2`). Delete the section if this is the only article.
6. **Index**: add a row at the top of the list in `insights/index.html` (newest first). Title and
   description match the article's h1 and introduction.
7. **Sitemap**: add `<url><loc>https://modeandmetric.com/insights/<slug>/</loc><lastmod>YYYY-MM-DD</lastmod></url>`
   to `sitemap.xml`.
8. **Link it** from one or two existing articles where it genuinely helps (inline link or the
   More insights list).
9. **QA**: render at desktop and phone with `Claude/tools/render_and_check.js` and look at the
   screenshots before publishing.

## First article only (launch)

The Insights pages already link to `/insights/` in their nav and footer. The rest of the site
does not yet. With the first article:

- Add `<a href="/insights/">Insights</a>` to the nav (between Pricing and Questions) and the
  footer Explore list on `index.html`, `work/luluwoman.html`, `privacy.html` and `thanks.html`.
- Uncomment the `/insights/` line in `sitemap.xml`.
- Remove the pre-launch `<meta name="robots" content="noindex">` from `insights/index.html`.
- After deploying, confirm `https://modeandmetric.com/insights/_template/` returns 404.

## Updating an article

Change the content, then update `dateModified` in the JSON-LD and the article's `<lastmod>` in
`sitemap.xml`. Keep the original published date.
