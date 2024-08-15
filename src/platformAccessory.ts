import type { PlatformAccessory, Service } from 'homebridge';
import { Socket } from 'net';
import Modbus from 'jsmodbus';
import PromiseSocket from 'promise-socket';

import type { ExampleHomebridgePlatform } from './platform.js';

const MODBUS_PORT = 502;
const SUPPLY_TEMPERATURE_REGISTER = 2005; // x10
const EXTRACT_TEMPERATURE_REGISTER = 2006; // x10
// 0 = mode (OFF = 0, Comfort 1 = 1, etc...)
// 999-1008: alarms?
// 2002 = supply flow (m3/h)
// 2005 = extract flow (m3/h)
// 2020 = supply fan (% x 10)
// 2021 = exhaust fan (% x 10)
// 2211 = total supply fan (h)
// 2213 = total exhaust fan (h)
// 2220 = total recovered energy (kWh)

export class ExamplePlatformAccessory {
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

    this.supplyTemperature =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.supplyTemperature.setCharacteristic(
      this.platform.Characteristic.Name,
      'Supply',
    );
    this.supplyTemperature
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getSupplyTemperature.bind(this));

    this.extractTemperature =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.extractTemperature.setCharacteristic(
      this.platform.Characteristic.Name,
      'Extract',
    );
    this.extractTemperature
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.getExtractTemperature.bind(this));
  }

  async readRegister(register: number) {
    const socket = new Socket();
    const client = new Modbus.client.TCP(socket);
    const promiseSocket = new PromiseSocket(socket);

    let result = 0;
    try {
      await promiseSocket
        .setTimeout(3000)
        .connect(MODBUS_PORT, this.platform.config.ip_address);
      const resp = await client.readHoldingRegisters(register, 1);
      const values = resp.response.body.valuesAsArray;
      result = values[0];
    } catch (error) {
      if (error instanceof Error) {
        this.platform.log.error(error.name, error.message);
      } else if (typeof error === 'string') {
        this.platform.log.error(error);
      } else {
        this.platform.log.error('Unknown exception', typeof error);
      }
    } finally {
      await promiseSocket.end();
    }

    return result;
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
}
