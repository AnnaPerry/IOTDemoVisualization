# Prerequisite: download and install the Phidgets drivers:
# http://www.phidgets.com/downloads/libraries/Phidget-x64.exe

# Preparation: close ports and connections if they exist
if ($MyPhidgetObject -ne $null) { $MyPhidgetObject.Close() }

# Create a windows scheduled task to start the data collection on boot!
write-host "`nChecking if scheduled task needs to be created..."
$taskName1 = "Start Phidget data collection on boot"
$task = Get-ScheduledTask -TaskName $taskName1 -ErrorAction SilentlyContinue

# Create the task if it doesn't already exist!
if ($task -eq $null) {
    write-host "Creating task to run Phidget data collection script at boot..."
    Try {
        $action1  = New-ScheduledTaskAction -Execute "C:\inetpub\wwwroot\Setup\Phase III\WritePhidgetDataDirectlyToPISystem.bat"
        $trigger1 = New-ScheduledTaskTrigger -AtStartup
        $principal1 = New-ScheduledTaskPrincipal -UserID "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -Action $action1 -trigger $trigger1 -TaskName $taskName1 -Principal $principal1
        
        # Optional: disable the task
        #Disable-ScheduledTask -TaskName $taskName1
    } Catch {
        write-host "!!!!!!!!!!!!!!!! An error occurred creating scheduled task !!!!!!!!!!!!!!!!"
        write-host $_.Exception.Message
        Read-Host -Prompt "Press ENTER to attempt to continue"
    }
    write-host "Scheduled task created!`n"
} else {
    write-host "Scheduled task is ready! Task state is" $task.state
}

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
write-host ("`nConnected to PI Server '" + $MyPIDAServerName + "': " + $MyPIDAServerConnection.Connected)

# Create the PI Points, if necessary
if ((Get-PIPoint -Connection $MyPIDAServerConnection -Name $PITag1Name -Attributes {name}) -eq $null) {
    write-host "`nCreating PI Point 1!"
    Add-PIPoint -Name $PITag1Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.002;Excdev=0.001}
} else {
    write-host "`nLocated target PI Point 1..."
}
if ((Get-PIPoint -Connection $MyPIDAServerConnection -Name $PITag2Name -Attributes {name}) -eq $null) {
    write-host "Creating PI Point 2!"
    Add-PIPoint -Name $PITag2Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.002;Excdev=0.001}
} else {
    write-host "Located target PI Point 2..."
}

#------------------------------------------------------------------------------------------------

# Specify the path to the Phidget DLL
$MyPhidgetDLL = "C:\Program Files\Phidgets\Phidget21.NET.dll"

# Add the Phidget type usign that path
Add-Type -Path $MyPhidgetDLL

#------------------------------------------------------------------------------------------------

# Create the Phidget object
$MyPhidgetObject = New-Object -TypeName Phidgets.InterfaceKit

# Define a flag for monitoring this data source
$PhidgetReady = $false

# Try to open the connection 
$MyPhidgetObject.open()

# Wait for the Phidget to be attached
$AttachWait_Seconds = 10
write-host "`nWaiting" ($AttachWait_Seconds) "seconds for Interface Kit Phidget to be attached..."
$MyPhidgetObject.waitForAttachment($AttachWait_Seconds * 1000)

# Test to see if the data source is ready
if ($MyPhidgetObject.Attached -eq $true)
{
    # Turn on monitoring!
    $PhidgetReady = $true
    write-host "Interface Kit detected!"
}
else
{
    # Try the second type!
    $PhidgetReady = $false
    write-host "Interface kit not detected; trying second Phidget type..."

    # Create the Phidget object
    $MyPhidgetObject = New-Object -TypeName Phidgets.TemperatureSensor

    # Try to open the connection 
    $MyPhidgetObject.open()

    # Wait for the Phidget to be attached
    $AttachWait_Seconds = 10
    write-host "`nWaiting" ($AttachWait_Seconds) "seconds for Temperature Phidget to be attached..."
    $MyPhidgetObject.waitForAttachment($AttachWait_Seconds * 1000)

    # Test to see if the data source is ready
    if ($MyPhidgetObject.Attached -eq $true)
    {
        # Turn on monitoring!
        $PhidgetReady = $true
        write-host "Temp. sensor detected!"

        # Load in the AF Element and template from the attached XML file!
        write-host "Creating AF Element!"
        Try {
            $myAFServerConnection = Connect-AFServer -AFServer (Get-AFServer -Name "localhost")
            $myAFDB = Get-AFDatabase -AFServer $myAFServerConnection -Name "Asset Framework DB 1"
            $myAFElementTemplate = Get-AFElementTemplate -Name "Asset Template - Non-contact Infrared Thermometer" -AFDatabase $myAFDB
            $myTargetAFElement = Get-AFElement -Name "Assets" -AFDatabase $myAFDB
            if ($true -and (Get-AFElement -Name "Non-contact Infrared Thermometer" -AFElement $myTargetAFElement)) {
                write-host "New element already exists!"
            } else {
                $newAFElement = Add-AFElement -Name "Non-contact Infrared Thermometer" -AFElement $myTargetAFElement -AFElementTemplate $myAFElementTemplate -CheckIn
                $myAFDB.CheckIn()
            }
        } Catch {
            write-host "!!!!!!!!!!!!!!!! An error occurred when importing XML !!!!!!!!!!!!!!!!"
            write-host $_.Exception.Message
            Read-Host -Prompt "Press ENTER to attempt to continue"
        }
        write-host "Complete!`n"
    }
    else
    {
        # Try the second type!
        $PhidgetReady = $false
        write-host "No Phidget detected; program exiting!"
        exit
    }

}

#------------------------------------------------------------------------------------------------

write-host ("`nNow logging data to PI Points every " + $MyWaitDuration_Milliseconds/1000 + " seconds!  Press CTRL+C to quit.")
while($true -and $PhidgetReady) {

    # Perform different reads depending on the Phidget type!
    if ($true -and $MyPhidgetObject.ambientSensor) {
        
        # Read the value(s)
        $sensorValue1 = ($MyPhidgetObject.ambientSensor.Temperature * 9/5 + 32)

        # Write the sensor values to PI Points
        Add-PIValue -PointName $PITag1Name -Value $sensorValue1 -Time (get-date) -Connection $MyPIDAServerConnection

    } elseif ($true -and $MyPhidgetObject.sensors) {
        
        # Read the value(s)
        $sensorValue1 = ($MyPhidgetObject.sensors[0].RawValue) / 4.095
        $sensorValue2 = ($MyPhidgetObject.sensors[1].RawValue) / 4.095

        # Write the sensor values to PI Points
        Add-PIValue -PointName $PITag1Name -Value $sensorValue1 -Time (get-date) -Connection $MyPIDAServerConnection
        Add-PIValue -PointName $PITag2Name -Value $sensorValue2 -Time (get-date) -Connection $MyPIDAServerConnection
    }

    # Wait until the next measurement
    start-sleep -Milliseconds $MyWaitDuration_Milliseconds
}

Write-Host "Program ended."