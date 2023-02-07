import { NodeIO } from "@gltf-transform/core";
import { cocos } from "./Cocos";
import Cocos2Gltf from "./Cocos2Gltf";
import { io } from "./IO";

cocos.init("./assets/cow");
try {
    const prefab = await cocos.loadAsset<cc.Prefab>("6d9eaafb-f595-4cab-a0a3-c88180f98c48@1b569");
    const doc = Cocos2Gltf.convert(prefab);
    const gltf = await new NodeIO().writeJSON(doc);

    io.writeGltfFile(gltf, "cow", "./temp/cow");
    console.log("Convert complete ", prefab);
} catch (error) {
    console.log(error);
}