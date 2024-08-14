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

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache, so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const uniqueID = 'test'; // TODO
    const displayName = 'TEST'; // TODO
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
      // accessory.context.device = null; // TODO
      new ExamplePlatformAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        accessory,
      ]);
    }
  }
}
