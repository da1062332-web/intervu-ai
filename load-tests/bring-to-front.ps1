param(
    [string]$TargetClass = "Chrome_WidgetWin_1"
)

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public class ChromeFocus {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public static int ActivateChrome() {
        int count = 0;
        IntPtr HWND_TOPMOST = new IntPtr(-1);
        IntPtr HWND_NOTOPMOST = new IntPtr(-2);
        uint SWP_NOMOVE = 0x0002;
        uint SWP_NOSIZE = 0x0001;
        uint SWP_SHOWWINDOW = 0x0040;

        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;

            StringBuilder cls = new StringBuilder(256);
            GetClassName(hWnd, cls, 256);
            string clsName = cls.ToString();

            if (clsName == "Chrome_WidgetWin_1") {
                StringBuilder title = new StringBuilder(256);
                GetWindowText(hWnd, title, 256);
                string titleStr = title.ToString();

                // Check that it is an actual browser window (not a hidden broker window)
                if (!string.IsNullOrEmpty(titleStr)) {
                    ShowWindow(hWnd, 9); // SW_RESTORE
                    SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
                    SetWindowPos(hWnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
                    SetForegroundWindow(hWnd);
                    Console.WriteLine("Activated Chrome Window: HWND=" + hWnd + " Title='" + titleStr + "'");
                    count++;
                }
            }
            return true;
        }, IntPtr.Zero);

        return count;
    }
}
"@

$activated = [ChromeFocus]::ActivateChrome()
Write-Output "Total activated windows: $activated"
