while (x) {
  x();
}

while (x) {
  ;
}

while (x)
  x();

while (x)
  ;

while (x) {
  if (x) {
    continue;
  }
}

label:
while (x) {
  if (x) {
    continue label;
  }
}
