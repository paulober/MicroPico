#!/usr/bin/env pwsh
#Requires -Version 6
[cmdletbinding(
    DefaultParameterSetName='download'
)]
param (

    # ToDo: read module version from package.json
    # the (sub module = @serialport/bindings@9.0.1)
    $module_name = '@serialport/bindings',
    $module_ver  = '9.0.1',

    # Copy
    [Parameter(ParameterSetName='copyonly')]
    [switch]$copyonly,

    # ........................................................
    # project root path
    [Parameter(ParameterSetName='download')]
    [string]$root_folder = $PWD,

    #the versions of vscode to support; Defaults to 'master'
    [Parameter(ParameterSetName='download')]
    [string[]]$VSCodeVersions = @('master'),

    #the current (& future) Electron versions to get natives for
    [Parameter(ParameterSetName='download')]
    [string[]]$ElectronVersions = @() ,

    #the base Node version(s) to get natives form
    [Parameter(ParameterSetName='download')]
    [string[]]$NodeVersions = @() ,

    # the platforms
    [Parameter(ParameterSetName='download')]
    [string[]]$platforms = @("win32","darwin","linux") ,

    #the processor architectures
    [Parameter(ParameterSetName='download')]
    [string[]]$architectures = @("x64","ia32"),

    # do not copy,
    [Parameter(ParameterSetName='download')]
    [switch] $NoCopy,

    #do not detect the version of node running on this workstation
    [Parameter(ParameterSetName='download')]
    [switch] $IgnoreNodeVersion,

    # ........................................................
    #Harvest/Collect/copy
    [Parameter(ParameterSetName='harvest')]
    [switch] $Harvest,

    [Parameter(ParameterSetName='harvest',HelpMessage="windows, linux , or darwin (MacOS)")]
    [ValidateSet("win32","linux","darwin")]
    [string]$platform = $(if ($IsWindows) {'win32'} if ($IsLinux) { 'linux'} if ($IsMacOS) { 'darwin'}) ,

    [Parameter(ParameterSetName='harvest',HelpMessage="The CPU architecture")]
    [ValidateSet("x64","ia32")]
    [Alias("CPU","arch")]
    [string]$architecture = $( if ([Environment]::Is64BitProcess) {'x64'} else {'ia32'}) ,

    [Parameter(ParameterSetName='harvest',HelpMessage="Usually 'electron'")]
    [ValidateSet("electron","node")]
    [string]$runtime = 'electron',

    [Parameter(ParameterSetName='harvest',Mandatory=$true,HelpMessage="the electron version")]
    [ValidatePattern("^[0-9]+\.[0-9]+\.[0-9]+$")] # X.Y.Z
    [Alias("version")]
    [string]$runtime_version,

    [Parameter(ParameterSetName='harvest',HelpMessage="Storage pattern to use for loading different architectures")]
        [ValidateSet("electron","node","prebuildify")]
    [string]$loadmethod = $runtime,

    # ........................................................
    #just clean
    [Parameter(ParameterSetName='clean')]
    [switch] $clean


)

# #########################################################################################################
#  parameter fixup,  expect array @('x.x.x'), convert from string passed by npm
# #########################################################################################################
if ( $ElectronVersions.Count -eq 1 -and $ElectronVersions[0][0] -eq '@'){ $ElectronVersions = Invoke-Expression $ElectronVersions[0] }
if ( $NodeVersions.Count     -eq 1 -and $NodeVersions[0][0]     -eq '@'){ $NodeVersions     = Invoke-Expression $NodeVersions[0]     }
if ( $VSCodeVersions.Count   -eq 1 -and $VSCodeVersions[0][0]   -eq '@'){ $VSCodeVersions   = Invoke-Expression $VSCodeVersions[0]   }
if ( $platforms.Count        -eq 1 -and $platforms[0][0]        -eq '@'){ $platforms        = Invoke-Expression $platforms[0]        }
if ( $architectures.Count    -eq 1 -and $architectures[0][0]    -eq '@'){ $architectures    = Invoke-Expression $architectures[0]    }

# #########################################################################################################
#  functions
# #########################################################################################################

# Get the electron version used by a version of vscode
function ReadVsCodeElectronVersion {
    param ( [string]$GitTag = 'master' )
# Read the electron version from the .yarnrc file in the VSCode Repo
# For unauthenticated requests, the rate limit allows for up to 60 requests per hour, which is OK
    try {
        $git_url = "https://raw.githubusercontent.com/microsoft/vscode/$GitTag/.yarnrc"
        $yaml = Invoke-WebRequest $git_url -UserAgent 'josverl mp-download'| Select-Object -Expand Content
        $yaml = $yaml.Split("`n")
        $version = $yaml | Select-String -Pattern '^target +"(?<targetversion>[0-9.]*)"' -AllMatches |
                Foreach-Object {$_.Matches} |
                Foreach-Object {$_.Groups} |
                Where-Object Name -ieq 'targetversion' |
                Select-Object -ExpandProperty Value
        return $version
    } catch {
        Write-warning "Unable to find the Electron version used by VSCode [$GitTag]. Does it exist ?"
        return $null
    }
}
# #########################################################################################################
# get list of the recent electron versions used by the last 3 Vscode versions
function RecentVSCodeVersions ($Last = 3) {
    try {
        $output = &git ls-remote --tags https://github.com/microsoft/vscode.git
        $VersionTags = foreach( $line in $output) {
            $tag = $line.Split('refs/tags/')[1]
            try{
                $_ = [version]$tag
                Write-Output $tag
            } catch {
                #not a tag
            }
        }
        $Recent = $VersionTags | Sort-Object {[version]$_ } |
                    Group-Object {([version]$_).Major + " " + ([version]$_).Minor } |
                    Select-Object -Property Group -Last $Last |
                    ForEach-Object{ write-output $_.Group[0]}
        return $Recent
    } catch {
        return $null
    }
}
# #########################################################################################################
# run a simple command in Node and get the printed outout
function runNodeCommand ([string]$cmd) {

    try {
        if ($IsWindows) {
            $result = &node.exe --print $cmd
        } else {
            $result = &node --print $cmd
        }
        return $result
    } catch {
        Write-Error "Unable to run NodeJS command"
        return $null
    }
}
# #########################################################################################################
# get the ABI for a give runtime + version;  electron 6.1.2 --> ABI 73
function getABI([string]$runtime = "", [string]$version = "") {
    # get the abi version
    # requires: npm install node-abi [...]
    $cmd = "var getAbi = require('node-abi').getAbi;getAbi('$version','$runtime')"
    $ABI_ver = runNodeCommand $cmd
    return $ABI_ver
}
# #########################################################################################################
# try to download any prebuilt binaries that are published for a module
function DownloadPrebuild {

    param(
        # Runtime (node/electron)
        [string] $runtime = 'electron',
        # Electron version
        [string] $version,
        # Platform win32/darwin/linux
        [string] $platform,
        # CPU architecture x64 /ia32
        [string] $arch,
        [string] $prefix = "$module_name@"
    )
    if ($platform -ieq 'darwin' -and $arch -ieq 'ia32'){
        # mac = only 64 bit
        return $false
    }

    # move into bindings folder to download
    # todo: add error checking to set-location
    Set-Location $module_folder
    try {
        if ($IsWindows) {
            # &".\node_modules\.bin\prebuild-install.cmd" --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix $prefix
            &"$root_folder\node_modules\.bin\prebuild-install.cmd" --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix $prefix
        } else {
            # linux / mac : same command , slightly different path
            &"$root_folder/node_modules/.bin/prebuild-install" --runtime $runtime --target $version --arch $arch --platform $platform --tag-prefix $prefix
        }
    }  catch {
        Write-Error "Unable to run prebuild-install. Did you run 'npm add prebuild-install --save-dev ?'"
    }
    Set-Location $root_folder
    #true for success
    return $LASTEXITCODE -eq 0
}

# #########################################################################################################
# harvest/copy a compiled or downloaded binary and store it in the native_modules folder
#  source : ./node_modules/$module_name/build/Release/*.node
#  dest   : ./native_modules - detailed location dependes on the storage pattern ( electron / node / prebuildify)

function HarvestNativeBinding {
param(
    [string]$runtime = 'electron',
    [string]$loadmethod = $runtime,
    [string]$module_name = '@serialport/bindings',
    [string]$runtime_ver,
    [string]$platform,
    [string]$arch,
    [string]$abi_ver = $null,
    $docs_file = $null
)
    if( -not $abi_ver) {
        $abi_ver = getABI -runtime $runtime -version $runtime_ver
    }
    # is there anything to copy in the first place ?
    $src_folder = "./node_modules/$module_name/build/Release"
    $natives = Get-ChildItem $src_folder -Filter "*.node" -ErrorAction SilentlyContinue
    if ($natives.count -eq 0){
        Write-Warning "No native bindings could be found in: $src_folder"
        return
    }
    try {
        #OK , now copy the platform folder
        # from : \@serialport\bindings\build\Release\bindings.node
        # to a folder per "abi<ABI_ver>-<platform>-<arch>"
        switch ($loadmethod) {
            'node' {        # use the node version for the path ( implemended by binding)
                            # supported by ('binding')('serialport')
                            # <root>/node_modules/@serialport/bindings/compiled/<version>/<platform>/<arch>/binding.node
                            # Note: runtime is not used in path
                            $dest_file = Join-Path $native_folder -ChildPath "compiled/$runtime_ver/$platform/$arch/bindings.node"

                            # make sure the containing folder exists
                            $dest_folder = (split-Path $dest_file -Parent)
                            new-item dest_folder -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
                            # copy all *.node native bindings
                            Get-ChildItem $src_folder -Filter "*.node"       | Copy-Item -Destination $dest_folder -Container
                            # additional files to help identify the binary in the future
                            Get-ChildItem $src_folder -Filter "*.forge-meta" | Copy-Item -Destination $dest_folder -Container
                            gci "./node_modules/$module_name/build" -Filter "*config.gypi"         | Copy-Item -Destination $dest_folder -Container
                            Write-Host "electron lib in node location -> $dest_file"
            }
            'electron' {# node-pre-gyp - use the ABIversion for the path (uses less space, better compat)
                            # ./lib/binding/{node_abi}-{platform}-{arch}`
                            # \node_modules\@serialport\bindings\lib\binding\node-v64-win32-x64\bindings.node
                            # Note: runtime is hardcoded as 'node' in path
                            $dest_file = Join-Path $native_folder -ChildPath "lib/binding/node-v$abi_ver-$platform-$arch/bindings.node"
                            # make sure the containing folder exists
                            $dest_folder = (split-Path $dest_file -Parent)
                            new-item $dest_folder -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
                            # copy all *.node native bindings
                            Get-ChildItem $src_folder -Filter "*.node"       | Copy-Item -Destination $dest_folder -Container
                            # additional files to help identify the binary in the future
                            Get-ChildItem $src_folder -Filter "*.forge-meta" | Copy-Item -Destination $dest_folder -Container
                            gci "./node_modules/$module_name/build" -Filter "*config.gypi"         | Copy-Item -Destination $dest_folder -Container
                            Write-Host "electron lib in node location -> $dest_file"
            }
            'prebuildify' { # https://github.com/prebuild/node-gyp-build
                            # <root>/node_modules/@serialport/bindings/prebuilds/<platform>-<arch>\<runtime>abi<abi>.node
                            #todo : file dest copy
                            $dest_file = Join-Path $native_folder -ChildPath "prebuilds/$platform-$arch/($runtime)abi$abi_ver.node"

                            # make sure the containing folder exists
                            $dest_folder = (split-Path $dest_file -Parent)
                            new-item dest_folder -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
                            #copy single file
                            $_ = Copy-Item "./node_modules/$module_name/build/Release/*.node" $dest_file -Force:$Force
                            Write-Host "prebuilify location: -> $dest_file"
                            gci $dest_file | ft Name, Length, CreationTime | Out-Host

            }
            default {
                Write-Warning 'unknown path pattern'
            }
        }
        # Generate documentation source.md
        CreateOriginDoc -file (Join-Path $dest_folder -ChildPath 'origin.md') -module_name $module_name -module_ver $module_ver -runtime $runtime -runtime_ver $runtime_ver -platform $platform -arch $arch -abi_ver $abi_ver
        if ($docs_file){
            # add to documentation.md
            $msg = "   - {0,-8}, {1,-4}, {2}" -f $platform, $arch , ($dest_file.Replace($root_folder,'.'))
            Out-File -InputObject $msg -FilePath $docs_file -Append
        }
    } catch {
        Write-Warning "Error while copying prebuild bindings for runtime $runtime : $runtime_ver, abi: $abi_ver, $platform, $arch"
    }

}

# #########################################################################################################

function CleanReleaseFolder ($module_folder){
    # Always Clean module release folder to prevent the wrong runtime from being blocking other platforms
    Remove-Item "$module_folder/build/Release" -Recurse -Force -ErrorAction SilentlyContinue
    write-host -ForegroundColor Green  "`nCleaned the '$module_folder/build/release' folder,`nto prevent including native modules in the default location and breaking cross-platform portability."

}
# #########################################################################################################
# copy from native_modules --> node_modules
function CopyNativeModules{
    param(  $native_modules, $node_modules  )
    # todo: only copy the .node files ?

    write-host -ForegroundColor Green "Copy all /native_modules into the /node_modules for cross platform packaging"
    Copy-Item -Path (join-path $native_modules '*')-Destination $node_modules -Force -Recurse -PassThru |
        Where-Object {!$_.PSIsContainer} | ForEach-Object{$_.DirectoryName}
}

# #########################################################################################################
# create basic documentation on the module bindings platform and architecture
function CreateOriginDoc{
    param(
        $filename,
        $module_name ,
        $module_ver ,
        $runtime,
        $runtime_ver,
        $platform,
        $arch,
        $abi_ver
    )

    $template = @"
    # Native module binding
    {0}@{1}

    # Target
    runtime     : {2}
    version     : {3}
    platform    : {4}
    arch        : {5}
    abi         : {6}
"@
    $template -f $module_name, $module_ver, $runtime , $runtime_ver , $platform , $arch, $abi_ver |
        Out-File -FilePath $filename -Encoding utf8 -Force:$Force
}
# #########################################################################################################
#  main code
# #########################################################################################################

#Check if script is started in project root folder
if (-not( (Test-Path './package.json') -and (Test-Path './node_modules'))){
    Write-Error 'Please start in root of project. (package.json and node_modules were not found)'
    return -1
}

# this is where our (sub) module lives
$module_folder = Join-Path $root_folder -ChildPath "node_modules/$module_name"
#this is the repo storage location for the native modules
$native_modules = Join-Path $root_folder -ChildPath 'native_modules'
$native_folder = Join-Path $native_modules -ChildPath $module_name


switch ($PSCmdlet.ParameterSetName)
{
    'copyonly' {
        if ( test-path $native_folder -PathType Container) {
            # copy and ALWAYS clean
            CopyNativeModules $native_modules  (Join-Path $root_folder 'node_modules')
            CleanReleaseFolder $module_folder
        } else {
            Write-Warning "$native_modules folder was not found, use pwsh ./scripts/mp-download.ps1"
        }
     }
     'clean'{
        CleanReleaseFolder $module_folder
     }
     'harvest' {
         # get the abi version
         # note input uses $runtime_version ( not .._ver)
        $abi_ver =  getABI $runtime $runtime_version
        HarvestNativeBinding -platform $platform -arch $arch -runtime $runtime -runtime_ver $runtime_version -module_name $module_name -abi_ver $abi_ver
    }

    'download' {
        $package = Get-Content '.\package.json' | ConvertFrom-Json
        # check if the npm dependencies are install
        # NodeJS dependencies
        #    npm install @serialport --save
        #    npm install node-abi --save || --save-dev
        #    npm install node-abi@1.5.0 --save
        # dev only (unless runtime download needed )
        #    npm install prebuild-install --save-dev
        # (c) jos_verlinde@hotmail.com
        # licence MIT

        foreach ($mod in "node-abi","prebuild-install","serialport" ){
            if(-not ( $package.devDependencies."$mod" -or $package.dependencies."$mod") ) {
                Write-Error "Missing npm dependency: $mod. Please run 'npm install $mod --save-dev'"
                return
            }
        }

        # get both sets of versions into a single list {runtime}-{version}
        $VersionList = @()
        foreach ($v in $ElectronVersions) {
            $VersionList=$VersionList + "electron-$v"
        }
        foreach ($v in $NodeVersions) {
            $VersionList=$VersionList + "node-$v"
        }

        # ensure native_modules directory exists
        $_ = new-item $native_modules -ItemType Directory -ErrorAction SilentlyContinue

        # Store doc in native modules folder
        $docs_file = Join-Path $native_modules -ChildPath "included_runtimes.md"
        # generate / append Document for electron-abi versions
        if (Test-Path $docs_file){
            "Includes support for electron/node versions:" | Out-File -filepath $docs_file -Append
        } else {
            "Includes support for electron/node versions:" | Out-File -filepath $docs_file
        }

        # Read target vscode version

        try {
            $version = $package.engines.vscode.Replace('^','')
            if ($version -notin $VSCodeVersions) {
                Write-Host -F Blue "Add VSCode [$version] version from package.json"
                $VSCodeVersions = $VSCodeVersions + $version

            }
        } catch {
            Write-Warning 'No vscode engine version found'
        }

        #Add support for all newer vscode versions based on date ?
        foreach($version in (RecentVSCodeVersions -Last 3) ){
            if ($version -notin $VSCodeVersions) {
                Write-Host -F Blue "Add recent VSCode [$version] version"
                $VSCodeVersions = $VSCodeVersions + $version
            }
        }

        # get/add electron versions for all relevant vscode versions
        foreach ($tag in $VSCodeVersions ){
            $version = ReadVsCodeElectronVersion -GitTag $tag
            if ($version) {
                # Add to documentation
                $ABI_ver = getABI 'electron' $version
                "* VSCode [$tag] uses Electron $version , ABI: $ABI_ver"| Out-File -filepath $docs_file -Append

                if ( "electron-$version" -in $VersionList ) {
                    Write-Host -F Green "VSCode [$tag] uses a known version of Electron: $version , ABI: $ABI_ver"
                }else {
                    Write-Host -F Blue "VSCode [$tag] uses an additional version of Electron: $version ABI: $ABI_ver, that will be used/added to the prebuild versions to download"
                    $VersionList=$VersionList + "electron-$version"
                }
            }
        }
        # sort the list
        if ($VersionList.Count){
            $VersionList= $VersionList | Sort-Object
        }
        # -DetectNodeVersion : add this workstations node version if  specified
        if ( -not $IgnoreNodeVersion) {
            $version = runNodeCommand 'process.versions.node'
            if ( "node-$version" -notin $VersionList ) {
                $VersionList=$VersionList + "node-$version" | Sort-Object
                Write-Host -F Blue "Detected and added NodeJS version $version"
            }
        }

        # show initial listing
        foreach ($item in $VersionList) {
            #split runtime-version
            $runtime, $version = $item.split('-')
            # handle platforms
            $ABI_ver = getABI $runtime $version
            Write-Host -F Blue "$runtime $version uses ABI $ABI_ver"
        }

        #now the processing
        foreach ($item in $VersionList) {
            #split runtime-version
            $runtime, $runtime_ver = $item.split('-')

            # Get the ABI version for node/electron version x.y.z
            $ABI_ver = getABI $runtime $runtime_ver

            # add to documentation
            "* $runtime $runtime_ver uses ABI $ABI_ver" | Out-File -FilePath $docs_file -Append
            foreach ($platform in $platforms){
                foreach ($arch in $architectures){
                    Write-Host -f green "Download prebuild native binding for runtime $runtime : $runtime_ver, abi: $abi_ver, $platform, $arch"
                    $OK = DownloadPrebuild -version $runtime_ver -platform $platform -arch $arch -runtime $runtime
                    if ( $OK ) {
                        # now copy the bindins to native_modules
                        HarvestNativeBinding -platform $platform -arch $arch -runtime $runtime -runtime_ver $runtime_ver -module_name $module_name -abi_ver $abi_ver
                        # add to documentation.md
                        $msg = "   - {0,-8}, {1,-4} " -f $platform, $arch
                        Out-File -InputObject $msg -FilePath $docs_file -Append

                    } else { # no need to show multiple warnings
                        # Write-Warning "no prebuild bindings for electron: $runtime_ver, abi: $abi_ver, $platform, $arch"
                    }
                }
            }
        }

        CleanReleaseFolder $module_folder
        # -NoCopy : to avoid copying
        if (-not $NoCopy) {
            CopyNativeModules $native_modules  (Join-Path $root_folder 'node_modules')
        }
        Write-Host -ForegroundColor blue "Platform bindings are listed in: $docs_file"
    }

    Default {
        Write-Warning "Nothing to do ?"
    }
}
