#!/bin/bash

# Author: Akshay Srivatsan
# Date: Summer 2015
# Description: Run this file in terminal to install pico2wave (the speech
#   synthesizer) on a Looma. If installation is successful (and the Looma has
#   speakers), you will hear "Hello, World" when the script finishes.
# Requirements: A Looma running Lubuntu, an internet connection, and speakers.

wget http://launchpadlibrarian.net/156430234/libttspico-utils_1.0%2Bgit20130326-1ubuntu1_armhf.deb

wget http://launchpadlibrarian.net/156430051/libttspico-data_1.0%2Bgit20130326-1ubuntu1_all.deb

wget http://launchpadlibrarian.net/156430233/libttspico0_1.0%2Bgit20130326-1ubuntu1_armhf.deb

sudo dpkg -i libttspico-data_1.0+git20130326-1ubuntu1_all.deb

sudo dpkg -i libttspico0_1.0+git20130326-1ubuntu1_armhf.deb

sudo dpkg -i libttspico-utils_1.0+git20130326-1ubuntu1_armhf.deb

cd /tmp
pico2wave -w test000001.wav "Hello, World"
aplay test000001.wav
rm test000001.wav
