# Is Air at a Million Yet?

A one-page tracker for @air.hq's promise of 1,000,000 Instagram followers by October 26, 2027.

- `site/index.html` is the page. It reads `site/data.json` on load. If that fails, it uses the numbers built into the page.
- `site/data.json` holds every follower count, newest last.
- `scripts/update-count.mjs` asks Instagram for today's count and adds it to `data.json`.
- `.github/workflows/update.yml` runs that script every morning, commits the new count, and redeploys the site. It also redeploys whenever you push.

## 1. Put it on GitHub

1. Create a new **public** repo (GitHub Pages is free on public repos), for example `is-air-at-a-million-yet`.
2. Push this folder to it:
   ```bash
   cd is-air-at-a-million-yet
   git init && git add . && git commit -m "Is Air at a million yet?"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/is-air-at-a-million-yet.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Go to **Actions → Update count and deploy → Run workflow**. The site goes live at `https://YOUR-USERNAME.github.io/is-air-at-a-million-yet/`.

Until step 2 below is done, the daily run skips the count with a warning and still deploys the page.

## 2. Let it read the follower count

Instagram only shares another account's follower count through its Graph API, and only to an Instagram **Business or Creator** account that's connected to a **Facebook Page**. Any such account you own works. It's only used to make the lookup.

1. **Meta app.** At developers.facebook.com, go to My Apps → Create app and pick the Business type.
2. **Token.** Open Tools → Graph API Explorer, choose your app, and add these permissions: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`. Then click Generate Access Token.
3. **Your Instagram user ID.** In the Explorer, run:
   ```
   me/accounts?fields=instagram_business_account{id,username}
   ```
   Copy the `instagram_business_account.id`.
4. **Test it.** Run this in the Explorer with that ID:
   ```
   YOUR_IG_USER_ID?fields=business_discovery.username(air.hq){followers_count,media_count}
   ```
5. **Make the token last.** The token from step 2 expires in about an hour.
   - **Quick:** paste it into the Access Token Debugger and click Extend Access Token. That gives you about 60 days.
   - **Permanent:** in Meta Business Settings → Users → System users, add a system user. Give it the app and your Page/Instagram account, then generate a token with the same permissions and expiration set to Never. If your Page access comes through Business Manager, Meta also requires `ads_read`.
6. **Add the secrets.** In the GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret** and add:
   - `IG_USER_ID`: the ID from step 3
   - `IG_ACCESS_TOKEN`: the token from step 5
7. Run the workflow once by hand to check. A commit titled "Daily count: …" should appear.

If the token expires, the daily run fails and GitHub emails you. The page keeps showing the last good count and its date until you paste in a new token.

## Changing things

- **Time of the daily check:** edit the `cron` line in `.github/workflows/update.yml` (it's in UTC).
- **Adding a count by hand:** add a row to `site/data.json` and push.
- **Copy and design:** everything is in `site/index.html`.
