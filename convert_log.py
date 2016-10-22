import struct
from protos.message_pb2 import *
import sys

with open(sys.argv[1], "rb") as f:
    while(True):
        size = struct.unpack("!I", f.read(4)) # Read an integer
        binary_data = f.read(size[0])
        data = DataMessage()
        data.ParseFromString(binary_data)
        print(data)
