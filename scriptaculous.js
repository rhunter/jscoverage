/*
    scriptaculous.js - script.aculo.us unit tests for JSCoverage
    Copyright (C) 2007, 2008, 2009, 2010 siliconforks.com

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

window.jscoverage_isServer = true;

function initCoverageData() {
  var file = 'scriptaculous-data.js';
  window._$jscoverage[file] = [];
  window._$jscoverage[file][100] = 0;
  window._$jscoverage[file][200] = 1;
  var source = [];
  for (var i = 0; i < 200; i++) {
    source[i] = '';
  }
  source[99] = 'var foo = 1;';
  source[199] = 'var bar = 2;';
  window._$jscoverage[file].source = source;
}

function jsonEquals(json1, json2) {
  if (json1 === null || json2 === null) {
    return json1 === json2;
  }
  else if (json1.constructor === Array && json2.constructor === Array) {
    if (json1.length !== json2.length) {
      return false;
    }
    var length = json1.length;
    for (var i = 0; i < length; i++) {
      if (! jsonEquals(json1[i], json2[i])) {
        return false;
      }
    }
    return true;
  }
  else if (typeof(json1) === 'object' && typeof(json2) === 'object') {
    var i;
    for (i in json1) {
      if (! (i in json2)) {
        return false;
      }
      if (! jsonEquals(json1[i], json2[i])) {
        return false;
      }
    }
    for (i in json2) {
      if (! (i in json1)) {
        return false;
      }
    }
    return true;
  }
  else {
    return json1 === json2;
  }
}

function getSummaryTable() {
  var result = {};
  var summaryTable = document.getElementById('summaryTable');
  var rows = summaryTable.getElementsByTagName('tr');
  for (var i = 0; i < rows.length; i++) {
    var row = rows.item(i);
    var cells = row.getElementsByTagName('td');
    if (cells.length > 0) {
      var links = cells.item(0).getElementsByTagName('a');
      if (links.length > 0) {
        var file = links.item(0).innerHTML;
        result[file] = {};
        result[file].statements = cells.item(1).innerHTML;
        result[file].executed = cells.item(2).innerHTML;
      }
    }
  }
  return result;
}

new Test.Unit.Runner({
  test_init1: function() {
    var opener_$jscoverage = {};
    var window_$jscoverage = {};
    var w = {};
    w.opener = {};
    w.opener.top = {};
    w.opener.top._$jscoverage = opener_$jscoverage;
    w._$jscoverage = window_$jscoverage;
    jscoverage_init(w);
    this.assertIdentical(opener_$jscoverage, w.opener.top._$jscoverage);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init2: function() {
    var opener_$jscoverage = {};
    var w = {};
    w.opener = {};
    w.opener.top = {};
    w.opener.top._$jscoverage = opener_$jscoverage;
    jscoverage_init(w);
    this.assertIdentical(opener_$jscoverage, w.opener.top._$jscoverage);
    this.assertIdentical(opener_$jscoverage, w._$jscoverage);
  },

  test_init3: function() {
    var window_$jscoverage = {};
    var w = {};
    w.opener = {};
    w.opener.top = {};
    w._$jscoverage = window_$jscoverage;
    jscoverage_init(w);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init4: function() {
    var w = {};
    w.opener = {};
    w.opener.top = {};
    jscoverage_init(w);
    this.assert(w._$jscoverage);
  },

  test_init5: function() {
    var window_$jscoverage = {};
    var w = {};
    w._$jscoverage = window_$jscoverage;
    jscoverage_init(w);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init6: function() {
    var w = {};
    jscoverage_init(w);
    this.assert(w._$jscoverage);
  },

  test_createRequest: function() {
    var status;
    var request = jscoverage_createRequest();
    request.open('GET', 'scriptaculous.html', true);
    request.onreadystatechange = function(event) {
      if (request.readyState === 4) {
        status = request.status;
      }
    };
    request.send(null);
    this.wait(500, function() {
      this.assert(status === 0 || status === 200);
    });
  },

  test_findPos: function() {
    with (this) {
      var body = document.getElementsByTagName('body').item(0);
      body.style.marginTop = '5px';
      var div1 = document.createElement('div');
      div1.style.height = '10px';
      var div2 = document.createElement('div');
      div2.style.height = '20px';
      var div3 = document.createElement('div');
      div3.style.height = '100px';
      body.insertBefore(div3, body.firstChild);
      body.insertBefore(div2, div3);
      body.insertBefore(div1, div2);
      var pos = jscoverage_findPos(div3);
      assertEqual(35, pos);
      body.removeChild(body.firstChild);
      body.removeChild(body.firstChild);
      body.removeChild(body.firstChild);
    }
  },

  test_lengthyOperation: function() {
    with (this) {
      var body = document.getElementsByTagName('body').item(0);
      var progressBar = document.getElementById('progressBar');
      var progressLabel = document.getElementById('progressLabel');
      jscoverage_beginLengthyOperation();
      assertEqual('visible', progressBar.style.visibility);
      assertEqual('visible', progressLabel.style.visibility);
      jscoverage_endLengthyOperation();
      wait(500, function() {
        assertEqual('hidden', progressBar.style.visibility);
        assertEqual('hidden', progressLabel.style.visibility);
      });
    }
  },

  test_setSize: function() {
    if (! /MSIE/.test(navigator.userAgent)) {
      return;
    }
    with (this) {
      // hide the extra tab stuff
      jscoverage_initTabControl();
      jscoverage_setSize();
      var body = document.getElementsByTagName('body').item(0);
      var browserTabPage = document.getElementById('tabPages').getElementsByTagName('div').item(0);
      var tabPagesPos = (jscoverage_findPos(browserTabPage) + 1);
      var expectedHeight = jscoverage_getViewportHeight() - tabPagesPos - 12;
      assertEqual(expectedHeight, browserTabPage.clientHeight);
    }
  },

  test_getBooleanValue: function() {
    with (this) {
      assert(jscoverage_getBooleanValue('t'));
      assert(jscoverage_getBooleanValue('T'));
      assert(jscoverage_getBooleanValue('true'));
      assert(jscoverage_getBooleanValue('TRUE'));
      assert(jscoverage_getBooleanValue('y'));
      assert(jscoverage_getBooleanValue('Y'));
      assert(jscoverage_getBooleanValue('yes'));
      assert(jscoverage_getBooleanValue('YES'));
      assert(jscoverage_getBooleanValue('on'));
      assert(jscoverage_getBooleanValue('ON'));
      assert(!jscoverage_getBooleanValue('f'));
      assert(!jscoverage_getBooleanValue('F'));
      assert(!jscoverage_getBooleanValue('false'));
      assert(!jscoverage_getBooleanValue('FALSE'));
      assert(!jscoverage_getBooleanValue('n'));
      assert(!jscoverage_getBooleanValue('N'));
      assert(!jscoverage_getBooleanValue('no'));
      assert(!jscoverage_getBooleanValue('NO'));
      assert(!jscoverage_getBooleanValue('off'));
      assert(!jscoverage_getBooleanValue('OFF'));
    }
  },

  test_removeBrowserTab: function() {
    jscoverage_removeTab('browser');
    var browserTab = document.getElementById('browserTab');
    this.assertNull(browserTab);
  },

  test_initTabContents_empty: function() {
    jscoverage_initTabContents('');
    var checkbox = document.getElementById('checkbox');
    this.assert(! checkbox.checked);
  },

  test_initTabContents_url: function() {
    jscoverage_initTabContents('?scriptaculous-data.html');
    this.assert(/scriptaculous-data.html$/, frames[0].location);
    var checkbox = document.getElementById('checkbox');
    this.assert(! checkbox.checked);
  },

  test_initTabContents_urlAndMissing: function() {
    jscoverage_initTabContents("?url=scriptaculous-data.html&missing=1");
    this.assert(/scriptaculous-data.html$/, frames[0].location);
    var checkbox = document.getElementById('checkbox');
    this.assert(checkbox.checked);
  },

  test_body_load_report: function() {
    jscoverage_isReport = true;
    var original = jscoverage_createRequest;
    var runner = this;
    var request = {
      open: function (method, url, async) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertIdentical('GET', method);
        runner.assertIdentical('jscoverage.json', url);
        runner.assert(async);
      },
      send: function (content) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertNull(content);
        this.readyState = 4;
        this.status = 200;
        this.responseText = '{"foo":{"coverage":[null,null,null,10],"source":["","",""]}}';
        this.onreadystatechange();
      }
    };
    jscoverage_createRequest = function () {
      return request;
    };

    this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
    jscoverage_body_load();
    this.wait(500, function() {
      this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
      var summaryTable = getSummaryTable();
      var foo = summaryTable['foo'];
      this.assert(foo);
      this.assertEqual(1, foo.statements);
      this.assertEqual(1, foo.executed);

      jscoverage_createRequest = original;
      jscoverage_isReport = false;
    });
  },

  test_body_load_report_404: function() {
    jscoverage_isReport = true;
    var original = jscoverage_createRequest;
    var runner = this;
    var request = {
      open: function (method, url, async) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertIdentical('GET', method);
        runner.assertIdentical('jscoverage.json', url);
        runner.assert(async);
      },
      send: function (content) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertNull(content);
        this.readyState = 4;
        this.status = 404;
        this.onreadystatechange();
      }
    };
    jscoverage_createRequest = function () {
      return request;
    };

    this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
    jscoverage_body_load();
    this.wait(500, function() {
      this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
      var summaryErrorDiv = document.getElementById('summaryErrorDiv');
      this.assertIdentical('Error: 404', summaryErrorDiv.innerHTML);

      jscoverage_createRequest = original;
      jscoverage_isReport = false;
    });
  },

  test_body_load_report_0: function() {
    jscoverage_isReport = true;
    var original = jscoverage_createRequest;
    var runner = this;
    var request = {
      open: function (method, url, async) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertIdentical('GET', method);
        runner.assertIdentical('jscoverage.json', url);
        runner.assert(async);
      },
      send: function (content) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertNull(content);
        this.readyState = 4;
        this.status = 0;
        this.responseText = '';
        this.onreadystatechange();
      }
    };
    jscoverage_createRequest = function () {
      return request;
    };

    this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
    jscoverage_body_load();
    this.wait(500, function() {
      this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
      var summaryErrorDiv = document.getElementById('summaryErrorDiv');
      this.assertIdentical('Error: 404', summaryErrorDiv.innerHTML);

      jscoverage_createRequest = original;
      jscoverage_isReport = false;
    });
  },

  test_body_load_report_exception: function() {
    jscoverage_isReport = true;
    var original = jscoverage_createRequest;
    var runner = this;
    var request = {
      open: function (method, url, async) {
        runner.assert(jscoverage_inLengthyOperation, 'in lengthy operation');
        runner.assertIdentical('GET', method);
        runner.assertIdentical('jscoverage.json', url);
        runner.assert(async);
        throw 'open';
      }
    };
    jscoverage_createRequest = function () {
      return request;
    };

    this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
    jscoverage_body_load();
    this.wait(500, function() {
      this.assert(! jscoverage_inLengthyOperation, 'not in lengthy operation');
      var summaryErrorDiv = document.getElementById('summaryErrorDiv');
      this.assertIdentical('Error: open', summaryErrorDiv.innerHTML);

      jscoverage_createRequest = original;
      jscoverage_isReport = false;
    });
  },

  test_body_load_inverted: function() {
    jscoverage_isInvertedMode = true;
    jscoverage_body_load();
    var tabs = document.getElementById('tabs').getElementsByTagName('div');
    this.assertIdentical(4, tabs.length);
    this.assertIdentical('summaryTab', tabs.item(0).id);
    this.assertIdentical('sourceTab', tabs.item(1).id);
    this.assertIdentical('storeTab', tabs.item(2).id);
    this.assertIdentical('aboutTab', tabs.item(3).id);
    jscoverage_isInvertedMode = false;
  },

  test_body_load_server: function() {
    jscoverage_isServer = false;
    jscoverage_body_load();
    var tabs = document.getElementById('tabs').getElementsByTagName('div');
    this.assertIdentical(4, tabs.length);
    this.assertIdentical('browserTab', tabs.item(0).id);
    this.assertIdentical('summaryTab', tabs.item(1).id);
    this.assertIdentical('sourceTab', tabs.item(2).id);
    this.assertIdentical('aboutTab', tabs.item(3).id);
    jscoverage_isServer = true;
  },

  test_updateBrowser: function() {
    with (this) {
      var input = document.getElementById("location");
      input.value = 'scriptaculous-data.html';
      assertEqual('scriptaculous-data.html', input.value);
      jscoverage_updateBrowser();
      wait(500, function() {
        with (this) {
          assertMatch(/scriptaculous-data.html$/, input.value);
          assertMatch(/scriptaculous-data.html$/, frames[0].location);
        }
      });
    }
  },

  test_input_keypress: function() {
    frames[0].location.href = 'about:blank';
    var input = document.getElementById("location");
    var s = 'scriptaculous-data.html';
    var e = {};
    input.value = '';
    for (var i = 0; i < s.length; i++) {
      e.keyCode = s.charCodeAt(i);
      input.value = input.value + s.charAt(i);
      jscoverage_input_keypress(e);
    }
    e.keyCode = 13;
    jscoverage_input_keypress(e);
    this.wait(1000, function () {
      this.assertIdentical(frames[0].location.href, input.value);
    });
  },

  test_button_click: function() {
    with (this) {
      var input = document.getElementById("location");
      input.value = 'scriptaculous-data.html';
      assertEqual('scriptaculous-data.html', input.value);
      jscoverage_openInFrameButton_click();
      wait(1000, function() {
        with (this) {
          assertMatch(/scriptaculous-data.html$/, input.value);
          assertMatch(/scriptaculous-data.html$/, frames[0].location);
        }
      });
    }
  },

  test_updateInput: function() {
    with (this) {
      var url = 'scriptaculous-data.html';
      frames[0].location = url;
      // assertEqual(url, frames[0].location);
      var input = document.getElementById("location");
      wait(1000, function() {
        with (this) {
          assertEqual(frames[0].location, input.value);
        }
      });
    }
  },

  test_createLink: function() {
    with (this) {
      var link = jscoverage_createLink('foo.js');
      assertEqual("#", link.getAttribute('href'));
      assertEqual('foo.js', link.firstChild.data);
      link = jscoverage_createLink('foo.js', 42);
      assertEqual("#", link.getAttribute('href'));
      assertEqual('42', link.firstChild.data);
    }
  },

  test_recalculateSummaryTab: function() {
    with (this) {
      var coverage = {};
      coverage['foo.js'] = [];
      coverage['foo.js'][1] = 0;
      coverage['foo.js'][3] = 1;
      coverage['foo.js'][4] = 0;
      coverage['bar.js'] = [];
      coverage['bar.js'][2] = 10;
      coverage['baz.js'] = [];  // empty file

      var checkbox = document.getElementById('checkbox');
      checkbox.checked = true;
      jscoverage_appendMissingColumn();

      assert(checkbox.checked);

      jscoverage_recalculateSummaryTab(coverage);
      var summaryTable = document.getElementById('summaryTable');
      var rows = summaryTable.getElementsByTagName('tr');
      assertEqual(5, rows.length);

      var row, cells, links, percentage;

      row = rows.item(1);
      cells = row.getElementsByTagName('td');
      assertEqual(5, cells.length, "table should have 5 columns");
      assertEqual('4', cells.item(1).innerHTML);
      assertEqual('2', cells.item(2).innerHTML);
      percentage = cells.item(3).getElementsByTagName('span').item(0).innerHTML;
      assertEqual('50%', percentage);
      links = cells.item(4).getElementsByTagName('a');
      assertEqual(0, links.length);

      row = rows.item(4);
      cells = row.getElementsByTagName('td');
      assertEqual(5, cells.length);
      links = cells.item(0).getElementsByTagName('a');
      assertEqual(1, links.length);
      assertEqual('foo.js', links.item(0).innerHTML);
      assertEqual('3', cells.item(1).innerHTML);
      assertEqual('1', cells.item(2).innerHTML);
      percentage = cells.item(3).getElementsByTagName('span').item(0).innerHTML;
      assertEqual('33%', percentage);
      links = cells.item(4).getElementsByTagName('a');
      assertEqual(2, links.length);
      assertEqual('1', links.item(0).innerHTML);
      assertEqual('4', links.item(1).innerHTML);

      row = rows.item(2);
      cells = row.getElementsByTagName('td');
      assertEqual(5, cells.length);
      links = cells.item(0).getElementsByTagName('a');
      assertEqual(1, links.length);
      assertEqual('bar.js', links.item(0).innerHTML);
      assertEqual('1', cells.item(1).innerHTML);
      assertEqual('1', cells.item(2).innerHTML);
      percentage = cells.item(3).getElementsByTagName('span').item(0).innerHTML;
      assertEqual('100%', percentage);
      links = cells.item(4).getElementsByTagName('a');
      assertEqual(0, links.length);

      row = rows.item(3);
      cells = row.getElementsByTagName('td');
      assertEqual(5, cells.length);
      links = cells.item(0).getElementsByTagName('a');
      assertEqual(1, links.length);
      assertEqual('baz.js', links.item(0).innerHTML);
      assertEqual('0', cells.item(1).innerHTML, "number of statements should be 0");
      assertEqual('0', cells.item(2).innerHTML, "number executed should be 0");
      percentage = cells.item(3).getElementsByTagName('span').item(0).innerHTML;
      assertEqual('N/A', percentage);
      links = cells.item(4).getElementsByTagName('a');
      assertEqual(0, links.length);

      // restore gMissing
      checkbox.checked = false;
      jscoverage_removeMissingColumn();
    }
  },

  test_recalculateSummaryTab_empty: function() {
    var coverage = {};
    coverage['foo.js'] = [];
    coverage['bar.js'] = [];
    coverage['baz.js'] = [];

    jscoverage_recalculateSummaryTab(coverage);

    var summaryTotals = document.getElementById('summaryTotals');
    var cells = summaryTotals.getElementsByTagName('td');
    var span = cells.item(3).getElementsByTagName('span').item(0);
    this.assertIdentical('0%', span.innerHTML);
  },

  test_recalculateSummaryTab_missing: function() {
    var coverage = {};

    coverage['foo.js'] = [];
    coverage['foo.js'][1] = 1;
    coverage['foo.js'][2] = 0;  // missing
    coverage['foo.js'][3] = 1;
    coverage['foo.js'][4] = 0;  // another missing
    coverage['foo.js'][5] = 1;
    coverage['foo.js'][7] = 0;  // missing with blank line preceding
    coverage['foo.js'][8] = 1;
    coverage['foo.js'][9] = 0;  // missing with blank line following
    coverage['foo.js'][11] = 1;
    coverage['foo.js'][13] = 0;  // missing with blank line preceding and following
    coverage['foo.js'][15] = 1;
    coverage['foo.js'][16] = 0;  // first of pair
    coverage['foo.js'][17] = 0;  // second of pair
    coverage['foo.js'][18] = 1;
    coverage['foo.js'][19] = 0;  // first of pair (with intervening blank line)
    coverage['foo.js'][21] = 0;  // second of pair (with intervening blank line)
    coverage['foo.js'][22] = 1;
    coverage['foo.js'][24] = 0;  // a trio
    coverage['foo.js'][26] = 0;
    coverage['foo.js'][28] = 0;
    coverage['foo.js'][30] = 1;

    coverage['bar.js'] = [];
    coverage['bar.js'][1] = 0;  // missing at beginning
    coverage['bar.js'][2] = 1;
    coverage['bar.js'][3] = 0;
    coverage['bar.js'][4] = 1;
    coverage['bar.js'][5] = 0;  // missing at end

    var checkbox = document.getElementById('checkbox');
    checkbox.checked = true;
    jscoverage_appendMissingColumn();

    jscoverage_recalculateSummaryTab(coverage);

    var summaryTable = document.getElementById('summaryTable');
    var rows = summaryTable.getElementsByTagName('tr');
    this.assertEqual(4, rows.length);
    var row, cells, links, percentage;
    row = rows.item(3);
    cells = row.getElementsByTagName('td');
    links = cells.item(4).getElementsByTagName('a');
    this.assertEqual(8, links.length);
    this.assertEqual('2', links.item(0).innerHTML);
    this.assertEqual('4', links.item(1).innerHTML);
    this.assertEqual('7', links.item(2).innerHTML);
    this.assertEqual('9', links.item(3).innerHTML);
    this.assertEqual('13', links.item(4).innerHTML);
    this.assertEqual('16-17', links.item(5).innerHTML);
    this.assertEqual('19-21', links.item(6).innerHTML);
    this.assertEqual('24-28', links.item(7).innerHTML);
    row = rows.item(2);
    cells = row.getElementsByTagName('td');
    links = cells.item(4).getElementsByTagName('a');
    this.assertEqual(3, links.length);
    this.assertEqual('1', links.item(0).innerHTML);
    this.assertEqual('3', links.item(1).innerHTML);
    this.assertEqual('5', links.item(2).innerHTML);

    // restore gMissing
    checkbox.checked = false;
    jscoverage_removeMissingColumn();
  },

  test_missingColumn: function() {
    var checkbox = document.getElementById('checkbox');
    this.assert(! checkbox.checked);

    var headerRow = document.getElementById('headerRow');
    var cells = headerRow.getElementsByTagName('th');
    this.assertIdentical(4, cells.length);

    jscoverage_appendMissingColumn();
    cells = headerRow.getElementsByTagName('th');
    this.assertIdentical(5, cells.length);

    jscoverage_removeMissingColumn();
    cells = headerRow.getElementsByTagName('th');
    this.assertIdentical(4, cells.length);
  },

  test_checkbox_click: function() {
    var checkbox = document.getElementById('checkbox');
    checkbox.click();
    this.wait(500, function() {
      var headerRow = document.getElementById('headerRow');
      var headers = headerRow.getElementsByTagName('th');
      this.assertIdentical(5, headers.length);
      this.assert(checkbox.checked);
      checkbox.click();
      this.wait(500, function() {
        var headers = headerRow.getElementsByTagName('th');
        this.assertIdentical(4, headers.length);
        this.assert(! checkbox.checked);
      });
    });
  },

  test_checkbox_click_lengthy: function() {
    jscoverage_inLengthyOperation = true;
    this.assert(! jscoverage_checkbox_click());
  },

  test_makeTable: function() {
    with (this) {
      jscoverage_currentFile = 'foo.js';
      _$jscoverage[jscoverage_currentFile] = [];
      _$jscoverage[jscoverage_currentFile][1] = 10;
      _$jscoverage[jscoverage_currentFile][2] = 100;
      _$jscoverage['foo.js'].source = ['foo', 'bar'];
      jscoverage_makeTable();
      wait(1000, function() {
        var sourceDiv = document.getElementById('sourceDiv');
        var cells = sourceDiv.getElementsByTagName('td');
        assertIdentical(6, cells.length);
        assertIdentical('1', cells.item(0).innerHTML);
        assertIdentical('10', cells.item(1).innerHTML);
        assertIdentical('2', cells.item(3).innerHTML);
        assertIdentical('100', cells.item(4).innerHTML);
        delete(_$jscoverage[jscoverage_currentFile]);
      });
    }
  },

  test_scrollToLine: function() {
    initCoverageData();
    var file = 'scriptaculous-data.js';
    jscoverage_get(file);
    this.wait(1500, function() {
      jscoverage_currentLine = 100;
      jscoverage_scrollToLine();
      var sourceDiv = document.getElementById('sourceDiv');
      var cell = document.getElementById('line-100');
      var offset = jscoverage_findPos(cell) - jscoverage_findPos(sourceDiv);
      this.assertIdentical(offset, sourceDiv.scrollTop);
    });
  },

  test_get: function() {
    initCoverageData();
    var file = 'scriptaculous-data.js';
    jscoverage_get(file);
    this.wait(1000, function() {
      this.assertIdentical(file, jscoverage_currentFile);
      var fileDiv = document.getElementById('fileDiv');
      this.assertIdentical(file, fileDiv.innerHTML);
      jscoverage_get(file);
      this.wait(500, function() {
        this.assertIdentical(file, jscoverage_currentFile);
        this.assertIdentical(file, fileDiv.innerHTML);
        jscoverage_inLengthyOperation = true;
        jscoverage_get('other.js');
        this.wait(500, function() {
          this.assertIdentical(file, jscoverage_currentFile);
          this.assertIdentical(file, fileDiv.innerHTML);
          jscoverage_inLengthyOperation = false;
        });
      });
    });
  },

  test_getLine: function() {
    with (this) {
      initCoverageData();
      var file = 'scriptaculous-data.js';
      jscoverage_get(file, 100);
      wait(1500, function() {
        with (this) {
          assertIdentical(file, jscoverage_currentFile);
          var fileDiv = document.getElementById('fileDiv');
          assertIdentical(file, fileDiv.innerHTML);
          var sourceDiv = document.getElementById('sourceDiv');
          var cell = document.getElementById('line-100');
          var offset = jscoverage_findPos(cell) - jscoverage_findPos(sourceDiv);
          assertIdentical(offset, sourceDiv.scrollTop);
        }
      });
    }
  },

  test_recalculateSourceTab: function() {
    initCoverageData();
    jscoverage_get('scriptaculous-data.js');
    this.wait(1000, function() {
      jscoverage_recalculateSourceTab();
      this.wait(500, function() {
        var sourceDiv = document.getElementById('sourceDiv');
        var cells = sourceDiv.getElementsByTagName('td');
        this.assertIdentical('0', cells.item(298).innerHTML);
        this.assertIdentical('1', cells.item(598).innerHTML);
      });
    });
  },

  test_recalculateSourceTab_no_file: function() {
    jscoverage_currentFile = null;
    jscoverage_beginLengthyOperation();
    jscoverage_recalculateSourceTab();
    this.wait(500, function() {
      this.assert(! jscoverage_inLengthyOperation);
    });
  },

  test_initTabControl: function() {
    with (this) {
      jscoverage_initTabControl();
      var tabs = document.getElementById('tabs');
      tabs = tabs.getElementsByTagName('div');
      assertEqual('selected', tabs.item(0).className);
      assertEqual(jscoverage_tab_click, tabs.item(0).onclick);
      assertEqual('', tabs.item(1).className);
      assertEqual(jscoverage_tab_click, tabs.item(1).onclick);
      assertEqual('disabled', tabs.item(2).className);
      assertNull(tabs.item(2).onclick);
      assertEqual('', tabs.item(3).className);
      assertEqual(jscoverage_tab_click, tabs.item(3).onclick);
    }
  },

  test_selectTab: function() {
    with (this) {
      jscoverage_selectTab(3);
      var tabs = document.getElementById('tabs');
      tabs = tabs.getElementsByTagName('div');
      assertIdentical('selected', tabs.item(3).className);
    }
  },

  test_tabIndexOf: function() {
    with (this) {
      var tabs = document.getElementById('tabs');
      tabs = tabs.getElementsByTagName('div');
      for (var i = 0; i < tabs.length; i++) {
        assertEqual(i, jscoverage_tabIndexOf(tabs.item(i)));
      }
    }
  },

  test_tab_click: function() {
    var aboutTab = document.getElementById('aboutTab');
    var e = {target: aboutTab};
    jscoverage_tab_click(e);
    this.wait(500, function() {
      this.assertIdentical('selected', aboutTab.className);

      // click the already-selected tab
      jscoverage_tab_click(e);
      this.wait(500, function() {
        this.assertIdentical('selected', aboutTab.className);

        // click a tab while busy
        var summaryTab = document.getElementById('summaryTab');
        e = {target: summaryTab};
        jscoverage_inLengthyOperation = true;
        jscoverage_tab_click(e);
        this.wait(500, function() {
          this.assertIdentical('selected', aboutTab.className);
          jscoverage_inLengthyOperation = false;
        });
      });
    });
  },

  test_tab_click_summary: function() {
    _$jscoverage['foo'] = [];
    _$jscoverage['foo'][1] = 100;
    _$jscoverage['foo'][3] = 200;
    _$jscoverage['foo'][4] = 0;
    _$jscoverage['foo'][5] = 0;
    _$jscoverage['foo'][6] = 0;
    _$jscoverage['foo'][7] = 0;
    _$jscoverage['foo'][8] = 100;
    _$jscoverage['bar'] = [];
    _$jscoverage['bar'][10] = 1000;
    _$jscoverage['foo'].source = ['','','','','','','',''];
    _$jscoverage['foo'].conditionals = [];
    _$jscoverage['foo'].conditionals[5] = 8;

    var summaryTab = document.getElementById('summaryTab');
    var e = {target: summaryTab};
    jscoverage_tab_click(e);
    this.wait(1000, function() {
      this.assertIdentical('selected', summaryTab.className);
      var summaryTable = document.getElementById('summaryTable');
      var rows = summaryTable.getElementsByTagName('tr');
      var fooLink = null;
      var barLink = null;
      for (var i = 0; i < rows.length; i++) {
        var row = rows.item(i);
        var cells = row.getElementsByTagName('td');
        if (cells.length > 0) {
          var links = cells.item(0).getElementsByTagName('a');
          if (links.length > 0) {
            var file = links.item(0).innerHTML;
            if (file === 'foo') {
              fooLink = links.item(0);
              this.assertIdentical('4', cells.item(1).innerHTML, 'number of statements');
              this.assertIdentical('3', cells.item(2).innerHTML, 'number executed');
            }
            else if (file === 'bar') {
              barLink = links.item(0);
              this.assertIdentical('1', cells.item(1).innerHTML);
              this.assertIdentical('1', cells.item(2).innerHTML);
            }
          }
        }
      }
      this.assert(fooLink);
      this.assert(barLink);

      jscoverage_get('foo');
      this.wait(1000, function() {
        var sourceTab = document.getElementById('sourceTab');
        this.assertIdentical('selected', sourceTab.className);
        jscoverage_tab_click(e);
        this.wait(1000, function() {
          this.assertIdentical('selected', summaryTab.className);
          e = {target: sourceTab};
          jscoverage_tab_click(e);
          this.wait(1000, function () {
            this.assertIdentical('selected', sourceTab.className);
            var sourceTable = document.getElementById('sourceTable');
            var rows = sourceTable.getElementsByTagName('tr');
            this.assertIdentical(8, rows.length);
            this.assertIdentical('100', rows.item(0).getElementsByTagName('td').item(1).innerHTML);
            this.assertIdentical('200', rows.item(2).getElementsByTagName('td').item(1).innerHTML);
            this.assertIdentical('0', rows.item(3).getElementsByTagName('td').item(1).innerHTML);
            this.assertIdentical('0', rows.item(4).getElementsByTagName('td').item(1).innerHTML);

            delete _$jscoverage['foo'];
            delete _$jscoverage['bar'];
          });
        });
      });
    });
  },

  // ---------------------------------------------------------------------------
  // reports

  test_pad: function() {
    this.assertIdentical('0000', jscoverage_pad('0'));
    this.assertIdentical('000f', jscoverage_pad('f'));
    this.assertIdentical('0010', jscoverage_pad('10'));
    this.assertIdentical('00ff', jscoverage_pad('ff'));
    this.assertIdentical('0100', jscoverage_pad('100'));
    this.assertIdentical('0fff', jscoverage_pad('fff'));
    this.assertIdentical('1000', jscoverage_pad('1000'));
    this.assertIdentical('ffff', jscoverage_pad('ffff'));
  },

  test_quote: function() {
    this.assertIdentical('"\\u0000\\u0001\\u0002\\u0003"', jscoverage_quote('\u0000\u0001\u0002\u0003'));
    this.assertIdentical('"\\u0004\\u0005\\u0006\\u0007"', jscoverage_quote('\u0004\u0005\u0006\u0007'));
    this.assertIdentical('"\\b\\t\\n\\u000b"', jscoverage_quote('\u0008\u0009\u000a\u000b'));
    this.assertIdentical('"\\f\\r\\u000e\\u000f"', jscoverage_quote('\u000c\u000d\u000e\u000f'));
    this.assertIdentical('"\\u0010\\u0011\\u0012\\u0013"', jscoverage_quote('\u0010\u0011\u0012\u0013'));
    this.assertIdentical('"\\u0014\\u0015\\u0016\\u0017"', jscoverage_quote('\u0014\u0015\u0016\u0017'));
    this.assertIdentical('"\\u0018\\u0019\\u001a\\u001b"', jscoverage_quote('\u0018\u0019\u001a\u001b'));
    this.assertIdentical('"\\u001c\\u001d\\u001e\\u001f"', jscoverage_quote('\u001c\u001d\u001e\u001f'));

    this.assertIdentical('" !\\"#"', jscoverage_quote(' !"#'));
    this.assertIdentical('"$%&\'"', jscoverage_quote('$%&\''));
    this.assertIdentical('"()*+"', jscoverage_quote('()*+'));
    this.assertIdentical('",-./"', jscoverage_quote(',-./'));
    this.assertIdentical('"0123"', jscoverage_quote('0123'));
    this.assertIdentical('"4567"', jscoverage_quote('4567'));
    this.assertIdentical('"89:;"', jscoverage_quote('89:;'));
    this.assertIdentical('"<=>?"', jscoverage_quote('<=>?'));

    this.assertIdentical('"@ABC"', jscoverage_quote('@ABC'));
    this.assertIdentical('"DEFG"', jscoverage_quote('DEFG'));
    this.assertIdentical('"HIJK"', jscoverage_quote('HIJK'));
    this.assertIdentical('"LMNO"', jscoverage_quote('LMNO'));
    this.assertIdentical('"PQRS"', jscoverage_quote('PQRS'));
    this.assertIdentical('"TUVW"', jscoverage_quote('TUVW'));
    this.assertIdentical('"XYZ["', jscoverage_quote('XYZ['));
    this.assertIdentical('"\\\\]^_"', jscoverage_quote('\\]^_'));
    this.assertIdentical('"`abc"', jscoverage_quote('`abc'));
    this.assertIdentical('"defg"', jscoverage_quote('defg'));
    this.assertIdentical('"hijk"', jscoverage_quote('hijk'));
    this.assertIdentical('"lmno"', jscoverage_quote('lmno'));
    this.assertIdentical('"pqrs"', jscoverage_quote('pqrs'));
    this.assertIdentical('"tuvw"', jscoverage_quote('tuvw'));
    this.assertIdentical('"xyz{"', jscoverage_quote('xyz{'));
    this.assertIdentical('"|}~\\u007f"', jscoverage_quote('|}~\u007f'));

    this.assertIdentical('"\\u0080\\u0081\\u0082\\u0083"', jscoverage_quote('\u0080\u0081\u0082\u0083'));
    this.assertIdentical('"\\ufffc\\ufffd\\ufffe\\uffff"', jscoverage_quote('\ufffc\ufffd\ufffe\uffff'));
  },

  test_serializeCoverageToJSON: function() {
    _$jscoverage['foo'] = [];
    _$jscoverage['foo'][1] = 100;
    _$jscoverage['foo'][3] = 200;
    _$jscoverage['foo'][4] = 0;
    _$jscoverage['foo'][5] = 100;
    _$jscoverage['foo'].source = ['', '', '', '', ''];
    _$jscoverage['bar'] = [];
    _$jscoverage['bar'][10] = 1000;
    _$jscoverage['bar'].source = ['', '', '', '', '', '', '', '', '', ''];
    var expected = {
      'foo': {coverage: [null, 100, null, 200, 0, 100], source: ['', '', '', '', '']},
      'bar': {coverage: [null, null, null, null, null, null, null, null, null, null, 1000], source: ['', '', '', '', '', '', '', '', '', '']}
    };
    var actual = jscoverage_serializeCoverageToJSON();
    actual = eval('(' + actual + ')');
    this.assert(jsonEquals(expected['foo'], actual['foo']));
    this.assert(jsonEquals(expected['bar'], actual['bar']));
    delete _$jscoverage['foo'];
    delete _$jscoverage['bar'];
  },

  test_storeButton_click: function() {
    var original = jscoverage_createRequest;

    var self = this;
    var request = {};
    jscoverage_createRequest = function() {
      return request;
    };
    jscoverage_inLengthyOperation = true;
    jscoverage_storeButton_click();
    jscoverage_inLengthyOperation = false;

    request = {
      headers: {},
      open: function(method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store', url);
        self.assert(isAsync);
      },
      setRequestHeader: function(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      send: function(content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = content;
        this.readyState = 4;
        this.status = 200;
        this.onreadystatechange();
      }
    };
    _$jscoverage['foo'] = [];
    _$jscoverage['foo'][1] = 100;
    _$jscoverage['foo'][3] = 200;
    _$jscoverage['foo'][4] = 0;
    _$jscoverage['foo'][5] = 100;
    _$jscoverage['foo'].source = ['', '', '', '', ''];
    _$jscoverage['bar'] = [];
    _$jscoverage['bar'][10] = 1000;
    _$jscoverage['bar'].source = ['', '', '', '', '', '', '', '', '', ''];
    jscoverage_storeButton_click();
    var expected = {
      'foo': {coverage: [null, 100, null, 200, 0, 100], source: ['', '', '', '', '']},
      'bar': {coverage: [null, null, null, null, null, null, null, null, null, null, 1000], source: ['', '', '', '', '', '', '', '', '', '']}
    };
    var actual = request.responseText;
    actual = eval('(' + actual + ')');
    this.assert(jsonEquals(expected['foo'], actual['foo']));
    this.assert(jsonEquals(expected['bar'], actual['bar']));

    delete _$jscoverage['foo'];
    delete _$jscoverage['bar'];
    jscoverage_createRequest = original;
  },

  test_storeButton_click_fail: function() {
    var original = jscoverage_createRequest;

    var self = this;
    var request = {
      headers: {},
      open: function(method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store', url);
        self.assert(isAsync);
      },
      setRequestHeader: function(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      send: function(content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = 'Internal Server Error';
        this.readyState = 4;
        this.status = 0;
        this.onreadystatechange();
      }
    };
    jscoverage_createRequest = function() {
      return request;
    };

    jscoverage_storeButton_click();
    this.assertMatch(/Could not connect to server/, document.getElementById('storeDiv').innerHTML);

    jscoverage_createRequest = original;
  },

  test_storeButton_click_500: function() {
    var original = jscoverage_createRequest;

    var self = this;
    var request = {
      headers: {},
      open: function(method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store', url);
        self.assert(isAsync);
      },
      setRequestHeader: function(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      send: function(content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = 'Internal Server Error';
        this.readyState = 4;
        this.status = 500;
        this.onreadystatechange();
      }
    };
    jscoverage_createRequest = function() {
      return request;
    };

    jscoverage_storeButton_click();
    this.assertMatch(/Internal Server Error/, document.getElementById('storeDiv').innerHTML);

    jscoverage_createRequest = original;
  },

  test_report: function() {
    var original = window.XMLHttpRequest;

    var self = this;
    var request;
    window.XMLHttpRequest = function () {
      this.headers = {};
      this.open = function (method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store', url);
        self.assert(! isAsync);
      };
      this.setRequestHeader = function (name, value) {
        this.headers[name.toLowerCase()] = value;
      };
      this.send = function (content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = content;
        this.readyState = 4;
        this.status = 200;
      };
      request = this;
    };

    _$jscoverage['foo'] = [];
    _$jscoverage['foo'][1] = 100;
    _$jscoverage['foo'][3] = 200;
    _$jscoverage['foo'][4] = 0;
    _$jscoverage['foo'][5] = 100;
    _$jscoverage['foo'].source = ['', '', '', '', ''];
    var funnyName = '\b\f\n\r\t"\\\u0001';
    _$jscoverage[funnyName] = [];
    _$jscoverage[funnyName][10] = 1000;
    _$jscoverage[funnyName].source = ['', '', '', '', '', '', '', '', '', ''];
    jscoverage_report();
    var expected = {
      'foo': {coverage: [null, 100, null, 200, 0, 100], source: ['', '', '', '', '']}
    };
    expected[funnyName] = {coverage: [null, null, null, null, null, null, null, null, null, null, 1000], source: ['', '', '', '', '', '', '', '', '', '']};
    var actual = request.responseText;
    actual = eval('(' + actual + ')');
    this.assert(jsonEquals(expected['foo'], actual['foo']));
    this.assert(jsonEquals(expected[funnyName], actual[funnyName]));

    delete _$jscoverage['foo'];
    delete _$jscoverage[funnyName];
    window.XMLHttpRequest = original;
  },

  test_report_dir: function() {
    var original = window.XMLHttpRequest;
    window.XMLHttpRequest = null;

    var self = this;
    var request;
    window.ActiveXObject = function (s) {
      self.assertIdentical('Microsoft.XMLHTTP', s);
      this.headers = {};
      this.open = function (method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store/dir', url);
        self.assert(! isAsync);
      };
      this.setRequestHeader = function (name, value) {
        this.headers[name.toLowerCase()] = value;
      };
      this.send = function (content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = content;
        this.readyState = 4;
        this.status = 200;
      };
      request = this;
    };

    _$jscoverage['foo'] = [];
    _$jscoverage['foo'][1] = 100;
    _$jscoverage['foo'][3] = 200;
    _$jscoverage['foo'][4] = 0;
    _$jscoverage['foo'][5] = 100;
    _$jscoverage['foo'].source = ['', '', '', '', ''];
    var funnyName = '\b\f\n\r\t"\\\u0001';
    _$jscoverage[funnyName] = [];
    _$jscoverage[funnyName][10] = 1000;
    _$jscoverage[funnyName].source = ['', '', '', '', '', '', '', '', '', ''];
    jscoverage_report('dir');
    var expected = {
      'foo': {coverage: [null, 100, null, 200, 0, 100], source: ['', '', '', '', '']}
    };
    expected[funnyName] = {coverage: [null, null, null, null, null, null, null, null, null, null, 1000], source: ['', '', '', '', '', '', '', '', '', '']};
    var actual = request.responseText;
    actual = eval('(' + actual + ')');
    this.assert(jsonEquals(expected['foo'], actual['foo']));
    this.assert(jsonEquals(expected[funnyName], actual[funnyName]));

    delete _$jscoverage['foo'];
    delete _$jscoverage[funnyName];
    window.XMLHttpRequest = original;
  },

  test_report_error: function() {
    var original = window.XMLHttpRequest;

    var self = this;
    var request;
    window.XMLHttpRequest = function () {
      this.headers = {};
      this.open = function (method, url, isAsync) {
        self.assertIdentical('POST', method);
        self.assertIdentical('/jscoverage-store', url);
        self.assert(! isAsync);
      };
      this.setRequestHeader = function (name, value) {
        this.headers[name.toLowerCase()] = value;
      };
      this.send = function (content) {
        self.assertIdentical(this.headers['content-type'], 'application/json');
        self.assertEqual(this.headers['content-length'], content.length);
        this.responseText = 'Internal Server Error';
        this.readyState = 4;
        this.status = 500;
      };
      request = this;
    };

    try {
      jscoverage_report();
      this.fail();
    }
    catch (e) {
      this.assertIdentical(500, e);
    }

    window.XMLHttpRequest = original;
  },

  setup: function() {
    if (! this.initialized) {
      var headingDiv = document.getElementById('headingDiv');
      this.headingDivClone = headingDiv.cloneNode(true);
      var tabs = document.getElementById('tabs');
      this.tabsClone = tabs.cloneNode(true);
      var tabPages = document.getElementById('tabPages');
      this.tabPagesClone = tabPages.cloneNode(true);
      this.initialized = true;
    }

    jscoverage_init(window);
    jscoverage_currentFile = null;
    jscoverage_currentLine = null;
    jscoverage_inLengthyOperation = false;
  },

  teardown: function() {
    // restore old DOM
    var headingDiv = document.getElementById('headingDiv');
    headingDiv.parentNode.replaceChild(this.headingDivClone, headingDiv);
    var tabs = document.getElementById('tabs');
    tabs.parentNode.replaceChild(this.tabsClone, tabs);
    var tabPages = document.getElementById('tabPages');
    tabPages.parentNode.replaceChild(this.tabPagesClone, tabPages);
  }
});
