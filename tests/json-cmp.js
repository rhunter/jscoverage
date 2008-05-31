/*
    json-cmp.js - compare JSON files
    Copyright (C) 2008 siliconforks.com

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

function json_equals(json1, json2) {
  if (json1 === null || json2 === null) {
    return json1 === json2;
  }
  else if (json1.constructor === Array && json2.constructor === Array) {
    if (json1.length !== json2.length) {
      return false;
    }
    var length = json1.length;
    for (var i = 0; i < length; i++) {
      if (! json_equals(json1[i], json2[i])) {
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
      if (! json_equals(json1[i], json2[i])) {
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

if (arguments.length !== 2) {
  print("Usage: json-cmp.js JSON1 JSON2");
  quit(1);
}

function parse_json(file) {
  var f = new File(file);
  f.open('read', 'text');
  var contents = f.readAll().join('\n');
  f.close();
  return eval('(' + contents + ')');
}

var json1 = parse_json(arguments[0]);
var json2 = parse_json(arguments[1]);
if (json_equals(json1, json2)) {
  quit(0);
}
else {
  print(json1.toSource());
  print(json2.toSource());
  quit(1);
}
