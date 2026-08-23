export function shouldPersistRoversGameResult(prototypeMode: boolean): boolean {
  return !prototypeMode;
}

export function shouldRememberRoversRulesViewed(prototypeMode: boolean): boolean {
  return !prototypeMode;
}
