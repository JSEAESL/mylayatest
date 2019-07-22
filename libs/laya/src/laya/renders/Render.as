package laya.renders {
	import laya.layagl.LayaGL;
	import laya.resource.Context;
	import laya.resource.HTMLCanvas;
	import laya.system.System;
	import laya.utils.Browser;
	import laya.utils.RunDriver;
	import laya.webgl.WebGL;
	import laya.webgl.WebGLContext;
	import laya.webgl.canvas.BlendMode;
	import laya.webgl.shader.d2.Shader2D;
	import laya.webgl.shader.d2.ShaderDefines2D;
	import laya.webgl.shader.d2.value.Value2D;
	import laya.webgl.submit.Submit;
	import laya.webgl.utils.Buffer2D;
	
	/**
	 * @private
	 * <code>Render</code> 是渲染管理类。它是一个单例，可以使用 Laya.render 访问。
	 */
	public class Render {
		/** @private */
		public static var _context:Context;
		/** @private 主画布。canvas和webgl渲染都用这个画布*/
		public static var _mainCanvas:HTMLCanvas;
		
		public static var supportWebGLPlusCulling:Boolean = false;
		public static var supportWebGLPlusAnimation:Boolean = false;
		public static var supportWebGLPlusRendering:Boolean = false;
		/**是否是加速器 只读*/
		public static var isConchApp:Boolean = false;
		{
			isConchApp = __JS__("(window.conch != null)");
			if (isConchApp)  {
				supportWebGLPlusCulling = true;
				supportWebGLPlusAnimation = true;
				supportWebGLPlusRendering = true;
			}
		}
		/** 表示是否是 3D 模式。*/
		public static var is3DMode:Boolean;
		
		/**
		 * 初始化引擎。
		 * @param	width 游戏窗口宽度。
		 * @param	height	游戏窗口高度。
		 */
		public function Render(width:Number, height:Number) {
			//创建主画布。改到Browser中了，因为为了runtime，主画布必须是第一个
			_mainCanvas.source.id = "layaCanvas";
			_mainCanvas.source.width = width;
			_mainCanvas.source.height = height;
			if (Render.isConchApp)
			{
				Browser.document.body.appendChild(_mainCanvas.source);
			}
			else
			{
				if(!Browser.onKGMiniGame)
				{
					Browser.container.appendChild(_mainCanvas.source);//xiaosong add
				}
			}
			initRender(_mainCanvas, width, height);
			Browser.window.requestAnimationFrame(loop);
			function loop(stamp:Number):void {
				Laya.stage._loop();
				Browser.window.requestAnimationFrame(loop);
			}
			Laya.stage.on("visibilitychange", this, _onVisibilitychange);
		}
		
		/**@private */
		private var _timeId:int = 0;
		
		/**@private */
		private function _onVisibilitychange():void {
			if (!Laya.stage.isVisibility) {
				_timeId = Browser.window.setInterval(this._enterFrame, 1000);
			} else if (_timeId != 0) {
				Browser.window.clearInterval(_timeId);
			}
		}
		
		public function initRender(canvas:HTMLCanvas, w:int, h:int):Boolean { 
				function getWebGLContext(canvas:*):WebGLContext {
					var gl:WebGLContext;
					var names:Array = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
					if (!Config.useWebGL2) {
						names.shift();
					}
					for (var i:int = 0; i < names.length; i++) {
						try {
							gl = canvas.getContext(names[i], {stencil: Config.isStencil, alpha: Config.isAlpha, antialias: Config.isAntialias, premultipliedAlpha: Config.premultipliedAlpha, preserveDrawingBuffer: Config.preserveDrawingBuffer});//antialias为true,premultipliedAlpha为false,IOS和部分安卓QQ浏览器有黑屏或者白屏底色BUG
						} catch (e:*) {
						}
						if (gl) {
							(names[i] === 'webgl2') && (WebGL._isWebGL2 = true);
							new LayaGL();
							return gl;
						}
					}
					return null;
				}
				var gl:WebGLContext = LayaGL.instance = WebGL.mainContext = getWebGLContext(Render._mainCanvas.source);
				if (!gl)
					return false;
				canvas.size(w, h);	//在ctx之后调用。
				WebGLContext.__init__(gl);
				Context.__init__();
				Submit.__init__();
				
				var ctx:Context = new Context();
				ctx.isMain = true;
				Render._context = ctx;
				canvas._setContext(ctx);
				
				WebGL.shaderHighPrecision = false;
				try {//某些浏览器中未实现此函数，使用try catch增强兼容性。
					var precisionFormat:* = gl.getShaderPrecisionFormat(WebGLContext.FRAGMENT_SHADER, WebGLContext.HIGH_FLOAT);
					precisionFormat.precision ? WebGL.shaderHighPrecision = true : WebGL.shaderHighPrecision = false;
				} catch (e:*) {
				}
				//TODO 现在有个问题是 gl.deleteTexture并没有走WebGLContex封装的
				LayaGL.instance = gl;
				System.__init__();
				ShaderDefines2D.__init__();
				Value2D.__init__();
				Shader2D.__init__();
				Buffer2D.__int__(gl);
				BlendMode._init_(gl);
				return true;
		}		
		
		/**@private */
		private function _enterFrame(e:* = null):void {
			Laya.stage._loop();
		}
		
		/** 目前使用的渲染器。*/
		public static function get context():Context {
			return _context;
		}
		
		/** 渲染使用的原生画布引用。 */
		public static function get canvas():* {
			return _mainCanvas.source;
		}
	}
}