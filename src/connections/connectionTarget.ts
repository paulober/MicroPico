export default interface ConnectionTarget {
  type: string;
  connected: boolean;
  
  connect(
    onconnect: Function,
    onerror: Function,
    ontimeout: Function
  ): Promise<void>;
  disconnect(): Promise<void>;
  registerListener(cb: Function): void;
  send(msg: string, drain?: boolean): Promise<void>;
  // public static async isSerialPort(name: string): Promise<boolean>
  sendPing(): Promise<any>;
  flush(): Promise<any>;
}
