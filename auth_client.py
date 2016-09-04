"""Creates an authenticated TCP client against the local data server."""

import logging
import tornado
import tornado.tcpclient
from protos.auth_pb2 import AuthMessage
from packet import Packet

class AuthClient(tornado.tcpclient.TCPClient):
    HOST = "localhost"
    PORT = 4242

    def __init__(self, secret_key, team_name, buggy_name):
        super().__init__()
        self.stream = None
        self.stream_ok = False
        self.secret_key = secret_key
        self.team_name = team_name
        self.buggy_name = buggy_name

    async def make_auth_connection(self):
        """Tries to connect to the server to auth against it.

        Might throw an exception.
        """
        auth_message = AuthMessage()
        auth_message.secret_key = self.secret_key
        auth_message.team_name = self.team_name
        auth_message.buggy_name = self.buggy_name
        data = Packet.make_packet_from_bytes(auth_message.SerializeToString())
        await self.stream.write(data)
        self.stream_ok = True

    @tornado.gen.coroutine
    def make_connection(self):
        if not self.stream:
            try:
                self.stream = yield self.connect(self.HOST, self.PORT)
                yield self.make_auth_connection()
            except tornado.iostream.StreamClosedError as e:
                logging.warning("%s [Hint: server may be down!]", e)
        elif self.stream.closed():
            self.stream = None
            self.stream_ok = False
