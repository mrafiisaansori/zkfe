import { BrandLoader } from './BrandLoader';

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white py-14">
      <BrandLoader label={label} />
    </div>
  );
}
