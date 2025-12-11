'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface AddressOption {
  value: string;
  label: string;
  group?: string;
}

interface AddressComboboxProps {
  value: string;
  onChange: (value: string) => void;
  userFavorites?: string[]; // よく行くエリア
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// 住所検索API（市区郡レベル）
async function searchAddress(query: string): Promise<AddressOption[]> {
  if (!query || query.length < 2) return [];

  try {
    // 郵便番号APIを使用（無料・制限なし）
    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.results) {
      // 市区郡レベルでユニークにする
      const uniqueAreas = new Map<string, string>();
      data.results.forEach((result: { address1: string; address2: string; address3: string }) => {
        const areaKey = `${result.address1} ${result.address2}`;
        if (!uniqueAreas.has(areaKey)) {
          uniqueAreas.set(areaKey, result.address2);
        }
      });

      return Array.from(uniqueAreas.entries()).map(([full, city]) => ({
        value: city,
        label: full,
      }));
    }
  } catch {
    // 郵便番号APIが失敗した場合は空を返す
  }

  return [];
}

// 地名検索（Google Places APIのようなものがないため、シンプルな実装）
async function searchByKeyword(query: string): Promise<AddressOption[]> {
  if (!query || query.length < 2) return [];

  try {
    // OpenStreetMap Nominatim API（無料、1秒1リクエスト制限あり）
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=jp&format=json&addressdetails=1&limit=10`,
      {
        headers: {
          'Accept-Language': 'ja',
        },
      }
    );
    const data = await response.json();

    // 市区郡レベルでユニークにする
    const uniqueAreas = new Map<string, AddressOption>();

    data.forEach(
      (item: {
        address?: {
          state?: string;
          city?: string;
          town?: string;
          county?: string;
          municipality?: string;
        };
        display_name?: string;
      }) => {
        const addr = item.address;
        if (!addr) return;

        // 市・区・郡を取得
        const prefecture = addr.state || '';
        const city = addr.city || addr.municipality || addr.county || addr.town || '';

        if (prefecture && city) {
          // 「〇〇市」「〇〇区」「〇〇郡」までを抽出
          const cityMatch = city.match(/^(.+?[市区郡])/);
          const areaName = cityMatch ? cityMatch[1] : city;
          const fullName = `${prefecture} ${areaName}`;

          if (!uniqueAreas.has(fullName)) {
            uniqueAreas.set(fullName, {
              value: areaName,
              label: fullName,
            });
          }
        }
      }
    );

    return Array.from(uniqueAreas.values());
  } catch {
    return [];
  }
}

export function AddressCombobox({
  value,
  onChange,
  userFavorites = [],
  placeholder = '市区郡名を入力（例：蒲郡市）',
  className = '',
  disabled = false,
}: AddressComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索実行
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // 郵便番号の場合
      if (/^\d+$/.test(query)) {
        const results = await searchAddress(query);
        setSuggestions(results);
      } else {
        // 地名検索
        const results = await searchByKeyword(query);
        setSuggestions(results);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onChange(newValue);

    // デバウンス処理
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(newValue);
    }, 300);
  };

  const handleSelect = (opt: AddressOption) => {
    onChange(opt.value);
    setInputValue(opt.value);
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

  // よく行くエリア（ユーザー設定）をフィルタリング
  const filteredFavorites = userFavorites.filter(
    (fav) => !inputValue || fav.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showDropdown =
    isOpen && (filteredFavorites.length > 0 || suggestions.length > 0 || isLoading);

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
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* よく行くエリア */}
          {filteredFavorites.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                よく行くエリア
              </div>
              {filteredFavorites.map((fav) => (
                <button
                  key={fav}
                  type="button"
                  onClick={() => handleSelect({ value: fav, label: fav })}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-brand-primary/10 ${
                    value === fav
                      ? 'bg-brand-primary/5 text-brand-primary font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {fav}
                </button>
              ))}
            </>
          )}

          {/* API検索結果 */}
          {suggestions.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                候補
              </div>
              {suggestions.map((opt) => (
                <button
                  key={opt.label}
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
            </>
          )}

          {/* ローディング */}
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              検索中...
            </div>
          )}

          {/* 結果なし */}
          {!isLoading &&
            inputValue.length >= 2 &&
            suggestions.length === 0 &&
            filteredFavorites.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">「{inputValue}」をそのまま使用</div>
            )}
        </div>
      )}
    </div>
  );
}
