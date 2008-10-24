// https://developer.mozilla.org/en/New_in_JavaScript_1.7

function range(begin, end) {
  for (let i = begin; i < end; ++i) {
    yield i;
  }
}
var ten_squares = [i * i for each (i in range(0, 10))];
var evens = [i for each (i in range(0, 21)) if (i % 2 == 0)];