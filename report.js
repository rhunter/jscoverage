if (! top.jscoverage_report) {
  top.jscoverage_report = function (dir) {
    var createRequest = function () {
      if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
      }
      else if (window.ActiveXObject) {
        return new ActiveXObject("Microsoft.XMLHTTP");
      }
    };

    var quote = function (s) {
      return '"' + s.replace(/\cH|\f|\n|\r|\t|\v|"|\\/g, function(s) {
        switch(s) {
        case '\b':
          return '\\b';
        case '\f':
          return '\\f';
        case '\n':
          return '\\n';
        case '\r':
          return '\\r';
        case '\t':
          return '\\t';
        case '\v':
          return '\\v';
        case '"':
          return '\\"';
        case '\\':
          return '\\\\';
        }
      }) + '"';
    };

    var json = [];
    for (var file in top._$jscoverage) {
      var coverage = top._$jscoverage[file];
      var array = [];
      var length = coverage.length;
      for (var line = 0; line < length; line++) {
        var value = coverage[line];
        if (value === undefined || value === null) {
          value = 'null';
        }
        array.push(value);
      }
      json.push(quote(file) + ':[' + array.join(',') + ']');
    }
    json = '{' + json.join(',') + '}';

    var request = createRequest();
    var url = '/jscoverage-store';
    if (dir) {
      url += '/' + encodeURIComponent(dir);
    }
    request.open('POST', url, false);
    request.setRequestHeader('Content-Type', 'application/json');
    request.setRequestHeader('Content-Length', json.length.toString());
    request.send(json);
    if (request.status === 200 || request.status === 201 || request.status === 204) {
      return request.responseText;
    }
    else {
      throw request.status;
    }
  };
}
