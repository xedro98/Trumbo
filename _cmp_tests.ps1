$ErrorActionPreference = 'Stop'
$p = 'crates/codegen/xai-grok-pager/src/views/dashboard/state.rs'
$c = Get-Content -Path $p
$ours = $c[5018..11053] -join [Environment]::NewLine
$pat = 'fn ([a-z0-9_]+)\('
$o = [regex]::Matches($ours, $pat) | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$t = [regex]::Matches((Get-Content -Raw 'crates/codegen/xai-grok-pager/src/views/dashboard/state_tests.rs'), $pat) | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
Write-Output ("OURS count=" + @($o).Count)
$o
Write-Output ""
Write-Output ("THEIRS count=" + @($t).Count)
$t
Write-Output ""
Write-Output "IN OURS NOT THEIRS:"
($o | Where-Object { $_ -notin $t })
Write-Output "IN THEIRS NOT OURS:"
($t | Where-Object { $_ -notin $o })