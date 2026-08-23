import { getRoverLevel } from '../config/roverLevels';
import type { RoverLevel } from '../types';
import { RoverImage } from './RoverImage';

interface RoverPreviewProps {
  level: RoverLevel;
  label: string;
  compact?: boolean;
}

export function RoverPreview({ level, label, compact = false }: RoverPreviewProps) {
  const rover = getRoverLevel(level);
  return (
    <div className={`rover-preview${compact ? ' is-compact' : ''}`}>
      <span className="rover-preview-frame">
        <RoverImage level={level} size={compact ? 28 : 40} />
      </span>
      <span className="rover-preview-label">{label}</span>
      <strong>{rover.title}</strong>
    </div>
  );
}
