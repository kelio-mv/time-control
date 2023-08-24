import http.server
import socketserver
import webbrowser


PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    print("You can close this window once you're done using the app\n")
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()
