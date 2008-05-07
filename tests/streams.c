/*
    streams.c - test `Stream' object
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

#include <assert.h>
#include <string.h>

#include "stream.h"

int main(void) {
  Stream * stream;

  stream = Stream_new(0);
  Stream_write_string(stream, "a");
  Stream_write_string(stream, "bc");
  assert(stream->length == 3);
  assert(memcmp(stream->data, "abc", 3) == 0);
  Stream_delete(stream);

  stream = Stream_new(0);
  Stream_printf(stream, "%s %d\n", "abc", 123);
  assert(stream->length == 8);
  assert(memcmp(stream->data, "abc 123\n", 8) == 0);
  Stream_delete(stream);

  exit(EXIT_SUCCESS);
}
