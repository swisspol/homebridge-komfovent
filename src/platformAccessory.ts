import type { PlatformAccessory, Service } from 'homebridge';

import type { ExampleHomebridgePlatform } from './platform.js';

export class ExamplePlatformAccessory {
  private supplyTemperature: Service;

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
      'Supply Temperature',
    );
    this.supplyTemperature
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleSupplyTemperatureGet.bind(this));
  }

  handleSupplyTemperatureGet() {
    this.platform.log.debug('Triggered GET CurrentTemperature');

    this.platform.log.info('Reading from', this.platform.config.ip_address);

    return 42; // TODO
  }
}
