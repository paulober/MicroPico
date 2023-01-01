#!/bin/bash
# This script will give your useraccount access to the serial port ttyACM0

THEUSER=""

if [ -v $SUDO_USER ]; then
    THEUSER=$USER
else
    THEUSER=$SUDO_USER
fi

echo "You are ${THEUSER}..."
# !INFO! change /dev/ttyACM0 to your serial port if it is different for your Pico
GROUP=$(stat -c '%G' /dev/ttyACM0)
echo "And get the '${GROUP}' group..."

# add user to group
sudo usermod -a -G $GROUP $THEUSER
echo "Done! Please logout and login again to activate changes."
