#!/usr/bin/env python3

import logging
import random
import time

import cv2
import numpy as np
import tornado
from auth_client import AuthClient
from protos.auth_pb2 import AuthMessage
from protos.message_pb2 import DataMessage
from protos.message_pb2 import LogMessage
from packet import Packet

words = """
There is a theory which states that if ever anyone discovers exactly what the
Universe is for and why it is here, it will instantly disappear and be replaced
by something even more bizarre and inexplicable. There is another theory which
states that this has already happened.
""".split()


class Client(AuthClient):
    HOST = "localhost"
    PORT = 4242

    def __init__(self):
        super().__init__("42", "RoboBuggy", "Transistor")
        try:
            # Uncomment this to switch to generated colors
            raise Exception()
            self.camera = cv2.VideoCapture(0)
        except:
            self.camera = None
            self.image_color = np.zeros(3, np.uint8)

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
        data.camera.width = 300
        data.camera.height = 300

        # Lets you switch between camera and generated imagery
        image = None
        if self.camera is not None:
            image = self.camera.read()[1]
            image = cv2.resize(image, (0, 0), fx=.5, fy=.5)
            data.camera.width = image.shape[1]
            data.camera.height = image.shape[0]

        if image is None:
            image = np.ones(
                (data.camera.height, data.camera.width, 3), np.uint8)
            image *= self.image_color
            to_add = np.array([0, 0, 0], np.uint8)
            to_add[random.randint(0, len(to_add) - 1)] = random.randint(0, 10)
            self.image_color += to_add

        data.camera.image = cv2.imencode(".png", image)[1].tostring()
        self.make_timestamp(data.camera.time)
        data.data_type = DataMessage.CAMERA
        cv2.imshow("TEST CLIENT", image)
        cv2.waitKey(1)

    def async_send_stream(self, gen_fn):
        async def send():
            if self.stream_ok:
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
    client.make_status_data), 5).start()  # 200 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_imu_data), 20).start()  # 50 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_gps_data), 1000).start()  # 1 hz
tornado.ioloop.PeriodicCallback(client.async_send_stream(
    client.make_camera_data), 50).start()  # 30 hz

tornado.ioloop.IOLoop.instance().start()
