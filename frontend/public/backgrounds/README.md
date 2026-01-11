# Background Images

Add your background images here. The animated background component will cycle through these images every 5 seconds.

## How to add images:

1. Add your images to this folder (`/public/backgrounds/`)
2. Name them: `bg1.jpg`, `bg2.jpg`, `bg3.jpg`, `bg4.jpg`, etc.
3. Update the image paths in:
   - `Dashboard.tsx` (line ~48)
   - `CharactersPage.tsx` (line ~196)

## Recommended:
- Image format: JPG or PNG
- Image size: 1920x1080 or larger
- File size: Keep under 2MB per image for better performance

## Example:
```
/backgrounds/bg1.jpg
/backgrounds/bg2.jpg
/backgrounds/bg3.jpg
/backgrounds/bg4.jpg
```

The component will automatically cycle through all images in the array every 5 seconds.
