# Get the service
$PIWebAPIService = Get-Service -Name piwebapi

# Restart if stopped!
if ($PIWebAPIService.Status -eq "Stopped") {

    Write-EventLog -LogName "Application" -Source “IoT Demo App” -EntryType Error -Message "PI Web API stopped! Starting now..." -EventId 1
    $PIWebAPIService.Start()

} else {

    # If it is running, make sure it's not hung!
    try {
        
        # Send a very simple web request
        $ResultOfTestWebRequest = Invoke-WebRequest -Method Get -Uri "https://localhost/piwebapi/assetservers" -TimeoutSec 30 -UseBasicParsing

    } catch {
        Write-EventLog -LogName "Application" -Source “IoT Demo App” -EntryType Error -Message ("Error when checking PI Web API status! Restarting! Error text: " + $_.Exception.Message) -EventId 1

        # If an error occurs, then stop and start the service!
        $PIWebAPIService.Stop()
        $PIWebAPIService.Start()

    }

}