export class Route {
  public constructor(
    public title: string,
    public url: string,
    public isRoomRoute: boolean,
    public params?: Map<string, unknown>
  ) {}
}
