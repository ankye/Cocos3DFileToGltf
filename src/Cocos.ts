/// <reference path="cocos-engine/cc.d.ts"/>
import "./Environment";
import { io } from "./IO";

global.ccModule = await System.import<typeof cc>("./src/cocos-engine/cc.js");
globalThis.cc = Object.assign(window.cc, window.cc, global.ccModule);

if (typeof cc.EmptyDevice == "undefined") {
    const { EmptyDevice } = await import("./EmptyDevice");
    cc.EmptyDevice = EmptyDevice;
}

await cc.game.init({ overrideSettings: { rendering: { renderMode: 3 } }, exactFitScreen: false });
// cc.game.run();

export namespace cocos {

    export function init(path: string): void {
        cc.assetManager.downloader.register('.json', function (url, options, callback) {
            try {
                url = `${path}/${cc.path.basename(url)}`;
                const text = io.readTextFileSync(url);
                callback(null, JSON.parse(text));
            } catch (error) {
                callback(error);
            }
        });
        cc.assetManager.downloader.register('.bin', function (url, options, callback) {
            try {
                url = `${path}/${cc.path.basename(url)}`;
                const arrayBuffer = io.readBinaryFileSync(url);
                callback(null, arrayBuffer);
            } catch (error) {
                callback(error);
            }
        });
    }

    export async function loadAsset<T extends cc.Asset>(request: string): Promise<T> {
        return new Promise((resolve, reject) => cc.assetManager.loadAny<T>(request, function (err, data) {
            if (err) reject(err);
            else resolve(data);
        }));
    }
}
