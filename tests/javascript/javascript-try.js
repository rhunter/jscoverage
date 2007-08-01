try {
  x();
}
catch (e) {
  x();
}

try {
  x();
}
catch (e if e instanceof E) {
  x();
}

try {
  x();
}
finally {
  x();
}

try {
  x();
}
catch (e) {
  x();
}
finally {
  x();
}
