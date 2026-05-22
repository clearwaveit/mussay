#!/bin/sh
echo "Running database migrations..."
prisma db push --schema ./prisma/schema.prisma --skip-generate
echo "Starting application..."
node server.js
