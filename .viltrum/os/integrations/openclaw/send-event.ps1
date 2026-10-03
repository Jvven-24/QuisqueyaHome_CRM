param(
    [Parameter(Mandatory=$true)][string]$ProjectId,
    [Parameter(Mandatory=$true)][string]$TextFile,
    [string]$EventId = ([guid]::NewGuid().ToString()),
    [string]$Intent = 'AUTO',
    [string]$ConfigPath = (Join-Path $env:LOCALAPPDATA 'Viltrum\openclaw\client.json'),
    [ValidateRange(1024,65535)][int]$Port = 8771
)
$ErrorActionPreference = 'Stop'
$client = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
if ($null -eq $client.projects.PSObject.Properties[$ProjectId]) { throw 'Proyecto no permitido' }
$secretLines = Get-Content -LiteralPath $client.secretEnvFile
$prefix = $client.tokenEnv + '='
$matches = @($secretLines | Where-Object { $_.StartsWith($prefix) })
if ($matches.Count -ne 1) { throw 'Configuración de token inválida' }
$bearer = $matches[0].Substring($prefix.Length).Trim()
$payload = @{
    eventId=$EventId; projectId=$ProjectId; intent=$Intent
    text=(Get-Content -LiteralPath $TextFile -Raw -Encoding UTF8)
} | ConvertTo-Json -Compress
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:$Port/webhooks/viltrum" -Method Post `
        -Headers @{Authorization=('Bearer ' + $bearer)} -ContentType 'application/json; charset=utf-8' `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec 15
} catch { throw 'No se confirmó recepción; consultar el mismo eventId antes de reenviar' }
