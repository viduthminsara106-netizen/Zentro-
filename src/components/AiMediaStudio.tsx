import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Film,
  ScanEye,
  BrainCircuit,
  Globe,
  Zap,
  Upload,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'] as const;
const IMAGE_SIZES = ['1K', '2K', '4K'] as const;

export const AiMediaStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'image' | 'video' | 'analyze' | 'intelligence'>(
    'image'
  );

  // 1. Image Generation & Editing state
  const [imgPrompt, setImgPrompt] = useState(
    'Architectural titanium and brushed gold executive card on travertine stone, studio rim lighting'
  );
  const [imgModel, setImgModel] = useState<'gemini-nano-banana-2.1' | 'gemini-3-pro-image-preview'>(
    'gemini-nano-banana-2.1'
  );
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
  const [refImageMime, setRefImageMime] = useState<string>('image/png');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // 2. Animate Image into Video state (gemini-omni-1.1-flash via Interactions API)
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoSourceMime, setVideoSourceMime] = useState<string>('image/png');
  const [videoPrompt, setVideoPrompt] = useState(
    'Smooth cinematic camera glide with subtle warm golden reflections and atmospheric depth.'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // 3. Analyze Image state (gemini-4-argon)
  const [analyzeImageBase64, setAnalyzeImageBase64] = useState<string | null>(null);
  const [analyzeImageMime, setAnalyzeImageMime] = useState<string>('image/png');
  const [analyzePrompt, setAnalyzePrompt] = useState(
    'Analyze this image thoroughly. Identify key visual details, text, financial or scientific metrics, and structural composition.'
  );
  const [analysisOutput, setAnalysisOutput] = useState<string>('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // 4. Gemini Intelligence (ThinkingLevel.HIGH / Search Grounding / Low-Latency Fast)
  const [chatMode, setChatMode] = useState<'thinking' | 'search' | 'fast' | 'general'>('thinking');
  const [chatPrompt, setChatPrompt] = useState(
    'Compare the capital efficiency of 365-day structured term yields with biotech royalty monetization models.'
  );
  const [chatResponse, setChatResponse] = useState<string>('');
  const [chatSources, setChatSources] = useState<{ uri: string; title: string }[]>([]);
  const [chatModelUsed, setChatModelUsed] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (base64: string, mime: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoaded(reader.result, file.type || 'image/png');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setImgLoading(true);
    setImgError(null);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt,
          model: imgModel,
          aspectRatio,
          imageSize,
          referenceImageBase64: refImageBase64,
          referenceMimeType: refImageMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setGeneratedImageUrl(data.imageUrl);
    } catch (err: any) {
      setImgError(err?.message || 'Error generating image.');
    } finally {
      setImgLoading(false);
    }
  };

  const handleAnimateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoSourceImage) {
      setVideoError('Please upload a photo first to animate into video.');
      return;
    }
    setVideoLoading(true);
    setVideoError(null);
    try {
      const res = await fetch('/api/ai/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: videoSourceImage,
          mimeType: videoSourceMime,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to animate video');
      setGeneratedVideoUrl(data.videoUrl);
    } catch (err: any) {
      setVideoError(err?.message || 'Error animating image into video.');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleAnalyzePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzeImageBase64) {
      setAnalyzeError('Please upload a photo to analyze.');
      return;
    }
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: analyzeImageBase64,
          mimeType: analyzeImageMime,
          prompt: analyzePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze photo');
      setAnalysisOutput(data.text);
    } catch (err: any) {
      setAnalyzeError(err?.message || 'Error analyzing photo.');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleRunIntelligence = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatLoading(true);
    setChatError(null);
    setChatSources([]);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chatPrompt,
          mode: chatMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run Gemini query');
      setChatResponse(data.text);
      setChatSources(data.sources || []);
      setChatModelUsed(data.modelUsed || chatMode);
    } catch (err: any) {
      setChatError(err?.message || 'Error communicating with Gemini.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Mode Selector */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
            ZENTRO CREATIVE & QUANTITATIVE AI STUDIO
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-0.5">
            Image Creation, Video Animation, Vision Inspection & High-Thinking Lab
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('image')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'image'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Create & Edit Images</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('video')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'video'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Animate to Video</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('analyze')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'analyze'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ScanEye className="w-3.5 h-3.5" />
            <span>Analyze Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('intelligence')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'intelligence'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Thinking & Search</span>
          </button>
        </div>
      </div>

      {/* 1. CREATE & EDIT IMAGES */}
      {activeSubTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleGenerateOrEditImage}
            className="lg:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create or Edit Studio Images
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Selection
              </label>
              <select
                value={imgModel}
                onChange={(e) => setImgModel(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="gemini-nano-banana-2.1">
                  gemini-nano-banana-2.1 (Create & Edit Images)
                </option>
                <option value="gemini-3-pro-image-preview">
                  gemini-3-pro-image-preview (High-Quality Studio 1K / 2K / 4K)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Image Resolution Size (1K, 2K, 4K)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-2 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                      imageSize === sz
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Reference Photo (Upload to Edit Image with gemini-nano-banana-2.1)
              </label>
              <div className="flex items-center gap-3">
                <label className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium cursor-pointer flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{refImageBase64 ? 'Change Photo' : 'Upload Photo to Edit'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, (b64, mime) => {
                        setRefImageBase64(b64);
                        setRefImageMime(mime);
                      })
                    }
                  />
                </label>
                {refImageBase64 && (
                  <button
                    type="button"
                    onClick={() => setRefImageBase64(null)}
                    className="text-xs text-red-500 hover:underline cursor-pointer"
                  >
                    Remove Reference Photo
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prompt Instructions
              </label>
              <textarea
                rows={3}
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="Describe the image to create or how to edit the uploaded photo..."
              />
            </div>

            {imgError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs">
                {imgError}
              </div>
            )}

            <button
              type="submit"
              disabled={imgLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {imgLoading
                ? 'Rendering Image...'
                : refImageBase64
                  ? 'Edit Photo with Gemini'
                  : 'Generate Studio Image'}
            </button>
          </form>

          <div className="lg:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[360px]">
            {generatedImageUrl ? (
              <div className="space-y-3 w-full text-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated Studio Output"
                  referrerPolicy="no-referrer"
                  className="max-h-[380px] mx-auto rounded-lg border border-slate-200 dark:border-slate-800 object-contain"
                />
                <div className="text-xs font-mono text-slate-500">
                  {imgModel} · {aspectRatio} · {imageSize}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                <p>Select your resolution (1K, 2K, 4K) and aspect ratio, then click Generate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ANIMATE IMAGES INTO VIDEO (gemini-omni-1.1-flash via Interactions API) */}
      {activeSubTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAnimateVideo}
            className="lg:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Animate Photo into Video (gemini-omni-1.1-flash)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload any photo and animate it into a video using the Gemini Interactions API in
              16:9 landscape or 9:16 portrait format.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1. Upload Source Photo
              </label>
              <label className="w-full py-3 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>{videoSourceImage ? 'Photo Loaded (Click to Replace)' : 'Choose Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (b64, mime) => {
                      setVideoSourceImage(b64);
                      setVideoSourceMime(mime);
                    })
                  }
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Video Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('16:9')}
                  className={`py-2 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    videoAspectRatio === '16:9'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  16:9 (Landscape)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoAspectRatio('9:16')}
                  className={`py-2 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
                    videoAspectRatio === '9:16'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  9:16 (Portrait)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                3. Motion Prompt
              </label>
              <textarea
                rows={3}
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {videoError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs">
                {videoError}
              </div>
            )}

            <button
              type="submit"
              disabled={videoLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {videoLoading
                ? 'Animating Video with gemini-omni-1.1-flash...'
                : 'Animate Photo into Video'}
            </button>
          </form>

          <div className="lg:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center min-h-[360px]">
            {generatedVideoUrl ? (
              <video
                src={generatedVideoUrl}
                controls
                autoPlay
                loop
                className="max-h-[380px] rounded-lg border border-slate-200 dark:border-slate-800"
              />
            ) : videoSourceImage ? (
              <div className="space-y-2 text-center">
                <img
                  src={videoSourceImage}
                  alt="Source Frame"
                  referrerPolicy="no-referrer"
                  className="max-h-56 mx-auto rounded-lg object-contain"
                />
                <div className="text-xs text-slate-500">
                  Ready to animate ({videoAspectRatio})
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 space-y-2">
                <Film className="w-8 h-8 mx-auto text-slate-400" />
                <p>Upload a photo on the left to animate it into a video.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ANALYZE IMAGES (gemini-4-argon) */}
      {activeSubTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAnalyzePhoto}
            className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Deep Image Understanding (gemini-4-argon)
            </h3>

            <label className="w-full py-3 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium cursor-pointer flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>{analyzeImageBase64 ? 'Photo Selected (Replace)' : 'Upload Photo to Analyze'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(e, (b64, mime) => {
                    setAnalyzeImageBase64(b64);
                    setAnalyzeImageMime(mime);
                  })
                }
              />
            </label>

            {analyzeImageBase64 && (
              <img
                src={analyzeImageBase64}
                alt="Uploaded Preview"
                referrerPolicy="no-referrer"
                className="max-h-40 mx-auto rounded-lg object-contain"
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Analysis Question
              </label>
              <textarea
                rows={3}
                value={analyzePrompt}
                onChange={(e) => setAnalyzePrompt(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {analyzeError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs">
                {analyzeError}
              </div>
            )}

            <button
              type="submit"
              disabled={analyzeLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {analyzeLoading ? 'Analyzing with gemini-4-argon...' : 'Analyze Image'}
            </button>
          </form>

          <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="text-xs font-mono text-slate-500 mb-2">
              MODEL: gemini-4-argon · MULTIMODAL INSPECTION
            </div>
            {analysisOutput ? (
              <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {analysisOutput}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                Upload any financial receipt, chart, ID document, or scientific image to inspect it
                with gemini-4-argon.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GEMINI INTELLIGENCE: HIGH THINKING, SEARCH GROUNDING & LOW-LATENCY */}
      {activeSubTab === 'intelligence' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleRunIntelligence}
            className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Zentro Intelligence Engine
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Reasoning & Grounding Engine
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setChatMode('thinking')}
                  className={`p-3 rounded-lg border text-left text-xs cursor-pointer flex items-center justify-between ${
                    chatMode === 'thinking'
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>High Thinking Mode (Complex Queries)</span>
                  <span className="font-mono text-[11px]">gemini-4-argon · HIGH</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode('search')}
                  className={`p-3 rounded-lg border text-left text-xs cursor-pointer flex items-center justify-between ${
                    chatMode === 'search'
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Google Search Grounding (Live Web Data)</span>
                  <span className="font-mono text-[11px]">gemini-3.8-flash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatMode('fast')}
                  className={`p-3 rounded-lg border text-left text-xs cursor-pointer flex items-center justify-between ${
                    chatMode === 'fast'
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Low-Latency Fast Response</span>
                  <span className="font-mono text-[11px]">gemini-3.1-flash-lite</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Query or Task
              </label>
              <textarea
                rows={4}
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {chatError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 text-xs">
                {chatError}
              </div>
            )}

            <button
              type="submit"
              disabled={chatLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {chatLoading ? 'Executing Query...' : 'Run Intelligence Query'}
            </button>
          </form>

          <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>OUTPUT CONSOLE</span>
              {chatModelUsed && <span>Engine: {chatModelUsed}</span>}
            </div>

            {chatResponse ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {chatResponse}
                </div>

                {chatSources.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Google Search Grounding Citations:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chatSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          <span className="truncate max-w-xs">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                Choose High Thinking (gemini-4-argon), Search Grounding (gemini-3.8-flash), or
                Low-Latency (gemini-3.1-flash-lite) and submit a query.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
