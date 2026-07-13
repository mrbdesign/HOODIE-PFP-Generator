'use client';

import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

interface PFPPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const PFPOverlayGenerator = () => {
  const [pfpImage, setPfpImage] = useState<string | null>(null);
  const [position, setPosition] = useState<PFPPosition>({ x: 0, y: 0, scale: 1, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [memeUrl, setMemeUrl] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef<{
    distance: number;
    angle: number;
    center: { x: number; y: number };
    positionX: number;
    positionY: number;
    scale: number;
    rotation: number;
  } | null>(null);

  // Keep a ref to the latest position so multi-pointer gestures can read it reliably.
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPfpImage(e.target?.result as string);
        setPosition({ x: 0, y: 0, scale: 1, rotation: 0 });
        setMemeUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const getDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const getAngle = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);

  const getCenter = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  // Handle drag start for both mouse and touch via pointer events
  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    const newPoint = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, newPoint);

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (pointers.current.size === 1) {
      setIsDragging(true);
      setDragStart(newPoint);
      gestureStart.current = null;
    } else if (pointers.current.size === 2) {
      setIsDragging(false);
      const [p1, p2] = Array.from(pointers.current.values());
      const distance = getDistance(p1, p2);
      const angle = getAngle(p1, p2);
      const center = getCenter(p1, p2);
      const currentPosition = positionRef.current;

      gestureStart.current = {
        distance,
        angle,
        center,
        positionX: currentPosition.x,
        positionY: currentPosition.y,
        scale: currentPosition.scale,
        rotation: currentPosition.rotation,
      };
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 1 && isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setPosition((prev) => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (pointers.current.size === 2 && gestureStart.current) {
        const [p1, p2] = Array.from(pointers.current.values());
        const distance = getDistance(p1, p2);
        const angle = getAngle(p1, p2);
        const center = getCenter(p1, p2);
        const scaleFactor = distance / gestureStart.current.distance;
        const newScale = clamp(gestureStart.current.scale * scaleFactor, 0.5, 3);
        const newRotation =
          gestureStart.current.rotation + (angle - gestureStart.current.angle);
        const deltaCenter = {
          x: center.x - gestureStart.current.center.x,
          y: center.y - gestureStart.current.center.y,
        };

        setPosition((prev) => ({
          ...prev,
          x: gestureStart.current!.positionX + deltaCenter.x,
          y: gestureStart.current!.positionY + deltaCenter.y,
          scale: newScale,
          rotation: newRotation,
        }));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);

      if (pointers.current.size === 0) {
        setIsDragging(false);
        gestureStart.current = null;
      } else if (pointers.current.size === 1) {
        const remaining = pointers.current.values().next().value;
        if (!remaining) {
          setIsDragging(false);
          gestureStart.current = null;
          return;
        }

        setIsDragging(true);
        setDragStart({ x: remaining.x, y: remaining.y });
        gestureStart.current = null;
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
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
      const dataUrl = await toPng(canvasRef.current, {
        quality: 0.95,
        cacheBust: true,
      });
      setMemeUrl(dataUrl);
    } catch (error) {
      console.error('Error generating meme:', error);
      try {
        const fallbackUrl = await toPng(canvasRef.current, {
          quality: 0.95,
          cacheBust: true,
        });
        setMemeUrl(fallbackUrl);
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError);
        alert('Failed to generate the image. Check the console for details.');
      }
    }
  };

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const dataUrlToBlob = (dataUrl: string) => {
    const [header, base64] = dataUrl.split(',');
    const contentType = header.match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      array[i] = binary.charCodeAt(i);
    }

    return new Blob([array], { type: contentType });
  };

  // Download meme
  const downloadMeme = async () => {
    if (!memeUrl) return;

    const blob = dataUrlToBlob(memeUrl);

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], 'hoodie-meme.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'HOODIE meme',
            text: 'Save or share this generated image',
          });
          return;
        }
      } catch (error) {
        console.warn('Web Share failed, falling back to download:', error);
      }
    }

    if (!isMobile) {
      const link = document.createElement('a');
      link.href = memeUrl;
      link.download = 'hoodie-meme.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  };

  // Copy/share to clipboard
  const copyToClipboard = async () => {
    if (!memeUrl) return;

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'HOODIE meme',
          text: 'Here is my generated HOODIE meme',
          url: memeUrl,
        });
        return;
      } catch (shareError) {
        console.warn('Mobile share fallback failed:', shareError);
      }
    }

    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const blob = dataUrlToBlob(memeUrl);
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('Meme copied to clipboard!');
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(memeUrl);
        alert('Meme URL copied to clipboard!');
        return;
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = memeUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Meme URL copied to clipboard!');
    } catch (fallbackError) {
      console.error('Fallback text copy failed:', fallbackError);
      alert('Copy failed — please use the browser share feature.');
    }
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 pb-0" style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', paddingBottom: 0 }}>
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center" style={{ color: '#CCFF00' }}>
        HOODIE generator
      </h1>
      <p className="text-center text-base sm:text-lg mb-4 text-[#27AE60]">
        the hood stays on.
      </p>
      <p className="text-center mb-8 text-sm sm:text-base" style={{ color: '#27AE60' }}>
        upload your pic + position it in the hoodie
      </p>

      {/* Buy HOODIE Button */}
      <div className="mb-8 text-center">
        <a
          href="https://app.uniswap.org/explore/tokens/robinhood/0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full sm:w-auto px-6 sm:px-12 py-4 text-white font-bold rounded-lg hover:opacity-80 transition text-lg sm:text-xl"
          style={{ backgroundColor: '#CCFF00', color: '#000000' }}
        >
          💰 BUY $HOODIE
        </a>
      </div>

      {/* Image Upload */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3" style={{ color: '#27AE60' }}>
          upload your photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-4 py-3 border-2 rounded-lg cursor-pointer transition text-sm sm:text-base"
          style={{ borderColor: '#27AE60', backgroundColor: '#0F0F0F', color: '#27AE60' }}
        />
      </div>

      {/* Canvas with Overlay */}
      <div className="mb-8">
        <div
          ref={containerRef}
          className="relative mx-auto rounded-lg overflow-hidden bg-white border-2 shadow-lg aspect-square w-full max-w-[500px]"
          style={{
            cursor: pfpImage ? (isDragging ? 'grabbing' : 'grab') : 'default',
            borderColor: '#27AE60',
            touchAction: 'none',
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
            <img
              src="/images/overlay-mascot.png"
              alt="hoodie overlay"
              className="absolute inset-0 pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                zIndex: 10,
                userSelect: 'none',
              }}
              draggable={false}
            />

            {/* PFP Image - On top of overlay when uploaded */}
            {pfpImage && (
              <img
                src={pfpImage}
                alt="your pfp"
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${position.scale})`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transformOrigin: 'top left',
                  zIndex: 5,
                  touchAction: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
                onPointerDown={handlePointerDown}
              />
            )}

          </div>
        </div>

        {/* Instructions */}
        {pfpImage && (
          <div className="text-center mt-3">
            <p className="text-sm text-[#27AE60]">
              drag to move • pinch to zoom and rotate
            </p>
            <p className="text-xs text-[#27AE60] mt-1">
              two-finger rotate on mobile
            </p>
          </div>
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
            + zoom
          </button>
          <button
            onClick={() => handleScaleChange(-0.1)}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: '#27AE60' }}
          >
            - zoom
          </button>
          <button
            onClick={resetPosition}
            className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-80 transition"
            style={{ backgroundColor: '#444444' }}
          >
            reset
          </button>
        </div>
      )}

      {/* Generate Button */}
      {pfpImage && (
        <div className="text-center">
          <button
            onClick={generateMeme}
            className="px-8 py-3 text-white font-bold rounded-lg hover:opacity-80 transition text-lg"
            style={{ backgroundColor: '#27AE60' }}
          >
            generate meme
          </button>
        </div>
      )}

      {/* Preview and Export */}
      {memeUrl && (
        <div className="space-y-6 mt-6">
          <div className="text-center">
            <img src={memeUrl} alt="generated meme" className="mx-auto rounded-lg max-w-full shadow-lg" />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={downloadMeme}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-80 transition text-base"
              style={{ backgroundColor: '#27AE60' }}
            >
              📥 download image
            </button>
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-80 transition text-base"
              style={{ backgroundColor: '#27AE60' }}
            >
              📋 copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PFPOverlayGenerator;
