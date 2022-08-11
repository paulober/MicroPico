"""
Access binary data in a structured way.

This module implements "foreign data interface" for MicroPython. The idea
behind it is similar to CPython's ``ctypes`` modules, but the actual API is
different, streamlined and optimized for small size. The basic idea of the
module is to define data structure layout with about the same power as the
C language allows, and then access it using familiar dot-syntax to reference
sub-fields.

.. warning::

    ``uctypes`` module allows access to arbitrary memory addresses of the
    machine (including I/O and control registers). Uncareful usage of it
    may lead to crashes, data loss, and even hardware malfunction.

.. seealso::

    Module :mod:`ustruct`
        Standard Python way to access binary data structures (doesn't scale
        well to large and complex structures).
"""

from typing import Any

ARRAY = -1073741824
BFINT16 = -671088640
BFINT32 = -402653184
BFINT8 = -939524096
BFUINT16 = -805306368
BFUINT32 = -536870912
BFUINT8 = -1073741824
BF_LEN = 22
BF_POS = 17
BIG_ENDIAN = 1
FLOAT32 = -268435456
FLOAT64 = -134217728
INT = 671088640
INT16 = 402653184
INT32 = 671088640
INT64 = 939524096
INT8 = 134217728
LITTLE_ENDIAN = 0
LONG = 671088640
LONGLONG = 939524096
NATIVE = 2
PTR = 536870912
SHORT = 402653184
UINT = 536870912
UINT16 = 268435456
UINT32 = 536870912
UINT64 = 805306368
UINT8 = 0
ULONG = 536870912
ULONGLONG = 805306368
USHORT = 268435456
VOID = 0

def addressof(value: Any) -> int:
    """
    Return address of an object. Argument should be bytes, bytearray or
    other object supporting buffer protocol (and address of this buffer
    is what actually returned).
    """

def bytearray_at(addr:int, size:int) -> bytearray:
    """
    Capture memory at the given address and size as bytearray object.
    Unlike the bytes_at() function, memory is captured by reference,
    so it can be both written too, and you will access current value
    at the given memory address.
    """

def bytes_at(addr:int, size:int) -> bytes:
    """
    Capture memory at the given address and size as bytes object. As bytes
    object is immutable, memory is actually duplicated and copied into
    bytes object, so if memory contents change later, created object
    retains original value.
    """

def sizeof(struct:Any, layout_type:int=NATIVE, /) -> int:
    """
    Return size of data structure in bytes. The *struct* argument can be
    either a structure class or a specific instantiated structure object
    (or its aggregate field).
    """


class struct:
    def __init__(self, addr:int, descriptor:Any, layout_type:int=NATIVE, /):
        """
        Instantiate a "foreign data structure" object based on structure address in
        memory, descriptor (encoded as a dictionary), and layout type.
        """
