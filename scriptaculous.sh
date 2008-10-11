#!/bin/sh

rm -fr scriptaculous scriptaculous-instrumented
mkdir -p scriptaculous/jscoverage
cp -a jscoverage.* report.js jscoverage-throbber.gif scriptaculous/jscoverage
./jscoverage scriptaculous scriptaculous-instrumented
cp -a scriptaculous.js scriptaculous.html scriptaculous-data.html scriptaculous-instrumented/jscoverage
cp -a scriptaculous-js-1.8.1 scriptaculous-instrumented/jscoverage
