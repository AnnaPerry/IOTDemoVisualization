﻿if ((Get-Service -Name "PI Web API").Status -ne "Running") { Start-Service -Name "PI Web API"}