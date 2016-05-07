@echo off
cd /d %~dp0
7za a -mx0 about-internal-pages-chrome.zip  ".\src\*"