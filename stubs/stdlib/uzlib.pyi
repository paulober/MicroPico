def decompress(__data: bytes, wbits: int = 0, bufsize: int = 0) -> bytes: 
    """
    Return decompressed *data* as bytes. *wbits* is DEFLATE dictionary window
    size used during compression (8-15, the dictionary size is power of 2 of
    that value). Additionally, if value is positive, *data* is assumed to be
    zlib stream (with zlib header). Otherwise, if it's negative, it's assumed
    to be raw DEFLATE stream. *bufsize* parameter is for compatibility with
    CPython and is ignored.
    """
    ...

class DecompIO:
    """
    Create a ``stream`` wrapper which allows transparent decompression of
    compressed data in another *stream*. This allows to process compressed
    streams with data larger than available heap size. In addition to
    values described in :func:``decompress``, *wbits* may take values
    24..31 (16 + 8..15), meaning that input stream has gzip header.
    """
    def read(self) -> int:
        ...

    def readinto(self):
        ...

    def readline(self):
        ...
