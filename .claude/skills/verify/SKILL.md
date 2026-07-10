---
name: verify
description: Build, run, and visually verify the PM Schedule Dashboard on this Windows machine.
---

# Verifying PM Schedule Dashboard

## Build & run

```powershell
# node may not be on the tool shell's PATH — refresh it first
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
npm run build   # WARNING: ~10+ min on this machine (repo lives on OneDrive; sync slows I/O). Run in background.
npm start       # production server on http://localhost:3000 — run in background, poll the URL until 200
```

`npm run dev` also works but first-compile of each page is slow for the same OneDrive reason.

## Drive & capture

No Playwright installed. Use headless Edge for screenshots / DOM dumps:

```powershell
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
& $edge --headless=new --disable-gpu --window-size=1720,1000 --hide-scrollbars --virtual-time-budget=20000 --screenshot="$out.png" "http://localhost:3000/<page>"
# For off-screen AG Grid columns (column virtualisation), render very wide and dump DOM:
& $edge --headless=new --disable-gpu --window-size=7000,1000 --virtual-time-budget=20000 --dump-dom "http://localhost:3000/<page>" | Out-File dom.html -Encoding utf8
```

`--virtual-time-budget` is needed so client-side data fetching (TanStack Query → /api/* CSV proxies) completes before capture.

## Flows worth driving

- `/` dashboard: charts render, KPI tiles clickable (global filter)
- `/schedule` and `/problem`: AG Grid rows populated (row counts shown top-left), toolbar buttons
- `/api/schedule` and `/api/problem`: expect 200, `text/csv`

## Cleanup

Kill the server via its port: `Get-NetTCPConnection -LocalPort 3000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`
