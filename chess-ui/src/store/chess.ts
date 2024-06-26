import { create } from 'zustand'
import DartApi, { AvailableServices, ParsedServiceId, Service, ServiceId, parseServiceId } from '@dartfrog/puddle';
import { Howl } from 'howler';

export const PLUGIN_NAME = "chess:dartfrog:herobrine.os";

// Define the Chess Game State type
export interface ChessGameState {
  white: string;          // Identifier for the player controlling white pieces
  black: string;          // Identifier for the player controlling black pieces
  isWhiteTurn: boolean;   // Flag to indicate if it is the white player's turn
  moves: string[];        // List of moves made in the game, in standard chess notation
}

// Define the overall Chess State type including the game and queue information
export type ChessState = {
  game: ChessGameState | null;    // Current state of the game or null if no game is active
  queuedWhite: string | null;     // Identifier of the white player queued for the next game or null
  queuedBlack: string | null;     // Identifier of the black player queued for the next game or null
}

export const newChessState = (): ChessState => {
  return {
    game: null,             // No active game initially
    queuedWhite: null,      // No player queued for white
    queuedBlack: null       // No player queued for black
  };
}

// Function to handle incoming updates for the chess game
export function handleChessUpdate(chessState: ChessState | null, update: any): ChessState {
    // Handle case when chessState is null by initializing a new state
    if (!chessState) {
        chessState = newChessState();
    }

    if (update['ChessState']) {
        // Handle updates to the entire chess game state
        let updateGame = update.ChessState.game;
        let newChessGame;

        if (updateGame===null) {
            newChessGame = null;
        } else {
            newChessGame = {
                white: updateGame.white,
                black: updateGame.black,
                isWhiteTurn: updateGame.is_white_turn,
                moves: updateGame.moves
            }
        }

        let newChessState = {
            game: newChessGame,
            queuedWhite: update.ChessState.queued_white,
            queuedBlack: update.ChessState.queued_black
        }
        return { ...newChessState };
    } else if (update === 'GameStart') {
        const sound = new Audio('/chess:dartfrog:herobrine.os/assets/chess-game-started.mp3');
        sound.play();

        return chessState;
    } else {
        console.log('Unknown chess update', update);
    }
}



export interface ChessStore {
  serviceId: string | null,
  setServiceId: (service: string) => void
  api: DartApi | null,
  setApi: (api: DartApi) => void
  //
  chessState: ChessState | null,
  setChessState: (chessState: ChessState) => void
  //
  sendChessRequest: (req: any) => void
  // 
  nameColors: Map<string, string>
  addNameColor: (name:string, color:string) => void
  // 
  get: () => ChessStore 
  set: (partial: ChessStore | Partial<ChessStore>) => void
}

const useChessStore = create<ChessStore>((set, get) => ({
  serviceId: null,
  setServiceId: (serviceId) => set({ serviceId }),
  api: null,
  setApi: (api) => set({ api }),
  // 
  chessState: null,
  setChessState: (chessState) => set({ chessState }),
  // 
  sendChessRequest: (req) => {
    const { api, serviceId } = get();
    if (!api) { return; }
    if (!serviceId) { return; }
    api.pokePluginService(serviceId, PLUGIN_NAME, req);
  },
  // 
  nameColors: new Map<string, string>(),
  addNameColor: (name:string, color:string) => {
    const { nameColors } = get()
    nameColors[name] = color;
    set({ nameColors: nameColors })
  },
  // 
  get,
  set,
}))

export default useChessStore;
