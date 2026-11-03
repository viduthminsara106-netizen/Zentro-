import React, { useState, useEffect, useRef } from 'react';
import {
  Dna,
  ExternalLink,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Search,
  Layers,
  AlertCircle,
} from 'lucide-react';

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay =
        !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 200)}`
    );
  }
  throw new Error(`Exhausted retries for ${url}`);
}

interface QuickExample {
  symbol: string;
  accession: string;
  pdbId: string;
  name: string;
}

const QUICK_EXAMPLES: QuickExample[] = [
  { symbol: 'TP53', accession: 'P04637', pdbId: '1TUP', name: 'Cellular tumor antigen p53' },
  { symbol: 'BRCA1', accession: 'P38398', pdbId: '1JM7', name: 'Breast cancer type 1 susceptibility' },
  { symbol: 'EGFR', accession: 'P00533', pdbId: '1M17', name: 'Epidermal growth factor receptor' },
  { symbol: 'ABL1', accession: 'P00520', pdbId: '2HYY', name: 'Tyrosine-protein kinase ABL1' },
  { symbol: 'INS', accession: 'P01308', pdbId: '4INS', name: 'Human Insulin' },
];

interface UniProtFeature {
  type: string;
  description: string;
  start: number;
  end: number;
}

export const ScienceWorkbench: React.FC = () => {
  const [accessionInput, setAccessionInput] = useState('P04637');
  const [activeAccession, setActiveAccession] = useState('P04637');
  const [activePdbId, setActivePdbId] = useState('1TUP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [afMetadata, setAfMetadata] = useState<any | null>(null);
  const [uniprotData, setUniprotData] = useState<any | null>(null);
  const [pdbMetadata, setPdbMetadata] = useState<any | null>(null);
  const [features, setFeatures] = useState<UniProtFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<UniProtFeature | null>(null);

  // 3Dmol state
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerInstanceRef = useRef<any | null>(null);
  const [renderStyle, setRenderStyle] = useState<'cartoon' | 'stick' | 'sphere'>('cartoon');
  const [isSpinning, setIsSpinning] = useState(false);
  const [darkCanvas, setDarkCanvas] = useState(true);

  const loadProteinTarget = async (acc: string, pdbIdOverride?: string) => {
    const cleanAcc = acc.trim().toUpperCase();
    if (!cleanAcc) return;
    setLoading(true);
    setError(null);
    setSelectedFeature(null);
    setActiveAccession(cleanAcc);

    try {
      // 1. Fetch AlphaFold DB prediction metadata dynamically
      const afRes = await fetchWithRetry(`https://alphafold.ebi.ac.uk/api/prediction/${cleanAcc}`);
      const afJson = await afRes.json();
      const firstPrediction = Array.isArray(afJson) ? afJson[0] : afJson;
      setAfMetadata(firstPrediction || null);

      // 2. Fetch UniProtKB entry metadata & functional domains/variants
      const uniRes = await fetchWithRetry(`https://rest.uniprot.org/uniprotkb/${cleanAcc}.json`);
      const uniJson = await uniRes.json();
      setUniprotData(uniJson);

      const parsedFeatures: UniProtFeature[] = (uniJson.features || [])
        .filter((f: any) =>
          ['Domain', 'Active site', 'Binding site', 'Natural variant', 'DNA binding'].includes(
            f.type
          )
        )
        .slice(0, 18)
        .map((f: any) => ({
          type: f.type,
          description: f.description || f.type,
          start: f.location?.start?.value || 1,
          end: f.location?.end?.value || f.location?.start?.value || 1,
        }));
      setFeatures(parsedFeatures);

      // 3. Fetch RCSB PDB experimental entry metadata if available
      const matchedExample = QUICK_EXAMPLES.find((q) => q.accession === cleanAcc);
      const targetPdb = pdbIdOverride || matchedExample?.pdbId || '1TUP';
      setActivePdbId(targetPdb);
      try {
        const pdbRes = await fetchWithRetry(
          `https://data.rcsb.org/rest/v1/core/entry/${targetPdb.toLowerCase()}`
        );
        const pdbJson = await pdbRes.json();
        setPdbMetadata(pdbJson);
      } catch {
        setPdbMetadata(null);
      }

      // 4. Load coordinate structure into 3Dmol.js (preferring mmCIF from AlphaFold DB)
      const cifUrl = firstPrediction?.cifUrl || firstPrediction?.pdbUrl;
      if (cifUrl) {
        const coordRes = await fetchWithRetry(cifUrl);
        const coordText = await coordRes.text();
        const format = cifUrl.endsWith('.cif') ? 'cif' : 'pdb';
        renderStructureIn3Dmol(coordText, format, renderStyle, darkCanvas);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve biomolecular data.');
    } finally {
      setLoading(false);
    }
  };

  const applyPlddtColoring = (viewer: any, styleName: 'cartoon' | 'stick' | 'sphere') => {
    if (!viewer) return;
    const colorfunc = (atom: any) => {
      const b = atom.b || 0;
      if (b > 90) return '#0053D6'; // Very High (>90)
      if (b >= 70) return '#65CBF3'; // Confident (70-90)
      if (b >= 50) return '#FFDB13'; // Low (50-70)
      return '#FF7D45'; // Very Low (<50)
    };
    viewer.setStyle({}, { [styleName]: { colorfunc } });
    viewer.render();
  };

  const renderStructureIn3Dmol = (
    coordData: string,
    format: 'cif' | 'pdb',
    styleName: 'cartoon' | 'stick' | 'sphere',
    useDarkBg: boolean
  ) => {
    if (!viewerContainerRef.current || !window.$3Dmol) return;
    viewerContainerRef.current.innerHTML = '';
    const viewer = window.$3Dmol.createViewer(viewerContainerRef.current, {
      backgroundColor: useDarkBg ? '#0F172A' : '#F8FAFC',
    });
    viewerInstanceRef.current = viewer;
    viewer.addModel(coordData, format);
    applyPlddtColoring(viewer, styleName);
    viewer.zoomTo();
    viewer.render();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProteinTarget('P04637', '1TUP');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleStyleChange = (newStyle: 'cartoon' | 'stick' | 'sphere') => {
    setRenderStyle(newStyle);
    if (viewerInstanceRef.current) {
      applyPlddtColoring(viewerInstanceRef.current, newStyle);
    }
  };

  const handleToggleSpin = () => {
    const next = !isSpinning;
    setIsSpinning(next);
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.spin(next ? 'y' : false);
    }
  };

  const handleToggleCanvasTheme = () => {
    const next = !darkCanvas;
    setDarkCanvas(next);
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.setBackgroundColor(next ? '#0F172A' : '#F8FAFC');
      viewerInstanceRef.current.render();
    }
  };

  const handleHighlightResidues = (feat: UniProtFeature) => {
    setSelectedFeature(feat);
    const viewer = viewerInstanceRef.current;
    if (!viewer) return;
    applyPlddtColoring(viewer, renderStyle);
    const resiRange: number[] = [];
    for (let r = feat.start; r <= Math.min(feat.end, feat.start + 120); r++) {
      resiRange.push(r);
    }
    viewer.addStyle({ resi: resiRange }, { stick: { radius: 0.25, color: '#10B981' } });
    viewer.zoomTo({ resi: resiRange });
    viewer.render();
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header + Top Quick-Try Example Bar */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-teal-600 dark:text-teal-400">
              ZENTRO BIOSCIENCE & STRUCTURAL PROTEOMICS WORKBENCH
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mt-0.5">
              AlphaFold DB, UniProtKB & RCSB PDB 3D Inspector
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadProteinTarget(accessionInput);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accessionInput}
                onChange={(e) => setAccessionInput(e.target.value)}
                placeholder="UniProt Accession (e.g. P04637)"
                className="pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              {loading ? 'Loading...' : 'Load Structure'}
            </button>
          </form>
        </div>

        {/* Quick-Try Example Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            Quick-Try Targets:
          </span>
          {QUICK_EXAMPLES.map((item) => (
            <button
              key={item.accession}
              type="button"
              onClick={() => {
                setAccessionInput(item.accession);
                loadProteinTarget(item.accession, item.pdbId);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeAccession === item.accession
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.symbol} · {item.accession}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split Interactive 3D Molecular Canvas + Synchronized Data Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: 3Dmol.js Interactive Viewport + pLDDT Scale */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {afMetadata?.entryId || `AF-${activeAccession}-F1`}
                </span>
                <span>·</span>
                <span>[Predicted by model: AlphaFold DB]</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {afMetadata?.uniprotDescription ||
                  uniprotData?.proteinDescription?.recommendedName?.fullName?.value ||
                  'Macromolecular 3D Coordinates'}
              </h3>
            </div>

            {/* Viewport Toolbar Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['cartoon', 'stick', 'sphere'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStyleChange(st)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                    renderStyle === st
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
              <button
                type="button"
                onClick={handleToggleSpin}
                className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
              >
                {isSpinning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>Spin</span>
              </button>
              <button
                type="button"
                onClick={() => viewerInstanceRef.current?.zoom(1.2)}
                title="Zoom In"
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => viewerInstanceRef.current?.zoom(0.8)}
                title="Zoom Out"
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFeature(null);
                  if (viewerInstanceRef.current) {
                    applyPlddtColoring(viewerInstanceRef.current, renderStyle);
                    viewerInstanceRef.current.zoomTo();
                  }
                }}
                title="Reset View"
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleToggleCanvasTheme}
                className="px-2.5 py-1 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {darkCanvas ? 'Light Canvas' : 'Dark Canvas'}
              </button>
            </div>
          </div>

          {/* 3Dmol WebGL Container */}
          <div className="relative w-full h-[420px]">
            <div ref={viewerContainerRef} className="w-full h-full relative" />
            {selectedFeature && (
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-slate-900/90 text-white text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {selectedFeature.type} (Residues {selectedFeature.start}–{selectedFeature.end})
                  </span>
                  <p className="text-slate-200 mt-0.5">{selectedFeature.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeature(null);
                    if (viewerInstanceRef.current) {
                      applyPlddtColoring(viewerInstanceRef.current, renderStyle);
                      viewerInstanceRef.current.zoomTo();
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs cursor-pointer shrink-0"
                >
                  Clear Highlight
                </button>
              </div>
            )}
          </div>

          {/* Canonical 4-Band AlphaFold pLDDT Confidence Scale */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              AlphaFold Per-Residue pLDDT Confidence Scale:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: '#0053D6' }} />
                <span className="font-mono">Very High (&gt;90)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: '#65CBF3' }} />
                <span className="font-mono">Confident (70–90)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: '#FFDB13' }} />
                <span className="font-mono">Low (50–70)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: '#FF7D45' }} />
                <span className="font-mono">Very Low (&lt;50)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Synchronized UniProt & RCSB PDB Data Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* Authoritative Provenance & Outbound Source Citations */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                AUTHORITATIVE RECORD PROVENANCE
              </span>
              <span className="text-xs font-mono text-slate-500">
                TaxID: {afMetadata?.taxId || '9606'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="text-slate-500 dark:text-slate-400">Gene / UniProt ID</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {afMetadata?.gene || 'TP53'} · {activeAccession}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">[Literature curated]</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="text-slate-500 dark:text-slate-400">Sequence Length</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5 tabular-nums">
                  {afMetadata?.uniprotEnd || uniprotData?.sequence?.length || 393} aa
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Homo sapiens</div>
              </div>
            </div>

            {pdbMetadata && (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">
                    RCSB PDB: {activePdbId}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    [Experimentally determined]
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 line-clamp-1">
                  {pdbMetadata?.struct?.title}
                </div>
                <div className="text-slate-500 font-mono">
                  Method: {pdbMetadata?.rcsb_entry_info?.experimental_method?.[0] || 'X-RAY'} ·
                  Resolution:{' '}
                  {pdbMetadata?.rcsb_entry_info?.resolution_combined?.[0]
                    ? `${pdbMetadata.rcsb_entry_info.resolution_combined[0]} Å`
                    : 'N/A'}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`https://alphafold.ebi.ac.uk/entry/${activeAccession}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-teal-500"
              >
                <span>AlphaFold DB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.uniprot.org/uniprotkb/${activeAccession}/entry`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-teal-500"
              >
                <span>UniProtKB</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://www.rcsb.org/structure/${activePdbId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-teal-500"
              >
                <span>RCSB PDB ({activePdbId})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Synchronized Domain & Variant Table */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-500" />
                <span>UniProt Functional Domains & Variants</span>
              </h3>
              <span className="text-xs text-slate-500">Click row to highlight in 3D</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {features.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No domain annotations found for {activeAccession}.
                </div>
              ) : (
                features.map((feat, idx) => (
                  <button
                    key={`${feat.type}-${feat.start}-${idx}`}
                    type="button"
                    onClick={() => handleHighlightResidues(feat)}
                    className={`w-full text-left py-2.5 px-2.5 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      selectedFeature === feat
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {feat.description}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {feat.type} · [Literature curated]
                      </div>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                      {feat.start}–{feat.end}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
