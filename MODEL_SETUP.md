# Face-API.js Model Setup

## Required Models

You need to download these face-api.js models and place them in `/public/models/`:

1. **tiny_face_detector** - Lightweight face detection
2. **face_expression** - Emotion recognition  
3. **face_landmark_68** - Facial landmarks (68 points)

## Download Instructions

### Option 1: Manual Download

1. Go to: https://github.com/justadudewhohacks/face-api.js-models
2. Download these folders:
   - `tiny_face_detector_model-weights_manifest.json` and `.shard1`
   - `face_expression_model-weights_manifest.json` and `.shard1`
   - `face_landmark_68_model-weights_manifest.json` and `.shard1`

3. Create directory structure:
```
public/
  models/
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_expression_model-weights_manifest.json
    face_expression_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_landmark_68_model-shard1
```

### Option 2: Use Git (Easier)

```bash
# Navigate to public directory
cd public

# Clone the models repository
git clone https://github.com/justadudewhohacks/face-api.js-models.git temp_models

# Create models directory
mkdir models

# Copy required models
cp temp_models/tiny_face_detector/* models/
cp temp_models/face_expression/* models/
cp temp_models/face_landmark_68/* models/

# Clean up
rm -rf temp_models
```

### Option 3: Download Script (PowerShell)

Run this in PowerShell from your project root:

```powershell
# Create models directory
New-Item -ItemType Directory -Force -Path public\models

# Download models
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"

# Tiny Face Detector
Invoke-WebRequest -Uri "$baseUrl/tiny_face_detector/tiny_face_detector_model-weights_manifest.json" -OutFile "public\models\tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "$baseUrl/tiny_face_detector/tiny_face_detector_model-shard1" -OutFile "public\models\tiny_face_detector_model-shard1"

# Face Expression
Invoke-WebRequest -Uri "$baseUrl/face_expression/face_expression_model-weights_manifest.json" -OutFile "public\models\face_expression_model-weights_manifest.json"
Invoke-WebRequest -Uri "$baseUrl/face_expression/face_expression_model-shard1" -OutFile "public\models\face_expression_model-shard1"

# Face Landmark 68
Invoke-WebRequest -Uri "$baseUrl/face_landmark_68/face_landmark_68_model-weights_manifest.json" -OutFile "public\models\face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "$baseUrl/face_landmark_68/face_landmark_68_model-shard1" -OutFile "public\models\face_landmark_68_model-shard1"

Write-Host "✅ Models downloaded successfully!"
```

## Verify Installation

After downloading, your `/public/models/` directory should contain:

- ✅ tiny_face_detector_model-weights_manifest.json
- ✅ tiny_face_detector_model-shard1
- ✅ face_expression_model-weights_manifest.json
- ✅ face_expression_model-shard1
- ✅ face_landmark_68_model-weights_manifest.json
- ✅ face_landmark_68_model-shard1

## Total Size

Approximately 5-6 MB total

## Troubleshooting

If models fail to load:

1. Check browser console for 404 errors
2. Verify files are in `/public/models/` (not `/src/models/`)
3. Ensure file names match exactly (case-sensitive)
4. Try clearing browser cache
5. Restart development server

## Next Steps

After models are installed:

1. Restart your dev server: `npm run dev`
2. Open browser at http://localhost:5175/
3. Allow webcam permission
4. Check console for "✅ Face detection models loaded successfully!"
