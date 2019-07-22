package laya.d3.core.render.command {
	import laya.d3.core.render.ScreenQuad;
	import laya.d3.resource.RenderTexture;
	import laya.d3.shader.Shader3D;
	import laya.d3.shader.ShaderData;
	import laya.d3.shader.ShaderInstance;
	import laya.d3.shader.ShaderPass;
	import laya.d3.shader.SubShader;
	
	/**
	 * @private
	 * <code>BlitCMD</code> 类用于创建从一张渲染目标输出到另外一张渲染目标指令。
	 */
	public class BlitCMD extends Command {
		/**@private */
		private static var _pool:Array = [];
		
		/**@private */
		private var _source:RenderTexture = null;
		/**@private */
		private var _dest:RenderTexture = null;
		/**@private */
		private var _shader:Shader3D = null;
		/**@private */
		private var _shaderData:ShaderData = null;
		/**@private */
		private var _subShader:int = 0;
		
		/**
		 * @private
		 */
		public static function create(source:RenderTexture, dest:RenderTexture, shader:Shader3D, shaderData:ShaderData, subShader:int = 0):BlitCMD {
			var cmd:BlitCMD;
			cmd = _pool.length > 0 ? _pool.pop() : new BlitCMD();
			cmd._source = source;
			cmd._dest = dest;
			cmd._shader = shader;
			cmd._shaderData = shaderData;
			cmd._subShader = subShader;
			return cmd;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function run():void {
			_shaderData.setTexture(CommandBuffer.SCREENTEXTURE_ID, _source);
			var dest:RenderTexture = _dest;
			if (dest)
				dest._start();
			var subShader:SubShader = _shader.getSubShaderAt(_subShader);
			var passes:Vector.<ShaderPass> = subShader._passes;
			for (var i:int = 0, n:int = passes.length; i < n; i++) {
				var shaderPass:ShaderInstance = passes[i].withCompile(0, 0, 0);//TODO:define处理
				shaderPass.bind();
				(_shaderData) && (shaderPass.uploadUniforms(shaderPass._materialUniformParamsMap, _shaderData, true));//TODO:最后一个参数处理
				shaderPass.uploadRenderStateBlendDepth(_shaderData);
				shaderPass.uploadRenderStateFrontFace(_shaderData, true, null);//TODO:
				ScreenQuad.instance.render();
			}
			if (dest)
				dest._end();
		}
		
		/**
		 * @inheritDoc
		 */
		override public function recover():void {
			_pool.push(this);
			_dest = null;
			_shader = null;
			_shaderData = null;
		}
	
	}

}