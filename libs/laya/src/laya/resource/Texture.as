package laya.resource {
	import laya.events.Event;
	import laya.events.EventDispatcher;
	import laya.maths.Rectangle;
	import laya.renders.Render;
	import laya.utils.Browser;
	import laya.utils.Handler;
	import laya.utils.RunDriver;
	
	/**
	 * 资源加载完成后调度。
	 * @eventType Event.READY
	 */
	[Event(name = "ready", type = "laya.events.Event")]
	
	/**
	 * <code>Texture</code> 是一个纹理处理类。
	 */
	public class Texture extends EventDispatcher {
		/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
		/**@private 默认 UV 信息。*/
		public static var DEF_UV:Array = /*[STATIC SAFE]*/ new Float32Array([0, 0, 1.0, 0, 1.0, 1.0, 0, 1.0]);
		/**@private */
		public static var NO_UV:Array = /*[STATIC SAFE]*/ new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
		/**@private 反转 UV 信息。*/
		public static var INV_UV:Array = /*[STATIC SAFE]*/ new Float32Array([0, 1, 1.0, 1, 1.0, 0.0, 0, 0.0]);
		/**@private */
		private static var _rect1:Rectangle = /*[STATIC SAFE]*/ new Rectangle();
		/**@private */
		private static var _rect2:Rectangle = /*[STATIC SAFE]*/ new Rectangle();
		
		/**@private uv的范围*/
		public var uvrect:Array = [0, 0, 1, 1]; //startu,startv, urange,vrange
		/**@private */
		private var _destroyed:Boolean = false;
		/**@private */
		private var _bitmap:Texture2D;
		/**@private */
		private var _uv:Array;
		/**@private */
		private var _referenceCount:int = 0;
		/** @private [NATIVE]*/
		public var _nativeObj:*;
		
		/**@private 唯一ID*/
		public var $_GID:Number=0;
		/**沿 X 轴偏移量。*/
		public var offsetX:Number = 0;
		/**沿 Y 轴偏移量。*/
		public var offsetY:Number = 0;
		/** @private */
		private var _w:Number = 0;
		/** @private */
		private var _h:Number = 0;
		
		/**原始宽度（包括被裁剪的透明区域）。*/
		public var sourceWidth:Number = 0;
		/**原始高度（包括被裁剪的透明区域）。*/
		public var sourceHeight:Number = 0;
		/**图片地址*/
		public var url:String=null;
		/** @private */
		public var scaleRate:Number = 1;
		
		/**
		 * 平移 UV。
		 * @param offsetX 沿 X 轴偏移量。
		 * @param offsetY 沿 Y 轴偏移量。
		 * @param uv 需要平移操作的的 UV。
		 * @return 平移后的UV。
		 */
		public static function moveUV(offsetX:Number, offsetY:Number, uv:Array):Array {
			for (var i:int = 0; i < 8; i += 2) {
				uv[i] += offsetX;
				uv[i + 1] += offsetY;
			}
			return uv;
		}
		
		/**
		 *  根据指定资源和坐标、宽高、偏移量等创建 <code>Texture</code> 对象。
		 * @param	source 绘图资源 Texture2D 或者 Texture对象。
		 * @param	x 起始绝对坐标 x 。
		 * @param	y 起始绝对坐标 y 。
		 * @param	width 宽绝对值。
		 * @param	height 高绝对值。
		 * @param	offsetX X 轴偏移量（可选）。	就是[x,y]相对于原始小图片的位置。一般都是正的，表示裁掉了空白边的大小，如果是负的一般表示加了保护边
		 * @param	offsetY Y 轴偏移量（可选）。
		 * @param	sourceWidth 原始宽度，包括被裁剪的透明区域（可选）。
		 * @param	sourceHeight 原始高度，包括被裁剪的透明区域（可选）。
		 * @return  <code>Texture</code> 对象。
		 */
		public static function create(source:Texture2D, x:Number, y:Number, width:Number, height:Number, offsetX:Number = 0, offsetY:Number = 0, sourceWidth:Number = 0, sourceHeight:Number = 0):Texture {
			return _create(source, x, y, width, height, offsetX, offsetY, sourceWidth, sourceHeight);
		}
		
		/**
		 * @private
		 * 根据指定资源和坐标、宽高、偏移量等创建 <code>Texture</code> 对象。
		 * @param	source 绘图资源 Texture2D 或者 Texture 对象。
		 * @param	x 起始绝对坐标 x 。
		 * @param	y 起始绝对坐标 y 。
		 * @param	width 宽绝对值。
		 * @param	height 高绝对值。
		 * @param	offsetX X 轴偏移量（可选）。
		 * @param	offsetY Y 轴偏移量（可选）。
		 * @param	sourceWidth 原始宽度，包括被裁剪的透明区域（可选）。
		 * @param	sourceHeight 原始高度，包括被裁剪的透明区域（可选）。
		 * @param	outTexture 返回的Texture对象。
		 * @return  <code>Texture</code> 对象。
		 */
		public static function _create(source:Texture2D, x:Number, y:Number, width:Number, height:Number, offsetX:Number = 0, offsetY:Number = 0, sourceWidth:Number = 0, sourceHeight:Number = 0, outTexture:Texture = null):Texture {
			var btex:Boolean = source is Texture;
			var uv:Array = btex ? (source as Texture).uv : DEF_UV;
			var bitmap:Texture2D = btex ? (source as Texture).bitmap : source;
			
			if (bitmap.width && (x + width) > bitmap.width)
				width = bitmap.width - x;
			if (bitmap.height && (y + height) > bitmap.height)
				height = bitmap.height - y;
			var tex:Texture;
			if (outTexture) {
				tex = outTexture;
				tex.setTo(bitmap, null, sourceWidth || width, sourceHeight || height);
			} else {
				tex = new Texture(bitmap, null, sourceWidth || width, sourceHeight || height)
			}
			tex.width = width;
			tex.height = height;
			tex.offsetX = offsetX;
			tex.offsetY = offsetY;
			
			var dwidth:Number = 1 / bitmap.width;
			var dheight:Number = 1 / bitmap.height;
			x *= dwidth;
			y *= dheight;
			width *= dwidth;
			height *= dheight;
			
			var u1:Number = tex.uv[0], v1:Number = tex.uv[1], u2:Number = tex.uv[4], v2:Number = tex.uv[5];
			var inAltasUVWidth:Number = (u2 - u1), inAltasUVHeight:Number = (v2 - v1);
			var oriUV:Array = moveUV(uv[0], uv[1], [x, y, x + width, y, x + width, y + height, x, y + height]);
			tex.uv = new Float32Array([
					u1 + oriUV[0] * inAltasUVWidth, v1 + oriUV[1] * inAltasUVHeight, 
					u2 - (1 - oriUV[2]) * inAltasUVWidth, v1 + oriUV[3] * inAltasUVHeight, 
					u2 - (1 - oriUV[4]) * inAltasUVWidth, v2 - (1 - oriUV[5]) * inAltasUVHeight, 
					u1 + oriUV[6] * inAltasUVWidth, v2 - (1 - oriUV[7]) * inAltasUVHeight
				]);
			
			var bitmapScale:Number = (bitmap as Texture).scaleRate;
			if (bitmapScale && bitmapScale != 1) {
				tex.sourceWidth /= bitmapScale;
				tex.sourceHeight /= bitmapScale;
				tex.width /= bitmapScale;
				tex.height /= bitmapScale;
				tex.scaleRate = bitmapScale;
			} else {
				tex.scaleRate = 1;
			}
			return tex;
		}
		
		/**
		 * 截取Texture的一部分区域，生成新的Texture，如果两个区域没有相交，则返回null。
		 * @param	texture	目标Texture。
		 * @param	x		相对于目标Texture的x位置。
		 * @param	y		相对于目标Texture的y位置。
		 * @param	width	截取的宽度。
		 * @param	height	截取的高度。
		 * @return 返回一个新的Texture。
		 */
		public static function createFromTexture(texture:Texture, x:Number, y:Number, width:Number, height:Number):Texture {
			var texScaleRate:Number = texture.scaleRate;
			if (texScaleRate != 1) {
				x *= texScaleRate;
				y *= texScaleRate;
				width *= texScaleRate;
				height *= texScaleRate;
			}
			var rect:Rectangle = Rectangle.TEMP.setTo(x - texture.offsetX, y - texture.offsetY, width, height);
			var result:Rectangle = rect.intersection(_rect1.setTo(0, 0, texture.width, texture.height), _rect2);
			if (result)
				var tex:Texture = create((texture as Texture2D), result.x, result.y, result.width, result.height, result.x - rect.x, result.y - rect.y, width, height);
			else
				return null;
			return tex;
		}
		
		
		public function get uv():Array {
			return _uv;
		}
		
		public function set uv(value:Array):void {
			uvrect[0] = Math.min(value[0], value[2], value[4], value[6]);
			uvrect[1] = Math.min(value[1], value[3], value[5], value[7]);
			uvrect[2] = Math.max(value[0], value[2], value[4], value[6]) - uvrect[0];
			uvrect[3] = Math.max(value[1], value[3], value[5], value[7]) - uvrect[1];
			_uv = value;
		}
		
		/** 实际宽度。*/
		public function get width():Number {
			if (_w)
				return _w;
			if (!bitmap) return 0;
			return (uv && uv !== DEF_UV) ? (uv[2] - uv[0]) * bitmap.width : bitmap.width;
		}
		
		public function set width(value:Number):void {
			_w = value;
			sourceWidth || (sourceWidth = value);
		}
		
		/** 实际高度。*/
		public function get height():Number {
			if (_h)
				return _h;
			if (!bitmap) return 0;
			return (uv && uv !== DEF_UV) ? (uv[5] - uv[1]) * bitmap.height : bitmap.height;
		}
		
		public function set height(value:Number):void {
			_h = value;
			sourceHeight || (sourceHeight = value);
		}
		
		/**
		 * 获取位图。
		 * @return 位图。
		 */
		public function get bitmap():Texture2D {
			return _bitmap;
		}
		
		/**
		 * 设置位图。
		 * @param 位图。
		 */
		public function set bitmap(value:Texture2D):void {
			_bitmap && _bitmap._removeReference(_referenceCount);
			_bitmap = value;
			value && (value._addReference(_referenceCount));
		}
		
		/**
		 * 获取是否已经销毁。
		 * @return 是否已经销毁。
		 */
		public function get destroyed():Boolean {
			return _destroyed;
		}
		
		/**
		 * 创建一个 <code>Texture</code> 实例。
		 * @param	bitmap 位图资源。
		 * @param	uv UV 数据信息。
		 */
		public function Texture(bitmap:Texture2D = null, uv:Array = null, sourceWidth:Number = 0, sourceHeight:Number = 0) {
			setTo(bitmap, uv, sourceWidth, sourceHeight);
		}
		
		/**
		 * @private
		 */
		public function _addReference():void {
			_bitmap && _bitmap._addReference();
			_referenceCount++;
		}
		
		/**
		 * @private
		 */
		public function _removeReference():void {
			_bitmap && _bitmap._removeReference();
			_referenceCount--;
		}
		
		/**
		 * @private
		 */
		public function _getSource(cb:Function=null):* {
			if (_destroyed || !_bitmap)
				return null;
			recoverBitmap(cb);
			return _bitmap.destroyed ? null : bitmap._getSource();
		}
		
		/**
		 * @private
		 */
		private function _onLoaded(complete:Handler, context:*):void {
			if (!context) {
			} else if (context == this) {
				
			} else if (context is Texture) {
				var tex:Texture = context;
				_create(context, 0, 0, tex.width, tex.height, 0, 0, tex.sourceWidth, tex.sourceHeight, this);
			} else {
				this.bitmap = context;
				sourceWidth = _w = context.width;
				sourceHeight = _h = context.height;
			}
			complete && complete.run();
			event(Event.READY, this);
		}
		
		/**
		 * 获取是否可以使用。
		 */
		public function getIsReady():Boolean {
			return _destroyed ? false : (_bitmap ? true : false);
		}
		
		/**
		 * 设置此对象的位图资源、UV数据信息。
		 * @param	bitmap 位图资源
		 * @param	uv UV数据信息
		 */
		public function setTo(bitmap:Texture2D = null, uv:Array = null, sourceWidth:Number = 0, sourceHeight:Number = 0):void {
			this.bitmap = bitmap;
			this.sourceWidth = sourceWidth;
			this.sourceHeight = sourceHeight;
			
			if (bitmap) {
				_w = bitmap.width;
				_h = bitmap.height;
				this.sourceWidth = this.sourceWidth || bitmap.width;
				this.sourceHeight = this.sourceHeight || bitmap.height
			}
			this.uv = uv || DEF_UV;
		}
		
		/**
		 * 加载指定地址的图片。
		 * @param	url 图片地址。
		 * @param	complete 加载完成回调
		 */
		public function load(url:String, complete:Handler = null):void {
			if (!_destroyed)
				Laya.loader.load(url, Handler.create(this, _onLoaded, [complete]), null, "htmlimage", 1, false, null, true);
		}
		
		public function getTexturePixels ( x:Number, y:Number, width:Number, height:Number):Uint8Array {
			var st:int, dst:int,i:int;
			var tex2d:Texture2D = bitmap;
			var texw:int = tex2d.width;
			var texh:int = tex2d.height;
			if (x + width > texw) width -= (x + width) - texw;
			if (y + height > texh) height -= (y + height) - texh;
			if (width <= 0 || height <= 0) return null;
		
			var wstride:int = width * 4;
			var pix:Uint8Array = null;
			try {
				pix = tex2d.getPixels();
			}catch (e:*) {
			}
			if (pix) {
				if(x==0&&y==0&&width==texw&&height==texh)
					return pix;
				//否则只取一部分
				var ret:Uint8Array = new Uint8Array(width * height * 4);
				wstride = texw * 4;
				st= x*4;
				dst = (y+height-1)*wstride+x*4;
				for (i = height - 1; i >= 0; i--) {
					ret.set(dt.slice(dst, dst + width*4),st);
					st += wstride;
					dst -= wstride;
				}
				return ret;
			}
			
			// 如果无法直接获取，只能先渲染出来
			var ctx:Context = new Context();
			ctx.size(width, height);
			ctx.asBitmap = true;
			var uv:Array = null;
			if (x != 0 || y != 0 || width != texw || height != texh) {
				uv = uv.concat();	// 复制一份uv
				var stu:Number = uv[0];
				var stv:Number = uv[1];
				var uvw:Number = uv[2] - stu;
				var uvh:Number = uv[7] - stv;
				var uk:Number = uvw / texw;
				var vk:Number = uvh / texh;
				uv = [
					stu + x * uk, 			stv + y * vk,
					stu + (x + width) * uk, stv + y * vk,
					stu + (x + width) * uk, stv + (y + height) * vk,
					stu + x * uk,			stv + (y + height) * vk,
				];
			}
			ctx._drawTextureM(this, 0, 0, width, height, null, 1.0, uv); 
			//ctx.drawTexture(value, -x, -y, x + width, y + height);
			ctx._targets.start();
			ctx.flush();
			ctx._targets.end();
			ctx._targets.restore();
			var dt:Uint8Array = ctx._targets.getData(0, 0, width, height);
			ctx.destroy();
			// 上下颠倒一下
			ret = new Uint8Array(width * height * 4);
			st = 0;
			dst = (height-1)*wstride;
			for (i = height - 1; i >= 0; i--) {
				ret.set(dt.slice(dst, dst + wstride),st);
				st += wstride;
				dst -= wstride;
			}
			return ret;
		}		
		
		/**
		 * 获取Texture上的某个区域的像素点
		 * @param	x
		 * @param	y
		 * @param	width
		 * @param	height
		 * @return  返回像素点集合
		 */
		public function getPixels(x:Number, y:Number, width:Number, height:Number):Uint8Array {
			if (Render.isConchApp) {
				return this._nativeObj.getImageData(x, y, width, height);
			} else {
				return getTexturePixels( x, y, width, height);
			}// canvas 不支持
		}
		
		/**
		 * 通过url强制恢复bitmap。
		 */
		public function recoverBitmap(onok:Function=null):void {
			var url:String=_bitmap.url;
			if (!_destroyed && (!_bitmap || _bitmap.destroyed) && url){
				Laya.loader.load(url, Handler.create(this, function(bit:*):void{
					bitmap = bit;
					onok && onok();
				}), null, "htmlimage", 1, false, null, true);	
			}
		}
		
		/**
		 * 强制释放Bitmap,无论是否被引用。
		 */
		public function disposeBitmap():void {
			if (!_destroyed && _bitmap) {
				_bitmap.destroy();
			}
		}
		
		/**
		 * 销毁纹理。
		 */
		public function destroy(force:Boolean=false):void {
			if (!_destroyed) {
				_destroyed = true;
				var bit:Bitmap= _bitmap;
				if (bit) {
					bit._removeReference(_referenceCount);
					if (bit.referenceCount=== 0||force)
						bit.destroy();
					bit = null;
				}
				if (url && this === Laya.loader.getRes(url))
					Laya.loader.clearRes(url);
			}
		}
	}
}