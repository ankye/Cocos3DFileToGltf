import { NodeIO } from "@gltf-transform/core";
import { cocos } from "./Cocos";
import Cocos2Gltf from "./Cocos2Gltf";
import { io } from "./IO";
import child_process from "child_process";

async function convert(prefabPath: string, name: string, outPath: string) {
    const rootPath = cc.path.dirname(prefabPath);
    const basename = cc.path.basename(prefabPath, cc.path.extname(prefabPath));

    cocos.init(rootPath);

    const prefab = await cocos.loadAsset<cc.Prefab>(basename);
    const converter = new Cocos2Gltf();
    converter.parserNodeAndMesh(prefab);
    converter.parserAnimatioOfPrefab(prefab);
    const gltf = await new NodeIO().writeJSON(converter.doc);
    io.writeGltfFile(gltf, name ?? basename, outPath);
    console.log("convert complete.");
}

convert("./assets/cow/04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@d23b1", "cow", "./temp/cow");
// convert("./assets/cow/6d9eaafb-f595-4cab-a0a3-c88180f98c48@1b569", "cow", "./temp/cow");
// convert("./assets/2a/2a/2a1b46e5-4402-4766-8bcc-abdaa34f155d@7b338", "cow", "./temp/cow2");
// cocos.init("./assets/2a/2a", {
//     "04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@24c9f": ".cconb"
// });
// try {
//     // const asset = await cocos.loadAsset("04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@24c9f");
//     // load skin
//     const prefab = await cocos.loadAsset<cc.Prefab>("2a1b46e5-4402-4766-8bcc-abdaa34f155d@7b338");
//     const converter = new Cocos2Gltf();
//     converter.parserNodeAndMesh(prefab);
//     // load animation
//     // const assetAni = await cocos.loadAsset<cc.Prefab>("04d18ad8-5ee9-4a37-ad4c-db475f3d3da7@d23b1");
//     converter.parserAnimatioOfPrefab(prefab);
//     const gltf = await new NodeIO().writeJSON(converter.doc);

//     io.writeGltfFile(gltf, "cow", "./temp/cow2");
//     // child_process.execSync(`start "" "${}"`);
//     console.log("convert complete.");
// } catch (error) {
//     console.log(error);
// }
