import { cocos } from "./Cocos";

cocos.init("./assets/paotai");
const paotaiPrefab = await cocos.loadAsset("6c51737e-2fd0-45ee-b509-7147fb4bf4ce@9112a");
console.log("paotaiPrefab", paotaiPrefab);
