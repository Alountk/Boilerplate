export enum GameState {
  Sealed = 0,
  Opened = 1,
  Damaged = 2,
}

export interface LocalizedName {
  language: string;
  name: string;
}

export interface GameContent {
  frontalUrl: string;
  backUrl: string;
  rightSideUrl: string;
  leftSideUrl: string;
  topSideUrl: string;
  bottomSideUrl: string;
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
  description: string;
  urlImg: string;
  generalState: number;
  averagePrice: number;
  ownPrice: number;
  acceptOffersRange: number;
  score: number;
  category: number;
  contents: GameContent[];
}
