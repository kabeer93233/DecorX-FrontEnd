import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RoomUploader } from '../components/ai/RoomUploader';
import { FurnitureSelector } from '../components/ai/FurnitureSelector';
import { PreviewCanvas } from '../components/ai/PreviewCanvas';
import { PositionControls } from '../components/ai/PositionControls';
import { GenerateButton } from '../components/ai/GenerateButton';
import { ResultPreview } from '../components/ai/ResultPreview';
import { BeforeAfterSlider } from '../components/ai/BeforeAfterSlider';
import { products } from '../data/products';
import { generateAIPreview, saveDesign } from '../services/aiService';
import { toast } from 'sonner';
import { Product } from '../types';

export const AIPreview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get('productId');

  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [scale, setScale] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-select product if productId is in query params
  useEffect(() => {
    if (productIdParam) {
      const product = products.find((p) => p.id === productIdParam);
      if (product) {
        setSelectedProduct(product);
        // Set initial scale based on product dimensions
        if (product.width && product.height) {
          const avgDimension = (product.width + product.height) / 2;
          const calculatedScale = Math.min(1.5, Math.max(0.3, avgDimension / 150));
          setScale(calculatedScale);
        }
      }
    }
  }, [productIdParam]);

  const handleGenerate = async () => {
    if (!roomImage || !selectedProduct) {
      toast.error('Please upload a room image and select furniture');
      return;
    }

    setIsGenerating(true);
    setResultImage(null);
    setIsSaved(false);

    try {
      // Simulate AI generation
      await generateAIPreview(roomImage, selectedProduct.image);
      
      // Capture canvas as result
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setResultImage(dataUrl);
        toast.success('Preview generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDesign = () => {
    if (!roomImage || !selectedProduct || !resultImage) return;

    try {
      saveDesign({
        roomImage,
        furnitureImage: selectedProduct.image,
        resultImage,
        productId: selectedProduct.id,
        productName: selectedProduct.productName,
      });
      setIsSaved(true);
      toast.success('Design saved to your profile!');
    } catch (error) {
      toast.error('Failed to save design');
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.download = `decorx-design-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
    toast.success('Design downloaded!');
  };

  const canGenerate = roomImage && selectedProduct && !isGenerating;
  const isVerified =
  localStorage.getItem(
    'isEmailVerified',
  ) === 'true';
  return (
    <div className="min-h-screen bg-[#FFF8F0] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Shop
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-2">
            AI Room <span className="text-orange-500">Designer</span>
          </h1>
          <p className="text-lg text-stone-600">
            Visualize furniture in your space before you buy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Select */}
          <div className="lg:col-span-1 space-y-6">
            <RoomUploader
              onImageUpload={setRoomImage}
              currentImage={roomImage}
            />

            <FurnitureSelector
              products={products}
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
            />
          </div>

          {/* Center Column - Canvas & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <PreviewCanvas
              roomImage={roomImage}
              furnitureImage={selectedProduct?.image || null}
              position={position}
              scale={scale}
              rotation={rotation}
              onCanvasReady={(canvas) => (canvasRef.current = canvas)}
            />

            <PositionControls
              position={position}
              scale={scale}
              rotation={rotation}
              onPositionChange={setPosition}
              onScaleChange={setScale}
              onRotationChange={setRotation}
              disabled={!selectedProduct || !roomImage}
            />

            <GenerateButton
              onClick={() => {

                if (!isVerified) {

                  toast.warning(
                    'Please verify your email first',
                  );

                  return;
                }

                handleGenerate();
              }}
              disabled={!canGenerate}
              isGenerating={isGenerating}
            />

            {/* Result Section */}
            {resultImage && (
              <div className="space-y-6 pt-8 border-t-2 border-stone-200">
                <ResultPreview
                  resultImage={resultImage}
                  onSave={handleSaveDesign}
                  onDownload={handleDownload}
                  isSaved={isSaved}
                />

                <BeforeAfterSlider
                  beforeImage={roomImage!}
                  afterImage={resultImage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-3xl p-8 border border-stone-200">
          <h3 className="text-xl font-bold text-stone-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-500">1</span>
              </div>
              <h4 className="font-semibold text-stone-900 mb-2">Upload Room</h4>
              <p className="text-sm text-stone-600">Upload a photo of your room</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-500">2</span>
              </div>
              <h4 className="font-semibold text-stone-900 mb-2">Select Furniture</h4>
              <p className="text-sm text-stone-600">Choose from our collection</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-500">3</span>
              </div>
              <h4 className="font-semibold text-stone-900 mb-2">Adjust Position</h4>
              <p className="text-sm text-stone-600">Move and resize as needed</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-500">4</span>
              </div>
              <h4 className="font-semibold text-stone-900 mb-2">Generate & Save</h4>
              <p className="text-sm text-stone-600">Get your preview instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};