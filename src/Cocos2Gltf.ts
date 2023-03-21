import { Animation, Buffer, Document, Material, Mesh, Node, Skin, Texture, TextureInfo, TypedArray, vec3, vec4 } from '@gltf-transform/core';
import { GLTF } from "@gltf-transform/core/dist/types/gltf";
import { gltf } from './gltf';

export const CocosToGltfAttribute: Record<cc.gfx.AttributeName, gltf.AttributeName> = {
    "a_position": gltf.AttributeName.POSITION,
    "a_normal": gltf.AttributeName.NORMAL,
    "a_tangent": gltf.AttributeName.TANGENT,
    "a_texCoord": gltf.AttributeName.TEXCOORD_0,
    "a_texCoord1": gltf.AttributeName.TEXCOORD_1,
    "a_texCoord2": gltf.AttributeName.TEXCOORD_2,
    "a_color": gltf.AttributeName.COLOR_0,
    "a_joints": gltf.AttributeName.JOINTS_0,
    "a_weights": gltf.AttributeName.WEIGHTS_0,

} as any;

const TargetPathMap: Record<string, GLTF.AnimationChannelTargetPath> = {
    "_position": "translation",
    "_rotation": "rotation",
    "_scale": "scale",
};

const TargetPathMapKeys = Object.keys(TargetPathMap);

interface IComponentMap {
    readonly meshList: {
        meshRenderer: cc.MeshRenderer;
        node: Node;
    }[];
    readonly animationList: {
        animation: cc.Animation;
        node: Node;
    }[];
}

export default class Cocos2Gltf {
    public readonly doc = new Document();
    public readonly scene;
    public readonly buffer;

    public constructor() {
        this.scene = this.doc.createScene();
        this.buffer = this.doc.createBuffer();
    }

    public parserNodeAndMesh(prefab: cc.Prefab): this {
        const componentMapList: IComponentMap = { meshList: [], animationList: [] };
        const nodeMapList = new Map<cc.Node, Node>();
        Cocos2Gltf.createNodes(this.doc, this.buffer, this.scene as any, prefab.data, nodeMapList, componentMapList);
        for (const meshMap of componentMapList.meshList) {
            const mesh = Cocos2Gltf.createMesh(this.doc, this.buffer, meshMap.meshRenderer);
            meshMap.node.setMesh(mesh);
            if (meshMap.meshRenderer instanceof cc.SkinnedMeshRenderer && meshMap.meshRenderer.skeleton) {
                const skin = Cocos2Gltf.createSkin(this.doc, this.buffer, meshMap.meshRenderer, this.scene as any)
                meshMap.node.setSkin(skin);
            }
        }

        return this;
    }

    public parserAnimatioOfPrefab(prefab: cc.Prefab): this {
        const animation = prefab.data.getComponent(cc.Animation);
        if (animation != null && animation.clips.length > 0)
            Cocos2Gltf.createAnimations(this.doc, this.buffer, animation.clips, this.scene as any);
        return this;
    }

    private static createNodes(doc: Document, buffer: Buffer, parent: Node, cocosParent: cc.Node, nodeMap: Map<cc.Node, Node>, componentMapList: IComponentMap): void {
        for (const cocosNode of cocosParent.children) {
            const node = doc.createNode(cocosNode.name);
            node.setTranslation(cc.Vec3.toArray([0, 0, 0], cocosNode.position));
            node.setRotation(cc.Quat.toArray([0, 0, 0, 0], cocosNode.rotation));
            node.setScale(cc.Vec3.toArray([0, 0, 0], cocosNode.scale));
            parent.addChild(node);
            nodeMap.set(cocosNode, node);
            const meshRenderer = cocosNode.getComponent(cc.MeshRenderer);
            if (meshRenderer != null && meshRenderer.mesh)
                componentMapList.meshList.push({ meshRenderer, node });

            Cocos2Gltf.createNodes(doc, buffer, node, cocosNode, nodeMap, componentMapList);
        }
    }

    private static createMesh(doc: Document, buffer: Buffer, cocosMesh: cc.MeshRenderer): Mesh {
        const gltfMesh = doc.createMesh(cocosMesh.mesh.name);
        const materialList = doc.getRoot().listMaterials();
        const meshStruct = cocosMesh.mesh.struct;

        const cocosMaterials = cocosMesh.sharedMaterials;
        console.assert(cocosMaterials.length == meshStruct.primitives.length);

        for (let indexPrimitive = 0; indexPrimitive < meshStruct.primitives.length; indexPrimitive++) {
            const primitive = meshStruct.primitives[indexPrimitive];
            const gltfPrimitive = doc.createPrimitive();
            gltfMesh.addPrimitive(gltfPrimitive);
            for (const bundleIndex of primitive.vertexBundelIndices) {
                const bundle = meshStruct.vertexBundles[bundleIndex];
                for (const attribute of bundle.attributes) {
                    const attributeType = CocosToGltfAttribute[attribute.name];
                    const attributeAccessor = doc.createAccessor(attributeType, buffer);
                    attributeAccessor.setType(gltf.AttributeElementType[attributeType]);

                    const data = cocosMesh.mesh.readAttribute(indexPrimitive, attribute.name as cc.gfx.AttributeName);
                    attributeAccessor.setArray(data as TypedArray);
                    gltfPrimitive.setAttribute(attributeType, attributeAccessor);
                }
            }

            const indices = cocosMesh.mesh.readIndices(indexPrimitive);
            if (indices != null) {
                const attributeAccessor = doc.createAccessor("Indices", buffer);
                attributeAccessor.setType("SCALAR");
                attributeAccessor.setArray(indices as TypedArray);
                gltfPrimitive.setIndices(attributeAccessor);
            }

            const cocosMaterial = cocosMaterials[indexPrimitive];
            let material = materialList.find(v => v.getName() == cocosMaterial.name);
            if (material == null)
                material = Cocos2Gltf.createMaterial(doc, cocosMaterial);
            gltfPrimitive.setMaterial(material);
        }
        return gltfMesh;
    }

    private static createMaterial(doc: Document, cocosMaterial: cc.Material): Material {
        const material = doc.createMaterial(cocosMaterial.name);
        const baseColor = cocosMaterial.getProperty("mainColor") as cc.Color;
        if (baseColor) material.setBaseColorHex(Number.parseInt(baseColor.toHEX(), 16));
        const metallic = cocosMaterial.getProperty("material") as number;
        if (metallic) material.setMetallicFactor(metallic);
        const roughness = cocosMaterial.getProperty("roughness") as number;
        if (roughness) material.setRoughnessFactor(roughness);

        const baseTexture = cocosMaterial.getProperty("mainTexture") as cc.Texture2D;
        if (baseTexture != null) {
            const texture = Cocos2Gltf.createTexture(doc, baseTexture);
            if (texture != null) {
                material.setBaseColorTexture(texture);
                Cocos2Gltf.setTextureInof(material.getBaseColorTextureInfo(), baseTexture);
            }
        }
        return material;
    }

    private static createTexture(doc: Document, baseTexture: cc.Texture2D): Texture {
        if (baseTexture.image.nativeUrl == null || baseTexture.image.nativeUrl.length == 0) return null;
        const texture = doc.createTexture(baseTexture.name);
        const extnameIndex = baseTexture.image.nativeUrl.lastIndexOf(".");
        if (extnameIndex != -1) {
            let extname = baseTexture.image.nativeUrl.substring(extnameIndex + 1);
            if (extname.toLowerCase() != "png")
                extname = "jpeg";
            texture.setMimeType(`image/${extname}`);
        }
        texture.setImage(new Uint8Array(baseTexture.image.data["arrayBuffer"]));
        return texture;
    }

    private static setTextureInof(textureInfo: TextureInfo, baseTexture: cc.Texture2D): void {
        const samplerInfo = baseTexture.getSamplerInfo();

        // const uv1 = cocosMaterial.getProperty("uv");
        // textureInfo.setTexCoord();

        const wrapS = TextureInfo.WrapMode[cc.Texture2D.WrapMode[baseTexture["_wrapS"]]];
        const wrapT = TextureInfo.WrapMode[cc.Texture2D.WrapMode[baseTexture["_wrapT"]]];
        if (wrapS) textureInfo.setWrapS(wrapS);
        if (wrapT) textureInfo.setWrapT(wrapS);

        const minFilter = TextureInfo.MinFilter[cc.gfx.Filter[samplerInfo.minFilter]];
        if (minFilter) textureInfo.setMinFilter(minFilter);
        const magFilter = TextureInfo.MagFilter[cc.gfx.Filter[samplerInfo.magFilter]];
        if (magFilter) textureInfo.setMagFilter(magFilter);
    }

    private static createSkin(doc: Document, buffer: Buffer, meshRenderer: cc.SkinnedMeshRenderer, node: Node): Skin {
        const skin = doc.createSkin(meshRenderer.skeleton.name);
        const inverseBindMatricesAccessor = doc.createAccessor("InverseBindMatrices", buffer);
        inverseBindMatricesAccessor.setType("MAT4");

        const componentSize = inverseBindMatricesAccessor.getElementSize();
        const inverseBindposes = meshRenderer.skeleton.bindposes;
        const bindPoses = new Float32Array(inverseBindposes.length * componentSize);
        const tempArray = Array<number>(componentSize);
        for (let i = 0; i < inverseBindposes.length; i++) {
            cc.Mat4.toArray(tempArray, inverseBindposes[i]);
            for (let j = 0; j < componentSize; j++)
                bindPoses[i * componentSize + j] = tempArray[j];
        }

        inverseBindMatricesAccessor.setArray(bindPoses);
        skin.setInverseBindMatrices(inverseBindMatricesAccessor);

        // if (meshRenderer.skinningRoot == meshRenderer.node)
        // skin.setSkeleton(node);
        for (const joint of meshRenderer.skeleton.joints) {
            let jointNode = Cocos2Gltf.findJointPathNode(joint, node);
            console.assert(jointNode != null);
            skin.addJoint(jointNode);
        }
        return skin;
    }

    private static findJointPathNode(jointPath: string, node: Node): Node {
        const nodeNames = jointPath.split("/");
        let index = 0;
        let jointNode = node;
        do {
            const children = jointNode.listChildren();
            jointNode = children.find(c => c.getName() == nodeNames[index]);
        } while (++index < nodeNames.length && jointNode != null);
        return jointNode;
    }

    private static createAnimations(doc: Document, buffer: Buffer, clips: cc.AnimationClip[], node: Node): void {
        for (const clip of clips) {
            Cocos2Gltf.createAnimation(doc, buffer, clip, node);
        }
    }

    private static createAnimation(doc: Document, buffer: Buffer, clip: cc.AnimationClip, node: Node): Animation {
        const animation = doc.createAnimation(clip.name);
        const exoticAnimations: cc.__private._cocos_animation_exotic_animation_exotic_animation__ExoticNodeAnimation[] = clip["_exoticAnimation"]?.["_nodeAnimations"];
        if (exoticAnimations == null) return null;
        
        for (const exoticNode of exoticAnimations) {
            for (const key of TargetPathMapKeys) {
                const exotickTrack = exoticNode[key];
                if (exotickTrack == null) continue;

                const targetPath = TargetPathMap[key];
                const sampler = doc.createAnimationSampler();
                const input = doc.createAccessor(`${exoticNode.path}/${targetPath}/Input`, buffer);
                input.setArray(exotickTrack.times);
                input.setType("SCALAR");
                sampler.setInput(input);

                const output = doc.createAccessor(`${exoticNode.path}/${targetPath}/Output`, buffer);
                output.setArray(exotickTrack.values._values);
                output.setType(targetPath == "rotation" ? "VEC4" : "VEC3");
                sampler.setOutput(output);
                // sampler.setInterpolation('LINEAR');

                const channel = doc.createAnimationChannel();
                const pathNode = Cocos2Gltf.findJointPathNode(exoticNode.path, node);
                channel.setTargetNode(pathNode);
                channel.setTargetPath(targetPath);
                channel.setSampler(sampler);

                animation.addChannel(channel);
                animation.addSampler(sampler);
            }
        }
        return animation;
    }
}