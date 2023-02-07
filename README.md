# Cocos3DFileToGltf

## 简介
把Cocos发布后的3D文件转化为Gltf格式，Cocos要求输入的是原来模型自带的```Prefab```，包括此```Prefab```依赖的其它所有文件，比喻```Material```、```Mesh```等。

## 支持情况
* Scenes
* Nodes
* Meshes
* Materials
* Skins
* ~~Animations~~
* Textures

## 安装
下载项目后，使用```npm i```命令安装。

## 开始
本项目是用```typescript```写的，所以直接用```ts-node```调用。
项目中有测试资源，可以直接使用。
```
 ts-node src/Index.ts c2g -n paotai -c "./assets/paotai/6c51737e-2fd0-45ee-b509-7147fb4bf4ce@9112a.json" -o "./temp" 
```
