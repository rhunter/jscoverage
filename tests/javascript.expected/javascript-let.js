/* automatically generated by JSCoverage - do not edit */
if (! top._$jscoverage) {
  top._$jscoverage = {};
}
var _$jscoverage = top._$jscoverage;
if (! _$jscoverage['javascript-let.js']) {
  _$jscoverage['javascript-let.js'] = [];
  _$jscoverage['javascript-let.js'][5] = 0;
  _$jscoverage['javascript-let.js'][6] = 0;
  _$jscoverage['javascript-let.js'][11] = 0;
  _$jscoverage['javascript-let.js'][15] = 0;
  _$jscoverage['javascript-let.js'][16] = 0;
  _$jscoverage['javascript-let.js'][17] = 0;
  _$jscoverage['javascript-let.js'][20] = 0;
  _$jscoverage['javascript-let.js'][22] = 0;
  _$jscoverage['javascript-let.js'][23] = 0;
  _$jscoverage['javascript-let.js'][24] = 0;
  _$jscoverage['javascript-let.js'][26] = 0;
  _$jscoverage['javascript-let.js'][27] = 0;
  _$jscoverage['javascript-let.js'][28] = 0;
  _$jscoverage['javascript-let.js'][30] = 0;
  _$jscoverage['javascript-let.js'][33] = 0;
  _$jscoverage['javascript-let.js'][34] = 0;
  _$jscoverage['javascript-let.js'][35] = 0;
  _$jscoverage['javascript-let.js'][36] = 0;
  _$jscoverage['javascript-let.js'][37] = 0;
  _$jscoverage['javascript-let.js'][39] = 0;
  _$jscoverage['javascript-let.js'][42] = 0;
  _$jscoverage['javascript-let.js'][43] = 0;
  _$jscoverage['javascript-let.js'][45] = 0;
  _$jscoverage['javascript-let.js'][46] = 0;
  _$jscoverage['javascript-let.js'][48] = 0;
  _$jscoverage['javascript-let.js'][51] = 0;
  _$jscoverage['javascript-let.js'][52] = 0;
  _$jscoverage['javascript-let.js'][55] = 0;
  _$jscoverage['javascript-let.js'][56] = 0;
  _$jscoverage['javascript-let.js'][60] = 0;
  _$jscoverage['javascript-let.js'][64] = 0;
  _$jscoverage['javascript-let.js'][65] = 0;
  _$jscoverage['javascript-let.js'][69] = 0;
  _$jscoverage['javascript-let.js'][70] = 0;
  _$jscoverage['javascript-let.js'][71] = 0;
  _$jscoverage['javascript-let.js'][74] = 0;
  _$jscoverage['javascript-let.js'][75] = 0;
  _$jscoverage['javascript-let.js'][76] = 0;
  _$jscoverage['javascript-let.js'][78] = 0;
  _$jscoverage['javascript-let.js'][79] = 0;
}
_$jscoverage['javascript-let.js'].source = ["<span class=\"c\">// https://developer.mozilla.org/en/New_in_JavaScript_1.7</span>","","<span class=\"c\">// let statement</span>","","<span class=\"k\">let</span> <span class=\"k\">(</span>x <span class=\"k\">=</span> x<span class=\"k\">+</span><span class=\"s\">10</span><span class=\"k\">,</span> y <span class=\"k\">=</span> <span class=\"s\">12</span><span class=\"k\">)</span> <span class=\"k\">{</span>","  print<span class=\"k\">(</span>x<span class=\"k\">+</span>y <span class=\"k\">+</span> <span class=\"s\">\"</span><span class=\"t\">\\n</span><span class=\"s\">\"</span><span class=\"k\">);</span>","<span class=\"k\">}</span>","","<span class=\"c\">// let expressions</span>","","print<span class=\"k\">(</span> <span class=\"k\">let</span><span class=\"k\">(</span>x <span class=\"k\">=</span> x <span class=\"k\">+</span> <span class=\"s\">10</span><span class=\"k\">,</span> y <span class=\"k\">=</span> <span class=\"s\">12</span><span class=\"k\">)</span> x<span class=\"k\">+</span>y  <span class=\"k\">+</span> <span class=\"s\">\"&lt;br&gt;</span><span class=\"t\">\\n</span><span class=\"s\">\"</span><span class=\"k\">);</span>","","<span class=\"c\">// let definitions</span>","","<span class=\"k\">if</span> <span class=\"k\">(</span>x <span class=\"k\">&gt;</span> y<span class=\"k\">)</span> <span class=\"k\">{</span>","  <span class=\"k\">let</span> gamma <span class=\"k\">=</span> <span class=\"s\">12.7</span> <span class=\"k\">+</span> y<span class=\"k\">;</span>","  i <span class=\"k\">=</span> gamma <span class=\"k\">*</span> x<span class=\"k\">;</span>","<span class=\"k\">}</span>","","<span class=\"k\">var</span> list <span class=\"k\">=</span> document<span class=\"k\">.</span>getElementById<span class=\"k\">(</span><span class=\"s\">\"list\"</span><span class=\"k\">);</span>","","<span class=\"k\">for</span> <span class=\"k\">(</span><span class=\"k\">var</span> i <span class=\"k\">=</span> <span class=\"s\">1</span><span class=\"k\">;</span> i <span class=\"k\">&lt;=</span> <span class=\"s\">5</span><span class=\"k\">;</span> i<span class=\"k\">++)</span> <span class=\"k\">{</span>","  <span class=\"k\">var</span> item <span class=\"k\">=</span> document<span class=\"k\">.</span>createElement<span class=\"k\">(</span><span class=\"s\">\"LI\"</span><span class=\"k\">);</span>","  item<span class=\"k\">.</span>appendChild<span class=\"k\">(</span>document<span class=\"k\">.</span>createTextNode<span class=\"k\">(</span><span class=\"s\">\"Item \"</span> <span class=\"k\">+</span> i<span class=\"k\">));</span>","","  <span class=\"k\">let</span> j <span class=\"k\">=</span> i<span class=\"k\">;</span>","  item<span class=\"k\">.</span>onclick <span class=\"k\">=</span> <span class=\"k\">function</span> <span class=\"k\">(</span>ev<span class=\"k\">)</span> <span class=\"k\">{</span>","    alert<span class=\"k\">(</span><span class=\"s\">\"Item \"</span> <span class=\"k\">+</span> j <span class=\"k\">+</span> <span class=\"s\">\" is clicked.\"</span><span class=\"k\">);</span>","  <span class=\"k\">}</span><span class=\"k\">;</span>","  list<span class=\"k\">.</span>appendChild<span class=\"k\">(</span>item<span class=\"k\">);</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> varTest<span class=\"k\">()</span> <span class=\"k\">{</span>","  <span class=\"k\">var</span> x <span class=\"k\">=</span> <span class=\"s\">31</span><span class=\"k\">;</span>","  <span class=\"k\">if</span> <span class=\"k\">(</span><span class=\"k\">true</span><span class=\"k\">)</span> <span class=\"k\">{</span>","    <span class=\"k\">var</span> x <span class=\"k\">=</span> <span class=\"s\">71</span><span class=\"k\">;</span>  <span class=\"c\">// same variable!</span>","    alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// 71</span>","  <span class=\"k\">}</span>","  alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// 71</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> letTest<span class=\"k\">()</span> <span class=\"k\">{</span>","  <span class=\"k\">let</span> x <span class=\"k\">=</span> <span class=\"s\">31</span><span class=\"k\">;</span>","  <span class=\"k\">if</span> <span class=\"k\">(</span><span class=\"k\">true</span><span class=\"k\">)</span> <span class=\"k\">{</span>","    <span class=\"k\">let</span> x <span class=\"k\">=</span> <span class=\"s\">71</span><span class=\"k\">;</span>  <span class=\"c\">// different variable</span>","    alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// 71</span>","  <span class=\"k\">}</span>","  alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// 31</span>","<span class=\"k\">}</span>","","<span class=\"k\">function</span> letTests<span class=\"k\">()</span> <span class=\"k\">{</span>","  <span class=\"k\">let</span> x <span class=\"k\">=</span> <span class=\"s\">10</span><span class=\"k\">;</span>","","  <span class=\"c\">// let-statement</span>","  <span class=\"k\">let</span> <span class=\"k\">(</span>x <span class=\"k\">=</span> x <span class=\"k\">+</span> <span class=\"s\">20</span><span class=\"k\">)</span> <span class=\"k\">{</span>","    alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// 30</span>","  <span class=\"k\">}</span>","","  <span class=\"c\">// let-expression</span>","  alert<span class=\"k\">(</span><span class=\"k\">let</span> <span class=\"k\">(</span>x <span class=\"k\">=</span> x <span class=\"k\">+</span> <span class=\"s\">20</span><span class=\"k\">)</span> x<span class=\"k\">);</span>  <span class=\"c\">// 30</span>","","  <span class=\"c\">// let-definition</span>","  <span class=\"k\">{</span>","    <span class=\"k\">let</span> x <span class=\"k\">=</span> x <span class=\"k\">+</span> <span class=\"s\">20</span><span class=\"k\">;</span>  <span class=\"c\">// x here evaluates to undefined</span>","    alert<span class=\"k\">(</span>x<span class=\"k\">);</span>  <span class=\"c\">// undefined + 20 ==&gt; NaN</span>","  <span class=\"k\">}</span>","<span class=\"k\">}</span>","","<span class=\"k\">var</span> x <span class=\"k\">=</span> <span class=\"s\">'global'</span><span class=\"k\">;</span>","<span class=\"k\">let</span> x <span class=\"k\">=</span> <span class=\"s\">42</span><span class=\"k\">;</span>","document<span class=\"k\">.</span>write<span class=\"k\">(</span><span class=\"k\">this</span><span class=\"k\">.</span>x <span class=\"k\">+</span> <span class=\"s\">\"&lt;br&gt;</span><span class=\"t\">\\n</span><span class=\"s\">\"</span><span class=\"k\">);</span>","","<span class=\"c\">// let-scoped variables in for loops</span>","<span class=\"k\">var</span> i<span class=\"k\">=</span><span class=\"s\">0</span><span class=\"k\">;</span>","<span class=\"k\">for</span> <span class=\"k\">(</span> <span class=\"k\">let</span> i<span class=\"k\">=</span>i <span class=\"k\">;</span> i <span class=\"k\">&lt;</span> <span class=\"s\">10</span> <span class=\"k\">;</span> i<span class=\"k\">++</span> <span class=\"k\">)</span>","  document<span class=\"k\">.</span>write<span class=\"k\">(</span>i <span class=\"k\">+</span> <span class=\"s\">\"&lt;br&gt;</span><span class=\"t\">\\n</span><span class=\"s\">\"</span><span class=\"k\">);</span>","","<span class=\"k\">for</span> <span class=\"k\">(</span> <span class=\"k\">let</span> <span class=\"k\">[</span>name<span class=\"k\">,</span>value<span class=\"k\">]</span> <span class=\"k\">in</span> obj <span class=\"k\">)</span>","  document<span class=\"k\">.</span>write<span class=\"k\">(</span><span class=\"s\">\"Name: \"</span> <span class=\"k\">+</span> name <span class=\"k\">+</span> <span class=\"s\">\", Value: \"</span> <span class=\"k\">+</span> value <span class=\"k\">+</span> <span class=\"s\">\"&lt;br&gt;</span><span class=\"t\">\\n</span><span class=\"s\">\"</span><span class=\"k\">);</span>"];
_$jscoverage['javascript-let.js'][5]++;
let (x = x + 10, y = 12) {
  _$jscoverage['javascript-let.js'][6]++;
  print(x + y + "\n");
}
_$jscoverage['javascript-let.js'][11]++;
print(let(x = x + 10, y = 12) x + y + "<br>\n");
_$jscoverage['javascript-let.js'][15]++;
if (x > y) {
  {
    _$jscoverage['javascript-let.js'][16]++;
    let gamma = 12.699999999999999 + y;
    _$jscoverage['javascript-let.js'][17]++;
    i = gamma * x;
  }
}
_$jscoverage['javascript-let.js'][20]++;
var list = document.getElementById("list");
_$jscoverage['javascript-let.js'][22]++;
for (var i = 1; i <= 5; i++) {
  {
    _$jscoverage['javascript-let.js'][23]++;
    var item = document.createElement("LI");
    _$jscoverage['javascript-let.js'][24]++;
    item.appendChild(document.createTextNode("Item " + i));
    _$jscoverage['javascript-let.js'][26]++;
    let j = i;
    _$jscoverage['javascript-let.js'][27]++;
    item.onclick = (function (ev) {
  _$jscoverage['javascript-let.js'][28]++;
  alert("Item " + j + " is clicked.");
});
    _$jscoverage['javascript-let.js'][30]++;
    list.appendChild(item);
  }
}
_$jscoverage['javascript-let.js'][33]++;
function varTest() {
  _$jscoverage['javascript-let.js'][34]++;
  var x = 31;
  _$jscoverage['javascript-let.js'][35]++;
  if (true) {
    _$jscoverage['javascript-let.js'][36]++;
    var x = 71;
    _$jscoverage['javascript-let.js'][37]++;
    alert(x);
  }
  _$jscoverage['javascript-let.js'][39]++;
  alert(x);
}
_$jscoverage['javascript-let.js'][42]++;
function letTest() {
  _$jscoverage['javascript-let.js'][43]++;
  var x = 31;
  {
    _$jscoverage['javascript-let.js'][45]++;
    let x = 71;
    _$jscoverage['javascript-let.js'][46]++;
    alert(x);
  }
  _$jscoverage['javascript-let.js'][48]++;
  alert(x);
}
_$jscoverage['javascript-let.js'][51]++;
function letTests() {
  _$jscoverage['javascript-let.js'][52]++;
  var x = 10;
  _$jscoverage['javascript-let.js'][55]++;
  let (x = x + 20) {
    _$jscoverage['javascript-let.js'][56]++;
    alert(x);
  }
  _$jscoverage['javascript-let.js'][60]++;
  alert(let(x = x + 20) x);
  {
    _$jscoverage['javascript-let.js'][64]++;
    let x = x + 20;
    _$jscoverage['javascript-let.js'][65]++;
    alert(x);
  }
}
_$jscoverage['javascript-let.js'][69]++;
var x = "global";
_$jscoverage['javascript-let.js'][70]++;
var x = 42;
_$jscoverage['javascript-let.js'][71]++;
document.write(this.x + "<br>\n");
_$jscoverage['javascript-let.js'][74]++;
var i = 0;
_$jscoverage['javascript-let.js'][75]++;
for (let i = i; i < 10; i++) {
  _$jscoverage['javascript-let.js'][76]++;
  document.write(i + "<br>\n");
}
_$jscoverage['javascript-let.js'][78]++;
for (let [name, value] in obj) {
  _$jscoverage['javascript-let.js'][79]++;
  document.write("Name: " + name + ", Value: " + value + "<br>\n");
}
