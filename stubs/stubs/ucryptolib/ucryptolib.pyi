"""
Module: 'ucryptolib' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any


class aes():

    def __init__(self, key: bytes, mode: int, IV: Any = None) -> None:
        """Initialize cipher object, suitable for encryption/decryption. Note: after initialization, cipher object can be use only either for encryption or decryption. Running decrypt() operation after encrypt() or vice versa is not supported.

        Parameters are:

        - *key* is an encryption/decryption key (bytes-like).

        - *mode* is:

        -- ``1`` for Electronic Code Book (ECB).

        -- ``2`` for Cipher Block Chaining (CBC).

        -- ``6`` for Counter mode (CTR).

        - *IV* is an initialization vector for CBC mode.

        For Counter mode, IV is the initial value for the counter.
        """
        ...

    def decrypt(self, in_buf: Any, out_buf: Any = None) -> bytes|None:
        """Like ``encrypt()``, but for decryption."""
        ...

    def encrypt(self, in_buf: Any, out_buf: Any = None) -> bytes|None:
        """Encrypt in_buf. If no out_buf is given 
        result is returned as a newly allocated ``bytes`` 
        object. Otherwise, result is written into mutable 
        buffer out_buf. in_buf and out_buf can also refer 
        to the same mutable buffer, in which case data 
        is encrypted in-place.
        """
        ...

