"""Class to receive and handle data from a buggy."""

import tornado
import tornado.tcpserver
import tornado.gen
import tornado.web
import logging
import stream_auth
from packet import Packet
from protos.message_pb2 import DataMessage

class BuggyDataServer(tornado.tcpserver.TCPServer):
    @tornado.gen.coroutine
    def handle_stream(self, stream, address):
        logging.debug("Incoming connection request from %s", address) 
        buggy_info = yield stream_auth.auth_stream(stream, address)
        if not buggy_info:
            return
        logging.debug("Starting to receive data from %s's buggy %s!",
                buggy_info.team_name, buggy_info.buggy_name)
        while True:
            data_message = yield Packet.get_packet_data_as_bytes_from_stream(stream)
            yield self.data_queue.put(data_message)
            # data = DataMessage()
            # data.ParseFromString(data_message)
            # logging.info(data)
            
            # logging.info(data)
            # yield self.data_queue.put(data)

    def __init__(self, data_queue, *args, **kwargs):
        self.data_queue = data_queue
        super().__init__(*args, **kwargs)
