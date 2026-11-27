$ErrorActionPreference = 'Stop'

$PgBin = Join-Path $env:ProgramFiles 'PostgreSQL\17\bin'
$ProjectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$PgData = Join-Path $ProjectRoot '.local\postgres'
$PgLog = Join-Path $ProjectRoot '.local\postgres.log'
$PgPort = 55432
$PgHost = '127.0.0.1'

function Test-PgReady {
    & (Join-Path $PgBin 'pg_isready.exe') -h $PgHost -p $PgPort -U sawmoto -d sawmoto | Out-Host
    return $LASTEXITCODE -eq 0
}

function Start-LocalPostgres {
    if (-not (Test-Path -LiteralPath $PgData)) {
        throw "Cluster belum diinisialisasi: $PgData"
    }
    if (Test-PgReady) {
        Write-Output "PostgreSQL SAWmoto sudah berjalan di ${PgHost}:$PgPort"
        return
    }
    & (Join-Path $PgBin 'pg_ctl.exe') -D $PgData -l $PgLog -o "-p $PgPort -h $PgHost" start
    if ($LASTEXITCODE -ne 0) {
        throw 'PostgreSQL gagal dijalankan'
    }
    Start-Sleep -Seconds 1
    if (-not (Test-PgReady)) {
        throw 'PostgreSQL belum siap menerima koneksi'
    }
}

function Stop-LocalPostgres {
    if (-not (Test-Path -LiteralPath $PgData)) {
        throw "Cluster belum diinisialisasi: $PgData"
    }
    if (-not (Test-PgReady)) {
        Write-Output 'PostgreSQL SAWmoto sudah berhenti'
        return
    }
    & (Join-Path $PgBin 'pg_ctl.exe') -D $PgData stop -m fast
    if ($LASTEXITCODE -ne 0) {
        throw 'PostgreSQL gagal dihentikan'
    }
}
