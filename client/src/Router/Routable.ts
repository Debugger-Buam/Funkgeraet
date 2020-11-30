export interface Routable {
    getRouteRegex(): RegExp;
    getTitle(): string;
    onRouteVisited(matchResult: RegExpMatchArray): void;
    onRouteLeft(): void;
}
