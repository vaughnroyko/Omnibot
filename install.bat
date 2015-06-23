call npm install

@echo off

@echo if "%%~1"=="-FIXED_CTRL_C" ( > run.bat
@echo    shift >> run.bat
@echo ) else ( >> run.bat
@echo    call ^<NUL %%0 -FIXED_CTRL_C %%* >> run.bat
@echo    goto :EOF >> run.bat
@echo ) >> run.bat
@echo cd database >> run.bat
@echo start /WAIT restart.bat >> run.bat
@echo cd ../.. >> run.bat
@echo node DrathybotAlpha >> run.bat
@echo cd DrathybotAlpha >> run.bat
@echo pause >> run.bat

mkdir database
cd database

@echo del db.log > start.bat
@echo start "MongoDB" mongod --dbpath %%~dp0 --logpath db.log >> start.bat

@echo mongo localhost:27017 --eval "db.adminCommand({shutdown : 1})" > stop.bat

@echo call stop.bat > restart.bat
@echo pause >> restart.bat
@echo call start.bat >> restart.bat
@echo exit >> restart.bat

cd ..
pause