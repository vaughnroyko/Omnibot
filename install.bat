call npm install
@echo off
@echo cd database > run.bat
@echo call stop.bat >> run.bat
@echo call start.bat >> run.bat
@echo cd ../.. >> run.bat
@echo node DrathybotAlpha >> run.bat
@echo cd DrathybotAlpha >> run.bat
@echo pause >> run.bat
mkdir database
cd database
@echo del db.log > start.bat
@echo start "MongoDB" mongod --dbpath %%~dp0 --logpath db.log >> start.bat
@echo mongo localhost:27017 --eval "db.adminCommand({shutdown : 1})" > stop.bat
cd ..
pause