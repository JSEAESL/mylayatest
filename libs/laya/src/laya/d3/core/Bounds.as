package laya.d3.core {
	import laya.d3.math.BoundBox;
	import laya.d3.math.Matrix4x4;
	import laya.d3.math.Vector3;
	
	/**
	 * <code>Bounds</code> 类用于创建包围体。
	 */
	public class Bounds implements IClone {
		/**@private */
		public static const _UPDATE_MIN:int = 0x01;
		/**@private */
		public static const _UPDATE_MAX:int = 0x02;
		/**@private */
		public static const _UPDATE_CENTER:int = 0x04;
		/**@private */
		public static const _UPDATE_EXTENT:int = 0x08;
		
		/**@private */
		private var _updateFlag:int = 0;
		
		/**@private	*/
		public var _center:Vector3 = new Vector3();
		/**@private	*/
		public var _extent:Vector3 = new Vector3();
		/**@private	*/
		public var _boundBox:BoundBox = new BoundBox(new Vector3(), new Vector3());
		
		/**
		 * 设置包围盒的最小点。
		 * @param value	包围盒的最小点。
		 */
		public function setMin(value:Vector3):void {
			var min:Vector3 = _boundBox.min;
			if (value !== min)
				value.cloneTo(min);
			_setUpdateFlag(_UPDATE_CENTER | _UPDATE_EXTENT, true);
			_setUpdateFlag(_UPDATE_MIN, false);
		}
		
		/**
		 * 获取包围盒的最小点。
		 * @return	包围盒的最小点。
		 */
		public function getMin():Vector3 {
			var min:Vector3 = _boundBox.min;
			if (_getUpdateFlag(_UPDATE_MIN)) {
				_getMin(getCenter(), getExtent(), min);
				_setUpdateFlag(_UPDATE_MIN, false);
			}
			return min;
		}
		
		/**
		 * 设置包围盒的最大点。
		 * @param value	包围盒的最大点。
		 */
		public function setMax(value:Vector3):void {
			var max:Vector3 = _boundBox.max;
			if (value !== max)
				value.cloneTo(max);
			_setUpdateFlag(_UPDATE_CENTER | _UPDATE_EXTENT, true);
			_setUpdateFlag(_UPDATE_MAX, false);
		}
		
		/**
		 * 获取包围盒的最大点。
		 * @return	包围盒的最大点。
		 */
		public function getMax():Vector3 {
			var max:Vector3 = _boundBox.max;
			if (_getUpdateFlag(_UPDATE_MAX)) {
				_getMax(getCenter(), getExtent(), max);
				_setUpdateFlag(_UPDATE_MAX, false);
			}
			return max;
		}
		
		/**
		 * 设置包围盒的中心点。
		 * @param value	包围盒的中心点。
		 */
		public function setCenter(value:Vector3):void {
			if (value !== _center)
				value.cloneTo(_center);
			_setUpdateFlag(_UPDATE_MIN | _UPDATE_MAX, true);
			_setUpdateFlag(_UPDATE_CENTER, false);
		}
		
		/**
		 * 获取包围盒的中心点。
		 * @return	包围盒的中心点。
		 */
		public function getCenter():Vector3 {
			if (_getUpdateFlag(_UPDATE_CENTER)) {
				_getCenter(getMin(), getMax(), _center);
				_setUpdateFlag(_UPDATE_CENTER, false);
			}
			return _center;
		}
		
		/**
		 * 设置包围盒的范围。
		 * @param value	包围盒的范围。
		 */
		public function setExtent(value:Vector3):void {
			if (value !== _extent)
				value.cloneTo(_extent);
			_setUpdateFlag(_UPDATE_MIN | _UPDATE_MAX, true);
			_setUpdateFlag(_UPDATE_EXTENT, false);
		}
		
		/**
		 * 获取包围盒的范围。
		 * @return	包围盒的范围。
		 */
		public function getExtent():Vector3 {
			if (_getUpdateFlag(_UPDATE_EXTENT)) {
				_getExtent(getMin(), getMax(), _extent);
				_setUpdateFlag(_UPDATE_EXTENT, false);
			}
			return _extent;
		}
		
		/**
		 * 创建一个 <code>Bounds</code> 实例。
		 * @param	min  min 最小坐标
		 * @param	max  max 最大坐标。
		 */
		public function Bounds(min:Vector3, max:Vector3) {
			min.cloneTo(_boundBox.min);
			max.cloneTo(_boundBox.max);
			_setUpdateFlag(_UPDATE_CENTER | _UPDATE_EXTENT, true);
		}
		
		/**
		 * @private
		 */
		private function _getUpdateFlag(type:int):Boolean {
			return (_updateFlag & type) != 0;
		}
		
		/**
		 * @private
		 */
		private function _setUpdateFlag(type:int, value:Boolean):void {
			if (value)
				_updateFlag |= type;
			else
				_updateFlag &= ~type;
		}
		
		/**
		 * @private
		 */
		private function _getCenter(min:Vector3, max:Vector3, out:Vector3):void {
			Vector3.add(min, max, out);
			Vector3.scale(out, 0.5, out);
		}
		
		/**
		 * @private
		 */
		private function _getExtent(min:Vector3, max:Vector3, out:Vector3):void {
			Vector3.subtract(max, min, out);
			Vector3.scale(out, 0.5, out);
		}
		
		/**
		 * @private
		 */
		private function _getMin(center:Vector3, extent:Vector3, out:Vector3):void {
			Vector3.subtract(center, extent, out);
		}
		
		/**
		 * @private
		 */
		private function _getMax(center:Vector3, extent:Vector3, out:Vector3):void {
			Vector3.add(center, extent, out);
		}
		
		/**
		 * @private
		 */
		private function _rotateExtents(extents:Vector3, rotation:Matrix4x4, out:Vector3):void {
			var extentsX:Number = extents.x;
			var extentsY:Number = extents.y;
			var extentsZ:Number = extents.z;
			var matE:Float32Array = rotation.elements;
			out.x = Math.abs(matE[0] * extentsX) + Math.abs(matE[4] * extentsY) + Math.abs(matE[8] * extentsZ);
			out.y = Math.abs(matE[1] * extentsX) + Math.abs(matE[5] * extentsY) + Math.abs(matE[9] * extentsZ);
			out.z = Math.abs(matE[2] * extentsX) + Math.abs(matE[6] * extentsY) + Math.abs(matE[10] * extentsZ);
		}
		
		/**
		 * @private
		 */
		public function _tranform(matrix:Matrix4x4, out:Bounds):void {
			var outCen:Vector3 = out._center;
			var outExt:Vector3 = out._extent;
			
			Vector3.transformCoordinate(getCenter(), matrix, outCen);
			_rotateExtents(getExtent(), matrix, outExt);
			
			out._boundBox.setCenterAndExtent(outCen, outExt);
			out._updateFlag = 0;
		}
		
		/**
		 * @private
		 */
		public function _getBoundBox():BoundBox {
			var min:Vector3 = _boundBox.min;
			if (_getUpdateFlag(_UPDATE_MIN)) {
				_getMin(getCenter(), getExtent(), min);
				_setUpdateFlag(_UPDATE_MIN, false);
			}
			var max:Vector3 = _boundBox.max;
			if (_getUpdateFlag(_UPDATE_MAX)) {
				_getMax(getCenter(), getExtent(), max);
				_setUpdateFlag(_UPDATE_MAX, false);
			}
			return _boundBox;
		}
		
		/**
		 * 克隆。
		 * @param	destObject 克隆源。
		 */
		public function cloneTo(destObject:*):void {
			var destBounds:Bounds = destObject as Bounds;
			getMin().cloneTo(destBounds._boundBox.min);
			getMax().cloneTo(destBounds._boundBox.max);
			getCenter().cloneTo(destBounds._center);
			getExtent().cloneTo(destBounds._extent);
			destBounds._updateFlag = 0;
		}
		
		/**
		 * 克隆。
		 * @return	 克隆副本。
		 */
		public function clone():* {
			var dest:Bounds = __JS__("new this.constructor()");
			cloneTo(dest);
			return dest;
		}
	
	}

}