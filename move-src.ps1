# PowerShell script to move all files/folders from src/ to project root, merging safely

$srcPath = ".\src"
$rootPath = "."

if (!(Test-Path $srcPath)) {
    Write-Host "src/ folder not found. Nothing to move."
    exit
}

# Move all folders and files from src/ to root, merging and skipping existing files
Get-ChildItem -Path $srcPath | ForEach-Object {
    $item = $_
    $dest = Join-Path $rootPath $item.Name
    if (Test-Path $dest) {
        # If it's a directory, move contents recursively
        if ($item.PSIsContainer) {
            Get-ChildItem -Path $item.FullName | ForEach-Object {
                $subDest = Join-Path $dest $_.Name
                if (Test-Path $subDest) {
                    Write-Warning "SKIPPED: $subDest already exists."
                } else {
                    Move-Item $_.FullName $dest
                }
            }
        } else {
            Write-Warning "SKIPPED: $dest already exists."
        }
    } else {
        Move-Item $item.FullName $rootPath
    }
}

# Remove the src/ folder if empty
if ((Get-ChildItem $srcPath).Count -eq 0) {
    Remove-Item $srcPath -Recurse
    Write-Host "src/ folder deleted."
} else {
    Write-Warning "src/ folder not empty. Please check for any remaining files."
}

Write-Host "Move complete. Please review warnings above, test locally, then delete src/ if all is well."