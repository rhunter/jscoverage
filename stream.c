/*
    stream.c - `Stream' object
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

#define _GNU_SOURCE

#include <config.h>

#include "stream.h"

#include <stdarg.h>
#include <stdint.h>
#include <string.h>

#include "util.h"

Stream * Stream_new(size_t capacity) {
  Stream * result = xmalloc(sizeof(Stream));
  result->length = 0;
  if (capacity == 0) {
    capacity = 8192;
  }
  result->capacity = capacity;
  result->data = xmalloc(capacity);
  return result;
}

void Stream_write(Stream * stream, const void * p, size_t size) {
  size_t stream_length = stream->length;

  if (SIZE_MAX - size < stream_length) {
    fatal("out of memory");
  }

  size_t new_length = stream_length + size;
  size_t new_capacity = stream->capacity;
  if (new_capacity < new_length) {
    if (SIZE_MAX / 2 < new_capacity) {
      new_capacity = SIZE_MAX;
    }
    else {
      new_capacity *= 2;
    }

    if (new_capacity < new_length) {
      new_capacity = new_length;
    }

    stream->data = xrealloc(stream->data, new_capacity);
    stream->capacity = new_capacity;
  }

  memcpy(stream->data + stream_length, p, size);
  stream->length = new_length;
}

void Stream_write_string(Stream * stream, const char * s) {
  Stream_write(stream, s, strlen(s));
}

void Stream_write_char(Stream * stream, char c) {
  Stream_write(stream, &c, 1);
}

void Stream_printf(Stream * stream, const char * format, ...) {
  va_list a;
  va_start(a, format);

  char * s = NULL;
  /* note that size does not include the NUL character */
  int size = vasprintf(&s, format, a);
  if (size < 0) {
    fatal("out of memory");
  }
  Stream_write(stream, s, size);
  free(s);

  va_end(a);
}

void Stream_write_file_contents(Stream * stream, FILE * f) {
  char buffer[8192];
  size_t bytes_read;
  while ((bytes_read = fread(buffer, 1, 8192, f)) > 0) {
    Stream_write(stream, buffer, bytes_read);
  }
}

void Stream_delete(Stream * stream) {
  free(stream->data);
  free(stream);
}

void Stream_reset(Stream * stream) {
  stream->length = 0;
}
