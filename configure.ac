#    configure.ac - configures jscoverage
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

AC_PREREQ(2.61)
AC_INIT([jscoverage], [0.3.1])
AM_INIT_AUTOMAKE([-Wall foreign])
AC_CONFIG_SRCDIR([main.c])
AC_CONFIG_HEADERS([config.h])
AC_CANONICAL_HOST

# Checks for programs.
AC_PROG_CC
AC_PROG_CC_C99
AC_PROG_LIBTOOL

# Checks for libraries.

# Checks for header files.

# Checks for typedefs, structures, and compiler characteristics.

# Checks for library functions.
AC_CHECK_FUNCS([inet_aton strndup vasprintf asprintf])

AC_SUBST([EXTRA_SOCKET_LIBS])
AC_SUBST([EXTRA_THREAD_LIBS])
case "$host_os" in
  mingw*)
    EXTRA_SOCKET_LIBS='-lws2_32'
    EXTRA_THREAD_LIBS=''
    ;;
  *)
    EXTRA_SOCKET_LIBS=''
    EXTRA_THREAD_LIBS='-lpthread'
    ;;
esac

AC_CONFIG_FILES([Makefile make-dist.sh make-bin-dist.sh tests/Makefile])
AC_CONFIG_SUBDIRS([js])
AC_OUTPUT
