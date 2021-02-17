# Stubs for math
# See: http://docs.python.org/2/library/math.html

from typing import Tuple

e = ...  # type: float
pi = ...  # type: float

def acos(x: float) -> float: 
    """
    Return the arc cosine of ``x``, in radians.
    """
    ...

def asin(x: float) -> float: 
    """
    Return the arc sine of ``x``, in radians.
    """
    ...

def atan(x: float) -> float: 
    """
    Return the arc tangent of ``x``, in radians.
    """
    ...

def atan2(y: float, x: float) -> float: 
    """
    Return ``atan(y / x)``, in radians. The result is between ``-pi`` and ``pi``. The vector in 
    the plane from the origin to point ``(x, y)`` makes this angle with the positive X 
    axis. The point of ``atan2()`` is that the signs of both inputs are known to it, so 
    it can compute the correct quadrant for the angle. For example, ``atan(1)`` and 
    ``atan2(1, 1)`` are both ``pi/4``, but ``atan2(-1, -1)`` is ``-3*pi/4``.
    """
    ...

def ceil(x: float) -> int: 
    """
    Return the ceiling of ``x`` as a float, the smallest integer 
    value greater than or equal to ``x``.
    """
    ...

def copysign(x: float, y: float) -> float: 
    """
    Return ``x`` with the sign of ``y``. On a platform that supports signed 
    zeros, ``copysign(1.0, -0.0)`` returns ``-1.0``.
    """
    ...

def cos(x: float) -> float: 
    """
    Return the cosine of ``x`` radians.
    """
    ...

def degrees(x: float) -> float: 
    """
    Convert angle ``x`` from radians to degrees.
    """
    ...

def exp(x: float) -> float: 
    """
    Return ``e**x``.
    """
    ...

def fabs(x: float) -> float: 
    """
    Return the absolute value of ``x``.
    """
    ...

def floor(x: float) -> float: 
    """
    Return the floor of ``x`` as a float, the largest integer value less 
    than or equal to ``x``.
    """
    ...

def fmod(x: float, y: float) -> float: 
    """
    Return ``fmod(x, y)``, as defined by the platform C library. Note that the 
    Python expression ``x % y`` may not return the same result. The intent of 
    the C standard is that ``fmod(x, y)`` be exactly (mathematically; to infinite 
    precision) equal to ``x - n*y`` for some integer ``n`` such that the result has 
    the same sign as x and magnitude less than ``abs(y)``. Python’s ``x % y`` returns 
    a result with the sign of ``y`` instead, and may not be exactly computable 
    for float arguments. For example, ``fmod(-1e-100, 1e100)`` is ``-1e-100``, but 
    the result of Python’s ``-1e-100 % 1e100`` is ``1e100-1e-100``, which cannot be 
    represented exactly as a float, and rounds to the surprising ``1e100``. For 
    this reason, function ``fmod()`` is generally preferred when working with 
    floats, while Python’s ``x % y`` is preferred when working with integers.
    """
    ...

def frexp(x: float) -> Tuple[float, int]: 
    """
    Return the mantissa and exponent of ``x`` as the pair ``(m, e)``. ``m`` is a float and 
    ``e`` is an integer such that ``x == m * 2**e`` exactly. If ``x`` is zero, returns ``(0.0, 0)``, 
    otherwise ``0.5 <= abs(m) < 1``. This is used to “pick apart” the internal 
    representation of a float in a portable way.
    """
    ...

def isfinite(x: float) -> bool: 
    """
    Check if the float ``x`` is finite.
    """
    ...

def isinf(x: float) -> bool: 
    """
    Check if the float ``x`` is positive or negative infinity.
    """
    ...

def isnan(x: float) -> bool: 
    """
    Check if the float ``x`` is a NaN (not a number). For more information on 
    NaNs, see the IEEE 754 standards.
    """
    ...

def ldexp(x: float, i: int) -> float: 
    """
    Return ``x * (2**i)``. This is essentially the inverse of function ``frexp()``.
    """
    ...

def log(x: float, base: float = ...) -> float: 
    """
    With one argument, return the natural logarithm of ``x`` (to base ``e``).

    With two arguments, return the logarithm of ``x`` to the given base, 
    calculated as ``log(x)/log(base)``.
    """
    ...

def modf(x: float) -> Tuple[float, float]: 
    """
    Return the fractional and integer parts of ``x``. Both results carry the sign 
    of ``x`` and are floats.
    """
    ...

def pow(x: float, y: float) -> float: 
    """
    Return ``x`` raised to the power ``y``. Exceptional cases follow Annex ‘F’ of 
    the C99 standard as far as possible. In particular, ``pow(1.0, x)`` and 
    ``pow(x, 0.0)`` always return ``1.0``, even when ``x`` is a zero or a NaN. If 
    both ``x`` and ``y`` are finite, ``x`` is negative, and ``y`` is not an integer then 
    ``pow(x, y)`` is undefined, and raises ``ValueError``.

    Unlike the built-in ``**`` operator, ``math.pow()`` converts both its arguments to 
    type float. Use ``**`` or the built-in ``pow()`` function for computing exact integer 
    powers.
    """
    ...

def radians(x: float) -> float: 
    """
    Convert angle ``x`` from degrees to radians.
    """
    ...

def sin(x: float) -> float: 
    """
    Return the sine of ``x`` radians.
    """
    ...

def sqrt(x: float) -> float: 
    """
    Return the square root of ``x``.
    """
    ...

def tan(x: float) -> float: 
    """
    Return the tangent of ``x`` radians.
    """
    ...

def trunc(x: float) -> int:
    """ 
    Return the ``Real`` value ``x`` truncated to an Integral (usually a long 
    integer). Uses the ``__trunc__`` method.
    """
    ...