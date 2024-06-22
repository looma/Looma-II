#!/usr/bin/env bash
# file created by Terminus for AWS Reverse SSH service
# modified for Looma by Skip JUN 2024

set -Eeuo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") [-h] [-a exampleuser] [-r exampleuser]

The reversessh command requires one of two parameters (-a or -r) and exactly one argument to that parameter; the username.

Available options:

-h     Print this help and exit
-a     Adds a user to the Reverse SSH Service
-r     Removes a user from the Reverse SSH Service

As an example, to add a user:

reversessh -a exampleuser

To remove a user:

reversessh -r exampleuser
EOF
  exit
}

msg() {
  echo >&2 -e "${1-}"
}

die() {
  local msg=$1
  local code=${2-1} # default exit status 1
  msg "$msg"
  exit "$code"
}

######################    ADDUSER    ###################
adduser () {
  # Make sure the client name doesn't already exist
  if id "$client" &>/dev/null
  then
    echo "Client name already exists. Please specify a different client name."
    exit 2
  fi
  currentuser=$(logname)     ##  user on the reverse ssh server is looma
  ssh-keygen -b 4096 -t rsa -f "/home/$currentuser/.ssh/$client-id_rsa" -q -N ""
  chown "$currentuser:$currentuser" "/home/$currentuser/.ssh/$client-id_rsa"
  chown "$currentuser:$currentuser" "/home/$currentuser/.ssh/$client-id_rsa.pub"
  hostpubkey=$(cat "/home/$currentuser/.ssh/$client-id_rsa.pub")

  useradd -s "/bin/bash" -d "/home/$client/" -m "$client"
  mkdir "/home/$client/.ssh/"
  ssh-keygen -b 4096 -t rsa -f "/tmp/$client-reversessh" -q -N "" -C "reverse ssh key for $client"
  clientreversessh=$(cat /tmp/$client-reversessh)
  cat "/tmp/$client-reversessh.pub" >> "/home/$client/.ssh/authorized_keys"
  chown -R $client:$client "/home/$client"
  host=$(/bin/curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
  hostport="22"
  cat <<EOT >> "./ReverseSSH-$client-Client.sh"
#!/bin/bash
if [[ \$EUID -ne 0 ]]; then
  echo "This script must be run as root."
  exit 1
fi
user="odroid"     ## user on the remote Looma is 'odroid'
EOT

  echo "echo \"$clientreversessh\" > /home/\$user/.ssh/$client-reversessh" >> "./ReverseSSH-$client-Client.sh"
  echo "echo \"$hostpubkey\" >> /home/\$user/.ssh/authorized_keys" >> "./ReverseSSH-$client-Client.sh"
  echo "host="$host >> "./ReverseSSH-$client-Client.sh"
  echo "hostport="$hostport >> "./ReverseSSH-$client-Client.sh"
  cat <<EOT >> "./ReverseSSH-$client-Client.sh"
chmod 600 "/home/\$user/.ssh/$client-reversessh"
ssh-keyscan -H \$host >> ~/.ssh/known_hosts

#make sure "autossh" is installed
if [ ! \$(which autossh) ]
then
  apt install autossh
fi

#make sure "sshpass" is installed
if [ ! \$(which sshpass) ]
then
  apt install sshpass
fi


remoteID=$client
port=\$(shuf -i49151-65535 -n1)
autosshpath=\$(which autossh)
echo "[Unit]" > /etc/systemd/system/reversessh-$client.service
echo "Description=Autossh" >> /etc/systemd/system/reversessh-$client.service
echo "Wants=network-online.target" >> /etc/systemd/system/reversessh-$client.service
echo "After=network-online.target" >> /etc/systemd/system/reversessh-$client.service
echo "StartLimitIntervalSec=0" >> /etc/systemd/system/reversessh-$client.service
echo "" >> /etc/systemd/system/reversessh-$client.service
echo "[Service]" >> /etc/systemd/system/reversessh-$client.service
echo "ExecStart=\$autosshpath -M 0 -N -o 'ServerAliveInterval 15' -o 'ServerAliveCountMax 3' -o 'ConnectTimeout 10' -o 'ExitOnForwardFailure yes' -i /home/\$user/.ssh/$client-reversessh $client@\$host -p \$hostport -R \$port:localhost:22" >> /etc/systemd/system/reversessh-$client.service
echo "Restart=always" >> /etc/systemd/system/reversessh-$client.service
echo "RestartSec=10" >> /etc/systemd/system/reversessh-$client.service
echo "" >> /etc/systemd/system/reversessh-$client.service
echo "[Install]" >> /etc/systemd/system/reversessh-$client.service
echo "WantedBy=multi-user.target" >> /etc/systemd/system/reversessh-$client.service

systemctl daemon-reload
systemctl start reversessh-$client
systemctl enable reversessh-$client

read -p "enter serial number for this Looma (L00x, N00x, etc): " name
read -p "enter school name or location for this Looma: " school
echo "loomaname: \$name" > /var/www/html/info
echo "loomaschool: \$school" >> /var/www/html/info
echo "remoteID: \$remoteID" >> /var/www/html/info
echo "reverse SSH port: \$port" >> /var/www/html/info
echo "code last updated:    \$(cat /var/www/html/Looma/archivetimestamp.txt) >> /var/www/html/info
echo "content last updated: \$(cat /var/www/html/content/archivetimestamp.txt) >> /var/www/html/info
echo
cat /var/www/html/info
EOT

  rm "/tmp/$client-reversessh"
  rm "/tmp/$client-reversessh.pub"
  echo "Added user: $client"
}

######################  REMOVE USER  ######################
removeuser () {
  su -c "kill -9 -1" $client
  userdel -r $client
  currentuser=$(logname)
  rm -f "/home/$currentuser/.ssh/$client-id_rsa"
  rm -f "/home/$currentuser/.ssh/$client-id_rsa.pub"
  echo "Removed user: $client"
}

# Check that we're running as root.
check_sudo () {
  if [[ $EUID -ne 0 ]]; then
  die "This command must be run as root. Re-run it as: sudo reversessh -h"
fi
}

parse_client() {
  # default values of variables set from clients
  while getopts "a:r:" o; do
      case "${o}" in
          a)
              client=${OPTARG}
              check_sudo
              adduser $client
              ;;
          r)
              client=${OPTARG}
              check_sudo
              removeuser $client
              ;;
          *)
              usage
              ;;
      esac
  done
  shift $((OPTIND-1))

  # check required client parameter and its argument
  [[ -z "${client-}" ]] && die "Missing required action: -h, -a or -r"

  return 0
}

parse_client "$@"