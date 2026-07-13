'use client';

import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

interface PFPPosition {
  x: number;
  y: number;
  scale: number;
}

const PFPOverlayGenerator = () => {
  const [pfpImage, setPfpImage] = useState<string | null>(null);
  const [position, setPosition] = useState<PFPPosition>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [memeUrl, setMemeUrl] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 500;

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPfpImage(e.target?.result as string);
        setPosition({ x: 0, y: 0, scale: 1 });
        setMemeUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition((prev) => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handle scale change
  const handleScaleChange = (delta: number) => {
    setPosition((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
    }));
  };

  // Generate final meme image
  const generateMeme = async () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = await toPng(canvasRef.current, { quality: 0.95 });
      setMemeUrl(dataUrl);
    } catch (error) {
      console.error('Error generating meme:', error);
    }
  };

  // Download meme
  const downloadMeme = () => {
    if (!memeUrl) return;
    const link = document.createElement('a');
    link.href = memeUrl;
    link.download = 'meme.png';
    link.click();
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!memeUrl) return;
    try {
      const blob = await fetch(memeUrl).then((res) => res.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      alert('Meme copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8" style={{ backgroundColor: '#1A1A1A', borderRadius: '12px' }}>
      <h1 className="text-4xl font-bold mb-2 text-center" style={{ color: '#CCFF00' }}>
        HOODIE generator
      </h1>
      <p className="text-center mb-8" style={{ color: '#27AE60' }}>
        Upload your photo and position it under the overlay
      </p>

      {/* Buy HOODIE Button */}
      <div className="mb-8 text-center">
        <a
          href="https://app.uniswap.org/explore/tokens/robinhood/0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-12 py-5 text-white font-bold rounded-lg hover:opacity-80 transition text-xl"
          style={{ backgroundColor: '#CCFF00', color: '#000000' }}
        >
          💰 BUY $HOODIE
        </a>
      </div>

      {/* Image Upload */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3" style={{ color: '#27AE60' }}>
          Upload Your Photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-4 py-3 border-2 rounded-lg cursor-pointer transition"
          style={{ borderColor: '#27AE60', backgroundColor: '#0F0F0F', color: '#27AE60' }}
        />
      </div>

      {/* Canvas with Overlay */}
      <div className="mb-8">
        <div
          ref={containerRef}
          className="relative mx-auto rounded-lg overflow-hidden bg-white border-2 shadow-lg"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            cursor: pfpImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
            borderColor: '#27AE60',
          }}
        >
          {/* Canvas for export */}
          <div
            ref={canvasRef}
            className="relative w-full h-full"
            style={{
              backgroundColor: '#ffffff',
            }}
          >
            {/* Overlay Image - Always visible */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "url('/images/overlay-mascot.png')",
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                zIndex: 10,
              }}
            />

            {/* PFP Image - On top of overlay when uploaded */}
            {pfpImage && (
              <img
                src={pfpImage}
                alt="Your PFP"
                className="absolute"
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: `scale(${position.scale})`,
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  objectFit: 'cover',
                  transformOrigin: 'top left',
                  zIndex: 5,
                }}
                onMouseDown={handleMouseDown}
              />
            )}

          </div>
        </div>

        {/* Instructions */}
        {pfpImage && (
          <p className="text-center text-sm mt-3" style={{ color: '#27AE60' }}>
            Drag to move • Use + and - buttons to scale
          </p>
        )}
      </div>

      {/* Controls */}
      {pfpImage && (
        <div className="mb-8 flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => handleScaleChange(0.1)}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: '#27AE60' }}
          >
            + Zoom
          </button>
          <button
            onClick={() => handleScaleChange(-0.1)}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: '#27AE60' }}
          >
            - Zoom
          </button>
          <button
            onClick={resetPosition}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: '#444444' }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Generate Button */}
      {pfpImage && (
        <div className="mb-8 text-center">
          <button
            onClick={generateMeme}
            className="px-8 py-3 text-white font-bold rounded-lg hover:opacity-80 transition text-lg"
            style={{ backgroundColor: '#27AE60' }}
          >
            Generate Meme
          </button>
        </div>
      )}

      {/* Preview and Export */}
      {memeUrl && (
        <div className="space-y-6">
          <div className="text-center">
            <img src={memeUrl} alt="Generated Meme" className="mx-auto rounded-lg max-w-full shadow-lg" />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={downloadMeme}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-80 transition text-base"
              style={{ backgroundColor: '#27AE60' }}
            >
              📥 Download Image
            </button>
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-80 transition text-base"
              style={{ backgroundColor: '#27AE60' }}
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PFPOverlayGenerator;
