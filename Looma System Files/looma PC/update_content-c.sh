#!/bin/sh
/usr/bin/sshpass -p looma rsync -az  --stats  --progress    --perms  --chmod=D777,F777 --chown=looma:users   --exclude '.[!.]*' --delete --delete-excluded    -e "ssh"   58191@usw-s008.rsync.net:../content   /mnt/c/xampp/htdocs
