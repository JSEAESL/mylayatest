package laya.d3.shader {
	
	/**
	 * @private
	 */
	public class ShaderDefines {
		/**@private */
		private var _counter:int = 0;
		/**@private [只读]*/
		public var defines:Object = {};
		
		/**
		 * @private
		 */
		public function ShaderDefines(superDefines:ShaderDefines = null) {
			if (superDefines) {
				_counter = superDefines._counter;
				for (var k:String in superDefines.defines)
					defines[k] = superDefines.defines[k];
			}
		}
		
		/**
		 * @private
		 */
		public function registerDefine(name:String):int {
			var value:int = Math.pow(2, _counter++);//TODO:超界处理
			defines[value] = name;
			return value;
		}
	}

}