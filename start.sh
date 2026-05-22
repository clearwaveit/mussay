#!/bin/sh
echo "Running database migrations..."
./node_modules/.bin/prisma db push --schema ./prisma/schema.prisma
echo "Starting application..."
node server.js
