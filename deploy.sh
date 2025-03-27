#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if the src directory exists
if [ ! -d "src" ]; then
  echo "Error: src directory not found!"
  exit 1
fi

echo "src directory found. Proceeding with deployment..."

# List contents of src directory for debugging purposes
echo "Listing contents of src directory:"
ls -al src

# Setup Git for deployment
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"

# Create or checkout to the gh-pages branch
git checkout --orphan gh-pages

# Remove all files from the current working tree
git reset --hard

# Copy contents from src to the root of the repository
echo "Copying contents from src to root..."
cp -r src/* .

# List root contents to ensure everything is copied over
echo "Listing contents of root directory:"
ls -al

# Commit the changes
git add .
git commit -m "Deploy to GitHub Pages"

# Push the changes to the gh-pages branch
git push --force origin gh-pages

echo "Deployment completed successfully!"
