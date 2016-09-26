#!/usr/bin/env python3

import argparse
import logging
import math
import random
import time

import cv2
import numpy as np
import tornado
from auth_client import AuthClient
from protos.message_pb2 import DataMessage
from protos.message_pb2 import ImuMessage
from protos.message_pb2 import GpsMessage
from protos.message_pb2 import LogMessage
from packet import Packet

parser = argparse.ArgumentParser(description="Test client for Buggy Server.")
parser.add_argument("--buggy-name", type=str, help="Which buggy name to use.",
                    default="Transistor")
parser.add_argument("--team-name", type=str, help="Which team name to use.",
                    default="RoboBuggy")
parser.add_argument("--hostname", type=str, help="Which hostname to use for the"
        " data server connection.", default="localhost")
parser.add_argument("--port", type=int,
        help="Which port to use for the data server connection.",
        default=4242)

parser.add_argument('--gui', dest='gui', action='store_true')
parser.add_argument('--no-gui', dest='gui', action='store_false')
parser.set_defaults(gui=True)

parser.add_argument('--webcam', dest='webcam', action='store_true')
parser.add_argument('--no-webcam', dest='webcam', action='store_false')
parser.set_defaults(webcam=False)

words = """
There is a theory which states that if ever anyone discovers exactly what the
Universe is for and why it is here, it will instantly disappear and be replaced
by something even more bizarre and inexplicable. There is another theory which
states that this has already happened.
""".split()



class Client(AuthClient):

    def __init__(self, team_name, buggy_name, *args, **kwargs):
        print("Initi called")
        super().__init__("42", team_name, buggy_name, *args, **kwargs)
        if not cl_args.webcam:
            self.camera = None
            self.image_color = np.zeros(3, np.uint8)
        else:
            try:
                self.camera = cv2.VideoCapture(0)
            except:
                pass
        # try:
            # # Uncomment this to switch to generated colors
            # raise Exception()
            # self.camera = cv2.VideoCapture(0)
        # except:
            # self.camera = None
            # self.image_color = np.zeros(3, np.uint8)

        # IMU initialization
        self.imu_start = time.time()
        self.imu_period = 1  # Every second, do a full revolution
        self.imu = ImuMessage()

        # GPS initialization
        self.course_points = np.array([
            (40.441760, -79.941561),
            (40.440168, -79.942258),
            (40.440078, -79.943041),
            (40.439090, -79.944125),
            (40.438665, -79.945648),
            (40.438878, -79.946421),
            (40.439735, -79.946818),
            (40.440723, -79.948255),
            (40.441507, -79.947225),
            (40.440437, -79.942140),
        ])

        self.point_distances = np.zeros(len(self.course_points) - 1)
        for i in range(len(self.course_points) - 1):
            self.point_distances[i] = np.linalg.norm(
                self.course_points[i] - self.course_points[(i + 1)])
        self.course_distances = np.cumsum(self.point_distances)
        self.course_distances = np.insert(self.course_distances, [0], [0])
        self.total_distance = self.course_distances[-1]

        self.gps_start = time.time()
        self.gps_period = 120  # seconds, slightly faster than the record.
        self.gps = GpsMessage()
        self.gps.lat = self.course_points[0][0]
        self.gps.long = self.course_points[0][1]
        self.gps_distance = 0

    def make_timestamp(self, timestamp):
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10**9)
        timestamp.seconds = seconds
        timestamp.nanos = nanos

    def make_gps_data(self, data):
        self.gps_distance += self.total_distance * (time.time() -
                                                    self.gps_start) / self.gps_period
        self.gps_start = time.time()
        self.gps_distance %= self.total_distance
        point_left = np.searchsorted(self.course_distances, self.gps_distance)
        point_right = np.searchsorted(self.course_distances, self.gps_distance,
                                      "right")
        point_left -= point_left == point_right
        distance_from_prev_point = (self.gps_distance -
                                    self.course_distances[point_left])
        distance_to_next_point = self.point_distances[point_left]
        slope = self.course_points[point_right] - \
            self.course_points[point_left]
        change = slope * (distance_from_prev_point / distance_to_next_point)
        point = self.course_points[point_left] + change
        self.gps.lat = point[0]
        self.gps.long = point[1]
        self.make_timestamp(self.gps.time)
        data.gps.CopyFrom(self.gps)
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
        time_diff = (time.time() - self.imu_start)
        self.imu.roll += ((time_diff / self.imu_period) * 2 * math.pi)
        self.imu.roll = self.imu.roll % (2 * math.pi)
        # self.imu.pitch += ((time_diff / self.imu_period) * 2 * math.pi)
        # self.imu.pitch = self.imu.pitch % (2 * math.pi)
        self.imu_start = time.time()
        # data.imu.roll = random.uniform(-1, 1)
        # data.imu.pitch = random.uniform(-2, 2)
        # data.imu.yaw = random.uniform(-3, 3)
        self.make_timestamp(self.imu.time)
        data.imu.CopyFrom(self.imu)
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
        if (cl_args.gui):
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


if __name__ == "__main__":
    global cl_args
    cl_args = parser.parse_args()
    print(cl_args)

    # Setup the client
    logging.basicConfig(level=logging.DEBUG)
    client = Client(cl_args.team_name, cl_args.buggy_name, cl_args.hostname, cl_args.port)

    # Every second, try to authenticate and establish a connection.
    tornado.ioloop.PeriodicCallback(client.make_connection, 1000).start()
    # Periodically send various types of messages
    tornado.ioloop.PeriodicCallback(client.async_send_stream(
        client.make_status_data), 5).start()  # 200 hz
    tornado.ioloop.PeriodicCallback(client.async_send_stream(
        client.make_imu_data), 20).start()  # 50 hz
    tornado.ioloop.PeriodicCallback(client.async_send_stream(
        client.make_gps_data), 500).start()  # 1 hz
    tornado.ioloop.PeriodicCallback(client.async_send_stream(
        client.make_camera_data), 50).start()  # 30 hz

    tornado.ioloop.IOLoop.instance().start()
