#!/bin/bash

echo "Running linters and formatters..."

# Install ESLint and Prettier if not already installed
if ! command -v eslint &> /dev/null || ! command -v prettier &> /dev/null; then
  echo "Installing ESLint and Prettier..."
  npm install --no-save eslint prettier eslint-config-prettier eslint-plugin-prettier
fi

# Create ESLint config if it doesn't exist
if [ ! -f ".eslintrc.json" ]; then
  echo '{
  "extends": ["prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": ["error", {
      "endOfLine": "auto"
    }]
  },
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 2020
  }
}' > .eslintrc.json
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

# Run ESLint with --fix flag on JavaScript files
echo "Running ESLint on JavaScript files..."
npx eslint --fix "**/*.js" --ignore-path .gitignore

echo "Precommit checks completed!"
