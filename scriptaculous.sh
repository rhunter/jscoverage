#!/bin/sh

rm -fr scriptaculous scriptaculous-instrumented
mkdir -p scriptaculous/jscoverage
cp -a jscoverage.* jscoverage-throbber.gif scriptaculous/jscoverage
./jscoverage scriptaculous scriptaculous-instrumented
cp -a sh_*.js scriptaculous-instrumented/jscoverage
cp -a scriptaculous.js scriptaculous.html scriptaculous-instrumented/jscoverage
cp -a scriptaculous-data.js.jscoverage.js scriptaculous-data.html scriptaculous-instrumented/jscoverage
cp -a scriptaculous-js-1.7.0 scriptaculous-instrumented/jscoverage
