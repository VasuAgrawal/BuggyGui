import os
import logging

import tornado
import tornado.web
import tornado.websocket
import tornado.httpserver
import tornado.queues

from auth_client import AuthClient
from packet import Packet

clients = set()
data_queue = tornado.queues.Queue()


class RootHandler(tornado.web.RequestHandler):

    def get(self):
        self.render("static/index.html")


class BaseWsHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        clients.add(self)

    def on_message(self, message):
        logging.info("Received message: %s", message)

    def on_close(self):
        logging.info("Websocket closed!")
        try:
            clients.remove(self)
        except:
            pass


class SubClient(AuthClient):

    # Listen for data from the socket, constantly.
    @tornado.gen.coroutine
    def listen(self):
        while True:
            if (self.stream_ok):
                data_message = (
                    yield Packet.get_packet_data_as_bytes_from_stream(self.stream))
                data_queue.put(data_message)
            else:
                yield tornado.gen.sleep(1)

# TODO(vasua): Overhaul this to be rate limited to the client, preferring to
# send larger chunks of data in slower intervals. The client will the need to
# figure out whether to use the newest piece of data, or use all of them. This
# is probably something that can be negotiated between the MessageMaster and the
# server with no change to any of the clients.
# TODO(vasua): Run this behind an nginx load balancer.
# TODO(vasua): Run this inside a docker container.
class BuggyHttpServer(tornado.httpserver.HTTPServer):

    @staticmethod
    def make_app():
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
    def queue_test(self):
        while True:
            data_message = yield data_queue.get()

            for client in clients:
                try:
                    client.write_message(data_message, binary=True)
                except:
                    pass

    def __new__(cls, *args, **kwargs):
        # We want to keep the make_app configuration internal to the class
        # instead of exposing it externally.
        return super().__new__(cls, cls.make_app())

    def __init__(self, server_num, *args, **kwargs):
        self.server_num = server_num
        secret_key = "Server%d" % server_num
        client = SubClient(secret_key, "Server", "%s" % server_num)
        tornado.ioloop.PeriodicCallback(client.make_connection, 1000).start()
        client.listen()
        self.queue_test()
