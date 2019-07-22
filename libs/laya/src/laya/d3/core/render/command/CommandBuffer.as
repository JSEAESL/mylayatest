package laya.d3.core.render.command {
	import laya.d3.resource.RenderTexture;
	import laya.d3.shader.Shader3D;
	import laya.d3.shader.ShaderData;
	import laya.layagl.LayaGL;
	import laya.resource.BaseTexture;
	import laya.webgl.WebGLContext;
	
	/**
	 * <code>CommandBuffer</code> 类用于创建命令流。
	 */
	public class CommandBuffer {
		/** @private */
		public static var screenShader:Shader3D = Shader3D.find("ScreenQuad");
		/** @private */
		public static const SCREENTEXTURE_NAME:String = "u_ScreenTexture";
		/** @private */
		public static const SCREENTEXTURE_ID:int = Shader3D.propertyNameToID(SCREENTEXTURE_NAME);
		
		/**@private */
		private var _commands:Vector.<Command> = new Vector.<Command>();
		
		/**
		 * 创建一个 <code>CommandBuffer</code> 实例。
		 */
		public function CommandBuffer() {
		
		}
		
		/**
		 *@private
		 */
		public function _apply():void {
			for (var i:int = 0, n:int = _commands.length; i < n; i++)
				_commands[i].run();
		}
		
		/**
		 *@private
		 */
		public function setShaderDataTexture(shaderData:ShaderData, nameID:int, source:BaseTexture):void {
			_commands.push(SetShaderDataTextureCMD.create(shaderData, nameID, source));
		}
		
		/**
		 *@private
		 */
		public function blit(source:RenderTexture, dest:RenderTexture, shader:Shader3D, shaderData:ShaderData = null, subShader:int = 0):void {//TODO:triangle版
			_commands.push(BlitCMD.create(source, dest, shader, shaderData, subShader));
		}
		
		/**
		 *@private
		 */
		public function setRenderTarget(renderTexture:RenderTexture):void {
			_commands.push(SetRenderTargetCMD.create(renderTexture));
		}
		
		/**
		 *@private
		 */
		public function clear():void {
			for (var i:int = 0, n:int = _commands.length; i < n; i++)
				_commands[i].recover();
			_commands.length = 0;
		}
	
	}

}