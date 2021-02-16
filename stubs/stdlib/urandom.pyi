"""
Generate pseudo-random numbers.
"""
from typing import Any, TypeVar, Sequence, Union

_T = TypeVar("_T")

def choice(seq: Sequence[_T]) -> _T: 
    """
    Return a random element from the non-empty sequence ``seq``. 
    If ``seq`` is empty, raises ``IndexError``.
    """
    ...

def getrandbits(k: int) -> int: 
    """
    Returns a python ``long`` int with ``k`` random bits. This method is 
    supplied with the MersenneTwister generator and some other generators 
    may also provide it as an optional part of the API. When available, 
    ``getrandbits()`` enables ``randrange()`` to handle arbitrarily large 
    ranges.
    """
    ...

def randint(a: int, b: int) -> int: 
    """
    Return a random integer N such that ``a <= N <= b``.
    """
    ...

def random() -> float:
    """
    Return the next random floating point number in the range [0.0, 1.0).
    """
    ...

def randrange(start: int, stop: Union[int, None] = ..., step: int = ...) -> int: 
    """
    Return a randomly selected element from ``range(start, stop, step)``. This is 
    equivalent to ``choice(range(start, stop, step))``, but doesn’t actually build a 
    range object.
    """
    ...

def seed(a: Any = ..., version: int = ...) -> None: 
    """
    Initialize internal state of the random number generator.

    None or no argument seeds from current time or from an operating system specific 
    randomness source if available (see the ``os.urandom()`` function for details 
    on availability).

    If a is not ``None`` or an ``int`` or a ``long``, then ``hash(a)`` is used instead. 
    Note that the hash values for some types are nondeterministic when ``PYTHONHASHSEED`` 
    is enabled.
    """
    ...

def uniform(a: float, b: float) -> float: 
    """
    Return a random floating point number N such that ``a <= N <= b`` for ``a <= b`` 
    and ``b <= N <= a`` for ``b < a``.

    The end-point value ``b`` may or may not be included in the range depending on 
    floating-point rounding in the equation ``a + (b-a) * random()``.
    """
    ...

