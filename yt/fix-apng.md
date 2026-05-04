# Fix APNG Animation

Your APNG is looping because the loop count is set in the file metadata.

## Quick Fix Options:

### Option 1: Online Editor (Easiest)
1. Go to https://ezgif.com/apng-maker
2. Click "Upload APNG"
3. Upload `yticon.apng`
4. Click "Split to frames"
5. Adjust settings:
   - **Delay time**: Increase to slow down (e.g., 100ms per frame)
   - **Loop count**: Set to 1 (play once)
6. Click "Make APNG"
7. Download and replace the file

### Option 2: Use APNG Optimizer
1. Go to https://tinypng.com/ or https://squoosh.app/
2. Upload your APNG
3. Look for animation settings
4. Set loop count to 1
5. Download

### Option 3: Command Line (Advanced)
If you have ImageMagick or ffmpeg installed:

```bash
# Extract frames
ffmpeg -i yticon.apng frame_%03d.png

# Reassemble with custom timing (100ms per frame, no loop)
apngasm yticon-fixed.apng frame_*.png 1 100 -l1
```

## What to Change:
- **Frame delay**: Currently probably 50ms, increase to 100-150ms to slow down
- **Loop count**: Set to 1 (play once) or 0 (infinite) - you want 1

## After Fixing:
Replace `yt/yticon.apng` with the fixed version and the animation will:
- Play once on hover
- Have slower, smoother transitions
- Not loop continuously
