class Packet(object):
    # TODO(vasua): Turn this into a length encoded packet instead of
    # header/footer. Apparently that's better for longer messages.
    # Python3 supports unicode strings, these could be emojis if I suppose ...
    HEADER = "42".encode("utf-8")
    FOOTER = "How many paths must a man walk?".encode("utf-8")

    @staticmethod
    def make_packet_from_string(data):
        assert isinstance(data, str)
        return Packet.make_packet_from_bytes(data.encode("utf-8"))

    @staticmethod
    def make_packet_from_bytes(data):
        assert isinstance(data, bytes)
        return Packet.HEADER + data + Packet.FOOTER

    @staticmethod
    def get_data_as_bytes(packet):
        return packet[len(Packet.HEADER):-len(Packet.FOOTER)]

    @staticmethod
    def get_data_as_string(packet):
        return Packet.get_data_as_bytes(packet).decode("utf-8")
