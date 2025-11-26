import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadedImage, PdfSettings, PageSize, PageOrientation, ImageFit } from './types';
import { X, ArrowLeft, ArrowRight, Download, FileImage, Trash2, GripVertical } from 'lucide-react';
import { generatePdf } from './utils/pdfUtils';

const DEFAULT_SETTINGS: PdfSettings = {
  pageSize: PageSize.A4,
  orientation: PageOrientation.AUTO,
  margin: 10,
  imageFit: ImageFit.CONTAIN,
  filename: 'images.pdf'
};

const App: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []); // Only on unmount generally, but tricky with state updates.
  // Better approach: when removing specific image, revoke its url. 
  // We'll rely on browser cleanup for simplicity in this demo scope, 
  // or simple manual revoke when removing from state.

  const handleUpload = (files: File[]) => {
    const newImages = files.map(file => {
      const url = URL.createObjectURL(file);
      // We need image dimensions for ratio calculations. 
      // We load them async, but for state simplicity we can add them later or just load img object
      // Let's create a temporary object and update it once loaded.
      const id = Math.random().toString(36).substring(7);
      
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImages(prev => prev.map(p => p.id === id ? { ...p, width: img.width, height: img.height } : p));
      };

      return {
        id,
        file,
        previewUrl: url,
        width: 0, 
        height: 0, 
        name: file.name,
        type: file.type
      };
    });

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    const img = images.find(i => i.id === id);
    if (img) URL.revokeObjectURL(img.previewUrl);
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      setImages(newImages);
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    // Delay slightly to let UI show processing state
    setTimeout(async () => {
      try {
        await generatePdf(images, settings);
      } catch (error) {
        console.error("PDF generation failed", error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  // Convert first image to base64 for Gemini if needed
  const [firstImageBase64, setFirstImageBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (images.length > 0) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFirstImageBase64(reader.result as string);
      };
      reader.readAsDataURL(images[0].file);
    } else {
      setFirstImageBase64(undefined);
    }
  }, [images]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <FileImage size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Smart Image to PDF</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {images.length > 0 && (
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {images.length} Image{images.length !== 1 ? 's' : ''}
                </span>
             )}
            <button
              onClick={handleDownload}
              disabled={images.length === 0 || isProcessing}
              className={`
                flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-sm
                ${images.length === 0 || isProcessing
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Image Management */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Upload Area */}
            <ImageUploader onUpload={handleUpload} />

            {/* Image List */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700">Image Sequence</h2>
                    <button 
                      onClick={() => {
                        if(confirm('Clear all images?')) {
                          setImages([]);
                          setSettings(prev => ({...prev, filename: DEFAULT_SETTINGS.filename}));
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Clear All
                    </button>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                    {images.map((img, idx) => (
                      <div key={img.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                        <span className="text-slate-400 font-mono text-sm w-6 text-center">{idx + 1}</span>
                        
                        <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                          <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate" title={img.name}>{img.name}</p>
                          <p className="text-xs text-slate-500">
                            {img.width > 0 ? `${img.width}x${img.height}px` : 'Loading...'} • {(img.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => moveImage(idx, 'left')}
                            disabled={idx === 0}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-20 transition-colors"
                            title="Move Up"
                          >
                             <ArrowLeft size={18} className="rotate-90 sm:rotate-0" />
                          </button>
                          <button 
                             onClick={() => moveImage(idx, 'right')}
                             disabled={idx === images.length - 1}
                             className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-20 transition-colors"
                             title="Move Down"
                          >
                             <ArrowRight size={18} className="rotate-90 sm:rotate-0" />
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-2" />
                          <button 
                            onClick={() => removeImage(img.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            
            {images.length === 0 && (
              <div className="text-center py-12">
                 <p className="text-slate-400">No images selected yet.</p>
              </div>
            )}
          </div>

          {/* Right Panel: Settings */}
          <div className="lg:col-span-4">
             <SettingsPanel 
                settings={settings} 
                onSettingsChange={setSettings} 
                firstImageBase64={firstImageBase64}
             />
             
             {/* Info Card */}
             <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Lossless Quality</p>
                <p>
                  Images are embedded directly into the PDF without re-compression when possible. 
                  Use "Fit to Page" for standard documents, or "Page size equals image size" for maximum fidelity.
                </p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
