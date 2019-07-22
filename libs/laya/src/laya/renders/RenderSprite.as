package laya.renders {
	import laya.Const;
	import laya.display.Graphics;
	import laya.display.Sprite;
	import laya.display.SpriteConst;
	import laya.display.Stage;
	import laya.display.css.CacheStyle;
	import laya.display.css.SpriteStyle;
	import laya.display.css.TextStyle;
	import laya.filters.Filter;
	import laya.maths.Matrix;
	import laya.maths.Point;
	import laya.maths.Rectangle;
	import laya.renders.LayaGLQuickRunner;
	import laya.resource.Context;
	import laya.resource.HTMLCanvas;
	import laya.resource.Texture;
	import laya.utils.Browser;
	import laya.utils.Pool;
	import laya.utils.RunDriver;
	import laya.utils.Stat;
	import laya.webgl.WebGL;
	import laya.webgl.WebGLContext;
	import laya.webgl.canvas.BlendMode;
	import laya.resource.RenderTexture2D;
	import laya.resource.WebGLRTMgr;
	import laya.webgl.shader.d2.ShaderDefines2D;
	import laya.webgl.shader.d2.value.Value2D;
	import laya.webgl.submit.SubmitCMD;
	
	/**
	 * @private
	 * 精灵渲染器
	 */
	public class RenderSprite {
		/** @private */
		//public static const IMAGE:int = 0x01;
		/** @private */
		//public static const ALPHA:int = 0x02;
		/** @private */
		//public static const TRANSFORM:int = 0x04;
		/** @private */
		//public static const BLEND:int = 0x08;
		/** @private */
		//public static const CANVAS:int = 0x10;
		/** @private */
		//public static const FILTERS:int = 0x20;
		/** @private */
		//public static const MASK:int = 0x40;
		/** @private */
		//public static const CLIP:int = 0x80;
		/** @private */
		//public static const STYLE:int = 0x100;
		/** @private */
		//public static const GRAPHICS:int = 0x200;
		/** @private */
		//public static const CUSTOM:int = 0x400;
		/** @private */
		//public static const CHILDS:int = 0x800;
		/** @private */
		public static const INIT:int = 0x11111;
		/** @private */
		public static var renders:Array = [];
		/** @private */
		protected static var NORENDER:RenderSprite = /*[STATIC SAFE]*/ new RenderSprite(0, null);
		/** @private */
		public var _next:RenderSprite;
		/** @private */
		public var _fun:Function;
		
		public static function __init__():void {
			LayaGLQuickRunner.__init__();
			var i:int, len:int;
			var initRender:RenderSprite;
			initRender = new RenderSprite(INIT, null);
			len = renders.length = SpriteConst.CHILDS * 2;
			for (i = 0; i < len; i++)
				renders[i] = initRender;
			
			renders[0] = new RenderSprite(0, null);
			
			function _initSame(value:Array, o:RenderSprite):void {
				var n:int = 0;
				for (var i:int = 0; i < value.length; i++) {
					n |= value[i];
					renders[n] = o;
				}
			}
		
			//_initSame([SpriteConst.IMAGE, SpriteConst.GRAPHICS, SpriteConst.TRANSFORM, SpriteConst.ALPHA], RunDriver.createRenderSprite(SpriteConst.IMAGE, null));
			//
			//renders[SpriteConst.IMAGE | SpriteConst.GRAPHICS] = RunDriver.createRenderSprite(SpriteConst.IMAGE | SpriteConst.GRAPHICS, null);
			//
			//renders[SpriteConst.IMAGE | SpriteConst.TRANSFORM | SpriteConst.GRAPHICS] = RunDriver.createRenderSprite(SpriteConst.IMAGE | SpriteConst.TRANSFORM | SpriteConst.GRAPHICS, null);
		}
		
		private static function _initRenderFun(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var type:int = sprite._renderType;
			var r:RenderSprite = renders[type] = _getTypeRender(type);
			r._fun(sprite, context, x, y);
		}
		
		private static function _getTypeRender(type:int):RenderSprite {
			if (LayaGLQuickRunner.map[type]) return new RenderSprite(type, null);
			var rst:RenderSprite = null;
			var tType:int = SpriteConst.CHILDS;
			while (tType > 0) {
				if (tType & type)
					rst = new RenderSprite(tType, rst);
				tType = tType >> 1;
			}
			return rst;
		}
		

		
		public function RenderSprite(type:int, next:RenderSprite) {
			
			if (LayaGLQuickRunner.map[type]) {
				_fun = LayaGLQuickRunner.map[type];
				_next = NORENDER;
				return;
			}
			_next = next || NORENDER;
			switch (type) {
			case 0: 
				_fun = this._no;
				return;
			//case SpriteConst.IMAGE: 
			//_fun = this._image;
			//return;
			case SpriteConst.ALPHA: 
				_fun = this._alpha;
				return;
			case SpriteConst.TRANSFORM: 
				_fun = this._transform;
				return;
			case SpriteConst.BLEND: 
				_fun = this._blend;
				return;
			case SpriteConst.CANVAS: 
				_fun = this._canvas;
				return;
			case SpriteConst.MASK: 
				_fun = this._mask;
				return;
			case SpriteConst.CLIP: 
				_fun = this._clip;
				return;
			case SpriteConst.STYLE: 
				_fun = this._style;
				return;
			case SpriteConst.GRAPHICS: 
				_fun = this._graphics;
				return;
			case SpriteConst.CHILDS: 
				_fun = this._children;
				return;
			case SpriteConst.CUSTOM: 
				_fun = this._custom;
				return;
			case SpriteConst.TEXTURE: 
				_fun = this._texture;
				return;
			//case SpriteConst.IMAGE | SpriteConst.GRAPHICS: 
			//_fun = this._image2;
			//return;
			//case SpriteConst.IMAGE | SpriteConst.TRANSFORM | SpriteConst.GRAPHICS: 
			//_fun = this._image2;
			//return;
			case SpriteConst.FILTERS: 
				_fun = Filter._filter;
				return;
			case INIT: 
				_fun = _initRenderFun;
				return;
			}
			
			onCreate(type);
		}
		
		protected function onCreate(type:int):void {
		
		}
		
		public function _style(sprite:Sprite, context:Context, x:Number, y:Number):void {
			//现在只有Text会走这里，Html已经不走这里了
			var style:TextStyle = sprite._style as TextStyle;
			if (style.render != null) style.render(sprite, context, x, y);
			var next:RenderSprite = this._next;
			next._fun.call(next, sprite, context, x, y);
		}
		
		public function _no(sprite:Sprite, context:Context, x:Number, y:Number):void {
		}
		
		//TODO:coverage
		public function _custom(sprite:Sprite, context:Context, x:Number, y:Number):void {
			sprite.customRender(context, x, y);
			_next._fun.call(_next, sprite, context, x-sprite.pivotX, y-sprite.pivotY);
		}
		
		public function _clip(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var next:RenderSprite = this._next;
			if (next == NORENDER) return;
			var r:Rectangle = sprite._style.scrollRect;
			context.save();
			context.clipRect(x, y, r.width, r.height);
			next._fun.call(next, sprite, context, x - r.x, y - r.y);
			context.restore();
		}
		
		/*
		public function _mask(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var next:RenderSprite = this._next;
			next._fun.call(next, sprite, context, x, y);
			var mask:Sprite = sprite.mask;
			if (mask) {
				context.globalCompositeOperation = "destination-in";
				if (mask.numChildren > 0 || !mask.graphics._isOnlyOne()) {
					mask.cacheAs = "bitmap";
				}
				mask.render(context, x - sprite._style.pivotX, y - sprite._style.pivotY);
			}
			context.globalCompositeOperation = "source-over";
		}
		*/
		
		public function _texture(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var tex:Texture = sprite.texture;
			if(tex._getSource())
			context.drawTexture(tex, x-sprite.pivotX+tex.offsetX, y-sprite.pivotY+tex.offsetY, sprite._width || tex.width, sprite._height || tex.height);
			var next:RenderSprite = this._next;
			if(next!=NORENDER)
				next._fun.call(next, sprite, context, x, y);
		}
		
		public function _graphics(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var style:* = sprite._style;
			var g:Graphics = sprite._graphics;
			g && g._render(sprite, context, x-style.pivotX, y-style.pivotY);
			var next:RenderSprite = this._next;
			if(next!=NORENDER)
				next._fun.call(next, sprite, context, x, y);
		}
		
		//TODO:coverage
		public function _image(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var style:SpriteStyle = sprite._style;
			context.drawTexture2(x, y, style.pivotX, style.pivotY, sprite.transform, sprite._graphics._one);
		}
		
		//TODO:coverage
		public function _image2(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var style:SpriteStyle = sprite._style;
			context.drawTexture2(x, y, style.pivotX, style.pivotY, sprite.transform, sprite._graphics._one);
		}
		
		//TODO:coverage
		public function _alpha(sprite:Sprite, context:Context, x:Number, y:Number):void {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			var style:SpriteStyle = sprite._style;
			var alpha:Number;
			if ((alpha = style.alpha) > 0.01 || sprite._needRepaint()) {
				var temp:Number = context.globalAlpha;
				context.globalAlpha *= alpha;
				var next:RenderSprite = this._next;
				next._fun.call(next, sprite, context, x, y);
				context.globalAlpha = temp;
			}
		}
		
		public function _transform(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var transform:Matrix = sprite.transform, _next:RenderSprite = this._next;
			var style:SpriteStyle = sprite._style;
			if (transform && _next != NORENDER) {
				context.save();
				context.transform(transform.a, transform.b, transform.c, transform.d, transform.tx + x, transform.ty + y);
				_next._fun.call(_next, sprite, context, 0, 0);
				context.restore();
			} else {
				if(_next!=NORENDER)
					_next._fun.call(_next, sprite, context, x, y);
			}
		}
		
		public function _children(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var style:SpriteStyle = sprite._style;
			var childs:Array = sprite._children, n:int = childs.length, ele:*;
			x = x - sprite.pivotX;
			y = y - sprite.pivotY;
			var textLastRender:Boolean = sprite._getBit(Const.DRAWCALL_OPTIMIZE) && context.drawCallOptimize(true);
			if (style.viewport) {
				var rect:Rectangle = style.viewport;
				var left:Number = rect.x;
				var top:Number = rect.y;
				var right:Number = rect.right;
				var bottom:Number = rect.bottom;
				var _x:Number, _y:Number;
				
				for (i = 0; i < n; ++i) {
					if ((ele = childs[i] as Sprite)._visible && ((_x = ele._x) < right && (_x + ele.width) > left && (_y = ele._y) < bottom && (_y + ele.height) > top)) {
						ele.render(context, x, y);
					}
				}
			} else {
				for (var i:int = 0; i < n; ++i)
					(ele = (childs[i] as Sprite))._visible && ele.render(context, x, y);
			}
			textLastRender && context.drawCallOptimize(false);
		}
		
		public function _canvas(sprite:Sprite, context:Context, x:Number, y:Number):void {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			var _cacheStyle:CacheStyle = sprite._cacheStyle;
			var _next:RenderSprite = this._next;
			
			if (!_cacheStyle.enableCanvasRender) {
				_next._fun.call(_next, sprite, context, x, y);
				return;
			}
			_cacheStyle.cacheAs === 'bitmap' ? (Stat.canvasBitmap++) : (Stat.canvasNormal++);
			
			//检查保存的文字是否失效了
			var cacheNeedRebuild:Boolean = false;
			var textNeedRestore:Boolean = false;
			
			if (_cacheStyle.canvas) {
				// 检查文字是否被释放了，以及clip是否改变了，需要重新cache了
				var canv:* = _cacheStyle.canvas;
				var ctx:* = canv.context;
				var charRIs:Array =  canv.touches;
				if ( charRIs ) {
					for ( var ci:int = 0; ci < charRIs.length; ci++) {
						if ( charRIs[ci].deleted) {
							textNeedRestore = true;
							break;
						}
					}
				}
				cacheNeedRebuild =  canv.isCacheValid && !canv.isCacheValid();
			}
			
			if (sprite._needRepaint() || (!_cacheStyle.canvas) || textNeedRestore ||cacheNeedRebuild || Laya.stage.isGlobalRepaint()) {
				if (_cacheStyle.cacheAs === 'normal') {
					if( context._targets){// 如果有target说明父节点已经是一个cacheas bitmap了，就不再走cacheas normal的流程了
						_next._fun.call(_next, sprite, context, x, y);
						return;	//不再继续
					}else{
						_canvas_webgl_normal_repaint(sprite, context);
					}
				}else{
					_canvas_repaint(sprite, context, x,y);
				}
			} 
			var tRec:Rectangle = _cacheStyle.cacheRect;
			//Stage._dbgSprite.graphics.drawRect(x, y, 30,30, null, 'red');
			context.drawCanvas(_cacheStyle.canvas, x + tRec.x, y + tRec.y, tRec.width, tRec.height);
		}
		
		public function _canvas_repaint(sprite:Sprite, context:Context, x:int, y:int):void {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			var _cacheStyle:CacheStyle = sprite._cacheStyle;
			var _next:RenderSprite = this._next;
			var tx:Context;
			var canvas:HTMLCanvas=_cacheStyle.canvas;
			var left:Number;
			var top:Number;
			var tRec:Rectangle;
			var tCacheType:String = _cacheStyle.cacheAs;
			
			var w:Number, h:Number;
			var scaleX:Number, scaleY:Number;
			
			var scaleInfo:Point;
			scaleInfo = _cacheStyle._calculateCacheRect(sprite, tCacheType, x, y);
			scaleX = scaleInfo.x;
			scaleY = scaleInfo.y;
				
			//显示对象实际的绘图区域
			tRec = _cacheStyle.cacheRect;
			
			//计算cache画布的大小
			w = tRec.width * scaleX;
			h = tRec.height * scaleY;
			left = tRec.x;
			top = tRec.y;
			
			if ( tCacheType === 'bitmap' && (w > 2048 || h > 2048)) {
				console.warn("cache bitmap size larger than 2048,cache ignored");
				_cacheStyle.releaseContext();
				_next._fun.call(_next, sprite, context, x, y);
				return;
			}
			if (!canvas) {
				_cacheStyle.createContext();
				canvas = _cacheStyle.canvas;
			}
			tx = canvas.context;
			
			//WebGL用
			tx.sprite = sprite;
			
			(canvas.width != w || canvas.height != h) && canvas.size(w, h);//asbitmap需要合理的大小，所以size放到前面
			
			if (tCacheType === 'bitmap') tx.asBitmap = true;
			else if (tCacheType === 'normal') tx.asBitmap = false;
			
			//清理画布。之前记录的submit会被全部清掉
			tx.clear();
			
			//TODO:测试webgl下是否有缓存模糊
			if (scaleX != 1 || scaleY != 1) {
				var ctx:* = tx;
				ctx.save();
				ctx.scale(scaleX, scaleY);
				_next._fun.call(_next, sprite, tx, -left, -top);
				ctx.restore();
				sprite._applyFilters();
			} else {
				ctx = tx;
				_next._fun.call(_next, sprite, tx, -left, -top);
				sprite._applyFilters();
			}
			
			if (_cacheStyle.staticCache) _cacheStyle.reCache = false;
			Stat.canvasReCache++;
		}
		
		public function _canvas_webgl_normal_repaint(sprite:Sprite, context:Context):void {
			/*[DISABLE-ADD-VARIABLE-DEFAULT-VALUE]*/
			var _cacheStyle:CacheStyle = sprite._cacheStyle;
			var _next:RenderSprite = this._next;
			var canvas:HTMLCanvas=_cacheStyle.canvas;
			
			var tCacheType:String = _cacheStyle.cacheAs;
			var scaleInfo:Point = _cacheStyle._calculateCacheRect(sprite, tCacheType, 0, 0);
			
			if (!canvas) {
				canvas = _cacheStyle.canvas = __JS__('new Laya.WebGLCacheAsNormalCanvas(context, sprite)');
			}
			var tx:Context = canvas.context;
			
			
			canvas['startRec']();
			_next._fun.call(_next, sprite, tx, sprite.pivotX, sprite.pivotY);	// 由于后面的渲染会减去pivot，而cacheas normal并不希望这样，只希望创建一个原始的图像。所以在这里补偿。
			sprite._applyFilters();
			
			Stat.canvasReCache++;
			canvas['endRec']();
			
			//context.drawCanvas(canvas, x , y , 1, 1); // 这种情况下宽高没用
		}
		
		public function _blend(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var style:SpriteStyle = sprite._style;
			var next:RenderSprite = this._next;
			if (style.blendMode) {
				context.save();
				context.globalCompositeOperation = style.blendMode;
				next._fun.call(next, sprite, context, x, y);
				context.restore();
			} else {
				next._fun.call(next, sprite, context, x, y);
			}
		}
		
		/**
		 * mask的渲染。 sprite有mask属性的情况下，来渲染这个sprite
		 * @param	sprite
		 * @param	context
		 * @param	x
		 * @param	y
		 */
		public function _mask(sprite:Sprite, context:Context, x:Number, y:Number):void {
			var next:RenderSprite = this._next;
			var mask:Sprite = sprite.mask;
			var submitCMD:SubmitCMD;
			var ctx:Context = context as Context;
			if (mask) {
				ctx.save();
				var preBlendMode:String = ctx.globalCompositeOperation;
				var tRect:Rectangle = new Rectangle();
				//裁剪范围是根据mask来定的
				tRect.copyFrom(mask.getBounds());
				tRect.width = Math.round(tRect.width);
				tRect.height = Math.round(tRect.height);
				tRect.x = Math.round(tRect.x);
				tRect.y = Math.round(tRect.y);
				if (tRect.width > 0 && tRect.height > 0) {
					var w:Number = tRect.width;
					var h:Number = tRect.height;
					var tmpRT:RenderTexture2D = WebGLRTMgr.getRT(w,h);
					
					ctx.breakNextMerge();
					//先把mask画到tmpTarget上
					ctx.pushRT();
					ctx.addRenderObject(SubmitCMD.create([ctx,tmpRT,w,h ], tmpTarget,this));
					mask.render(ctx, -tRect.x, -tRect.y);
					ctx.breakNextMerge();
					ctx.popRT();
					//设置裁剪为mask的大小。要考虑pivot。有pivot的话，可能要从负的开始
					ctx.save();
					ctx.clipRect(x + tRect.x -sprite.getStyle().pivotX, y + tRect.y-sprite.getStyle().pivotY, w,h);
					//画出本节点的内容
					next._fun.call(next, sprite, ctx, x, y);
					ctx.restore();
					
					//设置混合模式
					preBlendMode = ctx.globalCompositeOperation;
					ctx.addRenderObject(SubmitCMD.create(["mask"],setBlendMode,this));
					
					var shaderValue:Value2D = Value2D.create(ShaderDefines2D.TEXTURE2D, 0);
					var uv:Array = Texture.INV_UV;
					//这个地方代码不要删除，为了解决在iphone6-plus上的诡异问题
					//renderTarget + StencilBuffer + renderTargetSize < 32 就会变得超级卡
					//所以增加的限制。王亚伟
					//  180725 本段限制代码已经删除，如果出了问题再找王亚伟
					
					ctx.drawTarget(tmpRT, x + tRect.x - sprite.getStyle().pivotX , y + tRect.y-sprite.getStyle().pivotY, w, h, Matrix.TEMP.identity(), shaderValue, uv, 6);
					ctx.addRenderObject(SubmitCMD.create([tmpRT], recycleTarget,this));
					
					//恢复混合模式
					ctx.addRenderObject(SubmitCMD.create([preBlendMode], setBlendMode,this));
				}
				ctx.restore();
			} else {
				next._fun.call(next, sprite, context, x, y);
			}
		
		}		
		
		public static var tempUV:Array = new Array(8);
		public static function tmpTarget(ctx:Context, rt:RenderTexture2D,w:int, h:int):void {
			rt.start();
			rt.clear(0, 0, 0, 0);
		}
		
		public static function recycleTarget(rt:RenderTexture2D):void {
			WebGLRTMgr.releaseRT(rt);
		}
		
		public static function setBlendMode(blendMode:String):void {
			var gl : WebGLContext = WebGL.mainContext;
			BlendMode.targetFns[BlendMode.TOINT[blendMode]](gl);
		}		
		
	}
}