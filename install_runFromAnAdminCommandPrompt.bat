@echo off
echo ---------------------------------------------
echo Running copy...
robocopy "IOT Demo\IOT Demo" C:\inetpub\wwwroot *.* /mir /R:5 > installLog.txt
echo ---------------------------------------------
echo Check installLog.txt for details. Press ENTER to quit.
set /p x= 