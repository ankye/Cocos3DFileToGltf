import { Buffer, Document, Mesh, Node, Skin, TypedArray, vec3, vec4 } from '@gltf-transform/core';
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

interface IMeshMap {
    meshRenderer: cc.MeshRenderer;
    node: Node;
}

export default class Cocos2Gltf {
    public static convert(prefab: cc.Prefab): Document {
        const doc = new Document();
        const scene = doc.createScene()
        const buffer = doc.createBuffer();

        const meshMapList: IMeshMap[] = [];
        const nodeMapList = new Map<cc.Node, Node>();
        Cocos2Gltf.createNodes(doc, buffer, scene as any, prefab.data, nodeMapList, meshMapList);
        for (const meshMap of meshMapList) {
            const mesh = Cocos2Gltf.createMesh(doc, buffer, meshMap.meshRenderer);
            meshMap.node.setMesh(mesh);
            if (meshMap.meshRenderer instanceof cc.SkinnedMeshRenderer && meshMap.meshRenderer.skeleton) {
                const skin = Cocos2Gltf.createSkin(doc, buffer, meshMap.meshRenderer, scene as any)
                meshMap.node.setSkin(skin);
            }
        }
        return doc;
    }

    private static createNodes(doc: Document, buffer: Buffer, parent: Node, cocosParent: cc.Node, nodeMap: Map<cc.Node, Node>, meshMapList: IMeshMap[]): void {
        for (const cocosNode of cocosParent.children) {
            const node = doc.createNode(cocosNode.name);
            node.setTranslation(cc.Vec3.toArray([0, 0, 0], cocosNode.position));
            node.setRotation(cc.Quat.toArray([0, 0, 0, 0], cocosNode.rotation));
            node.setScale(cc.Vec3.toArray([0, 0, 0], cocosNode.scale));
            parent.addChild(node);
            nodeMap.set(cocosNode, node);
            const meshRenderer = cocosNode.getComponent(cc.MeshRenderer);
            if (meshRenderer != null && meshRenderer.mesh) {
                meshMapList.push({ meshRenderer, node });
            }
            Cocos2Gltf.createNodes(doc, buffer, node, cocosNode, nodeMap, meshMapList);
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
            if (material == null) {
                material = doc.createMaterial(cocosMaterial.name);
                const baseColor = cocosMaterial.getProperty("mainColor") as cc.Color;
                material.setBaseColorHex(Number.parseInt(baseColor.toHEX(), 16));
            }
            gltfPrimitive.setMaterial(material);
        }
        return gltfMesh;
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
            const nodeNames = joint.split("/");
            let index = 0;
            let jointNode = node;
            do {
                const children = jointNode.listChildren();
                jointNode = children.find(c => c.getName() == nodeNames[index]);
            } while (++index < nodeNames.length && jointNode != null);
            console.assert(jointNode != null);
            skin.addJoint(jointNode);
        }
        return skin;
    }
}