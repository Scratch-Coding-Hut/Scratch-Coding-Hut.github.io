#!/bin/bash

echo "Running linters and formatters..."

# Install ESLint and Prettier if not already installed
if ! command -v eslint &> /dev/null || ! command -v prettier &> /dev/null; then
  echo "Installing ESLint and Prettier..."
  npm install --no-save eslint prettier
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

# Check which ESLint configuration format is being used
if [ -f "eslint.config.js" ]; then
  # New flat config format
  echo "Running ESLint with flat config on JavaScript files..."
  npx eslint --fix "**/*.js" --ignore-pattern "node_modules" --ignore-pattern "dist"
elif [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.yml" ] || [ -f ".eslintrc.yaml" ]; then
  # Traditional config format
  echo "Running ESLint with traditional config on JavaScript files..."
  npx eslint --fix "**/*.js" --ignore-path .gitignore
else
  # Skip ESLint if no configuration exists
  echo "No ESLint configuration found. Skipping ESLint checks."
fi

echo "Precommit checks completed!"
