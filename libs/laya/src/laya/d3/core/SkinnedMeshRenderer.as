package laya.d3.core {
	import laya.d3.animation.AnimationNode;
	import laya.d3.component.Animator;
	import laya.d3.core.material.BaseMaterial;
	import laya.d3.core.material.BlinnPhongMaterial;
	import laya.d3.core.render.RenderContext3D;
	import laya.d3.core.render.RenderElement;
	import laya.d3.graphics.FrustumCulling;
	import laya.d3.math.Matrix4x4;
	import laya.d3.math.Vector3;
	import laya.d3.resource.models.Mesh;
	import laya.d3.resource.models.SubMesh;
	import laya.d3.utils.Utils3D;
	import laya.events.Event;
	import laya.layagl.LayaGL;
	import laya.renders.Render;
	import laya.utils.Stat;
	
	/**
	 * <code>SkinMeshRenderer</code> 类用于蒙皮渲染器。
	 */
	public class SkinnedMeshRenderer extends MeshRenderer {
		/**@private */
		private static var _tempMatrix4x4:Matrix4x4 = new Matrix4x4();
		
		/**@private */
		private var _cacheMesh:Mesh;
		/** @private */
		private var _bones:Vector.<Sprite3D> = new Vector.<Sprite3D>();
		/** @private */
		public var _skinnedData:Vector.<Vector.<Float32Array>>;
		/** @private */
		private var _skinnedDataLoopMarks:Vector.<int> = new Vector.<int>();
		/**@private */
		private var _localBounds:Bounds = new Bounds(Vector3._ZERO, Vector3._ZERO);
		/**@private */
		private var _cacheAnimator:Animator;
		/**@private */
		private var _cacheRootBone:Sprite3D;
		
		/**
		 * 获取局部边界。
		 * @return 边界。
		 */
		public function get localBounds():Bounds {
			return _localBounds;
		}
		
		/**
		 * 设置局部边界。
		 * @param value 边界
		 */
		public function set localBounds(value:Bounds):void {
			_localBounds = value;
		}
		
		/**
		 * 获取根节点。
		 * @return 根节点。
		 */
		public function get rootBone():Sprite3D {
			return _cacheRootBone;
		}
		
		/**
		 * 设置根节点。
		 * @param value 根节点。
		 */
		public function set rootBone(value:Sprite3D):void {
			if (_cacheRootBone != value) {
				if (_cacheRootBone)
					_cacheRootBone.transform.off(Event.TRANSFORM_CHANGED, this, _boundChange);
				value.transform.on(Event.TRANSFORM_CHANGED, this, _boundChange);
				_cacheRootBone = value;
				_boundChange();
			}
		}
		
		/**
		 * 用于蒙皮的骨骼。
		 */
		public function get bones():Vector.<Sprite3D> {
			return _bones;
		}
		
		/**
		 * 创建一个 <code>SkinnedMeshRender</code> 实例。
		 */
		public function SkinnedMeshRenderer(owner:RenderableSprite3D) {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			super(owner);
		}
		
		/**
		 * @private
		 */
		private function _computeSkinnedData():void {
			if (_cacheMesh && _cacheAvatar/*兼容*/ || _cacheMesh && _cacheRootBone) {
				var bindPoses:Vector.<Matrix4x4> = _cacheMesh._inverseBindPoses;
				var meshBindPoseIndices:Uint16Array = _cacheMesh._bindPoseIndices;
				var pathMarks:Vector.<Array> = _cacheMesh._skinDataPathMarks;
				for (var i:int = 0, n:int = _cacheMesh.subMeshCount; i < n; i++) {
					var subMeshBoneIndices:Vector.<Uint16Array> = (_cacheMesh._getSubMesh(i) as SubMesh)._boneIndicesList;
					var subData:Vector.<Float32Array> = _skinnedData[i];
					for (var j:int = 0, m:int = subMeshBoneIndices.length; j < m; j++) {
						var boneIndices:Uint16Array = subMeshBoneIndices[j];
						if (Render.supportWebGLPlusAnimation)//[Native]
							_computeSubSkinnedDataNative(_cacheAnimator._animationNodeWorldMatrixs, _cacheAnimationNodeIndices, _cacheMesh._inverseBindPosesBuffer, boneIndices, meshBindPoseIndices, subData[j]);
						else
							_computeSubSkinnedData(bindPoses, boneIndices, meshBindPoseIndices, subData[j], pathMarks);
					}
				}
			}
		}
		
		/**
		 * @private
		 */
		private function _computeSubSkinnedData(bindPoses:Vector.<Matrix4x4>, boneIndices:Uint16Array, meshBindPoseInices:Uint16Array, data:Float32Array, pathMarks:Vector.<Array>):void {
			for (var k:int = 0, q:int = boneIndices.length; k < q; k++) {
				var index:int = boneIndices[k];
				if (_skinnedDataLoopMarks[index] === Stat.loopCount) {
					var p:Array = pathMarks[index];
					var preData:Float32Array = _skinnedData[p[0]][p[1]];
					var srcIndex:int = p[2] * 16;
					var dstIndex:int = k * 16;
					for (var d:int = 0; d < 16; d++)
						data[dstIndex + d] = preData[srcIndex + d];
				} else {
					if (_cacheRootBone){
						var boneIndex:int = meshBindPoseInices[index];
						Utils3D._mulMatrixArray(_bones[boneIndex].transform.worldMatrix.elements, bindPoses[boneIndex], data, k * 16);
					}
					else{//[兼容代码]
						Utils3D._mulMatrixArray(_cacheAnimationNode[index].transform.getWorldMatrix(), bindPoses[meshBindPoseInices[index]], data, k * 16);
					}
					
					_skinnedDataLoopMarks[index] = Stat.loopCount;
				}
			}
		}
		
		/**
		 * @private
		 */
		private function _boundChange():void {
			_boundsChange = true;
		}
		
		/**
		 * @private
		 */
		override public function _onMeshChange(value:Mesh):void {
			super._onMeshChange(value);
			_cacheMesh = value as Mesh;
			
			var subMeshCount:int = value.subMeshCount;
			_skinnedData = new Vector.<Vector.<Float32Array>>(subMeshCount);
			_skinnedDataLoopMarks.length = (value as Mesh)._bindPoseIndices.length;
			for (var i:int = 0; i < subMeshCount; i++) {
				var subBoneIndices:Vector.<Uint16Array> = (value._getSubMesh(i) as SubMesh)._boneIndicesList;
				var subCount:int = subBoneIndices.length;
				var subData:Vector.<Float32Array> = _skinnedData[i] = new Vector.<Float32Array>(subCount);
				for (var j:int = 0; j < subCount; j++)
					subData[j] = new Float32Array(subBoneIndices[j].length * 16);
			}
			
			if (!_bones)
				(_cacheAvatar && value) && (_getCacheAnimationNodes());//[兼容性]
		}
		
		/**
		 * @private
		 */
		public function _setCacheAnimator(animator:Animator):void {
			_cacheAnimator = animator;
			_defineDatas.add(SkinnedMeshSprite3D.SHADERDEFINE_BONE);
			_setRootNode();//[兼容性API]
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _calculateBoundingBox():void {//TODO:是否可直接在boundingSphere属性计算优化
			if (_cacheRootBone) {
				_localBounds._tranform(_cacheRootBone.transform.worldMatrix, _bounds);
			} else {//[兼容性API]
				if (_cacheAnimator && _rootBone) {
					var worldMat:Matrix4x4 = _tempMatrix4x4;
					Utils3D.matrix4x4MultiplyMFM((_cacheAnimator.owner as Sprite3D).transform.worldMatrix, _cacheRootAnimationNode.transform.getWorldMatrix(), worldMat);
					_localBounds._tranform(worldMat, _bounds);
				} else {
					super._calculateBoundingBox();
				}
			}
			if (Render.supportWebGLPlusCulling) {//[NATIVE]
				var min:Vector3 =  _bounds.getMin();
				var max:Vector3 =  _bounds.getMax();
				var buffer:Float32Array = FrustumCulling._cullingBuffer;
				buffer[_cullingBufferIndex + 1] = min.x;
				buffer[_cullingBufferIndex + 2] = min.y;
				buffer[_cullingBufferIndex + 3] = min.z;
				buffer[_cullingBufferIndex + 4] = max.x;
				buffer[_cullingBufferIndex + 5] = max.y;
				buffer[_cullingBufferIndex + 6] = max.z;
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _changeRenderObjectsByMesh(mesh:Mesh):void {
			var count:int = mesh.subMeshCount;
			_renderElements.length = count;
			for (var i:int = 0; i < count; i++) {
				var renderElement:RenderElement = _renderElements[i];
				if (!renderElement) {
					var material:BaseMaterial = sharedMaterials[i];
					renderElement = _renderElements[i] = new RenderElement();
					renderElement.setTransform(_owner._transform);
					renderElement.render = this;
					renderElement.material = material ? material : BlinnPhongMaterial.defaultMaterial;//确保有材质,由默认材质代替。
				}
				renderElement.setGeometry(mesh._getSubMesh(i));
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdate(context:RenderContext3D, transform:Transform3D):void {
			if (_cacheAnimator) {
				_computeSkinnedData();
				if (_cacheRootBone) {
					_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, Matrix4x4.DEFAULT);
				} else {//[兼容性]
					var aniOwnerTrans:Transform3D = (_cacheAnimator.owner as Sprite3D)._transform;
					_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, aniOwnerTrans.worldMatrix);
				}
			} else {
				_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, transform.worldMatrix);
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdateWithCamera(context:RenderContext3D, transform:Transform3D):void {
			var projectionView:Matrix4x4 = context.projectionViewMatrix;
			if (_cacheRootBone) {
				_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, projectionView);
			} else {//[兼容性]
				if (_cacheAnimator) {
					var aniOwnerTrans:Transform3D = (_cacheAnimator.owner as Sprite3D)._transform;
					Matrix4x4.multiply(projectionView, aniOwnerTrans.worldMatrix, _projectionViewWorldMatrix);
				} else {
					Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
				}
				_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _destroy():void {
			super._destroy();
			if (_cacheRootBone) {
				_cacheRootBone.transform.off(Event.TRANSFORM_CHANGED, this, _boundChange);
			} else {//[兼容性]
				if (_cacheRootAnimationNode)
					_cacheRootAnimationNode.transform.off(Event.TRANSFORM_CHANGED, this, _boundChange);
			}
		}
		
		//-----------------------------------------------------------------------------------------------------------------------------------------------------------
		
		/**@private */
		public var _rootBone:String;//[兼容性API]
		/**@private */
		private var _cacheAvatar:Avatar;//[兼容性API]
		/**@private */
		private var _cacheRootAnimationNode:AnimationNode;//[兼容性API]
		/** @private */
		private var _cacheAnimationNode:Vector.<AnimationNode> = new Vector.<AnimationNode>();//[兼容性]
		
		/**
		 * @private
		 */
		public function _setRootBone(name:String):void {//[兼容性API]
			_rootBone = name;
			_setRootNode();//[兼容性API]
		}
		
		/**
		 * @private
		 */
		private function _setRootNode():void {//[兼容性API]
			var rootNode:AnimationNode;
			if (_cacheAnimator && _rootBone && _cacheAvatar)
				rootNode = _cacheAnimator._avatarNodeMap[_rootBone];
			else
				rootNode = null;
			
			if (_cacheRootAnimationNode != rootNode) {
				_boundChange();
				if (_cacheRootAnimationNode)
					_cacheRootAnimationNode.transform.off(Event.TRANSFORM_CHANGED, this, _boundChange);
				(rootNode)&&(rootNode.transform.on(Event.TRANSFORM_CHANGED, this, _boundChange));
				_cacheRootAnimationNode = rootNode;
			}
		}
		
		/**
		 * @private
		 */
		private function _getCacheAnimationNodes():void {//[兼容性API]
			var meshBoneNames:Vector.<String> = _cacheMesh._boneNames;
			var bindPoseIndices:Uint16Array = _cacheMesh._bindPoseIndices;
			var innerBindPoseCount:int = bindPoseIndices.length;
			
			if (!Render.supportWebGLPlusAnimation) {
				_cacheAnimationNode.length = innerBindPoseCount;
				var nodeMap:Object = _cacheAnimator._avatarNodeMap;
				for (var i:int = 0; i < innerBindPoseCount; i++) {
					var node:AnimationNode = nodeMap[meshBoneNames[bindPoseIndices[i]]];
					_cacheAnimationNode[i] = node;
				}
				
			} else {//[NATIVE]
				_cacheAnimationNodeIndices = new Uint16Array(innerBindPoseCount);
				var nodeMapC:Object = _cacheAnimator._avatarNodeMap;
				for (i = 0; i < innerBindPoseCount; i++) {
					var nodeC:AnimationNode = nodeMapC[meshBoneNames[bindPoseIndices[i]]];
					_cacheAnimationNodeIndices[i] = nodeC._worldMatrixIndex;
				}
			}
		}
		
		/**
		 * @private
		 */
		public function _setCacheAvatar(value:Avatar):void {//[兼容性API]
			if (_cacheAvatar !== value) {
				if (_cacheMesh) {
					_cacheAvatar = value;
					if (value) {
						_defineDatas.add(SkinnedMeshSprite3D.SHADERDEFINE_BONE);
						_getCacheAnimationNodes();
					}
				} else {
					_cacheAvatar = value;
				}
				_setRootNode();
			}
		}
		
		/**@private	[NATIVE]*/
		private var _cacheAnimationNodeIndices:Uint16Array;
		
		/**
		 * @private [NATIVE]
		 */
		private function _computeSubSkinnedDataNative(worldMatrixs:Float32Array, cacheAnimationNodeIndices:Uint16Array, inverseBindPosesBuffer:ArrayBuffer, boneIndices:Uint16Array, bindPoseInices:Uint16Array, data:Float32Array):void {
			LayaGL.instance.computeSubSkinnedData(worldMatrixs, cacheAnimationNodeIndices, inverseBindPosesBuffer, boneIndices, bindPoseInices, data);
		}
	}
}