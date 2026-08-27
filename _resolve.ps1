$ErrorActionPreference = 'Stop'
$p = 'D:\Torch\trumbo-build\crates\codegen\xai-grok-pager\src\views\dashboard\state.rs'
$raw = [IO.File]::ReadAllText($p)
$ll = $raw.IndexOf('<<<<<<< HEAD')
$gt = $raw.IndexOf('>>>>>>> upstream/main')
if ($ll -lt 0 -or $gt -lt 0) { throw 'markers not found' }
$cr = [string][char]13 + [char]10
$lf = [string][char]10
$nl = if ($raw.Contains($cr)) { $cr } else { $lf }
$head = $raw.Substring(0, $ll)
$tail = $raw.Substring($gt + '>>>>>>> upstream/main'.Length)
$new = $head + '#[path = "state_tests.rs"]' + $nl + 'mod tests;' + $tail
[IO.File]::WriteAllText($p, $new, (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('LEN new=' + $new.Length)
$rem = ([regex]::Matches($new, '(?m)^(<<<<<<<|=======|>>>>>>>)')).Count
Write-Output ('REMAINING MARKERS=' + $rem)