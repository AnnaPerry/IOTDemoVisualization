# Note: run this script as an administrator!

<#
Prior to running this installation script, four files must be downloaded from the OSIsoft Technical Support Web site (https://techsupport.osisoft.com/) (note: pay careful attention to the required software versions!):

1. SQL Server 2016 SP1 Express edition. 
Download this kit and install it first; accept all defaults for a "Basic" installation.

2. PI AF Services (version 2017 SP1a or the most recent version). 
Install this second, and accept and install all components and defaults EXCEPT for PI Notifications, which you should not install.  After the installation completes, you'll be prompted to complete the PI Web API Configuration Utility; complete the utility using all of the default options.

3. PI Data Archive (version 2016 R2 or the most recent version). 
Install this next; you'll need a license file to complete the installation (contact OSIsoft to obtain one).  During the installation, accept all of the default installation options.

4. PI System Management Tools (version 2017 or the most recent version). 

After these pieces of software have been successfully installed, run the Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator, which will download the rest of the needed files for this demonstration and properly configure the host PC.
#>

# Install needed windows features!
write-host "Installing needed Windows features!"
Try
{
Enable-WindowsOptionalFeature -Online -FeatureName NetFx3
Enable-WindowsOptionalFeature -Online -FeatureName NetFx4-AdvSrvs
Enable-WindowsOptionalFeature -Online -FeatureName NetFx4Extended-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionDynamic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName WCF-Services45
Enable-WindowsOptionalFeature -Online -FeatureName WCF-TCP-PortSharing45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WindowsAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebDAV
Enable-WindowsOptionalFeature -Online -FeatureName IIS-BasicAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementService
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}

write-host "Installed features:"
Get-WindowsOptionalFeature –Online | Where-Object {$_.State –eq “Enabled”} | Format-Table
write-host "`n"

# Download the package!
write-host "Downloading project files..."
Try {
$url = "https://github.com/AnnaPerry/IOTDemoVisualization/archive/master.zip"
$downloadedFilePath = "C:\IOTDemoVisualization-master.zip"
$start_time = Get-Date
$wc = New-Object System.Net.WebClient
$wc.DownloadFile($url, $downloadedFilePath)
Write-Output "Time taken: $((Get-Date).Subtract($start_time).Seconds) second(s)"
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Unzip the package!
write-host "Unzipping the most recent project files..."
Try {
$extractedDirectoryPath = "C:\"
if ((Test-Path "C:\IOTDemoVisualization-master") -eq $true) {
    write-host "Removing old extracted copy first..."
    Remove-Item -Path "C:\IOTDemoVisualization-master" -Recurse
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($downloadedFilePath, $extractedDirectoryPath)
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Copy files!
write-host "Copying project files to the target folder..."
Try {
if ((test-path "C:\inetpub\wwwroot\App") -eq $true) {
    write-host "Removing old wwwroot content first..."
    Remove-Item -Path "C:\inetpub\wwwroot\*" -Recurse
}
copy-item "C:\IOTDemoVisualization-master\IOT Demo\IOT Demo\*" "C:\inetpub\wwwroot" -recurse
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Add the https binding to the default web site!
write-host "Updating HTTPS bindings..."
Try {
if ((Get-WebBinding -Name "Default Web Site" -Protocol https).Count -eq 0) {
    New-WebBinding -Name "Default Web Site" -IP "*" -Port 443 -Protocol https
} else {
    write-host "Note: an HTTPS binding already exists for the default web site! Skipping binding creation..."
}
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Connect to your AF Server!
write-host "Beginning AF configuration! Now connecting to AF server..."
$myAFServerConnection = $null
Try {
    $myAFServerConnection = Connect-AFServer -AFServer (Get-AFServer -Name "localhost")
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Import the desired AF database and create or update all data references
write-host "Importing AF database..."
Try {
    Import-AFXml -AFServer $myAFServerConnection -File "C:\inetpub\wwwroot\Setup\PI AF Database Setup\Asset Framework DB 1.xml" -ImportMode AllowCreate,CreateConfig,AllowUpdate
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Connect to the target AF DB and check it in!
write-host "Checking in changes..."
$myAFDB = $null
Try {
    $myAFDB = Get-AFDatabase -AFServer $myAFServerConnection -Name "Asset Framework DB 1"
    $myAFDB.CheckIn()
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Set security on the target AF DB!
write-host "Updating database security to allow writes..."
Try {
    $myAFDB.Elements.Item("Assets").Security.SetSecurityString("Administrators:A(r,w,rd,wd,d,x,a,s,so)|World:A(r,w,rd,wd)", $true)
    $myAFDB.CheckIn()
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Configure the PI Web API configuration AF Element
write-host "Now connecting to the PI Web API configuration element..."
$myConfigurationAFDB = $null
$myPIWebAPIConfigElement = $null
Try {
    $myConfigurationAFDB = Get-AFDatabase -AFServer $myAFServerConnection -Name "Configuration"
    $myPIWebAPIConfigElement = ((($myConfigurationAFDB.Elements.Item("OSIsoft")).Elements.Item("PI Web API")).Elements.Item(0)).Elements.Item("System Configuration")
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Update the PI Web API Settings
write-host "Updating PI Web API settings..."
Try {
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "EnableCSRFDefense") -Value $false
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "CorsHeaders") -Value "*"
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "CorsMethods") -Value "*"
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "CorsOrigins") -Value "*"
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "AuthenticationMethods") -Value "Anonymous"
    if ((Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "IgnoreCacheControlForBulkRequests").Count -eq 0) {
        Add-AFAttribute -Name "IgnoreCacheControlForBulkRequests" -Value $true -AFElement $myPIWebAPIConfigElement -Type boolean -ErrorAction Continue
    }
    Set-AFAttribute -AFAttribute (Get-AFAttribute -AFElement $myPIWebAPIConfigElement -Name "IgnoreCacheControlForBulkRequests") -Value $true
    $myAFDB.CheckIn()
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Check in the PI Web API changes, then restart the PI Web API
write-host "Saving changes and restarting PI Web API..."
Try {
$myConfigurationAFDB.CheckIn() 
Stop-Service -Name "piwebapi"
Start-Service -Name "piwebapi"
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Turn on wi-fi 
write-host "Activating Wi-Fi..."
Try {
Set-Service -Name "WlanSvc" -StartupType Automatic
Start-Service -Name "WlanSvc"
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"


# Create a self-hosted network
write-host "Installing self-hosted Wi-Fi network..."
Try {
Start-Process "C:\inetpub\wwwroot\Setup\Self-Hosted Network Configuration\CreateHostedNetwork.bat"
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Create a windows scheduled task to start the hosted network on boot; note that it will be disabled buy default!
write-host "Creating task to start self-hosted network at bootup (this task is disabled by default)..."
Try {
$taskName1 = "Start self-hosted Wi-Fi network on boot"
$action1  = New-ScheduledTaskAction -Execute "C:\inetpub\wwwroot\Setup\Self-Hosted Network Configuration\StartHostedNetwork.bat"
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$principal1 = New-ScheduledTaskPrincipal -UserID "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action1 -trigger $trigger1 -TaskName $taskName1 -Principal $principal1
Disable-ScheduledTask -TaskName $taskName1
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Create a windows scheduled task to restart the PI Web API service if it is stopped
write-host "Creating task to restart the PI Web API if it is stopped..."
Try {
$taskName2 = "Restart PI Web PI If Stopped"
$action2  = New-ScheduledTaskAction -Execute "C:\inetpub\wwwroot\Setup\PI Web API Configuration\StartPIWebAPIIfStopped.bat"
$trigger2 = New-JobTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Minutes 1) -RepeatIndefinitely
$principal2 = New-ScheduledTaskPrincipal -UserID "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -Action $action2 -trigger $trigger2 -TaskName $taskName2 -Principal $principal2
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Create a PI Interface for perfmon, and add it to the correct Windows group
write-host "Setting up a local perfmon PI Interface..."
Try {
if ((Get-Service -Name "piperfmon1").Count -eq 0) {
Out-File -FilePath "C:\Program Files (x86)\PIPC\Interfaces\PIPerfMon\PIPerfMon1.bat" -Encoding ascii -InputObject """C:\Program Files (x86)\PIPC\Interfaces\PIPerfMon\PIPerfMon.exe"" 1 /PS=# /ID=1 /host=localhost:5450 /pisdk=0 /maxstoptime=120 /PercentUp=100 /perf=8 /CacheMode /CacheSynch=250 /f=00:00:05 /f=00:01:00" 
&"C:\Program Files (x86)\PIPC\Interfaces\PIPerfMon\PIPerfMon.exe" -install -display "PI-PIPerfMon1" -serviceid "1" –depend “tcpip” –auto
} else {
    write-host "PI-PIPerfmon1 service already exists; skipping service creation!"
}
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Grant service permissions...
write-host "Adding PI Interface service account to the correct permissions group"
Try {
if ((Get-Service -Name "piperfmon1").Count -eq 0) {
Add-LocalGroupMember -Group "Performance Monitor Users" -Member "NT SERVICE\Piperfmon1"
Stop-Service -Name "piperfmon1"
Start-Service -Name "piperfmon1"
} else {
    write-host "PI-PIPerfmon1 service already exists; skipping service account configuration!"
}
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Create extra archives and turn off auto-archiving!
write-host "Creating new archives to prevent running out of disk space..."
Try {
    $PIDAServerName = "localhost"
    # Using the supplied server name, connect to the target PI Server
    $PIDAServerConnection = Connect-PIDataArchive -PIDataArchiveMachineName $PIDAServerName -ErrorAction Stop

    # Specify paths for 3 new archives
    $pathToNewArchive1 = ((Get-Item Env:piserver).value) + "arc\" + "overFlowArchive1.arc"
    $pathToNewArchive2 = ((Get-Item Env:piserver).value) + "arc\" + "overFlowArchive2.arc"
    $pathToNewArchive3 = ((Get-Item Env:piserver).value) + "arc\" + "overFlowArchive3.arc"

    # Create 3 new empty archives and register them
    New-PIArchive -Name $pathToNewArchive1 -Connection $PIDAServerConnection -WaitForRegistration
    New-PIArchive -Name $pathToNewArchive2 -Connection $PIDAServerConnection -WaitForRegistration
    New-PIArchive -Name $pathToNewArchive3 -Connection $PIDAServerConnection -WaitForRegistration

    # Disconnect
    $PIDAServerConnection.Disconnect()
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred when creating new archives !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Turn off auto-archiving!
write-host "Turning off auto-archiving..."
Try {
    $PIDAServerName = "localhost"
    # Using the supplied server name, connect to the target PI Server
    $PIDAServerConnection = Connect-PIDataArchive -PIDataArchiveMachineName $PIDAServerName -ErrorAction Stop

    # Set the truning parameter!
    Set-PITuningParameter -Name Archive_AutoArchiveFileRoot -Value "" -Connection $PIDAServerConnection
    
    # Disconnect
    $PIDAServerConnection.Disconnect()
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred when setting tuning parameter! !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Finished!
write-host "Installation script is complete."
write-host "Note: this app was designed to be viewed in Mozilla Firefox; please download and install Firefox!"
write-host "Download Firefox from here: https://www.mozilla.org/en-US/firefox/new/?scene=2"

Write-Host "Note: the scheduled task to automatically start the self-hosted Wi-Fi network is disabled by default!"
Write-Host "To set the self-hosted Wi-Fi network to run automatically on startup, open Task Scheduler and look for the task named 'Start self-hosted Wi-Fi network on boot', and set it to be enabled, then restart the gateway; after the gateway boots, you should be able to see (from a separate device) that it is now broadcasting the new Wi-Fi network named 'gatewaynetwork'."

# Press any key to exit
Read-Host -Prompt "`nPress ENTER to exit script."