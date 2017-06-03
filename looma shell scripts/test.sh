#!/bin/bash
cd '../../content/Wikipedia for Schools/wp/index/'
pwd

while read -r line  || [[ -n "$line" ]]; do

    REGEX='\<td style="padding-right\:2em"\>\<a href="\.\.\/\.\.\/wp\/.\/(.*)”\>(.*)\<\/a.*’
    if [[ $line =~ $REGEX ]]; 
    then 
        activity=${BASH_REMATCH[1]} 
        
        echo "activity is: " $activity
    fi  
done < subject.Mathematics.htm