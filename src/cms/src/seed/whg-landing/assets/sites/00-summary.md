# BuiltWith sites — capture summary

Captured at 2026-06-27 via Playwright MCP, viewport 1280x800, JPEG quality 90, viewport-only (not fullPage).

| Slug          | URL                      | Screenshot                    | Size   | Favicon source                                                     |
| ------------- | ------------------------ | ----------------------------- | ------ | ------------------------------------------------------------------ |
| veo55         | https://veo55.ru         | veo55-screenshot.jpeg         | 114 KB | `/branding/logo.png` (PNG, custom)                                 |
| sawking-tech  | https://sawking.tech     | sawking-tech-screenshot.jpeg  | 115 KB | Ghost CMS 256x256 PNG                                              |
| sng74         | https://sng74.ru         | sng74-screenshot.jpeg         | 119 KB | Joomla Helix Ultimate template favicon.ico                         |
| fitness-mafia | https://fitness-mafia.ru | fitness-mafia-screenshot.jpeg | 97 KB  | Joomla Helix Ultimate template favicon.ico (same default as sng74) |

## OK

- All 4 sites loaded within 4s wait, screenshots produced at expected size (95-120 KB).
- Favicon URLs extracted from `<link rel="icon">` tags for all 4 sites (recorded in 00-sites.json — seed can fetch on upload).

## Notes

- `sawking.tech` had 1 console error during initial load (didn't affect screenshot — Ghost CMS asset).
- `sng74.ru` and `fitness-mafia.ru` both use the same Joomla Helix Ultimate default favicon (no custom branding on those — they're stock Joomla sites). Real brand marks would need to come from somewhere else (logo image inside the page) if we want distinct icons.
- Favicons were NOT downloaded to disk — only URLs recorded in `00-sites.json`. Seed-script downloads at upload time.

## Failed

- None.
