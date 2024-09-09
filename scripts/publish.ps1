# This script's purpose is to publish the VSCode extension to the VSCode Marketplace 
# and OpenVSX Registry, also it packages binaries for each 
# platform to reduce vsix size

# Get the directory where the script is located
$SCRIPT_DIR = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Ensure package.ps1 is executable and call it
& "$SCRIPT_DIR/package.ps1"

# Find all .vsix files except the one without a platform prefix and publish them one by one
Get-ChildItem -Recurse -Filter "micropico-$env:RELEASE_TAG_NAME-*.vsix" | Where-Object { $_.Name -ne "micropico-$env:RELEASE_TAG_NAME.vsix" } | ForEach-Object {
    $packagePath = $_.FullName
    $targetFlags = ""

    # If the filename contains "darwin", add the appropriate target flags
    if ($packagePath -like "*darwin*") {
        $targetFlags = "--target darwin-x64 darwin-arm64 "
    }

    # Publish the VSCode extension to the VSCode Marketplace
    npx @vscode/vsce publish "$targetFlags--packagePath" "$packagePath"

    # Publish the VSCode extension to the Open VSX Registry
    npx ovsx publish "$packagePath" "$targetFlags-p" "$env:OVSX_PAT"

    # Delete this vsix file
    Remove-Item -Force "$packagePath"
}

# SIG # Begin signature block
# MIID6AYJKoZIhvcNAQcCoIID2TCCA9UCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCAzkyy0Suhkn3bY
# UkYTY8pZC/nC+ITltXSljUy/jVxq6KCCAeYwggHiMIIBiKADAgECAhBB/1nf+Q3Z
# h0a2oCYQfU8VMAoGCCqGSM49BAMCME8xEzARBgoJkiaJk/IsZAEZFgNkZXYxGDAW
# BgoJkiaJk/IsZAEZFghwYXVsb2JlcjELMAkGA1UEBhMCREUxETAPBgNVBAMMCHBh
# dWxvYmVyMB4XDTI0MDkwOTA4NDUxM1oXDTI2MDkwOTA4NTUxM1owTzETMBEGCgmS
# JomT8ixkARkWA2RldjEYMBYGCgmSJomT8ixkARkWCHBhdWxvYmVyMQswCQYDVQQG
# EwJERTERMA8GA1UEAwwIcGF1bG9iZXIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
# AAQT9Ou4TWli5lJ/+L+yx1NWRYzcJTh3Hr05pfzGQmv7ADbsqkYcjK81q84UuH+Q
# dmhtJQZtywxmR06qx5zEZNoho0YwRDAOBgNVHQ8BAf8EBAMCB4AwEwYDVR0lBAww
# CgYIKwYBBQUHAwMwHQYDVR0OBBYEFAYYFbazuCO8mQuVR0bvVkIm47ibMAoGCCqG
# SM49BAMCA0gAMEUCIEX52cIb5KfuR9Z2ojJlPhlw3OYUrm0xm/h9+0EyroZ8AiEA
# 3dvDHvBhXtb/UuLIP26/3vRbPIrnVamxzv8AnPfYnMYxggFYMIIBVAIBATBjME8x
# EzARBgoJkiaJk/IsZAEZFgNkZXYxGDAWBgoJkiaJk/IsZAEZFghwYXVsb2JlcjEL
# MAkGA1UEBhMCREUxETAPBgNVBAMMCHBhdWxvYmVyAhBB/1nf+Q3Zh0a2oCYQfU8V
# MA0GCWCGSAFlAwQCAQUAoIGEMBgGCisGAQQBgjcCAQwxCjAIoAKAAKECgAAwGQYJ
# KoZIhvcNAQkDMQwGCisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEOMAwGCisGAQQB
# gjcCARUwLwYJKoZIhvcNAQkEMSIEIEjp2NQfZLPcJ4t7BAFxjf1HD9EgAOqfSsuK
# CyCZ9UCEMAsGByqGSM49AgEFAARHMEUCIQDEfWF5BWiRjjCeuec6MxHY2xQq178U
# rF8MhkXqazRExAIgBAkvWEl7Uq7lVceVb5r2f4xVSOzpJiooY83TzD7BI+w=
# SIG # End signature block
