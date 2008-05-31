#!/bin/sh
#    server.sh - test jscoverage-server
#    Copyright (C) 2008 siliconforks.com
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

function shutdown() {
  wget -q -O- --post-data= "http://127.0.0.1:${server_port}/jscoverage-shutdown" > /dev/null
  wait $server_pid
}

function cleanup() {
  rm -fr EXPECTED ACTUAL DIR OUT
  # kill $server_pid
  shutdown
}

trap 'cleanup' 0 1 2 3 15

export PATH=.:..:$PATH

if [ -z "$VALGRIND" ]
then
  delay=0.2
else
  delay=2
fi

rm -fr EXPECTED DIR OUT
mkdir DIR
$VALGRIND jscoverage-server --document-root=recursive --report-dir=DIR &
server_pid=$!
server_port=8080

sleep $delay

wget -q -O- http://127.0.0.1:8080/index.html | diff recursive/index.html -
wget -q -O- http://127.0.0.1:8080/style.css | diff recursive/style.css -
wget -q -O- http://127.0.0.1:8080/unix.txt | diff recursive/unix.txt -
wget -q -O- http://127.0.0.1:8080/windows.txt | diff recursive/windows.txt -
wget -q -O- http://127.0.0.1:8080/image.png | diff recursive/image.png -
wget -q -O- http://127.0.0.1:8080/1/1.html | diff recursive/1/1.html -
wget -q -O- http://127.0.0.1:8080/1/1.css | diff recursive/1/1.css -
wget -q -O- http://127.0.0.1:8080/1/2/2.html | diff recursive/1/2/2.html -
wget -q -O- http://127.0.0.1:8080/1/2/2.css | diff recursive/1/2/2.css -

# test query string
wget -q -O- http://127.0.0.1:8080/index.html?foo | diff recursive/index.html -

# test javascript
wget -q -O- http://127.0.0.1:8080/script.js > OUT
cat recursive.expected/script.js ../report.js | sed 's/@PREFIX@/\//g' | diff - OUT
wget -q -O- http://127.0.0.1:8080/1/1.js > OUT
cat recursive.expected/1/1.js ../report.js | sed 's/@PREFIX@/\//g' | diff - OUT
wget -q -O- http://127.0.0.1:8080/1/2/2.js > OUT
cat recursive.expected/1/2/2.js ../report.js | sed 's/@PREFIX@/\//g' | diff - OUT

# test jscoverage
wget -q -O- http://127.0.0.1:8080/jscoverage.html | diff ../jscoverage.html -
wget -q -O- http://127.0.0.1:8080/jscoverage.css | diff ../jscoverage.css -
wget -q -O- http://127.0.0.1:8080/jscoverage-throbber.gif | diff ../jscoverage-throbber.gif -
wget -q -O- http://127.0.0.1:8080/jscoverage.js > OUT
echo -e 'jscoverage_isServer = true;\r' | cat ../jscoverage.js - | diff - OUT

# load/store
wget --post-data='{}' -q -O- http://127.0.0.1:8080/jscoverage-store > /dev/null
echo -n '{}' | diff - DIR/jscoverage.json
diff ../jscoverage.html DIR/jscoverage.html
diff ../jscoverage.css DIR/jscoverage.css
diff ../jscoverage-throbber.gif DIR/jscoverage-throbber.gif
diff ../jscoverage-sh_main.js DIR/jscoverage-sh_main.js
diff ../jscoverage-sh_javascript.js DIR/jscoverage-sh_javascript.js
diff ../jscoverage-sh_nedit.css DIR/jscoverage-sh_nedit.css
echo -e 'jscoverage_isReport = true;\r' | cat ../jscoverage.js - | diff - DIR/jscoverage.js

# 404 not found
echo 404 > EXPECTED
! curl -f -w '%{http_code}\n' http://127.0.0.1:8080/missing 2> /dev/null > ACTUAL
diff EXPECTED ACTUAL
echo 404 > EXPECTED
! curl -f -w '%{http_code}\n' http://127.0.0.1:8080/jscoverage-missing 2> /dev/null > ACTUAL
diff EXPECTED ACTUAL

# 403 forbidden
echo 403 > EXPECTED
! curl -f -w '%{http_code}\n' http://127.0.0.1:8080/../Makefile.am 2> /dev/null > ACTUAL
diff EXPECTED ACTUAL

## send it a proxy request
#echo 400 > EXPECTED
#! curl -f -w '%{http_code}\n' -x 127.0.0.1:8080 http://siliconforks.com/ 2> /dev/null > ACTUAL
#diff EXPECTED ACTUAL

# kill $server_pid
shutdown

rm -fr DIR
mkdir DIR
$VALGRIND jscoverage-server --port=8081 --document-root=recursive --report-dir=DIR --no-instrument=/1/ &
server_pid=$!
server_port=8081

sleep $delay

wget -q -O- http://127.0.0.1:8081/script.js > OUT
cat recursive.expected/script.js ../report.js | sed 's/@PREFIX@/\//g' | diff - OUT
wget -q -O- http://127.0.0.1:8081/1/1.js | diff recursive/1/1.js -
wget -q -O- http://127.0.0.1:8081/1/2/2.js | diff recursive/1/2/2.js -

# kill $server_pid
shutdown

$VALGRIND jscoverage-server --port 8082 --document-root recursive --report-dir DIR --no-instrument 1/ &
server_pid=$!
server_port=8082

sleep $delay

wget -q -O- http://127.0.0.1:8082/script.js > OUT
cat recursive.expected/script.js ../report.js | sed 's/@PREFIX@/\//g' | diff - OUT
wget -q -O- http://127.0.0.1:8082/1/1.js | diff recursive/1/1.js -
wget -q -O- http://127.0.0.1:8082/1/2/2.js | diff recursive/1/2/2.js -
