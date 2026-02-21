'use client';

import { useState } from 'react';
import { SegmentGroup } from './AudienceSegmentTag';

const AVAILABLE_REGIONS = ['US', 'EU', 'UK', 'CA', 'AU', 'APAC', 'LATAM', 'MEA', 'GLOBAL'];
const AVAILABLE_INTERESTS = [
  'technology', 'finance', 'gaming', 'sports', 'entertainment',
  'health', 'travel', 'education', 'business', 'lifestyle',
];
const AVAILABLE_DEVICES = ['desktop', 'mobile', 'tablet', 'smart-tv'];
const AVAILABLE_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ar'];

export interface TargetingConfig {
  regions: string[];
  interests: string[];
  excludedSegments: string[];
  devices: string[];
  languages: string[];
  minAge: number;
  maxAge: number;
  minReputation: number;
  requireKyc: boolean;
  excludeFraud: boolean;
  maxCpmXlm: string;
}

interface TargetingFormProps {
  initial?: Partial<TargetingConfig>;
  onSave?: (config: TargetingConfig) => Promise<void>;
  isSaving?: boolean;
}

const DEFAULT_CONFIG: TargetingConfig = {
  regions: [],
  interests: [],
  excludedSegments: [],
  devices: ['desktop', 'mobile'],
  languages: ['en'],
  minAge: 18,
  maxAge: 65,
  minReputation: 0,
  requireKyc: false,
  excludeFraud: true,
  maxCpmXlm: '',
};

export function TargetingForm({ initial, onSave, isSaving }: TargetingFormProps) {
  const [config, setConfig] = useState<TargetingConfig>({ ...DEFAULT_CONFIG, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const addTo = (field: keyof Pick<TargetingConfig, 'regions' | 'interests' | 'excludedSegments' | 'devices' | 'languages'>) =>
    (val: string) => setConfig((c) => ({ ...c, [field]: [...c[field], val] }));

  const removeFrom = (field: keyof Pick<TargetingConfig, 'regions' | 'interests' | 'excludedSegments' | 'devices' | 'languages'>) =>
    (val: string) => setConfig((c) => ({ ...c, [field]: c[field].filter((v) => v !== val) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave?.(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save targeting settings');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Geographic Targeting */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">Geographic Targeting</h3>
        <SegmentGroup
          label="Target Regions"
          segments={config.regions}
          variant="active"
          onAdd={addTo('regions')}
          onRemove={removeFrom('regions')}
          availableSegments={AVAILABLE_REGIONS}
        />
      </div>

      {/* Audience Segments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">Audience Segments</h3>
        <SegmentGroup
          label="Interest Segments"
          segments={config.interests}
          variant="active"
          onAdd={addTo('interests')}
          onRemove={removeFrom('interests')}
          availableSegments={AVAILABLE_INTERESTS}
        />
        <SegmentGroup
          label="Excluded Segments"
          segments={config.excludedSegments}
          variant="excluded"
          onAdd={addTo('excludedSegments')}
          onRemove={removeFrom('excludedSegments')}
          availableSegments={AVAILABLE_INTERESTS.filter((i) => !config.interests.includes(i))}
        />
      </div>

      {/* Device & Language */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">Device & Language</h3>
        <SegmentGroup
          label="Device Types"
          segments={config.devices}
          variant="neutral"
          onAdd={addTo('devices')}
          onRemove={removeFrom('devices')}
          availableSegments={AVAILABLE_DEVICES}
        />
        <SegmentGroup
          label="Languages"
          segments={config.languages}
          variant="neutral"
          onAdd={addTo('languages')}
          onRemove={removeFrom('languages')}
          availableSegments={AVAILABLE_LANGUAGES}
        />
      </div>

      {/* Age Range */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Age Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="targeting-min-age" className="block text-xs text-gray-400 mb-1">Min Age</label>
            <input
              id="targeting-min-age"
              type="number"
              value={config.minAge}
              onChange={(e) => setConfig((c) => ({ ...c, minAge: parseInt(e.target.value) || 18 }))}
              min={13}
              max={100}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="targeting-max-age" className="block text-xs text-gray-400 mb-1">Max Age</label>
            <input
              id="targeting-max-age"
              type="number"
              value={config.maxAge}
              onChange={(e) => setConfig((c) => ({ ...c, maxAge: parseInt(e.target.value) || 65 }))}
              min={13}
              max={100}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Quality Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Quality Filters</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300" id="exclude-fraud-label">Exclude Fraud</p>
              <p className="text-xs text-gray-500" id="exclude-fraud-desc">Block flagged addresses</p>
            </div>
            <input
              type="checkbox"
              checked={config.excludeFraud}
              onChange={(e) => setConfig((c) => ({ ...c, excludeFraud: e.target.checked }))}
              aria-labelledby="exclude-fraud-label"
              aria-describedby="exclude-fraud-desc"
              className="w-4 h-4 accent-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300" id="require-kyc-label">Require KYC</p>
              <p className="text-xs text-gray-500" id="require-kyc-desc">Only verified users</p>
            </div>
            <input
              type="checkbox"
              checked={config.requireKyc}
              onChange={(e) => setConfig((c) => ({ ...c, requireKyc: e.target.checked }))}
              aria-labelledby="require-kyc-label"
              aria-describedby="require-kyc-desc"
              className="w-4 h-4 accent-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="targeting-min-reputation" className="block text-xs text-gray-400 mb-1">Min Publisher Reputation (0-1000)</label>
            <input
              id="targeting-min-reputation"
              type="number"
              value={config.minReputation}
              onChange={(e) => setConfig((c) => ({ ...c, minReputation: parseInt(e.target.value) || 0 }))}
              min={0}
              max={1000}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="targeting-max-cpm" className="block text-xs text-gray-400 mb-1">Max CPM (XLM, leave blank for no limit)</label>
            <input
              id="targeting-max-cpm"
              type="number"
              value={config.maxCpmXlm}
              onChange={(e) => setConfig((c) => ({ ...c, maxCpmXlm: e.target.value }))}
              placeholder="0.001"
              min="0"
              step="0.0001"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg px-3 py-2 text-green-300 text-sm">
          Targeting settings saved!
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
      >
        {isSaving ? 'Saving...' : 'Save Targeting Settings'}
      </button>
    </form>
  );
}
