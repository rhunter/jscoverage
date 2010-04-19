export PATH=.:..:../js:$PATH

json_cmp() {
  echo 'EXPECTED = ' | cat - $1 > EXPECTED
  echo 'ACTUAL = ' | cat - $2 > ACTUAL
  js -f EXPECTED -f ACTUAL -f json-cmp.js
}

add_header_to_file() {
  source=$1
  destination=$2
  cat ../header.txt  ../header.js $source > $destination
}

add_header_to_files() {
  directory=$1
  cp -R $directory EXPECTED
  find EXPECTED -name .svn | xargs rm -fr
  for i in `find EXPECTED -name '*.js'`
  do
    add_header_to_file $i TMP-common.js
    mv TMP-common.js $i
  done
}
