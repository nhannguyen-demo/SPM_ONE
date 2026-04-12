# SPM ONE — Industrial Asset Management Prototype

A Next.js 16 + React 19 prototype for industrial asset performance management.

---

## Prerequisites

You need the following installed on your Mac before starting.

### 1. Node.js (v20 or later)

Check if you already have it:
```bash
node -v
```

If not installed, download from https://nodejs.org (choose the **LTS** version), or use a version manager:
```bash
# Using Homebrew (recommended)
brew install node

# Or using nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
nvm use --lts
```

### 2. pnpm (package manager used by this project)

Check if you already have it:
```bash
pnpm -v
```

If not installed:
```bash
npm install -g pnpm
```

---

## Getting Started

### Step 1 — Download and unzip

Download the ZIP from v0, then unzip it. You will get a folder. Open Terminal and navigate into it:
```bash
cd path/to/spm-one
```

### Step 2 — Delete the v0 internal env file

The ZIP may include a file named `.env.development.local` that contains v0-specific credentials. Delete it — it is not needed locally and should not be kept:
```bash
rm .env.development.local
```

### Step 3 — Install dependencies

```bash
pnpm install
```

This downloads all packages listed in `package.json` into a local `node_modules` folder. It may take 1–2 minutes on the first run.

### Step 4 — Start the development server

```bash
pnpm dev
```

Open your browser and go to: **http://localhost:3000**

The server supports Hot Module Replacement — any file you save will instantly update in the browser without a full reload.

---

## Adding Your Custom Images

Two image slots are ready and waiting. Place your files at exactly these paths inside the project folder:

| Image | Path | Used on |
|---|---|---|
| Site aerial map | `public/images/site-map.jpg` | Site X Overview Dashboard (map background) |
| P&ID process diagram | `public/images/pid-diagram.jpg` | Plant Overview (right panel diagram) |

The app will automatically pick them up — no code changes needed. Supported formats: `.jpg`, `.png`, `.webp`.

---

## Project Structure

```
spm-one/
├── app/
│   ├── globals.css        # Design tokens and Tailwind v4 theme
│   ├── layout.tsx         # Root layout (fonts, metadata)
│   └── page.tsx           # App shell (sidebar + main area routing)
├── components/
│   ├── sidebar.tsx        # Left navigation panel
│   ├── header.tsx         # Top search bar and icons
│   ├── module-library.tsx # Widget library slide-in panel (Edit mode)
│   ├── equipment-3d.tsx   # 3D Digital Twin viewer placeholder
│   ├── mini-charts.tsx    # Small sparkline/pie/bar chart components
│   ├── dashboard-card.tsx # Reusable dashboard thumbnail card
│   ├── modals/
│   │   └── what-if-scenario.tsx  # What-If config + results modals
│   ├── views/
│   │   ├── site-overview.tsx     # Screen 1 — Site level
│   │   ├── plant-overview.tsx    # Screen 2 — Plant level
│   │   ├── equipment-dashboard.tsx # Screens 3–6 — Equipment level
│   │   └── data-sync.tsx         # Screen 9 — Data & Sync
│   └── ui/                # shadcn/ui base components
├── lib/
│   ├── store.ts           # Zustand global state (navigation, view mode, modals)
│   └── data.ts            # All mock/static data
└── public/
    └── images/            # Put your custom images here
```

---

## Key Technologies

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.0 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5.7.3 | Type safety |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | latest | Component library |
| Recharts | 2.15.0 | Charts and data visualization |
| Zustand | 5.0.12 | Client-side state management |
| Lucide React | latest | Icons |

---

## Notes

- **No database, no backend, no API keys required.** All data is static mock data in `lib/data.ts`.
- **No `.env` file needed.** Delete `.env.development.local` from the ZIP (it is a v0-internal file, not needed locally).
- The `node_modules` folder is not included in the ZIP — `pnpm install` creates it fresh.
- The `.next` build cache folder is also not included — it is created automatically on first `pnpm dev` run.
- If port 3000 is already in use on your machine, Next.js will automatically try 3001, 3002, etc. and print the actual URL in the terminal.
