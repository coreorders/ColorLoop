const TILE_TYPES = {
    EMPTY: 0,
    FIXED_RED: 1,
    FIXED_BLUE: 2,
    FIXED_YELLOW: 3,
    TWICE: 5,
    FIXED_SEAT: 6,
    REVERSE: 7,
    PORTAL: 8,
    WALL: 9
};

const COLORS = {
    RED: 'red',
    BLUE: 'blue',
    YELLOW: 'yellow'
};

const COLOR_SYMBOLS = {
    red: '▲',
    blue: '■',
    yellow: '●'
};

class Tile {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.isPainted = false;
        this.paintedColor = null;
        this.isBroken = false;
        this.stepCount = 0; // 진입 횟수 관리
    }

    canEnter(playerColor) {
        if (this.type === TILE_TYPES.WALL || this.isBroken) return false;

        // TWICE 타일은 2번까지 진입 가능 (1회 진입 후에도 isPainted가 false이므로 통과됨)
        if (this.isPainted) return false;

        if (this.type === TILE_TYPES.FIXED_RED && playerColor !== COLORS.RED) return false;
        if (this.type === TILE_TYPES.FIXED_BLUE && playerColor !== COLORS.BLUE) return false;
        if (this.type === TILE_TYPES.FIXED_YELLOW && playerColor !== COLORS.YELLOW) return false;

        return true;
    }

    onEnter(game) {
        this.stepCount++;

        // Wall 제외 진입 처리
        if (this.type !== TILE_TYPES.WALL) {
            // TWICE 타일은 두 번째 밟았을 때만 색이 칠해짐
            if (this.type === TILE_TYPES.TWICE) {
                if (this.stepCount >= 2) {
                    this.isPainted = true;
                    this.paintedColor = game.playerColor;
                }
            } else {
                this.isPainted = true;
                this.paintedColor = game.playerColor;
            }
        }

        if (this.type === TILE_TYPES.REVERSE) {
            game.reverseLoop();
        }

        if (this.type === TILE_TYPES.PORTAL) {
            game.teleport(this);
        }
    }

    onLeave(game) {
        // TWICE 타일(기존 GLASS)은 2회 이상 진입 후 이탈 시 파손
        if (this.type === TILE_TYPES.TWICE && this.stepCount >= 2) {
            this.isBroken = true;
            if (game.onTileBreak) game.onTileBreak();
        }
    }
}
