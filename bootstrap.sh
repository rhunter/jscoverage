#!/bin/sh

set -e

autoreconf --install
./configure CC=gcc CFLAGS='-ggdb3 -O0 -Wall -Wextra' --disable-shared
