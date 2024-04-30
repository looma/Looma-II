#!/bin/bash
#
#  filename: looma
#   VERSION: 1.0
#       put this file in /usr/local/bin on each looma
#       with chmod +x to make it executable
#
#       this file just calls /var/www/html/Looma/looma schell scripts/loomaexec
#          and passes an operation name as 1st parameter
#           other parameters are passed along to loomaexec
#
#       this allows "loomaexec" to execute "operations" like:
#               report
#               timestamps
#               version
#           and other commands that "loomaexec" may choose to implement in the future
#
#       author: skip
#       date:   MAT 2024
echo "******************************"
echo " - - - LOOMA - - - "
echo "******************************"

# for Looma boxes:
source /var/www/html/Looma/looma shell scripts/loomaexec $@
echo "*************DONE*************"
