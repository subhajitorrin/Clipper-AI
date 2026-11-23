# Clipper AI — Landing Page

A modern, responsive, zero-dependency landing page for **Clipper AI** showcasing the autonomous video repurposing pipeline and live demo.

## Features
- **Modern Dark UI**: Designed with Tailwind CSS and Plus Jakarta Sans typography.
- **Embedded Demo Video**: Direct responsive HTML5 video showcase with R2 CDN playback.
- **System Architecture & Feature Breakdown**: Summarizes the distributed worker pipeline, OpenCV speaker tracking, and Deepgram speech-to-text.
- **Standalone & Lightweight**: No Docker, Node, or build step required.

## How to View
Simply open `index.html` in any browser:
```bash
open index.html
```
Or serve it with any local static server:
```bash
# Python
python3 -m http.server 3000

# or npx serve
npx serve .
```
