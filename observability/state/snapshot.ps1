param(
    [string]$StateDir = $PSScriptRoot,
    [string]$OpenSearchContainer = "looma-opensearch-node",
    [string]$DashboardsContainer = "looma-opensearch-dashboards"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Utf8NoBomJson {
    param(
        [Parameter(Mandatory = $true)] $Value,
        [Parameter(Mandatory = $true)] [string] $Path,
        [int] $Depth = 50
    )

    $json = $Value | ConvertTo-Json -Depth $Depth
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, $utf8NoBom)
}

function Invoke-DockerText {
    param(
        [Parameter(Mandatory = $true)] [string] $Container,
        [Parameter(Mandatory = $true)] [string] $Command
    )

    $output = docker exec $Container sh -c $Command
    if ($LASTEXITCODE -ne 0) {
        throw "docker exec failed for $Container`: $Command"
    }
    return ($output -join "`n")
}

$StateDir = [System.IO.Path]::GetFullPath($StateDir)
New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

Write-Host "[snapshot] target dir: $StateDir"

# 1) Saved objects (dashboards + visualizations + index patterns + searches + maps).
Write-Host "[snapshot] exporting saved objects..."
# Build the export request entirely inside the container to avoid PowerShell
# pipe encoding (UTF-16/BOM) corrupting the JSON payload.
$exportTypes = '\"dashboard\",\"visualization\",\"index-pattern\",\"search\",\"query\",\"map\"'
docker exec $DashboardsContainer sh -c "printf '%s' '{\""type\"":[$exportTypes],\""includeReferencesDeep\"":true,\""excludeExportDetails\"":false}' > /tmp/export.json"
if ($LASTEXITCODE -ne 0) {
    throw "failed to write saved-object export request into $DashboardsContainer"
}

docker exec $DashboardsContainer sh -c "curl -s -X POST 'http://localhost:5601/api/saved_objects/_export' -H 'Content-Type: application/json' -H 'osd-xsrf: true' --data-binary @/tmp/export.json -o /tmp/saved-objects.ndjson"
if ($LASTEXITCODE -ne 0) {
    throw "failed to export saved objects from $DashboardsContainer"
}

docker cp "$DashboardsContainer`:/tmp/saved-objects.ndjson" (Join-Path $StateDir "saved-objects.ndjson")
if ($LASTEXITCODE -ne 0) {
    throw "failed to copy saved-objects.ndjson from $DashboardsContainer"
}

$savedObjectsPath = Join-Path $StateDir "saved-objects.ndjson"
$count = 0
if (Test-Path $savedObjectsPath) {
    $matches = @(Select-String -Path $savedObjectsPath -Pattern '"type"' -AllMatches)
    $count = $matches.Count
}
Write-Host "[snapshot]   saved-objects.ndjson ($count lines)"

# 2) Advanced settings (config:<osd-version>).
Write-Host "[snapshot] exporting advanced settings..."
$statusRaw = Invoke-DockerText -Container $DashboardsContainer -Command "curl -s http://localhost:5601/api/status"
$osdVersion = "3.6.0"
try {
    $status = $statusRaw | ConvertFrom-Json
    if ($status.version.number) {
        $osdVersion = [string]$status.version.number
    }
} catch {
    if ($statusRaw -match '"number":"([^"]+)"') {
        $osdVersion = $Matches[1]
    }
}

# Read through the OSD-managed `.kibana` alias, not a hardcoded `.kibana_1`.
# OSD migrates config into `.kibana_N` and points the `.kibana` alias at it;
# `.kibana_1` may not exist, which previously crashed this export. This mirrors
# the same fix already applied in bootstrap.sh.
$configRaw = Invoke-DockerText -Container $OpenSearchContainer -Command "curl -s 'http://localhost:9200/.kibana/_doc/config:$osdVersion'"
$configRaw = $configRaw -replace ([char]0xFEFF), ""
$configDoc = $configRaw | ConvertFrom-Json
$configSource = $configDoc._source

$advancedSettings = [ordered]@{
    config = if ($configSource.config) { $configSource.config } else { [ordered]@{} }
    migrationVersion = if ($configSource.migrationVersion) { $configSource.migrationVersion } else { [ordered]@{} }
    references = if ($configSource.references) { $configSource.references } else { @() }
    type = "config"
}
Write-Utf8NoBomJson -Value $advancedSettings -Path (Join-Path $StateDir "advanced-settings.json")
Write-Host "[snapshot]   advanced-settings.json (osd version $osdVersion)"

# 3) ISM policies (only the looma-managed ones).
Write-Host "[snapshot] exporting ISM policies..."
$policyDir = Join-Path $StateDir "ism-policies"
New-Item -ItemType Directory -Force -Path $policyDir | Out-Null

foreach ($policyId in @("looma-7day-delete")) {
    $policyRaw = Invoke-DockerText -Container $OpenSearchContainer -Command "curl -s 'http://localhost:9200/_plugins/_ism/policies/$policyId'"
    $policyRaw = $policyRaw -replace ([char]0xFEFF), ""
    $policyDoc = $policyRaw | ConvertFrom-Json
    $policy = $policyDoc.policy
    if ($policy.PSObject.Properties.Name -contains "policy") {
        $policy = $policy.policy
    }

    Write-Utf8NoBomJson -Value ([ordered]@{ policy = $policy }) -Path (Join-Path $policyDir "$policyId.json")
    Write-Host "[snapshot]   ism-policies/$policyId.json"
}

# 4) Observability objects (applications + operational panels + saved visualizations).
#    The whole .opensearch-observability index is exported so the Panel tab of
#    each application (panelId -> operationalPanel -> savedVisualization) survives
#    a fresh install. Filtering by application.name would drop panels and viz.
Write-Host "[snapshot] exporting Observability objects (apps + panels + visualizations)..."
$appsQuery = @{
    size = 5000
    query = @{
        match_all = @{}
    }
} | ConvertTo-Json -Depth 30 -Compress

$appsQuery | docker exec -i $OpenSearchContainer sh -c "cat > /tmp/applications-query.json"
if ($LASTEXITCODE -ne 0) {
    throw "failed to write applications export request into $OpenSearchContainer"
}

$appsRaw = Invoke-DockerText -Container $OpenSearchContainer -Command "curl -s -X POST 'http://localhost:9200/.opensearch-observability/_search' -H 'Content-Type: application/json' --data-binary @/tmp/applications-query.json"
$appsRaw = $appsRaw -replace ([char]0xFEFF), ""
$appsDoc = $appsRaw | ConvertFrom-Json
$appsLines = New-Object System.Collections.Generic.List[string]
foreach ($hit in $appsDoc.hits.hits) {
    $meta = @{
        index = @{
            _index = ".opensearch-observability"
            _id = [string]$hit._id
        }
    } | ConvertTo-Json -Depth 20 -Compress
    $source = $hit._source | ConvertTo-Json -Depth 80 -Compress
    $appsLines.Add($meta)
    $appsLines.Add($source)
}

$appsPath = Join-Path $StateDir "applications.ndjson"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($appsPath, (($appsLines -join "`n") + "`n"), $utf8NoBom)
Write-Host "[snapshot]   applications.ndjson ($($appsDoc.hits.hits.Count) observability objects)"

# 5) Cleanup temp inside containers.
docker exec -u 0 $OpenSearchContainer sh -c "rm -f /tmp/cfg*.json /tmp/ism-*.json /tmp/applications-query.json" 2>$null | Out-Null
docker exec -u 0 $DashboardsContainer sh -c "rm -f /tmp/export.json /tmp/saved-objects.ndjson" 2>$null | Out-Null

Write-Host "[snapshot] done. Commit the changes under observability/state/."
