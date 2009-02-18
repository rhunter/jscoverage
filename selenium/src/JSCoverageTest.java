/*
    JSCoverageTest.java - Selenium tests
    Copyright (C) 2008, 2009 siliconforks.com

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

import com.thoughtworks.selenium.*;
import junit.framework.*;

public class JSCoverageTest extends TestCase {
  private Selenium browser;

  public void setUp() {
    browser = new DefaultSelenium("127.0.0.1", 4444, "*firefox", "http://127.0.0.1:8000");
    browser.start();
  }

  public void testJSCoverage() {
    browser.open("http://127.0.0.1:8000/jscoverage.html");
    assertEquals("JSCoverage", browser.getTitle());
    browser.type("id=location", "index.html");
    browser.click("css=#locationDiv button");
    browser.waitForFrameToLoad("id=browserIframe", "5000");
    browser.selectFrame("id=browserIframe");
    assertEquals("Example", browser.getTitle());
    browser.selectFrame("relative=parent");

    // switch to "Summary" tab
    browser.click("id=summaryTab");
    browser.waitForCondition("/selected/.test(selenium.browserbot.getCurrentWindow().document.getElementById('summaryTab').className)", "1000");
    browser.waitForCondition("! selenium.browserbot.getCurrentWindow().jscoverage_inLengthyOperation", "1000");
    assertFalse(browser.isVisible("id=iframeDiv"));
    assertTrue(browser.isVisible("id=summaryDiv"));
    assertEquals("script.js", browser.getTable("summaryTable.2.0"));
    assertEquals("15", browser.getTable("summaryTable.2.1"));
    assertEquals("1", browser.getTable("summaryTable.2.2"));
    assertEquals("6%", browser.getTable("summaryTable.2.3"));

    // switch to "Source" tab
    browser.click("link=script.js");
    browser.waitForCondition("/selected/.test(selenium.browserbot.getCurrentWindow().document.getElementById('sourceTab').className)", "1000");
    browser.waitForCondition("! selenium.browserbot.getCurrentWindow().jscoverage_inLengthyOperation", "1000");
    assertFalse(browser.isVisible("id=summaryDiv"));
    assertTrue(browser.isVisible("id=sourceDiv"));
    assertEquals("script.js", browser.getText("id=fileDiv"));

    assertEquals("1", browser.getTable("sourceTable.0.0"));
    assertEquals("2", browser.getTable("sourceTable.1.0"));
    assertEquals("3", browser.getTable("sourceTable.2.0"));
    assertEquals("4", browser.getTable("sourceTable.3.0"));
    assertEquals("5", browser.getTable("sourceTable.4.0"));
    assertEquals("6", browser.getTable("sourceTable.5.0"));
    assertEquals("7", browser.getTable("sourceTable.6.0"));
    assertEquals("8", browser.getTable("sourceTable.7.0"));
    assertEquals("9", browser.getTable("sourceTable.8.0"));
    assertEquals("10", browser.getTable("sourceTable.9.0"));
    assertEquals("11", browser.getTable("sourceTable.10.0"));
    assertEquals("12", browser.getTable("sourceTable.11.0"));
    assertEquals("13", browser.getTable("sourceTable.12.0"));
    assertEquals("14", browser.getTable("sourceTable.13.0"));
    assertEquals("15", browser.getTable("sourceTable.14.0"));
    assertEquals("16", browser.getTable("sourceTable.15.0"));
    assertEquals("17", browser.getTable("sourceTable.16.0"));
    assertEquals("18", browser.getTable("sourceTable.17.0"));
    assertEquals("19", browser.getTable("sourceTable.18.0"));
    assertEquals("20", browser.getTable("sourceTable.19.0"));

    assertEquals("1", browser.getTable("sourceTable.0.1"));
    assertEquals("0", browser.getTable("sourceTable.1.1"));
    assertEquals("0", browser.getTable("sourceTable.2.1"));
    assertEquals("0", browser.getTable("sourceTable.3.1"));
    assertEquals("", browser.getTable("sourceTable.4.1"));
    assertEquals("0", browser.getTable("sourceTable.5.1"));
    assertEquals("0", browser.getTable("sourceTable.6.1"));
    assertEquals("", browser.getTable("sourceTable.7.1"));
    assertEquals("0", browser.getTable("sourceTable.8.1"));
    assertEquals("0", browser.getTable("sourceTable.9.1"));
    assertEquals("", browser.getTable("sourceTable.10.1"));
    assertEquals("0", browser.getTable("sourceTable.11.1"));
    assertEquals("0", browser.getTable("sourceTable.12.1"));
    assertEquals("", browser.getTable("sourceTable.13.1"));
    assertEquals("0", browser.getTable("sourceTable.14.1"));
    assertEquals("0", browser.getTable("sourceTable.15.1"));
    assertEquals("0", browser.getTable("sourceTable.16.1"));
    assertEquals("0", browser.getTable("sourceTable.17.1"));
    assertEquals("0", browser.getTable("sourceTable.18.1"));
    assertEquals("", browser.getTable("sourceTable.19.1"));

    assertEquals("function go(element) {", browser.getTable("sourceTable.0.2"));
    assertEquals("var message;", browser.getTable("sourceTable.1.2"));
    assertEquals("if (element.id === 'radio1') {", browser.getTable("sourceTable.2.2"));
    assertEquals("message = 'You selected the number 1.';", browser.getTable("sourceTable.3.2"));
    assertEquals("}", browser.getTable("sourceTable.4.2"));
    assertEquals("else if (element.id === 'radio2') {", browser.getTable("sourceTable.5.2"));
    assertEquals("message = 'You selected the number 2.';", browser.getTable("sourceTable.6.2"));
    assertEquals("}", browser.getTable("sourceTable.7.2"));
    assertEquals("else if (element.id === 'radio3') {", browser.getTable("sourceTable.8.2"));
    assertEquals("message = 'You selected the number 3.';", browser.getTable("sourceTable.9.2"));
    assertEquals("}", browser.getTable("sourceTable.10.2"));
    assertEquals("else if (element.id === 'radio4') {", browser.getTable("sourceTable.11.2"));
    assertEquals("message = 'You selected the number 4.';", browser.getTable("sourceTable.12.2"));
    assertEquals("}", browser.getTable("sourceTable.13.2"));
    assertEquals("var div = document.getElementById('request');", browser.getTable("sourceTable.14.2"));
    assertEquals("div.className = 'black';", browser.getTable("sourceTable.15.2"));
    assertEquals("div = document.getElementById('result');", browser.getTable("sourceTable.16.2"));
    assertEquals("div.innerHTML = '<p>' + message + '</p>';", browser.getTable("sourceTable.17.2"));
    assertEquals("div.innerHTML += '<p>If you are running the instrumented version of this program, you can click the \"Summary\" tab to view a coverage report.</p>';", browser.getTable("sourceTable.18.2"));
    assertEquals("}", browser.getTable("sourceTable.19.2"));
  }

  public void tearDown() {
    browser.stop();
  }
}
