# Download face-api.js models for emotion detection
Write-Host "Downloading face-api.js models..." -ForegroundColor Cyan

# Create models directory
$modelsDir = "public\models"
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
    Write-Host "Created models directory" -ForegroundColor Green
}

# Base URL for models
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"

# Download files
$files = @(
    "tiny_face_detector/tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector/tiny_face_detector_model-shard1",
    "face_expression/face_expression_model-weights_manifest.json",
    "face_expression/face_expression_model-shard1",
    "face_landmark_68/face_landmark_68_model-weights_manifest.json",
    "face_landmark_68/face_landmark_68_model-shard1"
)

foreach ($file in $files) {
    $fileName = Split-Path $file -Leaf
    $url = "$baseUrl/$file"
    $outFile = Join-Path $modelsDir $fileName
    
    Write-Host "Downloading $fileName..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $url -OutFile $outFile
        Write-Host "  Downloaded $fileName" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`nModel download complete!" -ForegroundColor Green
Write-Host "Models saved to: $modelsDir" -ForegroundColor Cyan
