#    Makefile.am - builds jscoverage
#    Copyright (C) 2007, 2008 siliconforks.com
#
#    This program is free software; you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation; either version 2 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License along
#    with this program; if not, write to the Free Software Foundation, Inc.,
#    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

SUBDIRS = js

AM_CFLAGS = -Ijs/src -DXP_UNIX

resources = help.txt jscoverage-server-help.txt \
            jscoverage-sh_main.js jscoverage-sh_javascript.js jscoverage-sh_nedit.css \
            jscoverage.html jscoverage.css jscoverage-ie.css jscoverage.js jscoverage-throbber.gif report.js

bin_PROGRAMS = jscoverage jscoverage-server
jscoverage_SOURCES = instrument.c instrument.h \
                     instrument-js.c instrument-js.h \
                     main.c \
                     resource-manager.c resource-manager.h \
                     stream.c stream.h \
                     util.c util.h \
                     $(resources)
jscoverage_LDFLAGS = -static
jscoverage_LDADD = js/libjs.la -lm
jscoverage_server_SOURCES = http-connection.c \
                            http-exchange.c \
                            http-host.c \
                            http-message.c \
                            http-server.c http-server.h \
                            http-url.c \
                            instrument-js.c instrument-js.h \
                            jscoverage-server.c \
                            resource-manager.c resource-manager.h \
                            stream.c stream.h \
                            util.c util.h \
                            $(resources)
jscoverage_server_LDFLAGS = -static
jscoverage_server_LDADD = js/libjs.la -lm @EXTRA_SOCKET_LIBS@ @EXTRA_THREAD_LIBS@

noinst_PROGRAMS = generate-resources
generate_resources_SOURCES = generate-resources.c

BUILT_SOURCES = resources.c

resources.c: generate-resources $(resources)
	$(srcdir)/generate-resources $(resources) > $@

dist_man_MANS = jscoverage.1 jscoverage-server.1

CLEANFILES = *.gcno *.exe resources.c *~

example: jscoverage
	$(srcdir)/jscoverage --exclude=.svn doc/example doc/instrumented

example-inverted: jscoverage
	$(srcdir)/jscoverage --exclude=.svn doc/example-inverted doc/instrumented-inverted

example-jsunit: jscoverage
	$(srcdir)/jscoverage --exclude=.svn --no-instrument=jsunit doc/example-jsunit doc/instrumented-jsunit

# override default install target so as not to recursively install subpackages
install: install-am
