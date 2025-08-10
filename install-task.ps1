# This script installs a scheduled task to run the website availability checker.

try {
    # Find the path to node.exe
    $NodePath = (Get-Command node).Source
    if (-not $NodePath) {
        throw "Node.js executable not found in PATH. Please ensure Node.js is installed and accessible."
    }
    Write-Host "Found Node.js at: $NodePath"
}
catch {
    Write-Error "Node.js executable not found in PATH. Please ensure Node.js is installed and accessible."
    exit 1
}

# Get the directory of the current script
$ScriptPath = $PSScriptRoot

# Define the name of the scheduled task
$TaskName = "WebsiteAvailabilityChecker"

# Path to the XML template
$XmlTemplatePath = Join-Path $ScriptPath "scheduledTaskWindows.xml"

# Read the XML template file
$XmlContent = Get-Content -Path $XmlTemplatePath -Encoding Unicode -Raw

# Replace placeholders in the XML content using regex for robustness
$Author = "$($env:USERDOMAIN)\$($env:USERNAME)"
$XmlContent = $XmlContent -replace '<Command>.*?</Command>', "<Command>`"$NodePath`"</Command>"
$XmlContent = $XmlContent -replace '<WorkingDirectory>.*?</WorkingDirectory>', "<WorkingDirectory>$ScriptPath</WorkingDirectory>"
$XmlContent = $XmlContent -replace '<Author>.*?</Author>', "<Author>$Author</Author>"
$XmlContent = $XmlContent -replace '<URI>.*?</URI>', "<URI>\$TaskName</URI>"

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
