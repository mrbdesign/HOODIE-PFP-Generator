# PFP Overlay Meme Generator Setup Guide

## New Feature: PFP Overlay Mode

Your meme generator now has two modes:
1. **Location Meme** - Original location-based meme (unchanged)
2. **PFP Overlay** - New feature to overlay the mascot on top of user's profile picture

## Setup Instructions

### 1. Add the Overlay Image

The overlay mascot image needs to be saved in the public folder:

**File path:** `public/images/overlay-mascot.png`

#### How to save the image:

1. You provided a neon green mascot image in the chat
2. Right-click on that image → "Save image as..."
3. Save it with the filename: `overlay-mascot.png`
4. Place it in the `public/images/` folder

Alternatively, if you have the image file locally:
1. Copy the image file to `public/images/overlay-mascot.png`

### 2. Features of the New PFP Overlay Mode

- **Upload PFP**: Users can upload their profile picture
- **Drag**: Click and drag their PFP to position it under the overlay
- **Scale**: Use the + and - buttons to zoom in/out on the PFP
- **Reset**: Reset position and scale to defaults
- **Generate**: Create the final meme with one click
- **Export**: Download, copy to clipboard, or share the meme

### 3. How Users Interact

1. Click on the "PFP Overlay" tab
2. Upload their profile picture
3. Drag their PFP to position it how they like
4. Use zoom buttons to adjust the size
5. Click "Generate Meme" to create the final image
6. Download, copy to clipboard, or share!

## Component Files

- **PFPOverlayGenerator.tsx** - Main overlay component with drag/scale functionality
- **MemeGenerator.tsx** - Updated to include mode toggle between location and overlay

## Image Requirements

- **Format**: PNG (transparent background recommended) or any image format
- **Size**: The component displays at 400x400px
- **Recommendation**: A PNG with transparency so you can see the user's PFP around the overlay
