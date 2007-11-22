#!/bin/sh
#    recursive-no-instrument.sh - test `--no-instrument' option
#    Copyright (C) 2007 siliconforks.com
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

trap 'rm -fr EXPECTED DIR' 1 2 3 15

export PATH=.:..:$PATH

rm -fr DIR
rm -fr EXPECTED
cp -r recursive.expected EXPECTED
find EXPECTED -depth -name .svn -exec rm -fr {} \;
cp recursive/script.js EXPECTED
rm EXPECTED/script.js.jscoverage.html
cp recursive/1/1.js EXPECTED/1/1.js.jscoverage.js
cp recursive/1/2/2.js EXPECTED/1/2
rm EXPECTED/1/2/2.js.jscoverage.html
cp ../jscoverage*.css ../jscoverage*.gif ../jscoverage*.html ../jscoverage*.js EXPECTED

$VALGRIND jscoverage --exclude=.svn --exclude=1/.svn --exclude=1/2/.svn --no-instrument 1/2 --no-instrument=script.js recursive DIR
test -d DIR
diff --strip-trailing-cr -r EXPECTED DIR

rm -fr EXPECTED DIR
