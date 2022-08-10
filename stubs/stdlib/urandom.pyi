"""
Generate pseudo-random numbers.
"""
from typing import Optional, TypeVar, Sequence, overload

_T = TypeVar("_T")

def choice(sequence: Sequence[_T]) -> _T: 
    """
    Return a random element from the non-empty sequence ``sequence``. 
    If ``sequence`` is empty, raises ``IndexError``.
    """
    ...

def getrandbits(n: int) -> int: 
    """
    Returns a python ``long`` int with ``n`` (0 <= n <= 32) random bits. 
    This method is supplied with the MersenneTwister generator and some 
    other generators may also provide it as an optional part of the API. 
    When available, ``getrandbits()`` enables ``randrange()`` to handle 
    arbitrarily large ranges.
    """
    ...

def randint(a: int, b: int) -> int: 
    """
    Return a random integer N such that ``a <= N <= b``.
    """
    ...

def random() -> float:
    """
    Return the next random floating point number in the range [0.0, 1.0].
    """
    ...

@overload
def randrange(stop: int) -> int:
    ...

@overload
def randrange(start: int, stop: int, step: int = ...) -> int: 
    """
    Return a randomly selected element from ``range(start, stop, step)``. This is 
    equivalent to ``choice(range(start, stop, step))``, but doesn't actually build a 
    range object.
    """
    ...

def seed(n: Optional[int]=None,/) -> None: 
    """Initialise the random number generator module with the 
    seed *n* which should be an integer. When no argument (or ``None``) 
    is passed in it will (if supported by the port) initialise 
    the PRNG with a true random number (usually a hardware 
    generated random number).

    The ``None`` case only works if ``MICROPY_PY_URANDOM_SEED_INIT_FUNC`` 
    is enabled by the port, otherwise it raises ``ValueError``.
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

