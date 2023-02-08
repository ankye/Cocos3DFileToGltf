import { NodeIO } from "@gltf-transform/core";
import { cocos } from "./Cocos";
import Cocos2Gltf from "./Cocos2Gltf";
import { io } from "./IO";

cocos.init("./assets/cow", {
    "04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@24c9f": ".cconb"
});
try {
    // load animation
    const assetAni = await cocos.loadAsset<cc.Prefab>("04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@d23b1");
    // const asset = await cocos.loadAsset("04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@24c9f");
    // load skin
    const prefab = await cocos.loadAsset<cc.Prefab>("6d9eaafb-f595-4cab-a0a3-c88180f98c48@1b569");
    const converter = new Cocos2Gltf();
    converter.parserNodeAndMesh(prefab);
    converter.parserAnimatioOfPrefab(assetAni);
    const gltf = await new NodeIO().writeJSON(converter.doc);

    io.writeGltfFile(gltf, "cow", "./temp/cow");
    console.log("convert complete.");
} catch (error) {
    console.log(error);
}