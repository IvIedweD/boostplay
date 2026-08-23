import { useMemo, useState, type CSSProperties } from 'react';
import {
  avatarCatalog,
  defaultAvatarId,
  defaultFrameId,
  findAvatarCosmetic,
  findFrameCosmetic,
  frameCatalog,
} from '../../../assets/boostplay/cosmetics/catalog';
import './cosmetics.css';

export interface PlayerAvatarProps {
  avatarId: string;
  frameId: string;
  size: number;
  playerName: string;
  className?: string;
}

export function PlayerAvatar({ avatarId, frameId, size, playerName, className = '' }: PlayerAvatarProps) {
  const defaultAvatar = avatarCatalog.find((item) => item.id === defaultAvatarId)!;
  const defaultFrame = frameCatalog.find((item) => item.id === defaultFrameId)!;
  const avatar = findAvatarCosmetic(avatarId) ?? defaultAvatar;
  const frame = findFrameCosmetic(frameId) ?? defaultFrame;
  const [failedAvatarSources, setFailedAvatarSources] = useState<string[]>([]);
  const [failedFrameSources, setFailedFrameSources] = useState<string[]>([]);
  const avatarSrc = failedAvatarSources.includes(avatar.imageUrl)
    ? failedAvatarSources.includes(defaultAvatar.imageUrl) ? null : defaultAvatar.imageUrl
    : avatar.imageUrl;
  const frameSrc = failedFrameSources.includes(frame.imageUrl)
    ? failedFrameSources.includes(defaultFrame.imageUrl) ? null : defaultFrame.imageUrl
    : frame.imageUrl;

  const style = useMemo(() => ({
    '--player-avatar-size': `${size}px`,
    '--player-avatar-inset': `${frame.displayConfig.avatarInsetPercent}%`,
    '--player-avatar-scale': frame.displayConfig.avatarScale,
    '--player-avatar-offset-x': `${frame.displayConfig.avatarOffsetXPercent}%`,
    '--player-avatar-offset-y': `${frame.displayConfig.avatarOffsetYPercent}%`,
    '--player-frame-scale': frame.displayConfig.frameScale,
  } as CSSProperties), [frame.displayConfig, size]);

  const content = (
    <span className="player-avatar__visual" role="img" aria-label={`Аватар игрока ${playerName}: ${avatar.displayName}, рамка ${frame.displayName}`}>
      <span className={`player-avatar__avatar${avatarSrc ? '' : ' is-fallback'}`}>
        {avatarSrc && <img src={avatarSrc} alt="" onError={() => {
          if (import.meta.env.DEV) console.warn(`Не удалось загрузить аватар ${avatar.id}.`);
          setFailedAvatarSources((sources) => sources.includes(avatarSrc) ? sources : [...sources, avatarSrc]);
        }} />}
      </span>
      {frameSrc ? <img className="player-avatar__frame" src={frameSrc} alt="" onError={() => {
        if (import.meta.env.DEV) console.warn(`Не удалось загрузить рамку ${frame.id}.`);
        setFailedFrameSources((sources) => sources.includes(frameSrc) ? sources : [...sources, frameSrc]);
      }} /> : <span className="player-avatar__frame-fallback" aria-hidden="true" />}
    </span>
  );

  return <span className={`player-avatar ${className}`.trim()} style={style}>{content}</span>;
}
