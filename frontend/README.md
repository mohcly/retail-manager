# Frontend (RetailScope Pro)

This directory contains the frontend code for the RetailScope Pro application.

## Setup

The frontend was previously stored as a **private git submodule** (`mohcly/retailscope-pro`).
It has been converted to an inline directory so that CI tools and coding agents
(e.g., GitHub Copilot) can access the source code directly.

### First-time import

If this directory is empty, run:

```bash
# Option A: If you have a local clone of retailscope-pro
./scripts/import-frontend.sh /path/to/retailscope-pro

# Option B: Clone directly (requires Git credentials for the private repo)
./scripts/import-frontend.sh
```

Then install dependencies:

```bash
cd frontend
npm install
```

### Development

```bash
cd frontend
npm run dev
```

### Why was the submodule removed?

The private git submodule prevented automated tools (CI/CD, Copilot coding agent)
from accessing the frontend code because they only have credentials for the main
`retail-manager` repository. Embedding the code directly resolves this access issue.
