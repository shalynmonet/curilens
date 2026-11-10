import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link
      to="/"
      className="group block relative aspect-[21/9] w-full overflow-hidden rounded-3xl ring-1 ring-brass-400/30 shadow-xl shadow-midnight-900/15 transition-transform duration-500 hover:scale-[1.01]"
    >
      <img
        src="/assets/curilens-logo.jpg"
        alt="Curilens"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
    </Link>
  );
}
