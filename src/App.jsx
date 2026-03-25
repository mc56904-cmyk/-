import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Upload, Download, Copy, ChevronLeft, 
  Wand2, PenTool, LayoutGrid, Activity, 
  Image as ImageIcon, Loader2, ArrowRight, Settings2,
  Dna, Info, Zap, Hash
} from 'lucide-react';

// --- 6 种精选核心构图配置 ---
const COMPOSITIONS = [
  { id: 'center', name: '中心点', tip: '将主体放置于正中心，营造极简、稳定的秩序感。' },
  { id: 'thirds_pts', name: '三分点', tip: '视觉黄金点，适合放置人像眼神或产品核心细节。' },
  { id: 'symmetry', name: '对称线', tip: '利用中轴线创造绝对平衡，适合建筑或静物。' },
  { id: 'thirds_lines', name: '三分线', tip: '将地平线或垂直边缘对齐网格线，画面更协调。' },
  { id: 'diagonal', name: '对角线', tip: '打破沉闷，利用倾斜线引导视觉延伸，增加动感。' },
  { id: 'frame', name: '框架', tip: '利用前景形成“画中画”，聚焦主体并增加层次。' }
];

// --- 风格模式 ---
const STYLE_MODES = [
  { id: 'original', name: '原图预览', icon: ImageIcon },
  { id: 'lineart', name: 'AI 手绘线稿', icon: Wand2 }, 
  { id: 'thermal', name: '高对比热感', icon: Dna },
  { id: 'mosaic', name: '像素效果', icon: LayoutGrid },
  { id: 'halftone', name: '点阵印刷', icon: Activity },
  { id: 'ascii', name: 'ASCII 海报', icon: Hash }
];

// --- Gemini AI 图像处理引擎 (本地运行需要填入你的 API KEY) ---
const generateAILineart = async (base64Img, weight, def) => {
  // ⚠️ 请在此处填入你的 Google Gemini API Key（勿提交到 Git；建议用 import.meta.env.VITE_GEMINI_API_KEY）
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';

  if (!apiKey) {
    throw new Error(
      'Missing API Key. 在项目根目录 .env 中设置 VITE_GEMINI_API_KEY=你的密钥，保存后重启 npm run dev。'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  const b64Data = base64Img.split(',')[1] || base64Img;
  
  const weightDesc = weight > 70 ? "thick and bold" : weight < 30 ? "thin and delicate" : "moderate";
  const detailDesc = def > 70 ? "highly detailed with fine structural lines" : def < 30 ? "minimalist with only main structural contours" : "balanced detail";

  const prompt = `Act as an expert illustrator. Redraw the main subject of this image as a pure, hand-drawn black ink sketch on a white background. 
  CRITICAL REQUIREMENTS:
  1. Output EXACTLY two colors: pure black (#000000) for lines, pure white (#FFFFFF) for background.
  2. NO solid color filling, NO dark patches, and NO shading. ONLY draw the outer contours and internal structural lines. 
  3. The inside of all objects MUST remain pure white. Keep it strictly as a hollow outline sketch.
  Line weight: ${weightDesc}. Detail level: ${detailDesc}.`;

  const payload = {
      contents: [{
          parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: b64Data } }
          ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
  };

  let retries = 5;
  let delay = 1000;
  while (retries > 0) {
      try {
          const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const result = await res.json();
          const imgPart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imgPart && imgPart.inlineData) {
              return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
          }
          throw new Error("No image data returned from AI");
      } catch (e) {
          retries--;
          if (retries === 0) throw e;
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
      }
  }
};

export default function App() {
  const [step, setStep] = useState('home');
  const [sourceImage, setSourceImage] = useState(null);

  return (
    <div className="font-sans antialiased bg-neutral-950 min-h-screen text-white select-none">
      {step === 'home' && <HomeView onNext={(img, s) => { setSourceImage(img); setStep(s); }} />}
      {step === 'camera' && (
        <CameraView 
          onBack={() => setStep('home')} 
          onCapture={(img) => { setSourceImage(img); setStep('studio'); }} 
        />
      )}
      {step === 'studio' && (
        <StudioView 
          sourceImage={sourceImage}
          onBack={() => { setSourceImage(null); setStep('home'); }}
        />
      )}
    </div>
  );
}

// --- 首页 ---
function HomeView({ onNext }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_#1e1b4b_0%,_#0a0a0a_100%)]">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="inline-flex p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] shadow-2xl shadow-indigo-500/20 animate-pulse">
            <Wand2 size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-white">RENDER<span className="text-indigo-500">FLOW</span></h1>
            <p className="text-neutral-400 text-sm font-medium tracking-widest uppercase">Conceptual Design Pro</p>
          </div>
        </div>

        <div className="grid gap-4">
          <button onClick={() => onNext(null, 'camera')} className="group flex items-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all active:scale-95 shadow-xl">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">开启构图相机</span>
              <span className="block text-xs text-neutral-500">6 种高亮参考线辅助</span>
            </div>
            <ArrowRight className="ml-auto text-neutral-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={20} />
          </button>

          <label className="group flex items-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-purple-500/50 cursor-pointer transition-all active:scale-95 shadow-xl">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onNext(ev.target.result, 'studio');
                reader.readAsDataURL(file);
              }
            }} />
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mr-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">导入设计素材</span>
              <span className="block text-xs text-neutral-500">本地设计稿一键风格化</span>
            </div>
            <ArrowRight className="ml-auto text-neutral-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" size={20} />
          </label>
        </div>
      </div>
    </div>
  );
}

// --- 相机 ---
function CameraView({ onBack, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [comp, setComp] = useState('thirds_pts');
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1920, height: 1080 } })
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => alert("相机开启失败，请确保您已授予权限。"));
    return () => {
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    onCapture(c.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <div className="absolute top-0 w-full z-30 p-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 text-white"><ChevronLeft /></button>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20 text-white">
             <Zap size={14} className="fill-current" />
             <span className="text-[10px] font-black tracking-widest uppercase">Guide Active</span>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {COMPOSITIONS.map(item => (
            <button key={item.id} onClick={() => setComp(item.id)} className={`shrink-0 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase transition-all ${comp === item.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/40' : 'bg-white/5 text-neutral-400 border border-white/5'}`}>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-neutral-950 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none">
           <CompositionOverlay type={comp} />
        </div>
        <div className="absolute bottom-36 w-full px-8 flex justify-center">
           <div className="bg-black/80 backdrop-blur-2xl border-l-4 border-indigo-500 p-4 rounded-r-3xl flex items-start gap-4 max-w-sm">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0"><Info size={18} /></div>
              <p className="text-xs leading-relaxed font-medium text-neutral-200">{COMPOSITIONS.find(c => c.id === comp).tip}</p>
           </div>
        </div>
      </div>

      <div className="h-32 flex items-center justify-center bg-black">
        <button onClick={capture} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function CompositionOverlay({ type }) {
  const HIGHLIGHT = "stroke-yellow-400 stroke-[2]"; 
  const BASE = "stroke-indigo-400 stroke-[1.5]";
  const POINT = "fill-yellow-400 stroke-indigo-900 stroke-[2]";

  return (
    <svg className="w-full h-full opacity-90">
      {(type === 'thirds_pts' || type === 'thirds_lines') && (
        <>
          <line x1="33.3%" y1="0" x2="33.3%" y2="100%" className={BASE} strokeDasharray="5 5" />
          <line x1="66.6%" y1="0" x2="66.6%" y2="100%" className={BASE} strokeDasharray="5 5" />
          <line x1="0" y1="33.3%" x2="100%" y2="33.3%" className={BASE} strokeDasharray="5 5" />
          <line x1="0" y1="66.6%" x2="100%" y2="66.6%" className={BASE} strokeDasharray="5 5" />
          {type === 'thirds_pts' && (
            <>
              <circle cx="33.3%" cy="33.3%" r="8" className={POINT} />
              <circle cx="66.6%" cy="33.3%" r="8" className={POINT} />
              <circle cx="33.3%" cy="66.6%" r="8" className={POINT} />
              <circle cx="66.6%" cy="66.6%" r="8" className={POINT} />
            </>
          )}
        </>
      )}
      {type === 'center' && (
        <>
          <circle cx="50%" cy="50%" r="5" className={POINT} />
          <rect x="40%" y="40%" width="20%" height="20%" fill="none" className={HIGHLIGHT} strokeDasharray="8 4" />
        </>
      )}
      {type === 'diagonal' && <><line x1="0" y1="0" x2="100%" y2="100%" className={HIGHLIGHT} /><line x1="100%" y1="0" x2="0" y2="100%" className={HIGHLIGHT} /></>}
      {type === 'symmetry' && <line x1="50%" y1="0" x2="50%" y2="100%" className={HIGHLIGHT} />}
      {type === 'frame' && <rect x="20%" y="20%" width="60%" height="60%" className={HIGHLIGHT} fill="none" />}
    </svg>
  );
}

// --- 工作台 ---
function StudioView({ sourceImage, onBack }) {
  const [activeMode, setActiveMode] = useState('original');
  const [currentResult, setCurrentResult] = useState(sourceImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [params, setParams] = useState({
    density: 70, weight: 40, contrast: 55, saturation: 50, bgTolerance: 0, definition: 50, colorLevel: 50
  });

  const originalRef = useRef(new Image());
  const effectId = useRef(0);
  const prevMode = useRef(activeMode);

  useEffect(() => {
    originalRef.current.src = sourceImage;
    if (originalRef.current.complete) applyEffect();
    else originalRef.current.onload = () => applyEffect();
  }, [sourceImage]);

  const applyEffect = useCallback(async () => {
    if (activeMode === 'original') { setCurrentResult(sourceImage); return; }
    
    setIsProcessing(true);
    const currentEffectId = ++effectId.current;

    const img = originalRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 1600 / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const { width: w, height: h } = canvas;

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = w; baseCanvas.height = h;
    const baseCtx = baseCanvas.getContext('2d');

    let emptyBgColor = '#ffffff';
    if (activeMode === 'ascii') {
       const isRetro = params.colorLevel > 40 && params.colorLevel <= 60;
       emptyBgColor = isRetro ? '#ffffff' : '#000000';
    } else if (activeMode === 'thermal') {
       emptyBgColor = '#000000';
    }
    baseCtx.fillStyle = emptyBgColor;
    baseCtx.fillRect(0, 0, w, h);

    const isolateC = document.createElement('canvas');
    isolateC.width = w; isolateC.height = h;
    const iCtx = isolateC.getContext('2d');
    iCtx.drawImage(img, 0, 0, w, h);

    if (params.bgTolerance > 0) {
      const iDataObj = iCtx.getImageData(0, 0, w, h);
      const d = iDataObj.data;
      const bgR = d[0], bgG = d[1], bgB = d[2];
      const thresh = (params.bgTolerance / 100) * 200; 

      for(let i=0; i<d.length; i+=4) {
         const r = d[i], g = d[i+1], b = d[i+2];
         const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
         if (dist <= thresh) d[i+3] = 0; 
      }
      iCtx.putImageData(iDataObj, 0, 0);
    }

    baseCtx.filter = `contrast(${0.6 + params.contrast/50}) brightness(${0.85 + params.definition/200}) saturate(${params.saturation * 2}%)`;
    baseCtx.drawImage(isolateC, 0, 0, w, h);
    baseCtx.filter = 'none';

    const data = baseCtx.getImageData(0, 0, w, h).data;

    if (activeMode === 'lineart') {
      const applyMorphologicalLineart = (targetCtx) => {
          const imgDataObj = targetCtx.getImageData(0, 0, w, h);
          const d = imgDataObj.data;
          const threshold = 255 - (params.definition * 1.5); 
          const binaryMap = new Uint8Array(w * h);
          for(let i = 0; i < d.length; i += 4) {
              const luma = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114);
              binaryMap[i/4] = luma < threshold ? 1 : 0; 
          }
          const fillRadius = Math.max(1, Math.floor(params.weight / 25)); 
          for(let y = 0; y < h; y++) {
              for(let x = 0; x < w; x++) {
                  const idx = y * w + x;
                  const pIdx = idx * 4;
                  if (binaryMap[idx] === 1) {
                      let isDeepInsideFill = true;
                      for(let dy = -fillRadius; dy <= fillRadius; dy++) {
                          for(let dx = -fillRadius; dx <= fillRadius; dx++) {
                              const ny = y + dy; const nx = x + dx;
                              if (ny >= 0 && ny < h && nx >= 0 && nx < w && binaryMap[ny * w + nx] === 0) {
                                  isDeepInsideFill = false; break;
                              }
                          }
                          if (!isDeepInsideFill) break;
                      }
                      if (isDeepInsideFill) d[pIdx] = d[pIdx+1] = d[pIdx+2] = 255; 
                      else d[pIdx] = d[pIdx+1] = d[pIdx+2] = 0;   
                  } else d[pIdx] = d[pIdx+1] = d[pIdx+2] = 255;
              }
          }
          targetCtx.putImageData(imgDataObj, 0, 0);
          targetCtx.filter = 'blur(0.5px)';
          targetCtx.drawImage(targetCtx.canvas, 0, 0);
          targetCtx.filter = 'none';
      };

      const base64Img = baseCanvas.toDataURL('image/jpeg', 0.8);
      const localFallback = () => {
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.filter = 'grayscale(100%)'; ctx.drawImage(baseCanvas, 0, 0, w, h);
          const blurC = document.createElement('canvas');
          blurC.width = w; blurC.height = h;
          const bCtx = blurC.getContext('2d');
          const blurRadius = Math.max(1, params.weight / 10);
          bCtx.filter = `grayscale(100%) invert(100%) blur(${blurRadius}px)`;
          bCtx.drawImage(baseCanvas, 0, 0, w, h);
          ctx.globalCompositeOperation = 'color-dodge';
          ctx.drawImage(blurC, 0, 0, w, h);
          const tempC = document.createElement('canvas');
          tempC.width = w; tempC.height = h;
          tempC.getContext('2d').drawImage(canvas, 0, 0);
          ctx.globalCompositeOperation = 'multiply';
          ctx.filter = 'none';
          const darkenPasses = Math.max(1, Math.floor(params.definition / 20)); 
          for(let i=0; i<darkenPasses; i++) ctx.drawImage(tempC, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
          applyMorphologicalLineart(ctx);
      };

      try {
          const aiResult = await generateAILineart(base64Img, params.weight, params.definition);
          if (currentEffectId === effectId.current) {
              const aiImg = new Image();
              aiImg.onload = () => {
                  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
                  ctx.drawImage(aiImg, 0, 0, w, h);
                  applyMorphologicalLineart(ctx);
                  setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
                  setIsProcessing(false);
              };
              aiImg.src = aiResult;
          }
      } catch (err) {
          console.error("AI Fallback:", err);
          if (currentEffectId === effectId.current) {
              localFallback();
              setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
              setIsProcessing(false);
          }
      }
      return; 
    } 
    else if (activeMode === 'ascii') {
      const fontSize = Math.max(8, 36 - Math.floor(params.density / 3)); 
      ctx.font = `900 ${fontSize}px "SF Mono", "JetBrains Mono", "Courier New", monospace`;
      ctx.textBaseline = 'top';
      const charW = fontSize * 0.6; const charH = fontSize * 0.9; 
      const cols = Math.floor(w / charW); const rows = Math.floor(h / charH);
      const tCanvas = document.createElement('canvas');
      tCanvas.width = cols; tCanvas.height = rows;
      const tCtx = tCanvas.getContext('2d');
      tCtx.filter = `grayscale(100%)`;
      tCtx.drawImage(baseCanvas, 0, 0, cols, rows);
      const tData = tCtx.getImageData(0, 0, cols, rows).data;
      let bg, fg, invertLuma = false;
      if (params.colorLevel <= 20) { bg = '#050505'; fg = '#00ff41'; } 
      else if (params.colorLevel <= 40) { bg = '#0a0a0a'; fg = '#ffffff'; } 
      else if (params.colorLevel <= 60) { bg = '#f4ebd0'; fg = '#1a1a1a'; invertLuma = true; } 
      else if (params.colorLevel <= 80) { bg = '#0a2463'; fg = '#f0ede6'; } 
      else { bg = '#1a0b2e'; fg = '#ff007f'; }
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = fg;
      const charSets = [
         [' ', '.', ',', '-', '~', '+', '=', '*', '#', '@'], 
         [' ', '.', 'o', 'O', '0', 'Q', 'G', '8', 'M', 'W'], 
         [' ', 'A', 'R', 'T', 'D', 'E', 'S', 'I', 'G', 'N'], 
         [' ', '░', '▒', '▓', '█']                             
      ];
      const setIdx = Math.min(3, Math.floor((params.definition / 100) * 4));
      const chars = charSets[setIdx];
      for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
              const idx = (r * cols + c) * 4;
              let brightness = tData[idx]; 
              if (invertLuma) brightness = 255 - brightness;
              if (brightness < 20) continue; 
              let charIdx = Math.floor((brightness / 255) * chars.length);
              charIdx = Math.min(chars.length - 1, Math.max(0, charIdx));
              const char = chars[charIdx];
              if (char !== ' ') ctx.fillText(char, c * charW, r * charH);
          }
      }
    }
    else if (activeMode === 'thermal') {
      ctx.filter = 'grayscale(100%) contrast(1.5)';
      ctx.drawImage(baseCanvas, 0, 0, w, h);
      ctx.filter = 'none';
      const tDataObj = ctx.getImageData(0, 0, w, h);
      const tData = tDataObj.data;
      for (let i = 0; i < tData.length; i += 4) {
        const v = tData[i]; 
        tData[i]   = v > 128 ? 255 : v * 2;                 
        tData[i+1] = v > 64 && v < 192 ? 255 : 0;           
        tData[i+2] = v < 128 ? 255 : 255 - v;               
      }
      ctx.putImageData(tDataObj, 0, 0);
    }
    else if (activeMode === 'mosaic') {
      const blockSize = Math.max(4, Math.floor((101 - params.density) / 3));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(baseCanvas, 0, 0, w / blockSize, h / blockSize);
      ctx.filter = 'saturate(80%)';
      ctx.drawImage(canvas, 0, 0, w / blockSize, h / blockSize, 0, 0, w, h);
      ctx.filter = 'none';
    }
    else if (activeMode === 'halftone') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      const step = Math.max(4, Math.floor((101 - params.density) / 3));
      const rMax = step * (params.weight / 100) * 1.5;
      ctx.fillStyle = `hsl(${params.colorLevel * 3.6}, 80%, 20%)`;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          const b = 1 - (data[idx] + data[idx+1] + data[idx+2]) / 765;
          if (b > 0.05) {
            ctx.beginPath(); ctx.arc(x, y, b * rMax, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    if (currentEffectId === effectId.current) {
        setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
        setIsProcessing(false);
    }
  }, [activeMode, params, sourceImage]);

  useEffect(() => {
    const isModeSwitch = prevMode.current !== activeMode;
    prevMode.current = activeMode;
    const delay = (activeMode === 'lineart' && !isModeSwitch) ? 1500 : 50;
    const timer = setTimeout(() => applyEffect(), delay);
    return () => clearTimeout(timer);
  }, [activeMode, params, sourceImage, applyEffect]);

  const handleCopy = async () => {
    try {
      const res = await fetch(currentResult);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert("已成功复制图像，请在设计软件中直接粘贴！");
    } catch (e) { alert("复制失败，请尝试下载。"); }
  };

  return (
    <div className="h-screen min-h-0 flex flex-col md:flex-row bg-[#080808] overflow-hidden">
      <div className="w-full md:w-[380px] min-h-0 max-md:min-h-[44vh] max-h-[52vh] md:max-h-none md:h-full flex flex-col shrink-0 order-2 md:order-1 shadow-2xl bg-neutral-900/80 backdrop-blur-xl border-r border-white/5">
        <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
          <button onClick={onBack} className="text-neutral-500 hover:text-white transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest bg-transparent border-none cursor-pointer">
            <ChevronLeft size={18} /> Exit
          </button>
          <div className="flex items-center gap-2 text-indigo-500">
            <Settings2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Studio Console</span>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-8 space-y-12 scrollbar-hide">
          <section className="space-y-6">
            <ParamSlider label="主体隔离 (Isolate)" value={params.bgTolerance} onChange={v => setParams({...params, bgTolerance: v})} />
            <ParamSlider label="采样密度 (Density)" value={params.density} onChange={v => setParams({...params, density: v})} />
            <ParamSlider label="粗细权重 (Weight)" value={params.weight} onChange={v => setParams({...params, weight: v})} />
            <ParamSlider label="对比强度 (Contrast)" value={params.contrast} onChange={v => setParams({...params, contrast: v})} />
            <ParamSlider label="色彩饱和度 (Saturation)" value={params.saturation} onChange={v => setParams({...params, saturation: v})} />
            <div className="pt-2 border-t border-white/5"></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <Wand2 size={14} className="text-purple-400" />
                 <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Style Tuning</span>
               </div>
               <ParamSlider label="AI 线稿锐度 / 字符类别" value={params.definition} onChange={v => setParams({...params, definition: v})} />
               <ParamSlider label="印花色彩 / 海报主题" value={params.colorLevel} onChange={v => setParams({...params, colorLevel: v})} />
            </div>
          </section>
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Render Modes</h3>
            <div className="grid grid-cols-2 gap-3">
                {STYLE_MODES.map(mode => (
                  <button key={mode.id} onClick={() => setActiveMode(mode.id)} className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all cursor-pointer ${activeMode === mode.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/30' : 'bg-neutral-800/50 border-transparent text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'}`}>
                    <mode.icon size={20} />
                    <span className="text-[10px] font-black uppercase">{mode.name}</span>
                  </button>
                ))}
            </div>
          </section>
        </div>

        <div className="shrink-0 px-4 py-2.5 md:px-6 md:py-3 border-t border-white/5 space-y-1.5">
           <button onClick={() => {
              const a = document.createElement('a'); a.href = currentResult; a.download = `RenderFlow_${activeMode}.jpg`; a.click();
           }} className="w-full bg-white text-black py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider shadow-md shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none">
             <Download size={14} /> Download Result
           </button>
           <button onClick={handleCopy} className="w-full bg-neutral-800 text-white py-2 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none">
             <Copy size={14} /> Copy to Figma/PS
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex items-center justify-center px-6 py-3 md:px-8 md:py-5 order-1 md:order-2 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
        {isProcessing && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="mt-4 text-[10px] font-black text-indigo-400 tracking-[0.5em] uppercase">
                {activeMode === 'lineart' ? 'Drawing Sketch...' : 'Processing Pixels'}
            </p>
          </div>
        )}
        <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
          <img src={currentResult} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10" alt="Result" />
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/10 uppercase tracking-[1em] pointer-events-none">
            RenderFlow Experimental Studio
          </div>
        </div>
      </div>
    </div>
  );
}

function ParamSlider({ label, value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-indigo-500 font-bold">{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(parseInt(e.target.value))} 
        className="w-full h-[4px] bg-neutral-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
    </div>
  );
}