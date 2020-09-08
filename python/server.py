#!/usr/bin/env python2
import argparse
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import sys
import os
import base64
import ssl
import SocketServer

key = ""
class AuthHandler(SimpleHTTPRequestHandler):
    ''' Main class to present webpages and authentication. '''
    def do_HEAD(self):
        print "send header"
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_AUTHHEAD(self):
        print "send header"
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm=\"Test\"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        global key
        ''' Present frontpage with user authentication. '''
        if self.headers.getheader('Authorization') == None:
            self.do_AUTHHEAD()
            self.wfile.write('no auth header received')
            pass
        elif self.headers.getheader('Authorization') == 'Basic '+key:
            SimpleHTTPRequestHandler.do_GET(self)
            pass
        else:
            self.do_AUTHHEAD()
            self.wfile.write(self.headers.getheader('Authorization'))
            self.wfile.write('not authenticated')
            pass

def serve_https(certfile,
                https_port=80,
                HandlerClass = AuthHandler,
                ServerClass = BaseHTTPServer.HTTPServer):
    httpd = SocketServer.TCPServer(("", https_port), HandlerClass)
    httpd.socket = ssl.wrap_socket (httpd.socket, certfile=certfile, server_side=True)

    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."
    httpd.serve_forever()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('certfile')
    parser.add_argument('--port', type=int, required=True)
    parser.add_argument('--username', required=True)
    parser.add_argument('--password', required=True)
    args = parser.parse_args()

    key = base64.b64encode('{}:{}'.format(args.username, args.password))

    serve_https(args.certfile, args.port)
