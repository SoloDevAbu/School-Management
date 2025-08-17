#!/bin/sh

# Exit on any error
set -e

echo "Generating prisma client"
npx prisma generate

echo "Starting development server"
exec yarn dev