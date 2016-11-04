#!/usr/bin/env python3

"""Class to receive and handle data from a buggy."""

import numpy as np
import cv2
import math
import os
import logging
import struct
import time
import tornado
import tornado.tcpserver
import tornado.gen
import tornado.iostream
import tornado.web
import stream_auth
from packet import Packet
from protos.message_pb2 import DataMessage
from protos.message_pb2 import ImageMessage


class BuggyDataServer(tornado.tcpserver.TCPServer):

    def __init__(self, *args, **kwargs):
        self.prev_image = None
        self.keyframe_time = time.time()
        self.diff_time = 5  # seconds
        self.httpservers = set()

        # Note that these files will be created with root ownership, not user.
        # This is fine for the server case, and is a consequence of docker
        # images running as the root user.
        dirname = os.path.dirname(os.path.realpath(__file__))
        self.log_filename = os.path.join(dirname, "logs", str(math.floor(time.time())))
        os.makedirs(os.path.dirname(self.log_filename), exist_ok=True)
        os.chmod(os.path.dirname(self.log_filename), 0o755)

        with open(self.log_filename, "wb+"):
            pass

        os.chmod(self.log_filename, 0o644)

        super().__init__(*args, **kwargs)

    def cameraStuff(self, data):
        if (data.data_type == DataMessage.CAMERA):
            # Always decode the image.
            current_image = cv2.imdecode(np.fromstring(data.camera.image,
                                                       np.uint8), 1)
            

            # Some conditions under which we let the keyframe pass through
            # TODO(vasua): Condense these.
            data.camera.frame_type = ImageMessage.KEYFRAME
            if self.prev_image is None:
                self.prev_image = current_image
                return
            if (time.time() - self.keyframe_time) > self.diff_time:
                self.keyframe_time = time.time()
                self.prev_image = current_image
                return
            if (current_image.shape != self.prev_image.shape):
                self.prev_image = current_image
                return

            # If none of those things happen, then we need to condense the data
            # into a delta image rather than a keyframe.
            data.camera.frame_type = ImageMessage.DELTA
            diff = current_image - self.prev_image
            data.camera.image = cv2.imencode(".png", diff)[1].tostring()
            self.prev_image = current_image

            # TODO(vasua): Figure out some better means of denoising the image.
            # image = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
            diff = cv2.GaussianBlur(diff, (5, 5), 0)

            # cv2.imshow("DATA SERVER", diff)
            # cv2.waitKey(1)

    @tornado.gen.coroutine
    def handle_server(self, stream, address):
        # Takes an auth'd server and sends data to it.
        self.httpservers.add(stream)

    @tornado.gen.coroutine
    def handle_buggy(self, stream, address, key):
        while True:
            try:
                data_message = (
                    yield Packet.get_packet_data_as_bytes_from_stream(stream))
                logging.debug("Got data from the buggy!")
                data = DataMessage()
                data.ParseFromString(data_message)
                self.cameraStuff(data)
                data_message = data.SerializeToString()
                with open(self.log_filename, "ab+") as out:
                    length = struct.pack("!I", len(data_message))
                    out.write(length + data_message)

                for server in self.httpservers:
                    server.write(Packet.make_packet_from_bytes(data_message))
            except (tornado.iostream.StreamClosedError, AssertionError) as e:
                # Make sure to return, otherwise we get stuck in an infinite
                # loop here and the server dies.
                stream_auth.reset_key(key)
                return


    @tornado.gen.coroutine
    def handle_stream(self, stream, address):
        logging.info("Incoming connection request from %s", address)
        buggy_info = yield stream_auth.auth_stream(stream, address)
        if not buggy_info:
            return
        logging.info("Starting to receive data from %s's buggy %s!",
                      buggy_info.team_name, buggy_info.buggy_name)

        # There has to be a better way.
        if buggy_info.team_name == "Server":
            self.handle_server(stream, address)
        else:
            self.handle_buggy(stream, address, buggy_info.secret_key)

if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    BuggyDataServer().listen(4242)
    tornado.ioloop.IOLoop.current().start()
