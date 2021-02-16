# Copyright (c) 2019, Digi International, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from typing import Any


def hexlify(data: Any, sep: Any="") -> bytes:
    """
    Returns the hexadecimal representation of the provided binary data.

    :param data: Binary data to convert.
    :param sep: If supplied, this parameter is used as separator between
        hexadecimal values.

    :return: Bytes string with the hexadecimal representation.
    """
    ...

def unhexlify(data: Any) -> bytes:
    """
    Converts hexadecimal data to binary representation. Inverse of
    ``ubinascii.hexlify()``.

    :param data: Hexadecimal data to convert.

    :return: Bytes string with the binary representation.
    """
    ...

def a2b_base64(data: Any) -> bytes:
    """
    Decodes base64-encoded data, ignoring invalid characters in the input and
    returns the decoded data. Conforms to RFC 2045 s.6.8.

    :param data: The base64-encoded data to decode.

    :return: Bytes string with the decoded data.
    """
    ...

def b2a_base64(data: Any) -> bytes:
    """
    Encodes binary data in base64 format, as in RFC 3548 and returns the
    encoded data followed by a newline character, as a bytes object.

    :param data: Binary data to encode in base64 format.

    :return: Bytes string with the encoded data.
    """
    ...
