# This script uninstalls the scheduled task for the website availability checker.

# Check for Administrator privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run with Administrator privileges. Please re-run it from an elevated PowerShell prompt."
    exit 1
}

# Define the name of the scheduled task
$TaskName = "WebsiteAvailabilityChecker"

# Check if the task exists before trying to remove it
try {
    $Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($Task) {
        # Unregister the scheduled task
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "Scheduled task '$TaskName' has been removed successfully."
    } else {
        Write-Host "Scheduled task '$TaskName' does not exist. No action taken."
    }
}
catch {
    Write-Error "An error occurred while trying to remove the scheduled task. Error: $_"
    # Exit with a non-zero status code to indicate failure
    exit 1
}
