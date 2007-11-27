/*
    main.c - JSCoverage main routine
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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "config.h"
#include "instrument.h"
#include "instrument-js.h"
#include "resource-manager.h"
#include "util.h"

int main(int argc, char ** argv) {
  int verbose = 0;

  // program = argv[0];
  program = "jscoverage";

  char * source = NULL;
  char * destination = NULL;

  char ** no_instrument = xmalloc((argc - 1) * sizeof(char *));
  int num_no_instrument = 0;

  char ** exclude = xmalloc((argc - 1) * sizeof(char *));
  int num_exclude = 0;

  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
      copy_resource_to_stream("help.txt", stdout);
      exit(EXIT_SUCCESS);
    }
    else if (strcmp(argv[i], "-V") == 0 || strcmp(argv[i], "--version") == 0) {
      printf("jscoverage %s\n", VERSION);
      exit(EXIT_SUCCESS);
    }
    else if (strcmp(argv[i], "-v") == 0 || strcmp(argv[i], "--verbose") == 0) {
      verbose = 1;
    }
    else if (strcmp(argv[i], "--no-instrument") == 0) {
      i++;
      if (i == argc) {
        fatal("--no-instrument: option requires an argument");
      }
      no_instrument[num_no_instrument] = argv[i];
      num_no_instrument++;
    }
    else if (strncmp(argv[i], "--no-instrument=", 16) == 0) {
      no_instrument[num_no_instrument] = argv[i] + 16;
      num_no_instrument++;
    }
    else if (strcmp(argv[i], "--exclude") == 0) {
      i++;
      if (i == argc) {
        fatal("--exclude: option requires an argument");
      }
      exclude[num_exclude] = argv[i];
      num_exclude++;
    }
    else if (strncmp(argv[i], "--exclude=", 10) == 0) {
      exclude[num_exclude] = argv[i] + 10;
      num_exclude++;
    }
    else if (strncmp(argv[i], "-", 1) == 0) {
      fatal("unrecognized option `%s'", argv[i]);
    }
    else if (source == NULL) {
      source = argv[i];
    }
    else if (destination == NULL) {
      destination = argv[i];
    }
    else {
      fatal("too many arguments");
    }
  }

  if (source == NULL || destination == NULL) {
    fatal("missing argument");
  }

  source = make_canonical_path(source);
  destination = make_canonical_path(destination);

  jscoverage_init();
  jscoverage_instrument(source, destination, verbose, exclude, num_exclude, no_instrument, num_no_instrument);
  jscoverage_cleanup();

  free(source);
  free(destination);
  free(exclude);
  free(no_instrument);

  exit(EXIT_SUCCESS);
}
