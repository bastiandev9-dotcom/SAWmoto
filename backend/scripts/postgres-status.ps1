. (Join-Path $PSScriptRoot 'postgres-common.ps1')
if (Test-PgReady) {
    Write-Output "PostgreSQL SAWmoto aktif di ${PgHost}:$PgPort"
    exit 0
}
Write-Output "PostgreSQL SAWmoto tidak aktif di ${PgHost}:$PgPort"
exit 1
