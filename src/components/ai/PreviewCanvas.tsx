import React, { useRef, useEffect } from 'react';

interface PreviewCanvasProps {
  roomImage: string | null;
  furnitureImage: string | null;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  roomImage,
  furnitureImage,
  position,
  scale,
  rotation,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomImgRef = useRef<HTMLImageElement | null>(null);
  const furnitureImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (roomImage) {
      const img = new Image();
      img.src = roomImage;
      img.onload = () => {
        roomImgRef.current = img;
        drawCanvas();
      };
    }
  }, [roomImage]);

  useEffect(() => {
    if (furnitureImage) {
      const img = new Image();
      img.src = furnitureImage;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        furnitureImgRef.current = img;
        drawCanvas();
      };
    }
  }, [furnitureImage]);

  useEffect(() => {
    drawCanvas();
  }, [position, scale, rotation]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw room image
    if (roomImgRef.current) {
      ctx.drawImage(roomImgRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw furniture image
    if (furnitureImgRef.current) {
      ctx.save();
      
      const furnitureWidth = furnitureImgRef.current.width * scale;
      const furnitureHeight = furnitureImgRef.current.height * scale;
      
      ctx.translate(position.x + furnitureWidth / 2, position.y + furnitureHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-(position.x + furnitureWidth / 2), -(position.y + furnitureHeight / 2));
      
      ctx.drawImage(
        furnitureImgRef.current,
        position.x,
        position.y,
        furnitureWidth,
        furnitureHeight
      );
      
      ctx.restore();
    }

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  };

  return (
    <div className="relative bg-stone-100 rounded-2xl overflow-hidden border-2 border-stone-200">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-auto"
      />
      {!roomImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-stone-400 text-lg font-medium">Upload a room image to start</p>
        </div>
      )}
    </div>
  );
};
