# Prerequisite: download and install the Phidgets drivers:
# http://www.phidgets.com/downloads/libraries/Phidget-x64.exe

# Define a debug path
$LOG_FILE_PATH = "C:\PhidgetLogFile.txt"

# Try to open the log file; stop the script if this fails (likely another script is in progress)
Out-File -FilePath $LOG_FILE_PATH ("Script run: " + (Get-Date)) -ErrorAction Stop

# Preparation: close ports and connections if they exist
if ($MyPhidgetObject -ne $null) { $MyPhidgetObject.Close() }

# Create a windows scheduled task to start the data collection on boot!
write-host "`nChecking if scheduled task needs to be created..."
Out-File -FilePath $LOG_FILE_PATH "`nChecking if scheduled task needs to be created..." -Append
$taskName1 = "Start Phidget data collection on boot"
$task = Get-ScheduledTask -TaskName $taskName1 -ErrorAction SilentlyContinue

# Create the task if it doesn't already exist!
if ($task -eq $null) {
    write-host "Creating task to run Phidget data collection script at boot..."
    Out-File -FilePath $LOG_FILE_PATH 
    Try {
        $action1  = New-ScheduledTaskAction -Execute "C:\inetpub\wwwroot\Setup\Phase III\WritePhidgetDataDirectlyToPISystem.bat"
        $trigger1 = New-ScheduledTaskTrigger -AtStartup
        $principal1 = New-ScheduledTaskPrincipal -UserID "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -Action $action1 -trigger $trigger1 -TaskName $taskName1 -Principal $principal1
        
        # Optional: disable the task
        #Disable-ScheduledTask -TaskName $taskName1
    } Catch {
        write-host "!!!!!!!!!!!!!!!! An error occurred creating scheduled task !!!!!!!!!!!!!!!!"
        Out-File -FilePath $LOG_FILE_PATH 
        write-host $_.Exception.Message
        Out-File -FilePath $LOG_FILE_PATH 
        Read-Host -Prompt "Press ENTER to attempt to continue"
    }
    write-host "Scheduled task created!`n"
    Out-File -FilePath $LOG_FILE_PATH 
} else {
    write-host "Scheduled task is ready! Task state is" $task.state
    Out-File -FilePath $LOG_FILE_PATH 
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
Out-File -FilePath $LOG_FILE_PATH ("`nConnected to PI Server '" + $MyPIDAServerName + "': " + $MyPIDAServerConnection.Connected) -Append

# Create the PI Points, if necessary
if ((Get-PIPoint -Connection $MyPIDAServerConnection -Name $PITag1Name -Attributes {name}) -eq $null) {
    write-host "`nCreating PI Point 1!"
    Out-File -FilePath $LOG_FILE_PATH "`nCreating PI Point 1!" -Append
    Add-PIPoint -Name $PITag1Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.002;Excdev=0.001}
} else {
    write-host "`nLocated target PI Point 1..."
    Out-File -FilePath $LOG_FILE_PATH "`nLocated target PI Point 1..." -Append
}
if ((Get-PIPoint -Connection $MyPIDAServerConnection -Name $PITag2Name -Attributes {name}) -eq $null) {
    write-host "Creating PI Point 2!"
    Out-File -FilePath $LOG_FILE_PATH "Creating PI Point 2!" -Append
    Add-PIPoint -Name $PITag2Name -Connection $MyPIDAServerConnection -Attributes @{PointType="float32";Span=1000;Compdev=0.002;Excdev=0.001}
} else {
    write-host "Located target PI Point 2..."
    Out-File -FilePath $LOG_FILE_PATH "Located target PI Point 2..." -Append
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
Out-File -FilePath $LOG_FILE_PATH "`nWaiting" ($AttachWait_Seconds) "seconds for Interface Kit Phidget to be attached..." -Append
$MyPhidgetObject.waitForAttachment($AttachWait_Seconds * 1000)

# Test to see if the data source is ready
if ($MyPhidgetObject.Attached -eq $true)
{
    # Turn on monitoring!
    $PhidgetReady = $true
    write-host "Interface Kit detected!"
    Out-File -FilePath $LOG_FILE_PATH "Interface Kit detected!" -Append
}
else
{
    # Try the second type!
    $PhidgetReady = $false
    write-host "Interface kit not detected; trying second Phidget type..."
    Out-File -FilePath $LOG_FILE_PATH "Interface kit not detected; trying second Phidget type..." -Append

    # Create the Phidget object
    $MyPhidgetObject = New-Object -TypeName Phidgets.TemperatureSensor

    # Try to open the connection 
    $MyPhidgetObject.open()

    # Wait for the Phidget to be attached
    $AttachWait_Seconds = 10
    write-host "`nWaiting" ($AttachWait_Seconds) "seconds for Temperature Phidget to be attached..."
    Out-File -FilePath $LOG_FILE_PATH "`nWaiting" ($AttachWait_Seconds) "seconds for Temperature Phidget to be attached..." -Append
    $MyPhidgetObject.waitForAttachment($AttachWait_Seconds * 1000)

    # Test to see if the data source is ready
    if ($MyPhidgetObject.Attached -eq $true)
    {
        # Turn on monitoring!
        $PhidgetReady = $true
        write-host "Temp. sensor detected!"
        Out-File -FilePath $LOG_FILE_PATH "Temp. sensor detected!" -Append

        # Load in the AF Element and template from the attached XML file!
        write-host "Creating AF Element!"
        Out-File -FilePath $LOG_FILE_PATH "Creating AF Element!" -Append
        Try {
            $myAFServerConnection = Connect-AFServer -AFServer (Get-AFServer -Name "localhost")
            $myAFDB = Get-AFDatabase -AFServer $myAFServerConnection -Name "Asset Framework DB 1"
            $myAFElementTemplate = Get-AFElementTemplate -Name "Asset Template - Non-contact Infrared Thermometer" -AFDatabase $myAFDB
            $myTargetAFElement = Get-AFElement -Name "Assets" -AFDatabase $myAFDB
            if ($true -and (Get-AFElement -Name "Non-contact Infrared Thermometer" -AFElement $myTargetAFElement)) {
                write-host "New element already exists!"
                Out-File -FilePath $LOG_FILE_PATH "New element already exists!" -Append
            } else {
                $newAFElement = Add-AFElement -Name "Non-contact Infrared Thermometer" -AFElement $myTargetAFElement -AFElementTemplate $myAFElementTemplate -CheckIn
                $myAFDB.CheckIn()
            }
        } Catch {
            write-host "!!!!!!!!!!!!!!!! An error occurred when importing XML !!!!!!!!!!!!!!!!"
            Out-File -FilePath $LOG_FILE_PATH "!!!!!!!!!!!!!!!! An error occurred when importing XML !!!!!!!!!!!!!!!!" -Append
            write-host $_.Exception.Message
            Out-File -FilePath $LOG_FILE_PATH $_.Exception.Message -Append
        }
        write-host "Complete!`n"
        Out-File -FilePath $LOG_FILE_PATH "Complete!`n" -Append
    }
    else
    {
        # Try the second type!
        $PhidgetReady = $false
        write-host "No Phidget detected; program exiting!"
        Out-File -FilePath $LOG_FILE_PATH "No Phidget detected; program exiting!" -Append
        exit
    }

}

#------------------------------------------------------------------------------------------------

write-host ("`nNow logging data to PI Points every " + $MyWaitDuration_Milliseconds/1000 + " seconds!  Press CTRL+C to quit.")
Out-File -FilePath $LOG_FILE_PATH ("`nNow logging data to PI Points every " + $MyWaitDuration_Milliseconds/1000 + " seconds!  Press CTRL+C to quit.") -Append
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
Out-File -FilePath $LOG_FILE_PATH "Program ended." -Append