#!/bin/bash

# Exit script if any command fails
set -e

echo "Starting development environment..."

# Remove node_modules/emoji-picker symlink if it exists
rm -rf playground/node_modules/emoji-picker

# Start the playground
echo "Starting playground with direct source access..."
cd playground && npm run dev 