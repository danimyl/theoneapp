@echo off
echo Testing EAS CLI...
echo.
echo Checking EAS CLI version:
npx eas --version
echo.
echo Checking Expo login status:
npx eas whoami
echo.
echo Test complete!
pause
