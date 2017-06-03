@echo off

echo Welcome to the installer for Omnibot!
timeout 2 > NUL
echo. & echo Before we begin, we need the path of MongoDB's executables.
timeout 1 > NUL
echo The default install path is  C:/Program Files/MongoDB/Server/3.4/bin
timeout 1 > NUL
echo You can press [Enter] if that is your path.
timeout 2 > NUL
echo.

mkdir database > nul 2> nul

setlocal
:askMongoFolder
set /p loc="Please enter the path of MongoDB's executable containing folder: "
if "%loc%"=="" set loc=C:/Program Files/MongoDB/Server/3.4/bin
if NOT "%loc:~-1%" == "/" set loc=%loc%/
if NOT exist "%loc%mongo.exe" goto askMongoFolder
if NOT exist "%loc%mongod.exe" goto askMongoFolder
echo %loc% > "database/mongo.loc"
endlocal
echo.

echo Installing modules...
cd install
call update-dependencies.bat
echo Finished installing modules.

cd install
call writefiles.bat

echo.

echo Omnibot has finished installing!

cd ..
timeout 5
