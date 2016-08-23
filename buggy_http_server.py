import os
import logging
import tornado
import tornado.web
import tornado.websocket
import tornado.httpserver


class RootHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("static/index.html")

clients = []


class BaseWsHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        logging.info("Websocket opened!")
        clients.append(self)

    def on_message(self, message):
        logging.info("Received message: %s", message)

    def on_close(self):
        logging.info("Websocket closed!")
        if self in clients:
            clients.remove(self)


def _make_app():
    settings = {
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
    }

    return tornado.web.Application([
        (r"/", RootHandler),
        (r"/ws", BaseWsHandler),
        # Serve the proto files we need, and only those ending in .proto
        (r"/protos/(.*proto$)", tornado.web.StaticFileHandler,
         {'path': os.path.join(os.path.dirname(__file__), "protos")})
    ], debug = True, **settings)


@tornado.gen.coroutine
def queue_test():
    while True:
        data_message = yield data_queue.get()
        for i, wsclient in enumerate(clients):
            logging.info("Sending data to client %d", i)
            yield wsclient.write_message(data_message, binary=True)


def BuggyHttpServer(q):
    global data_queue
    data_queue = q
    queue_test()
    return tornado.httpserver.HTTPServer(_make_app())
