param(
    [string]$WatchedPath = "C:\Users\Pitt\Downloads\2812_EVRCircues\output",
    [string]$PrinterName = "Canon SELPHY CP1500",
    [string]$ArchivePath = "$WatchedPath\printed",
    [string]$LogPath = "$WatchedPath\watch-print.log"
)

$extensions = ".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"
New-Item -ItemType Directory -Force -Path $WatchedPath, $ArchivePath | Out-Null

function Write-Log($msg) {
    $stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $LogPath -Value "[$stamp] $msg"
}

function Wait-FileReady($path, $timeoutSec = 60) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
        try {
            $fs = [IO.File]::Open($path, 'Open', 'Read', 'None')
            $fs.Dispose()
            return $true
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }
    return $false
}

function Print-Image($path) {
    Write-Log "Printing: $path"
    # First try shell PrintTo (uses file association)
    try {
        $p = Start-Process -FilePath $path -Verb PrintTo -ArgumentList "`"$PrinterName`"" -PassThru -WindowStyle Hidden -ErrorAction Stop
        $p.WaitForExit(30000) | Out-Null
        return
    } catch {
        Write-Log "PrintTo failed, will try mspaint /pt : $_"
    }

    # Fallback: mspaint /pt supports most image types
    try {
        $mspaint = Join-Path $env:SystemRoot "System32\\mspaint.exe"
        $p = Start-Process -FilePath $mspaint -ArgumentList "/pt", "`"$path`"", "`"$PrinterName`"" -PassThru -WindowStyle Hidden -ErrorAction Stop
        $p.WaitForExit(30000) | Out-Null
    } catch {
        throw
    }
}

$fsw = New-Object IO.FileSystemWatcher $WatchedPath, "*.*"
$fsw.IncludeSubdirectories = $false
$fsw.EnableRaisingEvents = $true

Register-ObjectEvent $fsw Created -SourceIdentifier "NewImage" -Action {
    $path = $Event.SourceEventArgs.FullPath
    $ext = [IO.Path]::GetExtension($path).ToLower()
    if ($extensions -notcontains $ext) { return }

    if (-not (Wait-FileReady $path)) {
        Write-Log "File not ready or timeout: $path"
        return
    }

    try {
        Print-Image $path
        $dest = Join-Path $ArchivePath ([IO.Path]::GetFileName($path))
        Move-Item -Force -Path $path -Destination $dest
        Write-Log "Done: $dest"
    } catch {
        Write-Log "Print error $path : $_"
    }
} | Out-Null

Write-Log "Watching $WatchedPath for printer '$PrinterName'"
Write-Host "Watcher running. Press Ctrl+C to exit."
while ($true) { Wait-Event -Timeout 5 | Out-Null }

