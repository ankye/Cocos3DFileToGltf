import { NodeIO } from "@gltf-transform/core";
import { cocos } from "./Cocos";
import Cocos2Gltf from "./Cocos2Gltf";
import { io } from "./IO";
import { program } from "commander";

async function convert(prefabPath: string, name: string, outPath: string) {
    const rootPath = cc.path.dirname(prefabPath);
    cocos.init(rootPath);
    const basename = cc.path.basename(prefabPath, cc.path.extname(prefabPath));
    const paotaiPrefab = await cocos.loadAsset<cc.Prefab>(basename);

    const doc = Cocos2Gltf.convert(paotaiPrefab);
    const gltf = await new NodeIO().writeJSON(doc);

    io.writeGltfFile(gltf, name ?? basename, outPath);
}

interface ICocos2Gltf {
    name: string;
    cocos: string;
    output: string;
}

program.version("0.0.1", "-v, --version", "Cocos 3d file converter");
program.command("cocos2gltf")
    .alias("c2g")
    .description("Conver cocos prefab to gltf.")
    .option("-n, --name <string>", "3d file name.")
    .requiredOption("-c, --cocos <path>", "Input cocos 3d prefab file path.")
    .requiredOption("-o, --output <path>", "Output Cocos 3d file path.")
    .action(function (input: ICocos2Gltf) {
        convert(input.cocos, input.name, input.output);
    });

program.parse();