#     Makefile.am - build tests
#     Copyright (C) 2007, 2008 siliconforks.com
# 
#     This program is free software; you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation; either version 2 of the License, or
#     (at your option) any later version.
# 
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
# 
#     You should have received a copy of the GNU General Public License along
#     with this program; if not, write to the Free Software Foundation, Inc.,
#     51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

noinst_PROGRAMS = recursive-dir-list mkdirs streams

recursive_dir_list_SOURCES = recursive-dir-list.c ../util.c

mkdirs_SOURCES = mkdirs.c ../util.c

streams_SOURCES = streams.c ../stream.c ../util.c

TESTS = fatal.sh \
        help.sh \
        invalid-option.sh \
        javascript.sh \
        no-arguments.sh \
        recursive.sh \
        recursive-fatal.sh \
        recursive-no-instrument.sh \
        same-directory.sh \
        version.sh \
        mkdirs.sh \
        recursive-dir-list.sh \
        streams.sh
