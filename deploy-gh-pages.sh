#!/usr/bin/env bash
set -euo pipefail

REPO="https://getmorefromlife:${GH_TOKEN}@github.com/getmorefromlife/project-success-pro.git"

echo "Building..."
bun run build

echo "Deploying dist/ to gh-pages branch..."
cd dist
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy $(date +%Y-%m-%d_%H:%M)"
git remote add origin "$REPO"
git push -f origin gh-pages

echo "Done! Deployed to https://getmorefromlife.github.io/project-success-pro/"
