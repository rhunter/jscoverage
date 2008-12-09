#!/bin/sh

export CC=gcc
export CXX=g++
export MOZ_TOOLS=`pwd`
export PATH=$MOZ_TOOLS/bin:$PATH
mkdir bin
./configure --enable-static --enable-js-static-build
