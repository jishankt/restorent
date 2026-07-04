#!/bin/bash
echo "Checking for Node.js installation..."

if ! command -v npm &> /dev/null
then
    echo "❌ Error: npm could not be found."
    echo "To run this web application, you must install Node.js."
    echo "👉 Please verify your path or install from: https://nodejs.org/"
    exit 1
fi

echo "✅ npm found. Installing dependencies..."
npm install

echo "🚀 Starting development server..."
npm run dev
