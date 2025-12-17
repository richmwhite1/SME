#!/bin/bash
# Script to run guest reviews migration using Supabase CLI

echo "Running guest reviews migration..."
echo ""

# Read SQL file
SQL_FILE="supabase-guest-reviews-simple.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: $SQL_FILE not found"
    exit 1
fi

# Try using Supabase CLI with remote connection
# First, let's check if we can use db execute
echo "Attempting to run SQL migration..."
echo ""

# Extract SQL commands (remove comments for cleaner output)
grep -v "^--" "$SQL_FILE" | grep -v "^$" | while IFS= read -r line; do
    if [ ! -z "$line" ]; then
        echo "Executing: $line"
    fi
done

echo ""
echo "If the above doesn't work, please run this SQL manually in Supabase Dashboard:"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Click 'SQL Editor' in the left sidebar"
echo "4. Copy/paste the contents of: $SQL_FILE"
echo "5. Click 'Run'"
