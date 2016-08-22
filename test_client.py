import logging
from protos.auth_pb2 import AuthMessage
from protos.message_pb2 import ImuMessage
from protos.message_pb2 import GpsMessage
from protos.message_pb2 import DataMessage
from google.protobuf.timestamp_pb2 import Timestamp
from packet import Packet
import random
import time
import tornado
from tornado.tcpclient import TCPClient


class Client(TCPClient):
    HOST = "localhost"
    PORT = 4242

    async def make_auth_connection(self, *args, **kwargs):
        """Tries to connect to the server to auth against it.

        Might throw an exception.
        """
        stream = await self.connect(*args, **kwargs)
        auth_message = AuthMessage()
        auth_message.secret_key = "42"
        auth_message.team_name = "RoboBuggy"
        auth_message.buggy_name = "Transistor"
        data = Packet.make_packet_from_bytes(auth_message.SerializeToString())
        await stream.write(data)
        return stream

    def make_timestamp(self, timestamp):
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10**9)
        timestamp.seconds = seconds
        timestamp.nanos = nanos

    def make_gps_data(self, data):
        data.gps.lat = random.uniform(40.5, 41);
        data.gps.long = random.uniform(42, 42.5);
        self.make_timestamp(data.gps.time)

    def make_imu_data(self, data):
        data.imu.roll = random.uniform(-1, 1);
        data.imu.pitch = random.uniform(-2, 2);
        data.imu.yaw = random.uniform(-3, 3);
        self.make_timestamp(data.imu.time)

    @tornado.gen.coroutine
    def runner(self):
        while True:
            try:
                stream = yield self.make_auth_connection(self.HOST, self.PORT)
                while True:
                    target_time = 1 # Try to sleep for exactly this much time
                    start = time.time()

                    data = DataMessage()
                    # Randomly choose one of the two message types to send
                    # random.choice([self.make_gps_data,
                                   # self.make_imu_data])(data)
                    self.make_imu_data(data)
                    yield stream.write(Packet.make_packet_from_bytes(
                        data.SerializeToString()))

                    yield tornado.gen.sleep(target_time - (time.time() - start))

            except tornado.iostream.StreamClosedError as e:
                logging.warning(e)
            yield tornado.gen.sleep(1)


# Setup the client
logging.basicConfig(level=logging.DEBUG)
client = Client()
client.runner()


tornado.ioloop.IOLoop.instance().start()
