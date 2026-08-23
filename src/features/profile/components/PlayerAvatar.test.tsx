import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultAvatarId, defaultFrameId } from '../../../assets/boostplay/cosmetics/catalog';
import { resolveImageFallback } from '../cosmetics/imageFallback';
import { PlayerAvatar } from './PlayerAvatar';

describe('PlayerAvatar', () => {
  it('рисует аватар ниже декоративной рамки и даёт одно описание', () => {
    const html = renderToStaticMarkup(<PlayerAvatar avatarId={defaultAvatarId} frameId={defaultFrameId} size={96} playerName="Игрок" />);
    expect(html.indexOf('player-avatar__avatar')).toBeLessThan(html.indexOf('player-avatar__frame'));
    expect(html).toContain('role="img"');
    expect(html).toContain('Аватар игрока Игрок');
  });

  it('не является элементом настройки профиля', () => {
    const html = renderToStaticMarkup(<PlayerAvatar avatarId={defaultAvatarId} frameId={defaultFrameId} size={96} playerName="Игрок" />);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('Настроить профиль');
  });

  it('fallback не зацикливается', () => {
    expect(resolveImageFallback('/broken.png', '/default.png')).toBe('/default.png');
    expect(resolveImageFallback('/default.png', '/default.png')).toBeNull();
    expect(resolveImageFallback(null, '/default.png')).toBeNull();
  });
});
