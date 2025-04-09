#!/bin/bash

# Get the current directory
CURR_DIR=$(pwd)

# Find user's shell configuration file
SHELL_TYPE=$(echo $SHELL | awk -F/ '{print $NF}')
echo "Detected shell: $SHELL_TYPE"

if [ "$SHELL_TYPE" = "zsh" ]; then
    CONFIG_FILE="$HOME/.zshrc"
elif [ "$SHELL_TYPE" = "bash" ]; then
    CONFIG_FILE="$HOME/.bashrc"
else
    echo "Unsupported shell: $SHELL_TYPE"
    exit 1
fi

echo "Using config file: $CONFIG_FILE"

# Check if alias already exists
if grep -q "alias start-gtm=" "$CONFIG_FILE"; then
    echo "Alias 'start-gtm' already exists in $CONFIG_FILE"
else
    # Add the alias to the shell configuration file
    echo "\n# GTM App shortcut\nalias start-gtm='cd $CURR_DIR && ./start.sh'" >> "$CONFIG_FILE"
    echo "Added 'start-gtm' alias to $CONFIG_FILE"
    echo "\nTo use the alias right away, run: source $CONFIG_FILE"
fi

echo "\nSetup complete! You can now use 'start-gtm' to start the GTM app."