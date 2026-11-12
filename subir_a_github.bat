@echo off
cd /d "%~dp0"
echo ===================================================
echo   Subiendo a GitHub (https://github.com/QwertySalazar/nexfood)
echo ===================================================
echo.
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" push -u origin main
echo.
pause

