#!/bin/bash

# This script installs a cron job to run the website availability checker.

# Get the absolute path of the directory containing this script
# This ensures that the script can be run from anywhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# The command to be executed by the cron job
# It changes to the script's directory, runs the node script,
# and logs the output to a file.
CRON_COMMAND="cd \"${SCRIPT_DIR}\" && /usr/bin/env node ./main.mjs >> \"${SCRIPT_DIR}/cron.log\" 2>&1"

# The cron schedule (runs at the beginning of every hour)
CRON_SCHEDULE="0 * * * *"

# The full cron job entry
CRON_JOB="${CRON_SCHEDULE} ${CRON_COMMAND}"

# Check if the cron job already exists to avoid duplicates
(crontab -l 2>/dev/null | grep -Fq -- "${CRON_COMMAND}")
if [ $? -eq 0 ]; then
    echo "Cron job already exists. No changes made."
else
    # Add the new cron job to the user's crontab
    # The `crontab -l` command lists existing jobs, and we append the new one.
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    echo "Cron job added successfully."
    echo "It will run at the beginning of every hour."
fi

echo ""
echo "To see the current list of cron jobs, run: crontab -l"
echo "The output of the cron job will be logged to: ${SCRIPT_DIR}/cron.log"
