import enum
import sys
from typing import Any, AnyStr, Callable, Iterator, List, Optional, Tuple, Union, overload

# ----- re variables and constants -----
if sys.version_info >= (3, 7):
    from typing import Match as Match, Pattern as Pattern
else:
    from typing import Match, Pattern

class RegexFlag(enum.IntFlag):
    A: int
    ASCII: int
    DEBUG: int
    I: int
    IGNORECASE: int
    L: int
    LOCALE: int
    M: int
    MULTILINE: int
    S: int
    DOTALL: int
    X: int
    VERBOSE: int
    U: int
    UNICODE: int
    T: int
    TEMPLATE: int

A = RegexFlag.A
ASCII = RegexFlag.ASCII
DEBUG = RegexFlag.DEBUG
I = RegexFlag.I
IGNORECASE = RegexFlag.IGNORECASE
L = RegexFlag.L
LOCALE = RegexFlag.LOCALE
M = RegexFlag.M
MULTILINE = RegexFlag.MULTILINE
S = RegexFlag.S
DOTALL = RegexFlag.DOTALL
X = RegexFlag.X
VERBOSE = RegexFlag.VERBOSE
U = RegexFlag.U
UNICODE = RegexFlag.UNICODE
T = RegexFlag.T
TEMPLATE = RegexFlag.TEMPLATE
_FlagsType = Union[int, RegexFlag]


class error(Exception):
    msg: str
    pattern: str
    pos: Optional[int]
    lineno: Optional[int]
    colno: Optional[int]

def compile(regex_str: AnyStr, flags: _FlagsType = ...) -> Pattern[AnyStr]: 
    """
    Compile regular expression, return ``regex <regex>`` object.
    """
    ...

def search(regex_str: AnyStr, string: AnyStr, flags: _FlagsType = ...) -> Optional[Match[AnyStr]]: 
    """
    Compile *regex_str* and search it in a *string*. Unlike `match`, this will search
    string for first position which matches regex (which still may be
    0 if regex is anchored).
    """
    ...

def match(regex_str: AnyStr, string: AnyStr, flags: _FlagsType = ...) -> Optional[Match[AnyStr]]: 
    """
    Compile *regex_str* and match against *string*. Match always happens
    from starting position in a string.
    """
    ...

def sub(regex_str: AnyStr, repl: AnyStr, string: AnyStr, count: int = ..., flags: _FlagsType = ...) -> AnyStr: 
    """
    Compile *regex_str* and search for it in *string*, replacing all matches
    with *replace*, and returning the new string.

    *replace* can be a string or a function.  If it is a string then escape
    sequences of the form ``\<number>`` and ``\g<number>`` can be used to
    expand to the corresponding group (or an empty string for unmatched groups).
    If *replace* is a function then it must take a single argument (the match)
    and should return a replacement string.

    If *count* is specified and non-zero then substitution will stop after
    this many substitutions are made.  The *flags* argument is ignored.
    """
    ...



