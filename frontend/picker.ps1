Add-Type -AssemblyName System.Windows.Forms
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.MinimizeBox = $false
$form.MaximizeBox = $false
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
$form.Show()

$f = New-Object System.Windows.Forms.FolderBrowserDialog
$f.Description = "Select Invoice Save Folder"
$f.ShowNewFolderButton = $true
$f.AutoUpgradeEnabled = $true

if ($args.Count -gt 0 -and $args[0] -ne "") {
    $cleanPath = $args[0].Trim().Replace('/', '\')
    if (Test-Path $cleanPath) {
        $f.SelectedPath = $cleanPath
    }
}

$res = $f.ShowDialog($form)
if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $normalized = $f.SelectedPath.Replace('\', '/')
    [Console]::Out.Write($normalized)
}
$form.Dispose()
