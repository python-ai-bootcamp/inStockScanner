# This script installs a scheduled task to run the website availability checker.

# Get the directory of the current script
$ScriptPath = $PSScriptRoot

# Define the name of the scheduled task
$TaskName = "WebsiteAvailabilityChecker"

# Path to the XML template
$XmlTemplatePath = Join-Path $ScriptPath "scheduledTaskWindows.xml"

# Read the XML template file
# The file is UTF-16, so specify the encoding
$XmlContent = Get-Content -Path $XmlTemplatePath -Encoding Unicode -Raw

# Replace placeholders in the XML content
$Author = "$($env:USERDOMAIN)\$($env:USERNAME)"
$WorkingDirectory = $ScriptPath
$XmlContent = $XmlContent -replace '<Author>.*?</Author>', "<Author>$Author</Author>"
$XmlContent = $XmlContent -replace '<URI>.*?</URI>', "<URI>\$TaskName</URI>"
$XmlContent = $XmlContent -replace '<WorkingDirectory>.*?</WorkingDirectory>', "<WorkingDirectory>$WorkingDirectory</WorkingDirectory>"

# Register the scheduled task
try {
    # The -Force parameter ensures that if the task already exists, it will be updated.
    Register-ScheduledTask -TaskName $TaskName -Xml $XmlContent -Force -ErrorAction Stop
    Write-Host "Scheduled task '$TaskName' has been created/updated successfully."
}
catch {
    Write-Error "Failed to create/update scheduled task. Error: $_"
    # Exit with a non-zero status code to indicate failure
    exit 1
}
