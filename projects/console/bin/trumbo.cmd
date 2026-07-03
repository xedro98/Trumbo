@ECHO OFF
SETLOCAL
SET "DP0=%~dp0"

REM Prefer the compiled platform binary so interactive mode keeps a real console
REM TTY. The Node resolver (bin/trumbo) is kept as fallback for lookup edge cases.
SET "ARCH=x64"
IF /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" SET "ARCH=arm64"
IF /I "%PROCESSOR_ARCHITECTURE%"=="AMD64" SET "ARCH=x64"

SET "EXE=%DP0%..\node_modules\@trumbodev\cli-windows-%ARCH%\bin\trumbo.exe"
IF EXIST "%EXE%" (
	"%EXE%" %*
	EXIT /B %ERRORLEVEL%
)

node "%DP0%trumbo" %*
EXIT /B %ERRORLEVEL%
