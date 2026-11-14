# Pavv Compendium

A Hugo starter for the public, player-facing reference to Pavv. It uses Markdown and its own layouts. Hugo 0.123.8 was used to verify the starter.

## Preview locally

Open a terminal in this folder and run:

```powershell
hugo server
```

Open the address Hugo prints. Run `hugo server --buildDrafts` to include drafts in your local preview.

## Add content

- `content/handbook/` holds chapters of the Player’s Handbook. Give chapters a `weight` to set their reading order.
- `content/atlas/` holds Atlas entries. Use an `index.md` inside an entry folder to keep its maps and other images beside the text.
- `content/dossiers/` holds one page per dossier. Update the original page and its `lastmod` date when you revise it.
- `content/support.md` holds the support page. Set `patreonURL` in `hugo.toml` to enable the Patreon button.

For example, `hugo new content dossiers/entry-name/index.md` creates a draft. Change the title, add the player-facing text, and set `draft = false` when it’s ready. Keep DM-only notes outside the site source.

## Publish when ready

Set `baseURL` in `hugo.toml` to the full public address with a trailing slash. Run `hugo` and deploy the generated `public/` folder with a static host. You can use a subdomain first and update the base URL when you move. If players already use the old address, configure redirects there when you switch.
