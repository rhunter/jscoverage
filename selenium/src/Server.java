/*
    Server.java - HTTP server
    Copyright (C) 2008, 2009, 2010 siliconforks.com

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

import java.io.*;
import java.net.*;

import com.sun.net.httpserver.*;

public class Server implements HttpHandler {
  private final String path;

  public Server(String path) {
    this.path = path;
  }

  public void handle(HttpExchange exchange) throws IOException {
    try {
      String method = exchange.getRequestMethod();
      URI uri = exchange.getRequestURI();
      String protocol = exchange.getProtocol();
      System.out.println(method + " " + uri + " " + protocol);

      OutputStream outputStream = exchange.getResponseBody();
      try {
        InputStream inputStream;
        try {
          inputStream = new FileInputStream(path + uri.getPath());
        }
        catch (IOException e) {
          String response = "Not found";
          exchange.sendResponseHeaders(404, response.length());
          outputStream.write(response.getBytes());
          return;
        }

        try {
          exchange.sendResponseHeaders(200, 0);
          byte[] bytes = new byte[8192];
          for (;;) {
            int bytesRead = inputStream.read(bytes);
            if (bytesRead <= 0) {
              break;
            }
            outputStream.write(bytes, 0, bytesRead);
          }
        }
        finally {
          inputStream.close();
        }
      }
      finally {
        outputStream.close();
      }
    }
    finally {
      exchange.close();
    }
  }

  public static void main(String[] args) throws IOException {
    String path = ".";
    if (args.length > 0) {
      path = args[0];
    }
    Server server = new Server(path);
    InetSocketAddress address = new InetSocketAddress(8000);
    HttpServer httpServer = HttpServer.create(address, 0);
    httpServer.createContext("/", server);
    httpServer.start();
    System.out.println("Starting server ...");
  }
}
