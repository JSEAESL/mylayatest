package laya.d3.core.render.command {
	import laya.d3.resource.RenderTexture;
	
	/**
	 * @private
	 * <code>SetRenderTargetCMD</code> 类用于创建设置渲染目标指令。
	 */
	public class SetRenderTargetCMD extends Command {
		/**@private */
		private static var _pool:Array = [];
		
		/**@private */
		private var _renderTexture:RenderTexture = null;
		
		/**
		 * @private
		 */
		public static function create(renderTexture:RenderTexture):SetRenderTargetCMD {
			var cmd:SetRenderTargetCMD;
			cmd = _pool.length > 0 ? _pool.pop() : new SetRenderTargetCMD();
			cmd._renderTexture = renderTexture;
			return cmd;
		}
		
		/**
		 * @inheritDoc
		 */
		override public function run():void {
			_renderTexture._start();
		}
		
		/**
		 * @inheritDoc
		 */
		override public function recover():void {
			_pool.push(this);
			_renderTexture = null;
		}
	
	}

}