interface SelectProps {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Select({ value, options, onChange, format }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition-colors focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100 dark:focus:border-[#666]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {format ? format(o) : o}
        </option>
      ))}
    </select>
  );
}
