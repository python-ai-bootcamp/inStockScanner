# This script installs a scheduled task to run the website availability checker.

# Check for Administrator privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run with Administrator privileges. Please re-run it from an elevated PowerShell prompt."
    exit 1
}

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
# Set the task to run as the SYSTEM account to avoid password issues and allow it to run unattended.
$XmlContent = $XmlContent -replace '(?s)<Principal>.*?</Principal>', '<Principal id="Author"><UserId>S-1-5-18</UserId><RunLevel>HighestAvailable</RunLevel></Principal>'
$XmlContent = $XmlContent -replace '<Command>.*?</Command>', "<Command>`"$NodePath`"</Command>"
$XmlContent = $XmlContent -replace '<Arguments>.*?</Arguments>', "<Arguments>main.mjs</Arguments>"
$XmlContent = $XmlContent -replace '<WorkingDirectory>.*?</WorkingDirectory>', "<WorkingDirectory>$ScriptPath</WorkingDirectory>"
$XmlContent = $XmlContent -replace '<URI>.*?</URI>', "<URI>\$TaskName</URI>"

# The <Author> tag is inside the <Principal> block which is now static, so replacing it separately is no longer needed.

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
