package laya.d3.core.render.command {
	import laya.d3.resource.RenderTexture;
	import laya.d3.shader.ShaderData;
	import laya.resource.BaseTexture;
	
	/**
	 * @private
	 * <code>SetShaderDataTextureCMD</code> 类用于创建设置渲染目标指令。
	 */
	public class SetShaderDataTextureCMD extends Command {
		/**@private */
		private static var _pool:Array = [];
		
		/**@private */
		private var _shaderData:ShaderData = null;
		/**@private */
		private var _nameID:int = 0;
		/**@private */
		private var _texture:BaseTexture = null;
		
		/**
		 * @private
		 */
		public static function create(shaderData:ShaderData, nameID:int, texture:BaseTexture):SetShaderDataTextureCMD {
			var cmd:SetShaderDataTextureCMD;
			cmd = _pool.length > 0 ? _pool.pop() : new SetShaderDataTextureCMD();
			cmd._shaderData = shaderData;
			cmd._nameID = nameID;
			cmd._texture = texture;
			return cmd;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function run():void {
			_shaderData.setTexture(_nameID, _texture);
		}
		
		/**
		 * @inheritDoc
		 */
		override public function recover():void {
			_pool.push(this);
			_shaderData = null;
			_nameID = 0;
			_texture = null;
		}
	
	}

}