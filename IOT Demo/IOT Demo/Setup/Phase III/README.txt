The goal of "Phase III" is to demonstrate how this gateway can be used to collect real-time data from a real-world sensor, in addition to the phone-based example that it works with by default.

To use a USB-powered non-contact infrared thermometer with this gateway, perform the following steps:

1. Order and assemble the following temperature sensor and case:
https://www.phidgets.com/?prodid=34
https://www.phidgets.com/?tier=3&catid=57&pcid=50&prodid=490

2. On the gateway, download and install the following sensor drivers on the gateway:
https://www.phidgets.com/downloads/phidget22/libraries/windows/Phidget22-x64.exe

3. Plug in the temperature sensor from step 1 into a USB port onto your gateway.

4. On the gateway, run the script WritePhidgetDataDirectlyToPISystem.ps1 as an Administrator; this will create a scheduled task to start data collection when the gateway boots, and it will start data collection as well.  It will also create all of the necessary PI AF Elements and PI Points needed to visualize and store this live data.

5. Within the gateway web app, under the "Assets" view, you should now see a new asset called "Non-contact Infrared Thermometer"; you can click on it to see real-time temperature sensor data from the attached USB sensor.  Examine how the sensor data changes when you aim the sensor head at different objects--the casing of the gateway, for example, or a cold beverage!
