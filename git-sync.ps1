# n8n Git Sync — periodic snapshot of work-in-progress so nothing is lost.
#
# Behavior:
#   1. git pull (fast-forward only; abort on conflict)
#   2. If anything is dirty:
#        a. Skip if any tracked file was edited within IDLE_THRESHOLD_MIN (active session)
#        b. Stage only known project directories (NOT `git add -A` — avoids accidental secrets)
#        c. Generate a Conventional-Commits message from the staged diff
#        d. Commit
#   3. git push (always, in case prior runs were unpushed)
#
# Filter auto-snapshots from history:    git log --invert-grep --grep '^chore\(snapshot\)'

$ErrorActionPreference = 'Continue'

$repoPath           = 'c:\Users\admin\Desktop\n8n local host'
$logFile            = Join-Path $repoPath 'git-sync.log'
$IDLE_THRESHOLD_MIN = 20

# Only stage paths under these top-level dirs. Anything outside is intentionally ignored
# so a stray .env / secret / Downloads file dropped in repo root won't get auto-committed.
$AUTO_STAGE_DIRS = @(
    'workflows',
    'workflow-ideas',
    'n8n-frontend-prototype/src',
    'n8n-frontend-prototype/public',
    '.agents',
    'scripts',
    'frontend/src'
)

# Top-level files that are safe to auto-stage when modified.
$AUTO_STAGE_FILES = @(
    'CLAUDE.md',
    'README.md',
    'git-sync.ps1',
    'watchdog.ps1',
    'backup.ps1',
    'register-tasks.ps1',
    'docker-compose.yml',
    '.mcp.json',
    'n8n-frontend-prototype/package.json',
    'n8n-frontend-prototype/vite.config.ts',
    'n8n-frontend-prototype/tsconfig.json',
    'n8n-frontend-prototype/tailwind.config.js'
)

Set-Location $repoPath

function Log($msg) {
    Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
}

function Get-StagedScope {
    # Returns a short scope summary from the staged diff, e.g.
    #   "workflows (3), n8n-frontend-prototype/src (1)"
    # Or single-file:
    #   "workflows/morning-briefing.json"
    $files = git diff --cached --name-only 2>$null
    if (-not $files) { return $null }

    $fileList = $files -split "`n" | Where-Object { $_ -ne '' }
    if ($fileList.Count -eq 1) { return $fileList[0] }

    # Group by top-level dir (use leading 2 segments when under n8n-frontend-prototype/)
    $groups = @{}
    foreach ($f in $fileList) {
        $parts = $f -split '/'
        $scope = if ($parts.Count -eq 1) {
            '(root)'
        } elseif ($parts[0] -eq 'n8n-frontend-prototype' -and $parts.Count -gt 1) {
            "$($parts[0])/$($parts[1])"
        } else {
            $parts[0]
        }
        if (-not $groups.ContainsKey($scope)) { $groups[$scope] = 0 }
        $groups[$scope]++
    }

    $parts = @()
    foreach ($k in $groups.Keys | Sort-Object) {
        $parts += "$k ($($groups[$k]))"
    }
    return ($parts -join ', ')
}

function Test-RecentlyActive {
    # Returns $true if any tracked file under the auto-stage dirs was modified in the
    # last $IDLE_THRESHOLD_MIN minutes (active session — skip auto-commit).
    $cutoff = (Get-Date).AddMinutes(-$IDLE_THRESHOLD_MIN)
    foreach ($dir in $AUTO_STAGE_DIRS) {
        $full = Join-Path $repoPath $dir
        if (-not (Test-Path $full)) { continue }
        $recent = Get-ChildItem -Path $full -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -gt $cutoff -and $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' } |
            Select-Object -First 1
        if ($recent) { return $true }
    }
    return $false
}

Log '--- sync start ---'

# 1. Pull (fast-forward only — never silently merge or rebase)
$pull = git pull --ff-only 2>&1 | Out-String
Log "pull: $($pull.Trim())"

# 2. Check for dirty tree
$status = git status --porcelain 2>&1
if ($status) {
    if (Test-RecentlyActive) {
        Log 'commit: SKIP — active session (file modified within last 20 min)'
    } else {
        # Stage only known project paths
        foreach ($dir in $AUTO_STAGE_DIRS) {
            if (Test-Path (Join-Path $repoPath $dir)) {
                git add -- $dir 2>$null | Out-Null
            }
        }
        foreach ($file in $AUTO_STAGE_FILES) {
            if (Test-Path (Join-Path $repoPath $file)) {
                git add -- $file 2>$null | Out-Null
            }
        }

        $cachedDiff = git diff --cached --name-only 2>$null
        if (-not $cachedDiff) {
            Log 'commit: nothing staged (changes outside auto-stage allowlist)'
        } else {
            $scope = Get-StagedScope
            $msg   = "chore(snapshot): $scope"
            $commit = git commit -m $msg 2>&1 | Out-String
            Log "commit: $($commit.Trim().Split("`n")[0])"
        }
    }
} else {
    Log 'commit: clean tree'
}

# 3. Push whatever's local-only
$push = git push 2>&1 | Out-String
Log "push: $($push.Trim())"

Log '--- sync end ---'
