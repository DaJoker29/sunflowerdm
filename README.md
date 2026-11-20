# SunflowerDM

A Hugo site for SunflowerDM’s public D&D campaigns, tools, and games.

## Preview in VS Code

Open this folder and run `hugo server` in the integrated terminal. Open the address Hugo prints. Add `--buildDrafts` to preview drafts.

The footer uses Hugo’s Git info to show the last commit that touched each page’s source file. Commit new pages to show their footer date and hash. For deployment, build with `hugo` from a checkout with full Git history and deploy the generated `public/` directory. Serve `404.html` with an HTTP 404 response for missing URLs.

The production `baseURL` in `hugo.toml` controls canonical links, social previews, and the sitemap. After deployment, submit `sitemap.xml` in Google Search Console. When moving to a new domain, update `baseURL`, permanently redirect each old URL to the corresponding new URL at the host, and submit the sitemap for the new domain.

## Update the site

- `content/players/pavv/` contains the Start Here page, Handbook, Atlas, and Bestiary. Set `weight` to order entries and add `lastmod = YYYY-MM-DD` to surface a page under Recently Updated.
- `content/players/campaigns/` contains campaign intros and guides. In a campaign’s front matter under `[params]`, set `recruiting = true` to list it in Open Games. Add `pitch`, `schedule`, `startPlayingURL`, and/or `roll20URL` as available.
- Set the Stripe and Venmo URLs in `content/payment.md`. Make a Payment also lists recruiting games with StartPlaying links.
- `content/dm/` contains sections for generators, roll tables, and statblocks.
- Set `patreonURL` in `hugo.toml` to show the Patreon button.

### Write an article

Run `hugo new content --kind article articles/my-article` from the site folder. Edit the title, short description, and date in `content/articles/my-article/index.md`, then write the article in Markdown below the front matter. Keep any images beside `index.md` and reference them by filename.

Preview with `hugo server --buildDrafts`. Set `draft = false` when the article is ready for the next site build. Published articles appear in the Articles archive and command palette.

Use a short, specific `description` for search and link previews. To use an article image in the preview, set `socialImage` to its filename in the article folder and describe it in `socialImageAlt`.

Use the `callout` shortcode for an aside in the article body. The title is optional, and the body accepts Markdown.

```markdown
{{< callout title="At the table" >}}
Give players **one landmark** they can use to find their way back.
{{< /callout >}}
```

To put an article in a series, add these fields to its front matter:

```toml
series = "Start with the Map"
seriesOrder = 1
```

Use the same series name for every installment and give each its own order number. The contents list and the inner footer links follow that order. The outer footer links browse all articles by publication date. Installments without a number appear after the numbered parts, in date order. Draft installments appear only in builds that include drafts.

### Add a timeline event

Run `hugo new content --kind timeline-event players/pavv/atlas/timeline/my-event.md`. Set `age` to `creation`, `discovery`, or `pilgrimage`. Set `timelineDate` to the date label readers should see and `weight` to its order within that age. Lower numbers appear first. Write the event in Markdown below the front matter, then set `draft = false` to publish it on the timeline.

Each event is rendered inside the timeline. Its `_build` settings keep it out of site-wide page lists. Edit the age names, ranges, and order in `content/players/pavv/atlas/timeline/_index.md`.

### Add a Bestiary entry

Create a Bestiary entry with `hugo new content --kind bestiary players/pavv/bestiary/entry-name`. Put the optional illustration and token beside the generated `index.md` and set their filenames in the front matter. Remove `draft = true` when the entry is ready. Keep private DM notes outside the site source.
