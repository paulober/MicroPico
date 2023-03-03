"""

Functions related to the hardware.

Descriptions taken from
`https://raw.githubusercontent.com/micropython/micropython/master/docs/library/machine.rst`, etc.

====================================================

.. module:: machine
   :synopsis: functions related to the hardware



   The ``machine`` module contains specific functions related to the hardware
   on a particular board. Most functions in this module allow to achieve direct
   and unrestricted access to and control of hardware blocks on a system
   (like CPU, timers, buses, etc.). Used incorrectly, this can lead to
   malfunction, lockups, crashes of your board, and in extreme cases, hardware
   damage.

   .. _machine_callbacks:

   A note of callbacks used by functions and class methods of :mod:`machine` module:
   all these callbacks should be considered as executing in an interrupt context.
   This is true for both physical devices with IDs >= 0 and "virtual" devices
   with negative IDs like -1 (these "virtual" devices are still thin shims on
   top of real hardware and real hardware interrupts). See :ref:`isr_rules`.

"""
from collections.abc import Callable, Sequence
from typing import overload, NoReturn
from typing import ClassVar, Any


class ADC:
    """
    The ADC class provides an interface to analog-to-digital convertors, and
    represents a single endpoint that can sample a continuous voltage and
    convert it to a discretised value.

    Example usage::

       import machine

       adc = machine.ADC(pin)   # create an ADC object acting on a pin
       val = adc.read_u16()     # read a raw analog value in the range 0-65535
    """

    def __init__(self, pin: int|Pin, /):
        """
        Access the ADC associated with a source identified by *id*.  This
        *id* may be an integer (usually specifying a channel number), a
        :ref:`Pin <machine.Pin>` object, or other value supported by the
        underlying machine.
        """
        ...

    def read_u16(self) -> int:
        """
        Take an analog reading and return an integer in the range 0-65535.
        The return value represents the raw reading taken by the ADC, scaled
        such that the minimum value is 0 and the maximum value is 65535.
        """
        ...


class Pin:
    """
    A pin is the basic object to control I/O pins.  It has methods to set
    the mode of the pin (input, output, etc) and methods to get and set the
    digital logic level. For analog control of a pin, see the ADC class.
    """

    ALT = 3 # type: int
    ALT_GPCK = 8 # type: int
    ALT_I2C = 3 # type: int
    ALT_PIO0 = 6 # type: int
    ALT_PIO1 = 7 # type: int
    ALT_PWM = 4 # type: int
    ALT_SIO = 5 # type: int
    ALT_SPI = 1 # type: int
    ALT_UART = 2 # type: int
    ALT_USB = 9 # type: int
    IN = 0 # type: int
    IRQ_FALLING = 4 # type: int
    IRQ_RISING = 8 # type: int
    OPEN_DRAIN = 2 # type: int
    OUT = 1 # type: int
    PULL_DOWN = 2 # type: int
    PULL_UP = 1 # type: int

    class board():
        GP0 : Pin 
        """ <class 'Pin'> = Pin(GPIO0, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP1 : Pin 
        """ <class 'Pin'> = Pin(GPIO1, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP10 : Pin 
        """ <class 'Pin'> = Pin(GPIO10, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP11 : Pin 
        """ <class 'Pin'> = Pin(GPIO11, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP12 : Pin 
        """ <class 'Pin'> = Pin(GPIO12, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP13 : Pin 
        """ <class 'Pin'> = Pin(GPIO13, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP14 : Pin 
        """ <class 'Pin'> = Pin(GPIO14, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP15 : Pin 
        """ <class 'Pin'> = Pin(GPIO15, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP16 : Pin 
        """ <class 'Pin'> = Pin(GPIO16, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP17 : Pin 
        """ <class 'Pin'> = Pin(GPIO17, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP18 : Pin 
        """ <class 'Pin'> = Pin(GPIO18, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP19 : Pin 
        """ <class 'Pin'> = Pin(GPIO19, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP2 : Pin 
        """ <class 'Pin'> = Pin(GPIO2, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP20 : Pin 
        """ <class 'Pin'> = Pin(GPIO20, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP21 : Pin 
        """ <class 'Pin'> = Pin(GPIO21, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP22 : Pin 
        """ <class 'Pin'> = Pin(GPIO22, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP26 : Pin 
        """ <class 'Pin'> = Pin(GPIO26, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP27 : Pin 
        """ <class 'Pin'> = Pin(GPIO27, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP28 : Pin 
        """ <class 'Pin'> = Pin(GPIO28, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP3 : Pin 
        """ <class 'Pin'> = Pin(GPIO3, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP4 : Pin 
        """ <class 'Pin'> = Pin(GPIO4, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP5 : Pin 
        """ <class 'Pin'> = Pin(GPIO5, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP6 : Pin 
        """ <class 'Pin'> = Pin(GPIO6, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP7 : Pin 
        """ <class 'Pin'> = Pin(GPIO7, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP8 : Pin 
        """ <class 'Pin'> = Pin(GPIO8, mode=ALT, pull=PULL_DOWN, alt=31) """
        GP9 : Pin 
        """ <class 'Pin'> = Pin(GPIO9, mode=ALT, pull=PULL_DOWN, alt=31) """
        LED : Pin 
        """ <class 'Pin'> = Pin(EXT_GPIO0, mode=IN) """
        WL_GPIO0 : Pin 
        """ <class 'Pin'> = Pin(EXT_GPIO0, mode=IN) """
        WL_GPIO1 : Pin 
        """ <class 'Pin'> = Pin(EXT_GPIO1, mode=IN) """
        WL_GPIO2 : Pin 
        """ <class 'Pin'> = Pin(EXT_GPIO2, mode=IN) """

    class cpu():
        
        EXT_GPIO0 : Pin
        """ <class 'Pin'> = Pin(EXT_GPIO0, mode=IN) """
        EXT_GPIO1 : Pin
        """ <class 'Pin'> = Pin(EXT_GPIO1, mode=IN) """
        EXT_GPIO2 : Pin 
        """ <class 'Pin'> = Pin(EXT_GPIO2, mode=IN) """
        GPIO0 : Pin 
        """ <class 'Pin'> = Pin(GPIO0, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO1 : Pin 
        """ <class 'Pin'> = Pin(GPIO1, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO10 : Pin 
        """ <class 'Pin'> = Pin(GPIO10, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO11 : Pin 
        """ <class 'Pin'> = Pin(GPIO11, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO12 : Pin 
        """ <class 'Pin'> = Pin(GPIO12, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO13 : Pin 
        """ <class 'Pin'> = Pin(GPIO13, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO14 : Pin 
        """ <class 'Pin'> = Pin(GPIO14, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO15 : Pin 
        """ <class 'Pin'> = Pin(GPIO15, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO16 : Pin 
        """ <class 'Pin'> = Pin(GPIO16, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO17 : Pin 
        """ <class 'Pin'> = Pin(GPIO17, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO18 : Pin 
        """ <class 'Pin'> = Pin(GPIO18, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO19 : Pin 
        """ <class 'Pin'> = Pin(GPIO19, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO2 : Pin 
        """ <class 'Pin'> = Pin(GPIO2, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO20 : Pin 
        """ <class 'Pin'> = Pin(GPIO20, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO21 : Pin 
        """ <class 'Pin'> = Pin(GPIO21, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO22 : Pin 
        """ <class 'Pin'> = Pin(GPIO22, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO23 : Pin 
        """ <class 'Pin'> = Pin(GPIO23, mode=ALT, alt=31) """
        GPIO24 : Pin 
        """ <class 'Pin'> = Pin(GPIO24, mode=ALT, alt=31) """
        GPIO25 : Pin 
        """ <class 'Pin'> = Pin(GPIO25, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO26 : Pin 
        """ <class 'Pin'> = Pin(GPIO26, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO27 : Pin 
        """ <class 'Pin'> = Pin(GPIO27, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO28 : Pin 
        """ <class 'Pin'> = Pin(GPIO28, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO29 : Pin 
        """ <class 'Pin'> = Pin(GPIO29, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO3 : Pin 
        """ <class 'Pin'> = Pin(GPIO3, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO4 : Pin 
        """ <class 'Pin'> = Pin(GPIO4, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO5 : Pin 
        """ <class 'Pin'> = Pin(GPIO5, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO6 : Pin 
        """ <class 'Pin'> = Pin(GPIO6, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO7 : Pin 
        """ <class 'Pin'> = Pin(GPIO7, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO8 : Pin 
        """ <class 'Pin'> = Pin(GPIO8, mode=ALT, pull=PULL_DOWN, alt=31) """
        GPIO9 : Pin 
        """ <class 'Pin'> = Pin(GPIO9, mode=ALT, pull=PULL_DOWN, alt=31) """

    def __init__(self, id: int|str, /, mode: int = IN, pull: int = PULL_UP, af: str|int = -1):
        """
        Create a new Pin object associated with the id.  If additional arguments are given,
        they are used to initialise the pin.  See :meth:`pin.init`.
        """
        ...

    def high(self):
        """
        Sets the pin to high.
        """
        ...

    def init(self):
        """
        Initialises the pin.
        """
        ...

    def irq(self, handler: Callable, trigger: int, hard: bool = False) -> Callable:
        """
        Sets an interrupt for when the pin is rising or falling.

            - ``handler`` the code to execute when the interrupt happens.
            - ``trigger`` either ``IRQ_RISING`` or ``IRQ_FALLING``
            - ``hard`` if true a hardware interrupt is used. This reduces the delay between the pin change and the handler being called.
        """
        ...

    def low(self):
        """
        Sets the pin to low.
        """
        ...

    def off(self):
        """
        Sets the pin to be off.
        """
        ...

    def on(self):
        """
        Sets the pin to be on.
        """
        ...

    def toggle(self):
        """
        Sets the pin to high if it's currently low, and vice versa.
        """
        ...

    def value(self, value: Any=..., /) -> None:
        """
        Get or set the digital logic level of the pin:

            - With no argument, return 0 or 1 depending on the logic level of the pin.
            - With ``value`` given, set the logic level of the pin.  ``value`` can be
            anything that converts to a boolean.  If it converts to ``True``, the pin
            is set high, otherwise it is set low.
        """
        ...


class RTC():
    """The RTC is an independent clock that keeps track of the date and time."""

    def __init__(self, *argv, **kwargs) -> None:
        ...

    def datetime(self, *args, **kwargs) -> Any:
        """
        Get or set the date and time of the RTC.

        With no arguments, this method returns an 8-tuple with the 
        current date and time. With 1 argument (being an 8-tuple) 
        it sets the date and time.

        The 8-tuple has the following format:

        (year, month, day, weekday, hours, minutes, seconds, subseconds)

        The meaning of the `subseconds` field is hardware dependent.
        """
        ...


class SPI:
    """
    SPI is a synchronous serial protocol that is driven by a master. At the
    physical level, a bus consists of 3 lines: SCK, MOSI, MISO. Multiple devices
    can share the same bus. Each device should have a separate, 4th signal,
    SS (Slave Select), to select a particular device on a bus with which
    communication takes place. Management of an SS signal should happen in
    user code (via machine.Pin class).

    Both hardware and software SPI implementations exist via the
    :ref:`machine.SPI <machine.SPI>` and `machine.SoftSPI` classes.  Hardware SPI uses underlying
    hardware support of the system to perform the reads/writes and is usually
    efficient and fast but may have restrictions on which pins can be used.
    Software SPI is implemented by bit-banging and can be used on any pin but
    is not as efficient.  These classes have the same methods available and
    differ primarily in the way they are constructed.
    """

    MSB: ClassVar[int] = ...
    """
   set the first bit to be the most significant bit
   """

    LSB: ClassVar[int] = ...
    """
   set the first bit to be the least significant bit
   """

    @overload
    def __init__(self, id: int, /):
        """
        Construct an SPI object on the given bus, *id*. Values of *id* depend
        on a particular port and its hardware. Values 0, 1, etc. are commonly used
        to select hardware SPI block #0, #1, etc.

        With no additional parameters, the SPI object is created but not
        initialised (it has the settings from the last initialisation of
        the bus, if any).  If extra arguments are given, the bus is initialised.
        See ``init`` for parameters of initialisation.
        """
        ...

    @overload
    def __init__(
        self,
        id: int,
        /,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        sck: Pin|None = None,
        mosi: Pin|None = None,
        miso: Pin|None = None,
    ):
        """
        Construct an SPI object on the given bus, *id*. Values of *id* depend
        on a particular port and its hardware. Values 0, 1, etc. are commonly used
        to select hardware SPI block #0, #1, etc.

        With no additional parameters, the SPI object is created but not
        initialised (it has the settings from the last initialisation of
        the bus, if any).  If extra arguments are given, the bus is initialised.
        See ``init`` for parameters of initialisation.
        """
        ...

    @overload
    def __init__(
        self,
        id: int,
        /,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        pins: tuple[Pin, Pin, Pin]|None = None,
    ):
        """
        Construct an SPI object on the given bus, *id*. Values of *id* depend
        on a particular port and its hardware. Values 0, 1, etc. are commonly used
        to select hardware SPI block #0, #1, etc.

        With no additional parameters, the SPI object is created but not
        initialised (it has the settings from the last initialisation of
        the bus, if any).  If extra arguments are given, the bus is initialised.
        See ``init`` for parameters of initialisation.
        """
        ...

    @overload
    def init(
        self,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        sck: Pin|None = None,
        mosi: Pin|None = None,
        miso: Pin|None = None,
    ) -> None:
        """
        Initialise the SPI bus with the given parameters:

          - ``baudrate`` is the SCK clock rate.
          - ``polarity`` can be 0 or 1, and is the level the idle clock line sits at.
          - ``phase`` can be 0 or 1 to sample data on the first or second clock edge
            respectively.
          - ``bits`` is the width in bits of each transfer. Only 8 is guaranteed to be supported by all hardware.
          - ``firstbit`` can be ``SPI.MSB`` or ``SPI.LSB``.
          - ``sck``, ``mosi``, ``miso`` are pins (machine.Pin) objects to use for bus signals. For most
            hardware SPI blocks (as selected by ``id`` parameter to the constructor), pins are fixed
            and cannot be changed. In some cases, hardware blocks allow 2-3 alternative pin sets for
            a hardware SPI block. Arbitrary pin assignments are possible only for a bitbanging SPI driver
            (``id`` = -1).
          - ``pins`` - WiPy port doesn't ``sck``, ``mosi``, ``miso`` arguments, and instead allows to
            specify them as a tuple of ``pins`` parameter.

        In the case of hardware SPI the actual clock frequency may be lower than the
        requested baudrate. This is dependant on the platform hardware. The actual
        rate may be determined by printing the SPI object.
        """
        ...

    @overload
    def init(
        self,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        pins: tuple[Pin, Pin, Pin]|None = None,
    ) -> None:
        """
        Initialise the SPI bus with the given parameters:

          - ``baudrate`` is the SCK clock rate.
          - ``polarity`` can be 0 or 1, and is the level the idle clock line sits at.
          - ``phase`` can be 0 or 1 to sample data on the first or second clock edge
            respectively.
          - ``bits`` is the width in bits of each transfer. Only 8 is guaranteed to be supported by all hardware.
          - ``firstbit`` can be ``SPI.MSB`` or ``SPI.LSB``.
          - ``sck``, ``mosi``, ``miso`` are pins (machine.Pin) objects to use for bus signals. For most
            hardware SPI blocks (as selected by ``id`` parameter to the constructor), pins are fixed
            and cannot be changed. In some cases, hardware blocks allow 2-3 alternative pin sets for
            a hardware SPI block. Arbitrary pin assignments are possible only for a bitbanging SPI driver
            (``id`` = -1).
          - ``pins`` - WiPy port doesn't ``sck``, ``mosi``, ``miso`` arguments, and instead allows to
            specify them as a tuple of ``pins`` parameter.

        In the case of hardware SPI the actual clock frequency may be lower than the
        requested baudrate. This is dependant on the platform hardware. The actual
        rate may be determined by printing the SPI object.
        """
        ...

    def deinit(self) -> None:
        """
        Turn off the SPI bus.
        """
        ...

    def read(self, nbytes: int, write: int = 0x00, /) -> bytes:
        """
         Read a number of bytes specified by ``nbytes`` while continuously writing
         the single byte given by ``write``.
         Returns a ``bytes`` object with the data that was read.
        """
        ...

    def readinto(self, buf: bytes, write: int = 0x00, /) -> int|None:
        """
         Read into the buffer specified by ``buf`` while continuously writing the
         single byte given by ``write``.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes read.
        """
        ...

    def write(self, buf: bytes, /) -> int|None:
        """
         Write the bytes contained in ``buf``.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes written.
        """
        ...

    def write_readinto(self, write_buf: bytes, read_buf: bytes, /) -> int|None:
        """
         Write the bytes from ``write_buf`` while reading into ``read_buf``.  The
         buffers can be the same or different, but both buffers must have the
         same length.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes written.
        """
        ...


class SoftSPI:
    """
    SPI is a synchronous serial protocol that is driven by a master. At the
    physical level, a bus consists of 3 lines: SCK, MOSI, MISO. Multiple devices
    can share the same bus. Each device should have a separate, 4th signal,
    SS (Slave Select), to select a particular device on a bus with which
    communication takes place. Management of an SS signal should happen in
    user code (via machine.Pin class).

    Both hardware and software SPI implementations exist via the
    :ref:`machine.SPI <machine.SPI>` and `machine.SoftSPI` classes.  Hardware SPI uses underlying
    hardware support of the system to perform the reads/writes and is usually
    efficient and fast but may have restrictions on which pins can be used.
    Software SPI is implemented by bit-banging and can be used on any pin but
    is not as efficient.  These classes have the same methods available and
    differ primarily in the way they are constructed.
    """

    MSB: ClassVar[int] = ...
    """
   set the first bit to be the most significant bit
   """

    LSB: ClassVar[int] = ...
    """
   set the first bit to be the least significant bit
   """

    def __init__(
        self,
        id: int,
        /,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        sck: Pin|None = None,
        mosi: Pin|None = None,
        miso: Pin|None = None,
    ):
        """
        Construct an SPI object on the given bus, *id*. Values of *id* depend
        on a particular port and its hardware. Values 0, 1, etc. are commonly used
        to select hardware SPI block #0, #1, etc.

        With no additional parameters, the SPI object is created but not
        initialised (it has the settings from the last initialisation of
        the bus, if any).  If extra arguments are given, the bus is initialised.
        See ``init`` for parameters of initialisation.
        """
        ...

    @overload
    def __init__(
        self,
        id: int,
        /,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        pins: tuple[Pin, Pin, Pin]|None = None,
    ):
        """
        Construct an SPI object on the given bus, *id*. Values of *id* depend
        on a particular port and its hardware. Values 0, 1, etc. are commonly used
        to select hardware SPI block #0, #1, etc.

        With no additional parameters, the SPI object is created but not
        initialised (it has the settings from the last initialisation of
        the bus, if any).  If extra arguments are given, the bus is initialised.
        See ``init`` for parameters of initialisation.
        """
        ...

    @overload
    def init(
        self,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        sck: Pin|None = None,
        mosi: Pin|None = None,
        miso: Pin|None = None,
    ) -> None:
        """
        Initialise the SPI bus with the given parameters:

          - ``baudrate`` is the SCK clock rate.
          - ``polarity`` can be 0 or 1, and is the level the idle clock line sits at.
          - ``phase`` can be 0 or 1 to sample data on the first or second clock edge
            respectively.
          - ``bits`` is the width in bits of each transfer. Only 8 is guaranteed to be supported by all hardware.
          - ``firstbit`` can be ``SPI.MSB`` or ``SPI.LSB``.
          - ``sck``, ``mosi``, ``miso`` are pins (machine.Pin) objects to use for bus signals. For most
            hardware SPI blocks (as selected by ``id`` parameter to the constructor), pins are fixed
            and cannot be changed. In some cases, hardware blocks allow 2-3 alternative pin sets for
            a hardware SPI block. Arbitrary pin assignments are possible only for a bitbanging SPI driver
            (``id`` = -1).
          - ``pins`` - WiPy port doesn't ``sck``, ``mosi``, ``miso`` arguments, and instead allows to
            specify them as a tuple of ``pins`` parameter.

        In the case of hardware SPI the actual clock frequency may be lower than the
        requested baudrate. This is dependant on the platform hardware. The actual
        rate may be determined by printing the SPI object.
        """
        ...

    @overload
    def init(
        self,
        baudrate: int = 1_000_000,
        *,
        polarity: int = 0,
        phase: int = 0,
        bits: int = 8,
        firstbit: int = MSB,
        pins: tuple[Pin, Pin, Pin]|None = None,
    ) -> None:
        """
        Initialise the SPI bus with the given parameters:

          - ``baudrate`` is the SCK clock rate.
          - ``polarity`` can be 0 or 1, and is the level the idle clock line sits at.
          - ``phase`` can be 0 or 1 to sample data on the first or second clock edge
            respectively.
          - ``bits`` is the width in bits of each transfer. Only 8 is guaranteed to be supported by all hardware.
          - ``firstbit`` can be ``SPI.MSB`` or ``SPI.LSB``.
          - ``sck``, ``mosi``, ``miso`` are pins (machine.Pin) objects to use for bus signals. For most
            hardware SPI blocks (as selected by ``id`` parameter to the constructor), pins are fixed
            and cannot be changed. In some cases, hardware blocks allow 2-3 alternative pin sets for
            a hardware SPI block. Arbitrary pin assignments are possible only for a bitbanging SPI driver
            (``id`` = -1).
          - ``pins`` - WiPy port doesn't ``sck``, ``mosi``, ``miso`` arguments, and instead allows to
            specify them as a tuple of ``pins`` parameter.

        In the case of hardware SPI the actual clock frequency may be lower than the
        requested baudrate. This is dependant on the platform hardware. The actual
        rate may be determined by printing the SPI object.
        """
        ...

    def deinit(self) -> None:
        """
        Turn off the SPI bus.
        """
        ...

    def read(self, nbytes: int, write: int = 0x00, /) -> bytes:
        """
         Read a number of bytes specified by ``nbytes`` while continuously writing
         the single byte given by ``write``.
         Returns a ``bytes`` object with the data that was read.
        """
        ...

    def readinto(self, buf: bytes, write: int = 0x00, /) -> int|None:
        """
         Read into the buffer specified by ``buf`` while continuously writing the
         single byte given by ``write``.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes read.
        """
        ...

    def write(self, buf: bytes, /) -> int|None:
        """
         Write the bytes contained in ``buf``.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes written.
        """
        ...

    def write_readinto(self, write_buf: bytes, read_buf: bytes, /) -> int|None:
        """
         Write the bytes from ``write_buf`` while reading into ``read_buf``.  The
         buffers can be the same or different, but both buffers must have the
         same length.
         Returns ``None``.

         Note: on WiPy this function returns the number of bytes written.
        """
        ...


class I2C:
    """
    I2C is a two-wire protocol for communicating between devices.  At the physical
    level it consists of 2 wires: SCL and SDA, the clock and data lines respectively.

    I2C objects are created attached to a specific bus.  They can be initialised
    when created, or initialised later on.

    Printing the I2C object gives you information about its configuration.

    Both hardware and software I2C implementations exist via the
    :ref:`machine.I2C <machine.I2C>` and `machine.SoftI2C` classes.  Hardware I2C uses
    underlying hardware support of the system to perform the reads/writes and is
    usually efficient and fast but may have restrictions on which pins can be used.
    Software I2C is implemented by bit-banging and can be used on any pin but is not
    as efficient.  These classes have the same methods available and differ primarily
    in the way they are constructed.

    Example usage::

        from machine import I2C

        # create I2C peripheral at frequency of 400kHz
        i2c = I2C(freq=400000)
                                        # depending on the port, extra parameters may be required
                                        # to select the peripheral and/or pins to use

        i2c.scan()                      # scan for slaves, returning a list of 7-bit addresses

        # write 3 bytes to slave with 7-bit address 42
        i2c.writeto(42, b'123')
        # read 4 bytes from slave with 7-bit address 42
        i2c.readfrom(42, 4)

        i2c.readfrom_mem(42, 8, 3)      # read 3 bytes from memory of slave 42,
                                        #   starting at memory-address 8 in the slave
        i2c.writeto_mem(42, 2, b'\x10') # write 1 byte to memory of slave 42
                                        #   starting at address 2 in the slave
    """

    @overload
    def __init__(self, id: int, /, *, freq: int = 400_000):
        """
        Construct and return a new I2C object using the following parameters:

           - *id* identifies a particular I2C peripheral.  Allowed values for
             depend on the particular port/board
           - *scl* should be a pin object specifying the pin to use for SCL.
           - *sda* should be a pin object specifying the pin to use for SDA.
           - *freq* should be an integer which sets the maximum frequency
             for SCL.

        Note that some ports/boards will have default values of *scl* and *sda*
        that can be changed in this constructor.  Others will have fixed values
        of *scl* and *sda* that cannot be changed.
        """
        ...

    @overload
    def __init__(self, id: int, /, *, scl: Pin, sda: Pin, freq: int = 400_000):
        """
        Construct and return a new I2C object using the following parameters:

           - *id* identifies a particular I2C peripheral.  Allowed values for
             depend on the particular port/board
           - *scl* should be a pin object specifying the pin to use for SCL.
           - *sda* should be a pin object specifying the pin to use for SDA.
           - *freq* should be an integer which sets the maximum frequency
             for SCL.

        Note that some ports/boards will have default values of *scl* and *sda*
        that can be changed in this constructor.  Others will have fixed values
        of *scl* and *sda* that cannot be changed.
        """
        ...

    def init(self, *, scl: Pin, sda: Pin, freq: int = 400_000) -> None:
        """
       Initialise the I2C bus with the given arguments:

          - *scl* is a pin object for the SCL line
          - *sda* is a pin object for the SDA line
          - *freq* is the SCL clock rate
        """
        ...

    def scan(self) -> list[int]:
        """
        Scan all I2C addresses between 0x08 and 0x77 inclusive and return a list of
        those that respond.  A device responds if it pulls the SDA line low after
        its address (including a write bit) is sent on the bus.
        """
        ...

    def start(self) -> None:
        """
        Generate a START condition on the bus (SDA transitions to low while SCL is high).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def stop(self) -> None:
        """
        Generate a STOP condition on the bus (SDA transitions to high while SCL is high).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def readinto(self, buf: bytes, nack: bool = True, /) -> None:
        """
        Reads bytes from the bus and stores them into *buf*.  The number of bytes
        read is the length of *buf*.  An ACK will be sent on the bus after
        receiving all but the last byte.  After the last byte is received, if *nack*
        is true then a NACK will be sent, otherwise an ACK will be sent (and in this
        case the slave assumes more bytes are going to be read in a later call).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def write(self, buf: bytes, /) -> int:
        """
        Write the bytes from *buf* to the bus.  Checks that an ACK is received
        after each byte and stops transmitting the remaining bytes if a NACK is
        received.  The function returns the number of ACKs that were received.


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def readfrom(self, addr: int, nbytes: int, stop: bool = True, /) -> bytes:
        """
        Read *nbytes* from the slave specified by *addr*.
        If *stop* is true then a STOP condition is generated at the end of the transfer.
        Returns a `bytes` object with the data read.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def readfrom_into(self, addr: int, buf: bytes, stop: bool = True, /) -> None:
        """
        Read into *buf* from the slave specified by *addr*.
        The number of bytes read will be the length of *buf*.
        If *stop* is true then a STOP condition is generated at the end of the transfer.

        The method returns ``None``.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def writeto(self, addr: int, buf: bytes, stop: bool = True, /) -> int:
        """
        Write the bytes from *buf* to the slave specified by *addr*.  If a
        NACK is received following the write of a byte from *buf* then the
        remaining bytes are not sent.  If *stop* is true then a STOP condition is
        generated at the end of the transfer, even if a NACK is received.
        The function returns the number of ACKs that were received.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def writevto(
        self,
        addr: int,
        vector: Sequence[bytes],
        stop: bool = True,
        /
    ) -> int:
        """
        Write the bytes contained in *vector* to the slave specified by *addr*.
        *vector* should be a tuple or list of objects with the buffer protocol.
        The *addr* is sent once and then the bytes from each object in *vector*
        are written out sequentially.  The objects in *vector* may be zero bytes
        in length in which case they don't contribute to the output.

        If a NACK is received following the write of a byte from one of the
        objects in *vector* then the remaining bytes, and any remaining objects,
        are not sent.  If *stop* is true then a STOP condition is generated at
        the end of the transfer, even if a NACK is received.  The function
        returns the number of ACKs that were received.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def readfrom_mem(self, addr: int, memaddr: int, nbytes: int, /, *, addrsize: int = 8) -> bytes:
        """
        Read *nbytes* from the slave specified by *addr* starting from the memory
        address specified by *memaddr*.
        The argument *addrsize* specifies the address size in bits.
        Returns a `bytes` object with the data read.


        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...

    def readfrom_mem_into(
        self,
        addr: int,
        memaddr: int,
        buf: bytes,
        /,
        *,
        addrsize: int = 8
    ) -> None:
        """
        Read into *buf* from the slave specified by *addr* starting from the
        memory address specified by *memaddr*.  The number of bytes read is the
        length of *buf*.
        The argument *addrsize* specifies the address size in bits (on ESP8266
        this argument is not recognised and the address size is always 8 bits).

        The method returns ``None``.


        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...

    def writeto_mem(self, addr: int, memaddr: int, buf: bytes, /, *, addrsize: int = 8) -> None:
        """
        Write *buf* to the slave specified by *addr* starting from the
        memory address specified by *memaddr*.
        The argument *addrsize* specifies the address size in bits (on ESP8266
        this argument is not recognised and the address size is always 8 bits).

        The method returns ``None``.

        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...


class I2S():
    """
    I2S is a synchronous serial protocol used to connect digital audio devices. 
    At the physical level, a bus consists of 3 lines: SCK, WS, SD. The I2S class 
    supports controller operation. Peripheral operation is not supported.

    The I2S class is currently available as a Technical Preview. During the preview 
    period, feedback from users is encouraged. Based on this feedback, the I2S class 
    API and implementation may be changed.
    """

    def __init__(self, *argv, **kwargs) -> None:
        """
        Construct an I2S object of the given id:

        id identifies a particular I2S bus; it is board and port specific

        Keyword-only parameters that are supported on all ports:

        - `sck` is a pin object for the serial clock line

        - `ws` is a pin object for the word select line

        - `sd` is a pin object for the serial data line

        - `mck` is a pin object for the master clock line; master clock frequency is sampling rate * 256

        - `mode` specifies receive or transmit

        - `bits` specifies sample size (bits), 16 or 32

        - `format` specifies channel format, STEREO or MONO

        - `rate` specifies audio sampling rate (Hz); this is the frequency of the ws signal

        - `ibuf` specifies internal buffer length (bytes)
        """
        ...

    def readinto(self, buf) -> int:
        """
        Read audio samples into the buffer specified by `buf`. `buf` must 
        support the buffer protocol, such as bytearray or array. "buf" 
        byte ordering is little-endian. For Stereo format, left channel 
        sample precedes right channel sample. For Mono format, the left 
        channel sample data is used. Returns number of bytes read
        """
        ...

    def write(self, buf) -> int:
        """
        Write audio samples contained in `buf`. `buf` must support the buffer protocol, 
        such as bytearray or array. “buf” byte ordering is little-endian. For Stereo 
        format, left channel sample precedes right channel sample. For Mono format, 
        the sample data is written to both the right and left channels. 
        Returns number of bytes written
        """
        ...

    MONO = 0 # type: int
    RX = 0 # type: int
    STEREO = 1 # type: int
    TX = 1 # type: int

    def deinit(self, *args, **kwargs) -> Any:
        """Deinitialize the I2S bus"""
        ...

    def init(self, *args, **kwargs) -> Any:
        ...

    def irq(self, handler) -> Any:
        """
        Set a callback. `handler` is called when `buf` is 
        emptied (`write` method) or becomes full 
        (`readinto` method). Setting a callback changes 
        the `write` and `readinto` methods to non-blocking 
        operation. `handler` is called in the context 
        of the MicroPython scheduler.
        """
        ...

    def shift(self, buf, bits, shift: int) -> Any:
        """
        bitwise shift of all samples contained in `buf`. `bits` 
        specifies sample size in bits. `shift` specifies the number 
        of bits to shift each sample. Positive for left shift, 
        negative for right shift. Typically used for volume control. 
        Each bit shift changes sample volume by 6dB.
        """
        ...


class PWM:
    """
    Pulse width modulation (PWM), allows you to give analogue behaviours to digital
    devices, such as LEDs. This means that rather than an LED being simply on or
    off, you can control its brightness.

    Example usage::

       from machine import PWM

       pwm = PWM(pin)          # create a PWM object on a pin
       pwm.duty_u16(32768)     # set duty to 50%

       # reinitialise with a period of 200us, duty of 5us
       pwm.init(freq=5000, duty_ns=5000)

       pwm.duty_ns(3000)       # set pulse width to 3us

       pwm.deinit()
    """

    def __init__(self, pin: Pin):
        """
        Construct and return a new PWM object using the following parameters:

           - *pin* should be the pin to use.
        """
        ...

    def deinit(self) -> None:
        """
        Disable the PWM output.
        """
        ...

    def freq(self, frequency: int|None=...):
        """
        With no arguments the frequency in Hz is returned.

        With a single *value* argument the frequency is set to that value in Hz.  The method may raise a ``ValueError`` if the frequency is outside the valid range.
        """
        ...

    def duty_u16(self, duration: int|None=...):
        """
        Get or Set the current duty cycle of the PWM output, as an unsigned 16-bit value in the range 0 to 65535 inclusive.

        With no arguments the duty cycle is returned.

        With a single *value* argument the duty cycle is set to that value, measured as the ratio ``value / 65535``.
        """
        ...

    def duty_ns(self, duration: int|None=...):
        """
        Get or Set the current pulse width of the PWM output, as a value in nanoseconds.

        With no arguments the pulse width in nanoseconds is returned.

        With a single *value* argument the pulse width is set to that value.
        """
        ...


class Signal:
    """
    The ``Signal`` class is a simple extension of the ``Pin`` class. Unlike Pin, which can
    be only in “absolute” 0 and 1 states, a Signal can be in “asserted” (on) or
    “deasserted” (off) states, while being inverted (active-low) or not.

    In other words, it adds logical inversion support to Pin functionality.

    While this may seem a simple addition, it is exactly what is needed to support
    wide array of simple digital devices in a way portable across different boards,
    which is one of the major MicroPython goals.

    Regardless of whether different users have an active-high or active-low LED, a
    normally open or normally closed relay - you can develop a single, nicely looking
    application which works with each of them, and capture hardware configuration
    differences in few lines in the config file of your app.
    """

    @overload
    def __init__(self, pin_obj: Pin, invert: bool = False):
        """
        Create a ``Signal`` object by wrapping existing ``Pin`` object.
        """
        ...

    @overload
    def __init__(self, id: int|str, /, mode: int = Pin.IN, pull: int = Pin.PULL_UP, af: str|int = -1, invert: bool = False):
        """
        Create a ``Signal`` object by passing required ``Pin`` parameters directly
        to ``Signal`` constructor, skipping the need to create intermediate ``Pin`` object.
        """
        ...

    def off(self):
        """
        Deactivate signal.
        """
        ...

    def on(self):
        """
        Activate signal.
        """
        ...

    def value(self, x: Any):
        """
        This method allows to set and get the value of the signal, depending on whether
        the argument ``x`` is supplied or not.

        If the argument is omitted then this method gets the signal level, ``1`` meaning signal
        is asserted (active) and ``0`` meaning signal inactive.

        If the argument is supplied then this method sets the signal level. The argument ``x`` can
        be anything that converts to a boolean. If it converts to ``True``, the signal is active,
        otherwise it is inactive.

        Correspondence between signal being active and actual logic level on the underlying pin
        depends on whether signal is inverted (active-low) or not. For non-inverted signal,
        active status corresponds to logical ``1``, inactive to logical ``0``. For
        inverted/active-low signal, active status corresponds to logical ``0``, while inactive
        corresponds to logical ``1``.
        """
        ...


class SoftI2C:
    """
    I2C is a two-wire protocol for communicating between devices.  At the physical
    level it consists of 2 wires: SCL and SDA, the clock and data lines respectively.

    I2C objects are created attached to a specific bus.  They can be initialised
    when created, or initialised later on.

    Printing the I2C object gives you information about its configuration.

    Both hardware and software I2C implementations exist via the
    :ref:`machine.I2C <machine.I2C>` and `machine.SoftI2C` classes.  Hardware I2C uses
    underlying hardware support of the system to perform the reads/writes and is
    usually efficient and fast but may have restrictions on which pins can be used.
    Software I2C is implemented by bit-banging and can be used on any pin but is not
    as efficient.  These classes have the same methods available and differ primarily
    in the way they are constructed.

    Example usage::

        from machine import I2C

        # create I2C peripheral at frequency of 400kHz
        i2c = I2C(freq=400000)
                                        # depending on the port, extra parameters may be required
                                        # to select the peripheral and/or pins to use

        i2c.scan()                      # scan for slaves, returning a list of 7-bit addresses

        # write 3 bytes to slave with 7-bit address 42
        i2c.writeto(42, b'123')
        # read 4 bytes from slave with 7-bit address 42
        i2c.readfrom(42, 4)

        i2c.readfrom_mem(42, 8, 3)      # read 3 bytes from memory of slave 42,
                                        #   starting at memory-address 8 in the slave
        i2c.writeto_mem(42, 2, b'\x10') # write 1 byte to memory of slave 42
                                        #   starting at address 2 in the slave
    """

    def __init__(self, id: int, /, *, scl: Pin, sda: Pin, freq: int = 400_000):
        """
        Construct and return a new I2C object using the following parameters:

           - *id* identifies a particular I2C peripheral.  Allowed values for
             depend on the particular port/board
           - *scl* should be a pin object specifying the pin to use for SCL.
           - *sda* should be a pin object specifying the pin to use for SDA.
           - *freq* should be an integer which sets the maximum frequency
             for SCL.

        Note that some ports/boards will have default values of *scl* and *sda*
        that can be changed in this constructor.  Others will have fixed values
        of *scl* and *sda* that cannot be changed.
        """
        ...

    def init(self, *, scl: Pin, sda: Pin, freq: int = 400_000) -> None:
        """
       Initialise the I2C bus with the given arguments:

          - *scl* is a pin object for the SCL line
          - *sda* is a pin object for the SDA line
          - *freq* is the SCL clock rate
        """
        ...

    def scan(self) -> list[int]:
        """
        Scan all I2C addresses between 0x08 and 0x77 inclusive and return a list of
        those that respond.  A device responds if it pulls the SDA line low after
        its address (including a write bit) is sent on the bus.
        """
        ...

    def start(self) -> None:
        """
        Generate a START condition on the bus (SDA transitions to low while SCL is high).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def stop(self) -> None:
        """
        Generate a STOP condition on the bus (SDA transitions to high while SCL is high).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def readinto(self, buf: bytes, nack: bool = True, /) -> None:
        """
        Reads bytes from the bus and stores them into *buf*.  The number of bytes
        read is the length of *buf*.  An ACK will be sent on the bus after
        receiving all but the last byte.  After the last byte is received, if *nack*
        is true then a NACK will be sent, otherwise an ACK will be sent (and in this
        case the slave assumes more bytes are going to be read in a later call).


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def write(self, buf: bytes, /) -> int:
        """
        Write the bytes from *buf* to the bus.  Checks that an ACK is received
        after each byte and stops transmitting the remaining bytes if a NACK is
        received.  The function returns the number of ACKs that were received.


        Primitive I2C operations
        ------------------------

        The following methods implement the primitive I2C master bus operations and can
        be combined to make any I2C transaction.  They are provided if you need more
        control over the bus, otherwise the standard methods (see below) can be used.

        These methods are only available on the `machine.SoftI2C` class.
        """
        ...

    def readfrom(self, addr: int, nbytes: int, stop: bool = True, /) -> bytes:
        """
        Read *nbytes* from the slave specified by *addr*.
        If *stop* is true then a STOP condition is generated at the end of the transfer.
        Returns a `bytes` object with the data read.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def readfrom_into(self, addr: int, buf: bytes, stop: bool = True, /) -> None:
        """
        Read into *buf* from the slave specified by *addr*.
        The number of bytes read will be the length of *buf*.
        If *stop* is true then a STOP condition is generated at the end of the transfer.

        The method returns ``None``.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def writeto(self, addr: int, buf: bytes, stop: bool = True, /) -> int:
        """
        Write the bytes from *buf* to the slave specified by *addr*.  If a
        NACK is received following the write of a byte from *buf* then the
        remaining bytes are not sent.  If *stop* is true then a STOP condition is
        generated at the end of the transfer, even if a NACK is received.
        The function returns the number of ACKs that were received.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def writevto(
        self,
        addr: int,
        vector: Sequence[bytes],
        stop: bool = True,
        /
    ) -> int:
        """
        Write the bytes contained in *vector* to the slave specified by *addr*.
        *vector* should be a tuple or list of objects with the buffer protocol.
        The *addr* is sent once and then the bytes from each object in *vector*
        are written out sequentially.  The objects in *vector* may be zero bytes
        in length in which case they don't contribute to the output.

        If a NACK is received following the write of a byte from one of the
        objects in *vector* then the remaining bytes, and any remaining objects,
        are not sent.  If *stop* is true then a STOP condition is generated at
        the end of the transfer, even if a NACK is received.  The function
        returns the number of ACKs that were received.


        Standard bus operations
        -----------------------

        The following methods implement the standard I2C master read and write
        operations that target a given slave device.
        """
        ...

    def readfrom_mem(self, addr: int, memaddr: int, nbytes: int, /, *, addrsize: int = 8) -> bytes:
        """
        Read *nbytes* from the slave specified by *addr* starting from the memory
        address specified by *memaddr*.
        The argument *addrsize* specifies the address size in bits.
        Returns a `bytes` object with the data read.


        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...

    def readfrom_mem_into(
        self,
        addr: int,
        memaddr: int,
        buf: bytes,
        /,
        *,
        addrsize: int = 8
    ) -> None:
        """
        Read into *buf* from the slave specified by *addr* starting from the
        memory address specified by *memaddr*.  The number of bytes read is the
        length of *buf*.
        The argument *addrsize* specifies the address size in bits (on ESP8266
        this argument is not recognised and the address size is always 8 bits).

        The method returns ``None``.


        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...

    def writeto_mem(self, addr: int, memaddr: int, buf: bytes, /, *, addrsize: int = 8) -> None:
        """
        Write *buf* to the slave specified by *addr* starting from the
        memory address specified by *memaddr*.
        The argument *addrsize* specifies the address size in bits (on ESP8266
        this argument is not recognised and the address size is always 8 bits).

        The method returns ``None``.

        Memory operations
        -----------------

        Some I2C devices act as a memory device (or set of registers) that can be read
        from and written to.  In this case there are two addresses associated with an
        I2C transaction: the slave address and the memory address.  The following
        methods are convenience functions to communicate with such devices.
        """
        ...


class Timer:
    """
    Hardware timers deal with timing of periods and events. Timers are perhaps
    the most flexible and heterogeneous kind of hardware in MCUs and SoCs,
    differently greatly from a model to a model. MicroPython's Timer class
    defines a baseline operation of executing a callback with a given period
    (or once after some delay), and allow specific boards to define more
    non-standard behavior (which thus won't be portable to other boards).

    See discussion of :ref:`important constraints <machine_callbacks>` on
    Timer callbacks.

    .. note::

        Memory can't be allocated inside irq handlers (an interrupt) and so
        exceptions raised within a handler don't give much information.  See
        :func:`micropython.alloc_emergency_exception_buf` for how to get around this
        limitation.

    If you are using a WiPy board please refer to :ref:`machine.TimerWiPy <machine.TimerWiPy>`
    instead of this class.
    """

    ONE_SHOT: ClassVar[int] = ...
    """
    Timer operating mode.
    """

    PERIODIC: ClassVar[int] = ...
    """
    Timer operating mode.
    """

    def __init__(
        self,
        id: int|None=None,
        /,
        *,
        mode: int = PERIODIC,
        period: int = -1,
        callback: Callable[["Timer"], None] |None = None,
    ):
        """
        Construct a new timer object of the given id. Id of -1 constructs a
        virtual timer (if supported by a board).

        See ``init`` for parameters of initialisation.
        """
        ...

    def init(
        self,
        *,
        freq: float|None = None,
        mode: int = PERIODIC,
        period: int = -1,
        callback: Callable[["Timer"], None]|None = None,
    ) -> None:
        """
        Initialise the timer. Example::

            # periodic with 100ms period
            tim.init(period=100)
            # one shot firing after 1000ms
            tim.init(mode=Timer.ONE_SHOT, period=1000)

        Keyword arguments:

          - ``mode`` can be one of:

            - ``Timer.ONE_SHOT`` - The timer runs once until the configured
              period of the channel expires.
            - ``Timer.PERIODIC`` - The timer runs periodically at the configured
              frequency of the channel.
        """
        ...

    def deinit(self) -> None:
        """
        Deinitialises the timer. Stops the timer, and disables the timer peripheral.
        """
        ...


class UART:
    """
    UART implements the standard UART/USART duplex serial communications protocol.  At
    the physical level it consists of 2 lines: RX and TX.  The unit of communication
    is a character (not to be confused with a string character) which can be 8 or 9
    bits wide.
    """

    CTS = 1 # type: int
    INV_RX = 2 # type: int
    INV_TX = 1 # type: int
    RTS = 2 # type: int

    def __init__(self, id: int, baudrate: int = 9600, bits: int = 8, parity: int|None = None, stop: int = 1, tx: Pin|None = None, rx: Pin|None = None):
        """
        Construct a UART object of the given id and initialise the UART
        bus with the given parameters:

        - *baudrate* is the clock rate.
        - *bits* is the number of bits per character, 7, 8 or 9.
        - *parity* is the parity, ``None``, 0 (even) or 1 (odd).
        - *stop* is the number of stop bits, 1 or 2.
        - *tx* specifies the TX pin to use.
        - *rx* specifies the RX pin to use.
        """
        ...

    def deinit(self) -> None:
        """
        Turn off the UART bus.

        Note:
        You will not be able to call `init()` on the object 
        after `deinit()`. A new instance needs to be created 
        in that case.
        """
        ...

    def init(self, baudrate: int = 9600, bits: int = 8, parity: int|None = None, stop: int = 1, **kwargs) -> Any:
        ...

    def any(self) -> int:
        """
        Returns the number of bytes waiting (may be 0).
        """
        ...

    def read(self, nbytes: int|None=None) -> bytes|None:
        """
        Read characters.  If ``nbytes`` is specified then read at most that many bytes.
        If ``nbytes`` are available in the buffer, returns immediately, otherwise returns
        when sufficient characters arrive or the timeout elapses.

        If ``nbytes`` is not given then the method reads as much data as possible.  It
        returns after the timeout has elapsed.

        *Note:* for 9 bit characters each character takes two bytes, ``nbytes`` must
        be even, and the number of characters is ``nbytes/2``.

        Return value: a bytes object containing the bytes read in.  Returns ``None``
        on timeout.
        """
        ...

    def readinto(self, buf: bytes, nbytes: int|None=None, /) -> int|None:
        """
        Read bytes into the ``buf``.  If ``nbytes`` is specified then read at most
        that many bytes.  Otherwise, read at most ``len(buf)`` bytes.

        Return value: number of bytes read and stored into ``buf`` or ``None`` on
        timeout.
        """
        ...

    def readline(self) -> str|None:
        """
        Read a line, ending in a newline character. If such a line exists, return is
        immediate. If the timeout elapses, all available data is returned regardless
        of whether a newline exists.

        Return value: the line read or ``None`` on timeout if no data is available.
        """
        ...

    def write(self, buf: bytes, /) -> int|None:
        """
        Write the buffer of bytes to the bus.  If characters are 7 or 8 bits wide
        then each byte is one character.  If characters are 9 bits wide then two
        bytes are used for each character (little endian), and ``buf`` must contain
        an even number of bytes.

        Return value: number of bytes written. If a timeout occurs and no bytes
        were written returns ``None``.
        """
        ...

    def sendbreak(self) -> None:
        """
        Send a break condition on the bus.  This drives the bus low for a duration
        of 13 bits.
        Return value: ``None``.
        """
        ...

    def flush(self) -> Any:
        """
        Waits until all data has been sent. In case of a 
        timeout, an exception is raised. The timeout duration 
        depends on the tx buffer size and the baud rate. 
        Unless flow control is enabled, a timeout should 
        not occur.

        Note:
        For the `rp2`, `esp8266` and `nrf` ports the call returns 
        while the last byte is sent. If required, a one character 
        wait time has to be added in the calling script.
        """
        ...

    def txdone(self) -> bool:
        """
        Tells whether all data has been sent or no data transfer 
        is happening. In this case, it returns `True`. If a data 
        transmission is ongoing it returns False.

        Note:
        For the `rp2`, `esp8266` and `nrf` ports the call may 
        return `True` even if the last byte of a transfer is still 
        being sent. If required, a one character wait time has to be 
        added in the calling script.
        """
        ...


class WDT:
    """
    The WDT is used to restart the system when the application crashes and ends
    up into a non recoverable state. Once started it cannot be stopped or
    reconfigured in any way. After enabling, the application must "feed" the
    watchdog periodically to prevent it from expiring and resetting the system.

    Example usage::

        from machine import WDT
        wdt = WDT(timeout=2000)  # enable it with a timeout of 2s
        wdt.feed()

    Availability of this class: pyboard, WiPy, esp8266, esp32, rp2.
    """

    def __init__(self, *, id: int = 0, timeout: int = 5000):
        """
        Create a WDT object and start it. The timeout must be given in milliseconds.
        Once it is running the timeout cannot be changed and the WDT cannot be stopped either.
        """
        ...

    def feed(self) -> None:
        """
        Feed the WDT to prevent it from resetting the system. The application
        should place this call in a sensible place ensuring that the WDT is
        only fed after verifying that everything is functioning correctly.
        """
        ...


WDT_RESET = 3


def bootloader() -> NoReturn:
    """
    Activate the bootloader.
    """
    ...


def deepsleep(time_ms: int|None = None) -> None:
    """
    Stops execution in an attempt to enter a low power state.

    If *time_ms* is specified then this will be the maximum time in milliseconds that
    the sleep will last for.  Otherwise the sleep can last indefinitely.

    With or without a timeout, execution may resume at any time if there are events
    that require processing.  Such events, or wake sources, should be configured before
    sleeping, like ``Pin`` change or ``RTC`` timeout.

    The precise behaviour and power-saving capabilities of deepsleep are
    highly dependent on the underlying hardware, but the general properties are:

    * A deepsleep may not retain RAM or any other state of the system (for example
    peripherals or network interfaces).  Upon wake execution is resumed from the main
    script, similar to a hard or power-on reset. The `reset_cause()` function will
    return `machine.DEEPSLEEP` and this can be used to distinguish a deepsleep wake
    from other resets.
    """
    ...


def lightleep(time_ms: int|None = None) -> None:
    """
    Stops execution in an attempt to enter a low power state.

    If *time_ms* is specified then this will be the maximum time in milliseconds that
    the sleep will last for.  Otherwise the sleep can last indefinitely.

    With or without a timeout, execution may resume at any time if there are events
    that require processing.  Such events, or wake sources, should be configured before
    sleeping, like ``Pin`` change or ``RTC`` timeout.

    The precise behaviour and power-saving capabilities of lightsleep are
    highly dependent on the underlying hardware, but the general properties are:

    * A lightsleep has full RAM and state retention.  Upon wake execution is resumed
    from the point where the sleep was requested, with all subsystems operational.
    """
    ...


def freq():
    """
    Returns CPU frequency in hertz.
    """
    ...


def disable_irq() -> int:
    """
    Disable interrupt requests.
    Returns the previous IRQ state which should be considered an opaque value.
    This return value should be passed to the ``enable_irq()`` function to restore
    interrupts to their original state, before ``disable_irq()`` was called.
    """
    ...


def enable_irq(state: int):
    """
    Re-enable interrupt requests.
    The *state* parameter should be the value that was returned from the most
    recent call to the ``disable_irq()`` function.
    """
    ...


def idle():
    """
    Gates the clock to the CPU, useful to reduce power consumption at any time during
    short or long periods. Peripherals continue working and execution resumes as soon
    as any interrupt is triggered (on many ports this includes system timer
    interrupt occurring at regular intervals on the order of millisecond).
    """
    ...


mem16 = None
mem32 = None
mem8 = None


def reset():
    """
    Resets the device in a manner similar to pushing the external RESET
    button.
    """
    ...


def reset_cause():
    """
    Get the reset cause.
    """
    ...


def soft_reset():
    """
    Performs a soft reset of the interpreter, deleting all Python objects and
    resetting the Python heap.  It tries to retain the method by which the user
    is connected to the MicroPython REPL (eg serial, USB, Wifi).
    """
    ...


def time_pulse_us(pin: Pin, pulse_level: int, timeout_us: int = 1000000, /) -> int:
    """
    Time a pulse on the given *pin*, and return the duration of the pulse in
    microseconds.  The *pulse_level* argument should be 0 to time a low pulse
    or 1 to time a high pulse.

    If the current input value of the pin is different to *pulse_level*,
    the function first (*) waits until the pin input becomes equal to *pulse_level*,
    then (**) times the duration that the pin is equal to *pulse_level*.
    If the pin is already equal to *pulse_level* then timing starts straight away.

    The function will return -2 if there was timeout waiting for condition marked
    (*) above, and -1 if there was timeout during the main measurement, marked (**)
    above. The timeout is the same for both cases and given by *timeout_us* (which
    is in microseconds).
    """
    ...


def unique_id() -> str:
    """
    Returns a byte string with a unique identifier of a board/SoC. It will vary
    from a board/SoC instance to another, if underlying hardware allows. Length
    varies by hardware (so use substring of a full value if you expect a short
    ID). In some MicroPython ports, ID corresponds to the network MAC address.
    """
    ...


###############
# NOTE: added #


def dht_readinto(*args, **kwargs) -> Any:
    """
    Reads the temperature and humidity from the DHT sensor.

    (this function is also the redirection target of dth.dth_readinto() on the rp2040)
    """
    ...
