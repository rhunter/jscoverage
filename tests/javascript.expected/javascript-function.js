if (! _$jscoverage['javascript-function.js']) {
  _$jscoverage['javascript-function.js'] = [];
  _$jscoverage['javascript-function.js'][1] = 0;
  _$jscoverage['javascript-function.js'][3] = 0;
  _$jscoverage['javascript-function.js'][4] = 0;
  _$jscoverage['javascript-function.js'][7] = 0;
  _$jscoverage['javascript-function.js'][8] = 0;
  _$jscoverage['javascript-function.js'][9] = 0;
  _$jscoverage['javascript-function.js'][12] = 0;
  _$jscoverage['javascript-function.js'][13] = 0;
  _$jscoverage['javascript-function.js'][16] = 0;
  _$jscoverage['javascript-function.js'][17] = 0;
  _$jscoverage['javascript-function.js'][20] = 0;
  _$jscoverage['javascript-function.js'][21] = 0;
  _$jscoverage['javascript-function.js'][24] = 0;
  _$jscoverage['javascript-function.js'][25] = 0;
  _$jscoverage['javascript-function.js'][28] = 0;
  _$jscoverage['javascript-function.js'][29] = 0;
  _$jscoverage['javascript-function.js'][32] = 0;
  _$jscoverage['javascript-function.js'][33] = 0;
  _$jscoverage['javascript-function.js'][36] = 0;
  _$jscoverage['javascript-function.js'][37] = 0;
  _$jscoverage['javascript-function.js'][40] = 0;
  _$jscoverage['javascript-function.js'][41] = 0;
  _$jscoverage['javascript-function.js'][44] = 0;
  _$jscoverage['javascript-function.js'][45] = 0;
  _$jscoverage['javascript-function.js'][48] = 0;
  _$jscoverage['javascript-function.js'][49] = 0;
  _$jscoverage['javascript-function.js'][52] = 0;
  _$jscoverage['javascript-function.js'][53] = 0;
  _$jscoverage['javascript-function.js'][56] = 0;
  _$jscoverage['javascript-function.js'][57] = 0;
  _$jscoverage['javascript-function.js'][61] = 0;
}
_$jscoverage['javascript-function.js'].source = ["<span class=\"k\">function</span> f<span class=\"k\">()</span> <span class=\"k\">{}</span>","","<span class=\"k\">function</span> g<span class=\"k\">()</span> <span class=\"k\">{</span>","  <span class=\"k\">;</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> h<span class=\"k\">()</span> <span class=\"k\">{</span>","  x<span class=\"k\">();</span>","  <span class=\"k\">return</span> <span class=\"s\">'x'</span><span class=\"k\">;</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> i<span class=\"k\">(</span>a<span class=\"k\">)</span> <span class=\"k\">{</span>","  x<span class=\"k\">();</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> j<span class=\"k\">(</span>a<span class=\"k\">,</span> b<span class=\"k\">)</span> <span class=\"k\">{</span>","  x<span class=\"k\">();</span>","<span class=\"k\">}</span>","","x <span class=\"k\">=</span> <span class=\"k\">function</span><span class=\"k\">()</span> <span class=\"k\">{</span>","  x<span class=\"k\">();</span>","<span class=\"k\">}</span><span class=\"k\">;</span>","","x <span class=\"k\">=</span> <span class=\"k\">function</span> k<span class=\"k\">()</span> <span class=\"k\">{</span>","  x<span class=\"k\">();</span>","<span class=\"k\">}</span><span class=\"k\">;</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> <span class=\"k\">()</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)();</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> l<span class=\"k\">()</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)();</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> <span class=\"k\">(</span>a<span class=\"k\">)</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)(</span><span class=\"s\">1</span><span class=\"k\">);</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> m<span class=\"k\">(</span>a<span class=\"k\">)</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)(</span><span class=\"s\">1</span><span class=\"k\">);</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> <span class=\"k\">(</span>a<span class=\"k\">,</span> b<span class=\"k\">)</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)(</span><span class=\"s\">1</span><span class=\"k\">,</span> <span class=\"s\">2</span><span class=\"k\">);</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> n<span class=\"k\">(</span>a<span class=\"k\">,</span> b<span class=\"k\">)</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">)(</span><span class=\"s\">1</span><span class=\"k\">,</span> <span class=\"s\">2</span><span class=\"k\">);</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> <span class=\"k\">()</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">).</span>call<span class=\"k\">(</span>window<span class=\"k\">);</span>","","<span class=\"k\">(</span><span class=\"k\">function</span> o<span class=\"k\">()</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span><span class=\"s\">'x'</span><span class=\"k\">);</span>","<span class=\"k\">}</span><span class=\"k\">).</span>call<span class=\"k\">(</span>window<span class=\"k\">);</span>","","<span class=\"c\">// unusual call</span>","<span class=\"k\">(</span>b <span class=\"k\">-</span> a<span class=\"k\">)();</span>"];
_$jscoverage['javascript-function.js'][1]++;
function f() {
}
_$jscoverage['javascript-function.js'][3]++;
function g() {
  _$jscoverage['javascript-function.js'][4]++;
  ;
}
_$jscoverage['javascript-function.js'][7]++;
function h() {
  _$jscoverage['javascript-function.js'][8]++;
  x();
  _$jscoverage['javascript-function.js'][9]++;
  return "x";
}
_$jscoverage['javascript-function.js'][12]++;
function i(a) {
  _$jscoverage['javascript-function.js'][13]++;
  x();
}
_$jscoverage['javascript-function.js'][16]++;
function j(a, b) {
  _$jscoverage['javascript-function.js'][17]++;
  x();
}
_$jscoverage['javascript-function.js'][20]++;
x = (function () {
  _$jscoverage['javascript-function.js'][21]++;
  x();
});
_$jscoverage['javascript-function.js'][24]++;
x = (function k() {
  _$jscoverage['javascript-function.js'][25]++;
  x();
});
_$jscoverage['javascript-function.js'][28]++;
(function () {
  _$jscoverage['javascript-function.js'][29]++;
  print("x");
})();
_$jscoverage['javascript-function.js'][32]++;
(function l() {
  _$jscoverage['javascript-function.js'][33]++;
  print("x");
})();
_$jscoverage['javascript-function.js'][36]++;
(function (a) {
  _$jscoverage['javascript-function.js'][37]++;
  print("x");
})(1);
_$jscoverage['javascript-function.js'][40]++;
(function m(a) {
  _$jscoverage['javascript-function.js'][41]++;
  print("x");
})(1);
_$jscoverage['javascript-function.js'][44]++;
(function (a, b) {
  _$jscoverage['javascript-function.js'][45]++;
  print("x");
})(1, 2);
_$jscoverage['javascript-function.js'][48]++;
(function n(a, b) {
  _$jscoverage['javascript-function.js'][49]++;
  print("x");
})(1, 2);
_$jscoverage['javascript-function.js'][52]++;
(function () {
  _$jscoverage['javascript-function.js'][53]++;
  print("x");
}).call(window);
_$jscoverage['javascript-function.js'][56]++;
(function o() {
  _$jscoverage['javascript-function.js'][57]++;
  print("x");
}).call(window);
_$jscoverage['javascript-function.js'][61]++;
((b - a))();
