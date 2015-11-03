@echo off

echo   Restoring...

call "restore.bat"

echo   Done!
echo   Updating...

call npm install

echo   Patching...

cd install
call "patch.bat"

echo   Done!