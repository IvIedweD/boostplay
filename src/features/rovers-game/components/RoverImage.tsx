import { getRoverLevel } from '../config/roverLevels';
import type { RoverLevel } from '../types';

interface RoverImageProps {
  level: RoverLevel;
  size: number;
  className?: string;
}

export function RoverImage({ level, size, className }: RoverImageProps) {
  const rover = getRoverLevel(level);
  const crop = rover.sourceCrop;
  const scale = size / Math.max(crop.width, crop.height);
  const visibleWidth = crop.width * scale;
  const visibleHeight = crop.height * scale;

  return (
    <span
      className={`rover-image-crop${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src={rover.assetPath}
        alt=""
        style={{
          width: visibleWidth,
          height: visibleHeight,
          left: (size - visibleWidth) / 2,
          top: (size - visibleHeight) / 2,
        }}
      />
    </span>
  );
}
