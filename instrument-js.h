/*
    instrument-js.h - JavaScript instrumentation routines
    Copyright (C) 2007, 2008 siliconforks.com

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

#ifndef INSTRUMENT_JS_H_
#define INSTRUMENT_JS_H_

#include "stream.h"
#include "util.h"

enum FileType {
  FILE_TYPE_JS,
  FILE_TYPE_HTML,
  FILE_TYPE_OTHER
};

void jscoverage_init(void);

void jscoverage_cleanup(void);

void jscoverage_instrument_js(const char * id, const char * encoding, Stream * input, Stream * output);

void jscoverage_copy_resources(const char * destination_directory);

typedef struct Coverage Coverage;

typedef struct FileCoverage {
  char * id;

  int * lines;
  uint32_t num_lines;

  char * source;
} FileCoverage;

Coverage * Coverage_new(void);

void Coverage_delete(Coverage * coverage);

typedef void (*CoverageForeachFunction) (const FileCoverage * file_coverage, int i, void * p);

void Coverage_foreach_file(Coverage * coverage, CoverageForeachFunction f, void * p);

int jscoverage_parse_json(Coverage * coverage, const uint8_t * data, size_t length) __attribute__((warn_unused_result));

#endif
