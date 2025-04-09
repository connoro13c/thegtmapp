#!/bin/bash

# Create a temporary file
temp_file=$(mktemp)

# Filter out the problematic lines and fix the properly formatted ones
cat ~/.zshrc | grep -v "\\n#" | grep -v "alias 'start gtm'" > "$temp_file"

# Add the correct alias
echo "\n# GTM App shortcut" >> "$temp_file"
echo "alias start-gtm='cd $(pwd) && ./start.sh'" >> "$temp_file"

# Backup original zshrc
cp ~/.zshrc ~/.zshrc.backup

# Replace with fixed version
cp "$temp_file" ~/.zshrc

echo "Fixed .zshrc file. Original backed up as ~/.zshrc.backup"
echo "Now run: source ~/.zshrc"
echo "Then you can use the command: start-gtm"