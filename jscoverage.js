/*
    jscoverage.js - code coverage for JavaScript
    Copyright (C) 2007 siliconforks.com

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

if (!('_$jscoverage' in window)) {
  window._$jscoverage = {};
}

var gCurrentFile = null;
var gCurrentLine = null;
var gCurrentSource = null;
var gCurrentLines = null;

// http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
  var result = 0;
  do {
    result += obj.offsetTop;
    obj = obj.offsetParent;
  }
  while (obj);
  return result;
}

// http://www.quirksmode.org/viewport/compatibility.html
function getViewportHeight() {
  if (self.innerHeight) {
    // all except Explorer
    return self.innerHeight;
  }
  else if (document.documentElement && document.documentElement.clientHeight) {
    // Explorer 6 Strict Mode
    return document.documentElement.clientHeight;
  }
  else if (document.body) {
    // other Explorers
    return document.body.clientHeight;
  }
  else {
    throw "Couldn't calculate viewport height";
  }
}

function lengthyOperation(f) {
  var body = document.getElementsByTagName('body').item(0);
  body.className = 'busy';
  setTimeout(function() {
    try {
      f();
    }
    finally {
      body.className = '';
      body = null;
    }
  }, 0);
}

function setSize() {
  var viewportHeight = getViewportHeight();

  /*
  padding-top:         10px
  border-top-width:     1px
  border-bottom-width:  1px
  padding-bottom:      10px
  margin-bottom:       10px
                       ----
                       32px
  */
  var tabPages = document.getElementById('tabPages');
  var tabPagesHeight = (viewportHeight - findPos(tabPages) - 32) + 'px';
  tabPages.style.height = tabPagesHeight;

  var browserIframe = document.getElementById('browserIframe');
  browserIframe.height = viewportHeight - findPos(browserIframe) - 23;

  var coverageSummaryDiv = document.getElementById('summaryDiv');
  coverageSummaryDiv.style.height = tabPagesHeight;

  var sourceDiv = document.getElementById('sourceDiv');
  var sourceDivHeight = (viewportHeight - findPos(sourceDiv) - 23) + 'px';
  sourceDiv.style.height = sourceDivHeight;
}

function body_load() {
  initTabControl();
  setSize();

  // check if a URL was passed in the query string
  if (location.search.length > 0) {
    var url = location.search.substring(1);
    // this will automatically propagate to the input field
    frames[0].location = url;
  }
}

function body_resize() {
  setSize();
}

/*******************************************************************************
tab 1
*/

function updateBrowser() {
  var input = document.getElementById("location");
  frames[0].location = input.value;
}

function updateInput() {
  var input = document.getElementById("location");
  input.value = frames[0].location;
}

function input_keypress(e) {
  if (e.keyCode === 13) {
    updateBrowser();
  }
}

function button_click() {
  updateBrowser();
}

function browser_load() {
  updateInput();
}

/*******************************************************************************
tab 2
*/

function createLink(file, line) {
  var link = document.createElement("a");

  var url;
  var call;
  var text;
  if (line) {
    url = file + ".jscoverage.html?" + line;
    call = "get('" + file + "', " + line + ");";
    text = line.toString();
  }
  else {
    url = file + ".jscoverage.html";
    call = "get('" + file + "');";
    text = file;
  }

  link.setAttribute('href', 'javascript:' + call);
  link.appendChild(document.createTextNode(text));

  return link;
}

function recalculateSummaryTab(cc) {
  if (! cc) {
    cc = window._$jscoverage;
  }
  if (! cc) {
    throw "No coverage information found.";
  }

  var tbody = document.getElementById("summaryTbody");
  while (tbody.hasChildNodes()) {
    tbody.removeChild(tbody.firstChild);
  }

  var totals = { files:0, statements:0, executed:0, coverage:0 };

  for (var file in cc) {
    var i;
    var num_statements = 0;
    var num_executed = 0;
    var missing = [];
    var length = cc[file].length;
    for (i = 0; i < length; i++) {
      if (cc[file][i] === undefined) {
        continue;
      }
      else if (cc[file][i] === 0) {
        missing.push(i);
      }
      else {
        num_executed++;
      }
      num_statements++;
    }

    var percentage = parseInt(100 * num_executed / num_statements);

    var row = document.createElement("tr");

    var cell = document.createElement("td");
    var link = createLink(file);
    cell.appendChild(link);

    row.appendChild(cell);

    cell = document.createElement("td");
    cell.className = 'numeric';
    cell.appendChild(document.createTextNode(num_statements));
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.className = 'numeric';
    cell.appendChild(document.createTextNode(num_executed));
    row.appendChild(cell);

    // new coverage td containing a bar graph
    cell = document.createElement("td");
    cell.className = 'coverage';
    var pctGraph = document.createElement("div"),
        covered = document.createElement("div"),
        pct = document.createElement("span");
    pctGraph.className = "pctGraph";
    covered.className = "covered";
    covered.style.width = percentage + 'px';
    pct.className = "pct";
    pct.appendChild(document.createTextNode(percentage + '%'));
    pctGraph.appendChild(covered);
    cell.appendChild(pctGraph);
    cell.appendChild(pct);
    row.appendChild(cell);


    cell = document.createElement("td");
    for (i = 0; i < missing.length; i++) {
      if (i !== 0) {
        cell.appendChild(document.createTextNode(", "));
      }
      link = createLink(file, missing[i]);
      cell.appendChild(link);
    }
    row.appendChild(cell);

    tbody.appendChild(row);

    totals['files'] ++;
    totals['statements'] += num_statements;
    totals['executed'] += num_executed;
    totals['coverage'] += percentage;

    // write totals data into summaryTotals row
    var tr = document.getElementById("summaryTotals");
    if (tr) {
        var tds = tr.getElementsByTagName("td");
        tds[0].getElementsByTagName("span")[1].firstChild.nodeValue = totals['files'];
        tds[1].firstChild.nodeValue = totals['statements'];
        tds[2].firstChild.nodeValue = totals['executed'];

        var coverage = parseInt(totals['coverage'] / totals['files']);
        tds[3].getElementsByTagName("span")[0].firstChild.nodeValue = coverage + '%';
        tds[3].getElementsByTagName("div")[1].style.width = coverage + 'px';
    }

  }
}

/*******************************************************************************
tab 3
*/

function makeTable() {
  var rows = [];
  var coverage = _$jscoverage[gCurrentFile];
  var lines = gCurrentLines;
  var i;
  for (i = 0; i < lines.length; i++) {
    var lineNumber = i + 1;

    var row = '<tr>';
    row += '<td class="numeric">' + lineNumber + '</td>';
    if (lineNumber in coverage) {
      var timesExecuted = coverage[lineNumber];
      if (timesExecuted === 0) {
        row += '<td class="r numeric" id="line-' + lineNumber + '">';
      }
      else {
        row += '<td class="g numeric">';
      }
      row += timesExecuted;
      row += '</td>';
    }
    else {
      row += '<td></td>';
    }
    row += '<td><pre class="sh_sourceCode sh_javascript">' + lines[i] + '</pre></td>';
    row += '</tr>';
    row += '\n';
    rows[i] = row;
  }
  var result = rows.join('');
  var sourceDiv = document.getElementById('sourceDiv');
  while (sourceDiv.hasChildNodes()) {
    sourceDiv.removeChild(sourceDiv.firstChild);
  }
  sourceDiv.innerHTML = '<table id="sourceTable">' + result + '</table>';
}

function highlightSource() {
  // set file name
  var fileDiv = document.getElementById('fileDiv');
  fileDiv.innerHTML = gCurrentFile;

  // highlight source and break into lines
  var pre = document.createElement('pre');
  pre.appendChild(document.createTextNode(gCurrentSource));
  sh_highlightElement(document, pre, sh_languages['javascript']);
  var source = pre.innerHTML;
  var length = source.length;
  var endOfLinePattern = /\r\n|\r|\n/g;
  endOfLinePattern.lastIndex = 0;
  var lines = [];
  var i = 0;
  while (i < length) {
    var start = i;
    var end;
    var startOfNextLine;
    var endOfLineMatch = endOfLinePattern.exec(source);
    if (endOfLineMatch === null) {
      end = length;
      startOfNextLine = length;
    }
    else {
      end = endOfLineMatch.index;
      startOfNextLine = endOfLinePattern.lastIndex;
    }
    var line = source.substring(start, end);
    lines.push(line);
    i = startOfNextLine;
  }
  gCurrentLines = lines;

  // coverage
  recalculateSourceTab();
}

function scrollToLine() {
  setSize();
  selectTab(2);
  if (! window.gCurrentLine) {
    return;
  }
  var div = document.getElementById('sourceDiv');
  if (gCurrentLine === 1) {
    div.scrollTop = 0;
  }
  else {
    var cell = document.getElementById('line-' + gCurrentLine);
    var divOffset = findPos(div);
    var cellOffset = findPos(cell);
    div.scrollTop = cellOffset - divOffset;
  }
  gCurrentLine = 0;
}

function setThrobber() {
  var throbberImg = document.getElementById('throbberImg');
  throbberImg.style.visibility = 'visible';
}

function clearThrobber() {
  var throbberImg = document.getElementById('throbberImg');
  throbberImg.style.visibility = 'hidden';
}

function httpError(file) {
  gCurrentFile = null;
  clearThrobber();
  var fileDiv = document.getElementById('fileDiv');
  fileDiv.innerHTML = '';
  var sourceDiv = document.getElementById('sourceDiv');
  sourceDiv.innerHTML = "Error retrieving document " + file + ".";
  selectTab(2);
}

/**
Loads the given file (and optional line) in the source tab.
*/
function get(file, line) {
  if (file === gCurrentFile) {
    selectTab(2);
    gCurrentLine = line;
    lengthyOperation(recalculateSourceTab);
  }
  else {
    if (gCurrentFile === null) {
      var tab = document.getElementById('sourceTab');
      tab.className = '';
      tab.onclick = tab_click;
    }
    selectTab(2);
    setThrobber();
    // Note that the IE7 XMLHttpRequest does not support file URL's.
    // http://xhab.blogspot.com/2006/11/ie7-support-for-xmlhttprequest.html
    // http://blogs.msdn.com/ie/archive/2006/12/06/file-uris-in-windows.aspx
    var request;
    if (window.ActiveXObject) {
      request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else {
      request = new XMLHttpRequest();
    }
    request.open("GET", file + ".jscoverage.js", true);
    request.onreadystatechange = function(event) {
      if (request.readyState === 4) {
        if (request.status === 0 || request.status === 200) {
          var response = request.responseText;
          // opera returns status zero even if there is a missing file???
          if (response === '') {
            httpError(file);
          }
          else {
            clearThrobber();
            gCurrentFile = file;
            gCurrentLine = line || 1;
            gCurrentSource = response;
            lengthyOperation(highlightSource);
          }
        }
        else {
          httpError(file);
        }
      }
    };
    if ('onerror' in request) {
      request.onerror = function(event) {
        httpError(file);
      };
    }
    try {
      request.send(null);
    }
    catch (e) {
      httpError(file);
    }
  }
}

/**
Calculates coverage statistics for the current source file.
*/
function recalculateSourceTab() {
  if (! gCurrentFile) {
    return;
  }
  makeTable();
  scrollToLine();
}

/*******************************************************************************
tabs
*/

function initTabControl() {
  var tabs = document.getElementById('tabs');
  var i;
  var child;
  var tabNum = 0;
  for (i = 0; i < tabs.childNodes.length; i++) {
    child = tabs.childNodes.item(i);
    if (child.nodeType === 1) {
      if (child.className !== 'disabled') {
        child.onclick = tab_click;
      }
      tabNum++;
    }
  }
  selectTab(0);
}

function selectTab(tab) {
  if (typeof tab !== 'number') {
    tab = tabIndexOf(tab);
  }
  var tabControl = document.getElementById("tabControl");
  var tabs = document.getElementById('tabs');
  var tabPages = document.getElementById('tabPages');
  var i;
  var child;
  var tabNum = 0;
  for (i = 0; i < tabs.childNodes.length; i++) {
    child = tabs.childNodes.item(i);
    if (child.nodeType === 1) {
      if (child.className !== 'disabled') {
        child.className = tabNum === tab? 'selected': '';
      }
      tabNum++;
    }
  }
  tabNum = 0;
  for (i = 0; i < tabPages.childNodes.length; i++) {
    child = tabPages.childNodes.item(i);
    if (child.nodeType === 1) {
      child.style.display = tabNum === tab? 'block': 'none';
      tabNum++;
    }
  }
  setSize();
}

function tabIndexOf(tab) {
  var tabs = document.getElementById('tabs');
  var i;
  var child;
  var tabNum = 0;
  for (i = 0; i < tabs.childNodes.length; i++) {
    child = tabs.childNodes.item(i);
    if (child.nodeType === 1) {
      if (child === tab) {
        return tabNum;
      }
      tabNum++;
    }
  }
  throw "Tab not found";
}

function tab_click(e) {
  var target;
  if (e) {
    target = e.target;
  }
  else if (window.event) {
    // IE
    target = window.event.srcElement;
  }
  selectTab(target);
  if (target.id === 'summaryTab') {
    lengthyOperation(recalculateSummaryTab);
  }
  else if (target.id === 'sourceTab') {
    lengthyOperation(recalculateSourceTab);
  }
}
