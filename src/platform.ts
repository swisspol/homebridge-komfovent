import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { ExamplePlatformAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

export class ExampleHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.api.on('didFinishLaunching', () => {
      this.addAccessory();
    });
  }

  // This function is invoked when homebridge restores cached accessories from disk at startup.
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  addAccessory() {
    const uniqueID = 'komfovent';
    const displayName = 'Komfovent';

    const uuid = this.api.hap.uuid.generate(uniqueID);
    const existingAccessory = this.accessories.find(
      (accessory) => accessory.UUID === uuid,
    );
    if (existingAccessory) {
      this.log.info(
        'Restoring existing accessory from cache:',
        existingAccessory.displayName,
      );
      new ExamplePlatformAccessory(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory:', displayName);
      const accessory = new this.api.platformAccessory(displayName, uuid);
      new ExamplePlatformAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }
  }
}
