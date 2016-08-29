#!/usr/bin/env python3

import logging
from protos.auth_pb2 import AuthMessage
from protos.message_pb2 import DataMessage
from protos.message_pb2 import LogMessage
from packet import Packet
import base64
import random
import time
import tornado
import cv2
import numpy as np
from tornado.tcpclient import TCPClient

words = """
There is a theory which states that if ever anyone discovers exactly what the
Universe is for and why it is here, it will instantly disappear and be replaced
by something even more bizarre and inexplicable. There is another theory which
states that this has already happened.
""".split()


class Client(TCPClient):
    HOST = "localhost"
    PORT = 4242

    def __init__(self):
        super().__init__()
        self.stream = None
        self.stream_ok = False
        try:
            self.camera = cv2.VideoCapture(0)
            raise Exception()
        except:
            self.camera = None
            self.imageColor = np.zeros(3, np.uint8)

    async def make_auth_connection(self):
        """Tries to connect to the server to auth against it.

        Might throw an exception.
        """
        auth_message = AuthMessage()
        auth_message.secret_key = "42"
        auth_message.team_name = "RoboBuggy"
        auth_message.buggy_name = "Transistor"
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

    def make_timestamp(self, timestamp):
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10**9)
        timestamp.seconds = seconds
        timestamp.nanos = nanos

    def make_gps_data(self, data):
        data.gps.lat = random.uniform(40.5, 41)
        data.gps.long = random.uniform(42, 42.5)
        self.make_timestamp(data.gps.time)
        data.data_type = DataMessage.GPS

    def make_status_data(self, data):
        # Just generate some fake text to make my life interesting.
        level = random.choice(["DEBUG", "WARNING", "INFO", "ERROR", "FATAL"])
        data.status.log_level = getattr(LogMessage, level)
        data.status.text = " ".join(
            [random.choice(words).strip() for _ in range(10)])
        self.make_timestamp(data.status.time)
        data.data_type = DataMessage.STATUS

    def make_imu_data(self, data):
        data.imu.roll = random.uniform(-1, 1)
        data.imu.pitch = random.uniform(-2, 2)
        data.imu.yaw = random.uniform(-3, 3)
        self.make_timestamp(data.imu.time)
        data.data_type = DataMessage.IMU

    def make_camera_data(self, data):
        data.camera.width = 3
        data.camera.height = 3

        # Lets you switch between camera and generated imagery
        image = None
        if self.camera is not None:
            image = self.camera.read()[1]
        if image is None:
            image = np.ones((data.camera.height, data.camera.width, 3), np.uint8)
            image *= self.imageColor
            toAdd = np.array([0, 0, 0], np.uint8)
            toAdd[random.randint(0, len(toAdd) - 1)] = random.randint(0, 10)
            self.imageColor += toAdd
            self.imageColor %= 255

        data.camera.image = cv2.imencode(".jpg", image)[1].tostring()
        self.make_timestamp(data.camera.time)
        data.data_type = DataMessage.CAMERA

    def async_send_stream(self, gen_fn):
        async def send():
            if (self.stream_ok):
                try:
                    data = DataMessage()
                    gen_fn(data)
                    await self.stream.write(Packet.make_packet_from_bytes(
                        data.SerializeToString()))
                except tornado.iostream.StreamClosedError as e:
                    logging.warning(
                        "%s, unable to send message. [Hint: server may be down!]", e)
        return send


# Setup the client
logging.basicConfig(level=logging.DEBUG)
client = Client()

# Every second, try to authenticate and establish a connection.
tornado.ioloop.PeriodicCallback(client.make_connection, 1000).start()
# Periodically send various types of messages
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_status_data), 5).start() # 200 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_imu_data), 20).start() # 50 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_gps_data), 1000).start() # 1 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_camera_data), 30).start() # 30 hz

tornado.ioloop.IOLoop.instance().start()
