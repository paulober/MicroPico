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

def acosh(x: float) -> float: 
    """
    Return the inverse hyperbolic cosine of ``x``, in radians.
    """
    ...

def asin(x: float) -> float: 
    """
    Return the arc sine of ``x``, in radians.
    """
    ...

def asinh(x: float) -> float: 
    """
    Return the inverse hyperbolic arc sine of ``x``, in radians.
    """
    ...

def atan(x: float) -> float: 
    """
    Return the arc tangent of ``x``, in radians.
    """
    ...

def atanh(x: float) -> float: 
    """
    Return the inverse hyperbolic arc tangent of ``x``, in radians.
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

def cosh(x: float) -> float: 
    """
    Return the hyperbolic cosine of ``x`` radians.
    """
    ...

def degrees(x: float) -> float: 
    """
    Convert angle ``x`` from radians to degrees.
    """
    ...

def erf(x: float) -> float: 
    """
    Return the error function at ``x``.
    """
    ...
def erfc(x: float) -> float: 
    """
    Return the complementary error function at ``x``. The complementary error 
    function is defined as ``1.0 - erf(x)``. It is used for large values of ``x`` where 
    a subtraction from one would cause a loss of significance.
    """
    ...

def exp(x: float) -> float: 
    """
    Return ``e**x``.
    """
    ...

def expm1(x: float) -> float: 
    """
    Return ``e`` raised to the power ``x``, minus 1. Here e is the base of natural logarithms. 
    For small floats ``x``, the subtraction in ``exp(x) - 1`` can result in a significant loss 
    of precision; the ``expm1()`` function provides a way to compute this quantity to full 
    precision.
    """
    ...

def fabs(x: float) -> float: 
    """
    Return the absolute value of ``x``.
    """
    ...

def factorial(x: int) -> int: 
    """
    Return ``x`` factorial as an integer. Raises ``ValueError`` if ``x`` is not integral or is negative.
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

def gamma(x: float) -> float: 
    """
    Return the Gamma function at ``x``.
    """
    ...

def isclose(a: float, b: float, *, rel_tol: float = ..., abs_tol: float = ...) -> bool: 
    """
    Return ``True`` if the values ``a`` and ``b`` are close to each other and ``False`` otherwise.

    Whether or not two values are considered close is determined according to given 
    absolute and relative tolerances.

    ``rel_tol`` is the relative tolerance – it is the maximum allowed difference between 
    ``a`` and ``b``, relative to the larger absolute value of ``a`` or ``b``. For example, to set a 
    tolerance of 5%, pass ``rel_tol=0.05``. The default tolerance is ``1e-09``, which assures 
    that the two values are the same within about 9 decimal digits. ``rel_tol`` must be 
    greater than zero.

    ``abs_tol`` is the minimum absolute tolerance – useful for comparisons near zero. 
    ``abs_tol`` must be at least zero.

    If no errors occur, the result will be: ``abs(a-b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)``.

    The IEEE 754 special values of ``NaN``, ``inf``, and ``-inf`` will be handled according to IEEE rules. 
    Specifically, ``NaN`` is not considered close to any other value, including ``NaN``. ``inf`` and
    ``-inf`` are only considered close to themselves.
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

def lgamma(x: float) -> float: 
    """
    Return the natural logarithm of the absolute value of the Gamma function at ``x``.
    """
    ...

def log(x: float, base: float = ...) -> float: 
    """
    With one argument, return the natural logarithm of ``x`` (to base ``e``).

    With two arguments, return the logarithm of ``x`` to the given base, 
    calculated as ``log(x)/log(base)``.
    """
    ...

def log2(__x: float) -> float: 
    """
    Return the base-2 logarithm of ``x``. This is usually more accurate than ``log(x, 2)``.
    """
    ...

def log10(__x: float) -> float: 
    """
    Return the base-10 logarithm of ``x``. This is usually more accurate than ``log(x, 10)``.
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
    Return the sine of ``x`` in radians.
    """
    ...

def sinh(x: float) -> float: 
    """
    Return the inverse hyperbolic sine of ``x`` in radians.
    """
    ...

def sqrt(x: float) -> float: 
    """
    Return the square root of ``x``.
    """
    ...

def tan(x: float) -> float: 
    """
    Return the tangent of ``x`` in radians.
    """
    ...

def tanh(x: float) -> float: 
    """
    Return the inverse hyperbolic tangent of ``x`` in radians.
    """
    ...

def trunc(x: float) -> int:
    """ 
    Return the ``Real`` value ``x`` truncated to an Integral (usually a long 
    integer). Uses the ``__trunc__`` method.
    """
    ...