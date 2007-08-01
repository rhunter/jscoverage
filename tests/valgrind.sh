#!/bin/sh

rm -f VALGRIND.*
export VALGRIND='valgrind --log-file=VALGRIND'
make check
grep --color=always 'ERROR SUMMARY:' VALGRIND.*
