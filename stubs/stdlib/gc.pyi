"""Garbage Collection

This module provides control over the garbage collection process.
"""

def collect():
    """
    Run a garbage collection.
    """
    ...

def disable():
    """
    Disable automatic garbage collection. Heap memory can still be 
    allocated, and garbage collection can still be initiated 
    manually using ``gc.collect()``.
    """
    ...

def enable():
    """
    Enable automatic garbage collection.
    """
    ...

def isenabled() -> bool:
    """
    Returns ``true`` when garbage collection is enabled.
    """
    ...

def mem_alloc() -> int:
    """
    Return the number of bytes of heap RAM that are allocated.
    """
    ...

def mem_free() -> int:
    """
    Return the number of bytes of available heap RAM, or -1 if this 
    amount is not known.
    """
    ...

def threshold(amount:int|None = None) -> int:
    """
    Set or query the additional GC allocation threshold. Normally, a 
    collection is triggered only when a new allocation cannot be 
    satisfied, i.e. on an out-of-memory (OOM) condition. If this 
    function is called, in addition to OOM, a collection will be 
    triggered each time after amount bytes have been allocated (in 
    total, since the previous time such an amount of bytes have been 
    allocated). amount is usually specified as less than the full 
    heap size, with the intention to trigger a collection earlier 
    than when the heap becomes exhausted, and in the hope that an 
    early collection will prevent excessive memory fragmentation. 
    This is a heuristic measure, the effect of which will vary from 
    application to application, as well as the optimal value of the 
    amount parameter.

    Calling the function without argument will return the current value 
    of the threshold. A value of -1 means a disabled allocation threshold.
    """
    ...
