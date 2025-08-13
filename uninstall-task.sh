#!/bin/bash

# This script removes the cron job for the website availability checker.

# The unique part of the command to identify the cron job
CRON_COMMAND_IDENTIFIER="main.mjs"

# Check if the cron job exists
(crontab -l 2>/dev/null | grep -Fq -- "${CRON_COMMAND_IDENTIFIER}")
if [ $? -eq 0 ]; then
    # Remove the cron job
    # This command lists the cron jobs, filters out the one we want to remove,
    # and then installs the new, filtered list.
    (crontab -l 2>/dev/null | grep -Fv -- "${CRON_COMMAND_IDENTIFIER}") | crontab -
    echo "Cron job for '${CRON_COMMAND_IDENTIFIER}' removed successfully."
else
    echo "Cron job for '${CRON_COMMAND_IDENTIFIER}' not found. No changes made."
fi

echo ""
echo "To see the current list of cron jobs, run: crontab -l"
