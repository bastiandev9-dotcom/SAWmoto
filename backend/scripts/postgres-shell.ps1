. (Join-Path $PSScriptRoot 'postgres-common.ps1')
if (-not (Test-PgReady)) {
    throw 'Jalankan npm run db:start terlebih dahulu'
}
& (Join-Path $PgBin 'psql.exe') -h $PgHost -p $PgPort -U sawmoto -d sawmoto
exit $LASTEXITCODE
