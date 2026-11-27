param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'postgres-common.ps1')

if ([string]::IsNullOrWhiteSpace($Password)) {
    throw 'Password tidak boleh kosong'
}
if ((Test-Path -LiteralPath $PgData) -and (Get-ChildItem -LiteralPath $PgData -Force | Measure-Object).Count -gt 0) {
    throw "Cluster sudah ada: $PgData"
}

$localDirectory = Split-Path -Parent $PgData
New-Item -ItemType Directory -Path $localDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $PgData -Force | Out-Null

$passwordFile = Join-Path $env:TEMP "sawmoto-initdb-$([guid]::NewGuid()).txt"
try {
    [System.IO.File]::WriteAllText($passwordFile, $Password, [System.Text.UTF8Encoding]::new($false))
    & (Join-Path $PgBin 'initdb.exe') -D $PgData -U sawmoto --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8 --no-locale
    if ($LASTEXITCODE -ne 0) {
        throw 'initdb gagal'
    }
}
finally {
    Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
}

Start-LocalPostgres

$previousPassword = $env:PGPASSWORD
try {
    $env:PGPASSWORD = $Password
    & (Join-Path $PgBin 'createdb.exe') -h $PgHost -p $PgPort -U sawmoto sawmoto
    if ($LASTEXITCODE -ne 0) {
        throw 'Database sawmoto gagal dibuat'
    }
}
finally {
    $env:PGPASSWORD = $previousPassword
}

Write-Output "Database SAWmoto siap di ${PgHost}:$PgPort"
