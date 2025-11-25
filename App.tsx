import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { CompareSlider } from './components/CompareSlider';
import { ChatInterface } from './components/ChatInterface';
import { StyleSelector } from './components/StyleSelector';
import { Button } from './components/Button';
import { generateDesignImage } from './services/geminiService';

const App = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Image size too large. Please upload an image under 10MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null); // Reset generated on new upload
        setError(null);
        setSelectedStyle(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStyleSelect = async (style: string) => {
    if (!originalImage || isGenerating) return;
    
    setSelectedStyle(style);
    setError(null);
    setIsGenerating(true);

    try {
      // Remove header prefix for API call
      const base64Data = originalImage.split(',')[1];
      const result = await generateDesignImage(base64Data, style);
      setGeneratedImage(result.imageUrl);
    } catch (err) {
      setError("Failed to generate design. Please try a different style or image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineDesign = async (prompt: string) => {
    if (!originalImage || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
        const base64Data = originalImage.split(',')[1];
        // Pass the refine prompt to the image generator
        const result = await generateDesignImage(base64Data, selectedStyle || 'Modern', prompt);
        setGeneratedImage(result.imageUrl);
    } catch (err) {
         setError("Failed to refine design.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-brand-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1a1a1a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Lumina AI</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 lg:h-[calc(100vh-4rem)]">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Panel: Visualizer & Controls */}
          <div className="lg:col-span-8 flex flex-col space-y-6 h-full overflow-y-auto pb-10 lg:pb-0 scrollbar-hide">
            
            {/* 1. Upload Section (If no image) */}
            {!originalImage && (
              <div 
                className="flex-1 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-12 bg-gray-900/50 hover:bg-gray-900 hover:border-brand-500 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl">
                  <Upload className="w-10 h-10 text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Upload your room</h2>
                <p className="text-gray-400 text-center max-w-sm mb-6">
                  Take a photo of your living room, bedroom, or kitchen and let our AI reimagine it instantly.
                </p>
                <Button variant="primary" size="lg">
                  Select Photo
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* 2. Visualizer (If image exists) */}
            {originalImage && (
              <div className="flex flex-col space-y-6">
                
                {/* Visualizer Area */}
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border border-gray-800 aspect-video">
                  {generatedImage ? (
                    <CompareSlider 
                      originalImage={originalImage} 
                      generatedImage={generatedImage} 
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <img 
                        src={originalImage} 
                        alt="Original Room" 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isGenerating ? 'opacity-50 blur-sm' : ''}`} 
                      />
                      {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-brand-100 font-medium animate-pulse">Designing your new room...</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Reset Button */}
                  <div className="absolute top-4 right-4 z-20">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setOriginalImage(null);
                        setGeneratedImage(null);
                        setSelectedStyle(null);
                      }}
                      className="backdrop-blur-md bg-gray-900/60 hover:bg-gray-900/80"
                    >
                      New Upload
                    </Button>
                  </div>
                </div>

                {/* Controls Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-200">Choose a Style</h3>
                    {selectedStyle && (
                        <span className="text-xs uppercase tracking-widest text-brand-400 font-bold">{selectedStyle}</span>
                    )}
                  </div>
                  
                  <StyleSelector 
                    selectedStyle={selectedStyle} 
                    onSelect={handleStyleSelect}
                    disabled={isGenerating}
                  />
                  
                  {error && (
                    <div className="flex items-center text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Right Panel: Chat Interface */}
          <div className="lg:col-span-4 h-[500px] lg:h-full rounded-2xl overflow-hidden border border-gray-800 shadow-xl bg-gray-900/50 backdrop-blur flex flex-col">
            <ChatInterface 
              initialContextImage={generatedImage?.split(',')[1] || originalImage?.split(',')[1]}
              currentStyle={selectedStyle || 'Original'}
              onUpdateDesignRequest={handleRefineDesign}
            />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;