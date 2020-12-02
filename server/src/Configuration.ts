export interface IConfiguration {
  // SERVER STUFF
  PORT: number;

  // ROOM STUFF
  INACTIVE_ROOM_LIFETIME_MS: number;
}

export const Configuration: IConfiguration = {
  PORT: 6503,
  INACTIVE_ROOM_LIFETIME_MS: 8640000, // 1day
};
