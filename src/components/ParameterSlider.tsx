"use client";

type Props = {
  name: string;
  unit: string | null;
  description: string | null;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

export default function ParameterSlider({
  name,
  unit,
  description,
  min,
  max,
  step,
  value,
  onChange,
}: Props) {
  return (
    <div className="rounded-lg border border-storm-700 bg-storm-900 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[#e8ecf5]">{name}</label>
        <span className="whitespace-nowrap font-mono text-sm text-bolt-500">
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-bolt-500"
      />

      {description && (
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}
