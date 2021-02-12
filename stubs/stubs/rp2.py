"""
Module: 'rp2' on micropython-rp2-1.13-290
"""
# MCU: {'family': 'micropython', 'sysname': 'rp2', 'version': '1.13.0', 'build': '290', 'mpy': 5125, 'port': 'rp2', 'platform': 'rp2', 'name': 'micropython', 'arch': 'armv7m', 'machine': 'Raspberry Pi Pico with RP2040', 'nodename': 'rp2', 'ver': '1.13-290', 'release': '1.13.0'}
# Stubber: 1.3.9

class Flash:
    ''
    def ioctl():
        pass

    def readblocks():
        pass

    def writeblocks():
        pass


class PIO:
    ''
    IN_HIGH = 1
    IN_LOW = 0
    IRQ_SM0 = 256
    IRQ_SM1 = 512
    IRQ_SM2 = 1024
    IRQ_SM3 = 2048
    OUT_HIGH = 3
    OUT_LOW = 2
    SHIFT_LEFT = 0
    SHIFT_RIGHT = 1
    def add_program():
        pass

    def irq():
        pass

    def remove_program():
        pass

    def state_machine():
        pass


class PIOASMEmit:
    ''
    def delay():
        pass

    def in_():
        pass

    def irq():
        pass

    def jmp():
        pass

    def label():
        pass

    def mov():
        pass

    def nop():
        pass

    def out():
        pass

    def pull():
        pass

    def push():
        pass

    def set():
        pass

    def side():
        pass

    def start_pass():
        pass

    def wait():
        pass

    def word():
        pass

    def wrap():
        pass

    def wrap_target():
        pass


class PIOASMError:
    ''

class StateMachine:
    ''
    def active():
        pass

    def exec():
        pass

    def get():
        pass

    def init():
        pass

    def irq():
        pass

    def put():
        pass

_pio_funcs = None
def asm_pio():
    pass

def asm_pio_encode():
    pass

def const():
    pass

