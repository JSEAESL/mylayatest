package laya.d3.core {
	import laya.d3.component.Animator;
	import laya.d3.core.material.BaseMaterial;
	import laya.d3.math.Vector3;
	import laya.d3.math.Vector4;
	import laya.d3.resource.models.Mesh;
	import laya.d3.shader.Shader3D;
	import laya.d3.shader.ShaderDefines;
	import laya.d3.utils.Utils3D;
	import laya.display.Node;
	import laya.net.Loader;
	
	/**
	 * <code>SkinnedMeshSprite3D</code> 类用于创建网格。
	 */
	public class SkinnedMeshSprite3D extends RenderableSprite3D {
		/**@private */
		public static var _tempArray0:Array = [];
		
		/**精灵级着色器宏定义,蒙皮动画。*/
		public static var SHADERDEFINE_BONE:int;
		
		/**着色器变量名，蒙皮动画。*/
		public static const BONES:int = Shader3D.propertyNameToID("u_Bones");
		
		/**@private */
		public static var shaderDefines:ShaderDefines = new ShaderDefines(MeshSprite3D.shaderDefines);
		
		/**
		 * @private
		 */
		public static function __init__():void {
			SHADERDEFINE_BONE = shaderDefines.registerDefine("BONE");
		}
		
		/** @private */
		private var _meshFilter:MeshFilter;
		
		/**
		 * 获取网格过滤器。
		 * @return  网格过滤器。
		 */
		public function get meshFilter():MeshFilter {
			return _meshFilter;
		}
		
		/**
		 * 获取网格渲染器。
		 * @return  网格渲染器。
		 */
		public function get skinnedMeshRenderer():SkinnedMeshRenderer {
			return _render as SkinnedMeshRenderer;
		}
		
		/**
		 * 创建一个 <code>MeshSprite3D</code> 实例。
		 * @param mesh 网格,同时会加载网格所用默认材质。
		 * @param name 名字。
		 */
		public function SkinnedMeshSprite3D(mesh:Mesh = null, name:String = null) {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			super(name);
			_meshFilter = new MeshFilter(this);
			_render = new SkinnedMeshRenderer(this);
			(mesh) && (_meshFilter.sharedMesh = mesh);
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _parse(data:Object, spriteMap:Object):void {
			super._parse(data, spriteMap);
			var render:SkinnedMeshRenderer = skinnedMeshRenderer;
			var lightmapIndex:* = data.lightmapIndex;
			(lightmapIndex != null) && (render.lightmapIndex = lightmapIndex);
			var lightmapScaleOffsetArray:Array = data.lightmapScaleOffset;
			(lightmapScaleOffsetArray) && (render.lightmapScaleOffset = new Vector4(lightmapScaleOffsetArray[0], lightmapScaleOffsetArray[1], lightmapScaleOffsetArray[2], lightmapScaleOffsetArray[3]));
			var meshPath:String;
			meshPath = data.meshPath;
			if (meshPath) {
				var mesh:Mesh = Loader.getRes(meshPath);//加载失败mesh为空
				(mesh) && (meshFilter.sharedMesh = mesh);
			}
			
			var materials:Array = data.materials;
			if (materials) {
				var sharedMaterials:Vector.<BaseMaterial> = render.sharedMaterials;
				var materialCount:int = materials.length;
				sharedMaterials.length = materialCount;
				for (var i:int = 0; i < materialCount; i++) {
					sharedMaterials[i] = Loader.getRes(materials[i].path);
				}
				render.sharedMaterials = sharedMaterials;
			}
			
			var boundBox:Object = data.boundBox;
			var min:Array = boundBox.min;
			var max:Array = boundBox.max;
			render.localBounds.setMin(new Vector3(min[0], min[1], min[2]));
			render.localBounds.setMax(new Vector3(max[0], max[1], max[2]));
			
			if (spriteMap) {
				var rootBoneData:int = data.rootBone;
				render.rootBone = spriteMap[rootBoneData];
				var bonesData:Array = data.bones;
				var n:int;
				for (i = 0, n = bonesData.length; i < n; i++)
					render.bones.push(spriteMap[bonesData[i]]);
			} else {//[兼容代码]
				(data.rootBone) && (render._setRootBone(data.rootBone));//[兼容性]
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _changeHierarchyAnimator(animator:Animator):void {
			super._changeHierarchyAnimator(animator);
			skinnedMeshRenderer._setCacheAnimator(animator);
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _changeAnimatorAvatar(avatar:Avatar):void {
			skinnedMeshRenderer._setCacheAvatar(avatar);
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _cloneTo(destObject:*, srcRoot:Node, dstRoot:Node):void {
			var meshSprite3D:MeshSprite3D = destObject as MeshSprite3D;
			meshSprite3D.meshFilter.sharedMesh = meshFilter.sharedMesh;
			var meshRender:SkinnedMeshRenderer = _render as SkinnedMeshRenderer;
			var destMeshRender:SkinnedMeshRenderer = meshSprite3D._render as SkinnedMeshRenderer;
			destMeshRender.enable = meshRender.enable;
			destMeshRender.sharedMaterials = meshRender.sharedMaterials;
			destMeshRender.castShadow = meshRender.castShadow;
			var lightmapScaleOffset:Vector4 = meshRender.lightmapScaleOffset;
			lightmapScaleOffset && (destMeshRender.lightmapScaleOffset = lightmapScaleOffset.clone());
			destMeshRender.receiveShadow = meshRender.receiveShadow;
			destMeshRender.sortingFudge = meshRender.sortingFudge;
			destMeshRender._rootBone = meshRender._rootBone;
			
			var bones:Vector.<Sprite3D> = meshRender.bones;
			var destBones:Vector.<Sprite3D> = destMeshRender.bones;
			var bonesCount:int = bones.length;
			destBones.length = bonesCount;
			
			var rootBone:Sprite3D = meshRender.rootBone;
			if (rootBone) {
				var pathes:Array = Utils3D._getHierarchyPath(srcRoot, rootBone, _tempArray0);
				if (pathes)
					destMeshRender.rootBone = Utils3D._getNodeByHierarchyPath(dstRoot, pathes) as Sprite3D;
				else
					destMeshRender.rootBone = rootBone;
			}
			
			for (var i:int = 0; i < bones.length; i++) {
				pathes = Utils3D._getHierarchyPath(srcRoot, bones[i], _tempArray0);
				if (pathes)
					destBones[i] = Utils3D._getNodeByHierarchyPath(dstRoot, pathes) as Sprite3D;
				else
					destBones[i] = bones[i];
			}
			
			var lbb:Bounds = meshRender.localBounds;
			(lbb) && (lbb.cloneTo(destMeshRender.localBounds));
			super._cloneTo(destObject, srcRoot, dstRoot);//父类函数在最后,组件应该最后赋值，否则获取材质默认值等相关函数会有问题
		}
		
		/**
		 * @inheritDoc
		 */
		override public function destroy(destroyChild:Boolean = true):void {
			if (destroyed)
				return;
			super.destroy(destroyChild);
			_meshFilter.destroy();
		}
	
	}
}