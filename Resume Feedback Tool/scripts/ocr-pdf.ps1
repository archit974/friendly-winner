param(
  [Parameter(Mandatory = $true)]
  [string]$PdfPath,

  [int]$MaxPages = 3
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$script:GenericAsTask = $null
$script:ActionAsTask = $null

function Get-GenericAsTaskMethod {
  if (-not $script:GenericAsTask) {
    $script:GenericAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
      Where-Object { $_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
      Select-Object -First 1
  }

  return $script:GenericAsTask
}

function Get-ActionAsTaskMethod {
  if (-not $script:ActionAsTask) {
    $script:ActionAsTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
      Where-Object { $_.Name -eq "AsTask" -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
      Select-Object -First 1
  }

  return $script:ActionAsTask
}

function Await-Operation($Operation, [Type]$ResultType) {
  $method = Get-GenericAsTaskMethod
  $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  return $task.GetAwaiter().GetResult()
}

function Await-Action($Action) {
  $method = Get-ActionAsTaskMethod
  $task = $method.Invoke($null, @($Action))
  [void]$task.GetAwaiter().GetResult()
}

$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime]
$null = [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType=WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]

$file = Await-Operation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($PdfPath)) ([Windows.Storage.StorageFile])
$document = Await-Operation ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

if (-not $engine) {
  throw "Windows OCR engine is not available for the current user profile."
}

$pageCount = [Math]::Min($document.PageCount, [Math]::Max($MaxPages, 1))
$textParts = New-Object System.Collections.Generic.List[string]

for ($pageIndex = 0; $pageIndex -lt $pageCount; $pageIndex += 1) {
  $page = $null
  $stream = $null

  try {
    $page = $document.GetPage($pageIndex)
    $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $renderOptions = [Windows.Data.Pdf.PdfPageRenderOptions]::new()
    $renderOptions.DestinationWidth = 1800

    Await-Action ($page.RenderToStreamAsync($stream, $renderOptions))
    $stream.Seek(0) | Out-Null

    $decoder = Await-Operation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await-Operation (
      $decoder.GetSoftwareBitmapAsync(
        [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
        [Windows.Graphics.Imaging.BitmapAlphaMode]::Ignore
      )
    ) ([Windows.Graphics.Imaging.SoftwareBitmap])

    $ocrResult = Await-Operation ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    $pageText = ($ocrResult.Text -replace "[ \t]+", " ").Trim()

    if ($pageText) {
      [void]$textParts.Add($pageText)
    }
  } finally {
    if ($page) {
      $page.Dispose()
    }
    if ($stream) {
      $stream.Dispose()
    }
  }
}

$payload = @{
  pageCount = $pageCount
  text = ($textParts -join "`n`n").Trim()
}

$payload | ConvertTo-Json -Compress
