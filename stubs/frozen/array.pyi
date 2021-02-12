import machine
from abc import abstractmethod
from typing import overload, Union, Tuple, TypeVar, Optional, NoReturn, List, Callable
from typing import Type, Sequence, runtime_checkable, Protocol, ClassVar

# We've got this as a PYI since stubbing doesn't create __getitem__ or __setitem__ and thus
# linting gives an error when trying to access or set values by index.
class array:
    ''
    def append(self, item: Any):
        """
        Adds a single element to the end of a list. The length of the list increases by one.
        """

    def decode():
        pass

    def extend(self, items: Any([])):
        """
        Adds the passed list of values to the existing list. The length of the list increases 
        by number of elements in its argument.
        """

    def __getitem__(self, key) -> Any:
        pass

    def __setitem__(self, index, value):
        pass
