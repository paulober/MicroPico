"""

functions related to the hardware

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



__author__ = "Howard C Lovatt"
__copyright__ = "Howard C Lovatt, 2020 onwards."
__license__ = "MIT https://opensource.org/licenses/MIT (as used by MicroPython)."
__version__ = "0.6.0"  # Version set by https://github.com/hlovatt/tag2ver



from abc import abstractmethod
from typing import overload, Union, Tuple, Optional, NoReturn, List, Callable
from typing import Sequence, ClassVar, Any

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

   def __init__(self, pin: Union[int, Pin], /):
      """
      Access the ADC associated with a source identified by *id*.  This
      *id* may be an integer (usually specifying a channel number), a
      :ref:`Pin <machine.Pin>` object, or other value supported by the
      underlying machine.
      """

   def read_u16(self) -> int:
      """
      Take an analog reading and return an integer in the range 0-65535.
      The return value represents the raw reading taken by the ADC, scaled
      such that the minimum value is 0 and the maximum value is 65535.
      """

class Pin:
    """
    A pin is the basic object to control I/O pins.  It has methods to set
    the mode of the pin (input, output, etc) and methods to get and set the
    digital logic level. For analog control of a pin, see the ADC class.
    """

    ALT = 3
    IN = 0
    IRQ_FALLING = 4
    IRQ_RISING = 8
    OPEN_DRAIN = 2
    OUT = 1
    PULL_DOWN = 2
    PULL_UP = 1

    def __init__(self, id: Union[int, str], /, mode: int = IN, pull: int = PULL_UP, af: Union[str, int] = -1):
         """
         Create a new Pin object associated with the id.  If additional arguments are given,
         they are used to initialise the pin.  See :meth:`pin.init`.
         """

    def high(self):
        """
        Sets the pin to high.
        """

    def init(self):
        """
        Initialises the pin.
        """

    def irq(self, lambdaFunction, direction: int):
        """
        Sets an interrupt for when the pin is rising or falling.

            - ``lambdaFunction`` the code to execute when the interrupt happens.
            - ``direction`` either ``IRQ_RISING`` or ``IRQ_FALLING``
        """

    def low(self):
        """
        Sets the pin to low.
        """

    def off(self):
       """
       Sets the pin to be off.
       """

    def on(self):
       """
       Sets the pin to be on.
       """

    def toggle(self):
        """
        Sets the pin to high if it's currently low, and vice versa.
        """

    @overload
    def value(self) -> int:
        """
        Get or set the digital logic level of the pin:
    
            - With no argument, return 0 or 1 depending on the logic level of the pin.
            - With ``value`` given, set the logic level of the pin.  ``value`` can be
            anything that converts to a boolean.  If it converts to ``True``, the pin
            is set high, otherwise it is set low.
        """

    @overload
    def value(self, value: Any, /) -> None:
        """
        Get or set the digital logic level of the pin:
    
            - With no argument, return 0 or 1 depending on the logic level of the pin.
            - With ``value`` given, set the logic level of the pin.  ``value`` can be
            anything that converts to a boolean.  If it converts to ``True``, the pin
            is set high, otherwise it is set low.
        """

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
      sck: Optional[Pin] = None, 
      mosi: Optional[Pin] = None, 
      miso: Optional[Pin] = None, 
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
      pins: Optional[Tuple[Pin, Pin, Pin]] = None, 
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

   @overload
   def init(
      self, 
      baudrate: int = 1_000_000, 
      *,
      polarity: int = 0, 
      phase: int = 0, 
      bits: int = 8, 
      firstbit: int = MSB, 
      sck: Optional[Pin] = None, 
      mosi: Optional[Pin] = None, 
      miso: Optional[Pin] = None, 
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

   @overload
   def init(
      self, 
      baudrate: int = 1_000_000, 
      *,
      polarity: int = 0, 
      phase: int = 0, 
      bits: int = 8, 
      firstbit: int = MSB, 
      pins: Optional[Tuple[Pin, Pin, Pin]] = None, 
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

   def deinit(self) -> None:
      """
      Turn off the SPI bus.
      """

   def read(self, nbytes: int, write: int = 0x00, /) -> bytes:
      """
       Read a number of bytes specified by ``nbytes`` while continuously writing
       the single byte given by ``write``.
       Returns a ``bytes`` object with the data that was read.
      """

   def readinto(self, buf: bytes, write: int = 0x00, /) -> Optional[int]:
      """
       Read into the buffer specified by ``buf`` while continuously writing the
       single byte given by ``write``.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes read.
      """

   def write(self, buf: bytes, /) -> Optional[int]:
      """
       Write the bytes contained in ``buf``.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes written.
      """

   def write_readinto(self, write_buf: bytes, read_buf: bytes, /) -> Optional[int]:
      """
       Write the bytes from ``write_buf`` while reading into ``read_buf``.  The
       buffers can be the same or different, but both buffers must have the
       same length.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes written.
      """

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
      sck: Optional[Pin] = None, 
      mosi: Optional[Pin] = None, 
      miso: Optional[Pin] = None, 
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
      pins: Optional[Tuple[Pin, Pin, Pin]] = None, 
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

   @overload
   def init(
      self, 
      baudrate: int = 1_000_000, 
      *,
      polarity: int = 0, 
      phase: int = 0, 
      bits: int = 8, 
      firstbit: int = MSB, 
      sck: Optional[Pin] = None, 
      mosi: Optional[Pin] = None, 
      miso: Optional[Pin] = None, 
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

   @overload
   def init(
      self, 
      baudrate: int = 1_000_000, 
      *,
      polarity: int = 0, 
      phase: int = 0, 
      bits: int = 8, 
      firstbit: int = MSB, 
      pins: Optional[Tuple[Pin, Pin, Pin]] = None, 
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

   def deinit(self) -> None:
      """
      Turn off the SPI bus.
      """

   def read(self, nbytes: int, write: int = 0x00, /) -> bytes:
      """
       Read a number of bytes specified by ``nbytes`` while continuously writing
       the single byte given by ``write``.
       Returns a ``bytes`` object with the data that was read.
      """

   def readinto(self, buf: bytes, write: int = 0x00, /) -> Optional[int]:
      """
       Read into the buffer specified by ``buf`` while continuously writing the
       single byte given by ``write``.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes read.
      """

   def write(self, buf: bytes, /) -> Optional[int]:
      """
       Write the bytes contained in ``buf``.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes written.
      """

   def write_readinto(self, write_buf: bytes, read_buf: bytes, /) -> Optional[int]:
      """
       Write the bytes from ``write_buf`` while reading into ``read_buf``.  The
       buffers can be the same or different, but both buffers must have the
       same length.
       Returns ``None``.
   
       Note: on WiPy this function returns the number of bytes written.
      """

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
   
       i2c = I2C(freq=400000)          # create I2C peripheral at frequency of 400kHz
                                       # depending on the port, extra parameters may be required
                                       # to select the peripheral and/or pins to use
   
       i2c.scan()                      # scan for slaves, returning a list of 7-bit addresses
   
       i2c.writeto(42, b'123')         # write 3 bytes to slave with 7-bit address 42
       i2c.readfrom(42, 4)             # read 4 bytes from slave with 7-bit address 42
   
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

   @overload
   def init(self, *, freq: int = 400_000) -> None:
      """
     Initialise the I2C bus with the given arguments:
   
        - *scl* is a pin object for the SCL line
        - *sda* is a pin object for the SDA line
        - *freq* is the SCL clock rate
      """

   @overload
   def init(self, *, scl: Pin, sda: Pin, freq: int = 400_000) -> None:
      """
     Initialise the I2C bus with the given arguments:
   
        - *scl* is a pin object for the SCL line
        - *sda* is a pin object for the SDA line
        - *freq* is the SCL clock rate
      """

   def scan(self) -> List[int]:
      """
      Scan all I2C addresses between 0x08 and 0x77 inclusive and return a list of
      those that respond.  A device responds if it pulls the SDA line low after
      its address (including a write bit) is sent on the bus.
      """

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

class PWM:
    """
    Pulse width modulation (PWM), allows you to give analogue behaviours to digital 
    devices, such as LEDs. This means that rather than an LED being simply on or 
    off, you can control its brightness.

    Example usage::

        from machine import Pin, PWM
        from time import sleep

        pwm = PWM(Pin(15))

        pwm.freq(1000)

        while True:
            for duty in range(65025):
                pwm.duty_u16(duty)
                sleep(0.0001)
            for duty in range(65025, 0, -1):
                pwm.duty_u16(duty)
                sleep(0.0001)
    """

    def __init__(self, pin: Pin):
      """
      Construct and return a new PWM object using the following parameters:

         - *pin* should be the pin to use.
      """

    def deinit(self) -> None:
        """
        Turn off the PWM.
        """

    def duty_ns(self, duration: int):
        """
        The duty cycle is how long it should be on each time. 
        This is specified in nanoseconds.
    
            - *duration* is how long it should be on (nanoseconds)
        """

    def duty_u16(self, duration: int):
        """
        The duty cycle is how long it should be on each time. 
        For Raspberry Pi Pico in MicroPython, this can range from 0 to 65025. 
        65025 would be 100% of the time, so an LED would stay bright. A 
        value of around 32512 would indicate that it should be on for half 
        the time.
    
            - *duration* is how long it should be on (ms)
        """

    def freq(self, frequency: int):
        """
        ``freq`` tells Raspberry Pi Pico how 
        often to switch the power between on and off.
    
            - *freq* is the clock rate
        """

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
   
       i2c = I2C(freq=400000)          # create I2C peripheral at frequency of 400kHz
                                       # depending on the port, extra parameters may be required
                                       # to select the peripheral and/or pins to use
   
       i2c.scan()                      # scan for slaves, returning a list of 7-bit addresses
   
       i2c.writeto(42, b'123')         # write 3 bytes to slave with 7-bit address 42
       i2c.readfrom(42, 4)             # read 4 bytes from slave with 7-bit address 42
   
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

   @overload
   def init(self, *, freq: int = 400_000) -> None:
      """
     Initialise the I2C bus with the given arguments:
   
        - *scl* is a pin object for the SCL line
        - *sda* is a pin object for the SDA line
        - *freq* is the SCL clock rate
      """

   @overload
   def init(self, *, scl: Pin, sda: Pin, freq: int = 400_000) -> None:
      """
     Initialise the I2C bus with the given arguments:
   
        - *scl* is a pin object for the SCL line
        - *sda* is a pin object for the SDA line
        - *freq* is the SCL clock rate
      """

   def scan(self) -> List[int]:
      """
      Scan all I2C addresses between 0x08 and 0x77 inclusive and return a list of
      those that respond.  A device responds if it pulls the SDA line low after
      its address (including a write bit) is sent on the bus.
      """

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

   @overload
   def __init__(
      self,
      /
   ):
      """
      Construct a new timer object of the given id. Id of -1 constructs a
      virtual timer (if supported by a board).
      
      See ``init`` for parameters of initialisation.
      """

   @overload
   def __init__(
      self, 
      id: int, 
      /
   ):
      """
      Construct a new timer object of the given id. Id of -1 constructs a
      virtual timer (if supported by a board).
      
      See ``init`` for parameters of initialisation.
      """

   @overload
   def __init__(
      self, 
      id: int, 
      /, 
      *, 
      mode: int = PERIODIC, 
      period: int = -1, 
      callback: Optional[Callable[["Timer"], None]] = None, 
   ):
      """
      Construct a new timer object of the given id. Id of -1 constructs a
      virtual timer (if supported by a board).
      
      See ``init`` for parameters of initialisation.
      """

   def init(
      self, 
      *, 
      freq: float = None,
      mode: int = PERIODIC, 
      period: int = -1, 
      callback: Optional[Callable[["Timer"], None]] = None, 
   ) -> None:
      """
      Initialise the timer. Example::
   
          tim.init(period=100)                         # periodic with 100ms period
          tim.init(mode=Timer.ONE_SHOT, period=1000)   # one shot firing after 1000ms
   
      Keyword arguments:
   
        - ``mode`` can be one of:
   
          - ``Timer.ONE_SHOT`` - The timer runs once until the configured
            period of the channel expires.
          - ``Timer.PERIODIC`` - The timer runs periodically at the configured
            frequency of the channel.
      """

   def deinit(self) -> None:
      """
      Deinitialises the timer. Stops the timer, and disables the timer peripheral.
      """

class UART:
   """
   UART implements the standard UART/USART duplex serial communications protocol.  At
   the physical level it consists of 2 lines: RX and TX.  The unit of communication
   is a character (not to be confused with a string character) which can be 8 or 9
   bits wide.
   """

   def __init__(self, id: int, baudrate: int=9600, bits: int=8, parity: int=None, stop: int=1, tx: Pin=None, rx: Pin=None):
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

   def any(self) -> int:
      """
      Returns the number of bytes waiting (may be 0).
      """

   @overload
   def read(self) -> Optional[bytes]:
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

   @overload
   def read(self, nbytes: int, /) -> Optional[bytes]:
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

   @overload
   def readinto(self, buf: bytes, /) -> Optional[int]:
      """
      Read bytes into the ``buf``.  If ``nbytes`` is specified then read at most
      that many bytes.  Otherwise, read at most ``len(buf)`` bytes.
   
      Return value: number of bytes read and stored into ``buf`` or ``None`` on
      timeout.
      """

   @overload
   def readinto(self, buf: bytes, nbytes: int, /) -> Optional[int]:
      """
      Read bytes into the ``buf``.  If ``nbytes`` is specified then read at most
      that many bytes.  Otherwise, read at most ``len(buf)`` bytes.
   
      Return value: number of bytes read and stored into ``buf`` or ``None`` on
      timeout.
      """

   def readline(self) -> Optional[str]:
      """
      Read a line, ending in a newline character. If such a line exists, return is
      immediate. If the timeout elapses, all available data is returned regardless
      of whether a newline exists.
   
      Return value: the line read or ``None`` on timeout if no data is available.
      """

   def write(self, buf: bytes, /) -> Optional[int]:
      """
      Write the buffer of bytes to the bus.  If characters are 7 or 8 bits wide
      then each byte is one character.  If characters are 9 bits wide then two
      bytes are used for each character (little endian), and ``buf`` must contain
      an even number of bytes.
   
      Return value: number of bytes written. If a timeout occurs and no bytes
      were written returns ``None``.
      """

   def sendbreak(self) -> None:
      """
      Send a break condition on the bus.  This drives the bus low for a duration
      of 13 bits.
      Return value: ``None``.
      """

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

   def feed(self) -> None:
      """
      Feed the WDT to prevent it from resetting the system. The application
      should place this call in a sensible place ensuring that the WDT is
      only fed after verifying that everything is functioning correctly.
      """

WDT_RESET = 3

def bootloader() -> NoReturn:
   """
   Activate the bootloader.
   """

def deepsleep(time_ms: int = None) -> None:
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

def lightleep(time_ms: int = None) -> None:
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

def freq():
   """
   Returns CPU frequency in hertz.
   """

def disable_irq() -> int:
   """
   Disable interrupt requests.
   Returns the previous IRQ state which should be considered an opaque value.
   This return value should be passed to the ``enable_irq()`` function to restore
   interrupts to their original state, before ``disable_irq()`` was called.
   """

def enable_irq(state:int):
   """
   Re-enable interrupt requests.
   The *state* parameter should be the value that was returned from the most
   recent call to the ``disable_irq()`` function.
   """

def idle():
   """
   Gates the clock to the CPU, useful to reduce power consumption at any time during
   short or long periods. Peripherals continue working and execution resumes as soon
   as any interrupt is triggered (on many ports this includes system timer
   interrupt occurring at regular intervals on the order of millisecond).
   """

mem16 = None
mem32 = None
mem8 = None

def reset():
   """
   Resets the device in a manner similar to pushing the external RESET
   button.
   """

def reset_cause():
   """
   Get the reset cause.
   """

def soft_reset():
   """
   Performs a soft reset of the interpreter, deleting all Python objects and
   resetting the Python heap.  It tries to retain the method by which the user
   is connected to the MicroPython REPL (eg serial, USB, Wifi).
   """

def time_pulse_us(pin:Pin, pulse_level:int, timeout_us:int=1000000, /) -> int:
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

def unique_id() -> str:
   """
   Returns a byte string with a unique identifier of a board/SoC. It will vary
   from a board/SoC instance to another, if underlying hardware allows. Length
   varies by hardware (so use substring of a full value if you expect a short
   ID). In some MicroPython ports, ID corresponds to the network MAC address.
   """