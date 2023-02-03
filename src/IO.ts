import fs from 'fs';

export namespace io {
    export function readBinaryFileSync(filePath: string): ArrayBuffer {
        const bufferString = fs.readFileSync(filePath, { encoding: "binary" });
        const nb = Buffer.from(bufferString, "binary");
        return nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.byteLength);
    }
    
    export function readTextFileSync(filePath: string): string {
        return fs.readFileSync(filePath, "utf-8");
    }
}