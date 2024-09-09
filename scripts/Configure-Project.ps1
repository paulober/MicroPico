mkdir .\.vscode
Set-Location .\.vscode
Out-File -FilePath ".\extensions.json" -Encoding utf8 -InputObject '{
    "recommendations": [
        "ms-python.python",
        "visualstudioexptteam.vscodeintellicode",
        "ms-python.vscode-pylance",
        "paulober.pico-w-go"
    ]
}'
Out-File -FilePath ".\settings.json" -Encoding utf8 -InputObject '{
    "python.languageServer": "Pylance",
    "python.analysis.typeCheckingMode": "basic",
    "python.analysis.diagnosticSeverityOverrides": {
        "reportMissingModuleSource": "none"
    },
    "python.analysis.typeshedPaths": [
        "~/.micropico-stubs/included"
    ],
    "python.analysis.extraPaths": [
        "~/.micropico-stubs/included"
    ],

    "micropico.syncFolder": "",
    "micropico.openOnStart": true,
    "micropico.autoConnect": true
}'
Set-Location ..
New-Item -Path ".micropico" -ItemType File -Force

# SIG # Begin signature block
# MIID6QYJKoZIhvcNAQcCoIID2jCCA9YCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCBft7yVVjlw3TbY
# eKPXvo74zREnY5MNmK5x0+k7dse9e6CCAeYwggHiMIIBiKADAgECAhBB/1nf+Q3Z
# h0a2oCYQfU8VMAoGCCqGSM49BAMCME8xEzARBgoJkiaJk/IsZAEZFgNkZXYxGDAW
# BgoJkiaJk/IsZAEZFghwYXVsb2JlcjELMAkGA1UEBhMCREUxETAPBgNVBAMMCHBh
# dWxvYmVyMB4XDTI0MDkwOTA4NDUxM1oXDTI2MDkwOTA4NTUxM1owTzETMBEGCgmS
# JomT8ixkARkWA2RldjEYMBYGCgmSJomT8ixkARkWCHBhdWxvYmVyMQswCQYDVQQG
# EwJERTERMA8GA1UEAwwIcGF1bG9iZXIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
# AAQT9Ou4TWli5lJ/+L+yx1NWRYzcJTh3Hr05pfzGQmv7ADbsqkYcjK81q84UuH+Q
# dmhtJQZtywxmR06qx5zEZNoho0YwRDAOBgNVHQ8BAf8EBAMCB4AwEwYDVR0lBAww
# CgYIKwYBBQUHAwMwHQYDVR0OBBYEFAYYFbazuCO8mQuVR0bvVkIm47ibMAoGCCqG
# SM49BAMCA0gAMEUCIEX52cIb5KfuR9Z2ojJlPhlw3OYUrm0xm/h9+0EyroZ8AiEA
# 3dvDHvBhXtb/UuLIP26/3vRbPIrnVamxzv8AnPfYnMYxggFZMIIBVQIBATBjME8x
# EzARBgoJkiaJk/IsZAEZFgNkZXYxGDAWBgoJkiaJk/IsZAEZFghwYXVsb2JlcjEL
# MAkGA1UEBhMCREUxETAPBgNVBAMMCHBhdWxvYmVyAhBB/1nf+Q3Zh0a2oCYQfU8V
# MA0GCWCGSAFlAwQCAQUAoIGEMBgGCisGAQQBgjcCAQwxCjAIoAKAAKECgAAwGQYJ
# KoZIhvcNAQkDMQwGCisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQB
# gjcCARUwLwYJKoZIhvcNAQkEMSIEIJAoYpj3hFiygiIcN5r5YhlzeoP7PtRuWkxD
# XP5fgCX6MAsGByqGSM49AgEFAARIMEYCIQCn8sKnlHMp7ropmoU35yko69btdga7
# cGtuMG14lvwAkwIhAMFVsnj8kgvPQ3p5jqxI+tbm1XjxxqsMuP6YR7ml/aXj
# SIG # End signature block
