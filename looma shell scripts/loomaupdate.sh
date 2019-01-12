#!/bin/bash
#
#  filename: loomaupdate.sh
#       author: skip
#       date:   Jan 2019
#
#  used to update a pre-installed Looma by installing new code, database & content
#
#   files to be updated are assumed to be on a USB stick at /media/odroid/LOOMA
#   files expected on the USB:
#       Looma/               (full set of new Looma code)
#       Looma/mongo-dump/dump/looma/   (mongodump of the new database content)
#       content/*   (folders with new content)
#                   (these are usually NEW folders, but this can be used to overwrite)
#                   (existing content folders)
#       loomaupdate.sh       (this file)
#
#   steps performed:
#       copy old Looma code to LoomaBAK
#       install new Looma code
#       copy mongodb --db looma to loomaBAK
#       install new mongodb --db looma
#       copy new content files into "content" directory
#
echo "START LOOMA UPDATE: updating Looma code, database and content"
echo "    you must insert a USB memory stick which is named LOOMA2019"
echo "    the USB stick must have files to be uploaded contained in a top-level folder named 'LoomaUpdate' "
cd /media/odroid/LOOMA2019/LoomaUpdate
echo "- changed directory to ";pwd

#       copy current Looma code to LoomaBAK
echo "- preparing to backup current Looma code to LoomaBAK"
echo "- - continue [y/n]?"; read input; if [[ $input == "y" ]]; then
    if [ -d /var/www/html/LoomaBAK ]; then rm -r /var/www/html/LoomaBAK; fi
    mv    /var/www/html/Looma   /var/www/html/LoomaBAk
fi

#       install new Looma code
echo  "- preparing to install new Looma code"
echo "- - continue [y/n]?"; read input; if [[ $input == "y" ]]; then
    cp -r Looma /var/www/html
fi

#       install new Looma database
echo "- preparing to install new Looma database"
echo "- - continue [y/n]?"; read input; if [[ $input == "y" ]]; then
    mongo loomaBAK  --eval "db.dropDatabase()"               # remove old BAK
    mongo looma --eval "db.copyDatabase('looma','loomaBAK')" # backup current db
    mongo looma --eval "db.dropDatabase()"                   # remove current db
    mongorestore --db looma Looma/mongo-dump/dump/looma/     # install new db
fi

#       copy new files into "content" directory
echo "- prepating to copy new files into content directory"
echo "- - continue [y/n]?"; read input; if [[ $input == "y" ]]; then
    echo "- updating the following CONTENT files:" ; ls -l content/
    rsync -r content/   /var/www/html/content   #NOTE: slash after "content/" and no slash after "/var/www/html/content"
    rsync -r maps2018/   /var/www/html/maps2018   #NOTE: slash after "source/" and no slash after "/var/www/html/destination"
fi

echo "DONE LOOMA UPDATE: updating Looma code, database and content"

