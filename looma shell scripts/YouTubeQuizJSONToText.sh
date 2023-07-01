#!/bin/bash
#
# read DN and youtubeID from a TSV file named "YouTube videos on Looma.txt"
# curl to QTubeai.com to generate a quiz for that YouTube
# write the quiz to text file "/tmp/$DN$youtubeID.txt"

# THEN run a mongo shell script to store the quiz JSON in "quizzes" collection

# using qtubeai.com (no API key required)

cd "/Users/skip/Desktop/looma youtube quizzes"
for file in *.json; do

  echo $file
  cat "$file" | json_pp > "${file}.text"
done
