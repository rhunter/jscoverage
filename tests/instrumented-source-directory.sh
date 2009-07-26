#!/bin/sh
#    instrumented-source-directory.sh - try using a source directory which is already instrumented
#    Copyright (C) 2009 siliconforks.com
#
#    This program is free software; you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation; either version 2 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License along
#    with this program; if not, write to the Free Software Foundation, Inc.,
#    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

set -e

trap 'rm -fr DIR OUT ERR' 1 2 3 15

export PATH=.:..:$PATH

$VALGRIND jscoverage --no-highlight --exclude=.svn --exclude=1/.svn --exclude=1/2/.svn recursive.expected DIR > OUT 2> ERR && exit 1
test ! -s OUT
test -s ERR
diff --strip-trailing-cr instrumented-source-directory.expected.err ERR

rm -fr DIR OUT ERR
