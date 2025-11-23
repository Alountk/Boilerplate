export enum GameState {
  Sealed = 0,
  Opened = 1,
  Damaged = 2,
}

export interface LocalizedName {
  language: string;
  name: string;
}

export interface Videogame {
  id: string;
  englishName: string;
  names: LocalizedName[];
  qr: string;
  codebar: string;
  console: string;
  assets: string[];
  images: string[];
  state: GameState;
  releaseDate: string;
  versionGame: string;
}
