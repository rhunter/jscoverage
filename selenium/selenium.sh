#!/bin/sh

set -e

trap cleanup 0 1 2 3 15

cleanup() {
  kill $server_pid
  kill $selenium_server_pid
}

java -cp build Server ../doc/instrumented > server.out 2> server.err &
server_pid=$!

java -jar selenium-server.jar -multiWindow > selenium.out 2> selenium.err &
selenium_server_pid=$!

# wait for the HTTP server to start
while ! netstat -a -n --inet --inet6 | grep -q :::8000
do
  sleep 0.1
done

# wait for the selenium server to start
while ! netstat -a -n --inet --inet6 | grep -q :::4444
do
  sleep 0.1
done

java -cp junit.jar:selenium-java-client-driver.jar:build junit.textui.TestRunner JSCoverageTest
