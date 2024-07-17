@Echo Off

REM ***********************************************************************************
REM *** Script Name:	Script 000 Update - AutoUpdate.cmd
REM *** Script Author:	Ralf Ledl
REM *** Script Purpose:	Automatically Update Looma on Windows
REM *** Created:		2023-09-19
REM *** Prerequisite:	Looma Installation as defined in:
REM ***					Looma II - Install Instructions for Windows - 1.4.2.pdf
REM ***********************************************************************************
REM Change History
REM ***********************************************************************************
REM Change Date:		2023-09-22
REM Change Reason:		Add configuration and retry options, configurable by variables
REM Change Details:		Retry rsync in case of interruptions 
REM Change Details:		Configurable by using variables RetryCount and RetryDelay
REM Change Details:		Wait for user input (retry yes/no) if RetryCount failed
REM ***********************************************************************************
REM ***********************************************************************************
REM Change Date:		2023-09-28
REM Change Reason:		Feature Request: Make variables changeable by end-user
REM Change Details:		Added variable selection and logging (default vs. new values)
REM ***********************************************************************************
REM ***********************************************************************************
REM Change Date:		YYYY-MM-DD
REM Change Reason:		[TEXT]
REM Change Details:		[TEXT]
REM ***********************************************************************************

REM Global Variables
Set LogFile="%TEMP%\_AutoUpdateLoomaWin.Log"
Set StartTimeStamp=%DATE%%TIME%
Set LoomaUpdateFileLocation="%SYSTEMDRIVE%\xampp\htdocs\Looma\Looma System Files\Looma PC"

REM Configuration Variables - set to "YES" means downloading the content during the Update
Set Update_content="YES"
Set Update_epaath="NO"
Set Update_looma="YES"
Set Update_maps="NO"
Set Update_Apache="NO"
Set RetryCount=4
Set RetryDelay=900

REM Define Backup-Folder based on current date and time
set CUR_YYYY=%date:~10,4%
set CUR_MM=%date:~4,2%
set CUR_DD=%date:~7,2%
set CUR_HH=%time:~0,2%
if %CUR_HH% lss 10 (set CUR_HH=0%time:~1,1%)
set CUR_NN=%time:~3,2%
set CUR_SS=%time:~6,2%
set CUR_MS=%time:~9,2%
set BackupFolder=%SYSTEMDRIVE%\xampp\Linux\Backup_%CUR_YYYY%%CUR_MM%%CUR_DD%-%CUR_HH%%CUR_NN%%CUR_SS%

REM Start logging
Echo *********************************************************************************** 			>>%LogFile%
Echo *** %DATE% %TIME% Starting %~f0 																>>%LogFile%
Echo *********************************************************************************** 			>>%LogFile%
Echo %DATE% %TIME% Update settings preconfigured by script (default settings):						>>%LogFile%
Echo %DATE% %TIME% Update_content = %Update_content%												>>%LogFile%
Echo %DATE% %TIME% Update_looma = %Update_looma%													>>%LogFile%
Echo %DATE% %TIME% Update_maps = %Update_maps%														>>%LogFile%
Echo %DATE% %TIME% Update_epaath = %Update_epaath%													>>%LogFile%

REM Settings changeable by user
:Loop-010
cls
Echo (0) Continue with current settings, set all to "NO" to update scripts only.
Echo.
Echo (1) Update Content = %Update_content%
Echo (2) Update Looma = %Update_looma%
Echo (3) Update Maps = %Update_maps%
Echo (4) Update ePaath = %Update_epaath%
Echo.
Echo (5) Exit Script
Echo.
Choice /m "0 = Continue with current settings, or choose setting (X) to be changed" /c 012345
If errorlevel 6 (
	Echo %DATE% %TIME% Update cancelled by user - EXIT Script										>>%LogFile%
	Exit
)	
If errorlevel 5 (
	If %Update_epaath%=="YES" (set Update_epaath="NO") Else (Set Update_epaath="YES")
	Goto Loop-010
)
If errorlevel 4 (
	If %Update_maps%=="YES" (set Update_maps="NO") Else (Set Update_maps="YES")
	Goto Loop-010
)
If errorlevel 3 (
	If %Update_looma%=="YES" (set Update_looma="NO") Else (Set Update_looma="YES")
	Goto Loop-010
)
If errorlevel 2 (
	If %Update_content%=="YES" (set Update_content="NO") Else (Set Update_content="YES")
	Goto Loop-010
)
If errorlevel 1 (Echo Press CTRL+C to quit, any other key to start updating Looma.)
pause

Echo %DATE% %TIME% Update settings after user configuration:										>>%LogFile%
Echo %DATE% %TIME% Update_content = %Update_content%												>>%LogFile%
Echo %DATE% %TIME% Update_looma = %Update_looma%													>>%LogFile%
Echo %DATE% %TIME% Update_maps = %Update_maps%														>>%LogFile%
Echo %DATE% %TIME% Update_epaath = %Update_epaath%													>>%LogFile%

REM Downloading new scripts via rsync first (same script updates Looma)
:UpdateLooma
For /L %%i in (1,1,%RetryCount%) do (
	Echo %DATE% %TIME% Starting Update_looma.sh
	Echo %DATE% %TIME% Starting Update_looma.sh														>>%LogFile%
	cmd.exe /c bash "Update_looma.sh"
	IF ERRORLEVEL 255 (
		Echo %DATE% %TIME% Update_Looma.sh was interrupted, check internet connection.
		Echo %DATE% %TIME% Update_Looma.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds...
		Echo %DATE% %TIME% Update_Looma.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds... >>%LogFile%
		timeout %RetryDelay%
		If %%i==%RetryCount% (
			choice /c yn /m "Update_Looma.sh failed %%i times - check internet connection! Try again?"
			If ERRORLEVEL 2 goto ExitWithErrorCode
			If ERRORLEVEL 1 goto UpdateLooma 
		)
	)
	IF ERRORLEVEL 1 Goto ExitWithErrorCode
	IF ERRORLEVEL 0 Goto UpdateLoomaSuccess
)
:UpdateLoomaSuccess
Echo %DATE% %TIME% Successfully finished Update_looma.sh											>>%LogFile%

REM Backing up existing scripts before overwriting them with the freshly downloaded ones, which might have been updated
Echo %DATE% %TIME% Create Backup-Folder %BackupFolder%
Echo %DATE% %TIME% Create Backup-Folder %BackupFolder%												>>%LogFile%
MD %BackupFolder%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode
Echo %DATE% %TIME% Backing up files from %SYSTEMDRIVE%\xampp\Linux\ to %BackupFolder%
Echo %DATE% %TIME% Backing up files from %SYSTEMDRIVE%\xampp\Linux\ to %BackupFolder%				>>%LogFile%
XCopy %SYSTEMDRIVE%\xampp\Linux\*.sh %BackupFolder% /v												>>%LogFile%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode
XCopy %SYSTEMDRIVE%\xampp\Linux\*.conf %BackupFolder% /v											>>%LogFile%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode
XCopy %SYSTEMDRIVE%\xampp\Linux\*.cmd %BackupFolder% /v												>>%LogFile%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode

REM Copy new scripts
Echo %DATE% %TIME% Copy new files from %LoomaUpdateFileLocation% to %SYSTEMDRIVE%\xampp\linux\
Echo %DATE% %TIME% Copy new files from %LoomaUpdateFileLocation% to %SYSTEMDRIVE%\xampp\linux\		>>%LogFile%
XCopy %LoomaUpdateFileLocation%\*.* %SYSTEMDRIVE%\xampp\linux\ /v /Y								>>%LogFile%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode

REM Reconfigure Apache for Looma
If %Update_Apache%=="NO" echo "Skipping Update Apache Server Configuration"							>>%LogFile%
If %Update_Apache%=="NO" goto Update_content
Echo %DATE% %TIME% Copy new file from %SYSTEMDRIVE%\xampp\linux\httpd.conf to %SYSTEMDRIVE%\xampp\apache\conf\httpd.conf
Echo %DATE% %TIME% Copy new file from %SYSTEMDRIVE%\xampp\linux\httpd.conf to %SYSTEMDRIVE%\xampp\apache\conf\httpd.conf >>%LogFile%
XCopy "%SYSTEMDRIVE%\xampp\linux\httpd.conf" %SYSTEMDRIVE%\xampp\apache\conf\httpd.conf /v /Y		>>%LogFile%
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode

REM Restart Apache from XAMPP Console (manual task!)
msg /v /w %USERNAME% "Restart Apache Server from XAMPP Console, then press OK to process further update scripts."
REM Due to the user context switch to an admin user, the script does not recognize if xampp-control.exe is closed. Therefore, we do not start it automatically.
REM cmd.exe /C %SYSTEMDRIVE%\xampp\xampp-control.exe
msg /v /w %USERNAME% "Apache Server from XAMPP Console has been restarted? If done, press OK"

REM Download new looma content (delta-update)
:Update_content
If %update_content%=="NO" echo "Skipping Update_content.sh"											>>%LogFile%
If %update_content%=="NO" goto Update_epaath
For /L %%i in (1,1,%RetryCount%) do (
	Echo %DATE% %TIME% Starting Update_content.sh
	Echo %DATE% %TIME% Starting Update_content.sh													>>%LogFile%
	cmd.exe /c bash "update_content.sh"
	IF ERRORLEVEL 255 (
		Echo %DATE% %TIME% Update_content.sh was interrupted, check internet connection.
		Echo %DATE% %TIME% Update_content.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds...
		Echo %DATE% %TIME% Update_content.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds... >>%LogFile%
		timeout %RetryDelay%
		If %%i==%RetryCount% (
			choice /c yn /m "Update_content.sh failed %%i times - check internet connection! Try again?"
			If ERRORLEVEL 2 goto ExitWithErrorCode
			If ERRORLEVEL 1 goto Update_content
		)
	)
	IF ERRORLEVEL 1 Goto ExitWithErrorCode
	IF ERRORLEVEL 0 Goto Update_ContentSuccess
)
:Update_ContentSuccess
Echo %DATE% %TIME% Successfully finished Update_content.sh											>>%LogFile%

:Update_epaath
If %Update_epaath%=="NO" echo "Skipping Update_epaath.sh"											>>%LogFile%
If %Update_epaath%=="NO" goto Update_looma2
For /L %%i in (1,1,%RetryCount%) do (
	Echo %DATE% %TIME% Starting Update_epaath.sh
	Echo %DATE% %TIME% Starting Update_epaath.sh													>>%LogFile%
	cmd.exe /c bash "Update_epaath.sh"
	IF ERRORLEVEL 255 (
		Echo %DATE% %TIME% Update_epaath.sh was interrupted, check internet connection.
		Echo %DATE% %TIME% Update_epaath.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds...
		Echo %DATE% %TIME% Update_epaath.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds... >>%LogFile%
		timeout %RetryDelay%
		If %%i==%RetryCount% (
			choice /c yn /m "Update_epaath.sh failed %%i times - check internet connection! Try again?"
			If ERRORLEVEL 2 goto ExitWithErrorCode
			If ERRORLEVEL 1 goto Update_epaath
		)
	)
	IF ERRORLEVEL 1 Goto ExitWithErrorCode
	IF ERRORLEVEL 0 Goto Update_epaathSuccess
)
:Update_epaathSuccess
Echo %DATE% %TIME% Successfully finished Update_epaath.sh											>>%LogFile%

:Update_looma2
If %Update_looma%=="NO" echo "Skipping Update_looma.sh"												>>%LogFile%
If %Update_looma%=="NO" goto Update_maps
For /L %%i in (1,1,%RetryCount%) do (
	Echo %DATE% %TIME% Starting Update_looma.sh
	Echo %DATE% %TIME% Starting Update_looma.sh														>>%LogFile%
	cmd.exe /c bash "Update_looma.sh"
	IF ERRORLEVEL 255 (
		Echo %DATE% %TIME% Update_looma.sh was interrupted, check internet connection.
		Echo %DATE% %TIME% Update_looma.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds...
		Echo %DATE% %TIME% Update_looma.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds... >>%LogFile%
		timeout %RetryDelay%
		If %%i==%RetryCount% (
			choice /c yn /m "Update_looma.sh failed %%i times - check internet connection! Try again?"
			If ERRORLEVEL 2 goto ExitWithErrorCode
			If ERRORLEVEL 1 goto Update_maps
		)
	)
	IF ERRORLEVEL 1 Goto ExitWithErrorCode
	IF ERRORLEVEL 0 Goto Update_loomaSuccess2
)
:Update_loomaSuccess2
Echo %DATE% %TIME% Successfully finished Update_looma.sh											>>%LogFile%

:Update_maps
If %Update_maps%=="NO" echo "Skipping Update_maps.sh"												>>%LogFile%
If %Update_maps%=="NO" goto UpdateDatabase
For /L %%i in (1,1,%RetryCount%) do (
	Echo %DATE% %TIME% Starting Update_maps.sh
	Echo %DATE% %TIME% Starting Update_maps.sh														>>%LogFile%
	cmd.exe /c bash "Update_maps.sh"
	IF ERRORLEVEL 255 (
		Echo %DATE% %TIME% Update_maps.sh was interrupted, check internet connection.
		Echo %DATE% %TIME% Update_maps.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds...
		Echo %DATE% %TIME% Update_maps.sh was interrupted, retry %%i of %RetryCount% in %RetryDelay% seconds... >>%LogFile%
		timeout %RetryDelay%
		If %%i==%RetryCount% (
			choice /c yn /m "Update_maps.sh failed %%i times - check internet connection! Try again?"
			If ERRORLEVEL 2 goto ExitWithErrorCode
			If ERRORLEVEL 1 goto Update_maps
		)
	)
	IF ERRORLEVEL 1 Goto ExitWithErrorCode
	IF ERRORLEVEL 0 Goto Update_mapsSuccess
)
:Update_mapsSuccess
Echo %DATE% %TIME% Successfully finished Update_maps.sh												>>%LogFile%

:UpdateDatabase
Echo %DATE% %TIME% Starting update_database.cmd
Echo %DATE% %TIME% Starting update_database.cmd														>>%LogFile%
cmd.exe /C "Update_database.cmd"
IF %ERRORLEVEL% NEQ 0 Goto ExitWithErrorCode
Echo %DATE% %TIME% Successfully finished update_database.cmd
Echo %DATE% %TIME% Successfully finished update_database.cmd										>>%LogFile%

:ENDSUCCESS
Echo *********************************************************************************** 			>>%LogFile%
Echo *** %DATE% %TIME% ALL DONE - Successfully updated Looma 										>>%LogFile%
Echo *********************************************************************************** 			>>%LogFile%
Echo.																								>>%LogFile%
Echo.																								>>%LogFile%
msg %USERNAME% ALL DONE - Successfully finished updating Looma.
exit

:ExitWithErrorCode
Echo %DATE% %TIME% An error occured, exit script %~f0.												>>%LogFile%
Echo %DATE% %TIME% Last errorlevel = %ERRORLEVEL% 													>>%LogFile%
msg %USERNAME% An error occured during updating Looma. For further details, see LogFile %LogFile% (opens automatically).
cmd.exe /C notepad.exe %LogFile%
exit