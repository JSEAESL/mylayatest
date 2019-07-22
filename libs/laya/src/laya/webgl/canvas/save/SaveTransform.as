package laya.webgl.canvas.save {
	import laya.maths.Matrix;
	import laya.resource.Context;
	
	public class SaveTransform implements ISaveData {
		/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
		
		private static var POOL:* =/*[STATIC SAFE]*/ SaveBase._createArray();
		
		public var _savematrix:Matrix;
		public var _matrix:Matrix = new Matrix();
		
		public function SaveTransform() {
		}
		
		public function isSaveMark():Boolean { return false; }
		
		public function restore(context:Context):void {
			context._curMat = _savematrix;
			POOL[POOL._length++] = this;
		}
		
		public static function save(context:Context):void {
			var _saveMark:* = context._saveMark;
			if ((_saveMark._saveuse & SaveBase.TYPE_TRANSFORM) === SaveBase.TYPE_TRANSFORM) return;
			_saveMark._saveuse |= SaveBase.TYPE_TRANSFORM;
			var no:* = POOL;
			var o:SaveTransform = no._length > 0 ? no[--no._length] : (new SaveTransform());
			o._savematrix = context._curMat;
			context._curMat = context._curMat.copyTo(o._matrix);
			var _save:Array = context._save;
			_save[_save._length++] = o;
		}	
	}
}