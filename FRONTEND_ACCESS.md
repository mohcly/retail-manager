# Frontend Submodule Access Investigation

## Summary

**GitHub Copilot cannot access the `frontend` submodule.**

The `frontend` directory is a private git submodule pointing to
`https://github.com/mohcly/retailscope-pro.git`. Because that repository is
private and separate from this one, GitHub Copilot's sandbox only has
credentials for `mohcly/retail-manager` — it has no way to clone or read
`retailscope-pro`.

## What was found

| Item | Detail |
|------|--------|
| Submodule path | `frontend/` |
| Submodule URL | `https://github.com/mohcly/retailscope-pro.git` |
| Visibility | **Private** |
| Accessible by Copilot? | ❌ No |
| Branches affected | `frontend-test-1`, `fix-windows-connectivity-final`, `copilot/add-offline-first-architecture` |

The `.gitmodules` entry on those branches reads:

```ini
[submodule "frontend"]
    path = frontend
    url = https://github.com/mohcly/retailscope-pro.git
```

Because the submodule is empty when cloned without credentials (and Copilot
has none for `retailscope-pro`), any automated task that needs to read, lint,
build, or modify frontend code will fail silently or produce errors.

## How to fix it

Choose **one** of the options below.

### Option A — Make `retailscope-pro` public (simplest)

If the frontend code is not sensitive, make the repository public on GitHub.
Copilot, CI runners, and collaborators will then be able to clone it
automatically.

> Settings → General → Danger Zone → Change repository visibility → Public

### Option B — Inline the frontend code (recommended for Copilot)

Remove the submodule and copy the frontend source directly into this
repository. This gives Copilot full access without any extra credentials.

```bash
# 1. Remove the submodule entry
git submodule deinit -f frontend
git rm -f frontend
rm -rf .git/modules/frontend
# Remove the [submodule "frontend"] block from .gitmodules, then:
git rm .gitmodules   # if no other submodules remain

# 2. Copy the frontend files in
cp -r /path/to/your/local/retailscope-pro/. frontend/
git add frontend/
git commit -m "inline frontend code (was private submodule)"
```

After this, Copilot can read and modify frontend files just like any other
file in the repository.

### Option C — Add a deploy key (for keeping the submodule)

If you want to keep the separate repository but still allow CI / Copilot to
read it:

1. Generate an SSH key pair.
2. Add the **public** key as a deploy key on `mohcly/retailscope-pro`
   (Settings → Deploy keys → Add deploy key, read-only is fine).
3. Add the **private** key as a repository secret on `mohcly/retail-manager`
   (Settings → Secrets → Actions → New repository secret, name it
   `FRONTEND_DEPLOY_KEY`).
4. In your CI workflow, use `actions/checkout` with `submodules: true` and
   provide the key:

   ```yaml
   - uses: actions/checkout@v4
     with:
       submodules: true
       ssh-key: ${{ secrets.FRONTEND_DEPLOY_KEY }}
   ```

   Note: this approach does **not** give GitHub Copilot (the coding agent)
   access — it only helps CI runners.

## Recommendation

**Option B (inline)** is the most practical for day-to-day Copilot usage.
Once the code is inlined you can delete `retailscope-pro` or keep it as an
archive.
