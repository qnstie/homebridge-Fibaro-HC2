//    Copyright 2017 ilcato
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

// Fibaro Home Center 2 Platform plugin for HomeBridge

'use strict'

export const pluginName = 'homebridge-fibaro-hc2'
export const platformName = 'FibaroHC2'

export class ShadowService {
	controlService: any;
	characteristics: any[];
	
	constructor(controlService, characteristics: any[]) {
		this.controlService = controlService;
		this.characteristics = characteristics;
	}
}

export class ShadowAccessory {

	name: string;
	roomID: string;
	services: ShadowService[];
	accessory: any;
	hapAccessory: any;
	hapService: any;
	hapCharacteristic: any;
	platform: any;
	isSecuritySystem: boolean;
	
	constructor(device: any, services: ShadowService[], hapAccessory: any, hapService: any, hapCharacteristic: any, platform) {
		this.name = device.name;
		this.roomID = device.roomID;
		this.services = services;
		this.accessory = null,
		this.hapAccessory = hapAccessory;
		this.hapService = hapService;
		this.hapCharacteristic = hapCharacteristic;
		this.platform = platform;
		this.isSecuritySystem = false;
		for (let i=0; i < services.length; i++ ) {
			if (services[i].controlService.subtype == undefined)
				services[i].controlService.subtype = device.id + "--"			// "DEVICE_ID-VIRTUAL_BUTTON_ID-RGB_MARKER
		}
	}

	identify(callback) {
    	callback()
  	}
  	
  	static createShadowAccessory(device, hapAccessory, hapService, hapCharacteristic, platform) {
  		let r = HC2HKMapping.get(device.type);
  		return r ? new r(device, hapAccessory, hapService, hapCharacteristic, platform) : undefined;
  	}
  	
  	initAccessory() {
		this.accessory.getService(this.hapService.AccessoryInformation)
						.setCharacteristic(this.hapCharacteristic.Manufacturer, "IlCato")
						.setCharacteristic(this.hapCharacteristic.Model, "HomeCenterBridgedAccessory")
						.setCharacteristic(this.hapCharacteristic.SerialNumber, "<unknown>");
  	}

  	removeNoMoreExistingServices() {
		for (let t = 0; t < this.accessory.services.length; t++) {
			let found = false;
			for (let s = 0; s < this.services.length; s++) {
				// TODO: check why test for undefined
				if (this.accessory.services[t].displayName == undefined || this.services[s].controlService.displayName == this.accessory.services[t].displayName) {
					found = true;
					break;	  		
				}
			}
			if (!found) {
				this.accessory.removeService(this.accessory	.services[t]);
			}
		}    
  	}

	addNewServices(platform) {
		for (let s = 0; s < this.services.length; s++) {
			let service = this.services[s];
			let serviceExists = this.accessory.getService(service.controlService.displayName);
			if (!serviceExists) {
				this.accessory.addService(service.controlService);
				for (let i = 0; i < service.characteristics.length; i++) {
					let characteristic = service.controlService.getCharacteristic(service.characteristics[i]);
					characteristic.props.needsBinding = true;
					if (characteristic.UUID == (new this.hapCharacteristic.CurrentAmbientLightLevel()).UUID) {
						characteristic.props.maxValue = 10000;
						characteristic.props.minStep = 1;
						characteristic.props.minValue = 0;
					}
					if (characteristic.UUID == (new this.hapCharacteristic.CurrentTemperature()).UUID) {
						characteristic.props.minValue = -50;
					}
					platform.bindCharacteristicEvents(characteristic, service.controlService);
				}
			}
		}
	}
	
	resgisterUpdateccessory(isNewAccessory, api) {
		this.accessory.reachable = true;
		if (isNewAccessory)
			api.registerPlatformAccessories(pluginName, platformName, [this.accessory]);
		else
			api.updatePlatformAccessories([this.accessory]);
		this.accessory.reviewed = true; // Mark accessory as reviewed in order to remove the not reviewed ones
	}
	
  	setAccessory(accessory) {
		this.accessory = accessory;
  	}

}

export class ShadowLightbulb extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.Lightbulb(device.name), [hapCharacteristic.On, hapCharacteristic.Brightness]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowSwitch extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let controlService;
		switch (device.properties.deviceControlType) {
			case "2": // Lighting
			case "5": // Bedside Lamp
			case "7": // Wall Lamp
				controlService = new hapService.Lightbulb(device.name);
				break;
			default:
				controlService = new hapService.Switch(device.name)
				break;
		}
		let service = new ShadowService(controlService, [hapCharacteristic.On]);
  		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform); 
  	}
}

export class ShadowWindowCovering extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.WindowCovering(device.name), [hapCharacteristic.CurrentPosition, hapCharacteristic.TargetPosition, hapCharacteristic.PositionState]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowMotionSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.MotionSensor(device.name), [hapCharacteristic.MotionDetected]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowTemperatureSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.TemperatureSensor(device.name), [hapCharacteristic.CurrentTemperature]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowHumiditySensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.HumiditySensor(device.name), [hapCharacteristic.CurrentRelativeHumidity]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowDoorWindowSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.ContactSensor(device.name), [hapCharacteristic.ContactSensorState]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowFloodSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.LeakSensor(device.name), [hapCharacteristic.LeakDetected]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowSmokeSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.SmokeSensor(device.name), [hapCharacteristic.SmokeDetected]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowLightSensor extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.LightSensor(device.name), [hapCharacteristic.CurrentAmbientLightLevel]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowOutlet extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.Outlet(device.name), [hapCharacteristic.On, hapCharacteristic.OutletInUse]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowLockMechanism extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.LockMechanism(device.name), [hapCharacteristic.LockCurrentState, hapCharacteristic.LockTargetState]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowSetPoint extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.Thermostat(device.name), [hapCharacteristic.CurrentTemperature, hapCharacteristic.TargetTemperature, hapCharacteristic.CurrentHeatingCoolingState, hapCharacteristic.TargetHeatingCoolingState, hapCharacteristic.TemperatureDisplayUnits]);
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowVirtualDevice extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let pushButtonServices = new Array();
		let pushButtonService: ShadowService;
		for (let r = 0; r < device.properties.rows.length; r++) {
			if (device.properties.rows[r].type == "button") {
				for (let e = 0; e < device.properties.rows[r].elements.length; e++) {
					pushButtonService = new ShadowService(new hapService.Switch(device.properties.rows[r].elements[e].caption),	[hapCharacteristic.On]);
					pushButtonService.controlService.subtype = device.id + "-" + device.properties.rows[r].elements[e].id; // For Virtual devices it is device_id + "-" + button_id
					pushButtonServices.push(pushButtonService);
				}
			} 
		}
   		super(device, pushButtonServices, hapAccessory, hapService, hapCharacteristic, platform);
  	}
}
export class ShadowColorBulb extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = {controlService: new hapService.Lightbulb(device.name), characteristics: [hapCharacteristic.On, hapCharacteristic.Brightness, hapCharacteristic.Hue, hapCharacteristic.Saturation]};
		service.controlService.HSBValue = {hue: 0, saturation: 0, brightness: 100};
		service.controlService.RGBValue = {red: 0, green: 0, blue: 0};
		service.controlService.countColorCharacteristics = 0;
		service.controlService.timeoutIdColorCharacteristics = 0;
		service.controlService.subtype = device.id + "--RGB"; 								// for RGB color add a subtype parameter; it will go into 3rd position: "DEVICE_ID-VIRTUAL_BUTTON_ID-RGB_MARKER
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
  	}
}

export class ShadowSecuritySystem extends ShadowAccessory {

  	constructor (device, hapAccessory, hapService, hapCharacteristic, platform) {
		let service = new ShadowService(new hapService.SecuritySystem("FibaroSecuritySystem"), [hapCharacteristic.SecuritySystemCurrentState, hapCharacteristic.SecuritySystemTargetState]);
		service.controlService.subtype = "0--";
   		super(device, [service], hapAccessory, hapService, hapCharacteristic, platform);
   		this.isSecuritySystem = true;
  	}
}

var HC2HKMapping = new Map([
		["com.fibaro.multilevelSwitch", ShadowLightbulb],
		["com.fibaro.FGD212", ShadowLightbulb],
		["com.fibaro.binarySwitch", ShadowSwitch],
		["com.fibaro.developer.bxs.virtualBinarySwitch", ShadowSwitch],
		["com.fibaro.FGR221", ShadowWindowCovering],
		["com.fibaro.FGRM222", ShadowWindowCovering],
		["com.fibaro.rollerShutter", ShadowWindowCovering],
		["com.fibaro.FGMS001", ShadowMotionSensor],
		["com.fibaro.motionSensor", ShadowMotionSensor],
		["com.fibaro.temperatureSensor", ShadowTemperatureSensor],
		["com.fibaro.humiditySensor", ShadowHumiditySensor],
		["com.fibaro.doorSensor", ShadowDoorWindowSensor],
		["com.fibaro.windowSensor", ShadowDoorWindowSensor],
		["com.fibaro.FGFS101", ShadowFloodSensor],
		["com.fibaro.floodSensor", ShadowFloodSensor],
		["com.fibaro.FGSS001", ShadowSmokeSensor],
		["com.fibaro.lightSensor", ShadowLightSensor],
		["com.fibaro.FGWP101", ShadowOutlet],
		["com.fibaro.FGWP102", ShadowOutlet],
		["com.fibaro.doorLock", ShadowOutlet],
		["com.fibaro.gerda", ShadowLockMechanism],
		["com.fibaro.setPoint", ShadowSetPoint],
		["com.fibaro.thermostatDanfoss", ShadowSetPoint],
		["com.fibaro.com.fibaro.thermostatHorstmann", ShadowSetPoint],
		["virtual_device", ShadowVirtualDevice],
		["com.fibaro.FGRGBW441M", ShadowColorBulb],
		["com.fibaro.colorController", ShadowColorBulb]
]);