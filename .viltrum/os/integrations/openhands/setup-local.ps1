[CmdletBinding()]
param(
    [string]$ProjectPath = (Join-Path $PSScriptRoot '../../tmp/runtime-demo'),
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$ohRepo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$ohExplicitProject = $PSBoundParameters.ContainsKey('ProjectPath')
$ohProject = (Resolve-Path -LiteralPath $ProjectPath).Path
if (-not (Test-Path -LiteralPath $ohProject -PathType Container)) { throw 'Project must be an existing directory.' }
if (-not $ohExplicitProject -and -not $ohProject.StartsWith($ohRepo + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'An external workspace requires an explicit -ProjectPath parameter.'
}
if ($ohProject.TrimEnd('\','/') -eq [IO.Path]::GetPathRoot($ohProject).TrimEnd('\','/') -or
    $ohProject.TrimEnd('\','/') -eq $env:USERPROFILE.TrimEnd('\','/') -or
    $ohProject.TrimEnd('\','/') -eq $ohRepo.TrimEnd('\','/')) { throw 'Do not mount a drive root, user home, or the complete SDK/repository.' }
if (($ohProject -split '[\\/]') | Where-Object {$_ -match '^\.(git|hg|svn|ssh|aws|azure|codex|claude|openhands|kube)$'}) {
    throw 'Workspace must not be inside a credential/state directory.'
}
# Reject links/junctions in the workspace; a Docker bind must not expose targets elsewhere.
$ohEntries = @(Get-Item -LiteralPath $ohProject -Force; Get-ChildItem -LiteralPath $ohProject -Recurse -Force)
$ohLinks = $ohEntries |
    Where-Object { ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 }
if ($ohLinks) { throw 'Workspace contains a reparse point. Use a clean isolated workspace.' }
# Check every ancestor as well: Resolve-Path can retain a Windows junction spelling.
$ohAncestor=[IO.DirectoryInfo]::new($ohProject)
while($null -ne $ohAncestor){
    if(($ohAncestor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){ throw 'Workspace ancestor is a reparse point.' }
    $ohAncestor=$ohAncestor.Parent
}
$ohSensitive=$ohEntries | Where-Object {
    $_.Name -match '^\.(git|hg|svn|ssh|aws|azure|codex|claude|openhands|kube)$|^\.env($|\.)|^\.(npmrc|pypirc|netrc)$|^(credentials|secrets?)(\.|$)|^(auth|tokens?)\.json$|^id_(rsa|ed25519|dsa|ecdsa)(\.pub)?$|\.(pem|key|p12|pfx|keystore)$'
}
if($ohSensitive){ throw 'Workspace contains VCS metadata or potential credential files. Prepare a separate sanitized workspace first.' }
$ohPrivate = Join-Path $env:LOCALAPPDATA 'Viltrum/openhands'
$ohOutput = Join-Path $ohRepo 'output/openhands-local'
New-Item -ItemType Directory -Path $ohPrivate,$ohOutput -Force | Out-Null
$ohEnvPath = Join-Path $ohPrivate 'secret.env'
$ohClient = Join-Path $ohPrivate 'client.json'
$ohComposeEnv = Join-Path $ohOutput 'compose.env'
$ohReceiptPath = Join-Path $ohOutput 'receipt.json'
$ohImage = 'ghcr.io/openhands/agent-server:1.50.0-python-slim@sha256:cf8ebed4d3b65ee14ae5742e58db009681845f8eca340521da07d1c862e7b4af'
if (-not (Test-Path -LiteralPath $ohEnvPath)) {
    $ohRng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $ohKeyBytes = New-Object byte[] 32
    $ohCipherBytes = New-Object byte[] 32
    $ohRng.GetBytes($ohKeyBytes); $ohRng.GetBytes($ohCipherBytes); $ohRng.Dispose()
    $ohSessionKey = [Convert]::ToBase64String($ohKeyBytes)
    $ohCipherKey = ([BitConverter]::ToString($ohCipherBytes)).Replace('-','').ToLowerInvariant()
    [IO.File]::WriteAllText($ohEnvPath, "SESSION_API_KEY=$ohSessionKey`nOH_SECRET_KEY=$ohCipherKey`n", [Text.UTF8Encoding]::new($false))
    # Restrict this newly created credential file, without changing machine security policy.
    $ohAcl = [Security.AccessControl.FileSecurity]::new()
    $ohAcl.SetAccessRuleProtection($true,$false)
    $ohIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $ohAcl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new($ohIdentity,'FullControl','Allow'))
    Set-Acl -LiteralPath $ohEnvPath -AclObject $ohAcl
    $ohSessionKey=$null; $ohCipherKey=$null; $ohKeyBytes=$null; $ohCipherBytes=$null
}
$ohConfig = [ordered]@{
    schemaVersion=1; endpoint='http://127.0.0.1:8011'; container='viltrum-openhands-agent-server'
    project=$ohProject; workspace='/workspace/project'; image=$ohImage
    explicitProject=$ohExplicitProject
    secretEnvFile=$ohEnvPath; receipt=$ohReceiptPath; workspaceReadOnly=$true
    llmConfigured=$false; version='1.50.0'
}
[IO.File]::WriteAllText($ohClient, ($ohConfig | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
$ohProjectCompose = $ohProject.Replace('\','/')
$ohSecretCompose = $ohEnvPath.Replace('\','/')
[IO.File]::WriteAllText($ohComposeEnv, "OPENHANDS_PROJECT=$ohProjectCompose`nOPENHANDS_SECRET_ENV=$ohSecretCompose`n", [Text.UTF8Encoding]::new($false))
$ohReceipt = [ordered]@{
    updatedAt=[DateTime]::UtcNow.ToString('o'); status='prepared'; serviceReady=$false
    version='1.50.0'; image=$ohImage; endpoint=$ohConfig.endpoint
    container=$ohConfig.container; containerId=$null; project=$ohProject; workspace='/workspace/project'
    workspaceReadOnly=$true; authConfigured=$true; providerCredentialsConfigured=$false
    clientConfig=$ohClient; secretEnvFile=$ohEnvPath
    approvalRequired=$true; modelExecuted=$false
}
function Save-Receipt {
    $ohReceipt.updatedAt=[DateTime]::UtcNow.ToString('o')
    [IO.File]::WriteAllText($ohReceiptPath, ($ohReceipt | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
}
Save-Receipt
if ($PrepareOnly) { Write-Output 'OpenHands files prepared; no image pull or service start.'; Write-Output $ohReceiptPath; return }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    $ohReceipt.status='blocked'; $ohReceipt.reason='docker_cli_missing'; Save-Receipt; throw 'Docker Desktop CLI is not installed.'
}
$ohServer = & docker version --format '{{.Server.Version}}' 2>$null
if ($LASTEXITCODE -ne 0 -or -not $ohServer) {
    $ohReceipt.status='blocked'; $ohReceipt.reason='docker_engine_unreachable'; Save-Receipt
    throw 'Docker engine unreachable. Start the existing Docker Desktop and resolve its reported error; no OS features are changed by this script.'
}
$ohReceipt.dockerServerVersion=$ohServer
$ohCompose = Join-Path $PSScriptRoot 'compose.yaml'
$ohReceipt.status='pulling'; Save-Receipt
& docker compose --env-file $ohComposeEnv -f $ohCompose pull --quiet
if ($LASTEXITCODE -ne 0) { $ohReceipt.status='blocked'; $ohReceipt.reason='image_pull_failed'; Save-Receipt; throw 'Pinned official image pull failed.' }
& docker compose --env-file $ohComposeEnv -f $ohCompose up -d
if ($LASTEXITCODE -ne 0) { $ohReceipt.status='blocked'; $ohReceipt.reason='container_start_failed'; Save-Receipt; throw 'Agent Server failed to start.' }
# Parse Docker metadata in memory; never emit Config.Env or the authentication values.
$ohInspect = (& docker inspect $ohConfig.container | ConvertFrom-Json)[0]
$ohReceipt.containerId=$ohInspect.Id
$ohReceipt.running=$ohInspect.State.Running
$ohReceipt.imageId=$ohInspect.Image
$ohReceipt.user=$ohInspect.Config.User
$ohReceipt.readonlyRootfs=$ohInspect.HostConfig.ReadonlyRootfs
$ohReceipt.privileged=$ohInspect.HostConfig.Privileged
$ohReceipt.capDrop=$ohInspect.HostConfig.CapDrop
$ohReceipt.securityOpt=$ohInspect.HostConfig.SecurityOpt
$ohReceipt.tmpfs=$ohInspect.HostConfig.Tmpfs
$ohReceipt.memoryLimitBytes=$ohInspect.HostConfig.Memory
$ohReceipt.nanoCpus=$ohInspect.HostConfig.NanoCpus
$ohReceipt.pidsLimit=$ohInspect.HostConfig.PidsLimit
$ohReceipt.mounts=@($ohInspect.Mounts | Select-Object Type,Source,Destination,RW)
$ohReceipt.portBindings=$ohInspect.HostConfig.PortBindings
$ohBoundProject=@($ohInspect.Mounts | Where-Object { $_.Destination -eq '/workspace/project' })
$ohBindings=@($ohInspect.HostConfig.PortBindings.'8000/tcp')
$ohSandboxVerified=($ohInspect.State.Running -and $ohInspect.Config.User -eq '10001:10001' -and
    $ohInspect.HostConfig.ReadonlyRootfs -and -not $ohInspect.HostConfig.Privileged -and
    'ALL' -in $ohInspect.HostConfig.CapDrop -and
    @($ohInspect.HostConfig.SecurityOpt | Where-Object {$_ -match '^no-new-privileges(:true)?$'}).Count -gt 0 -and
    $ohBoundProject.Count -eq 1 -and -not $ohBoundProject[0].RW -and
    $ohBoundProject[0].Source.Replace('\','/').TrimEnd('/') -eq $ohProject.Replace('\','/').TrimEnd('/') -and
    $ohBindings.Count -eq 1 -and $ohBindings[0].HostIp -eq '127.0.0.1' -and $ohBindings[0].HostPort -eq '8011' -and
    @($ohInspect.Mounts | Where-Object { $_.Destination -match 'docker.sock|^/home/|^/root' }).Count -eq 0)
$ohReceipt.sandboxVerified=$ohSandboxVerified
$ohSecretMap=@{}
Get-Content -LiteralPath $ohEnvPath | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') { $ohSecretMap[$Matches[1]]=$Matches[2] }
}
$ohHeaders=@{'X-Session-API-Key'=$ohSecretMap['SESSION_API_KEY']}
$ohDeadline=[DateTime]::UtcNow.AddSeconds(60)
do {
    try { $ohReady=Invoke-RestMethod ($ohConfig.endpoint+'/ready') -TimeoutSec 3; if($ohReady.status -eq 'ready') {break} } catch { }
    Start-Sleep -Milliseconds 500
} while([DateTime]::UtcNow -lt $ohDeadline)
try {
    $ohInfo=Invoke-RestMethod ($ohConfig.endpoint+'/server_info') -TimeoutSec 5
    $ohAuthorized=Invoke-RestMethod ($ohConfig.endpoint+'/api/conversations/count') -Headers $ohHeaders -TimeoutSec 5
    $ohUnauthorizedCode=$null
    try { Invoke-WebRequest ($ohConfig.endpoint+'/api/conversations/count') -TimeoutSec 5 | Out-Null }
    catch { $ohUnauthorizedCode=[int]$_.Exception.Response.StatusCode }
    $ohReceipt.serverVersion=$ohInfo.version; $ohReceipt.sdkVersion=$ohInfo.sdk_version
    $ohReceipt.buildGitSha=$ohInfo.build_git_sha; $ohReceipt.health=$ohReady.status
    $ohReceipt.unauthorizedStatus=$ohUnauthorizedCode; $ohReceipt.authorizedCount=[int]$ohAuthorized
    $ohReceipt.serviceReady=($ohReady.status -eq 'ready' -and $ohUnauthorizedCode -eq 401 -and $ohInfo.version -eq '1.50.0' -and $ohSandboxVerified)
    $ohReceipt.status=if($ohReceipt.serviceReady){'service_ready_llm_pending'}else{'blocked'}
    if(-not $ohReceipt.serviceReady){$ohReceipt.reason='health_auth_or_version_not_verified'}
    # Save the genuine deployed schema; it contains definitions, not request credentials.
    $ohSchema=Invoke-WebRequest ($ohConfig.endpoint+'/openapi.json') -TimeoutSec 10
    [IO.File]::WriteAllText((Join-Path $ohOutput 'openapi.json'),$ohSchema.Content,[Text.UTF8Encoding]::new($false))
} catch { $ohReceipt.status='blocked'; $ohReceipt.reason='health_request_failed' }
$ohSecretMap.Clear(); $ohHeaders.Clear(); $ohInspect=$null
Save-Receipt
Write-Output ('OpenHands status: '+$ohReceipt.status)
Write-Output $ohReceiptPath
if(-not $ohReceipt.serviceReady){throw 'OpenHands has not passed service health/auth/version checks. See sanitized receipt.'}
