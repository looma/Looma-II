#!/bin/bash
#
#  on Looma system startup, wait until apache is running before launching Looma
#       tries every 5 seconds for 1 minute
#
#   to install:
#       copy this file to /usr/local/bin
#       sudo chmod 755 /usr/local/bin/loomastartup.sh
#       in System > Preferences > Personal > Startup Applications:
#           edit the "Looma" startup entry to contain Command: /usr/local/bin/loomastartup.sh
#
wait=2
tries=30
i=0
echo "waiting for webserver, retrying every $wait seconds for $time seconds"
#
while [ $i -lt  $tries ]
do
    curl -s http://localhost        #try to access webserver
	if [ $? -eq 0 ]
	then
		echo "launching Looma"
		chromium-browser --kiosk --noerrordisplay http://localhost/Looma/index.php	&
		exit
	else
		echo "waiting for webserver..."
		sleep $wait
		i=$(($i+1))
	fi
done
