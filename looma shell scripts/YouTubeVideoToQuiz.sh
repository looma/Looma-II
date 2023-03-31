#!/bin/bash
#
# read DN and youtubeID from a TSV file named "YouTube videos on Looma.txt"
# curl to QTubeai.com to generate a quiz for that YouTube
# write the quiz to text file "/tmp/$DN$youtubeID.txt"

# THEN run a mongo shell script to store the quiz JSON in "quizzes" collection

# using qtubeai.com (no API key required)

while read line
do
  echo; echo "processing ${line}"

  [[ $line =~ ^(.*)\,(.{11}) ]]
  DN=${BASH_REMATCH[1]}
  youtubeID=${BASH_REMATCH[2]}

# echo "DN is \"${DN}\" and ID is \"${youtubeID}\""
  curl="curl https://qtubeai.com/getyoutubequestions?videoID=${youtubeID}"
  echo $curl
  $curl > "/tmp/${DN}${youtubeID}.txt"
  sleep 15     # trying to avoid "500 server overload" error
done < "YouTube videos on Looma.txt"