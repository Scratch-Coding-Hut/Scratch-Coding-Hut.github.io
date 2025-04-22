#!/bin/bash

echo "Installing dependencies for the main project..."
npm install

echo "Installing dependencies for the src project..."
cd src
npm install

echo "Installing dependencies for the npm server components..."
cd npm
# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  echo '{
  "name": "scratch-shop-server",
  "version": "1.0.0",
  "description": "Server components for Scratch Shop",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5"
  }
}' > package.json
fi
npm install

# Return to root directory
cd ../..

echo "Setup completed successfully!"
