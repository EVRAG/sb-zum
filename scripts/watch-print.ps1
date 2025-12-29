param(
    [string]$WatchedPath = "C:\Users\Pitt\Downloads\2812_EVRCircues\output",
    [string]$PrinterName = "Canon SELPHY CP1500",
    [string]$ArchivePath = "$WatchedPath\printed",
    [string]$LogPath = "$WatchedPath\watch-print.log",
    [ValidateSet("fit", "fill")]
    [string]$ScaleMode = "fill" # fill = без полей (может обрезать), fit = сохранить целиком
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

function Resolve-PrinterName($name) {
    $all = Get-Printer | Select-Object -ExpandProperty Name
    if (-not $name -or $name.Trim() -eq "") {
        $default = (Get-Printer | Where-Object Default -eq $true | Select-Object -First 1).Name
        if ($default) { return $default }
        throw "No default printer and no name provided. Available: $($all -join ', ')"
    }

    $exact = Get-Printer -Name $name -ErrorAction SilentlyContinue
    if ($exact) { return $exact.Name }

    Write-Log "Printer '$name' not found. Available: $($all -join ', ')"
    throw "Printer '$name' not found"
}

function Print-Image($path) {
    $targetPrinter = Resolve-PrinterName $PrinterName
    Write-Log "Printing (direct .NET): $path -> $targetPrinter"

    # Direct .NET PrintDocument (no file associations needed)
    try {
        Add-Type -AssemblyName System.Drawing

        $img = [System.Drawing.Image]::FromFile($path)

        $doc = New-Object System.Drawing.Printing.PrintDocument
        $doc.PrinterSettings.PrinterName = $targetPrinter
        if (-not $doc.PrinterSettings.IsValid) {
            throw "Printer '$targetPrinter' is not valid or not available"
        }
        $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins 0 0 0 0
        $doc.OriginAtMargins = $true
        # Suppress UI
        $doc.PrintController = New-Object System.Drawing.Printing.StandardPrintController

        # Fit/fill image into printable area preserving aspect ratio
        $doc.add_PrintPage({
            param($sender, $e)
            $g = $e.Graphics
            $area = $e.PageSettings.PrintableArea
            # PrintableArea is in 1/100 inch; convert to pixels for ratio
            $areaPxW = $area.Width / 100.0 * $g.DpiX
            $areaPxH = $area.Height / 100.0 * $g.DpiY
            $ratioW = $areaPxW / $img.Width
            $ratioH = $areaPxH / $img.Height
            $scale = if ($ScaleMode -eq "fill") { [Math]::Max($ratioW, $ratioH) } else { [Math]::Min($ratioW, $ratioH) }
            $wPx = $img.Width * $scale
            $hPx = $img.Height * $scale
            $xPx = ($areaPxW - $wPx) / 2
            $yPx = ($areaPxH - $hPx) / 2
            # Convert back to 1/100 inch for DrawImage rect
            $x = $area.X + ($xPx / $g.DpiX * 100)
            $y = $area.Y + ($yPx / $g.DpiY * 100)
            $w = $wPx / $g.DpiX * 100
            $h = $hPx / $g.DpiY * 100
            $e.Graphics.DrawImage($img, $x, $y, $w, $h)
            $e.HasMorePages = $false
        })

        $doc.Print()
        return
    } catch {
        Write-Log "Direct .NET print failed, will try shell ImageView_PrintTo : $_"
        # Fallback: classic shell image viewer print
        try {
            $rundll = Join-Path $env:SystemRoot "System32\\rundll32.exe"
            $shimg = Join-Path $env:SystemRoot "System32\\shimgvw.dll"
            Start-Process -FilePath $rundll -ArgumentList "`"$shimg`",ImageView_PrintTo", "`"$path`"", "`"$targetPrinter`"" -WindowStyle Hidden -Wait -ErrorAction Stop
            return
        } catch {
            throw
        }
    } finally {
        if ($img) { $img.Dispose() }
        if ($doc) { $doc.Dispose() }
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

