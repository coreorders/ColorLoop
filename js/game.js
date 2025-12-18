class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 40;

        this.player = {
            x: 0,
            y: 0,
            colorIndex: 0, // 0: Red, 1: Blue, 2: Yellow
            colorLoop: [COLORS.RED, COLORS.BLUE, COLORS.YELLOW],
            isReversed: false
        };

        this.grid = [];
        this.width = 0;
        this.height = 0;

        this.elapsedTime = 0;
        this.isGameActive = false;
        this.isCustomPlay = false;

        this.tries = 1;

        this.customMaps = JSON.parse(localStorage.getItem('colorloop_custom_maps') || '[]');

        this.mapManager = new MapManager();
        this.currentStageIdx = 0;
        this.currentMapData = null;

        this.tutorialStep = 0;
        this.moveHistory = [];
        this.initEventListeners();
        this.initVersionDisplay();
        this.initSoundControls();
        this.gameLoop();
        this.showLobby();
    }

    initSoundControls() {
        const hudToggle = document.getElementById('sound-toggle-btn');
        const lobbyToggle = document.getElementById('lobby-sound-btn');

        const updateSoundIcons = (isMuted) => {
            const iconOn = document.getElementById('icon-sound-on');
            const iconOff = document.getElementById('icon-sound-off');
            if (iconOn) iconOn.classList.toggle('hidden', isMuted);
            if (iconOff) iconOff.classList.toggle('hidden', !isMuted);

            if (lobbyToggle) {
                const lobbyOn = lobbyToggle.querySelector('.icon-on');
                const lobbyOff = lobbyToggle.querySelector('.icon-off');
                if (lobbyOn) lobbyOn.classList.toggle('hidden', isMuted);
                if (lobbyOff) lobbyOff.classList.toggle('hidden', !isMuted);
            }
        };

        const handleToggle = () => {
            const isMuted = window.audioManager.toggleMute();
            updateSoundIcons(isMuted);
            if (!isMuted) {
                window.audioManager.resume();
                window.audioManager.startBGM();
            }
        };

        if (hudToggle) hudToggle.onclick = handleToggle;
        if (lobbyToggle) lobbyToggle.onclick = handleToggle;

        const enableAudio = async () => {
            window.audioManager.init();
            await window.audioManager.resume();
            window.audioManager.startBGM();
            updateSoundIcons(window.audioManager.isMuted);
            window.removeEventListener('click', enableAudio);
            window.removeEventListener('keydown', enableAudio);
            window.removeEventListener('touchstart', enableAudio);
        };
        window.addEventListener('click', enableAudio);
        window.addEventListener('keydown', enableAudio);
        window.addEventListener('touchstart', enableAudio);
    }

    initVersionDisplay() {
        if (typeof PATCH_NOTES_DATA !== 'undefined' && PATCH_NOTES_DATA.length > 0) {
            const latestVersion = PATCH_NOTES_DATA[0].version;
            const mainVerEl = document.getElementById('version-info');
            if (mainVerEl) mainVerEl.innerText = latestVersion;
            const patchVerEl = document.getElementById('patch-version-val');
            if (patchVerEl) patchVerEl.innerText = latestVersion;
        }
    }

    get playerColor() {
        return this.player.colorLoop[this.player.colorIndex];
    }

    get nextColor() {
        let delta = this.player.isReversed ? -1 : 1;
        let nextIdx = (this.player.colorIndex + delta + 3) % 3;
        return this.player.colorLoop[nextIdx];
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (!this.isGameActive) return;

            switch (e.key) {
                case 'ArrowUp': case 'w': this.move(0, -1); break;
                case 'ArrowDown': case 's': this.move(0, 1); break;
                case 'ArrowLeft': case 'a': this.move(-1, 0); break;
                case 'ArrowRight': case 'd': this.move(1, 0); break;
            }
        });

        document.getElementById('btn-play').addEventListener('click', () => {
            this.startLevel(null, 0);
        });

        document.getElementById('btn-tutorial').addEventListener('click', () => {
            this.startTutorial();
        });

        document.getElementById('btn-tutorial-next').addEventListener('click', () => {
            this.nextTutorial();
        });

        // Mobile Controls
        const bindMobileBtn = (id, dx, dy) => {
            const btn = document.getElementById(id);
            const moveHandler = (e) => {
                e.preventDefault();
                if (this.isGameActive) this.move(dx, dy);
            };
            if (btn) {
                btn.addEventListener('touchstart', moveHandler);
                btn.addEventListener('mousedown', moveHandler);
            }
        };

        bindMobileBtn('ctrl-up', 0, -1);
        bindMobileBtn('ctrl-down', 0, 1);
        bindMobileBtn('ctrl-left', -1, 0);
        bindMobileBtn('ctrl-right', 1, 0);

        document.getElementById('btn-show-patches').onclick = () => this.showPatchNotes();
        document.getElementById('btn-hide-patches').onclick = () => this.hidePatchNotes();
        document.getElementById('btn-close-modal').onclick = () => document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('btn-restart').onclick = () => { if (this.isGameActive) this.restartLevel(); };
        document.getElementById('btn-exit').onclick = () => this.exitToMenu();
        document.getElementById('btn-undo').onclick = () => { if (this.isGameActive) this.undo(); };
        document.getElementById('btn-custom').onclick = () => this.showCustomMenu();
        document.getElementById('btn-back-to-menu').onclick = () => this.hideCustomMenu();
        document.getElementById('btn-import-custom').onclick = () => this.importCustomFromInput();
        document.getElementById('btn-go-to-gallery').onclick = () => {
            window.open('https://gall.dcinside.com/mini/board/view/?id=itsjustforme&no=272&page=1', '_blank');
        };

        document.getElementById('btn-play-again').onclick = () => {
            document.getElementById('modal-container').classList.add('hidden');
            this.restartLevel();
            this.isGameActive = true;
        };

        document.getElementById('btn-next-level').onclick = () => {
            document.getElementById('modal-container').classList.add('hidden');
            if (this.isCustomPlay) {
                this.exitToMenu();
            } else {
                this.startLevel(null, this.currentStageIdx + 1);
            }
        };

        document.getElementById('btn-editor').onclick = () => {
            window.location.hash = 'editor';
            this.isGameActive = false;
            if (window.editor) window.editor.enterEditor();
        };
    }

    exitToMenu() {
        this.isGameActive = false;
        this.showLobby();
    }

    showLobby() {
        document.getElementById('main-menu').classList.add('active');
        document.getElementById('custom-menu').classList.remove('active');
        document.getElementById('patch-notes-menu').classList.remove('active');
        this.toggleMobileControls(false); // 로비에서는 조작기 절대 숨김
        this.toggleBottomHUD(false); // 메인 메뉴에서는 버전 정보 모드
        this.render();
    }

    toggleBottomHUD(isGame) {
        const versionEl = document.getElementById('version-info');
        const actionsEl = document.getElementById('game-actions');
        if (isGame) {
            versionEl.classList.add('hidden');
            actionsEl.classList.remove('hidden');
        } else {
            versionEl.classList.remove('hidden');
            actionsEl.classList.add('hidden');
        }
    }

    showPatchNotes() {
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('patch-notes-menu').classList.add('active');
        this.renderPatchNotes();
    }

    hidePatchNotes() {
        document.getElementById('patch-notes-menu').classList.remove('active');
        document.getElementById('main-menu').classList.add('active');
    }

    renderPatchNotes() {
        const content = document.getElementById('patch-notes-content');
        if (typeof PATCH_NOTES_DATA === 'undefined') {
            content.innerHTML = `<div style="color:#ef4444; text-align:center; padding:20px;">패치노트 데이터를 불러오지 못했습니다.</div>`;
            return;
        }
        const html = PATCH_NOTES_DATA.map(patch => `
            <div class="patch-version-block">
                <h3 style="color:var(--accent); margin-top:20px;">${patch.version} (${patch.date})</h3>
                <ul style="margin-top:10px;">
                    ${patch.changes.map(change => `<li style="margin-left:15px; margin-bottom:8px; list-style:none; position:relative; padding-left:20px;"><span style="position:absolute; left:0; color:var(--accent);">•</span>${change}</li>`).join('')}
                </ul>
            </div>
        `).join('');
        content.innerHTML = `<div class="patch-scroll-area">${html}</div>`;
    }

    showCustomMenu() {
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('custom-menu').classList.add('active');
        this.renderCustomList();
    }

    hideCustomMenu() {
        document.getElementById('custom-menu').classList.remove('active');
        document.getElementById('main-menu').classList.add('active');
    }

    importCustomFromInput() {
        const input = document.getElementById('input-import-code');
        const code = input.value.trim();
        if (!code) return;
        try {
            const decoded = this.mapManager.loadMap(code);
            if (!decoded) throw new Error("Invalid Code");

            const now = new Date();
            const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const mapEntry = {
                id: Date.now(),
                name: decoded.name || "Custom Map",
                creator: decoded.creator || "Anonymous",
                code: code,
                date: dateStr,
                timestamp: Date.now()
            };
            this.customMaps.push(mapEntry);
            localStorage.setItem('colorloop_custom_maps', JSON.stringify(this.customMaps));
            input.value = "";
            this.renderCustomList();
        } catch (e) {
            this.showFullMessage("Error", "잘못된 맵 코드입니다.");
            // 1초 후 자동으로 창 닫기
            setTimeout(() => {
                document.getElementById('modal-container').classList.add('hidden');
            }, 1000);
        }
    }

    renderCustomList() {
        const list = document.getElementById('custom-map-list');
        list.innerHTML = "";
        if (this.customMaps.length === 0) {
            list.innerHTML = "<div style='text-align:center; padding:20px; color:var(--text-secondary);'>저장된 맵이 없습니다.</div>";
            return;
        }
        // 최신순 정렬
        const sortedMaps = [...this.customMaps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        sortedMaps.forEach(map => {
            const item = document.createElement('div');
            item.className = "custom-map-item";
            item.innerHTML = `
                <div class="map-details">
                    <strong>${map.name}</strong>
                    <span>by ${map.creator}</span>
                    <small style="display:block; font-size:10px; opacity:0.6; margin-top:2px;">${map.date || ''}</small>
                </div>
                <div class="map-btn-wrapper">
                    <button class="premium-btn small play-btn">PLAY</button>
                    <button class="delete-map-btn" title="삭제">×</button>
                </div>
            `;
            item.querySelector('.play-btn').onclick = () => this.startCustomMap(map.code);
            item.querySelector('.delete-map-btn').onclick = (e) => {
                e.stopPropagation();
                this.deleteCustomMap(map.id);
            };
            list.appendChild(item);
        });
    }

    deleteCustomMap(id) {
        this.showFullMessage("맵 삭제", "정말 이 맵을 삭제하시겠습니까?", {
            showConfirm: true,
            confirmLabel: "삭제하기",
            onConfirm: () => {
                this.customMaps = this.customMaps.filter(m => m.id !== id);
                localStorage.setItem('colorloop_custom_maps', JSON.stringify(this.customMaps));
                this.renderCustomList();
                document.getElementById('modal-container').classList.add('hidden');
            }
        });
    }

    startCustomMap(code) {
        const decoded = this.mapManager.loadMap(code);
        if (decoded) {
            this.isCustomPlay = true;
            document.getElementById('custom-menu').classList.remove('active');
            this.startLevel(decoded);
        }
    }

    startLevel(mapData = null, stageIdx = 0) {
        let mapObj;
        let mapConfig = null;

        if (mapData) {
            mapObj = mapData;
            this.currentStageIdx = -1;
            this.isCustomPlay = true;
        } else {
            if (stageIdx >= STAGES_DATA.length) {
                this.exitToMenu();
                return;
            }
            mapConfig = STAGES_DATA[stageIdx];
            mapObj = this.mapManager.loadMap(mapConfig.mapCode);
            this.currentStageIdx = stageIdx;
            this.isCustomPlay = false;
        }

        if (mapObj) {
            this.currentMapData = mapObj;
            this.loadMap(mapObj);
            document.getElementById('main-menu').classList.remove('active');

            // 시작 메시지 팝업 (공식 스테이지일 경우)
            if (mapConfig && mapConfig.startMessage) {
                this.isGameActive = false; // 팝업 닫기 전까지 멈춤
                this.showFullMessage(`스테이지 ${stageIdx + 1}`, mapConfig.startMessage, {
                    showClose: true
                });
                // Close 버튼 클릭 시 게임 활성화되도록 연동
                const originalClose = document.getElementById('btn-close-modal').onclick;
                document.getElementById('btn-close-modal').onclick = () => {
                    document.getElementById('modal-container').classList.add('hidden');
                    this.isGameActive = true;
                    this.startTime = Date.now();
                    // Restore original close handler if needed, or just keep this one for game context
                    document.getElementById('btn-close-modal').onclick = originalClose;
                };
            } else {
                this.isGameActive = true;
                this.startTime = Date.now();
            }

            this.tries = 1;
            this.moveHistory = [];
            this.toggleMobileControls(true);
            this.toggleBottomHUD(true);
            this.updateHUD();
            this.render();
        }
    }

    restartLevel() {
        this.tries++;
        this.loadMap(this.currentMapData);
        this.startTime = Date.now();
        this.moveHistory = [];
        this.isGameActive = true;
        this.updateHUD();
        this.render();
    }

    toggleMobileControls(show) {
        const mc = document.getElementById('mobile-controls');
        const hud = document.getElementById('hud-top');
        if (mc) mc.classList.toggle('hidden', !show);
        if (hud) {
            const isEditor = document.getElementById('game-canvas-wrapper').classList.contains('editor-mode');
            const isTest = window.editor && window.editor.isVerifying;
            if (isEditor && !isTest) {
                hud.style.display = 'none';
            } else {
                hud.style.display = show ? 'flex' : 'none';
            }
        }
    }

    loadMap(map) {
        this.grid = map.data.map((row, y) => row.map((type, x) => new Tile(type, x, y)));
        this.height = this.grid.length;
        this.width = this.grid[0].length;
        this.player = { x: map.start.x, y: map.start.y, colorIndex: 0, isReversed: false, colorLoop: [COLORS.RED, COLORS.BLUE, COLORS.YELLOW] };
        this.moveHistory = [];
        this.grid[this.player.y][this.player.x].onEnter(this);
        this.canvas.width = this.width * this.tileSize;
        this.canvas.height = this.height * this.tileSize;
        document.getElementById('map-name').innerText = map.name;
        document.getElementById('creator-name').innerText = `by ${map.creator}`;
    }

    move(dx, dy) {
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) return;
        const currentTile = this.grid[this.player.y][this.player.x];
        const nextTile = this.grid[ny][nx];
        let willChangeColor = currentTile.type !== TILE_TYPES.FIXED_SEAT;
        let delta = this.player.isReversed ? -1 : 1;
        let hIdx = willChangeColor ? (this.player.colorIndex + delta + 3) % 3 : this.player.colorIndex;
        if (nextTile.canEnter(this.player.colorLoop[hIdx])) {
            window.audioManager.playMove(); // 이동 효과음
            this.saveState();
            currentTile.onLeave(this);
            this.player.x = nx; this.player.y = ny;
            if (willChangeColor) this.player.colorIndex = hIdx;

            // 색칠 사운드 조건 (이미 색칠된 경우는 제외)
            if (!nextTile.isPainted && nextTile.type !== TILE_TYPES.WALL) {
                if (nextTile.type === TILE_TYPES.TWICE) {
                    if (nextTile.stepCount === 1) window.audioManager.playPaint(); // 두번째 밟을 때 채색 소리
                } else {
                    window.audioManager.playPaint();
                }
            }

            nextTile.onEnter(this);
            this.checkWinCondition();
            this.updateHUD();
            this.render();
        }
    }

    saveState() {
        this.moveHistory.push({ player: { ...this.player }, gridStates: this.grid.map(row => row.map(t => ({ isPainted: t.isPainted, paintedColor: t.paintedColor, isBroken: t.isBroken }))) });
        if (this.moveHistory.length > 50) this.moveHistory.shift();
    }

    undo() {
        if (this.moveHistory.length === 0) return;
        const prevState = this.moveHistory.pop();
        this.player = { ...prevState.player };
        prevState.gridStates.forEach((rowStates, y) => { rowStates.forEach((tState, x) => { const t = this.grid[y][x]; t.isPainted = tState.isPainted; t.paintedColor = tState.paintedColor; t.isBroken = tState.isBroken; }); });
        this.updateHUD(); this.render();
    }

    reverseLoop() { this.player.isReversed = !this.player.isReversed; }

    teleport(fromTile) {
        const portals = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x].type === TILE_TYPES.PORTAL && (x !== fromTile.x || y !== fromTile.y)) {
                    portals.push(this.grid[y][x]);
                }
            }
        }
        if (portals.length > 0) {
            window.audioManager.playTeleport(); // 텔레포트 효과음
            const target = portals[0];
            this.player.x = target.x;
            this.player.y = target.y;
            // 대상 포탈로 즉시 이동하되, onEnter를 다시 호출하지 않음 (재귀 방지)
            // 대신 수동으로 페인팅 및 위치 갱신 처리
            target.stepCount++;
            target.isPainted = true;
            target.paintedColor = this.playerColor;
        }
    }

    startTutorial() { this.tutorialStep = 1; this.showTutorialStep(); }
    nextTutorial() { this.tutorialStep++; if (this.tutorialStep > 5) { document.getElementById('modal-container').classList.add('hidden'); this.exitToMenu(); } else this.showTutorialStep(); }
    showTutorialStep() {
        const steps = ["", "바닥에 모두 색을 칠하는 게임이에요.", "색상은 순서대로 변해요.<br><br><span style='color:#ef4444'>빨강</span> → <span style='color:#3b82f6'>파랑</span> → <span style='color:#eab308'>노랑</span>", "어떤 바닥은 특정 색상만 칠할 수 있어요.<br><br>아이콘을 잘 확인해 보세요! (▲, ■, ●)", "어떤 바닥은 두 번 밟아야 색이 칠해지기도 해요.<br><br>➁ 아이콘이 있다면 신중하게 경로를 짜보세요!", "또 어떤 바닥은 색상 순서를 뒤집기도 해요.<br><br>⇄ 발판을 밟으면 순서가 반대로 바뀝니다.", "<b>맵 만들기</b>로 맵을 만들어 친구와 공유할 수도 있어요! 만들어서 친구한테 풀게 해보세요."];
        this.showFullMessage("게임 방법", steps[this.tutorialStep], { showTutorialNext: true, showClose: true });
    }

    checkWinCondition() {
        let allPainted = true;
        for (let y = 0; y < this.height; y++) { for (let x = 0; x < this.width; x++) { if (this.grid[y][x].type !== TILE_TYPES.WALL && !this.grid[y][x].isPainted) { allPainted = false; break; } } if (!allPainted) break; }
        if (allPainted) {
            this.isGameActive = false;
            window.audioManager.playClear(); // 스테이지 클리어 사운드
            setTimeout(() => {
                const time = ((Date.now() - this.startTime) / 1000).toFixed(3);
                const isFinal = !this.isCustomPlay && this.currentStageIdx >= STAGES_DATA.length - 1;
                const stageData = (!this.isCustomPlay && STAGES_DATA[this.currentStageIdx]) ? STAGES_DATA[this.currentStageIdx] : null;
                const clearMsg = stageData ? stageData.clearMessage : "참 잘했어요!";

                if (isFinal) {
                    this.showFullMessage("전체 클리어!", `${clearMsg}<br><br>마지막 기록: ${time}초`, { showPlayAgain: true, showClose: true });
                    this.exitToMenu();
                } else {
                    this.showFullMessage(`스테이지 ${this.currentStageIdx + 1} 클리어`, `${clearMsg}<br><br>걸린 시간: ${time}초`, { showNext: true, showPlayAgain: true });
                }
            }, 50);
        }
    }

    onTileBreak() {
        window.audioManager.playBreak(); // 파손 효과음
    }

    showMessage(title, msg) {
        this.showFullMessage(title, msg);
    }

    showFullMessage(title, msg, options = {}) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerHTML = msg;

        // Hide all special buttons by default
        const btnNext = document.getElementById('btn-next-level');
        const btnTutorialNext = document.getElementById('btn-tutorial-next');
        const btnConfirm = document.getElementById('btn-confirm-action');
        const btnAgain = document.getElementById('btn-play-again');
        const btnLoad = document.getElementById('btn-load-code');
        const btnClose = document.getElementById('btn-close-modal');
        const input = document.getElementById('map-code-input');

        btnNext.classList.toggle('hidden', !options.showNext);
        btnTutorialNext.classList.toggle('hidden', !options.showTutorialNext);
        btnConfirm.classList.toggle('hidden', !options.showConfirm);
        btnAgain.classList.toggle('hidden', !options.showPlayAgain);
        if (btnLoad) btnLoad.classList.toggle('hidden', !options.showLoad);

        if (options.showConfirm && options.onConfirm) {
            btnConfirm.innerText = options.confirmLabel || "확인";
            btnConfirm.onclick = options.onConfirm;
        }

        const hasActions = options.showNext || options.showTutorialNext || options.showConfirm || options.showPlayAgain || options.showLoad;
        if (options.showClose === true) {
            btnClose.classList.remove('hidden');
        } else if (options.showClose === false) {
            btnClose.classList.add('hidden');
        } else {
            btnClose.classList.toggle('hidden', hasActions);
        }

        if (input) input.classList.toggle('hidden', !options.showLoad);

        document.getElementById('modal-container').classList.remove('hidden');
    }

    updateHUD() {
        const seqSteps = document.getElementById('sequence-steps');
        const isReversed = this.player.isReversed;
        const baseSequence = [COLORS.RED, COLORS.BLUE, COLORS.YELLOW];
        const currentColor = this.playerColor;
        const activeIdxInBase = baseSequence.indexOf(currentColor);
        const arrow = isReversed ? '←' : '→';

        seqSteps.innerHTML = baseSequence.map((c, i) => {
            const active = i === activeIdxInBase ? 'active' : '';
            return `<span class="seq-step ${c} ${active}">${COLOR_SYMBOLS[c]}</span>`;
        }).join(`<span class="sep">${arrow}</span>`);
    }

    gameLoop() {
        if (this.isGameActive && this.startTime) {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            const timeEl = document.getElementById('time-val');
            if (timeEl) timeEl.innerText = `${this.elapsedTime}s`;
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.drawTile(x, y, this.grid[y][x]);
            }
        }
        this.drawPlayer();
    }

    drawTile(x, y, tile) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;

        this.ctx.fillStyle = '#334155';
        if (tile.type === TILE_TYPES.WALL) this.ctx.fillStyle = '#0f172a';
        if (tile.isPainted) this.ctx.fillStyle = this.getHexColor(tile.paintedColor);
        if (tile.isBroken) this.ctx.fillStyle = '#1e293b'; // 파손 시 더 어두운 배경

        this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);
        this.ctx.strokeRect(px + 1, py + 1, this.tileSize - 2, this.tileSize - 2);

        if (tile.type === TILE_TYPES.FIXED_RED) this.drawMarker(px, py, COLORS.RED);
        if (tile.type === TILE_TYPES.FIXED_BLUE) this.drawMarker(px, py, COLORS.BLUE);
        if (tile.type === TILE_TYPES.FIXED_YELLOW) this.drawMarker(px, py, COLORS.YELLOW);

        if (tile.type === TILE_TYPES.FIXED_SEAT) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('⏸', px + this.tileSize / 2, py + this.tileSize / 2 + 5);
        }
        if (tile.type === TILE_TYPES.REVERSE) {
            this.ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
            this.ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
            this.ctx.fillStyle = '#8b5cf6';
            this.ctx.font = '16px Arial';
            this.ctx.fillText('⇄', px + this.tileSize / 2, py + this.tileSize / 2 + 6);
        }
        if (tile.type === TILE_TYPES.TWICE) {
            this.ctx.strokeStyle = tile.isPainted ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(px + 5, py + 5, this.tileSize - 10, this.tileSize - 10);

            if (tile.isBroken) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.font = '16px Arial';
                this.ctx.fillText('✕', px + this.tileSize / 2, py + this.tileSize / 2 + 5);
            } else {
                const remaining = 2 - tile.stepCount;
                if (remaining > 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.font = '14px Arial';
                    this.ctx.fillText(remaining === 2 ? '➁' : '➀', px + this.tileSize / 2, py + this.tileSize / 2 + 5);
                }
            }
        }
        if (tile.type === TILE_TYPES.PORTAL) {
            this.ctx.strokeStyle = '#a855f7';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize / 4, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
            this.ctx.fill();
        }
    }

    drawMarker(px, py, color) {
        this.ctx.fillStyle = this.getHexColor(color);
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(px + 2, py + 2, this.tileSize - 4, this.tileSize - 4);
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(COLOR_SYMBOLS[color], px + this.tileSize / 2, py + this.tileSize / 2 + 6);
    }

    drawPlayer() {
        const px = this.player.x * this.tileSize;
        const py = this.player.y * this.tileSize;

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = this.getHexColor(this.playerColor);
        this.ctx.beginPath();
        this.ctx.arc(px + this.tileSize / 2, py + this.tileSize / 2, this.tileSize / 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(COLOR_SYMBOLS[this.playerColor], px + this.tileSize / 2, py + this.tileSize / 2 + 5);
    }

    getHexColor(color) {
        switch (color) {
            case COLORS.RED: return '#ef4444';
            case COLORS.BLUE: return '#3b82f6';
            case COLORS.YELLOW: return '#eab308';
            default: return '#334155';
        }
    }
}

// Start Game
window.onload = () => {
    window.game = new Game();
};
