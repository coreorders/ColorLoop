class MapEditor {
    constructor(game) {
        this.game = game;
        this.activeTile = TILE_TYPES.EMPTY;
        this.isVerifying = false;
        this.mapBackup = null;
        this.originalWinCondition = this.game.checkWinCondition.bind(this.game);
        this.isDrawing = false; // 드래그 상태 관리
        this.lastX = -1; // 마지막 드로잉 좌표 (중복 방지)
        this.lastY = -1;
        this.isVerified = false; // 맵 검증 상태

        this.paletteItems = [
            { type: TILE_TYPES.WALL, label: 'WALL', symbol: '▩' },
            { type: TILE_TYPES.EMPTY, label: 'EMPTY', symbol: '·' },
            { type: TILE_TYPES.FIXED_RED, label: 'RED', symbol: '▲', color: 'red' },
            { type: TILE_TYPES.FIXED_BLUE, label: 'BLUE', symbol: '■', color: 'blue' },
            { type: TILE_TYPES.FIXED_YELLOW, label: 'YELLOW', symbol: '●', color: 'yellow' },
            { type: TILE_TYPES.REVERSE, label: 'REV', symbol: '⇄' },
            { type: TILE_TYPES.FIXED_SEAT, label: 'HOLD', symbol: '⏸' },
            { type: TILE_TYPES.TWICE, label: 'TWICE', symbol: '➁' },
            { type: TILE_TYPES.PORTAL, label: 'PORTAL', symbol: '⎔' },
            { type: 'START', label: 'START', symbol: '👤' }
        ];

        this.init();
    }

    init() {
        const paletteContainer = document.getElementById('palette-items');
        paletteContainer.innerHTML = ''; // 기존 팔레트 항목 제거 (중복 방지)
        this.paletteItems.forEach(item => {
            const el = document.createElement('div');
            el.className = `palette-item ${item.color || ''}`;
            el.innerHTML = `<span>${item.symbol}</span>`;
            el.title = item.label;
            el.onclick = () => this.selectTile(item.type, el);
            if (item.type === this.activeTile) el.classList.add('active');
            paletteContainer.appendChild(el);
        });

        // Canvas click/drag for editing
        this.game.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        window.addEventListener('mouseup', () => this.handleEnd());

        // Touch support
        this.game.canvas.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
        this.game.canvas.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        this.game.canvas.addEventListener('touchend', () => this.handleEnd());

        document.getElementById('btn-editor').onclick = () => this.enterEditor();
        document.getElementById('btn-test-play').onclick = () => this.startTestPlay();
        document.getElementById('btn-stop-test').onclick = () => this.stopTestPlay();
        document.getElementById('btn-exit-editor').onclick = () => this.exitEditor();
        document.getElementById('btn-export').onclick = () => this.exportMap();
        document.getElementById('btn-import').onclick = () => this.importMap();
    }

    handleStart(e) {
        if (this.game.isGameActive || !document.getElementById('game-canvas-wrapper').classList.contains('editor-mode')) return;
        if (e.cancelable) e.preventDefault();
        this.isDrawing = true;
        this.lastX = -1;
        this.lastY = -1;
        this.applyTileAt(e);
    }

    handleMove(e) {
        if (!this.isDrawing) return;
        if (e.cancelable) e.preventDefault();
        this.applyTileAt(e);
    }

    handleEnd() {
        this.isDrawing = false;
    }

    applyTileAt(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = Math.floor((clientX - rect.left) / this.game.tileSize);
        const y = Math.floor((clientY - rect.top) / this.game.tileSize);

        if (x >= 0 && x < this.game.width && y >= 0 && y < this.game.height) {
            if (x === this.lastX && y === this.lastY) return; // 중복 드로잉 방지

            if (this.activeTile === 'START') {
                this.game.player.x = x;
                this.game.player.y = y;
            } else {
                this.game.grid[y][x] = new Tile(this.activeTile, x, y);
            }

            this.lastX = x;
            this.lastY = y;
            this.isVerified = false; // 수정 시 검증 상태 초기화
            this.game.render();
        }
    }

    selectTile(type, el) {
        this.activeTile = type;
        document.querySelectorAll('.palette-item').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
    }

    enterEditor() {
        this.isVerifying = false;
        this.isVerified = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('game-canvas-wrapper').className = 'editor-mode';
        document.querySelectorAll('.editor-only').forEach(el => el.classList.remove('hidden'));

        // Blank map with total 10x10 size, but initial 4x4 plates
        const size = 10;
        const emptyMap = Array(size).fill().map((_, y) =>
            Array(size).fill().map((_, x) => {
                // (1,1)부터 (4,4)까지 4x4 구역만 EMPTY, 나머지는 WALL
                if (x >= 1 && x <= 4 && y >= 1 && y <= 4) return TILE_TYPES.EMPTY;
                return TILE_TYPES.WALL;
            })
        );
        this.game.loadMap({ data: emptyMap, start: { x: 1, y: 1 } });
        this.game.isGameActive = false;
        this.game.toggleMobileControls(false); // 에디터 진입 시 숨김
        this.game.render();
    }



    startTestPlay() {
        this.isVerifying = true;
        // Backup current editor state
        this.mapBackup = {
            data: this.game.grid.map(row => row.map(t => t.type)),
            start: { x: this.game.player.x, y: this.game.player.y }
        };

        this.game.loadMap(this.mapBackup);
        this.game.isGameActive = true;
        this.game.startTime = Date.now();
        this.game.updateHUD();
        this.game.toggleMobileControls(true); // 테스트 플레이 시작 시 노출
        this.game.render();

        document.getElementById('btn-test-play').classList.add('hidden');
        document.getElementById('btn-stop-test').classList.remove('hidden');

        // 에디터 테스트 플레이 전용 승리 로직
        this.game.checkWinCondition = () => {
            let allPainted = true;
            for (let y = 0; y < this.game.height; y++) {
                for (let x = 0; x < this.game.width; x++) {
                    const tile = this.game.grid[y][x];
                    if (tile.type !== TILE_TYPES.WALL && !tile.isPainted) {
                        allPainted = false; break;
                    }
                }
                if (!allPainted) break;
            }
            if (allPainted) {
                this.game.isGameActive = false;
                setTimeout(() => {
                    this.isVerified = true; // 검증 성공
                    this.game.showFullMessage("맵 검증 완료!", "이제 코드를 추출(EXPORT)할 수 있습니다.", { showClose: true });
                    this.stopTestPlay();
                }, 50);
            }
        };

        this.game.showFullMessage("Test Play Started!", "모든 타일을 색칠하여 맵을 검증하세요.", { showClose: true });
    }

    stopTestPlay() {
        this.isVerifying = false;
        this.game.isGameActive = false;
        this.game.checkWinCondition = this.originalWinCondition;

        if (this.mapBackup) {
            this.game.loadMap(this.mapBackup);
        }

        document.getElementById('btn-test-play').classList.remove('hidden');
        document.getElementById('btn-stop-test').classList.add('hidden');
        this.game.toggleMobileControls(false); // 테스트 종료 시 숨김
        this.game.render();
    }

    exitEditor() {
        document.getElementById('game-canvas-wrapper').className = 'play-mode';
        document.querySelectorAll('.editor-only').forEach(el => el.classList.add('hidden'));
        this.game.toggleMobileControls(false); // 에디터 종료 시 숨김
        document.getElementById('main-menu').classList.add('active');
    }

    exportMap() {
        if (!this.isVerified) {
            this.game.showFullMessage("검증 필요", "맵을 클리어한 후에 내보낼 수 있습니다.", {
                showClose: false,
                autoClose: 2000
            });
            return;
        }
        const name = document.getElementById('input-map-name').value;
        const creator = document.getElementById('input-creator').value;
        const data = this.game.grid.map(row => row.map(t => t.type));
        const start = { x: this.game.player.x, y: this.game.player.y };

        const mapManager = new MapManager();
        const code = mapManager.exportMap(name, creator, data, start);

        // 클립보드 복사 시도
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code).then(() => {
                this.game.showFullMessage("복사 성공!", "맵 코드가 클립보드에 복사되었습니다. 친구에게 공유해보세요!", { showClose: true });
            }).catch(err => {
                this.showExportFallback(code);
            });
        } else {
            this.showExportFallback(code);
        }
    }

    showExportFallback(code) {
        this.game.showFullMessage("맵 코드 추출", "클립보드 자동 복사에 실패했습니다. 아래 코드를 직접 복사해주세요:", {
            showLoad: false, // 로드 버튼은 숨김
            showClose: true
        });
        const textarea = document.getElementById('map-code-input');
        textarea.classList.remove('hidden');
        textarea.value = code;
        textarea.select();
    }

    importMap() {
        this.game.showFullMessage("맵 코드 불러오기", "아래에 코드를 붙여넣어 주세요:", {
            showLoad: true,
            showClose: true
        });

        const textarea = document.getElementById('map-code-input');
        const loadBtn = document.getElementById('btn-load-code');
        const modal = document.getElementById('modal-container');

        textarea.value = "";

        loadBtn.onclick = () => {
            const code = textarea.value.trim();
            if (!code) return;

            try {
                const mapManager = new MapManager();
                const mapData = mapManager.loadMap(code);

                if (mapData) {
                    document.getElementById('input-map-name').value = mapData.name || "Imported Level";
                    document.getElementById('input-creator').value = mapData.creator || "Unknown";

                    this.game.loadMap(mapData);
                    this.game.isGameActive = false;
                    this.isVerified = false; // 새로 불러온 맵도 검증 필요
                    this.game.render();

                    modal.classList.add('hidden');
                }
            } catch (err) {
                this.game.showFullMessage("오류", "잘못된 코드입니다. 다시 확인해 주세요!", { showClose: true });
            }
        };
    }

    start() {
        this.enterEditor();
    }
}

// Attach to global game object
window.addEventListener('load', () => {
    window.editor = new MapEditor(window.game);
});
