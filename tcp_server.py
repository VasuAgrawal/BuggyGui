import tornado
import tornado.queues
import logging
from buggy_data_server import BuggyDataServer
from buggy_http_server import BuggyHttpServer

if __name__ == "__main__":
    logging.basicConfig(level = logging.DEBUG)
    data_queue = tornado.queues.Queue()

    # Currently, both servers are started in a single process. This needs to be
    # split up into a multiprocess configuration later.
    # TODO(vasua): Figure out how to properly do the fork.
    data_sock= tornado.netutil.bind_sockets(4242)
    data_server= BuggyDataServer(data_queue)
    data_server.add_sockets(data_sock)

    http_sock = tornado.netutil.bind_sockets(8080)
    http_server = BuggyHttpServer(data_queue)
    http_server.add_sockets(http_sock)

    tornado.ioloop.IOLoop.instance().start()
