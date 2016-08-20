class Packet(object):
    HEADER = "Herpaderp".encode("utf-8")
    FOOTER = "VasuIsGreat\n".encode("utf-8")

    @staticmethod 
    def make_packet_from_string(data):
        assert(isinstance(data, str))
        return Packet.make_packet_from_bytes(data.encode("utf-8"))

    @staticmethod
    def make_packet_from_bytes(data):
        assert(isinstance(data, bytes))
        return Packet.HEADER + data + Packet.FOOTER

    @staticmethod
    def get_data_as_bytes(packet):
        return packet[len(Packet.HEADER):-len(Packet.FOOTER)]

    @staticmethod
    def get_data_as_string(packet):
        return Packet.get_data_as_bytes(packet).decode("utf-8")

    @staticmethod
    async def get_packet_from_stream(stream):
        return await stream.read_until(Packet.FOOTER)

    @staticmethod
    async def get_packet_data_as_bytes_from_stream(stream):
        packet = await Packet.get_packet_from_stream(stream)
        return Packet.get_data_as_bytes(packet)

    @staticmethod
    async def get_packet_data_as_string_from_stream(stream):
        packet = await Packet.get_packet_from_stream(stream)
        return Packet.get_data_as_string(packet)
