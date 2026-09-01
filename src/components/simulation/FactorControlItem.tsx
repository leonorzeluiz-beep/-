import React from 'react';
import { FactorDefinition, SimulationFactors } from '../../types';
import { HelpCircle } from 'lucide-react';

interface FactorControlItemProps {
  factor: FactorDefinition;
  currentFactors: SimulationFactors;
  updateFactor: <K extends keyof SimulationFactors>(key: K, val: SimulationFactors[K]) => void;
  accentColorClass: string;
}

export const FactorControlItem: React.FC<FactorControlItemProps> = ({
  factor,
  currentFactors,
  updateFactor,
  accentColorClass,
}) => {
  const currentValue = currentFactors[factor.id] ?? factor.defaultValue;

  if (factor.type === 'switch') {
    const isChecked = Boolean(currentValue);
    return (
      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 first:border-t-0 first:pt-0">
        <div className="pr-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-700 font-medium block">{factor.name}</span>
            {factor.badge && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                {factor.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 leading-tight block mt-0.5" title={factor.description}>
            {factor.description}
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={e => updateFactor(factor.id, e.target.checked as any)}
            className="sr-only peer"
          />
          <div className={`w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${accentColorClass}`}></div>
        </label>
      </div>
    );
  }

  // Slider controls
  const numericVal = typeof currentValue === 'number' ? currentValue : (factor.defaultValue as number);
  const formattedVal = factor.formatValue(numericVal);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-slate-700 font-medium">
        <div className="flex items-center gap-1 truncate pr-1">
          <span className="truncate" title={factor.name}>{factor.name}</span>
          {factor.badge && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-medium shrink-0">
              {factor.badge}
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-slate-900 text-[11px] shrink-0">
          {formattedVal}
        </span>
      </div>

      <input
        type="range"
        min={factor.min ?? 0}
        max={factor.max ?? 1}
        step={factor.step ?? 0.01}
        value={numericVal}
        onChange={e => updateFactor(factor.id, parseFloat(e.target.value) as any)}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />

      <span className="text-[10px] text-slate-400 block truncate" title={factor.description}>
        {factor.description}
      </span>
    </div>
  );
};
