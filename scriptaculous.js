/*
    scriptaculous.js - script.aculo.us unit tests for JSCoverage
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
    init(w);
    this.assertIdentical(opener_$jscoverage, w.opener.top._$jscoverage);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init2: function() {
    var opener_$jscoverage = {};
    var w = {};
    w.opener = {};
    w.opener.top = {};
    w.opener.top._$jscoverage = opener_$jscoverage;
    init(w);
    this.assertIdentical(opener_$jscoverage, w.opener.top._$jscoverage);
    this.assertIdentical(opener_$jscoverage, w._$jscoverage);
  },

  test_init3: function() {
    var window_$jscoverage = {};
    var w = {};
    w.opener = {};
    w.opener.top = {};
    w._$jscoverage = window_$jscoverage;
    init(w);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init4: function() {
    var w = {};
    w.opener = {};
    w.opener.top = {};
    init(w);
    this.assert(w._$jscoverage);
  },

  test_init5: function() {
    var window_$jscoverage = {};
    var w = {};
    w._$jscoverage = window_$jscoverage;
    init(w);
    this.assertIdentical(window_$jscoverage, w._$jscoverage);
  },

  test_init6: function() {
    var w = {};
    init(w);
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
      var pos = findPos(div3);
      assertEqual(35, pos);
      body.removeChild(body.firstChild);
      body.removeChild(body.firstChild);
      body.removeChild(body.firstChild);
    }
  },

  test_lengthyOperation: function() {
    with (this) {
      var body = document.getElementById('body');
      beginLengthyOperation();
      assertEqual('wait', body.style.cursor);
      endLengthyOperation();
      wait(500, function() {
        this.assertEqual('', body.style.cursor);
      });
    }
  },

  test_setSize: function() {
    with (this) {
      // hide the extra tab stuff
      initTabControl();
      setSize();
      var body = document.getElementById('body');
      var tabPages = document.getElementById('tabPages');
      assertEqual(getViewportHeight() - findPos(tabPages) - 12, tabPages.clientHeight);
    }
  },

  test_getBooleanValue: function() {
    with (this) {
      assert(getBooleanValue('t'));
      assert(getBooleanValue('T'));
      assert(getBooleanValue('true'));
      assert(getBooleanValue('TRUE'));
      assert(getBooleanValue('y'));
      assert(getBooleanValue('Y'));
      assert(getBooleanValue('yes'));
      assert(getBooleanValue('YES'));
      assert(getBooleanValue('on'));
      assert(getBooleanValue('ON'));
      assert(!getBooleanValue('f'));
      assert(!getBooleanValue('F'));
      assert(!getBooleanValue('false'));
      assert(!getBooleanValue('FALSE'));
      assert(!getBooleanValue('n'));
      assert(!getBooleanValue('N'));
      assert(!getBooleanValue('no'));
      assert(!getBooleanValue('NO'));
      assert(!getBooleanValue('off'));
      assert(!getBooleanValue('OFF'));
    }
  },

  test_removeBrowserTab: function() {
    removeBrowserTab();
    var browserTab = document.getElementById('browserTab');
    this.assertNull(browserTab);
  },

  test_initTabContents_empty: function() {
    initTabContents('');
    this.assert(! gMissing);
  },

  test_initTabContents_url: function() {
    initTabContents('?scriptaculous-data.html');
    this.assert(/scriptaculous-data.html$/, frames[0].location);
    this.assert(! gMissing);
  },

  test_initTabContents_urlAndMissing: function() {
    initTabContents("?url=scriptaculous-data.html&missing=1");
    this.assert(/scriptaculous-data.html$/, frames[0].location);
    this.assert(gMissing);
  },

  test_updateBrowser: function() {
    with (this) {
      var input = document.getElementById("location");
      input.value = 'scriptaculous-data.html';
      assertEqual('scriptaculous-data.html', input.value);
      updateBrowser();
      wait(500, function() {
        with (this) {
          assertEqual(input.value, frames[0].location);
        }
      });
    }
  },

  test_updateInput: function() {
    with (this) {
      var url = 'scriptaculous-data.html';
      frames[0].location = url;
      // assertEqual(url, frames[0].location);
      updateInput();
      var input = document.getElementById("location");
      wait(500, function() {
        with (this) {
          assertEqual(frames[0].location, input.value);
        }
      });
    }
  },

  test_createLink: function() {
    with (this) {
      var link = createLink('foo.js');
      assertEqual("javascript:get('foo.js');", link.getAttribute('href'));
      link = createLink('foo.js', 42);
      assertEqual("javascript:get('foo.js', 42);", link.getAttribute('href'));
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

      gMissing = true;
      appendMissingColumn();

      assert(gMissing, "gMissing should be true");

      recalculateSummaryTab(coverage);
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
      gMissing = false;
      removeMissingColumn();
    }
  },

  test_recalculateSummaryTab_empty: function() {
    var coverage = {};
    coverage['foo.js'] = [];
    coverage['bar.js'] = [];
    coverage['baz.js'] = [];

    recalculateSummaryTab(coverage);

    var summaryTotals = document.getElementById('summaryTotals');
    var cells = summaryTotals.getElementsByTagName('td');
    var span = cells.item(3).getElementsByTagName('span').item(0);
    this.assertIdentical('0%', span.innerHTML);
  },

  test_missingColumn: function() {
    this.assert(! gMissing, "gMissing should be false");

    var headerRow = document.getElementById('headerRow');
    var cells = headerRow.getElementsByTagName('th');
    this.assertIdentical(4, cells.length);

    appendMissingColumn();
    cells = headerRow.getElementsByTagName('th');
    this.assertIdentical(5, cells.length);

    removeMissingColumn();
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
      this.assert(gMissing, 'gMissing should be true');
      checkbox.click();
      this.wait(500, function() {
        var headers = headerRow.getElementsByTagName('th');
        this.assertIdentical(4, headers.length);
        this.assert(! gMissing, 'gMissing should be false');
      });
    });
  },

  test_checkbox_click_lengthy: function() {
    gInLengthyOperation = true;
    this.assert(! checkbox_click());
  },

  test_makeTable: function() {
    with (this) {
      gCurrentFile = 'foo.js';
      _$jscoverage[gCurrentFile] = [];
      _$jscoverage[gCurrentFile][1] = 10;
      _$jscoverage[gCurrentFile][2] = 100;
      gCurrentSource = 'foo\nbar\n';
      gCurrentLines = ['foo', 'bar'];
      makeTable();
      wait(500, function() {
        var sourceDiv = document.getElementById('sourceDiv');
        var cells = sourceDiv.getElementsByTagName('td');
        assertIdentical('1', cells.item(0).innerHTML);
        assertIdentical('10', cells.item(1).innerHTML);
        assertIdentical('2', cells.item(3).innerHTML);
        assertIdentical('100', cells.item(4).innerHTML);
        delete(_$jscoverage[gCurrentFile]);
      });
    }
  },

  test_countLines: function() {
    this.assertIdentical(0, countLines(""));
    this.assertIdentical(1, countLines("\n"));
    this.assertIdentical(2, countLines("foo\n\bar\n"));
    this.assertIdentical(2, countLines("foo\n\bar"));
  },

  test_scrollToLine: function() {
    initCoverageData();
    var file = 'scriptaculous-data.js';
    get(file);
    this.wait(1000, function() {
      gCurrentLine = 100;
      scrollToLine();
      var sourceDiv = document.getElementById('sourceDiv');
      var cell = document.getElementById('line-100');
      var offset = findPos(cell) - findPos(sourceDiv);
      this.assertIdentical(offset, sourceDiv.scrollTop);
    });
  },

  test_throbber: function() {
    with (this) {
      var throbberImg = document.getElementById('throbberImg');
      setThrobber();
      assertIdentical('visible', throbberImg.style.visibility);
      clearThrobber();
      assertIdentical('hidden', throbberImg.style.visibility);
    }
  },

  test_getError: function() {
    with (this) {
      var file = 'missing.js';
      get(file);
      wait(1000, function() {
        with (this) {
          assertIdentical(null, gCurrentFile);
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
    get(file);
    this.wait(1000, function() {
      this.assertIdentical(file, gCurrentFile);
      var fileDiv = document.getElementById('fileDiv');
      this.assertIdentical(file, fileDiv.innerHTML);
      var throbberImg = document.getElementById('throbberImg');
      this.assertNotIdentical('visible', throbberImg.style.visibility);
      get(file);
      this.wait(500, function() {
        this.assertIdentical(file, gCurrentFile);
        this.assertIdentical(file, fileDiv.innerHTML);
        this.assertNotIdentical('visible', throbberImg.style.visibility);
      });
    });
  },

  test_getLine: function() {
    with (this) {
      initCoverageData();
      var file = 'scriptaculous-data.js';
      get(file, 100);
      wait(1000, function() {
        with (this) {
          assertIdentical(file, gCurrentFile);
          var fileDiv = document.getElementById('fileDiv');
          assertIdentical(file, fileDiv.innerHTML);
          assertNotIdentical('visible', document.getElementById('throbberImg').style.visibility);
          var sourceDiv = document.getElementById('sourceDiv');
          var cell = document.getElementById('line-100');
          var offset = findPos(cell) - findPos(sourceDiv);
          assertIdentical(offset, sourceDiv.scrollTop);
        }
      });
    }
  },

  test_recalculateSourceTab: function() {
    initCoverageData();
    get('scriptaculous-data.js');
    this.wait(1000, function() {
      recalculateSourceTab();
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
      initTabControl();
      var tabs = document.getElementById('tabs');
      tabs = tabs.getElementsByTagName('div');
      assertEqual('selected', tabs.item(0).className);
      assertEqual(tab_click, tabs.item(0).onclick);
      assertEqual('', tabs.item(1).className);
      assertEqual(tab_click, tabs.item(1).onclick);
      assertEqual('disabled', tabs.item(2).className);
      assertNull(tabs.item(2).onclick);
      assertEqual('', tabs.item(3).className);
      assertEqual(tab_click, tabs.item(3).onclick);
    }
  },

  test_selectTab: function() {
    with (this) {
      selectTab(3);
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
        assertEqual(i, tabIndexOf(tabs.item(i)));
      }
    }
  },

  test_tab_click: function() {
    var aboutTab = document.getElementById('aboutTab');
    var e = {target: aboutTab};
    tab_click(e);
    this.wait(500, function() {
      this.assertIdentical('selected', aboutTab.className);
    });
  },

  setup: function() {
    var headingDiv = document.getElementById('headingDiv');
    this.headingDivClone = headingDiv.cloneNode(true);
    var tabControl = document.getElementById('tabControl');
    this.tabControlClone = tabControl.cloneNode(true);

    init(window);
    gCurrentFile = null;
    gCurrentLine = null;
    gCurrentSource = null;
    gCurrentLines = null;
    gMissing = null;
    gInLengthyOperation = false;
    body_load();
  },

  teardown: function() {
    // restore old DOM
    var headingDiv = document.getElementById('headingDiv');
    headingDiv.parentNode.replaceChild(this.headingDivClone, headingDiv);
    var tabControl = document.getElementById('tabControl');
    tabControl.parentNode.replaceChild(this.tabControlClone, tabControl);
  }
});
