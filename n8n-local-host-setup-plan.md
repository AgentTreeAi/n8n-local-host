# n8n 24/7 Local Host Server — Full Setup Plan

> **Target Machine:** Windows 11 Pro x64 · 13 GB RAM · Node v24 · Docker 29 · Git 2.53
> **Goal:** Run n8n permanently on this PC and expose it to the internet through a Cloudflare Tunnel so workflows can receive webhooks, be triggered remotely, and stay online 24/7.

---

## Table of Contents

1. [Prerequisites & Accounts](#1-prerequisites--accounts)
2. [Docker Desktop Configuration](#2-docker-desktop-configuration)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Docker Compose Stack (n8n + Cloudflare Tunnel)](#4-docker-compose-stack-n8n--cloudflare-tunnel)
5. [Cloudflare Setup (Domain + Tunnel)](#5-cloudflare-setup-domain--tunnel)
6. [Environment Variables & Secrets](#6-environment-variables--secrets)
7. [First Launch & Verification](#7-first-launch--verification)
8. [Making It 24/7 (Survive Reboots & Crashes)](#8-making-it-247-survive-reboots--crashes)
9. [Security Hardening](#9-security-hardening)
10. [Backups & Data Persistence](#10-backups--data-persistence)
11. [Monitoring & Maintenance](#11-monitoring--maintenance)
12. [Troubleshooting Cheat Sheet](#12-troubleshooting-cheat-sheet)

---

## 1. Prerequisites & Accounts

### Already Installed ✅
| Tool | Version Detected |
|------|-----------------|
| Node.js | v24.13.0 |
| npm | 11.6.2 |
| Docker | 29.2.0 |
| Git | 2.53.0 |

### Still Needed

| Item | Why | Action |
|------|-----|--------|
| **Cloudflare account** (free tier is fine) | Manages the tunnel + DNS | Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) |
| **A domain name** | Cloudflare Tunnel needs a domain in your CF account to route traffic | Buy one through Cloudflare Registrar (~$10/yr for a `.com`) or transfer an existing domain's nameservers to Cloudflare |
| **Docker Desktop running with WSL 2 backend** | Our stack runs in Docker containers | Verify Docker Desktop is set to **Start on login** and uses the **WSL 2** engine (Settings → General → "Use the WSL 2 based engine" ✅) |
| **Windows power settings** | PC must never sleep | Configured in Step 8 |

---

## 2. Docker Desktop Configuration

Before anything else, make sure Docker Desktop is healthy and configured for long-running services.

### Steps

1. **Open Docker Desktop** → Settings (⚙️ gear icon).
2. **General**
   - ✅ *Start Docker Desktop when you sign in to Windows*
   - ✅ *Use the WSL 2 based engine*
3. **Resources → WSL Integration**
   - Enable integration with your default WSL distro (usually `Ubuntu`).
4. **Resources → Advanced**
   - Set **Memory** to at least **4 GB** (n8n + tunnel are lightweight; 4 GB is plenty).
   - Set **CPUs** to at least **2**.
5. **Docker Engine (JSON config)** — add restart policies:
   ```json
   {
     "live-restore": true
   }
   ```
   > `live-restore` keeps containers running even if the Docker daemon restarts.
6. Click **Apply & Restart**.

### Verify Docker is working
```powershell
docker run --rm hello-world
```
You should see *"Hello from Docker!"*.

---

## 3. Project Directory Structure

We will organize everything inside `c:\Users\admin\Desktop\n8n local host\`:

```
n8n local host/
├── docker-compose.yml          # Main stack definition
├── .env                        # Secrets & configuration (git-ignored)
├── .env.example                # Template for .env (committed to git)
├── .gitignore                  # Ignore secrets & data volumes
├── n8n-local-host-setup-plan.md # This plan
├── n8n-data/                   # Bind-mount for n8n persistent data
│   └── .n8n/                   # Created automatically on first run
└── backups/                    # Scheduled backup exports land here
```

### Create the folders
```powershell
mkdir "c:\Users\admin\Desktop\n8n local host\n8n-data"
mkdir "c:\Users\admin\Desktop\n8n local host\backups"
```

---

## 4. Docker Compose Stack (n8n + Cloudflare Tunnel)

We will run **two containers** side by side:

| Container | Image | Purpose |
|-----------|-------|---------|
| `n8n` | `docker.n8n.io/n8nio/n8n:latest` | The n8n server itself |
| `cloudflared` | `cloudflare/cloudflared:latest` | Cloudflare Tunnel client |

### `docker-compose.yml`

```yaml
version: "3.8"

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"                       # Local access at http://localhost:5678
    environment:
      - N8N_HOST=${N8N_HOST}              # e.g. n8n.yourdomain.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https                # Cloudflare terminates TLS
      - WEBHOOK_URL=https://${N8N_HOST}/  # So webhook URLs are correct
      - N8N_SECURE_COOKIE=true            # Cookies over HTTPS only
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      - TZ=${GENERIC_TIMEZONE}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_USER_MANAGEMENT_DISABLED=false
      - N8N_BASIC_AUTH_ACTIVE=false       # We use n8n's built-in user system
    volumes:
      - ./n8n-data:/home/node/.n8n        # Persist workflows, credentials, DB
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: always
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    depends_on:
      - n8n
```

### Key design decisions
- **`restart: always`** — Both containers auto-restart on crash or reboot.
- **Bind-mount** (`./n8n-data`) instead of a Docker named volume so backups are trivial.
- **No database container** — n8n's built-in SQLite is sufficient for a single-user local host. If you later need Postgres, we can add it.
- **Cloudflared uses a Tunnel Token** (not a config file) — simplest approach, managed entirely from the Cloudflare dashboard.

---

## 5. Cloudflare Setup (Domain + Tunnel)

This is the most involved section. Follow every sub-step carefully.

### 5A. Add your domain to Cloudflare

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **"Add a site"** → enter your domain → select the **Free** plan.
3. Cloudflare will scan existing DNS records. Confirm them.
4. Update your domain registrar's nameservers to the two Cloudflare nameservers shown (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
5. Wait for nameserver propagation (can take minutes to 24 hours, usually ~15 min).
6. Once active, your domain's dashboard will show **"Active"** status.

### 5B. Create a Cloudflare Tunnel

1. In the Cloudflare dashboard, go to **Zero Trust** (left sidebar) → **Networks** → **Tunnels**.
2. Click **"Create a tunnel"** → choose **Cloudflared** connector type → click **Next**.
3. **Name your tunnel** — e.g. `n8n-home-server`.
4. On the **"Install and run a connector"** page:
   - Select the **Docker** tab.
   - You will see a command like:
     ```
     docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoi...
     ```
   - **Copy the token value** (the long `eyJ...` string). This is your `CLOUDFLARE_TUNNEL_TOKEN`.
   - **Do NOT run the command** — our Docker Compose handles this.
5. Click **Next**.

### 5C. Configure the Public Hostname

Still in the tunnel creation wizard:

1. **Subdomain:** `n8n` (or whatever you want)
2. **Domain:** select your domain from the dropdown
3. **Service Type:** `HTTP`
4. **URL:** `n8n:5678`
   > This works because both containers are on the same Docker Compose network, so `cloudflared` can reach the `n8n` container by its service name.
5. Click **Save tunnel**.

Your n8n instance will be reachable at `https://n8n.yourdomain.com` once everything is running.

### 5D. (Recommended) Cloudflare Access Policy

To add an extra authentication layer in front of n8n:

1. Go to **Zero Trust** → **Access** → **Applications**.
2. Click **"Add an application"** → **Self-hosted**.
3. **Application name:** `n8n`
4. **Session duration:** `24 hours`
5. **Application domain:** `n8n.yourdomain.com`
6. Add a **policy**:
   - **Policy name:** `Allowed Users`
   - **Action:** Allow
   - **Include rule:** Emails — add your email address(es)
7. Save.

> This gives you an email-based one-time-code login wall before anyone even reaches n8n. **Highly recommended.**

---

## 6. Environment Variables & Secrets

### `.env` file

Create `c:\Users\admin\Desktop\n8n local host\.env`:

```env
# === n8n Configuration ===
N8N_HOST=n8n.yourdomain.com
GENERIC_TIMEZONE=America/Los_Angeles
N8N_ENCRYPTION_KEY=<generate-a-random-32-char-string>

# === Cloudflare Tunnel ===
CLOUDFLARE_TUNNEL_TOKEN=<paste-your-tunnel-token-from-step-5B>
```

### How to generate the encryption key
Run this in PowerShell:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
```
Copy the output and paste it as `N8N_ENCRYPTION_KEY`.

> ⚠️ **IMPORTANT:** Once set, **never change** the encryption key. n8n uses it to encrypt stored credentials. Changing it makes all saved credentials unreadable.

### `.env.example` file

Create a committed template (no real secrets):
```env
N8N_HOST=n8n.yourdomain.com
GENERIC_TIMEZONE=America/Los_Angeles
N8N_ENCRYPTION_KEY=CHANGE_ME_GENERATE_A_RANDOM_KEY
CLOUDFLARE_TUNNEL_TOKEN=CHANGE_ME_PASTE_TUNNEL_TOKEN
```

### `.gitignore`

```gitignore
.env
n8n-data/
backups/
```

---

## 7. First Launch & Verification

### Start the stack
```powershell
cd "c:\Users\admin\Desktop\n8n local host"
docker compose up -d
```

### Watch the logs
```powershell
docker compose logs -f
```

Look for:
- **n8n:** `Editor is now accessible via: http://localhost:5678`
- **cloudflared:** `Connection registered` and `Registered tunnel connection connIndex=0`

### Verify locally
1. Open a browser and go to **http://localhost:5678**
2. You should see the n8n setup page (create your owner account).
3. Create your account with a **strong password**.

### Verify via Cloudflare Tunnel
1. Open a browser and go to **https://n8n.yourdomain.com**
2. If you set up Cloudflare Access (Step 5D), you'll see the email login gate first.
3. After authentication, you should see the n8n login page.

### Test a webhook
1. In n8n, create a simple workflow:
   - Add a **Webhook** trigger node.
   - Add a **Respond to Webhook** node that returns `{ "status": "ok" }`.
   - Activate the workflow.
2. Copy the **Production webhook URL** (it should be `https://n8n.yourdomain.com/webhook/...`).
3. From your phone or another device, open the webhook URL in a browser. You should see `{"status":"ok"}`.

---

## 8. Making It 24/7 (Survive Reboots & Crashes)

Multiple layers ensure the server stays up.

### 8A. Prevent Windows from sleeping

```powershell
# Disable sleep on AC power
powercfg /change standby-timeout-ac 0
# Disable hibernate
powercfg /hibernate off
# Disable monitor timeout (optional, but recommended for headless)
powercfg /change monitor-timeout-ac 0
```

### 8B. Auto-login on boot (for unattended restarts)

1. Press `Win + R` → type `netplwiz` → Enter.
2. **Uncheck** *"Users must enter a user name and password to use this computer"*.
3. Click Apply → enter your password when prompted.
4. This makes Windows auto-login after restarts, power outages, etc.

> **Note:** On newer Windows 11 builds, this checkbox may be hidden. In that case:
> ```powershell
> reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\PasswordLess\Device" /v DevicePasswordLessBuildVersion /t REG_DWORD /d 0 /f
> ```
> Then reboot and try `netplwiz` again.

### 8C. Docker Desktop starts on login

Already configured in Step 2 ("Start Docker Desktop when you sign in to Windows").

### 8D. Docker `restart: always` policy

Already set in Step 4. Containers auto-restart after Docker daemon starts.

### 8E. (Optional) Scheduled task to verify containers

Create a PowerShell script `c:\Users\admin\Desktop\n8n local host\watchdog.ps1`:
```powershell
# Watchdog: restarts the stack if n8n is not responding
$ErrorActionPreference = "SilentlyContinue"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Unhealthy" }
} catch {
    Write-Output "[$(Get-Date)] n8n is down. Restarting stack..."
    Set-Location "c:\Users\admin\Desktop\n8n local host"
    docker compose restart
}
```

Register it as a scheduled task (runs every 5 minutes):
```powershell
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"c:\Users\admin\Desktop\n8n local host\watchdog.ps1`""

$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName "n8n-watchdog" -Action $action -Trigger $trigger -Settings $settings -User "admin" -RunLevel Highest
```

### 8F. Windows Update management

Windows Update can force-reboot your machine. Mitigate this:

1. **Settings → Windows Update → Advanced options**
   - Set **Active hours** to cover 24 hours if possible (e.g., 12:00 AM – 11:59 PM).
2. **Pause updates** when doing critical workflow runs.
3. Consider using **Group Policy** (`gpedit.msc`) if on Pro:
   - `Computer Configuration → Administrative Templates → Windows Components → Windows Update → Manage end user experience`
   - Set *"Configure Automatic Updates"* to **2 – Notify for download and auto install** so you control when restarts happen.

---

## 9. Security Hardening

### 9A. n8n Owner Account
- Use a **strong, unique password** for the n8n owner account.
- Enable n8n's built-in **user management** (already enabled in our Compose config).

### 9B. Cloudflare Access (Step 5D)
- Adds email-based OTP authentication before reaching n8n at all.
- Set session duration to something reasonable (e.g., 24 hours).

### 9C. Cloudflare WAF / Bot Protection
- In your domain's Cloudflare dashboard → **Security → WAF**:
  - Enable the **Managed Ruleset** (free tier includes basic rules).
  - This protects against common web attacks.

### 9D. Firewall
- The Cloudflare Tunnel means **no ports are open on your router** — all traffic goes outbound from `cloudflared` to Cloudflare's edge.
- **Do NOT port-forward 5678 on your router.** There is no need.
- For local-only access, the Docker `ports: "5678:5678"` binding is fine since it only listens on `localhost` by default.

### 9E. n8n Encryption Key
- Already configured. This encrypts all stored credentials in n8n's database.

### 9F. Keep images updated
```powershell
# Pull latest images and recreate containers
cd "c:\Users\admin\Desktop\n8n local host"
docker compose pull
docker compose up -d
```
Run this periodically (e.g., weekly) to get security patches.

---

## 10. Backups & Data Persistence

### What to back up
| Data | Location | Contains |
|------|----------|----------|
| n8n database + credentials | `./n8n-data/` | Workflows, credentials, execution history, settings |
| Environment file | `./.env` | Encryption key, tunnel token |
| Docker Compose | `./docker-compose.yml` | Stack definition |

### Automated backup script

Create `c:\Users\admin\Desktop\n8n local host\backup.ps1`:
```powershell
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "c:\Users\admin\Desktop\n8n local host\backups"
$source = "c:\Users\admin\Desktop\n8n local host\n8n-data"

# Create timestamped zip
Compress-Archive -Path $source -DestinationPath "$backupDir\n8n-backup-$timestamp.zip" -Force

# Keep only last 7 backups
Get-ChildItem "$backupDir\n8n-backup-*.zip" |
    Sort-Object CreationTime -Descending |
    Select-Object -Skip 7 |
    Remove-Item -Force

Write-Output "[$(Get-Date)] Backup completed: n8n-backup-$timestamp.zip"
```

### Schedule daily backups
```powershell
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"c:\Users\admin\Desktop\n8n local host\backup.ps1`""

$trigger = New-ScheduledTaskTrigger -Daily -At "3:00AM"

Register-ScheduledTask -TaskName "n8n-daily-backup" -Action $action -Trigger $trigger -User "admin" -RunLevel Highest
```

### Restoring from backup
1. Stop the stack: `docker compose down`
2. Delete (or rename) the `n8n-data` folder.
3. Extract the backup zip to `./n8n-data/`.
4. Start the stack: `docker compose up -d`

---

## 11. Monitoring & Maintenance

### Quick status check commands

```powershell
# Are containers running?
docker compose ps

# Live logs
docker compose logs -f

# n8n health check
curl http://localhost:5678/healthz

# Resource usage
docker stats --no-stream
```

### Cloudflare dashboard monitoring

- **Zero Trust → Tunnels** — check tunnel status (should show **HEALTHY** with a green dot).
- **Analytics → Traffic** — view requests hitting your domain.
- **Security → Events** — review any blocked threats.

### Updating n8n

```powershell
cd "c:\Users\admin\Desktop\n8n local host"

# 1. Back up first!
powershell -File .\backup.ps1

# 2. Pull latest images
docker compose pull

# 3. Recreate containers with new images
docker compose up -d

# 4. Verify
docker compose logs -f n8n
```

### Disk space management

n8n execution logs can grow over time. To prune:

1. In n8n → **Settings → General → Execution Data**:
   - Set *"Save successful executions"* to **No** or a short retention.
   - Set *"Prune executions older than"* to e.g. **7 days**.
2. To reclaim Docker disk space:
   ```powershell
   docker system prune -f
   ```

---

## 12. Troubleshooting Cheat Sheet

| Problem | Cause | Fix |
|---------|-------|-----|
| `localhost:5678` not loading | n8n container not running | `docker compose up -d` and check logs |
| Cloudflare Tunnel shows **DOWN** | Tunnel token wrong or cloudflared crashed | Check `.env` token; `docker compose restart cloudflared` |
| Webhook URLs show `http://` instead of `https://` | `WEBHOOK_URL` not set correctly | Ensure `WEBHOOK_URL=https://${N8N_HOST}/` in Compose |
| "Bad gateway" on `n8n.yourdomain.com` | n8n isn't ready yet or hostname in tunnel config is wrong | Wait 30s; verify tunnel public hostname points to `n8n:5678` |
| Credentials broken after restart | Encryption key changed | **Never change** `N8N_ENCRYPTION_KEY` after first run; restore from backup |
| Container keeps restarting | Out of memory or config error | `docker compose logs n8n` to see the error |
| PC went to sleep | Power settings not applied | Re-run Step 8A commands |
| Windows rebooted for updates | Update policy not configured | Apply Group Policy from Step 8F |
| Tunnel works but very slow | Cloudflare proxy settings | Ensure the DNS record for your subdomain has the orange cloud (proxied) enabled |

---

## Execution Order Summary

Here is the exact order to execute this plan:

```
 1.  Sign up for Cloudflare + add your domain          [Step 5A]
 2.  Wait for domain to become active on Cloudflare    [Step 5A]
 3.  Configure Docker Desktop                          [Step 2]
 4.  Create project directory structure                [Step 3]
 5.  Create docker-compose.yml                         [Step 4]
 6.  Create the Cloudflare Tunnel                      [Step 5B]
 7.  Configure the public hostname route               [Step 5C]
 8.  Create .env file with secrets                     [Step 6]
 9.  First launch: docker compose up -d                [Step 7]
10.  Create n8n owner account                          [Step 7]
11.  Verify local + tunnel access                      [Step 7]
12.  Test a webhook end-to-end                         [Step 7]
13.  Configure Windows power & auto-login              [Step 8A-8B]
14.  Set up the watchdog scheduled task                [Step 8E]
15.  Configure Windows Update policy                   [Step 8F]
16.  Set up Cloudflare Access policy (optional)        [Step 5D]
17.  Enable Cloudflare WAF rules                       [Step 9C]
18.  Set up automated daily backups                    [Step 10]
19.  Configure n8n execution data pruning              [Step 11]
```

---

> **This plan is complete and ready for execution.** No files have been created or modified beyond this document. Confirm when you're ready to begin implementation.
