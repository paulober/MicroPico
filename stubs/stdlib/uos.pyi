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

from typing import Any, Iterator, List, Tuple

sep: str = ...


def chdir(path: str) -> None:
    """
    Changes current directory.

    :param path: Path to change to.
    """
    ...

def getcwd() -> str:
    """
    Gets the current directory.

    :return: Current directory.
    """
    ...

def ilistdir(path: str=".") -> Iterator[Tuple]:
    """
    Returns an iterator which then yields tuples corresponding to the entries
    in the directory that it is listing. With no argument it lists the current
    directory, otherwise it lists the directory given by ``path``.

    The tuples have the form ``(name, type, inode[, size])``:

    * ``name`` is a string (or bytes if dir is a bytes object) and is the name
      of the entry.
    * ``type`` is an integer that specifies the type of the entry, with 0x4000
      for directories and 0x8000 for regular files.
    * ``inode`` is an integer corresponding to the inode of the file, and may
      be 0 for filesystems that don't have such a notion.
    * Some platforms may return a 4-tuple that includes the entry's size. For
      file entries, ``size`` is an integer representing the size of the file or
      -1 if unknown. Its meaning is currently undefined for directory entries.

    :param path: Path to list its elements.

    :return: An iterator with a tuple for each entry in the path.
    """
    ...

def listdir(path: str=".") -> List:
    """
    Lists the specified path or the current one if ``path`` is not provided.

    :param path: The path to list. If this parameter is not provided, the
        method lists the current path.

    :return: List containing the name of the elements in the path.
    """
    ...

def mkdir(path: str) -> None:
    """
    Creates a new directory.

    :param path: Name of the directory to create.
    """
    ...

def mount(fsobj, mount_point, *, readonly) -> None:
    """
    Mount the filesystem object *fsobj* at the location in the VFS given by the
    *mount_point* string.  *fsobj* can be a a VFS object that has a ``mount()``
    method, or a block device.  If it's a block device then the filesystem type
    is automatically detected (an exception is raised if no filesystem was
    recognised).  *mount_point* may be ``'/'`` to mount *fsobj* at the root,
    or ``'/<name>'`` to mount it at a subdirectory under the root.

    If *readonly* is ``True`` then the filesystem is mounted read-only.

    During the mount process the method ``mount()`` is called on the filesystem
    object.

    Will raise ``OSError(EPERM)`` if *mount_point* is already mounted.
    """
    ...

def remove(path: str) -> None:
    """
    Removes a file.

    :param path: Path of the file to remove.
    """
    ...

def rename(old_path: str, new_path: str) -> None:
    """
    Renames a file or directory.

    :param old_path: Name of the file to rename.
    :param new_path: New name of the file.
    """
    ...

def rmdir(dir: str) -> None:
    """
    Removes a directory. Fails if ``dir`` is not empty.

    :param dir: Path of the directory to remove.
    """
    ...

def stat(path: str) -> Tuple:
    """
    Get the status of a file or directory.
    """

def statvfs(path: str) -> Tuple:
    """
    Gets the status of a fileystem.

    Returns a tuple with the filesystem information in the following order:

    * ``f_bsize`` – file system block size
    * ``f_frsize`` – fragment size
    * ``f_blocks`` – size of fs in f_frsize units
    * ``f_bfree`` – number of free blocks
    * ``f_bavail`` – number of free blocks for unpriviliged users
    * ``f_files`` – number of inodes
    * ``f_ffree`` – number of free inodes
    * ``f_favail`` – number of free inodes for unpriviliged users
    * ``f_flag`` – mount flags
    * ``f_namemax`` – maximum filename length

    :param path: Path of the filesystem to get its status.

    :return: Tuple with the status of a filesystem.
    """
    ...

def umount(mount_point: Any) -> None:
    """
    Unmount a filesystem.

    :param mount_point: can be a string naming the mount location, or a previously-mounted filesystem object.

    """
    ...

def uname() -> Tuple:
    """
    Gets the information about the machine or operating system.

    Return a tuple (possibly a named tuple) containing information about 
    the underlying machine and/or its operating system. The tuple has 
    five fields in the following order, each of them being a string:

    * ``sysname`` – the name of the underlying system
    * ``nodename`` – the network name (can be the same as ``sysname``)
    * ``release`` – the version of the underlying system
    * ``version`` – the MicroPython version and build date
    * ``machine`` – an identifier for the underlying hardware (eg board, CPU)

    :return: Tuple with information about the machine or operating system.
    """
    ...


