#!/bin/sh

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
