#!/usr/bin/env bash
set -euo pipefail

REPO="https://getmorefromlife:${GH_TOKEN}@github.com/getmorefromlife/project-success-pro.git"

echo "Building..."
bun run build

echo "Preparing static output..."
rm -rf dist/static
mkdir -p dist/static

# Get the exact asset filenames from the build
CSS=$(ls dist/client/assets/styles-*.css | xargs basename)
ENTRY_JS=$(ls dist/client/assets/index.es-*.js | xargs basename)

# Generate static index.html with the correct asset references
cat > dist/static/index.html << HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Project Success Pro</title>
    <meta name="description" content="Free PM success scoring tool by Syed Imon Rizvi" />
    <meta property="og:title" content="Project Success Pro" />
    <meta property="og:description" content="Free PM success scoring tool by Syed Imon Rizvi" />
    <meta property="og:type" content="website" />
    <meta name="author" content="Syed Imon Rizvi" />
    <link rel="stylesheet" href="./${CSS}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${ENTRY_JS}"></script>
  </body>
</html>
HTML

# Copy all client assets to static output
cp dist/client/assets/* dist/static/

echo "Deploying to gh-pages branch..."
cd dist/static
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy $(date +%Y-%m-%d_%H:%M)"
git remote add origin "$REPO"
git push -f origin gh-pages

echo "Done! Deployed to https://getmorefromlife.github.io/project-success-pro/"
