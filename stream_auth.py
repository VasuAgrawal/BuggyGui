"""Authenticate a Tornado IO stream to receive a buggy's data run."""

from protos.auth_pb2 import AuthMessage
from packet import Packet
import logging

valid_keys = set(["42"])
current_keys = set()

# TODO(vasua): Put some cap on the read so that invalid connection attempts
# don't block the entire system.
# TODO(vasua): Also figure out how to deal with people that open sockets but
# then never send any data. Maybe one connection per IP address?
async def auth_stream(stream, address):
    """Authenticates a stream from a Buggy.

    Returns an AuthMessage if the stream and header info is valid.
    If the stream isn't valid, the stream is closed before returning None.
    """
    data = await Packet.get_packet_data_as_bytes_from_stream(stream)
    auth_message = AuthMessage()
    try:
        # Throws an exception if the proto string is invalid.
        auth_message.ParseFromString(data)

        if not auth_message.secret_key:
            raise AttributeError("Missing secret key!")
        if not auth_message.team_name:
            raise AttributeError("Missing team name!")
        if not auth_message.buggy_name:
            raise AttributeError("Missing buggy name!")
    except Exception as e:
        logging.warning("Bad auth attempt from %s. Error: %s", address, e)
        stream.close()
        return None

    # TODO(vasua): Better validation here.
    if (auth_message.secret_key in valid_keys and auth_message.secret_key not in
            current_keys):
        # Eventually, we'll want to check that the team name is one of the teams
        # that is using the service, and that the buggy name is a valid one. The
        # auth key can probably be unique per team, or possibly some combination
        # of the team name, buggy name, salt and hash.
        logging.info("Authentication attempt from %s successful!", address)
        current_keys.add(auth_message.secret_key)
        return auth_message

    logging.warning("Authentication attempt from %s unsuccessful!", address)
    stream.close()
