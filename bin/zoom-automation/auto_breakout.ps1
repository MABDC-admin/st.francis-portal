
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$runnerUrl = "http://localhost:5173/admin/zoom-runner" # Update to production URL when deployed

Write-Host "Opening Production Bridge: $runnerUrl"
Start-Process "msedge.exe" $runnerUrl

Write-Host "Waiting for Zoom Meeting window to initialize..."
timeout /t 30

Write-Host "Waiting for Zoom Meeting window..."
$timeout = 60
$found = $false
$window = $null

for ($i = 0; $i -lt $timeout; $i++) {
    $window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
        [System.Windows.Automation.TreeScope]::Children,
        (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Zoom Meeting"))
    )
    if (-not $window) {
        $window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
            [System.Windows.Automation.TreeScope]::Children,
            (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Zoom Workplace"))
        )
    }
    if ($window) {
        $found = $true
        break
    }
    Start-Sleep -Seconds 1
}

if (-not $found) {
    Write-Error "Could not find Zoom Meeting window."
    exit 1
}

Write-Host "Found Zoom Meeting window. Looking for 'Breakout rooms' button..."
Start-Sleep -Seconds 5 # Wait for UI to settle

# Function to recursively find element by name
function Get-ElementByName {
    param($root, $name)
    $cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $name)
    return $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
}

# Try variations of the name
$breakoutBtn = Get-ElementByName $window "Breakout Rooms"
if (-not $breakoutBtn) { $breakoutBtn = Get-ElementByName $window "Breakout rooms" }
if (-not $breakoutBtn) { $breakoutBtn = Get-ElementByName $window "Breakout" }

if (-not $breakoutBtn) {
    # It might be inside "More"
    Write-Host "'Breakout Rooms' button not found directly. Checking 'More'..."
    $moreBtn = Get-ElementByName $window "More"
    if ($moreBtn) {
        Write-Host "Found 'More' button. Clicking..."
        $invokePattern = $moreBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        Start-Sleep -Seconds 2
        
        # Now search globally for the popup menu item (often distinct window or popup)
        $breakoutBtn = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
            [System.Windows.Automation.TreeScope]::Descendants,
            (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Breakout Rooms"))
        )
        if (-not $breakoutBtn) {
            $breakoutBtn = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
                [System.Windows.Automation.TreeScope]::Descendants,
                (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Breakout rooms"))
            )
        }
    }
}

if ($breakoutBtn) {
    Write-Host "Clicking '$($breakoutBtn.Current.Name)'..."
    try {
        $invokePattern = $breakoutBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
    }
    catch {
        Write-Error "Failed to click button. It might be disabled or off-screen."
        exit 1
    }
}

else {
    Write-Host "ERROR: Could not find 'Breakout Rooms' button." -ForegroundColor Red
    Write-Host "--- DEBUG INFO: Available Elements in Main Window ---"
    if ($window) {
        $allElements = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
        foreach ($e in $allElements) {
            if (-not [string]::IsNullOrWhiteSpace($e.Current.Name)) {
                # Only log interesting ones to avoid spam
                if ($e.Current.LocalizedControlType -eq "button" -or $e.Current.Name -match "Breakout" -or $e.Current.Name -match "Rooms") {
                    Write-Host "Found: '$($e.Current.Name)' (Type: $($e.Current.LocalizedControlType))" -ForegroundColor Cyan
                }
            }
        }
    }
    Write-Host "-------------------------------------------------"
    exit 1
}

Write-Host "Waiting for Breakout Rooms window..."
Start-Sleep -Seconds 3

# Wait loop for the popup window
$brWindow = $null
for ($i = 0; $i -lt 10; $i++) {
    # Search for any window with "Breakout Rooms" in the title
    $candidates = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Children,
        [System.Windows.Automation.Condition]::TrueCondition
    )
    foreach ($c in $candidates) {
        if ($c.Current.Name -match "Breakout Rooms") {
            $brWindow = $c
            break
        }
    }
    if ($brWindow) { break }
    Start-Sleep -Seconds 1
}

if ($brWindow) {
    Write-Host "Found Popup Window: '$($brWindow.Current.Name)'"
    $openAllBtn = Get-ElementByName $brWindow "Open All Rooms"
    
    if (-not $openAllBtn) {
        # Check recursive descendants
        $openAllBtn = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
            [System.Windows.Automation.TreeScope]::Descendants,
            (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Open All Rooms"))
        )
    }

    if ($openAllBtn) {
        Write-Host "Found 'Open All Rooms'. Clicking..."
        $invokePattern = $openAllBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        Write-Host "SUCCESS: Breakout Rooms Opened."
    }
    else {
        Write-Host "ERROR: Could not find 'Open All Rooms' button inside the popup." -ForegroundColor Red
        Write-Host "--- DEBUG INFO: Available Elements in Popup ---"
        if ($brWindow) {
            $allElements = $brWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
            foreach ($e in $allElements) {
                if (-not [string]::IsNullOrWhiteSpace($e.Current.Name)) {
                    Write-Host "Found: '$($e.Current.Name)' (Type: $($e.Current.LocalizedControlType))"
                }
            }
        }
        Write-Host "----------------------------------------------"
        exit 1
    }
}
else {
    Write-Host "ERROR: Could not find 'Breakout Rooms' popup window." -ForegroundColor Red
    exit 1
}
