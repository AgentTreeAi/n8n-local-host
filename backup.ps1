# n8n Daily Backup — zips n8n-data and retains last 7 copies
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "c:\Users\admin\Desktop\n8n local host\backups"
$source = "c:\Users\admin\Desktop\n8n local host\n8n-data"
$logFile = "c:\Users\admin\Desktop\n8n local host\backup.log"

# Ensure backup directory exists
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Create timestamped zip
$dest = "$backupDir\n8n-backup-$timestamp.zip"
Compress-Archive -Path $source -DestinationPath $dest -Force

# Prune old backups (keep last 7)
Get-ChildItem "$backupDir\n8n-backup-*.zip" |
    Sort-Object CreationTime -Descending |
    Select-Object -Skip 7 |
    Remove-Item -Force

Add-Content -Path $logFile -Value "[$(Get-Date)] Backup completed: $dest"
Write-Output "Backup completed: $dest"
