package laya.d3.core {
	import laya.d3.core.material.BaseMaterial;
	import laya.d3.core.material.BlinnPhongMaterial;
	import laya.d3.core.render.BaseRender;
	import laya.d3.core.render.RenderContext3D;
	import laya.d3.core.render.RenderElement;
	import laya.d3.core.render.SubMeshRenderElement;
	import laya.d3.graphics.FrustumCulling;
	import laya.d3.graphics.MeshRenderStaticBatchManager;
	import laya.d3.graphics.SubMeshInstanceBatch;
	import laya.d3.math.BoundBox;
	import laya.d3.math.BoundFrustum;
	import laya.d3.math.BoundSphere;
	import laya.d3.math.ContainmentType;
	import laya.d3.math.Matrix4x4;
	import laya.d3.math.Vector3;
	import laya.d3.resource.models.Mesh;
	import laya.d3.shader.ShaderData;
	import laya.d3.utils.Utils3D;
	import laya.renders.Render;
	
	/**
	 * <code>MeshRenderer</code> 类用于网格渲染器。
	 */
	public class MeshRenderer extends BaseRender {
		/**@private */
		private static var _tempVector30:Vector3 = new Vector3();
		/**@private */
		private static var _tempVector31:Vector3 = new Vector3();
		
		/** @private */
		protected var _oriDefineValue:int;
		/** @private */
		protected var _projectionViewWorldMatrix:Matrix4x4;
		
		/**
		 * 创建一个新的 <code>MeshRender</code> 实例。
		 */
		public function MeshRenderer(owner:RenderableSprite3D) {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			super(owner);
			_projectionViewWorldMatrix = new Matrix4x4();
		}
		
		/**
		 * @private
		 */
		public function _onMeshChange(mesh:Mesh):void {
			_boundsChange = true;
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _calculateBoundingBox():void {
			var sharedMesh:Mesh = (_owner as MeshSprite3D).meshFilter.sharedMesh;
			if (sharedMesh) {
				var worldMat:Matrix4x4 = (_owner as MeshSprite3D).transform.worldMatrix;
				sharedMesh.bounds._tranform(worldMat, _bounds);
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
		 * @private
		 */
		public function _changeRenderObjectsByMesh(mesh:Mesh):void {
			var count:int = mesh.subMeshCount;
			_renderElements.length = count;
			for (var i:int = 0; i < count; i++) {
				var renderElement:RenderElement = _renderElements[i];
				if (!renderElement) {
					var material:BaseMaterial = sharedMaterials[i];
					renderElement = _renderElements[i] = new SubMeshRenderElement();
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
		override public function _needRender(boundFrustum:BoundFrustum):Boolean {
			if (boundFrustum)
				return boundFrustum.containsBoundBox(bounds._getBoundBox()) !== ContainmentType.Disjoint;
			else
				return true;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdate(context:RenderContext3D, transform:Transform3D):void {
			var element:SubMeshRenderElement = context.renderElement as SubMeshRenderElement;
			switch (element.renderType) {
			case RenderElement.RENDERTYPE_NORMAL: 
				_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, transform.worldMatrix);
				break;
			case RenderElement.RENDERTYPE_STATICBATCH: 
				_oriDefineValue = _defineDatas.value;
				if (transform)
					_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, transform.worldMatrix);
				else
					_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, Matrix4x4.DEFAULT);
				_defineDatas.add(MeshSprite3D.SHADERDEFINE_UV1);
				_defineDatas.remove(RenderableSprite3D.SHADERDEFINE_SCALEOFFSETLIGHTINGMAPUV);
				break;
			case RenderElement.RENDERTYPE_VERTEXBATCH: 
				_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, Matrix4x4.DEFAULT);
				break;
			case RenderElement.RENDERTYPE_INSTANCEBATCH: 
				var worldMatrixData:Float32Array = SubMeshInstanceBatch.instance.instanceWorldMatrixData;
				var insBatches:Vector.<SubMeshRenderElement> = element.instanceBatchElementList;
				var count:int = insBatches.length;
				for (var i:int = 0; i < count; i++)
					worldMatrixData.set(insBatches[i]._transform.worldMatrix.elements, i * 16);
				SubMeshInstanceBatch.instance.instanceWorldMatrixBuffer.setData(worldMatrixData, 0, 0, count * 16);
				_defineDatas.add(MeshSprite3D.SHADERDEFINE_GPU_INSTANCE);
				break;
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdateWithCamera(context:RenderContext3D, transform:Transform3D):void {
			var projectionView:Matrix4x4 = context.projectionViewMatrix;
			var element:SubMeshRenderElement = context.renderElement as SubMeshRenderElement;
			switch (element.renderType) {
			case RenderElement.RENDERTYPE_NORMAL: 
			case RenderElement.RENDERTYPE_STATICBATCH: 
			case RenderElement.RENDERTYPE_VERTEXBATCH: 
				if (transform) {
					Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
				} else {
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, projectionView);
				}
				break;
			case RenderElement.RENDERTYPE_INSTANCEBATCH: 
				var mvpMatrixData:Float32Array = SubMeshInstanceBatch.instance.instanceMVPMatrixData;
				var insBatches:Vector.<SubMeshRenderElement> = element.instanceBatchElementList;
				var count:int = insBatches.length;
				for (var i:int = 0; i < count; i++) {
					var worldMat:Matrix4x4 = insBatches[i]._transform.worldMatrix;
					Utils3D.mulMatrixByArray(projectionView.elements, 0, worldMat.elements, 0, mvpMatrixData, i * 16);
				}
				SubMeshInstanceBatch.instance.instanceMVPMatrixBuffer.setData(mvpMatrixData, 0, 0, count * 16);
				break;
			}
		}
		
		/**
		 * @inheritDoc
		 */
		public function _renderUpdateWithCameraForNative(context:RenderContext3D, transform:Transform3D):void {
			var projectionView:Matrix4x4 = context.projectionViewMatrix;
			var element:SubMeshRenderElement = context.renderElement as SubMeshRenderElement;
			switch (element.renderType) {
			case RenderElement.RENDERTYPE_NORMAL: 
				if (transform) {
					Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
				} else {
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, projectionView);
				}
				break;
			case RenderElement.RENDERTYPE_STATICBATCH: 
			case RenderElement.RENDERTYPE_VERTEXBATCH: 
				var noteValue:Boolean = ShaderData._SET_RUNTIME_VALUE_MODE_REFERENCE_;
				//runtime专用函数
				ShaderData.setRuntimeValueMode(false);
				if (transform) {
					Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
				} else {
					_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, projectionView);
				}
				//runtime专用函数
				ShaderData.setRuntimeValueMode(noteValue);
				break;
			case RenderElement.RENDERTYPE_INSTANCEBATCH: 
				var mvpMatrixData:Float32Array = SubMeshInstanceBatch.instance.instanceMVPMatrixData;
				var insBatches:Vector.<SubMeshRenderElement> = element.instanceBatchElementList;
				var count:int = insBatches.length;
				for (var i:int = 0; i < count; i++) {
					var worldMat:Matrix4x4 = insBatches[i]._transform.worldMatrix;
					Utils3D.mulMatrixByArray(projectionView.elements, 0, worldMat.elements, 0, mvpMatrixData, i * 16);
				}
				SubMeshInstanceBatch.instance.instanceMVPMatrixBuffer.setData(mvpMatrixData, 0, 0, count * 16);
				break;
			}
		}
		
		/**
		 * @private
		 */
		override public function _revertBatchRenderUpdate(context:RenderContext3D):void {
			var element:SubMeshRenderElement = context.renderElement as SubMeshRenderElement;
			switch (element.renderType) {
			case RenderElement.RENDERTYPE_STATICBATCH: 
				_defineDatas.value = _oriDefineValue;
				break;
			case RenderElement.RENDERTYPE_INSTANCEBATCH: 
				_defineDatas.remove(MeshSprite3D.SHADERDEFINE_GPU_INSTANCE);
				break;
			}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _destroy():void {
			(_isPartOfStaticBatch) && (MeshRenderStaticBatchManager.instance._destroyRenderSprite(_owner));
			super._destroy();
		}
	}

}