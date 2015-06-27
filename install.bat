@echo off

echo Welcome to the installer for Drathybot!
timeout 3 > NUL
echo Before we begin, we need the path of MongoDB's executables.
timeout 2 > NUL
echo For example, the default install is C:/Program Files/MongoDB/Server/3.0/bin
timeout 2 > NUL
echo You can press [Enter] if that is your path.
timeout 2 > NUL

mkdir database
cd database

setlocal
:askMongoFolder
set /p loc="Please enter the path of MongoDB's executable containing folder: "
if "%loc%"=="" set loc=C:/Program Files/MongoDB/Server/3.0/bin
if NOT "%loc:~-1%" == "/" set loc=%loc%/
if NOT exist "%loc%mongo.exe" goto askMongoFolder
if NOT exist "%loc%mongod.exe" goto askMongoFolder
echo %loc% > "database/mongo.loc"
endlocal

echo Installing modules...
call npm install

echo Finished installing modules.
echo Creating more batch files...

echo if "%%~1"=="-FIXED_CTRL_C" ( > s.bat
echo   shift >> s.bat
echo ) else ( >> s.bat
echo   call ^<NUL %%0 -FIXED_CTRL_C %%* >> s.bat
echo   goto :EOF >> s.bat
echo ) >> s.bat
echo cd database >> s.bat
echo i.vbs "start /WAIT restart.bat" >> s.bat
echo cd .. >> s.bat
echo start "Drathybot" node %~dp0 >> s.bat

echo CreateObject("Wscript.Shell").Run "s.bat", 0, True > Drathybot.vbs

echo CreateObject("Wscript.Shell").Run "" ^& WScript.Arguments(0) ^& "", 0, False > i.vbs

echo del db.log > start.bat
echo setlocal >> start.bat
echo (set /p loc=) ^< mongo.loc >> start.bat
echo "%%loc%%/mongod.exe" --dbpath %%~dp0 --logpath db.log >> start.bat
echo endlocal >> start.bat

echo setlocal > stop.bat
echo (set /p loc=) ^< mongo.loc >> stop.bat
echo "%%loc%%/mongo.exe" localhost:27017 --eval "db.adminCommand({shutdown : 1})" >> stop.bat
echo endlocal >> stop.bat

echo call stop.bat > restart.bat
echo timeout 1 >> restart.bat
echo wscript.exe i.vbs "start.bat" >> restart.bat
echo exit >> restart.bat

echo Drathybot is finished installing!

cd ..
timeout 5