#!/bin/sh

export CC=gcc
export CXX=g++
export CPP="gcc -E"
export CXXCPP="g++ -E"
export LD=ld
export AS=as

export MOZ_TOOLS=`pwd`/moztools
export PATH=$MOZ_TOOLS/bin:$PATH

./configure --disable-jit --enable-static --enable-js-static-build
