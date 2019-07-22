package laya.utils {
	import laya.display.Sprite;
	import laya.renders.Render;
	import laya.renders.RenderSprite;
	import laya.resource.Context;
	import laya.resource.HTMLCanvas;
	import laya.resource.Texture;
	import laya.resource.Texture2D;
	import laya.webgl.WebGL;
	import laya.webgl.WebGLContext;
	import laya.webgl.utils.RenderState2D;

	
	/**
	 * @private
	 */
	public class RunDriver {
		//TODO:coverage
		public static var createShaderCondition:Function = function(conditionScript:String):Function {
			var fn:String = "(function() {return " + conditionScript + ";})";
			return Laya._runScript(fn);//生成条件判断函数
		}
		private static var hanzi:RegExp = new RegExp("^[\u4E00-\u9FA5]$");
		private static var fontMap:Array = [];
		public static var measureText:Function = function(txt:String, font:String):* {
			var isChinese:Boolean = hanzi.test(txt);
			if (isChinese && fontMap[font]) {
				return fontMap[font];
			}
			
			var ctx:* = Browser.context;
			ctx.font = font;
			
			var r:* = ctx.measureText(txt);
			if (isChinese) fontMap[font] = r;
			return r;
		}
		
		/**
		 * @private
		 * 绘制到画布。
		 */
		public static var drawToCanvas:Function =/*[STATIC SAFE]*/ function(sprite:Sprite, _renderType:int, canvasWidth:Number, canvasHeight:Number, offsetX:Number, offsetY:Number):HTMLCanvas {
			offsetX -= sprite.x;
			offsetY -= sprite.y;
			offsetX |= 0;
			offsetY |= 0;
			canvasWidth |= 0;
			canvasHeight |= 0;
			var ctx:Context = new Context();
			ctx.size(canvasWidth, canvasHeight);
			ctx.asBitmap = true;
			ctx._targets.start();
			RenderSprite.renders[_renderType]._fun(sprite, ctx, offsetX, offsetY);
			ctx.flush();
			ctx._targets.end();
			ctx._targets.restore();
			var dt:Uint8Array = ctx._targets.getData(0, 0, canvasWidth, canvasHeight);
			ctx.destroy();
			var imgdata:* = __JS__('new ImageData(canvasWidth,canvasHeight);');	//创建空的imagedata。因为下面要翻转，所以不直接设置内容
			//翻转getData的结果。
			var lineLen:int = canvasWidth * 4;
			var temp:Uint8Array = new Uint8Array(lineLen);
			var dst:Uint8Array = imgdata.data;
			var y:int = canvasHeight - 1;
			var off:int = y * lineLen;
			var srcoff:int = 0;
			for (; y >= 0; y--) {
				dst.set(dt.subarray(srcoff, srcoff + lineLen), off);
				off -= lineLen;
				srcoff += lineLen;
			}
			//imgdata.data.set(dt);
			//画到2d画布上
			var canv:HTMLCanvas = new HTMLCanvas(true);
			canv.size(canvasWidth, canvasHeight);
			var ctx2d:Context = canv.getContext('2d');
			__JS__('ctx2d.putImageData(imgdata, 0, 0);');
			return canv;
		}
		
		public static var drawToTexture: Function=function(sprite:Sprite, _renderType:int, canvasWidth:Number, canvasHeight:Number, offsetX:Number, offsetY:Number):Texture {
			offsetX -= sprite.x;
			offsetY -= sprite.y;
			offsetX |= 0;
			offsetY |= 0;
			canvasWidth |= 0;
			canvasHeight |= 0;
			var ctx:Context = new Context();
			ctx.size(canvasWidth, canvasHeight);
			ctx.asBitmap = true;
			ctx._targets.start();
			RenderSprite.renders[_renderType]._fun(sprite, ctx, offsetX, offsetY);
			ctx.flush();
			ctx._targets.end();
			ctx._targets.restore();
			var rtex:Texture = new Texture( (ctx._targets as Texture2D),Texture.INV_UV);
			ctx.destroy(true);// 保留 _targets
			return rtex;
		}
		
		/**
		 * 用于改变 WebGL宽高信息。
		 */
		public static var changeWebGLSize:Function = /*[STATIC SAFE]*/ function(w:Number, h:Number):void {
			WebGL.onStageResize(w, h);
		}
		
		/** @private */
		public static var clear:Function = function(value:String):void {
			//修改需要同步到上面的native实现中
			Context.set2DRenderConfig();//渲染2D前要还原2D状态,否则可能受3D影响
			RenderState2D.worldScissorTest && WebGL.mainContext.disable(WebGLContext.SCISSOR_TEST);
			var ctx:Context = Render.context;
			//兼容浏览器
			var c:Array = (ctx._submits._length == 0 || Config.preserveDrawingBuffer) ? ColorUtils.create(value).arrColor : Laya.stage._wgColor;
			if (c) 
				ctx.clearBG(c[0], c[1], c[2], c[3]);
			else
				ctx.clearBG(0, 0, 0, 0);
			RenderState2D.clear();
		};
		
		
		public static var  enableNative:Function;
	}

}