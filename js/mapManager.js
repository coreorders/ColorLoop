class MapManager {
    constructor() {
        this.hashSalt = "COLOR_LOOP_SALT_2025";
    }

    // 10자리 고정 길이 해시 생성
    generateHashV2(dataStr) {
        let hash = 5381;
        const combined = dataStr + this.hashSalt;
        for (let i = 0; i < combined.length; i++) {
            hash = (hash * 33) ^ combined.charCodeAt(i);
        }
        // 32비트 정수를 16진수 문자열로 변환하고 정확히 10자리로 맞춤 (패딩 적용)
        return Math.abs(hash).toString(16).padStart(10, '0').substring(0, 10);
    }

    // 기존 V1 해시 (호환성 유지용)
    generateHashV1(dataStr) {
        let hash = 0;
        const combined = dataStr + this.hashSalt;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    exportMap(name, creator, grid, start) {
        const width = grid[0].length;
        const height = grid.length;
        // 1. 그리드 데이터를 숫지 시퀀스로 변환 (왼쪽 위부터)
        const gridDigits = grid.flat().join('');

        // 메타데이터(이름|제작자)를 Base64로 암호화 느낌나게 변환
        const metaStr = `${name}|${creator}`;
        const encodedMeta = btoa(encodeURIComponent(metaStr));

        // 2. 메타데이터 구성 (구분자 | 사용)
        // 포맷: V2|너비x높이|시작X,시작Y|그리드숫지|암호화된메타
        const coreData = [
            "V2",
            `${width}x${height}`,
            `${start.x},${start.y}`,
            gridDigits,
            encodedMeta
        ].join('|');

        // 3. 10자리 해시 생성
        const hash = this.generateHashV2(coreData);

        // 4. 최종 결합 (데이터|해시)
        return coreData + "|" + hash;
    }

    loadMap(code) {
        if (!code) return null;

        try {
            // V2 포맷 체크
            if (code.startsWith("V2|")) {
                const parts = code.split('|');
                if (parts.length < 6) return null;

                const hashInCode = parts.pop();
                const coreData = parts.join('|');

                // 해시 검증
                if (this.generateHashV2(coreData) !== hashInCode) {
                    console.error("V2 Hash validation failed!");
                    return null;
                }

                const [v, size, start, gridStr, encodedMeta] = parts;
                const [w, h] = size.split('x').map(Number);
                const [sx, sy] = start.split(',').map(Number);

                // 메타데이터 복원
                const metaStr = decodeURIComponent(atob(encodedMeta));
                const [mapName, mapCreator] = metaStr.split('|');

                // 그리드 복원
                const grid = [];
                for (let y = 0; y < h; y++) {
                    const row = [];
                    for (let x = 0; x < w; x++) {
                        row.push(parseInt(gridStr[y * w + x]));
                    }
                    grid.push(row);
                }

                return {
                    name: mapName,
                    creator: mapCreator,
                    data: grid,
                    start: { x: sx, y: sy },
                    v: 2.1
                };
            }

            // 기존 V1 호환 (Base64 JSON)
            const decoded = decodeURIComponent(atob(code));
            const [json, hash] = decoded.split("|");

            if (this.generateHashV1(json) !== hash) {
                console.error("V1 Hash validation failed!");
                return null;
            }

            return JSON.parse(json);
        } catch (e) {
            console.error("Map Load Error:", e);
            return null;
        }
    }

    async fetchExternalMap(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return this.loadMap(text.trim());
        } catch (e) {
            console.error("External Load Failed:", e);
            return null;
        }
    }
}
