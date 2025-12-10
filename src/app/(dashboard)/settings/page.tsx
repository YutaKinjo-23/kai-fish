'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FISH_SPECIES_MASTER, FishSpecies } from '@/lib/master/fish-species';

interface GeoApiLocation {
  prefecture: string;
  city: string;
  town: string;
}

interface GeoApiResponse {
  response: {
    location: GeoApiLocation[];
  };
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // アバター用
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // エリア検索用
  const [areaInput, setAreaInput] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 魚種検索用
  const [fishInput, setFishInput] = useState('');
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const fishInputRef = useRef<HTMLInputElement>(null);
  const fishContainerRef = useRef<HTMLDivElement>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.user.displayName ?? '');
        setAvatarUrl(data.user.avatarUrl ?? null);
        setSelectedAreas(data.user.areas ?? []);
        setSelectedTargets(data.user.targets ?? []);
      }
    } catch {
      console.error('設定の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 地名検索（HeartRails Geo API）
  const searchAreas = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setAreaSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://geoapi.heartrails.com/api/json?method=suggest&matching=like&keyword=${encodeURIComponent(keyword)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: GeoApiResponse = await res.json();
        const locations = data.response?.location ?? [];
        // 県名＋市区町村＋町域名で一意な候補を生成
        const suggestions = locations.map((loc) => `${loc.prefecture} ${loc.city}${loc.town}`);
        // 重複を除去して最大10件
        const unique = [...new Set(suggestions)].slice(0, 10);
        setAreaSuggestions(unique);
      }
    } catch {
      console.error('エリア検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 入力変更時のデバウンス処理
  const handleAreaInputChange = (value: string) => {
    setAreaInput(value);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAreas(value);
    }, 300);
  };

  // 候補を選択
  const handleSelectSuggestion = (suggestion: string) => {
    if (!selectedAreas.includes(suggestion)) {
      setSelectedAreas((prev) => [...prev, suggestion]);
    }
    setAreaInput('');
    setAreaSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // エリアを削除
  const handleRemoveArea = (area: string) => {
    setSelectedAreas((prev) => prev.filter((a) => a !== area));
  };

  // Enterキーでのフォーム送信防止
  const handleAreaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // 魚種を選択
  const handleSelectFish = (fishId: string) => {
    if (!selectedTargets.includes(fishId)) {
      setSelectedTargets((prev) => [...prev, fishId]);
    }
    setFishInput('');
    setShowFishDropdown(false);
    fishInputRef.current?.focus();
  };

  // 魚種を削除
  const handleRemoveFish = (fishId: string) => {
    setSelectedTargets((prev) => prev.filter((id) => id !== fishId));
  };

  // 魚種のフィルタリング
  const filteredFish = FISH_SPECIES_MASTER.filter((fish) => {
    if (selectedTargets.includes(fish.id)) return false;
    if (!fishInput) return true;
    return fish.kana.includes(fishInput) || (fish.kanji && fish.kanji.includes(fishInput));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          avatarUrl,
          areas: selectedAreas,
          targets: selectedTargets,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '設定を保存しました。' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error ?? '保存に失敗しました。' });
      }
    } catch {
      setMessage({ type: 'error', text: '通信エラーが発生しました。' });
    } finally {
      setIsSaving(false);
    }
  };

  // アバター画像を選択
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（500KB以下）
    if (file.size > 500 * 1024) {
      setMessage({ type: 'error', text: '画像サイズは500KB以下にしてください。' });
      return;
    }

    // 画像形式チェック
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '画像ファイルを選択してください。' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setAvatarUrl(result);
        setMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // アバターを削除
  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  // 候補エリア外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (fishContainerRef.current && !fishContainerRef.current.contains(e.target as Node)) {
        setShowFishDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <AppLayout pageTitle="設定">
        <Card>
          <CardContent>
            <p className="text-gray-500">読み込み中...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="設定">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">ユーザー設定</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* プロフィール画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロフィール画像
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="プロフィール画像"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    画像を選択
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-3 py-1.5 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">500KB以下のJPG、PNG、GIF画像</p>
            </div>

            {/* 表示名 */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                表示名（任意）
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="ニックネームを入力"
              />
            </div>

            {/* よく行くエリア */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                よく行くエリア（複数選択可）
              </label>

              {/* 選択済みエリア */}
              {selectedAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded-full text-sm"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => handleRemoveArea(area)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* エリア入力 */}
              <div className="relative" ref={containerRef}>
                <input
                  ref={inputRef}
                  type="text"
                  value={areaInput}
                  onChange={(e) => handleAreaInputChange(e.target.value)}
                  onKeyDown={handleAreaKeyDown}
                  onFocus={() => areaInput.length >= 2 && setShowSuggestions(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="地名を入力して検索（2文字以上）"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                      className="animate-spin h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                )}

                {/* サジェスト候補 */}
                {showSuggestions && areaSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {areaSuggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                2文字以上入力で候補を検索（例：蒲郡、西浦など市区町村名で検索すると見つけやすいです）
              </p>
            </div>

            {/* ターゲット魚種 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ターゲット魚種（複数選択可）
              </label>

              {/* 選択済み魚種 */}
              {selectedTargets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTargets.map((fishId) => {
                    const fish = FISH_SPECIES_MASTER.find((f) => f.id === fishId);
                    return (
                      <span
                        key={fishId}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-accent text-white rounded-full text-sm"
                        title={fish?.kanji ?? undefined}
                      >
                        {fish?.kana ?? fishId}
                        <button
                          type="button"
                          onClick={() => handleRemoveFish(fishId)}
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 魚種入力 */}
              <div className="relative" ref={fishContainerRef}>
                <input
                  ref={fishInputRef}
                  type="text"
                  value={fishInput}
                  onChange={(e) => setFishInput(e.target.value)}
                  onFocus={() => setShowFishDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                  placeholder="魚種名を入力して絞り込み"
                />

                {/* ドロップダウン */}
                {showFishDropdown && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredFish.length > 0 ? (
                      filteredFish.map((fish) => (
                        <li key={fish.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectFish(fish.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex justify-between items-center"
                          >
                            <span>{fish.kana}</span>
                            {fish.kanji && (
                              <span className="text-gray-400 text-xs">{fish.kanji}</span>
                            )}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-500">該当する魚種がありません</li>
                    )}
                  </ul>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">入力で絞り込み、候補から選択できます</p>
            </div>

            {/* メッセージ */}
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : '設定を保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppLayout>
  );
}
