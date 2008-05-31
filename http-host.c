/*
    http-host.c - thread-safe host lookup
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

#include <config.h>

#include "http-server.h"

#include <errno.h>
#include <netdb.h>

#include "util.h"

int xgethostbyname(const char * host, struct in_addr * a) {
#ifdef __CYGWIN__
  /* cygwin's gethostbyname is thread-safe */
  struct hostent * p = gethostbyname(host);
  if (p == NULL || p->h_addrtype != AF_INET) {
    return -1;
  }
  *a = *((struct in_addr *) p->h_addr);
  return 0;
#else
  struct hostent h;
  struct hostent * p;
  char * buffer;
  size_t buffer_size;
  int error;
  int result;

  buffer_size = 1024;
  buffer = xmalloc(buffer_size);
  while ((result = gethostbyname_r(host, &h, buffer, buffer_size, &p, &error)) == ERANGE) {
    buffer_size = mulst(buffer_size, 2);
    buffer = xrealloc(buffer, buffer_size);
  }
  if (result != 0 || p == NULL || p->h_addrtype != AF_INET) {
    free(buffer);
    return -1;
  }
  *a = *((struct in_addr *) p->h_addr);
  free(buffer);
  return 0;
#endif
}
