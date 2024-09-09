# Define an array of platforms
$platforms = @("win32-x64", "darwin-x64+arm64", "linux-arm64", "linux-arm", "linux-x64", "universal")
Remove-Item -Recurse -Force dist

# Loop through the platforms
foreach ($platform in $platforms) {
    Remove-Item -Recurse -Force prebuilds
    New-Item -ItemType Directory -Path prebuilds

    if ($platform -ne "universal") {
        # Copy the bindings binary for each platform
        Copy-Item -Recurse -Path "node_modules/@serialport/bindings-cpp/prebuilds/$platform" -Destination "./prebuilds"
    } else {
        # Copy the bindings binaries for all platforms
        Copy-Item -Recurse -Path "node_modules/@serialport/bindings-cpp/prebuilds" -Destination "./"
    }

    # Package the VSCode extension for the platform
    switch ($platform) {
        "win32-x64" {
            npx @vscode/vsce package --no-yarn --target "win32-x64" -o "micropico-$env:RELEASE_TAG_NAME-$platform.vsix"
        }
        "darwin-x64+arm64" {
            npx @vscode/vsce package --no-yarn -o "micropico-$env:RELEASE_TAG_NAME-$platform.vsix"
        }
        "linux-arm64" {
            npx @vscode/vsce package --no-yarn --target "linux-arm64" -o "micropico-$env:RELEASE_TAG_NAME-$platform.vsix"
        }
        "linux-arm" {
            npx @vscode/vsce package --no-yarn --target "linux-armhf" -o "micropico-$env:RELEASE_TAG_NAME-linux-armhf.vsix"
        }
        "linux-x64" {
            npx @vscode/vsce package --no-yarn --target "linux-x64" -o "micropico-$env:RELEASE_TAG_NAME-$platform.vsix"
        }
        default {
            npx @vscode/vsce package --no-yarn -o "micropico-$env:RELEASE_TAG_NAME.vsix"
        }
    }
}

# SIG # Begin signature block
# MIID6AYJKoZIhvcNAQcCoIID2TCCA9UCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCDFDWyaXPSxAHXM
# NhnenQdRWCfweEPwP7g1yr8IJ5qFsKCCAeYwggHiMIIBiKADAgECAhBB/1nf+Q3Z
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
# gjcCARUwLwYJKoZIhvcNAQkEMSIEIMXaC1Se7bNIJohglDlz3KrYu8wff7Mj9Zta
# x1IoN18LMAsGByqGSM49AgEFAARHMEUCIExhiRRwzWZ6RmZ1DAqPkYSiR6mjmFA0
# ycy4lJ9CeArfAiEA1usMgMJXu6zuHgYdFthOsXKiA69JYdTync/HGqfbEvU=
# SIG # End signature block
