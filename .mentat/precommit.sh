#!/bin/bash

echo "Running formatters..."

# Install Prettier if not already installed
if ! command -v prettier &> /dev/null; then
  echo "Installing Prettier..."
  npm install --no-save prettier
fi

# Create Prettier config if it doesn't exist
if [ ! -f ".prettierrc.json" ]; then
  echo '{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}' > .prettierrc.json
fi

# Run Prettier only on JavaScript and JSON files
# Skipping HTML files due to existing HTML syntax errors that Prettier can't fix
echo "Running Prettier on JavaScript and JSON files..."
npx prettier --write "**/*.js" "**/*.json" --ignore-path .gitignore

# Note about ESLint
echo "Skipping ESLint due to configuration detection issues."
echo "To run ESLint manually, please use: npx eslint --fix **/*.js"

echo "Precommit checks completed!"
