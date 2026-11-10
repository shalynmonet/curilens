const TILE_URL = '/assets/monogrammar-houndstooth-glossy-metal_(2).png';

export default function HoundstoothBar({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-5 w-full rounded-full bg-center bg-repeat-x bg-[length:120px_120px] shadow-md shadow-midnight-900/10 ${className}`}
      style={{ backgroundImage: `url("${TILE_URL}")` }}
    />
  );
}
