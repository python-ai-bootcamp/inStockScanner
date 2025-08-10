@echo off
setlocal

REM This script installs a scheduled task to run the website availability checker.

SET "TASK_NAME=WebsiteAvailabilityChecker"
SET "WORKING_DIR=%~dp0"
SET "XML_TEMPLATE=%~dp0scheduledTaskWindows.xml"
SET "TEMP_XML=%TEMP%\temp_task.xml"
SET "TEMP_PS1=%TEMP%\temp_script.ps1"

echo Creating temporary PowerShell script to handle file modifications...

REM Create a temporary PowerShell script to perform the replacement
(
    echo $content = Get-Content -Path '%XML_TEMPLATE%' -Encoding Unicode -Raw
    echo $newContent = $content.Replace('TEMP_DOMAIN\temp.user', "$env:USERDOMAIN\$env:USERNAME")
    echo $newContent = $newContent.Replace('\Temp Name', '\%TASK_NAME%')
    echo $newContent = $newContent.Replace('c:\code\orly_agent\', '%WORKING_DIR%')
    echo $newContent ^| Set-Content -Path '%TEMP_XML%' -Encoding Unicode
) > "%TEMP_PS1%"

echo Executing PowerShell script...
REM Execute the PowerShell script
powershell -ExecutionPolicy Bypass -File "%TEMP_PS1%"

echo Creating scheduled task...
REM Create or update the scheduled task
schtasks /Create /XML "%TEMP_XML%" /TN "%TASK_NAME%" /F

echo Cleaning up temporary files...
REM Clean up temporary files
del "%TEMP_PS1%"
del "%TEMP_XML%"

echo.
echo Task '%TASK_NAME%' created successfully.
echo It will run 'node main.mjs' in '%WORKING_DIR%'.

endlocal
