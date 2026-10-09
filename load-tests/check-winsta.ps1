Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinstaCheck {
    [DllImport("user32.dll")]
    public static extern IntPtr GetProcessWindowStation();
    [DllImport("user32.dll")]
    public static extern IntPtr GetThreadDesktop(int dwThreadId);
    [DllImport("kernel32.dll")]
    public static extern int GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
}
"@

$hwinsta = [WinstaCheck]::GetProcessWindowStation()
$sb = New-Object System.Text.StringBuilder 256
$needed = 0
$res1 = [WinstaCheck]::GetUserObjectInformation($hwinsta, 2, $sb, 256, [ref]$needed)
Write-Output "WindowStation: $($sb.ToString()) (Success: $res1, Handle: $hwinsta)"

$hdesk = [WinstaCheck]::GetThreadDesktop([WinstaCheck]::GetCurrentThreadId())
$sbDesk = New-Object System.Text.StringBuilder 256
$res2 = [WinstaCheck]::GetUserObjectInformation($hdesk, 2, $sbDesk, 256, [ref]$needed)
Write-Output "Desktop: $($sbDesk.ToString()) (Success: $res2, Handle: $hdesk)"
