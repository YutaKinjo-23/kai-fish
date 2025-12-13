'use client';

import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  featureKey?: string;
  onClose: () => void;
};

export function ProUpsellModal({ isOpen, featureKey, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proプラン限定機能" size="sm">
      <div className="p-6 flex flex-col gap-4">
        <p className="text-gray-600">
          この機能を利用するにはProプランへのアップグレードが必要です。
        </p>
        {/* {featureKey && <p className="text-xs text-gray-400">Feature: {featureKey}</p>} */}

        <div className="flex flex-col gap-3 mt-4">
          <Link href="/settings" className="w-full">
            <Button variant="primary" className="w-full">
              Proにする
            </Button>
          </Link>
          <Button onClick={onClose} variant="outline" className="w-full">
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  );
}
