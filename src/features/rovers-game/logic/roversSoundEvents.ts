export type RoversSoundEvent =
  | 'drop'
  | 'merge'
  | 'dangerStart'
  | 'gameOver'
  | 'legendaryCreated';

let soundEnabled = false;

export function setRoversSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function emitRoversSoundEvent(event: RoversSoundEvent) {
  if (!soundEnabled) return;
  window.dispatchEvent(
    new CustomEvent<RoversSoundEvent>('gamercomm:rovers-sound', {
      detail: event,
    }),
  );
}
