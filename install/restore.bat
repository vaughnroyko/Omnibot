cd ..

if not exist "install\patches\backup" (
    echo Dependencies have not yet been patched. A restore is not required.
    goto :EOF
)


if exist "install\temp" del "install\temp\*.*" /q & rmdir "install\temp" /q
mkdir "install\temp"

:: move patches to temp folder, move backups to patch folder
move /y "install\patches\*.*" "install\temp" >nul
move /y "install\patches\backup\*.*" "install\patches" >nul
rmdir "install\patches\backup" /s /q


:: execute patch
cd install
call "patch.bat"


:: return patches to home
del "install\patches\*.*" /q
move /y "install\temp\*.*" "install\patches" >nul
rmdir "install\temp" /s /q

:: cleanup
rmdir "install\patches\backup" /s /q