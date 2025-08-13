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

try {
    # Load the XML file into an XML object for robust manipulation
    [xml]$XmlContent = Get-Content -Path $XmlTemplatePath -Encoding Unicode

    # Define the XML namespace to correctly find elements
    $xmlns = "http://schemas.microsoft.com/windows/2004/02/mit/task"
    $nsmgr = New-Object System.Xml.XmlNamespaceManager($XmlContent.NameTable)
    $nsmgr.AddNamespace("task", $xmlns)

    # Modify the XML object's properties
    # Set the task to run as the SYSTEM account
    $XmlContent.SelectSingleNode("//task:Principals/task:Principal/task:UserId", $nsmgr).InnerText = "S-1-5-18"
    # Remove the LogonType node, as it's not needed for the SYSTEM account and causes errors.
    $LogonTypeNode = $XmlContent.SelectSingleNode("//task:Principals/task:Principal/task:LogonType", $nsmgr)
    if ($LogonTypeNode) {
        $LogonTypeNode.ParentNode.RemoveChild($LogonTypeNode)
    }

    # Set the command, arguments, and working directory
    $XmlContent.SelectSingleNode("//task:Actions/task:Exec/task:Command", $nsmgr).InnerText = $NodePath
    $XmlContent.SelectSingleNode("//task:Actions/task:Exec/task:Arguments", $nsmgr).InnerText = "main.mjs"
    $XmlContent.SelectSingleNode("//task:Actions/task:Exec/task:WorkingDirectory", $nsmgr).InnerText = $ScriptPath

    # Set the URI
    $XmlContent.SelectSingleNode("//task:RegistrationInfo/task:URI", $nsmgr).InnerText = "\$TaskName"

    # Register the scheduled task using the modified XML object's OuterXml
    Register-ScheduledTask -TaskName $TaskName -Xml $XmlContent.OuterXml -Force -ErrorAction Stop
    Write-Host "Scheduled task '$TaskName' has been created/updated successfully."
}
catch {
    Write-Error "An error occurred while processing the XML file or registering the task. Error: $_"
    # Exit with a non-zero status code to indicate failure
    exit 1
}
