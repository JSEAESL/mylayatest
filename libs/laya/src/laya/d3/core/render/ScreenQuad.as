package laya.d3.core.render {
	import laya.d3.core.BufferState;
	import laya.d3.graphics.VertexBuffer3D;
	import laya.d3.graphics.VertexDeclaration;
	import laya.d3.graphics.VertexElement;
	import laya.d3.graphics.VertexElementFormat;
	import laya.d3.math.Vector4;
	import laya.layagl.LayaGL;
	import laya.resource.Resource;
	import laya.utils.Stat;
	import laya.webgl.WebGLContext;
	
	/**
	 * <code>ScreenQuad</code> 类用于创建全屏四边形。
	 */
	public class ScreenQuad extends Resource {
		/** @private */
		public static const SCREENQUAD_POSITION_UV:int = 0;
		/** @private */
		private static const _vertexDeclaration:VertexDeclaration = new VertexDeclaration(16, [new VertexElement(0, VertexElementFormat.Vector4, ScreenQuad.SCREENQUAD_POSITION_UV)]);
		/** @private */
		private static const _vertices:Float32Array = new Float32Array([1, 1, 1, 0,  1,-1, 1, 1,  -1, 1, 0, 0,  -1, -1, 0, 1]);
		
		/**@private */
		public static var instance:ScreenQuad;
		
		/**
		 * @private
		 */
		public static function __init__():void {
			instance = new ScreenQuad();
			instance.lock = true;
		}
		
		/** @private */
		private var _vertexBuffer:VertexBuffer3D;
		/** @private */
		private var _bufferState:BufferState = new BufferState();
		
		/**
		 * 创建一个 <code>ScreenQuad</code> 实例,禁止使用。
		 */
		public function ScreenQuad() {
			_vertexBuffer = new VertexBuffer3D(16 * 4, WebGLContext.STATIC_DRAW, false);
			_vertexBuffer.vertexDeclaration = ScreenQuad._vertexDeclaration;
			_vertexBuffer.setData(_vertices);
			_bufferState.bind();
			_bufferState.applyVertexBuffer(_vertexBuffer);
			_bufferState.unBind();
			_setGPUMemory(_vertexBuffer._byteLength);
		}
		
		/**
		 * @private
		 */
		public function render():void {
			_bufferState.bind();
			LayaGL.instance.drawArrays(WebGLContext.TRIANGLE_STRIP, 0, 4);
			Stat.renderBatches++;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function destroy():void {
			super.destroy();
			_bufferState.destroy();
			_vertexBuffer.destroy();
			_setGPUMemory(0);
		}
	
	}

}