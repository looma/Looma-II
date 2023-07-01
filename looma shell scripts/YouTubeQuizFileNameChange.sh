#!/bin/bash
#eai.com (no API key required)

cd "/Users/skip/Desktop/looma youtube quizzes/Looma YouTube quizzes formatted"

for file in *
do
  echo; echo "processing ${file}"

  [[ $file =~ ^(.*)(.{11})\.text ]]
  DN=${BASH_REMATCH[1]}
  youtubeID=${BASH_REMATCH[2]}

  echo "[${youtubeID}]${DN}.quiz"
  cp "$file" "[${youtubeID}]${DN}.quiz"

done