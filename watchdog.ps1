# n8n Watchdog — checks health every run, restarts stack if unhealthy
$ErrorActionPreference = "SilentlyContinue"
$logFile = "c:\Users\admin\Desktop\n8n local host\watchdog.log"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "Unhealthy response: $($response.StatusCode)" }
    Add-Content -Path $logFile -Value "[$(Get-Date)] OK - n8n is healthy"
} catch {
    Add-Content -Path $logFile -Value "[$(Get-Date)] ALERT - n8n is down: $($_.Exception.Message). Restarting..."
    Set-Location "c:\Users\admin\Desktop\n8n local host"
    docker compose restart
    Add-Content -Path $logFile -Value "[$(Get-Date)] Stack restart initiated."
}
