"""Client to publish data to a running Web GUI.

Requires Tornado."""

from __future__ import print_function

try: # to be python3 and python2 compatible
    from queue import Queue
except ImportError:
    from Queue import Queue

import time
import threading
import tornado
import tornado.gen
import tornado.tcpclient
from protos.auth_pb2 import AuthMessage
from packet import Packet
import sys
import atexit


class GuiClient(object):
    def __init__(self, host, port, secret_key="", robot_name=""):
        """Initialize the Client and attempts to connect to the server.

        Args:
            host (str): The hostname to connect to. Can be either a domain or an
                IP address.
            port (int): Port to connect to.
            secret_key (str): Optional secret key to sign data with.
            robot_names (list): If the robot_name is a string, it will be
                used directly. If it is a list of strings, the strings will be
                joined with a '/'. This allows for some degree of namespacing.
        """
        # First save the user's input.
        self.host = host
        self.port = port
        self.secret_key = secret_key
        self.robot_name = str(robot_name)
        if isinstance(robot_name, list):
            self.robot_name = "/".join(robot_name)

        self._data_queue = Queue()

        self._tcp_client = None
        self._stream = None
        self._stream_ok = False

        atexit.register(self.close)

        self._stop = threading.Event()
        self._client_thread = threading.Thread(target=self._start_writer)
        self._client_thread.daemon = True
        self._client_thread.start()


    # The public method
    def write_message(self, message):
        """Write a protobuf message to the server.
        """
        self._data_queue.put(Packet.make_packet_from_bytes(
            message.SerializeToString()), True)
   

    def close(self):
        self._stop.set()
        self._client_thread.join()


    @tornado.gen.coroutine
    def _connect(self):
        if not self._stream or self._stream.closed():
            try: 
                self._stream = yield self._tcp_client.connect(self.host, self.port)
                yield self._authenticate()
                self._stream_ok = True
            except:
                print("Unable to connect. This is an issue.")


    @tornado.gen.coroutine
    def _authenticate(self):
        auth_message = AuthMessage()
        auth_message.secret_key = self.secret_key
        auth_message.robot_name = self.robot_name

        data = Packet.make_packet_from_bytes(auth_message.SerializeToString())
        yield self._stream.write(data)


    @tornado.gen.coroutine
    def _writer(self):
        # Constantly be writing to the connection, if there's data to write.
        while True:
            if self._stream_ok:
                try:
                    data = self._data_queue.get(True)
                    self._stream.write(data)
                except Exception:
                    self._stream_ok = False
            else:
                yield tornado.gen.sleep(.5)


    @tornado.gen.coroutine
    def _check_stop(self):
        if self._stop.isSet():
            print("Exiting from client thread!")
            if self._stream:
                self._stream.close()
            sys.exit()


    def _start_writer(self):
        # There's a bit of weirdness going on in here. Many of the tornado
        # system calls use IOLoop.current() to figure out which ioloop to
        # register the callback in. Since the TCPClient was originally being
        # created inside the main loop, it was registering to the global IOLoop
        # instance rather than this one. Similar idea with PeriodicCallback.
        # Thus, we need to create the new IOLoop first, set it to be the current
        # one (for the thread), and then go from there. This way, the user can
        # still have their own.
        # 
        # Also note that this needs to be done in here because it's working
        # inside of a new thread. If it was done in the GuiClient constructor,
        # it would still be running inside the main / parent thread, and the
        # ioloop wouldn't be able to initialize. I'm not sure that there's a
        # cleaner way around this, but it honestly isn't too bad.
        ioloop = tornado.ioloop.IOLoop(make_current=True)

        self._tcp_client = tornado.tcpclient.TCPClient()
        self._writer()
        tornado.ioloop.PeriodicCallback(self._connect, 1000).start()
        tornado.ioloop.PeriodicCallback(self._check_stop, 100).start()
        ioloop.start()
        print("Shouldn't get here ...")

if __name__ == "__main__":
    # For quick testing, probably remove later.
    gc = GuiClient("localhost", "4242", "nope", "meh")
    time.sleep(5)
