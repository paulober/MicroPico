export default interface ConnectionParams {
  port: number;
  username: string;
  password: string;
  enpassword: string;
  timeout: number;
  ctrlCOnConnect: string | boolean | string[] | undefined;
}
