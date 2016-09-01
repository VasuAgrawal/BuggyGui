import cv2
import os
import logging
import tornado
import tornado.web
import tornado.websocket
import tornado.httpserver

clients = []
data_queue = None

class RootHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("static/index.html")



class BaseWsHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        logging.info("Websocket opened!")
        clients.append(self)

    def on_message(self, message):
        logging.info("Received message: %s", message)

    def on_close(self):
        logging.info("Websocket closed!")
        if self in clients:
            try:
                clients.remove(self)
            except:
                pass


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
    ], debug=True, **settings)


@tornado.gen.coroutine
def queue_test():
    while True:
        data_message = yield data_queue.get()
        for client in clients[::-1]:
            try:
                yield client.write_message(data_message, binary=True)
            except:
                try:
                    clients.remove(client)
                except:
                    pass


# This is meant to look like a class definition
def BuggyHttpServer(q): # pylint: disable=invalid-name
    global data_queue
    data_queue = q
    queue_test()
    return tornado.httpserver.HTTPServer(_make_app())
