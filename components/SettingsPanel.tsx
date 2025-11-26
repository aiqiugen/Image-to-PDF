import React, { useState } from 'react';
import { PdfSettings, PageSize, PageOrientation, ImageFit } from '../types';
import { Settings, Maximize, FileText, Layout, Wand2 } from 'lucide-react';
import { generateSmartFilename } from '../services/geminiService';

interface SettingsPanelProps {
  settings: PdfSettings;
  onSettingsChange: (newSettings: PdfSettings) => void;
  firstImageBase64?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, firstImageBase64 }) => {
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  const updateField = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleAutoName = async () => {
    if (!firstImageBase64) return;
    setIsGeneratingName(true);
    try {
      const name = await generateSmartFilename(firstImageBase64);
      updateField('filename', name);
    } catch (e) {
      console.error(e);
      // Fallback
      updateField('filename', `scan_${new Date().toISOString().slice(0,10)}.pdf`);
    } finally {
      setIsGeneratingName(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8 h-fit sticky top-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Settings className="text-indigo-600" size={20} />
        <h2 className="font-semibold text-slate-800">PDF Configuration</h2>
      </div>

      {/* Filename */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Output Filename</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={settings.filename}
            onChange={(e) => updateField('filename', e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="document.pdf"
          />
          <button 
            onClick={handleAutoName}
            disabled={!firstImageBase64 || isGeneratingName}
            title="Generate name with AI"
            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {isGeneratingName ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Wand2 size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Page Size */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText size={16} /> Page Size
        </label>
        <div className="grid grid-cols-1 gap-2">
          {Object.values(PageSize).map((size) => (
            <label key={size} className={`
              flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${settings.pageSize === size 
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700' 
                : 'border-slate-200 hover:bg-slate-50'
              }
            `}>
              <input 
                type="radio" 
                name="pageSize"
                className="hidden"
                checked={settings.pageSize === size} 
                onChange={() => updateField('pageSize', size)}
              />
              <span className="capitalize">{size.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Orientation */}
      {settings.pageSize !== PageSize.FIT_IMAGE && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Layout size={16} /> Orientation
          </label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {Object.values(PageOrientation).map((ori) => (
              <button
                key={ori}
                onClick={() => updateField('orientation', ori)}
                className={`
                  flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize
                  ${settings.orientation === ori 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {ori}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Fit */}
      {settings.pageSize !== PageSize.FIT_IMAGE && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Maximize size={16} /> Image Scaling
          </label>
          <select 
            value={settings.imageFit}
            onChange={(e) => updateField('imageFit', e.target.value as ImageFit)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={ImageFit.CONTAIN}>Fit to Page (Best for Printing)</option>
            <option value={ImageFit.FILL}>Stretch to Fill</option>
            {/* <option value={ImageFit.ORIGINAL}>Original Size (May clip)</option> */}
          </select>
        </div>
      )}

      {/* Margin */}
      {settings.pageSize !== PageSize.FIT_IMAGE && (
        <div className="space-y-3">
           <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700">Margins (mm)</label>
              <span className="text-sm text-slate-500">{settings.margin}mm</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="50" 
             step="1"
             value={settings.margin}
             onChange={(e) => updateField('margin', parseInt(e.target.value))}
             className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
           />
        </div>
      )}
    </div>
  );
};
