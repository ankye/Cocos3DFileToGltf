/// <reference path="cocos-engine/cc.d.ts"/>
import "./Environment";
import { io } from "./IO";

await System.import<typeof cc>("./src/cocos-engine/cc.js");
globalThis.cc = window.cc;

if (typeof cc.EmptyDevice == "undefined") {
    const { EmptyDevice } = await import("./EmptyDevice");
    cc.EmptyDevice = EmptyDevice;
}

await cc.game.init({ overrideSettings: { rendering: { renderMode: 3 } }, exactFitScreen: false });
// cc.game.run();

export namespace cocos {

    export function init(path:string):void {
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

    export function deserialize<T extends cc.Asset>(json: string): T {
        return cc.deserialize(json, null) as T;
    }

    export function deserializeModel(prefabJson: string, meshes: readonly cc.Mesh[], materials?: readonly cc.Material[]): cc.Prefab {
        const prefab: cc.Prefab = deserialize(prefabJson);
        const rootNode: cc.Node = prefab.data;
        for (const child of rootNode.children) {
            for (const component of child.components) {
                console.log("component", component);
            }
        }
        return prefab;
    }

    export function deserializeMesh(metaJson: string, bin: ArrayBuffer): cc.Mesh {
        const mesh: cc.Mesh = deserialize(metaJson);
        mesh._nativeAsset = bin;
        return mesh;
    }

    export async function loadAsset<T extends cc.Asset>(request: string): Promise<T> {
        return new Promise((resolve, reject) => cc.assetManager.loadAny<T>(request, function (err, data) {
            if (err) reject(err);
            else resolve(data);
        }));
    }
}
