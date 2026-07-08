# Trumbo VS Code extension — Marketplace publishing

Two supported auth paths:

| Path | Best for | Expires |
|---|---|---|
| **Entra ID + GitHub OIDC** (recommended) | CI on `xedro98/Trumbo` | Short-lived tokens, no rotation |
| **VSCE_PAT** (legacy) | Local first publish, emergency fallback | Global PATs dead **2026-12-01** |

Publisher ID must stay **`trumbo`** (`package.json` → `"publisher": "trumbo"`).

---

## A. Entra ID + GitHub OIDC (recommended for CI)

### 1. Create an App Registration

1. Open [Microsoft Entra admin center](https://entra.microsoft.com) → **Applications** → **App registrations** → **New registration**.
2. Name: `Trumbo VS Code Marketplace Publish`.
3. Supported account types: **Single tenant** (your org) is fine.
4. Register. Copy:
   - **Application (client) ID** → `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_TENANT_ID`

### 2. Add a GitHub federated credential

In the app → **Certificates & secrets** → **Federated credentials** → **Add credential**:

| Field | Value |
|---|---|
| Federated credential scenario | **GitHub Actions deploying Azure resources** |
| Organization | `xedro98` |
| Repository | `Trumbo` |
| Entity type | **Environment**, **Tag**, or **Branch** (pick one) |
| Subject (examples) | Tag: `ref:refs/tags/v*` for release tags only, or Branch: `ref:refs/heads/main` |

Use **Tag** + `ref:refs/tags/v*` if you only publish from version tags (matches `ext-vscode-publish-stable.yml`).

Copy the credential **Subject** string if you need to debug federation later.

### 3. Register the service principal in Azure DevOps (required)

Marketplace membership uses the **Azure DevOps profile identity ID**, not the Entra app Object ID. If you paste the wrong GUID, Members shows **`TF14045: The identity could not be found`**.

#### 3a. Connect the org to Microsoft Entra (prerequisite)

If **Add users** only accepts email addresses and rejects `Trumbo VS Code Marketplace Publish` with *"Given email address ... is invalid"*, the Azure DevOps org is not linked to your Entra tenant yet.

1. [dev.azure.com](https://dev.azure.com) → your org → **Organization settings** → **Microsoft Entra**.
2. **Connect directory** and pick the tenant where the app registration lives.
3. Re-open **Users** → **Add users** after the connection completes.

Without this step, service principals cannot be invited and every non-email string fails as an invalid address.

#### 3b. Add the service principal (not by display name alone)

1. Entra → **Enterprise applications** → `Trumbo VS Code Marketplace Publish` → copy **Object ID** (this is the **service principal** Object ID, not the app registration Object ID).
2. Azure DevOps → **Organization settings** → **Users** → **Add users**.
3. Paste the **Object ID GUID** into the users field (do not type the display name and click Add immediately).
4. Wait until Azure DevOps resolves it as a **service principal** (not a red email chip). Then set access level **Basic** (or Stakeholder if you only need Marketplace publish) and add.

If paste-by-GUID still fails, the org tenant and app tenant do not match. Fix directory connection first.

### 4. Resolve the Marketplace member ID (Profiles API)

Run this **as the service principal** (not as your personal account). The JSON field **`id`** is what you paste into Marketplace Members.

**GitHub Actions (uses your existing OIDC app + `vscode-marketplace-release` environment):**

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: azure/login@v2
    with:
      client-id: ${{ vars.AZURE_CLIENT_ID }}
      tenant-id: ${{ vars.AZURE_TENANT_ID }}
      allow-no-subscriptions: true

  - name: Resolve VSS profile identity id
    run: |
      az rest -u https://app.vssps.visualstudio.com/_apis/profile/profiles/me \
        --resource 499b84ac-1321-427f-aa17-267ca6975798
```

Copy the **`id`** value from the response (example shape: `"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"`).

**Local (only if you created a client secret on the app):**

```powershell
az login --service-principal -u $env:AZURE_CLIENT_ID -p $env:AZURE_CLIENT_SECRET --tenant $env:AZURE_TENANT_ID
az rest -u https://app.vssps.visualstudio.com/_apis/profile/profiles/me --resource 499b84ac-1321-427f-aa17-267ca6975798
```

Do **not** paste any of these into Members (all cause TF14045):

| Wrong value | Where people copy it from |
|---|---|
| Application (client) ID | App registration overview |
| App registration Object ID | App registration overview |
| Enterprise app Object ID | Enterprise applications overview |

**User-assigned managed identity path (Microsoft doc alternative):** paste the MI **Azure resource ID** instead of a profile `id`.

### 5. Add the identity to the Marketplace publisher

1. Open [Marketplace publisher management](https://marketplace.visualstudio.com/manage/publishers/trumbo) → **Members** → **Add**.
2. Paste the **Profiles API `id`** from step 4 (or MI resource ID if you used that path).
3. Role: **Contributor** first as a sanity check; the display name should show your app. Then keep **Contributor** for publish.

If Members still fails, publish once with **VSCE_PAT** as the publisher owner (section B), then retry after the SP has an Azure DevOps profile.

### 6. GitHub repository configuration

**Repository variables** (Settings → Secrets and variables → Actions → Variables):

| Name | Example |
|---|---|
| `AZURE_CLIENT_ID` | `00000000-0000-0000-0000-000000000000` |
| `AZURE_TENANT_ID` | `00000000-0000-0000-0000-000000000000` |

These are not secrets. Do **not** put them in `VSCE_PAT`.

Optional: keep `OVSX_PAT` as a **secret** if you also publish to Open VSX (Cursor/VSCodium). Azure OIDC does not cover Open VSX.

### 7. Verify locally (optional)

After `az login` as a user who owns the publisher, or after exporting OIDC env from a test workflow:

```powershell
cd projects/vscode
$env:TRUMBO_VSCE_AUTH = "azure-credential"
bun run publish:marketplace
```

In CI, `azure/login@v2` runs before publish and sets the credential chain `vsce` expects.

### 8. Publish from CI

Push tag `vX.Y.Z` (must match `projects/vscode/package.json` version) or run workflow **ext-vscode-publish-stable** manually.

The workflow uses OIDC when `AZURE_CLIENT_ID` + `AZURE_TENANT_ID` are set; otherwise it falls back to `VSCE_PAT`.

---

## B. VSCE_PAT first publish (recommended unblock)

Use this path to get **`trumbo.trumbo` live on Marketplace** before finishing Entra/OIDC membership. Matches the [official publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

### B1. Create the PAT

1. Sign in at [dev.azure.com](https://dev.azure.com) with the **same Microsoft account** that owns publisher **`trumbo`** ([manage publishers](https://marketplace.visualstudio.com/manage/publishers/trumbo)).
2. Top-right profile menu → **Personal access tokens**.
3. **+ New Token**:
   | Field | Value |
   |---|---|
   | Name | `Trumbo VS Code publish` |
   | Organization | Your Azure DevOps org (one org is fine; avoid relying on global PAT long term) |
   | Expiration | 90 days (or custom) |
   | Scopes | **Show all scopes** → scroll to **Marketplace** → check **Manage** only |
4. **Create** → copy the token immediately (shown once).

Common PAT mistakes from Microsoft docs: wrong scope (must be **Marketplace → Manage**), or a different Microsoft account than the publisher owner.

### B2. Verify publisher access (optional but catches account mismatches)

From `projects/vscode`:

```powershell
cd D:\Torch\cline-full\projects\vscode
$env:VSCE_PAT = "paste-your-pat-here"
bunx vsce login trumbo
```

Expected: `The Personal Access Token verification succeeded for the publisher 'trumbo'.`

### B3. Publish locally

Force PAT mode so local Azure OIDC vars do not override:

```powershell
cd D:\Torch\cline-full\projects\vscode
$env:VSCE_PAT = "paste-your-pat-here"
$env:TRUMBO_VSCE_AUTH = "pat"
bun run publish:marketplace
```

This runs `vsce publish` with the marketplace README swap, packages `trumbo-0.1.0.vsix`, and uploads to Marketplace.

**Alternative (manual upload):** package only, then upload in the portal:

```powershell
bun run package:vsix
```

Open [publisher extensions](https://marketplace.visualstudio.com/manage/publishers/trumbo) → **New extension** → upload `trumbo-0.1.0.vsix`.

### B4. Confirm the listing

- Extension URL: https://marketplace.visualstudio.com/items?itemName=trumbo.trumbo
- Install test: `code --install-extension trumbo.trumbo`

### B5. After first publish: switch CI to OIDC

1. Finish section **A** (Entra app, GitHub federated credential, Azure DevOps SP + Profiles API member ID).
2. Set GitHub **Variables** `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`.
3. Add GitHub **Secret** `VSCE_PAT` only as emergency fallback until OIDC publish succeeds.
4. Tag releases: `git tag v0.1.0 && git push origin v0.1.0` (version must match `package.json`).

Global PATs retire **2026-12-01**; move CI to OIDC before then.

---

## Troubleshooting

| Error | Fix |
|---|---|
| **`Given email address '...' is invalid`** (Azure DevOps Add users) | Org not connected to Entra, or you typed the app **name** instead of pasting the **Enterprise applications Object ID** GUID and waiting for SP resolution. Connect directory under **Organization settings → Microsoft Entra**, then retry step 3b. |
| **`TF14045: The identity could not be found`** (Marketplace Members) | You pasted an Entra Object ID or client ID. Add the SP to an Azure DevOps org, call the Profiles API as the SP, paste the returned **`id`** into Members (see section A steps 3–5). |
| `VSCE_PAT is not set` and no Azure vars | Set `AZURE_CLIENT_ID` + `AZURE_TENANT_ID` vars or `VSCE_PAT` secret |
| `You need to be logged in with your corporate credentials` | Wrong identity in credential chain; ensure `azure/login` ran and SP is **Contributor** on publisher `trumbo` |
| `The requested operation is not allowed` | SP/MI not added to publisher members, or wrong member ID (use Profiles API `id`, not Entra Object ID) |
| **`Your extension has suspicious content`** | Automated Marketplace spam/security scan (often a false positive for new AI/agent publishers). Remove short URLs (`discord.gg`, `bit.ly`, `tinyurl.com`), obfuscated README text, and dev-only files from the VSIX. Rebuild with `bun run package:vsix` and retry. If it persists, email [vsmarketplace@microsoft.com](mailto:vsmarketplace@microsoft.com) or use [Marketplace publisher support](https://aka.ms/marketplacepublishersupport) with extension ID `trumbo.trumbo`, repo URL, and this error text. |

Debug identity in CI (add temporarily):

```bash
az rest -u https://app.vssps.visualstudio.com/_apis/profile/profiles/me \
  --resource 499b84ac-1321-427f-aa17-267ca6975798
```

---

## Related files

- `.github/workflows/ext-vscode-publish-stable.yml` — release workflow
- `scripts/publish-marketplace.mjs` — `vsce publish` wrapper (PAT or `--azure-credential`)
- `scripts/marketplace-readme.mjs` — swaps `README.marketplace.md` before publish
