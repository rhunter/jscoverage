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
