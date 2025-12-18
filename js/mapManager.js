class MapManager {
    constructor() {
        this.hashSalt = "COLOR_LOOP_SALT_2025";
    }

    // 6자리 고정 길이 해시 생성 (압축률 향상)
    generateHashV3(dataStr) {
        let hash = 5381;
        const combined = dataStr + this.hashSalt;
        for (let i = 0; i < combined.length; i++) {
            hash = (hash * 33) ^ combined.charCodeAt(i);
        }
        return Math.abs(hash).toString(16).padStart(6, '0').substring(0, 6);
    }

    // 기존 V2 해시 (호환성 유지용)
    generateHashV2(dataStr) {
        let hash = 5381;
        const combined = dataStr + this.hashSalt;
        for (let i = 0; i < combined.length; i++) {
            hash = (hash * 33) ^ combined.charCodeAt(i);
        }
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
        const gridData = grid.flat();

        // V3 압축: 4비트 패킹 (1바이트에 타일 2개 저장)
        const packed = [];
        for (let i = 0; i < gridData.length; i += 2) {
            const high = gridData[i] || 0;
            const low = gridData[i + 1] || 0;
            packed.push((high << 4) | low);
        }

        // 이진 데이터를 Base64 문자열로 변환 (Uint8Array 활용)
        const gridBinary = btoa(String.fromCharCode.apply(null, packed));
        const metaStr = `${name}|${creator}`;
        const encodedMeta = btoa(encodeURIComponent(metaStr));

        // 포맷: V3|W,H|SX,SY|PackedGrid|EncodedMeta
        const coreData = [
            "V3",
            `${width},${height}`,
            `${start.x},${start.y}`,
            gridBinary,
            encodedMeta
        ].join('|');

        const hash = this.generateHashV3(coreData);
        return coreData + "|" + hash;
    }

    loadMap(code) {
        if (!code) return null;

        const cleanCode = code.trim().replace(/\s/g, '');

        try {
            // V3 (Binary Packing) 포맷 체크
            if (cleanCode.startsWith("V3|")) {
                const parts = cleanCode.split('|');
                if (parts.length < 6) return null;

                const hashInCode = parts.pop();
                const coreData = parts.join('|');

                if (this.generateHashV3(coreData) !== hashInCode) {
                    console.error("V3 Hash validation failed!");
                    return null;
                }

                const [v, size, start, gridBinary, encodedMeta] = parts;
                const [w, h] = size.split(',').map(Number);
                const [sx, sy] = start.split(',').map(Number);

                // 메타데이터 복원
                const metaStr = decodeURIComponent(atob(encodedMeta));
                const [mapName, mapCreator] = metaStr.split('|');

                // 그리드 복원 (Base64 -> Binary -> 4bit Unpacking)
                const binaryStr = atob(gridBinary);
                const gridData = [];
                for (let i = 0; i < binaryStr.length; i++) {
                    const byte = binaryStr.charCodeAt(i);
                    gridData.push((byte >> 4) & 0xF); // High 4 bits
                    gridData.push(byte & 0xF);        // Low 4 bits
                }

                const grid = [];
                for (let y = 0; y < h; y++) {
                    grid.push(gridData.slice(y * w, (y + 1) * w));
                }

                return { name: mapName, creator: mapCreator, data: grid, start: { x: sx, y: sy }, v: 3.0 };
            }

            // V2 포맷 체크
            if (cleanCode.startsWith("V2|")) {
                const parts = cleanCode.split('|');
                if (parts.length < 6) return null;

                const hashInCode = parts.pop();
                const coreData = parts.join('|');

                if (this.generateHashV2(coreData) !== hashInCode) {
                    console.error("V2 Hash validation failed!");
                    return null;
                }

                const [v, size, start, gridStr, encodedMeta] = parts;
                const [w, h] = size.split('x').map(Number);
                const [sx, sy] = start.split(',').map(Number);

                let metaStr;
                try {
                    metaStr = decodeURIComponent(atob(encodedMeta));
                } catch (metaErr) { return null; }
                const [mapName, mapCreator] = metaStr.split('|');

                const grid = [];
                for (let y = 0; y < h; y++) {
                    const row = [];
                    for (let x = 0; x < w; x++) { row.push(parseInt(gridStr[y * w + x])); }
                    grid.push(row);
                }

                return { name: mapName, creator: mapCreator, data: grid, start: { x: sx, y: sy }, v: 2.1 };
            }

            // V1 포맷 체크
            let decoded;
            try {
                decoded = decodeURIComponent(atob(cleanCode));
            } catch (v1Err) { return null; }

            const [json, hash] = decoded.split("|");
            if (this.generateHashV1(json) === hash) {
                return JSON.parse(json);
            }
            return null;
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
