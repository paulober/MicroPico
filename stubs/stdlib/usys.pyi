# Copyright (c) 2019, Digi International, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import uio

from typing import Any, Dict, List, Optional, Tuple


argv: List[str] = ...
byteorder: str = ...
implementation: Tuple[str, Tuple[int, int, int], int] = ...
maxsize: int = ...
modules: Dict[str, Any] = ...  # technically [str, Module]
path: List[str] = ...
platform: str = ...
stderr: uio.FileIO = ...
stdin: uio.FileIO = ...
stdout: uio.FileIO = ...
version: str = ...
version_info: Tuple[int, int, int] = ...


def exit(arg: Optional[object] = None, /) -> None:
    """
    Raise a ``SystemExit`` exception, with the given argument if specified.

    Note that calling ``sys.exit()`` while at the MicroPython REPL
    (``>>>`` prompt) has no effect.
    """


def print_exception(exc: BaseException, file: uio._IOBase = stdout, /) -> None:
    """
    Print the given exception and its traceback to a file-like object
    (default is ``sys.stdout``).

    This is a simplified version of CPython's ``traceback.print_exception()``
    function.
    """
