function x() {}

function x() {
  ;
}

function x() {
  x();
  return 'x';
}

function x(a) {
  x();
}

function x(a, b) {
  x();
}

x = function() {
  x();
};
