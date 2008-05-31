#    POSTServer.py - HTTP POST server for testing jscoverage-server --proxy
#    Copyright (C) 2008 siliconforks.com
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


import BaseHTTPServer
import SimpleHTTPServer
import os


class POSTServer(SimpleHTTPServer.SimpleHTTPRequestHandler):
  def do_POST(self):
    header = self.headers.getheader('content-length')
    if header is not None:
      length = int(header)
      postdata = self.rfile.read(length)
    self.send_response(200);
    self.send_header("Content-type", "text/html")
    self.end_headers()
    if header is not None:
      self.wfile.write(postdata);


def test(HandlerClass = POSTServer,
         ServerClass = BaseHTTPServer.HTTPServer):
    BaseHTTPServer.test(HandlerClass, ServerClass)


if __name__ == '__main__':
    test()
