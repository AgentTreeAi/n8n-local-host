# n8n Git Sync — pulls remote changes then pushes local commits (runs hourly)
$repoPath = "c:\Users\admin\Desktop\n8n local host"
$logFile  = "c:\Users\admin\Desktop\n8n local host\git-sync.log"

Set-Location $repoPath

function Log($msg) {
    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
}

Log "--- sync start ---"

$pull = git pull 2>&1
Log "pull: $pull"

$status = git status --porcelain 2>&1
if ($status) {
    git add -A 2>&1 | Out-Null
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commit = git commit -m "auto-sync: $timestamp" 2>&1
    Log "commit: $commit"
} else {
    Log "commit: nothing to commit"
}

$push = git push 2>&1
Log "push: $push"

Log "--- sync end ---"
