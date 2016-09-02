"""Class to receive and handle data from a buggy."""

import numpy as np
import cv2
import logging
import time
import tornado
import tornado.tcpserver
import tornado.gen
import tornado.web
import stream_auth
from packet import Packet
from protos.message_pb2 import DataMessage
from protos.message_pb2 import ImageMessage


class BuggyDataServer(tornado.tcpserver.TCPServer):

    def __init__(self, data_queue, *args, **kwargs):
        self.data_queue = data_queue
        self.prev_image = None
        self.keyframe_time = time.time()
        self.diff_time = 5  # seconds

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

    @tornado.gen.coroutine
    def handle_stream(self, stream, address):
        logging.debug("Incoming connection request from %s", address)
        buggy_info = yield stream_auth.auth_stream(stream, address)
        if not buggy_info:
            return
        logging.debug("Starting to receive data from %s's buggy %s!",
                      buggy_info.team_name, buggy_info.buggy_name)
        while True:
            data_message = (
                yield Packet.get_packet_data_as_bytes_from_stream(stream))
            data = DataMessage()
            data.ParseFromString(data_message)
            self.cameraStuff(data)
            data_message = data.SerializeToString()

            self.data_queue.put(data_message)
