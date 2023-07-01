#!/bin/bash

while read line
do
  echo; echo "processing ${line}"

  [[ $line =~ ^(.*)\,(.{11}) ]]
  DN=${BASH_REMATCH[1]}
  youtubeID=${BASH_REMATCH[2]}

echo "DN is \"${DN}\" and ID is \"${youtubeID}\""
mv "/tmp/quizzes/"*"${youtubeID}"*  "/tmp/quizzes/[${youtubeID}]${DN}.quiz"

done < "YouTubeVideoDNandID.txt"