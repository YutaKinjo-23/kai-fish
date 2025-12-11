'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = '入力または選択',
  className = '',
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 選択済みの値からラベルを取得
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    // 値が変更されたら入力欄を更新
    setInputValue(selectedOption?.label || value);
  }, [value, selectedOption]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 入力値でフィルタリング
  const filteredOptions = inputValue
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  // グループごとに分類
  const groupedOptions: { group: string; items: ComboboxOption[] }[] = [];
  const ungroupedItems: ComboboxOption[] = [];

  filteredOptions.forEach((opt) => {
    if (opt.group) {
      const existingGroup = groupedOptions.find((g) => g.group === opt.group);
      if (existingGroup) {
        existingGroup.items.push(opt);
      } else {
        groupedOptions.push({ group: opt.group, items: [opt] });
      }
    } else {
      ungroupedItems.push(opt);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);

    // 入力値がオプションのラベルと完全一致する場合はそのvalueを採用
    const matchingOption = options.find(
      (opt) => opt.label.toLowerCase() === newValue.toLowerCase()
    );
    if (matchingOption) {
      onChange(matchingOption.value);
    } else {
      // 一致しなければ入力値そのものをvalueとして使う
      onChange(newValue);
    }
  };

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setInputValue(opt.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (filteredOptions.length > 0 || inputValue) && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* よく行くエリア（グループ化されたもの） */}
          {groupedOptions.map((group) => (
            <div key={group.group}>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                {group.group}
              </div>
              {group.items.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10 ${
                    value === opt.value
                      ? 'bg-brand-primary/5 text-brand-primary font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ))}

          {/* グループなしのオプション */}
          {ungroupedItems.length > 0 && groupedOptions.length > 0 && (
            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
              その他のエリア
            </div>
          )}
          {ungroupedItems.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10 ${
                value === opt.value
                  ? 'bg-brand-primary/5 text-brand-primary font-medium'
                  : 'text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* 入力値がオプションにない場合、新規として表示 */}
          {inputValue &&
            !options.some(
              (opt) =>
                opt.label.toLowerCase() === inputValue.toLowerCase() ||
                opt.value.toLowerCase() === inputValue.toLowerCase()
            ) && (
              <div className="px-3 py-2 text-sm text-gray-500 border-t">
                「{inputValue}」を新しいエリアとして使用
              </div>
            )}

          {filteredOptions.length === 0 && !inputValue && (
            <div className="px-3 py-2 text-sm text-gray-500">候補がありません</div>
          )}
        </div>
      )}
    </div>
  );
}
