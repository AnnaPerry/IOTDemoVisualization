# Get the service
$PIWebAPIService = Get-Service -Name piwebapi

# Restart if stopped!
if ($PIWebAPIService.Status -eq "Stopped") {
    write-host "PI Web API stopped! Starting now..."
    $PIWebAPIService.Start()

} else {
    write-host "PI Web API running!"
    # If it is running, make sure it's not hung!
    try {
        
        # Send a very simple web request
        $ResultOfTestWebRequest = Invoke-WebRequest -Method Get -Uri "https://localhost/piwebapi/assetservers" -TimeoutSec 30

    } catch {
        write-host "Error when checking PI Web API status! Restarting!"
        # If an error occurs, then stop and start the service!
        $PIWebAPIService.Stop()
        $PIWebAPIService.Start()
    }

}