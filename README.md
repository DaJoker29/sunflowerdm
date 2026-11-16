# SunflowerDM

A Hugo site for SunflowerDM’s public D&D campaigns, tools, and games.

## Preview in VS Code

Open this folder and run `hugo server` in the integrated terminal. Open the address Hugo prints. Add `--buildDrafts` to preview drafts.

The footer uses Hugo’s Git info to show the last commit that touched each page’s source file. Commit new pages to show their footer date and hash. For deployment, build with `hugo` from a checkout with full Git history, then deploy the generated `public/` directory after setting `baseURL` in `hugo.toml`.

## Update the site

- `content/players/pavv/` contains the Start Here page, Handbook, Atlas, and Bestiary. Set `weight` to order entries and add `lastmod = YYYY-MM-DD` to surface a page under Recently Updated.
- `content/players/campaigns/` contains campaign intros and guides. In a campaign’s front matter under `[params]`, set `recruiting = true` to list it in Open Games. Add `pitch`, `schedule`, `startPlayingURL`, and/or `roll20URL` as available.
- Set the Stripe and Venmo URLs in `content/payment.md`. Make a Payment also lists recruiting games with StartPlaying links.
- `content/dm/` contains sections for generators, roll tables, and statblocks.
- Set `patreonURL` in `hugo.toml` to show the Patreon button.

### Write an article

Run `hugo new content --kind article articles/my-article` from the site folder. Edit the title, short description, and date in `content/articles/my-article/index.md`, then write the article in Markdown below the front matter. Keep any images beside `index.md` and reference them by filename.

Preview with `hugo server --buildDrafts`. Set `draft = false` when the article is ready for the next site build. Published articles appear in the Articles archive and command palette.

### Add a Bestiary entry

Create a Bestiary entry with `hugo new content --kind bestiary players/pavv/bestiary/entry-name`. Put the optional illustration and token beside the generated `index.md` and set their filenames in the front matter. Remove `draft = true` when the entry is ready. Keep private DM notes outside the site source.
