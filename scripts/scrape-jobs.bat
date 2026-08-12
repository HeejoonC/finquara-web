@echo off
REM =====================================================================
REM  Finquara - AI 채용공고 자동 수집 (Windows 작업 스케줄러용)
REM
REM  작업 스케줄러 등록 방법:
REM    1) Win+R -> taskschd.msc
REM    2) [작업 만들기]
REM    3) 일반 탭   : 이름 "Finquara 채용공고 수집"
REM                   "사용자가 로그온할 때만 실행" 선택
REM                   (Claude Code 자격증명이 사용자 프로필에 있으므로
REM                    "로그온 여부에 관계없이 실행"은 동작하지 않습니다)
REM    4) 트리거 탭 : 매일 / 원하는 시각 (예: 오전 9시)
REM    5) 동작 탭   : 프로그램 시작
REM                   프로그램: 이 .bat 파일의 전체 경로
REM                   시작 위치: 프로젝트 루트 폴더 경로
REM =====================================================================

setlocal

REM 이 배치 파일이 있는 폴더의 상위(=프로젝트 루트)로 이동
cd /d "%~dp0.."

set LOGDIR=%~dp0..\logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

for /f "tokens=1-3 delims=/- " %%a in ("%date%") do set TODAY=%%a%%b%%c
set LOGFILE=%LOGDIR%\scrape-%TODAY%.log

echo. >> "%LOGFILE%"
echo ===== %date% %time% ===== >> "%LOGFILE%"

REM 기본값: 목표 20건, 자동 등록(비공개)
REM 즉시 공개하려면 --publish 를 뒤에 추가하세요.
call npm run scrape -- --max 20 >> "%LOGFILE%" 2>&1

echo [exit code: %ERRORLEVEL%] >> "%LOGFILE%"

endlocal
