param(
    [switch]$Background,
    [ValidateRange(1024, 65535)][int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$backendDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../backend'))
$jarPath = Join-Path $backendDirectory 'build/libs/timeflow-api-0.1.0.jar'
if (-not (Test-Path -LiteralPath $jarPath)) {
    throw 'Build the server first: cd backend; ./gradlew.bat check bootJar'
}

# Resolve the actual JVM: Oracle javapath shims can leave an untracked child process.
$javaCommand = (Get-Command java -ErrorAction Stop).Source
$javaProbe = [Diagnostics.Process]::new()
$javaProbe.StartInfo = [Diagnostics.ProcessStartInfo]::new($javaCommand, '-XshowSettings:properties -version')
$javaProbe.StartInfo.UseShellExecute = $false
$javaProbe.StartInfo.CreateNoWindow = $true
$javaProbe.StartInfo.RedirectStandardError = $true
try {
    $javaProbe.Start() | Out-Null
    $settings = $javaProbe.StandardError.ReadToEnd()
    $javaProbe.WaitForExit()
    if ($javaProbe.ExitCode -ne 0) { throw 'Java configuration probe failed.' }
} finally {
    $javaProbe.Dispose()
}
$homeMatch = [regex]::Match($settings, '(?m)^\s*java\.home = (.+)$')
if (-not $homeMatch.Success) {
    throw 'Cannot resolve the actual Java installation.'
}
$javaExecutable = Join-Path $homeMatch.Groups[1].Value.Trim() 'bin/java.exe'
$probe = [Net.Sockets.TcpClient]::new()
try {
    $probe.Connect('127.0.0.1', $Port)
    throw "Port $Port is already in use; leave the existing server running."
} catch [Net.Sockets.SocketException] {
    # No listener: safe to start our own server.
} finally {
    $probe.Dispose()
}

$arguments = @('-jar', ('"' + $jarPath + '"'), "--server.port=$Port")
if ($Background) {
    $outputDirectory = Join-Path $backendDirectory 'build/local-server'
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    $process = Start-Process -FilePath $javaExecutable -ArgumentList $arguments `
        -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $outputDirectory "server-$Port.log") `
        -RedirectStandardError (Join-Path $outputDirectory "server-$Port-error.log")
    @{ processId = $process.Id; port = $Port; executable = $javaExecutable; jar = $jarPath } |
        ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $outputDirectory "server-$Port.json")
    Write-Output "Started Timeflow PID $($process.Id) on port $Port."
} else {
    Push-Location $backendDirectory
    try {
        & $javaExecutable -jar $jarPath "--server.port=$Port"
        if ($LASTEXITCODE -ne 0) { throw "Timeflow exited with code $LASTEXITCODE." }
    } finally {
        Pop-Location
    }
}
