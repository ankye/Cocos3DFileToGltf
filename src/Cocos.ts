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

    export function init(rootPath: string): void {
        const getUrl = function (url) { return `${rootPath}/${cc.path.basename(url)}`; }

        function downloadImage(url: string, options: any, callback: (error: Error, data?: any) => void) {
            const image = new window.Image();

            function loadCallback() {
                image.removeEventListener('load', loadCallback);
                image.removeEventListener('error', errorCallback);
                callback(null, image);
            }

            function errorCallback() {
                image.removeEventListener('load', loadCallback);
                image.removeEventListener('error', errorCallback);
                callback(new Error('Load image (' + url + ') failed'));
            }

            image.addEventListener('load', loadCallback);
            image.addEventListener('error', errorCallback);

            const arrayBuffer = io.readBinaryFileSync(getUrl(url));
            const data = Buffer.from(arrayBuffer).toString('base64');
            const ext = url.slice(url.lastIndexOf('.') + 1);
            image.src = `data:image/${ext};base64,${data}`;
            image["arrayBuffer"] = arrayBuffer;
        }

        function downloadJson(url: string, options: any, callback: (error: Error, data?: any) => void) {
            try {
                const text = io.readTextFileSync(getUrl(url));
                callback(null, JSON.parse(text));
            } catch (error) {
                callback(error);
            }
        }

        function downloadArrayBuffer(url: string, options: any, callback: (error: Error, data?: any) => void) {
            try {
                const arrayBuffer = io.readBinaryFileSync(getUrl(url));
                callback(null, arrayBuffer);
            } catch (error) {
                callback(error);
            }
        }

        function downloadDefault(url: string, options: any, callback: (error: Error, data?: any) => void) {
            throw new Error("Unsupport download file type:" + url);
        }

        const downloaders = {
            // Images
            '.png': downloadImage,
            '.jpg': downloadImage,
            '.jpeg': downloadImage,
            '.webp': downloadImage,

            // Txt
            '.txt': downloadDefault,
            '.xml': downloadDefault,
            '.vsh': downloadDefault,
            '.fsh': downloadDefault,
            '.atlas': downloadDefault,

            '.tmx': downloadDefault,
            '.tsx': downloadDefault,

            '.json': downloadJson,
            '.ExportJson': downloadJson,
            '.plist': downloadDefault,

            '.fnt': downloadDefault,
            // '.ttf': downloadFont,

            // Binary
            '.binary': downloadArrayBuffer,
            '.bin': downloadArrayBuffer,
            '.dbbin': downloadArrayBuffer,
            '.skel': downloadArrayBuffer,

            '.cconb': downloadDefault,

            // audio
            '.mp3': downloadDefault,

            '.js': downloadDefault,

            bundle: downloadDefault,
            default: downloadDefault,
        };

        cc.assetManager.downloader.register(downloaders);
    }

    export function loadAsset<T extends cc.Asset>(request: string): Promise<T> {
        return new Promise((resolve, reject) => cc.assetManager.loadAny<T>(request, function (err, data) {
            if (err) reject(err);
            resolve(data);
        }));
    }
}
