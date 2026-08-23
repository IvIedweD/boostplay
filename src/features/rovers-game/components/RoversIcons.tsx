interface RoversIconProps {
  className?: string;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function FlaskIcon({ className }: RoversIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M10 2v7.3L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.3V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </svg>
  );
}

export function PauseIcon({ className }: RoversIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <rect width="4" height="16" x="6" y="4" rx="1" />
      <rect width="4" height="16" x="14" y="4" rx="1" />
    </svg>
  );
}

export function PlayIcon({ className }: RoversIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="m6 3 14 9-14 9V3Z" />
    </svg>
  );
}

export function LockIcon({ className }: RoversIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <rect width="14" height="10" x="5" y="11" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function ChevronsRightIcon({ className }: RoversIconProps) {
  return (
    <svg {...iconProps} className={className}>
      <path d="m7 7 5 5-5 5" />
      <path d="m13 7 5 5-5 5" />
    </svg>
  );
}
