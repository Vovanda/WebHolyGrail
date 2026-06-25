# Secrets

Secrets management uses [Infisical](https://infisical.com/) — a self-host-able platform with a hosted free tier. The same source of truth feeds local development and production. No plaintext `.env*` files are kept anywhere in this repo or on the production VPS.

## What lives where

| Where                                      | What                                                                                                                                                                                                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://app.infisical.com` (or self-host) | All secrets (`PAYLOAD_SECRET`, `DATABASE_URI`, `VK_ACCESS_TOKEN`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, …) for every environment (`dev`, `staging`, `prod`).                                                                                         |
| Local machine                              | `.infisical.json` (committed) links this folder to the Infisical project. The CLI keeps your login token under `~/.infisical/`.                                                                                                                            |
| Production VPS                             | A single file `/etc/infisical/token` (chmod 600 deploy:deploy) holds the **service token**. `deploy.sh` wraps every container start in `infisical run --token=… --env=prod` and the secrets are injected as environment variables — never written to disk. |

## First-time local setup

```bash
# From the site folder (e.g. sites/<your-site>/):
./dev-setup.sh
```

That script:

1. Verifies the Infisical CLI is installed (`brew install infisical/get-cli/infisical` / `winget install Infisical.CLI` / Linux install script).
2. Runs `infisical login` (browser OAuth, stores the token under `~/.infisical/`).
3. Runs `infisical init` — pick the project and link this folder. Creates `.infisical.json`.

After that:

```bash
./dev.sh
```

This wraps the dev process tree in `infisical run --env=dev` — every workspace receives the secrets from the `dev` environment.

## Production setup (one-time)

1. Install the CLI on the VPS:
   ```bash
   curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sudo sh
   ```
2. Create a service token in Infisical (or a Machine Identity → service token) scoped to `prod`.
3. On the VPS:
   ```bash
   sudo install -d -m 700 -o deploy -g deploy /etc/infisical
   echo "<service-token>" | sudo tee /etc/infisical/token > /dev/null
   sudo chmod 600 /etc/infisical/token
   sudo chown deploy:deploy /etc/infisical/token
   ```
4. The blue-green `deploy.sh` reads from `/etc/infisical/token` and wraps `docker compose ...` in `infisical run` — secrets are injected into containers as environment variables.

## Changing a secret

1. Open the secret in the Infisical UI for the right environment (e.g. `prod`).
2. Update the value, save.
3. On the next deploy (or `docker compose up -d --force-recreate <service>`), the container will pick up the new value.

There is no `.env.production` to keep in sync. No SSH-and-sed. No restart-and-pray. Web UI, save, redeploy.

## Reading and rotating

- `infisical secrets list --env=prod` — list (CLI must be logged in or use a service token).
- `infisical secrets get VK_ACCESS_TOKEN --env=prod` — single value.
- Rotate a secret in the UI; redeploy the affected service.

## What never touches git

- `.env`, `.env.local`, `.env.production`, `.env.*` (covered by `.gitignore`).
- `~/.infisical/` (per-user).
- `/etc/infisical/token` (per-host).

`.infisical.json` is safe to commit — it identifies the project but contains no secrets.
