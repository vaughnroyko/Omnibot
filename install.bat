call npm install

@echo off

@echo if "%%~1"=="-FIXED_CTRL_C" ( > s.bat
@echo    shift >> s.bat
@echo ) else ( >> s.bat
@echo    call ^<NUL %%0 -FIXED_CTRL_C %%* >> s.bat
@echo    goto :EOF >> s.bat
@echo ) >> s.bat
@echo cd database >> s.bat
@echo i.vbs "start /WAIT restart.bat" >> s.bat
@echo cd .. >> s.bat
@echo start "Drathybot" node ../DrathybotAlpha >> s.bat

@echo CreateObject("Wscript.Shell").Run "s.bat", 0, True > Drathybot.vbs

mkdir database
cd database

@echo CreateObject("Wscript.Shell").Run "" ^& WScript.Arguments(0) ^& "", 0, False > i.vbs

@echo del db.log > start.bat
@echo mongod --dbpath %%~dp0 --logpath db.log >> start.bat

@echo mongo localhost:27017 --eval "db.adminCommand({shutdown : 1})" > stop.bat

@echo call stop.bat > restart.bat
@echo timeout 1 >> restart.bat
@echo wscript.exe i.vbs "start.bat" >> restart.bat
@echo exit >> restart.bat

cd ..
timeout 5