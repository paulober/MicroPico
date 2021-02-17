"""
This modules allows to conversion between Python objects and the JSON
data format.
"""

from typing import IO, Any, AnyStr

__version__: str

def dumps(
    obj: Any,
    ensure_ascii: bool = ...,
    double_precision: int = ...,
    encode_html_chars: bool = ...,
    escape_forward_slashes: bool = ...,
    sort_keys: bool = ...,
    indent: int = ...,
) -> str: 
    """
    Return *obj* represented as a JSON string.
    """
    ...

def dump(
    obj: Any,
    fp: IO[str],
    ensure_ascii: bool = ...,
    double_precision: int = ...,
    encode_html_chars: bool = ...,
    escape_forward_slashes: bool = ...,
    sort_keys: bool = ...,
    indent: int = ...,
) -> None: 
    """
    Serialise *obj* to a JSON string, writing it to the given *stream*.
    """
    ...

def loads(s: AnyStr, precise_float: bool = ...) -> Any: 
    """
    Parse the JSON *str* and return an object.  Raises :exc:`ValueError` if the
    string is not correctly formed.
    """
    ...

def load(fp: IO[AnyStr], precise_float: bool = ...) -> Any: 
    """
    Parse the given *stream*, interpreting it as a JSON string and
    deserialising the data to a Python object.  The resulting object is
    returned.

    Parsing continues until end-of-file is encountered.
    A :exc:`ValueError` is raised if the data in *stream* is not correctly formed.
    """
    ...
