#!/bin/bash

# Check if a filename was provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 path/to/file.tsx"
    exit 1
 fi

# Run TypeScript with JSX settings on the file
npx tsc --jsx react-jsx --noEmit "$1"

# After TypeScript check, also run ESLint
npx eslint --ext ts,tsx "$1"