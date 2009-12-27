if (typeof top === 'object' && top !== null) {
  if (typeof top.opener === 'object' && top.opener !== null) {
    // this is a browser window that was opened from another window
    if (typeof top.opener._$jscoverage === 'object' && top.opener._$jscoverage !== null) {
      var _$jscoverage = top._$jscoverage = top.opener._$jscoverage;
    }
    else {
      var _$jscoverage = top._$jscoverage = top.opener._$jscoverage = {};
    }
  }
  else {
    // this is a browser window
    if (typeof top._$jscoverage === 'object' && top._$jscoverage !== null) {
      var _$jscoverage = top._$jscoverage;
    }
    else {
      var _$jscoverage = top._$jscoverage = {};
    }
  }
}
else {
  // no "top" - this is not a browser window
  if (typeof _$jscoverage === 'object' && _$jscoverage !== null) {
    // nothing to do
  }
  else {
    var _$jscoverage = {};
  }
}
