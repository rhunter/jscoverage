/*
    scriptaculous.js - script.aculo.us unit tests for JSCoverage
    Copyright (C) 2007, 2008 siliconforks.com

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

function initCoverageData() {
  var file = 'scriptaculous-data.js';
  window._$jscoverage[file] = [];
  window._$jscoverage[file][100] = 0;
  window._$jscoverage[file][200] = 1;
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

  test_findPos: function() {
    with (this) {
      var body = document.getElementById('body');
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
      var body = document.getElementById('body');
      jscoverage_beginLengthyOperation();
      assertEqual('wait', body.style.cursor);
      jscoverage_endLengthyOperation();
      wait(500, function() {
        this.assertEqual('', body.style.cursor);
      });
    }
  },

  test_setSize: function() {
    with (this) {
      // hide the extra tab stuff
      jscoverage_initTabControl();
      jscoverage_setSize();
      var body = document.getElementById('body');
      var tabPages = document.getElementById('tabPages');
      assertEqual(jscoverage_getViewportHeight() - jscoverage_findPos(tabPages) - 12, tabPages.clientHeight);
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
      assertEqual("javascript:jscoverage_get('foo.js');", link.getAttribute('href'));
      link = jscoverage_createLink('foo.js', 42);
      assertEqual("javascript:jscoverage_get('foo.js', 42);", link.getAttribute('href'));
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
      assertEqual('66%', percentage);
      links = cells.item(4).getElementsByTagName('a');
      assertEqual(0, links.length);

      row = rows.item(2);
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

      row = rows.item(3);
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

      row = rows.item(4);
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
      jscoverage_sourceCache['foo.js'] = 'foo\nbar\n';
      jscoverage_currentLines = ['foo', 'bar'];
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

  test_countLines: function() {
    this.assertIdentical(0, jscoverage_countLines(""));
    this.assertIdentical(1, jscoverage_countLines("\n"));
    this.assertIdentical(2, jscoverage_countLines("foo\n\bar\n"));
    this.assertIdentical(2, jscoverage_countLines("foo\n\bar"));
  },

  test_scrollToLine: function() {
    initCoverageData();
    var file = 'scriptaculous-data.js';
    jscoverage_get(file);
    this.wait(1000, function() {
      jscoverage_currentLine = 100;
      jscoverage_scrollToLine();
      var sourceDiv = document.getElementById('sourceDiv');
      var cell = document.getElementById('line-100');
      var offset = jscoverage_findPos(cell) - jscoverage_findPos(sourceDiv);
      this.assertIdentical(offset, sourceDiv.scrollTop);
    });
  },

  test_throbber: function() {
    with (this) {
      var throbberImg = document.getElementById('throbberImg');
      jscoverage_setThrobber();
      assertIdentical('visible', throbberImg.style.visibility);
      jscoverage_clearThrobber();
      assertIdentical('hidden', throbberImg.style.visibility);
    }
  },

  test_getError: function() {
    with (this) {
      var file = 'missing.js';
      jscoverage_get(file);
      wait(1000, function() {
        with (this) {
          assertIdentical(null, jscoverage_currentFile);
          var sourceDiv = document.getElementById('sourceDiv');
          assertIdentical("Error retrieving document missing.js.", sourceDiv.innerHTML);
          assertNotIdentical('visible', document.getElementById('throbberImg').style.visibility);
        }
      });
    }
  },

  test_get: function() {
    initCoverageData();
    var file = 'scriptaculous-data.js';
    jscoverage_get(file);
    this.wait(1000, function() {
      this.assertIdentical(file, jscoverage_currentFile);
      var fileDiv = document.getElementById('fileDiv');
      this.assertIdentical(file, fileDiv.innerHTML);
      var throbberImg = document.getElementById('throbberImg');
      this.assertNotIdentical('visible', throbberImg.style.visibility);
      jscoverage_get(file);
      this.wait(500, function() {
        this.assertIdentical(file, jscoverage_currentFile);
        this.assertIdentical(file, fileDiv.innerHTML);
        this.assertNotIdentical('visible', throbberImg.style.visibility);
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
          assertNotIdentical('visible', document.getElementById('throbberImg').style.visibility);
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
    this.wait(1000, function() {
      this.assertIdentical('selected', aboutTab.className);
    });
  },

  test_getOriginalSource: function () {
    var instrumentedSource = '1\n2\n// 3\n// 4\n5\n6\n';
    var originalSource = jscoverage_getOriginalSource(instrumentedSource);
    this.assertEqual('3\n4\n', originalSource);
  },

  setup: function() {
    var headingDiv = document.getElementById('headingDiv');
    this.headingDivClone = headingDiv.cloneNode(true);
    var tabControl = document.getElementById('tabControl');
    this.tabControlClone = tabControl.cloneNode(true);

    jscoverage_init(window);
    jscoverage_currentFile = null;
    jscoverage_currentLine = null;
    jscoverage_currentLines = null;
    jscoverage_inLengthyOperation = false;
    jscoverage_body_load();
  },

  teardown: function() {
    // restore old DOM
    var headingDiv = document.getElementById('headingDiv');
    headingDiv.parentNode.replaceChild(this.headingDivClone, headingDiv);
    var tabControl = document.getElementById('tabControl');
    tabControl.parentNode.replaceChild(this.tabControlClone, tabControl);
  }
});
