#    Makefile.am - builds jscoverage
#    Copyright (C) 2007 siliconforks.com
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

resources = help.txt \
            sh_main.min.js sh_javascript.min.js sh_nedit.css \
            jscoverage.html jscoverage.css jscoverage.js jscoverage-throbber.gif

bin_PROGRAMS = jscoverage
jscoverage_SOURCES = instrument.c instrument.h \
                     instrument-js.c instrument-js.h \
                     main.c \
                     resource-manager.c resource-manager.h \
                     util.c util.h \
                     $(resources)
jscoverage_LDADD = js/.libs/libjs.a -lm

noinst_PROGRAMS = generate-resources
generate_resources_SOURCES = generate-resources.c

BUILT_SOURCES = resources.c

resources.c: generate-resources $(resources)
	$(srcdir)/generate-resources $(resources) > $@

CLEANFILES = *.gcno *.exe resources.c *~

example: jscoverage
	$(srcdir)/jscoverage --exclude=.svn doc/example doc/instrumented
