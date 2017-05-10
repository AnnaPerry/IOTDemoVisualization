# Prerequisite: download and install the Phidgets drivers:
# http://www.phidgets.com/downloads/libraries/Phidget-x64.exe

# Preparation: close ports and connections if they exist
if ($MyIOKitObject -ne $null) { $MyIOKitObject.Close() }

#------------------------------------------------------------------------------------------------

# Enter in names of the PI tags; PI tag 1 will receive sensor value 1, and tag 2 will get sensor value 2, etc.
$PITag1Name = "PhidgetInterfaceKit.Sensor0"
$PITag2Name = "PhidgetInterfaceKit.Sensor1"

#Define the wait duration in between reads from the sensor
$MyWaitDuration_Milliseconds = 1000

# Specify the name of the target PI System; by default, it can be left at 'localhost'
$MyPIDAServerName = "localhost"

#------------------------------------------------------------------------------------------------

# Connect to the target PI System
$MyPIDAServerConnection = Connect-PIDataArchive -PIDataArchiveMachineName $MyPIDAServerName

# Create the PI Points, if necessary
Add-PIPoint -Name $PITag1Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.02;Excdev=0.01}
Add-PIPoint -Name $PITag2Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.02;Excdev=0.01}

#------------------------------------------------------------------------------------------------

# Specify the path to the Phidget DLL
$MyPhidgetDLL = "C:\Program Files\Phidgets\Phidget21.NET.dll"

# Add the Phidget type usign that path
Add-Type -Path $MyPhidgetDLL

# Create the Phidget object
$MyIOKitObject = New-Object -TypeName Phidgets.InterfaceKit
#$MyIOKitObject = New-Object -TypeName Phidgets.TemperatureSensor

# Define a flag for monitoring this data source
$PhidgetReady = $false

# Try to open the connection 
$MyIOKitObject.open()

# Wait for the Phidget to be attached
$AttachWait_Seconds = 10
write-host "Waiting" ($AttachWait_Seconds) "seconds for Phidget to be attached..."
$MyIOKitObject.waitForAttachment($AttachWait_Seconds * 1000)

# Test to see if the data source is ready
if ($MyIOKitObject.Attached -eq $true)
{
    # Turn on monitoring!
    $PhidgetReady = $true
    write-host "Phidget detected!"
}
else
{
    # Turn off monitoring
    $PhidgetReady = $false
    write-host "No Phidget detected"
}

#------------------------------------------------------------------------------------------------

write-host ("Now logging data to disk every " + $MyWaitDuration_Milliseconds/1000 + " seconds...")
while($true -and $PhidgetReady) {

    # Check the data source
    if ($PhidgetReady -eq $true)
    {
        # Read data - low precision
        #$sensorValue1 = $MyIOKitObject.sensors[0].Value
        #$sensorValue2 = $MyIOKitObject.sensors[1].Value

        # Read data - high precision
        $sensorValue1 = ($MyIOKitObject.sensors[0].RawValue) / 4.095
        $sensorValue2 = ($MyIOKitObject.sensors[1].RawValue) / 4.095

        # Write the sensor values to PI Points
        Add-PIValue -PointName $PITag1Name -Value $sensorValue1 -Time (get-date) -Connection $MyPIDAServerConnection
        Add-PIValue -PointName $PITag2Name -Value $sensorValue2 -Time (get-date) -Connection $MyPIDAServerConnection
    }

    # Wait until the next measurement
    start-sleep -Milliseconds $MyWaitDuration_Milliseconds
}

Write-Host "Program ended."