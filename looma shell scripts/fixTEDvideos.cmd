#!/bin/bash
# one time program to delete TED video files from content/videos/ that are in content/TED/
cd /usr/local/var/www/content/TED
for filename in *.mp4
do
    if [[ -f ../videos/$filename ]]
    then
        echo ../videos/$filename
        mv -- "../videos/$filename" "../videos/${filename}.OLD"
    fi
done

for thumb in *_thumb.jpg
do
    if [[ -f ../videos/$thumb ]]
    then
        echo ../videos/$thumb
        mv -- "../videos/$thumb" "../videos/${thumb}.OLD"
    fi
done