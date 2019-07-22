package laya.d3.core.trail {
	import laya.d3.core.Sprite3D;
	import laya.d3.core.Transform3D;
	import laya.d3.core.render.BaseRender;
	import laya.d3.core.render.RenderContext3D;
	import laya.d3.math.BoundFrustum;
	import laya.d3.math.Matrix4x4;
	import laya.d3.math.Vector3;
	import laya.renders.Render;
	import laya.d3.graphics.FrustumCulling;
	
	/**
	 * <code>TrailRenderer</code> 类用于创建拖尾渲染器。
	 */
	public class TrailRenderer extends BaseRender {
		public function TrailRenderer(owner:TrailSprite3D) {
			super(owner);
		}
		
		/**
		 * @inheritDoc
		 */
		override protected function _calculateBoundingBox():void {
			var min:Vector3 = _bounds.getMin();
			min.x = -Number.MAX_VALUE;
			min.y = -Number.MAX_VALUE;
			min.z = -Number.MAX_VALUE;
			_bounds.setMin(min);
			var max:Vector3 = _bounds.getMax();
			max.x = Number.MAX_VALUE;
			max.y = Number.MAX_VALUE;
			max.z = Number.MAX_VALUE;
			_bounds.setMax(max);
			
			if (Render.supportWebGLPlusCulling) {//[NATIVE]
				min =  _bounds.getMin();
				max =  _bounds.getMax();
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
		override public function _needRender(boundFrustum:BoundFrustum):Boolean {
			return true;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdate(state:RenderContext3D, transform:Transform3D):void {
			super._renderUpdate(state, transform);
			(_owner as TrailSprite3D).trailFilter._update(state);
		}
		protected var _projectionViewWorldMatrix:Matrix4x4 = new Matrix4x4();
		
		/**
		 * @inheritDoc
		 */
		override public function _renderUpdateWithCamera(context:RenderContext3D, transform:Transform3D):void {
			var projectionView:Matrix4x4 = context.projectionViewMatrix;
			if (transform) {
				Matrix4x4.multiply(projectionView, transform.worldMatrix, _projectionViewWorldMatrix);
				_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, _projectionViewWorldMatrix);
			} else {
				_shaderValues.setMatrix4x4(Sprite3D.MVPMATRIX, projectionView);
			}
		}
	}
}