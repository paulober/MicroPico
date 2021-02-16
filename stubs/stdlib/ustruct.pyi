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

from typing import Any, Tuple


def calcsize(fmt: str) -> int:
    """
    Returns the number of bytes needed to store the given ``fmt``.

    :param fmt: Identifier of the typecode to get its size.

    :return: The number of bytes needed.
    """
    ...

def pack(fmt: str, v1: Any, *vn: Any) -> bytes:
    """
    Returns a bytes object containing the values v1, v2, ... packed according
    to the format string ``fmt``.

    :param fmt: Format string sequence of the values to pack.
    :param v1: Value to pack.
    :param vn: Additional values to pack.

    :return: Bytes object with the values packed according to the given format.
    """
    ...

def pack_into(fmt: str, buff: Any, offset: int, v1: Any, *vn: Any) -> None:
    """
    Packs the values v1, v2, ... according to the format string ``fmt`` and
    writes the packed bytes into the writable buffer ``buf`` starting at
    ``offset``.

    **Note**: The offset is a required argument.

    :param fmt: Format string sequence of the values to pack.
    :param buff: Buffer to write the packed values into.
    :param offset: Starting offset to pack values within the buffer.
    :param v1: Value to pack.
    :param vn: Additional values to pack.
    """
    ...

def unpack(fmt: str, buffer: Any) -> Tuple:
    """
    Returns a tuple containing values unpacked according to the format string
    ``fmt``. The buffer's size in bytes must be ``calcsize(fmt)``.

    :param fmt: Format string sequence of the packed values.
    :param buffer: Buffer containing the packed values to unpack.

    :return: Tuple containing the unpacked values.
    """
    ...

def unpack_from(fmt: str, buffer: Any, offset: int=0) -> None:
    """
    Returns a tuple containing values unpacked according to the format string
    ``fmt``.  The buffer's size, minus ``offset``, must be at least
    ``calcsize(fmt)``.

    :param fmt: Format string sequence of the packed values.
    :param buffer: Buffer containing the packed values to unpack.
    :param offset: Offset within buffer to start unpacking values.

    :return: Tuple containing the unpacked values.
    """
    ...