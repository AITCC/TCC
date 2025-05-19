import * as dotenv from 'dotenv';

export class Config {
  static load(): Config {
    dotenv.config();
    return new Config();
  }

  requiredFromEnv(key: string): string {
    const val = this.fromEnv(key);

    if (val == undefined) {
      throw new Error(`Error: env variable "${key}" is required`);
    }

    return val;
  }

  fromEnv(key: string): string | undefined {
    return process.env[key];
  }
}