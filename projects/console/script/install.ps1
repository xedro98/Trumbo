# Trumbo CLI installer (PowerShell).
#
# Downloads the prebuilt Trumbo binary for Windows from the npm registry and
# installs it to %USERPROFILE%\.trumbo\bin (or $env:TRUMBO_INSTALL_DIR).
# No Node, Bun, or npm required.
#
# Usage:
#   irm https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.ps1 | iex
#
# Options (pass via hashtable when invoking manually, or set env vars):
#   -Version <ver>      Version to install (default: latest published)
#   -InstallDir <dir>   Directory to install trumbo.exe into
#                       (default: $env:USERPROFILE\.trumbo\bin, or $env:TRUMBO_INSTALL_DIR)
#   -DryRun             Print what would happen without writing files
#   -Registry <url>     npm registry base (default: https://registry.npmjs.org)
#
# Environment:
#   TRUMBO_VERSION       Same as -Version
#   TRUMBO_INSTALL_DIR   Same as -InstallDir
#   TRUMBO_REGISTRY      Same as -Registry

[CmdletBinding()]
param(
	[string]$Version = $env:TRUMBO_VERSION,
	[string]$InstallDir = $env:TRUMBO_INSTALL_DIR,
	[string]$Registry = $env:TRUMBO_REGISTRY,
	[switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $Registry) { $Registry = "https://registry.npmjs.org" }

function Write-Step($msg) { Write-Host "trumbo-install: $msg" }
# Use throw (not exit) so an error during `irm | iex` surfaces without
# closing the user's interactive PowerShell session.
function Write-Fail($msg) { Write-Host "trumbo-install: $msg" -ForegroundColor Red; throw $msg }

# --- Detect architecture ---------------------------------------------------
$arch = switch ($env:PROCESSOR_ARCHITECTURE) {
	"AMD64" { "x64"; break }
	"ARM64" { "arm64"; break }
	default {
		# Fallback to .NET detection.
		if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -band [System.Runtime.InteropServices.Architecture]::X64) { "x64" }
		elseif ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -band [System.Runtime.InteropServices.Architecture]::Arm64) { "arm64" }
		else { Write-Fail "unsupported architecture: $env:PROCESSOR_ARCHITECTURE" }
	}
}

# --- Resolve install directory --------------------------------------------
if (-not $InstallDir) {
	if ($env:USERPROFILE -and (Test-Path $env:USERPROFILE)) {
		$InstallDir = Join-Path $env:USERPROFILE ".trumbo\bin"
	} else {
		Write-Fail "could not determine USERPROFILE; pass -InstallDir"
	}
}

# --- Resolve version + tarball URL ----------------------------------------
$pkg = "@trumbodev/cli-windows-$arch"
# npm registry requires the scope slash to be URL-encoded in the path.
$encodedPkg = $pkg -replace "/", "%2f"

if ($Version) {
	$metaUrl = "$Registry/$encodedPkg/$Version"
} else {
	$metaUrl = "$Registry/$encodedPkg/latest"
}

Write-Step "resolving $pkg @ $(if ($Version) { $Version } else { 'latest' })"
Write-Step "  GET $metaUrl"

try {
	$resp = Invoke-RestMethod -Uri $metaUrl -UseBasicParsing
} catch {
	Write-Fail "failed to fetch package metadata from $metaUrl`n$($_.Exception.Message)"
}

$tarball = $resp.dist.tarball
$resolvedVersion = $resp.version

if (-not $tarball) { Write-Fail "could not find dist.tarball in registry response" }
if (-not $resolvedVersion) { Write-Fail "could not find version in registry response" }

Write-Step "version $resolvedVersion"
Write-Step "tarball $tarball"

# --- Download + extract ----------------------------------------------------
$tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("trumbo-install-" + [guid]::NewGuid().ToString("N"))) -Force
$tarballPath = Join-Path $tmp.FullName "package.tgz"

Write-Step "downloading..."
try {
	Invoke-WebRequest -Uri $tarball -OutFile $tarballPath -UseBasicParsing
} catch {
	Write-Fail "download failed`n$($_.Exception.Message)"
}

Write-Step "extracting..."
$extractDir = Join-Path $tmp.FullName "pkg"
New-Item -ItemType Directory -Path $extractDir -Force | Out-Null

# Windows 10 1803+ ships tar.exe. Fall back to .NET TarFile if missing.
$tarExe = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tarExe) {
	& tar.exe -xzf $tarballPath -C $extractDir 2>$null
	if ($LASTEXITCODE -ne 0) {
		Write-Fail "tar.exe extraction failed (exit $LASTEXITCODE)"
	}
} else {
	try {
		Add-Type -AssemblyName "System.IO.Compression.FileSystem"
		[System.IO.Compression.TarFile]::ExtractTarDirectory($tarballPath, $extractDir)
	} catch {
		Write-Fail "extraction failed: tar.exe not found and .NET TarFile unavailable`n$($_.Exception.Message)"
	}
}

$srcBinary = Join-Path $extractDir "package\bin\trumbo.exe"
if (-not (Test-Path $srcBinary)) {
	Write-Fail "binary not found in tarball at package\bin\trumbo.exe"
}

$destBinary = Join-Path $InstallDir "trumbo.exe"

if ($DryRun) {
	Write-Step "[dry-run] would install $srcBinary -> $destBinary"
	exit 0
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
# Replace any existing binary (it may be in use; try to remove, warn if locked).
if (Test-Path $destBinary) {
	try { Remove-Item $destBinary -Force }
	catch { Write-Fail "could not replace existing $destBinary (is trumbo running?). Close it and retry.`n$($_.Exception.Message)" }
}
Copy-Item $srcBinary $destBinary -Force

Write-Step "installed $destBinary"

# --- PATH guidance ---------------------------------------------------------
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $userPath) { $userPath = "" }
$pathEntries = $userPath.Split(";") | Where-Object { $_ -ne "" }
if ($pathEntries -contains $InstallDir) {
	Write-Step "$InstallDir is already on your user PATH."
} else {
	$newPath = if ($userPath) { "$InstallDir;$userPath" } else { $InstallDir }
	[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
	Write-Step "added $InstallDir to your user PATH."
	Write-Step "Open a new terminal for the change to take effect."
}

Write-Host ""
Write-Step "run 'trumbo --version' to verify, then 'trumbo' to start."
