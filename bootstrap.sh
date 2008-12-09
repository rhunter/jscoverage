#!/bin/sh

set -e

autoreconf --install --no-recursive
./configure CC=gcc CXX=g++ CFLAGS='-ggdb3 -O0 -Wall -Wextra' CXXFLAGS='-ggdb3 -O0 -Wall -Wextra'
