
cd ..

echo Writing files...

echo if "%%~1"=="-FIXED_CTRL_C" ( > s.bat
echo   shift >> s.bat
echo ) else ( >> s.bat
echo   call ^<NUL %%0 -FIXED_CTRL_C %%* >> s.bat
echo   goto :EOF >> s.bat
echo ) >> s.bat
echo cd database >> s.bat
echo i.vbs "start /WAIT restart.bat" >> s.bat
echo cd .. >> s.bat
echo :start >> s.bat
echo start /WAIT "Omnibot" node %%~dp0 >> s.bat
echo if errorlevel 4 ( >> s.bat
echo   goto :start >> s.bat
echo ) else ( >> s.bat
echo   cd database >> s.bat
echo   i.vbs "stop.bat" >> s.bat
echo ) >> s.bat

echo CreateObject("Wscript.Shell").Run "s.bat", 0, True > Omnibot.vbs

cd database

echo CreateObject("Wscript.Shell").Run "" ^& WScript.Arguments(0) ^& "", 0, False > i.vbs

echo del db.log > start.bat
echo setlocal >> start.bat
echo (set /p loc=) ^< mongo.loc >> start.bat
echo "%%loc%%/mongod.exe" --dbpath "%%~dp0\" --logpath db.log >> start.bat
echo endlocal >> start.bat

echo setlocal > stop.bat
echo (set /p loc=) ^< mongo.loc >> stop.bat
echo "%%loc%%/mongo.exe" localhost:27017 --eval "db.adminCommand({shutdown : 1})" >> stop.bat
echo endlocal >> stop.bat

echo call stop.bat > restart.bat
echo timeout 1 >> restart.bat
echo wscript.exe i.vbs "start.bat" >> restart.bat
echo exit >> restart.bat