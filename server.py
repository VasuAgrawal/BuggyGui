#!/usr/bin/env python3
"""Initializes data and http servers.

Starts both the HTTP and Data servers, as well as the Tornado IO loop to get
them both running.
"""

import logging
import tornado
import tornado.queues
import buggy_http_server
from buggy_data_server import BuggyDataServer
from buggy_http_server import BuggyHttpServer

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)

    http_sock = tornado.netutil.bind_sockets(8080)
    proc_num = tornado.process.fork_processes(2)

    if proc_num == 0:
        # Start a receiving TCP server on a single process, and close all
        # sockets opened for the HTTP server.
        for sock in http_sock:
            sock.close()
        data_server = BuggyDataServer()
        data_server.listen(4242)
    else:
        # Otherwise, just listen on one of the HTTP server sockets.
        BuggyHttpServer(proc_num).add_sockets(http_sock)

    tornado.ioloop.IOLoop.current().start()
