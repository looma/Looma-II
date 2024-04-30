# echo to console if not silent mode
display() { if [ ! $silent ]
    then echo $1
    else
      echo $1 > /tmp/updatelog.txt
  fi
 }

instructions () {
  display "show help instructions here"
}

while getopts ":scdxh" option; do
   case $option in
      s) # operate silently. no user input, no terminal output
         silent=true;;
      c) # update the Looma code
           updatecode=true;;
      d) # update the Looma database
         updatedatabase=true;;
      x) # update the Looma content
        updatecontent=true;;
      h) # print help instructions
        instructions; exit;;
   esac
done


if [ $silent ]; then echo 'silent is ON'; fi
if [ $updatecode ]; then echo 'updatecode is ON'; fi
if [ $updatedatabase ]; then echo 'updatedatabase is ON'; fi
if [ $updatecontent ]; then echo 'updatecontent is ON'; fi

if [[ ! $silent ]]; then echo 'silent is OFF'; fi
if [[ ! $updatecode ]]; then echo 'updatecode is OFF'; fi
if [[ ! $updatedatabase ]]; then echo 'updatedatabase is OFF'; fi
if [[ ! $updatecontent ]]; then echo 'updatecontent is OFF'; fi


userinput() { echo -n  $1; read input; }

userinput "enter Y or N:\ "
echo $input
