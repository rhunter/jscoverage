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

if (window.opener) {
  /*
  Presumably we are in inverted mode.
  */
  if (('_$jscoverage' in window.opener.top) && ('_$jscoverage' in window)) {
    /*
    Presumably the opener has already set our _$jscoverage to point to the
    opener's _$jscoverage.  We don't have to do anything.
    */
  }
  else if ('_$jscoverage' in window.opener.top) {
    /*
    Presumably the opener has already run its tests.
    */
    window._$jscoverage = window.opener.top._$jscoverage;
  }
  else if ('_$jscoverage' in window) {
    /*
    Presumably the opener has not run its tests yet.  Not sure why there is a
    _$jscoverage object here already; we'll assume whoever put it here knew
    what they were doing, and we'll us it.
    */
    window.opener.top._$jscoverage = window._$jscoverage;
  }
  else {
    window.opener.top._$jscoverage = window._$jscoverage = {};
  }
}
else {
  /*
  No opener.  This is what happens when jscoverage.html is opened in a web
  browser.
  */
  if (!('_$jscoverage' in window)) {
    window._$jscoverage = {};
  }
}

var gCurrentFile = null;
var gCurrentLine = null;
var gCurrentSource = null;
var gCurrentLines = null;
var gMissing = null;
var gInLengthyOperation = false;

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

/**
Indicates visually that a lengthy operation has begun.  The progress bar is
displayed, and the cursor is changed to busy (on browsers which support this).
*/
function beginLengthyOperation() {
  gInLengthyOperation = true;

  var progressBar = document.getElementById('progressBar');
  progressBar.style.visibility = 'visible';
  ProgressBar.setPercentage(progressBar, 0);
  var progressLabel = document.getElementById('progressLabel');
  progressLabel.style.visibility = 'visible';

  /* blacklist buggy browsers */
  if (BrowserDetect.browser === 'Opera' || BrowserDetect.browser === 'Safari') {
    return;
  }
  var body = document.getElementsByTagName('body').item(0);
  /*
  Change the cursor style of each element.  Note that changing the class of the
  element (to one with a busy cursor) is buggy in IE.
  */
  body.style.cursor = 'wait';
  var tabs = document.getElementById('tabs').getElementsByTagName('div');
  var i;
  for (i = 0; i < tabs.length; i++) {
    tabs.item(i).style.cursor = 'wait';
  }
}

/**
Removes the progress bar and busy cursor.
*/
function endLengthyOperation() {
  gInLengthyOperation = false;

  var progressBar = document.getElementById('progressBar');
  progressBar.style.visibility = 'hidden';
  var progressLabel = document.getElementById('progressLabel');
  progressLabel.style.visibility = 'hidden';
  progressLabel.innerHTML = '';
  var body = document.getElementsByTagName('body').item(0);
  body.style.cursor = '';
  var tabs = document.getElementById('tabs').getElementsByTagName('div');
  var i;
  for (i = 0; i < tabs.length; i++) {
    tabs.item(i).style.cursor = '';
  }
}

/**
Sets the sizes of various elements according to the viewport size.  This
function must be called:
1. When the document is loaded
2. When the window is resized
3. When a tab is selected
*/
function setSize() {
  var viewportHeight = getViewportHeight();

  /*
  border-top-width:     1px
  padding-top:         10px
  padding-bottom:      10px
  border-bottom-width:  1px
  margin-bottom:       10px
                       ----
                       32px
  */
  var tabPages = document.getElementById('tabPages');
  tabPages.style.height = (viewportHeight - findPos(tabPages) - 32) + 'px';

  var browserIframe = document.getElementById('browserIframe');
  // may not exist if we have removed the first tab
  if (browserIframe) {
    browserIframe.height = viewportHeight - findPos(browserIframe) - 23;
  }

  var summaryDiv = document.getElementById('summaryDiv');
  summaryDiv.style.height = (viewportHeight - findPos(summaryDiv) - 21) + 'px';

  var sourceDiv = document.getElementById('sourceDiv');
  sourceDiv.style.height = (viewportHeight - findPos(sourceDiv) - 21) + 'px';
}

function getBooleanValue(s) {
  s = s.toLowerCase();
  if (s === 'false' || s === 'f' || s === 'no' || s === 'n' || s === 'off' || s === '0') {
    return false;
  }
  return true;
}

function body_load() {
  if (window.opener) {
    var tabs = document.getElementById('tabs');
    var browserTab = document.getElementById('browserTab');
    tabs.removeChild(browserTab);
    var tabPages = document.getElementById('tabPages');
    var browserTabPage = tabPages.getElementsByTagName('div').item(0);
    tabPages.removeChild(browserTabPage);
  }

  var progressBar = document.getElementById('progressBar');
  ProgressBar.init(progressBar);

  initTabControl();

  setSize();

  // check if a URL was passed in the query string
  var queryString, parameters, parameter, i, index, url, name, value;
  if (location.search.length > 0) {
    queryString = location.search.substring(1);
    parameters = queryString.split(/&|;/);
    for (i = 0; i < parameters.length; i++) {
      parameter = parameters[i];
      index = parameter.indexOf('=');
      if (index === -1) {
        // still works with old syntax
        url = parameter;
      }
      else {
        name = parameter.substr(0, index);
        value = parameter.substr(index + 1);
        if (name === 'missing' || name === 'm') {
          gMissing = getBooleanValue(value);
        }
        else if (name === 'url' || name === 'u') {
          url = value;
        }
      }
    }
  }

  var checkbox = document.getElementById('checkbox');
  checkbox.checked = gMissing;
  if (gMissing) {
    appendMissingColumn();
  }

  // this will automatically propagate to the input field
  if (url) {
    frames[0].location = url;
  }

  if (window.opener) {
    recalculateSummaryTab();
  }
}

function body_resize() {
  setSize();
}

// -----------------------------------------------------------------------------
// tab 1

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

// -----------------------------------------------------------------------------
// tab 2

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

  var totals = { files:0, statements:0, executed:0, coverage:0, skipped:0 };

  var rowCounter = 0;
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

    var percentage = ( num_statements === 0 ? 0 : parseInt(100 * num_executed / num_statements) );

    var row = document.createElement("tr");
    row.className = ( rowCounter++ % 2 == 0 ? "odd" : "even" );

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
    if( num_statements === 0 ) {
        covered.className = "skipped";
        pct.appendChild(document.createTextNode("N/A"));
    } else {
        covered.className = "covered";
        covered.style.width = percentage + "px";
        pct.appendChild(document.createTextNode(percentage + '%'));
    }
    pct.className = "pct";
    pctGraph.appendChild(covered);
    cell.appendChild(pctGraph);
    cell.appendChild(pct);
    row.appendChild(cell);

    if (gMissing) {
      cell = document.createElement("td");
      for (i = 0; i < missing.length; i++) {
        if (i !== 0) {
          cell.appendChild(document.createTextNode(", "));
        }
        link = createLink(file, missing[i]);
        cell.appendChild(link);
      }
      row.appendChild(cell);
    }

    tbody.appendChild(row);

    totals['files'] ++;
    totals['statements'] += num_statements;
    totals['executed'] += num_executed;
    totals['coverage'] += percentage;
    if( num_statements === 0 ) {
        totals['skipped']++;
    }

    // write totals data into summaryTotals row
    var tr = document.getElementById("summaryTotals");
    if (tr) {
        var tds = tr.getElementsByTagName("td");
        tds[0].getElementsByTagName("span")[1].firstChild.nodeValue = totals['files'];
        tds[1].firstChild.nodeValue = totals['statements'];
        tds[2].firstChild.nodeValue = totals['executed'];

        var coverage = parseInt(totals['coverage'] / ( totals['files'] - totals['skipped'] ) );
        if( isNaN( coverage ) ) {
            coverage = 0;
        }
        tds[3].getElementsByTagName("span")[0].firstChild.nodeValue = coverage + '%';
        tds[3].getElementsByTagName("div")[1].style.width = coverage + 'px';
    }

  }
  endLengthyOperation();
}

function appendMissingColumn() {
  var headerRow = document.getElementById('headerRow');
  var missingHeader = document.createElement('th');
  missingHeader.id = 'missingHeader';
  missingHeader.innerHTML = '<abbr title="List of statements missed during execution">Missing</abbr>';
  headerRow.appendChild(missingHeader);
  var summaryTotals = document.getElementById('summaryTotals');
  var empty = document.createElement('td');
  empty.id = 'missingCell';
  summaryTotals.appendChild(empty);
}

function removeMissingColumn() {
  var missingNode;
  missingNode = document.getElementById('missingHeader');
  missingNode.parentNode.removeChild(missingNode);
  missingNode = document.getElementById('missingCell');
  missingNode.parentNode.removeChild(missingNode);
}

function checkbox_click() {
  if (gInLengthyOperation) {
    return false;
  }
  beginLengthyOperation();
  setTimeout(function() {
    var checkbox = document.getElementById('checkbox');
    gMissing = checkbox.checked;
    if (gMissing) {
      appendMissingColumn();
    }
    else {
      removeMissingColumn();
    }
    recalculateSummaryTab();
  }, 100);
  return true;
}

// -----------------------------------------------------------------------------
// tab 3

function makeTable() {
  var coverage = _$jscoverage[gCurrentFile];
  var lines = gCurrentLines;
  var rows = ['<table id="sourceTable">'];
  var i = 0;
  var progressBar = document.getElementById('progressBar');
  var tableHTML;
  var oldDate = new Date().valueOf();
  function makeTableRows() {
    while (i < lines.length) {
      var lineNumber = i + 1;
  
      var row = '<tr>';
      row += '<td class="numeric">' + lineNumber + '</td>';
      if (coverage[lineNumber] !== undefined) {
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
      rows[lineNumber] = row;
      i++;
      var newDate = new Date().valueOf();
      if (newDate - oldDate > 250) {
        oldDate = newDate;
        ProgressBar.setPercentage(progressBar, parseInt(50 * i / lines.length));
        setTimeout(makeTableRows, 0);
        return;
      }
    }
    rows[i + 1] = '</table>';
    ProgressBar.setPercentage(progressBar, 50);
    setTimeout(joinTableRows, 0);
  }

  function joinTableRows() {
    tableHTML = rows.join('');
    ProgressBar.setPercentage(progressBar, 75);
    /*
    This may be a long delay, so set a timeout of 100 ms to make sure the
    display is updated.
    */
    setTimeout(appendTable, 100);
  }

  function appendTable() {
    var sourceDiv = document.getElementById('sourceDiv');
    while (sourceDiv.hasChildNodes()) {
      sourceDiv.removeChild(sourceDiv.firstChild);
    }
    sourceDiv.innerHTML = tableHTML;
    ProgressBar.setPercentage(progressBar, 100);
    setTimeout(scrollToLine, 0);
  }

  setTimeout(makeTableRows, 0);
}

function countLines(text) {
  var length = text.length;
  var pos = 0;
  var count = 0;
  while (pos < length) {
    count++;
    pos = text.indexOf('\n', pos);
    if (pos == -1) {
      break;
    }
    pos++;
  }
  return count;
}

function highlightSource() {
  var progressLabel = document.getElementById('progressLabel');
  progressLabel.innerHTML = 'Loading source ...';

  // set file name
  var fileDiv = document.getElementById('fileDiv');
  fileDiv.innerHTML = gCurrentFile;

  // highlight source and break into lines
  var builder = {
    lines: [],
    currentLine: null,
    _initCurrentLine: function() {
      if (this.currentLine === null) {
        this.currentLine = "";
      }
    },
    startElement: function(style) {
      this._initCurrentLine();
      this.currentLine += '<span class="' + style + '">';
    },
    endElement: function() {
      this._initCurrentLine();
      this.currentLine += '</span>';
    },
    text: function(s) {
      this._initCurrentLine();
      if (s === '\r\n' || s === '\r' || s === '\n') {
        this.close();
        this.currentLine = null;
      }
      else {
        this.currentLine += s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    },
    close: function() {
      if (this.currentLine !== null) {
        this.lines.push(this.currentLine);
      }
    }
  };
  var progressBar = document.getElementById('progressBar');
  var numLines = countLines(gCurrentSource);
  var oldDate = new Date().valueOf();
  var i = 0;
  function updateFunction() {
    i++;
    var newDate = new Date().valueOf();
    if (newDate - oldDate > 250) {
      ProgressBar.setPercentage(progressBar, parseInt(100 * i / numLines));
      oldDate = newDate;
      return true;
    }
    else {
      return false;
    }
  }
  sh_highlightString(gCurrentSource, sh_languages['javascript'], builder, updateFunction, function() {
    builder.close();
    gCurrentLines = builder.lines;
    ProgressBar.setPercentage(progressBar, 100);
    // coverage
    recalculateSourceTab();
  });
}

function scrollToLine() {
  selectTab('sourceTab');
  if (! window.gCurrentLine) {
    endLengthyOperation();
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
  endLengthyOperation();
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
  selectTab('sourceTab');
  endLengthyOperation();
}

/**
Loads the given file (and optional line) in the source tab.
*/
function get(file, line) {
  if (gInLengthyOperation) {
    return;
  }
  beginLengthyOperation();
  if (file === gCurrentFile) {
    setTimeout(function() {
      selectTab('sourceTab');
      gCurrentLine = line;
      recalculateSourceTab();
    }, 50);
  }
  else {
    if (gCurrentFile === null) {
      var tab = document.getElementById('sourceTab');
      tab.className = '';
      tab.onclick = tab_click;
    }
    setTimeout(function() {
      selectTab('sourceTab');
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
              highlightSource();
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
    }, 50);
  }
}

/**
Calculates coverage statistics for the current source file.
*/
function recalculateSourceTab() {
  if (! gCurrentFile) {
    endLengthyOperation();
    return;
  }
  var progressLabel = document.getElementById('progressLabel');
  progressLabel.innerHTML = 'Calculating coverage ...';
  var progressBar = document.getElementById('progressBar');
  ProgressBar.setPercentage(progressBar, 0);
  setTimeout(makeTable, 0);
}

// -----------------------------------------------------------------------------
// tabs

/**
Initializes the tab control.  This function must be called when the document is
loaded.
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

/**
Selects a tab.
@param  tab  the integer index of the tab (0, 1, 2, or 3)
             OR
             the ID of the tab element
             OR
             the tab element itself
*/
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

/**
Returns an integer (0, 1, 2, or 3) representing the index of a given tab.
@param  tab  the ID of the tab element
             OR
             the tab element itself
*/
function tabIndexOf(tab) {
  if (typeof tab === 'string') {
    tab = document.getElementById(tab);
  }
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
  if (gInLengthyOperation) {
    return;
  }
  var target;
  if (e) {
    target = e.target;
  }
  else if (window.event) {
    // IE
    target = window.event.srcElement;
  }
  if (target.className === 'selected') {
    return;
  }
  beginLengthyOperation();
  setTimeout(function() {
    selectTab(target);
    if (target.id === 'summaryTab') {
      recalculateSummaryTab();
    }
    else if (target.id === 'sourceTab') {
      recalculateSourceTab();
    }
    else {
      endLengthyOperation();
    }
  }, 50);
}

// -----------------------------------------------------------------------------
// progress bar

var ProgressBar = {
  init: function(element) {
    element._percentage = 0;

    /* doing this via JavaScript crashes Safari */
/*
    var pctGraph = document.createElement('div');
    pctGraph.className = 'pctGraph';
    element.appendChild(pctGraph);
    var covered = document.createElement('div');
    covered.className = 'covered';
    pctGraph.appendChild(covered);
    var pct = document.createElement('span');
    pct.className = 'pct';
    element.appendChild(pct);
*/

    ProgressBar._update(element);
  },
  setPercentage: function(element, percentage) {
    element._percentage = percentage;
    ProgressBar._update(element);
  },
  _update: function(element) {
    var pctGraph = element.getElementsByTagName('div').item(0);
    var covered = pctGraph.getElementsByTagName('div').item(0);
    var pct = element.getElementsByTagName('span').item(0);
    pct.innerHTML = element._percentage.toString() + '%';
    covered.style.width = element._percentage + 'px';
  }
};

// -----------------------------------------------------------------------------
// browser detection

// http://www.quirksmode.org/js/detect.html
var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();
