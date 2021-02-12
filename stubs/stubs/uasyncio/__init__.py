"""
Module: 'uasyncio.__init__' on micropython-rp2-1.13-290
"""
# MCU: {'family': 'micropython', 'sysname': 'rp2', 'version': '1.13.0', 'build': '290', 'mpy': 5125, 'port': 'rp2', 'platform': 'rp2', 'name': 'micropython', 'arch': 'armv7m', 'machine': 'Raspberry Pi Pico with RP2040', 'nodename': 'rp2', 'ver': '1.13-290', 'release': '1.13.0'}
# Stubber: 1.3.9

class CancelledError:
    ''

class Event:
    ''
    def clear():
        pass

    def is_set():
        pass

    def set():
        pass

    wait = None

class IOQueue:
    ''
    def _dequeue():
        pass

    def _enqueue():
        pass

    def queue_read():
        pass

    def queue_write():
        pass

    def remove():
        pass

    def wait_io_event():
        pass


class Lock:
    ''
    acquire = None
    def locked():
        pass

    def release():
        pass


class Loop:
    ''
    _exc_handler = None
    def call_exception_handler():
        pass

    def close():
        pass

    def create_task():
        pass

    def default_exception_handler():
        pass

    def get_exception_handler():
        pass

    def run_forever():
        pass

    def run_until_complete():
        pass

    def set_exception_handler():
        pass

    def stop():
        pass


class SingletonGenerator:
    ''

class StreamReader:
    ''
    aclose = None
    awrite = None
    awritestr = None
    def close():
        pass

    drain = None
    def get_extra_info():
        pass

    read = None
    readexactly = None
    readline = None
    wait_closed = None
    def write():
        pass


class StreamWriter:
    ''
    aclose = None
    awrite = None
    awritestr = None
    def close():
        pass

    drain = None
    def get_extra_info():
        pass

    read = None
    readexactly = None
    readline = None
    wait_closed = None
    def write():
        pass


class Task:
    ''

class TaskQueue:
    ''
    def peek():
        pass

    def pop_head():
        pass

    def push_head():
        pass

    def push_sorted():
        pass

    def remove():
        pass


class TimeoutError:
    ''
_attrs = None
def create_task():
    pass

gather = None
def get_event_loop():
    pass

def new_event_loop():
    pass

open_connection = None
def run():
    pass

def run_until_complete():
    pass

select = None
def sleep():
    pass

def sleep_ms():
    pass

start_server = None
sys = None
def ticks():
    pass

def ticks_add():
    pass

def ticks_diff():
    pass

wait_for = None
def wait_for_ms():
    pass

