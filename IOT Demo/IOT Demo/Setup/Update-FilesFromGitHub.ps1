# Note: run this script as an administrator!

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
		write-host "Removing old extracted copy prior to extracting new copy..."
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
		# Back up the old version!
		write-host "Backing up previous version..."
        $backupLocation = ("C:\inetpub\wwwroot_backup_" + $(Get-Date).ToString("YYYY-MM-dd_HH-mm-ss") + ".zip")
		[System.IO.Compression.ZipFile]::CreateFromDirectory("C:\inetpub\wwwroot", $backupLocation)
		write-host "Backup complete!"
		
		# Delete the old content
		write-host "`nRemoving old wwwroot content prior to update..."
		Remove-Item -Path "C:\inetpub\wwwroot\*" -Recurse
	}
    # Copy the content!
	write-host "`nCopying content..."
	copy-item "C:\IOTDemoVisualization-master\IOT Demo\IOT Demo\*" "C:\inetpub\wwwroot" -recurse
} Catch {
    write-host "!!!!!!!!!!!!!!!! An error occurred !!!!!!!!!!!!!!!!"
    write-host $_.Exception.Message
    Read-Host -Prompt "Press ENTER to attempt to continue"
}
write-host "Complete!`n"

# Log the install date
Out-File -FilePath "C:\inetpub\wwwroot\Install Date.txt" -InputObject ($(Get-Date).ToString()) -Force

# Press any key to exit
Read-Host -Prompt "`nDone! Press ENTER to exit script."