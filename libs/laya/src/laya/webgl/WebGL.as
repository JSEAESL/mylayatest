package laya.webgl {
	import laya.display.Sprite;
	import laya.display.Stage;
	import laya.filters.ColorFilter;
	import laya.filters.Filter;
	import laya.layagl.CommandEncoder;
	import laya.layagl.LayaGL;
	import laya.layagl.LayaGLRunner;
	import laya.maths.Matrix;
	import laya.maths.Point;
	import laya.maths.Rectangle;
	import laya.renders.Render;
	import laya.renders.RenderSprite;
	import laya.resource.Bitmap;
	import laya.resource.Context;
	import laya.resource.HTMLCanvas;
	import laya.resource.Texture;
	import laya.system.System;
	import laya.utils.Browser;
	import laya.utils.ColorUtils;
	import laya.utils.RunDriver;
	import laya.webgl.canvas.BlendMode;
	import laya.resource.BaseTexture;
	import laya.resource.RenderTexture2D;
	import laya.resource.Texture2D;
	import laya.resource.WebGLRTMgr;
	import laya.webgl.shader.d2.Shader2D;
	import laya.webgl.shader.d2.ShaderDefines2D;
	import laya.webgl.shader.d2.value.Value2D;
	import laya.webgl.shader.Shader;
	import laya.webgl.submit.Submit;
	import laya.webgl.submit.SubmitCMD;
	import laya.webgl.utils.Buffer2D;
	import laya.webgl.utils.RenderState2D;
	
	/**
	 * @private
	 */
	public class WebGL {
		public static var mainContext:WebGLContext;
		public static var shaderHighPrecision:Boolean;
		public static var _isWebGL2:Boolean = false;
		public static var isNativeRender_enable:Boolean = false;
		
		//TODO:coverage
		private static function _uint8ArraySlice():Uint8Array {
			var _this:* = __JS__("this");
			var sz:int = _this.length;
			var dec:Uint8Array = new Uint8Array(_this.length);
			for (var i:int = 0; i < sz; i++) dec[i] = _this[i];
			return dec;
		}
		
		//TODO:coverage
		private static function _float32ArraySlice():Float32Array {
			var _this:* = __JS__("this");
			var sz:int = _this.length;
			var dec:Float32Array = new Float32Array(_this.length);
			for (var i:int = 0; i < sz; i++) dec[i] = _this[i];
			return dec;
		}
		
		//TODO:coverage
		private static function _uint16ArraySlice(... arg):Uint16Array {
			var _this:* = __JS__("this");
			var sz:int;
			var dec:Uint16Array;
			var i:int;
			if (arg.length === 0) {
				sz = _this.length;
				dec = new Uint16Array(sz);
				for (i = 0; i < sz; i++)
					dec[i] = _this[i];
				
			} else if (arg.length === 2) {
				var start:int = arg[0];
				var end:int = arg[1];
				
				if (end > start) {
					sz = end - start;
					dec = new Uint16Array(sz);
					for (i = start; i < end; i++)
						dec[i - start] = _this[i];
				} else {
					dec = new Uint16Array(0);
				}
			}
			return dec;
		}
		
		public static function _nativeRender_enable():void {
			if (isNativeRender_enable)
				return;
			isNativeRender_enable = true;

			WebGLContext.__init_native();
			Shader.prototype.uploadTexture2D = function(value:*):void {
				var CTX:* = WebGLContext;
				CTX.bindTexture(WebGL.mainContext, CTX.TEXTURE_2D, value);
			}
			RenderState2D.width = Browser.window.innerWidth;
			RenderState2D.height = Browser.window.innerHeight;
			RunDriver.measureText = function(txt:String, font:String):* {
				window["conchTextCanvas"].font = font;
				return window["conchTextCanvas"].measureText(txt);
			}
			RunDriver.enableNative = function():void {
				if (Render.supportWebGLPlusRendering) {
					(LayaGLRunner as Object).uploadShaderUniforms = LayaGLRunner.uploadShaderUniformsForNative;
					//替换buffer的函数
					__JS__("CommandEncoder = window.GLCommandEncoder");
					__JS__("LayaGL = window.LayaGLContext");
				}
				var stage:* = Stage;
				stage.prototype.render = stage.prototype.renderToNative;
			}
			RunDriver.clear = function(color:String):void {
				Context.set2DRenderConfig();//渲染2D前要还原2D状态,否则可能受3D影响
				var c:Array = ColorUtils.create(color).arrColor;
				var gl:* = LayaGL.instance;
				if (c) gl.clearColor(c[0], c[1], c[2], c[3]);
				gl.clear(WebGLContext.COLOR_BUFFER_BIT | WebGLContext.DEPTH_BUFFER_BIT | WebGLContext.STENCIL_BUFFER_BIT);
				RenderState2D.clear();
			}
			RunDriver.drawToCanvas = RunDriver.drawToTexture =  function(sprite:Sprite, _renderType:int, canvasWidth:Number, canvasHeight:Number, offsetX:Number, offsetY:Number):* {
				offsetX -= sprite.x;
				offsetY -= sprite.y;
				offsetX |= 0;
				offsetY |= 0;
				canvasWidth |= 0;
				canvasHeight |= 0;
				
				var canv:HTMLCanvas = new HTMLCanvas(false);
				var ctx:Context = canv.getContext('2d');
				canv.size(canvasWidth, canvasHeight);
				
				ctx.asBitmap = true;
				ctx._targets.start();
				RenderSprite.renders[_renderType]._fun(sprite, ctx, offsetX, offsetY);
				ctx.flush();
				ctx._targets.end();
				ctx._targets.restore();
				return canv;
			}
			RenderTexture2D.prototype._uv = RenderTexture2D.flipyuv;
			Object["defineProperty"](RenderTexture2D.prototype, "uv", {
					"get":function():* {
						return this._uv;
					},
					"set":function(v:*):void {
							this._uv = v;
					}
				}
			);
			HTMLCanvas.prototype.getTexture = function():Texture {
				if (!this._texture) {
					this._texture = this.context._targets;
					this._texture.uv = RenderTexture2D.flipyuv;
					this._texture.bitmap = this._texture;
				}
				return this._texture;
			}
		}
		
		//使用webgl渲染器
		public static function enable():Boolean {
			return true;
		}
		
		public static function inner_enable():Boolean {
			Float32Array.prototype.slice || (Float32Array.prototype.slice = _float32ArraySlice);
			Uint16Array.prototype.slice || (Uint16Array.prototype.slice = _uint16ArraySlice);
			Uint8Array.prototype.slice || (Uint8Array.prototype.slice = _uint8ArraySlice);
				
			if (Render.isConchApp){
				_nativeRender_enable();
			}
			return true;
		}
		
		public static function onStageResize(width:Number, height:Number):void {
			if (mainContext == null) return;
			mainContext.viewport(0, 0, width, height);
			RenderState2D.width = width;
			RenderState2D.height = height;
		}
	}
}

