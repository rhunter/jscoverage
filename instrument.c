/*
    instrument.c - file and directory instrumentation routines
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

#include "instrument.h"

#include <assert.h>
#include <errno.h>
#include <string.h>

#include <dirent.h>
#include <sys/stat.h>
#include <sys/types.h>

#include "instrument-js.h"
#include "resource-manager.h"
#include "util.h"

static int g_verbose = 0;

static int string_ends_with(const char * s, const char * suffix) {
  size_t length = strlen(s);
  size_t suffix_length = strlen(suffix);
  if (length < suffix_length) {
    return 0;
  }
  return strcasecmp(s + (length - suffix_length), suffix) == 0;
}

static enum FileType get_file_type(const char * file) {
  if (string_ends_with(file, ".js")) {
    return FILE_TYPE_JS;
  }
  else if (string_ends_with(file, ".html") || string_ends_with(file, ".htm")) {
    return FILE_TYPE_HTML;
  }
  else {
    return FILE_TYPE_UNKNOWN;
  }
}

static void highlight_file(const char * source_file, const char * destination_file, const char * relative_path) {
  int depth = 0;
  for (const char * p = relative_path; *p != '\0'; p++) {
    if (*p == '/' || *p == '\\') {
      depth++;
    }
  }

  enum FileType file_type = get_file_type(relative_path);
  const char * suffix = ".jscoverage.html";
  char * highlighted_file = xmalloc(strlen(destination_file) + strlen(suffix) + 1);
  strcpy(highlighted_file, destination_file);
  strcat(highlighted_file, suffix);

  FILE * input = xfopen(source_file, "r");
  FILE * output = xfopen(highlighted_file, "w");

  free(highlighted_file);

  char * relative_path_to_ancestor = xmalloc(depth * 3 + 1);
  for (int i = 0; i < depth; i++) {
    strcpy(relative_path_to_ancestor + i * 3, "../");
  }
  relative_path_to_ancestor[depth * 3] = '\0';

  fprintf(output, "<html><head><title>%s</title>\n", relative_path);
  fprintf(output, "<link rel=\"stylesheet\" type='text/css' href='%sjscoverage.css'>\n", relative_path_to_ancestor);
  fprintf(output, "<link rel=\"stylesheet\" type='text/css' href='%sjscoverage-sh_nedit.css'>\n", relative_path_to_ancestor);
  fprintf(output, "<script src=\"%sjscoverage.js\"></script>\n", relative_path_to_ancestor);
  fprintf(output, "<script src=\"%sjscoverage-sh_main.js\"></script>\n", relative_path_to_ancestor);
  fprintf(output, "<script src=\"%sjscoverage-sh_javascript.js\"></script>\n", relative_path_to_ancestor);
  fprintf(output, "<script>\n");
  fprintf(output, "var gCurrentFile = \"%s\";\n", relative_path);
  fprintf(output, "</script>\n");
  fprintf(output, "</head><body onload=\"source_load();\">\n");
  fprintf(output, "<h1>%s</h1>\n", relative_path);
  fprintf(output, "<pre id=\"sourceDiv\" class='sh_%s'>", file_type == FILE_TYPE_JS? "javascript": "html");
  free(relative_path_to_ancestor);

  int c;
  int atLineStart = 1;
  int line = 1;
  while ((c = fgetc(input)) != EOF) {
    if (atLineStart) {
      atLineStart = 0;
    }

    if (c == '<') {
      fprintf(output, "&lt;");
    }
    else if (c == '>') {
      fprintf(output, "&gt;");
    }
    else if (c == '&') {
      fprintf(output, "&amp;");
    }
    else {
      if (c == '\n') {
        line++;
        atLineStart = 1;
      }
      fputc(c, output);
    }
  }
  fprintf(output, "</pre></body></html>\n");

  fclose(output);
  fclose(input);

  suffix = ".jscoverage.js";
  char original_file[strlen(destination_file) + strlen(suffix) + 1];
  strcpy(original_file, destination_file);
  strcat(original_file, suffix);
  copy_file(source_file, original_file);
}

static void check_same_file(const char * file1, const char * file2) {
  if (is_same_file(file1, file2)) {
    fatal("source and destination are the same");
  }
}

static void check_contains_file(const char * file1, const char * file2) {
  if (contains_file(file1, file2)) {
    fatal("%s contains %s", file1, file2);
  }
}

static void instrument_file(const char * source_file, const char * destination_file, const char * id, int instrumenting) {
  if (g_verbose) {
    printf("Instrumenting file %s\n", id);
  }

  /* check if they are the same */
  char * canonical_source_file = make_canonical_path(source_file);
  char * canonical_destination_file = make_canonical_path(destination_file);
  check_same_file(canonical_source_file, canonical_destination_file);
  free(canonical_source_file);
  free(canonical_destination_file);

  if (instrumenting) {
    enum FileType file_type = get_file_type(source_file);
    switch (file_type) {
    case FILE_TYPE_UNKNOWN:
    case FILE_TYPE_HTML:
      copy_file(source_file, destination_file);
      break;
    case FILE_TYPE_JS:
      highlight_file(source_file, destination_file, id);
      {
        FILE * input = xfopen(source_file, "r");
        FILE * output = xfopen(destination_file, "w");
        jscoverage_instrument_js(id, input, output);
        fclose(input);
        fclose(output);
      }
      break;
    }
  }
  else {
    copy_file(source_file, destination_file);
  }
}

void jscoverage_instrument(const char * source,
                           const char * destination,
                           int verbose,
                           char ** exclude,
                           int num_exclude,
                           char ** no_instrument,
                           int num_no_instrument)
{
  assert(source != NULL);
  assert(destination != NULL);

  g_verbose = verbose;

  /* check if they are the same */
  check_same_file(source, destination);

  /* check if source directory is an ancestor of destination directory */
  check_contains_file(source, destination);

  /* check that the source exists and is a directory */
  struct stat buf;
  xstat(source, &buf);
  if (! S_ISDIR(buf.st_mode)) {
    fatal("not a directory: %s", source);
  }

  /* if the destination directory exists, check that it is a jscoverage directory */
  if (stat(destination, &buf) == 0) {
    /* it exists */
    if (! S_ISDIR(buf.st_mode)) {
      fatal("not a directory: %s", destination);
    }
    if (! directory_is_empty(destination)) {
      char * jscoverage_html = make_path(destination, "jscoverage.html");
      if (stat(jscoverage_html, &buf) == -1) {
        fatal("refusing to overwrite directory: %s", destination);
      }
      free(jscoverage_html);
    }
  }
  else if (errno == ENOENT) {
    xmkdir(destination);
  }
  else {
    fatal("cannot stat directory: %s", destination);
  }

  /* finally: copy the directory */
  struct DirListEntry * list = make_recursive_dir_list(source);
  for (struct DirListEntry * p = list; p != NULL; p = p->next) {
    char * s = make_path(source, p->name);
    char * d = make_path(destination, p->name);

    /* check if it's on the exclude list */
    for (int i = 0; i < num_exclude; i++) {
      char * x = make_path(source, exclude[i]);
      if (is_same_file(x, s) || contains_file(x, s)) {
        free(x);
        goto cleanup;
      }
      free(x);
    }

    char * dd = make_dirname(d);
    mkdirs(dd);
    free(dd);

    int instrument_this = 1;

    /* check if it's on the no-instrument list */
    for (int i = 0; i < num_no_instrument; i++) {
      char * ni = make_path(source, no_instrument[i]);
      if (is_same_file(ni, s) || contains_file(ni, s)) {
        instrument_this = 0;
      }
      free(ni);
    }

    instrument_file(s, d, p->name, instrument_this);

  cleanup:
    free(s);
    free(d);
  }
  free_dir_list(list);
}

void jscoverage_copy_resources(const char * destination_directory) {
  copy_resource("jscoverage.html", destination_directory);
  copy_resource("jscoverage.css", destination_directory);
  copy_resource("jscoverage.js", destination_directory);
  copy_resource("jscoverage-throbber.gif", destination_directory);
  copy_resource("jscoverage-sh_main.js", destination_directory);
  copy_resource("jscoverage-sh_javascript.js", destination_directory);
  copy_resource("jscoverage-sh_nedit.css", destination_directory);
}
