#!/bin/bash
#
#  filename: loomaexec
#   VERSION: 1.0
#
#       this file is called from /usr/local/bin/looma
#          1st parameter is an "operation" (or command)
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
echo " - - - LOOMA EXEC - - - "
echo "******************************"

echo "called 'loomaexec' with command  = '@1'"
#
# operations to be implemented
#               report      send identity, configuration, timestamps and usage data to server on AWS
#               timestamps  report timestamps for CODE, CONTENT and MONGO
#               version     report Looma version number