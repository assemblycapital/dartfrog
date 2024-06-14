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
export function handleChessUpdate(chessState: ChessState, update: string): ChessState {
    const parsedUpdate = JSON.parse(update);
    if (!parsedUpdate) return chessState;

    console.log('Chess update:', parsedUpdate);
    if (parsedUpdate['ChessState']) {
        console.log('Chess update handling', parsedUpdate);
        // Handle updates to the entire chess game state
        let newChessState = {
            game: parsedUpdate.ChessState.game,
            queuedWhite: parsedUpdate.ChessState.queued_white,
            queuedBlack: parsedUpdate.ChessState.queued_black
        }
        return { ...newChessState };
        // chessState.game = parsedUpdate.ChessState.game;
        // chessState.queuedWhite = parsedUpdate.ChessState.queuedWhite;
        // chessState.queuedBlack = parsedUpdate.ChessState.queuedBlack;

    } else {
        console.log('Unknown chess update', parsedUpdate);
    }
}

