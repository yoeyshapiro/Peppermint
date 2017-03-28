@echo off

set token=

attrib +h .head.bat
call .head.bat
node app.js %token%

color 0c
echo =======
echo Bot terminated
echo =======
pause