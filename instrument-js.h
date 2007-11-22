/*
    instrument-js.h - JavaScript instrumentation routines
    Copyright (C) 2007 siliconforks.com

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

#include <stdio.h>

enum FileType {
  FILE_TYPE_JS,
  FILE_TYPE_HTML,
  FILE_TYPE_UNKNOWN,
};

void jscoverage_init(void);

void jscoverage_cleanup(void);

void jscoverage_instrument_js(const char * id, FILE * input, FILE * output, const char * temporary_file_name);

#endif
