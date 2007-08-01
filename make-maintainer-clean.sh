#!/bin/sh

rm -fr Makefile Makefile.in \
       make-dist.sh make-bin-dist.sh \
       autom4te.cache aclocal.m4 config.cache config.guess config.log config.status config.sub configure \
       depcomp install-sh ltmain.sh missing \
       .deps \
       resources.c \
       jscoverage generate-resources \
       doc/instrumented \
       tests/Makefile tests/Makefile.in tests/.deps

find . -name core -exec rm {} \;
find . -name '*.o' -exec rm {} \;
find . -name '*.gcno' -exec rm {} \;
find . -name '*.gcda' -exec rm {} \;

cd js
make distclean
rm -fr src/*.o src/fdlibm/*.o autom4te.cache
