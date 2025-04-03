@echo on
echo ===== Starting Android Build Script =====
echo Current directory: %CD%
echo.

echo [1/3] Checking if we're in the correct directory...
if exist "app.json" (
    echo SUCCESS: app.json found in current directory.
) else (
    echo ERROR: app.json not found in current directory.
    echo This script must be run from the TheOneApp_mobile directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)
echo.

echo [2/3] Checking if npx is available...
where npx
if %errorlevel% equ 0 (
    echo SUCCESS: npx is available.
    echo EAS CLI version:
    call npx eas --version
) else (
    echo ERROR: npx is not available. Make sure Node.js is installed properly.
    pause
    exit /b 1
)
echo.

echo [3/3] Checking if user is logged in to EAS...
call npx eas whoami
if %errorlevel% equ 0 (
    echo SUCCESS: You are logged in to Expo.
) else (
    echo WARNING: You may not be logged in to Expo.
    echo You will be prompted to log in during the build process.
    echo If you don't have an account, you can create one at https://expo.dev/signup
    echo.
    echo Press any key to continue or Ctrl+C to cancel...
    pause >nul
)
echo.

echo ===== All checks passed! =====
echo.

echo Starting EAS build for Android...
call npx eas build --platform android --profile production --non-interactive --no-wait
if %errorlevel% neq 0 (
    echo ERROR: EAS build command failed with exit code %errorlevel%.
    pause
    exit /b %errorlevel%
)

echo Build process initiated successfully.
pause
