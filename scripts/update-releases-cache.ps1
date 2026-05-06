param(
    [string]$Repository = 'FoxNet-DDNet/Entity-Client-DDNet',
    [int]$Count = 10,
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\docs\releases-cache.json')
)

$headers = @{
    Accept = 'application/vnd.github+json'
    'User-Agent' = 'FoxSite-release-cache-script'
}

if ($env:GITHUB_TOKEN) {
    $headers.Authorization = "Bearer $($env:GITHUB_TOKEN)"
}

$uri = "https://api.github.com/repos/$Repository/releases?per_page=$Count"
$releases = Invoke-RestMethod -Uri $uri -Headers $headers

$payload = @{
    repo = $Repository
    updatedAt = (Get-Date).ToUniversalTime().ToString('o')
    releases = @(
        $releases | ForEach-Object {
            @{
                name = if ($_.name) { $_.name } else { $_.tag_name }
                tagName = $_.tag_name
                url = $_.html_url
                publishedAt = if ($_.published_at) { $_.published_at } else { $_.created_at }
                body = if ($_.body) { $_.body } else { '' }
            }
        }
    )
}

$payload | ConvertTo-Json -Depth 5 | Set-Content -Path $OutputPath -Encoding utf8
Write-Host "Wrote release cache to $OutputPath"
