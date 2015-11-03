cd ..

if exist "install\patches\backup\" (
    echo Dependencies have already been patched. Please restore old state before repatching.
    goto :EOF
)

mkdir "install\patches\backup"

REM start patch

copy "node_modules\tmi.js\lib\logger.js" "install\patches\backup\tmijs.logger.js" /y >nul
copy "install\patches\tmijs.logger.js" "node_modules\tmi.js\lib\logger.js" /y >nul


REM complete patch