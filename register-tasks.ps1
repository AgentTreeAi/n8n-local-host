# Register n8n Scheduled Tasks — run this script elevated
$ErrorActionPreference = "Stop"

# === Watchdog (every 5 minutes) ===
$wAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-NoProfile -ExecutionPolicy Bypass -File "c:\Users\admin\Desktop\n8n local host\watchdog.ps1"'
$wTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)
$wSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries
Unregister-ScheduledTask -TaskName "n8n-watchdog" -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName "n8n-watchdog" -Action $wAction -Trigger $wTrigger -Settings $wSettings -RunLevel Highest -Force
Write-Output "Registered: n8n-watchdog (every 5 min)"

# === Backup (daily at 3 AM) ===
$bAction = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-NoProfile -ExecutionPolicy Bypass -File "c:\Users\admin\Desktop\n8n local host\backup.ps1"'
$bTrigger = New-ScheduledTaskTrigger -Daily -At "3:00AM"
$bSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries
Unregister-ScheduledTask -TaskName "n8n-daily-backup" -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName "n8n-daily-backup" -Action $bAction -Trigger $bTrigger -Settings $bSettings -RunLevel Highest -Force
Write-Output "Registered: n8n-daily-backup (daily 3AM)"

# === Verify ===
Get-ScheduledTask | Where-Object { $_.TaskName -like "n8n-*" } | Format-Table TaskName, State, TaskPath
