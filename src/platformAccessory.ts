import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';
import { Socket } from 'net';
import Modbus from 'jsmodbus';
import PromiseSocket from 'promise-socket';

import type { ExampleHomebridgePlatform } from './platform.js';

const MODBUS_PORT = 502;
const MODE_REGISTER = 0;
const MODE_OFF = 0;
const MODE_COMFORT_1 = 1;
const SUPPLY_TEMPERATURE_REGISTER = 2005; // x10
const EXTRACT_TEMPERATURE_REGISTER = 2006; // x10
// 999-1008: alarms?
// 2002 = supply flow (m3/h)
// 2005 = extract flow (m3/h)
// 2020 = supply fan (% x 10)
// 2021 = exhaust fan (% x 10)
// 2211 = total supply fan (h)
// 2213 = total exhaust fan (h)
// 2220 = total recovered energy (kWh)

export class ExamplePlatformAccessory {
  private fan: Service;
  private supplyTemperature: Service;
  private extractTemperature: Service;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Komfovent')
      .setCharacteristic(this.platform.Characteristic.Model, 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'N/A');

    this.fan =
      this.accessory.getService('Fan') ||
      this.accessory.addService(this.platform.Service.Fan, 'Fan', 'fan');
    this.fan
      .getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.getFan.bind(this))
      .onSet(this.setFan.bind(this));

    this.supplyTemperature =
      this.accessory.getService('Supply') ||
      this.accessory.addService(
        this.platform.Service.TemperatureSensor,
        'Supply',
        'supply',
      );
    this.supplyTemperature
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getSupplyTemperature.bind(this));

    this.extractTemperature =
      this.accessory.getService('Extract') ||
      this.accessory.addService(
        this.platform.Service.TemperatureSensor,
        'Extract',
        'extract',
      );
    this.extractTemperature
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getExtractTemperature.bind(this));
  }

  logRegisterError(message: string, register: number, error: unknown) {
    if (error instanceof Error) {
      this.platform.log.error(message, register, error.name, error.message);
    } else if (typeof error === 'string') {
      this.platform.log.error(message, register, error);
    } else {
      this.platform.log.error(message, register, typeof error);
    }
  }

  async readRegister(register: number): Promise<number> {
    const socket = new Socket();
    const client = new Modbus.client.TCP(socket);
    const promiseSocket = new PromiseSocket(socket);

    let result = 0;
    try {
      await promiseSocket
        .setTimeout(5000)
        .connect(MODBUS_PORT, this.platform.config.ip_address);
      const resp = await client.readHoldingRegisters(register, 1);
      const values = resp.response.body.valuesAsArray;
      result = values[0];
    } catch (error) {
      this.logRegisterError('Failed reading register', register, error);
    } finally {
      await promiseSocket.end();
    }

    return result;
  }

  async writeRegister(register: number, value: number): Promise<void> {
    const socket = new Socket();
    const client = new Modbus.client.TCP(socket);
    const promiseSocket = new PromiseSocket(socket);

    try {
      await promiseSocket
        .setTimeout(3000)
        .connect(MODBUS_PORT, this.platform.config.ip_address);
      await client.writeSingleRegister(register, value);
    } catch (error) {
      this.logRegisterError('Failed writing register', register, error);
    } finally {
      await promiseSocket.end();
    }
  }

  async getSupplyTemperature(): Promise<number> {
    this.platform.log.debug('Triggered getSupplyTemperature');
    const value = await this.readRegister(SUPPLY_TEMPERATURE_REGISTER);
    return value / 10;
  }

  async getExtractTemperature(): Promise<number> {
    this.platform.log.debug('Triggered getExtractTemperature');
    const value = await this.readRegister(EXTRACT_TEMPERATURE_REGISTER);
    return value / 10;
  }

  async getFan(): Promise<boolean> {
    this.platform.log.debug('Triggered getFan');
    const value = await this.readRegister(MODE_REGISTER);
    return value !== MODE_OFF;
  }

  async setFan(value: CharacteristicValue): Promise<void> {
    const on = value as boolean;
    this.platform.log.debug('Triggered setFan');
    this.writeRegister(MODE_REGISTER, on ? MODE_COMFORT_1 : MODE_OFF);
  }
}
