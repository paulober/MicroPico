from .uarray import array
from .machine import Pin
from typing import Any, overload

class Flash:
    # Determined from: https://github.com/raspberrypi/micropython/blob/1196871a0f2f974b03915e08cfcc0433de4b8a64/ports/rp2/rp2_flash.c
    # Documentation put together via research and may be flawed! And also from micropython docs rp2.Flash.html
    """
    Flash storage functionality.
    """

    CMD_INIT = 1
    CMD_DEINIT = 2
    CMD_SYNC = 3
    CMD_BLOCK_COUNT = 4
    CMD_BLOCK_SIZE = 5
    CMD_BLOCK_ERASE = 6

    # offsetBlocks: int = None changed to arg: Any
    def ioctl(self, cmd: int, arg: Any):
        """
        Send a command to the Flash storage controller.
        """
        ...

    def readblocks(self, offsetBlocks: int, buffer: bytearray, offset: int | Any | None=None):
        """
        Read data from the Flash storage.
        """
        ...

    def writeblocks(self, offsetBlocks: int, buffer: bytearray, offset: int | Any | None=None):
        """
        Write data to the Flash storage.
        """
        ...

class PIO:
    # Determined from: https://github.com/raspberrypi/micropython/blob/1196871a0f2f974b03915e08cfcc0433de4b8a64/ports/rp2/rp2_pio.c
    # Documentation put together via research and may be flawed!
    """
    Programmable I/O (PIO) functionality.

    The Pico has two PIO blocks that each have four state machines. 
    These are really stripped-down processing cores that can be used 
    to handle data coming in or out of the microcontroller, and 
    offload some of the processing requirement for implementing 
    communications protocols.
    """

    IN_HIGH = 1 # type: int
    IN_LOW = 0 # type: int
    IRQ_SM0 = 256 # type: int
    IRQ_SM1 = 512 # type: int
    IRQ_SM2 = 1024 # type: int
    IRQ_SM3 = 2048 # type: int
    JOIN_NONE = 0 # type: int
    JOIN_RX = 2 # type: int
    JOIN_TX = 1 # type: int
    OUT_HIGH = 3 # type: int
    OUT_LOW = 2 # type: int
    SHIFT_LEFT = 0 # type: int
    SHIFT_RIGHT = 1 # type: int

    def __init__(self, id: int) -> None:
        """Gets the PIO instance numbered id. The 
        RP2040 has two PIO instances, numbered 0 and 1.

        Raises a ``ValueError`` if any other argument is provided."""
        ...

    def add_program(self, program):
        """
        Add the program to the instruction memory of this PIO instance.

        The amount of memory available for programs on each PIO instance 
        is limited. If there isn't enough space left in the PIO's program 
        memory this method will raise ``OSError(ENOMEM)``.
        """
        ...

    def irq(self, handler=None, trigger=IRQ_SM0|IRQ_SM1|IRQ_SM2|IRQ_SM3, hard=False):
        """
        Returns the IRQ object for this PIO instance.

        MicroPython only uses IRQ 0 on each PIO instance. IRQ 1 is not available.

        Optionally configure it.
        """
        ...

    def remove_program(self, prog = None):
        """
        Remove program from the instruction memory of this PIO instance.

        If no program is provided, it removes all programs.

        It is not an error to remove a program which has already been removed.
        """
        ...

    def state_machine(self, id: int, program: Any|None = None, freq: int|None=-1, *args, **kwargs) -> StateMachine:
        """
        Returns the StateMachine object.

        Gets the state machine numbered id. 
        On the RP2040, each PIO instance has 
        four state machines, numbered 0 to 3.
        """
        ...

class PIOASMError(Exception): 
    ...

class PIOASMEmit:
    def __init__(self) -> None:
        ...

    def start_pass(self, pass_: Any) -> None:
        ...

    def __getitem__(self, key: Any) -> Any:
        ...
        
    def delay(self, value: int) -> Any: 
        """This is a modifier which can be applied to any 
        instruction, and specifies how many cycles to delay 
        for after the instruction executes.

        - *value*: cycles to delay, 0-31 (maximum value reduced 
        if side-set pins are used)
        """
        ...

    def side(self, value: Any) -> Any:
        """This is a modifier which can be applied to any instruction, 
        and is used to control side-set pin values.

        - *value*: the value (bits) to output on the side-set pins
        """
        ...

    def wrap_target(self) -> None:
        """Specify the location where execution 
        continues after program wrapping. By 
        default this is the start of the PIO routine.
        """
        ...

    def wrap(self) -> None:
        """Specify the location where the program finishes
         and wraps around. If this directive is not used then 
         it is added automatically at the end of the PIO routine. 
         Wrapping does not cost any execution cycles.
        """
        ...

    def label(self, label: Any) -> None:
        """Define a label called label at the current location. 
        label can be a string or integer.
        """
        ...

    def word(self, instr: Any, label: Any=None) -> Any:
        """Insert an arbitrary 16-bit word in the assembled 
        output.

        *instr*: the 16-bit value

        *label*: if given, look up the label and logical-or 
        the label's value with *instr*
        """
        ...

    def nop(self) -> Any:
        """This is a pseudoinstruction that assembles 
        to ``mov(y, y)`` and has no side effect.
        """
        ...

    def jmp(self, cond: Any, label: Any=None) -> Any:
        """This instruction takes two forms:
        jmp(label)
        - label: label to jump to unconditionally
        
        jmp(cond, label)
        - *cond*: the condition to check, one of:

        ``not_x``, ``not_y``: true if register is zero

        ``x_dec``, ``y_dec``: true if register is non-zero, and do post decrement

        ``x_not_y``: true if X is not equal to Y

        ``pin``: true if the input pin is set

        ``not_osre``: true if OSR is not empty (hasn't reached its threshold)

        - *label*: label to jump to if condition is true
        """
        ...

    def wait(self, polarity: int, src: Any, index: int) -> Any:
        """Block, waiting for high/low on a pin or IRQ line.

        - *polarity*: 0 or 1, whether to wait for a low or high value

        - *src*: one of: gpio (absolute pin), pin (pin relative to StateMachine's in_base argument), irq

        - *index*: 0-31, the index for src"""
        ...

    def in_(self, src: Any, data: Any) -> Any:
        """Shift data in from src to ISR.

        - *src*: one of: ``pins``, ``x``, ``y``, ``null``, ``isr``, ``osr``
        - *bit_count*: number of bits to shift in (1-32)"""
        ...

    def out(self, dest: Any, bit_count: int) -> Any:
        """Shift data out from OSR to dest.

        - *dest*: one of: ``pins``, ``x``, ``y``, ``pindirs``, ``pc``, ``isr``, ``exec``
        - *bit_count*: number of bits to shift out (1-32)"""
        ...

    def push(self, value: Any=0, value2: Any=0) -> Any:
        """Push ISR to the RX FIFO, then clear ISR to zero. 
        This instruction takes the following forms:

        - push()
        - push(block)
        - push(noblock)
        - push(iffull)
        - push(iffull, block)
        - push(iffull, noblock)

        If ``block`` is used then the instruction stalls if the 
        RX FIFO is full. The default is to block. If ``iffull`` 
        is used then it only pushes if the input shift count 
        has reached its threshold.
        """
        ...

    def pull(self, value: Any=0, value2: Any=0) -> Any:
        """Pull from the TX FIFO into OSR. This instruction 
        takes the following forms:

        - pull()
        - pull(block)
        - pull(noblock)
        - pull(ifempty)
        - pull(ifempty, block)
        - pull(ifempty, noblock)

        If ``block`` is used then the instruction stalls if the 
        TX FIFO is empty. The default is to block. If ``ifempty``
        is used then it only pulls if the output shift count 
        has reached its threshold.
        """
        ...
        
    def mov(self, dest: Any, src: Any) -> Any:
        """Move into dest the value from src.

        - *dest*: one of: pins, ``x``, ``y``, ``exec``, ``pc``, ``isr``, ``osr``
        - *src*: one of: ``pins``, ``x``, ``y``, ``null``, ``status``, ``isr``, ``osr``
        ; this argument can be optionally modified by wrapping it in ``invert()`` 
        or ``reverse()`` (but not both together)
        """
        ...

    @overload
    def irq(self, mode: str, index: Any) -> Any:
        ...
    
    def irq(self, index: Any) -> Any:
        """Set or clear an IRQ flag. This instruction 
        takes two forms:

        irq(index)
        - index: 0-7, or rel(0) to rel(7)

        irq(mode, index)
        - mode: one of: block, clear
        - index: 0-7, or rel(0) to rel(7)
        
        If block is used then the instruction stalls 
        until the flag is cleared by another entity. 
        If clear is used then the flag is cleared 
        instead of being set. Relative IRQ indices 
        add the state machine ID to the IRQ index with 
        modulo-4 addition. IRQs 0-3 are visible from to 
        the processor, 4-7 are internal to the state 
        machines.
        """
        ...
    
    def set(self, dest: Any, data: int) -> Any:
        """Set dest with the value data.

        - dest: ``pins, ``x``, ``y``, ``pindirs``
        - data: value (0-31)
        """
        ...
    

class StateMachine:
    # Determined from: https://github.com/raspberrypi/micropython/blob/1196871a0f2f974b03915e08cfcc0433de4b8a64/ports/rp2/rp2_pio.c
    # Documentation put together via research and may be flawed!
    def __init__(self, id, prog, freq: int=-1, *, in_base: Pin | None =None, out_base: Pin | None =None, set_base: Pin | None =None, jmp_pin: Pin | None =None, sideset_base: Pin | None =None, in_shiftdir: int | None =None, out_shiftdir: int | None =None, push_thresh: int | None =None, pull_thresh: int | None =None):
        """
        Create a new StateMachine containing two First-In-First-Out (FIFO)
        structures: one for incoming data and another for outgoing data.

        The input FIFO is known as the RX FIFO and the output FIFO is known
        as the TX FIFO.

        Each FIFO can contain up to four words of data (each 32 bits) and can
        be linked to Direct Memory Access (DMA).

        The FIFO structures are linked to the state machine via the input and
        output shift registers called X and Y. These are for storing temporary
        data.

        A Pico board has 8 available state machines.

            - *id* should be a number between 0 and 7 (the Pico has 8 machines).
            - *prog* is the assembly code to execute (decorated by ``@asm_pio``).
            - *freq* is the frequency at which the code should be executed (in milliseconds).
        """
        ...

    def init(self, id, prog, freq: int=-1, *, in_base: Pin|None=None, out_base: Pin|None=None, set_base: Pin|None=None, jmp_pin: Pin|None=None, sideset_base: Pin|None=None, in_shiftdir: int|None=None, out_shiftdir: int|None=None, push_thresh: int|None=None, pull_thresh: int|None=None):
        """
        Create a new StateMachine containing two First-In-First-Out (FIFO)
        structures: one for incoming data and another for outgoing data.

        The input FIFO is known as the RX FIFO and the output FIFO is known
        as the TX FIFO.

        Each FIFO can contain up to four words of data (each 32 bits) and can
        be linked to Direct Memory Access (DMA).

        The FIFO structures are linked to the state machine via the input and
        output shift registers called X and Y. These are for storing temporary
        data.

        A Pico board has 8 available state machines.

            - *id* should be a number between 0 and 7 (the Pico has 8 machines).
            - *prog* is the assembly code to execute (decorated by ``@asm_pio``).
            - *freq* is the frequency at which the code should be executed (in milliseconds).
        """
        ...

    def exec(self, instr: str):
        """
        Run an execution instruction.
        """
        ...

    def irq(self, handler=None, trigger=0|1, hard=False):
        """
        Set an IRQ handler.
        """
        ...

    def active(self, value: int):
        """
        Set the ``StateMachine`` to be active.

            - *value* should be 1 for active.
        """
        ...

    def get(self, buf: bytes|None=None, shift: int=0):
        """
        Get data from the ``StateMachine``.

            - *buf* are optional bytes
            - *shift* is an optional number of places to shift.
        """
        ...
    
    def put(self, value: bytes|int | array[int], shift: int=0):
        """
        Sets data within the ``StateMachine``.

            - *buf* are optional bytes
            - *shift* is an optional number of places to shift.
        """
        ...

    def restart(self):
        """
        ``Restarts`` the state machine.

            - it resets the statemachine to the initial state without the need to re-instantiation.
            - It also makes PIO code easier, because then stalling as error state can be unlocked.
        """
        ...

    def rx_fifo(self) -> int:
        """
        Return the number of ``RX FIFO`` items. 0 if empty

            - rx_fifo() is also useful, for MP code to check for data & timeout if no data arrived. 
        """
        ...

    def tx_fifo(self) -> int:
        """
        Return the number of ``TX FIFO`` items. 0 if empty

            - tx_fifo() can be useful to check states where data is not processed.
        """
        ...

def asm_pio(
    out_init: int|None = None,
    set_init: int|None = None,
    sideset_init: int|None = None,
    in_shiftdir: int = 0,
    out_shiftdir: int = 0,
    autopush: bool = False,
    autopull: bool = False,
    push_thresh: int = 32,
    pull_thresh: int = 32,
    fifo_join=0,
) -> Any:
    """
    This decorator lets MicroPython know that the method is written in PIO assembly.

    You should disable linting since the content isn't written in Python.

    In Pylance, move any assembly code into a separate file and ensure the first
    line of that file reads: ``# type: ignore``.

    In Pylint, add a comment that reads ``# pylint: disable=E,W,C,R`` at the beginning of 
    the method.
    """
    ...


def asm_pio_encode(instr: str, sideset_count: int, sideset_opt=False) -> Any:
    """Assemble a single PIO instruction. You usually want to use ``asm_pio()`` instead."""
    ...

def bootsel_button() -> int:
    """
    Temporarily turns the QSPI_SS pin into an input and reads its value, returning 1 for 
    low and 0 for high. On a typical RP2040 board with a BOOTSEL button, a return value 
    of 1 indicates that the button is pressed.

    Since this function temporarily disables access to the external flash memory, it 
    also temporarily disables interrupts and the other core to prevent them from trying 
    to execute code from flash.
    """
    ...

def const(value: Any) -> Any:
    ...

def country(*args, **kwargs) -> Any:
    ...
