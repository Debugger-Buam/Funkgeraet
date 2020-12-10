export interface Routable<ParamType> {
  getRouteRegex(): RegExp;
  getTitle(): string;
  onRouteVisited(matchResult: RegExpMatchArray, param?: ParamType): void;
  onRouteLeft(): void;
}
