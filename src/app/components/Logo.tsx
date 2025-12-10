import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      className="mb-6 inline-flex items-center gap-3 rounded-lg text-[#0077FF] transition hover:text-[#0066DD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0077FF]/30"
      aria-label="KAI-海 ホームへ戻る"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#0077FF]/15">
        <Image src="/kai-wave.svg" alt="KAI wave" width={48} height={48} priority />
      </div>
      <span className="text-2xl font-bold tracking-tight">KAI-海</span>
    </Link>
  );
}
