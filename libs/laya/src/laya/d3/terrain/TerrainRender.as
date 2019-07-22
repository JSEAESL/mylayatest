package laya.d3.terrain {
	import laya.d3.core.Sprite3D;
	import laya.d3.core.Transform3D;
	import laya.d3.core.render.BaseRender;
	import laya.d3.core.render.RenderContext3D;
	import laya.d3.math.BoundFrustum;
	import laya.d3.math.ContainmentType;
	import laya.d3.math.Matrix4x4;
	
	/**
	 * <code>MeshRender</code> 类用于网格渲染器。
	 */
	public class TerrainRender extends BaseRender {
		
		/** @private */
		private var _terrainSprite3DOwner:TerrainChunk;
		/** @private */
		protected var _projectionViewWorldMatrix:Matrix4x4;
		
		/**
		 * 创建一个新的 <code>MeshRender</code> 实例。
		 */
		public function TerrainRender(owner:TerrainChunk) {
			super(owner);
			_terrainSprite3DOwner = owner;
			_projectionViewWorldMatrix = new Matrix4x4();
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _needRender(boundFrustum:BoundFrustum):Boolean {
			if (boundFrustum)
				return boundFrustum.containsBoundBox(_bounds._getBoundBox()) !== ContainmentType.Disjoint;
			else
				return true;
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _calculateBoundingBox():void {
			//var terrainFilter:TerrainFilter = _terrainSprite3DOwner.terrainFilter;
			//var worldMat:Matrix4x4 = _terrainSprite3DOwner.transform.worldMatrix;
			//var corners:Vector.<Vector3> = terrainFilter._boundingBoxCorners;
			//for (var i:int = 0; i < 8; i++)
				//Vector3.transformCoordinate(corners[i], worldMat, _tempBoundBoxCorners[i]);
			//BoundBox.createfromPoints(_tempBoundBoxCorners, _boundingBox);
			//terrainFilter.calcLeafBoudingBox(worldMat);
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdate(context:RenderContext3D, transform:Transform3D):void {
			_shaderValues.setMatrix4x4(Sprite3D.WORLDMATRIX, transform.worldMatrix);
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdateWithCamera(context:RenderContext3D, transform:Transform3D):void {
			var projectionView:Matrix4x4 = context.projectionViewMatrix;
			Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
			_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
		}
		
		/**
		 * @private
		 */
		override public function _destroy():void {
			super._destroy();
			_terrainSprite3DOwner = null;
		}
	}
}