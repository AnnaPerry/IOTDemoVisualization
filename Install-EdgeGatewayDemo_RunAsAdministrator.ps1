# Note: run this script as an administrator!

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
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
Enable-WindowsOptionalFeature -Online -FeatureName IIS-BasicAuthentication
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementService
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Import the desired AF database and create or update all data references
write-host "Importing AF database..."
Try {
Import-AFXml -AFServer $myAFServerConnection -File "C:\inetpub\wwwroot\Setup\PI AF Database Setup\Asset Framework DB 1.xml" -ImportMode AllowCreate,CreateConfig,AllowUpdate
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Set security on the target AF DB!
write-host "Updating database security to allow writes..."
Try {
$myAFDB.Security.SetSecurityString("Administrators:A(r,w,rd,wd,d,x,a,s,so)|World:A(r,w,rd,wd)", $true)
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"


# Create a self-hosted network
write-host "Installing self-hosted Wi-Fi network..."
Try {
netsh wlan set hostednetwork mode=allow ssid=gatewaynetwork key=osisoftiot
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
Register-ScheduledTask -Action $action1 -trigger $trigger1 -TaskName $taskName1 -RunLevel Highest
Disable-ScheduledTask -TaskName $taskName1
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
Register-ScheduledTask -Action $action2 -trigger $trigger2 -TaskName $taskName2 -RunLevel Highest -
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
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
    write-host "!!!!!!!!!!!!!!!! An error ocurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Finished!
write-host "Installation script is complete."
write-host "Note: this app was designed to be viewed in Mozilla Firefox; please download and install Firefox!"
write-host "Download Firefox from here: https://www.mozilla.org/en-US/firefox/new/?scene=2"

# Press any key to exit
Read-Host -Prompt "`nPress ENTER to exit script."