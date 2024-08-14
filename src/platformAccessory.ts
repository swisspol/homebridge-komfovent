import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";

import type { ExampleHomebridgePlatform } from "./platform.js";

export class ExamplePlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory
  ) {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Daikin")
      .setCharacteristic(this.platform.Characteristic.Model, "N/A")
      .setCharacteristic(this.platform.Characteristic.SerialNumber, "N/A");

    this.service =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      "Test" // TODO: accessory.context.device
    );
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));
  }

  handleCurrentTemperatureGet() {
    this.platform.log.debug("Triggered GET CurrentTemperature");

    return 42; // TODO
  }
}
