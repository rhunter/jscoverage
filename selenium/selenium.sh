#!/bin/sh
#    selenium.sh - run Selenium tests
#    Copyright (C) 2008, 2009 siliconforks.com
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

trap cleanup 0 1 2 3 15

cleanup() {
  kill $server_pid
  kill $selenium_server_pid
}

server_is_running() {
  netstat -a -n | grep -q '\(::\|0\.0\.0\.0\):4444'
}

java -cp build Server ../doc/instrumented > server.out 2> server.err &
server_pid=$!

java -jar selenium-server.jar -multiWindow > selenium.out 2> selenium.err &
selenium_server_pid=$!

# wait for the HTTP server to start
while ! server_is_running
do
  sleep 0.1
done

# wait for the selenium server to start
while ! server_is_running
do
  sleep 0.1
done

uname=`uname`
case "$uname" in
  CYGWIN* | MINGW*)
    separator=';'
    ;;
  *)
    separator=':'
    ;;
esac

java -cp "junit.jar${separator}selenium-java-client-driver.jar${separator}build" junit.textui.TestRunner JSCoverageTest
