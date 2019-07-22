package laya.d3.core.render {
	import laya.d3.component.PostProcess;
	import laya.d3.core.Camera;
	import laya.d3.core.render.command.CommandBuffer;
	import laya.d3.math.Color;
	import laya.d3.math.Vector4;
	import laya.d3.math.Viewport;
	import laya.d3.resource.RenderTexture;
	import laya.d3.shader.DefineDatas;
	import laya.d3.shader.Shader3D;
	import laya.d3.shader.ShaderData;
	import laya.d3.utils.Utils3D;
	import laya.resource.BaseTexture;
	import laya.resource.RenderTexture2D;
	import laya.resource.Texture2D;
	
	/**
	 * <code>BloomEffect</code> 类用于创建泛光效果。
	 */
	public class BloomEffect extends PostProcessEffect {
		/** @private */
		public static const SHADERVALUE_MAINTEX:int = Shader3D.propertyNameToID("u_MainTex");
		/**@private */
		public static const SHADERVALUE_AUTOEXPOSURETEX:int = Shader3D.propertyNameToID("u_AutoExposureTex");
		/**@private */
		public static const SHADERVALUE_SAMPLESCALE:int = Shader3D.propertyNameToID("u_SampleScale");
		/**@private */
		public static const SHADERVALUE_THRESHOLD:int = Shader3D.propertyNameToID("u_Threshold");
		/**@private */
		public static const SHADERVALUE_PARAMS:int = Shader3D.propertyNameToID("u_Params");
		/**@private */
		public static const SHADERVALUE_BLOOMTEX:int = Shader3D.propertyNameToID("u_BloomTex");
		
		/**@private */
		private static const SUBSHADER_PREFILTER13:int = 0;
		/**@private */
		private static const SUBSHADER_PREFILTER4:int = 1;
		/**@private */
		private static const SUBSHADER_DOWNSAMPLE13:int = 2;
		/**@private */
		private static const SUBSHADER_DOWNSAMPLE4:int = 3;
		/**@private */
		private static const SUBSHADER_UPSAMPLETENT:int = 4;
		/**@private */
		private static const SUBSHADER_UPSAMPLEBOX:int = 5;
		
		/**@private */
		private static const MAXPYRAMIDSIZE:int = 16; // Just to make sure we handle 64k screens... Future-proof!
		
		/**@private */
		private var _shader:Shader3D = null;
		/**@private */
		private var _shaderData:ShaderData = new ShaderData();
		/**@private */
		private var _linearColor:Color = new Color();
		
		/**@private */
		private var _shaderThreshold:Vector4 = new Vector4();
		/**@private */
		private var _shaderParams:Vector4 = new Vector4();
		/**@private */
		private var _pyramid:Array = null;
		/**@private */
		private var _intensity:Number = 0.0;
		/**@private */
		private var _threshold:Number = 1.0;
		/**@private */
		private var _softKnee:Number = 0.5;
		/**@private */
		private var _diffusion:Number = 7.0;
		/**@private */
		private var _anamorphicRatio:Number = 0.0;
		/**@private */
		private var _dirtIntensity:Number = 0.0;
		/**@private */
		private var _shaderSetting:Vector4 = new Vector4();
		/**@private */
		private var _dirtTileOffset:Vector4 = new Vector4();
		
		/**限制泛光像素的数量,该值在伽马空间。*/
		public var clamp:Number = 65472.0;
		/**泛光颜色。*/
		public var color:Color = new Color(1.0, 1.0, 1.0, 1.0);
		/**是否开启快速模式。该模式通过降低质量来提升性能。*/
		public var fastMode:Boolean = false;
		/**镜头污渍纹路,用于为泛光特效增加污渍灰尘效果*/
		public var dirtTexture:Texture2D = null;
		
		/**
		 * 获取泛光过滤器强度,最小值为0。
		 * @return 强度。
		 */
		public function get intensity():Number {
			return _intensity;
		}
		
		/**
		 * 设置泛光过滤器强度,最小值为0。
		 * @param value 强度。
		 */
		public function set intensity(value:Number):void {
			_intensity = Math.max(value, 0.0);
		}
		
		/**
		 * 设置泛光阈值,在该阈值亮度以下的像素会被过滤掉,该值在伽马空间。
		 * @return 阈值。
		 */
		public function get threshold():Number {
			return _threshold;
		}
		
		/**
		 * 获取泛光阈值,在该阈值亮度以下的像素会被过滤掉,该值在伽马空间。
		 * @param value 阈值。
		 */
		public function set threshold(value:Number):void {
			_threshold = Math.max(value, 0.0);
		}
		
		/**
		 * 获取软膝盖过渡强度,在阈值以下进行渐变过渡(0为完全硬过度,1为完全软过度)。
		 * @return 软膝盖值。
		 */
		public function get softKnee():Number {
			return _softKnee;
		}
		
		/**
		 * 设置软膝盖过渡强度,在阈值以下进行渐变过渡(0为完全硬过度,1为完全软过度)。
		 * @param value 软膝盖值。
		 */
		public function set softKnee(value:Number):void {
			_softKnee = Math.min(Math.max(value, 0.0), 1.0);
		}
		
		/**
		 * 获取扩散值,改变泛光的扩散范围,最好使用整数值保证效果,该值会改变内部的迭代次数,范围是1到10。
		 * @return 光晕的扩散范围。
		 */
		public function get diffusion():Number {
			return _diffusion;
		}
		
		/**
		 * 设置扩散值,改变泛光的扩散范围,最好使用整数值保证效果,该值会改变内部的迭代次数,范围是1到10。
		 * @param value 光晕的扩散范围。
		 */
		public function set diffusion(value:Number):void {
			_diffusion = Math.min(Math.max(value, 1), 10);
		}
		
		/**
		 * 获取形变比,通过扭曲泛光产生视觉上形变,负值为垂直扭曲,正值为水平扭曲。
		 * @return 形变比。
		 */
		public function get anamorphicRatio():Number {
			return _anamorphicRatio;
		}
		
		/**
		 * 设置形变比,通过扭曲泛光产生视觉上形变,负值为垂直扭曲,正值为水平扭曲。
		 * @param value 形变比。
		 */
		public function set anamorphicRatio(value:Number):void {
			_anamorphicRatio = Math.min(Math.max(value, -1.0), 1.0);
		}
		
		/**
		 * 获取污渍强度。
		 * @return 污渍强度。
		 */
		public function get dirtIntensity():Number {
			return _dirtIntensity;
		}
		
		/**
		 * 设置污渍强度。
		 * @param value 污渍强度。
		 */
		public function set dirtIntensity(value:Number):void {
			_dirtIntensity = Math.max(value, 0.0);
		}
		
		/**
		 * 创建一个 <code>BloomEffect</code> 实例。
		 */
		public function BloomEffect() {
			_shader = Shader3D.find("PostProcessBloom");
			_pyramid = new Array(MAXPYRAMIDSIZE * 2);
			//
			//for (var i:int = 0; i < MAXPYRAMIDSIZE; i++) {
			//var downIndex:int = i * 2;
			//var upIndex:int = downIndex + 1;
			//_pyramid[downIndex] = Shader3D.propertyNameToID("_BloomMipDown" + i);
			//_pyramid[upIndex] = Shader3D.propertyNameToID("_BloomMipUp" + i);
			//}
		}
		
		/**
		 * @inheritDoc
		 */
		override public function render(context:PostProcessRenderContext):void {
			var cmd:CommandBuffer = context.command;
			var viewport:Viewport = context.camera.viewport;
			
			//应用自动曝光调整纹理
			_shaderData.setTexture(SHADERVALUE_AUTOEXPOSURETEX, Texture2D.whiteTexture);
			
			//获取垂直扭曲和水平扭曲宽高
			var ratio:Number = _anamorphicRatio;
			var rw:Number = ratio < 0 ? -ratio : 0;
			var rh:Number = ratio > 0 ? ratio : 0;
			
			//半分辨率模糊,性效比较高
			var tw:int = Math.floor(viewport.width / (2 - rw));
			var th:int = Math.floor(viewport.height / (2 - rh));
			
			//计算迭代次数
			var s:int = Math.max(tw, th);
			var logs:Number;
			__JS__("logs = Math.log2(s) + this._diffusion - 10");
			var logsInt:int = Math.floor(logs);
			var iterations:int = Math.min(Math.max(logsInt, 1), MAXPYRAMIDSIZE);
			var sampleScale:Number = 0.5 + logs - logsInt;
			_shaderData.setNumber(SHADERVALUE_SAMPLESCALE, sampleScale);
			
			//预过滤参数
			var lthresh:Number = Utils3D.gammaToLinearSpace(threshold);
			var knee:Number = lthresh * _softKnee + 1e-5;
			_shaderThreshold.setValue(lthresh, lthresh - knee, knee * 2, 0.25 / knee);
			_shaderData.setVector(SHADERVALUE_THRESHOLD, _shaderThreshold);
			var lclamp:Number = Utils3D.gammaToLinearSpace(clamp);
			_shaderParams.setValue(lclamp, 0, 0, 0);
			_shaderData.setVector(SHADERVALUE_PARAMS, _shaderParams);
			
			var qualityOffset:int = fastMode ? 1 : 0;
			
			// Downsample
			var lastDownTexture:RenderTexture = context.source;
			for (var i:int = 0; i < iterations; i++) {
				var downIndex:int = i * 2;
				var upIndex:int = downIndex + 1;
				var subShader:int = i == 0 ? SUBSHADER_PREFILTER13 + qualityOffset : SUBSHADER_DOWNSAMPLE13 + qualityOffset;
				
				var mipDownTexture:RenderTexture = RenderTexture.getTemporary(tw, th, BaseTexture.FORMAT_R8G8B8, BaseTexture.FORMAT_DEPTHSTENCIL_NONE, BaseTexture.FILTERMODE_BILINEAR);
				var mipUpTexture:RenderTexture = RenderTexture.getTemporary(tw, th, BaseTexture.FORMAT_R8G8B8, BaseTexture.FORMAT_DEPTHSTENCIL_NONE, BaseTexture.FILTERMODE_BILINEAR);
				_pyramid[downIndex] = mipDownTexture;
				_pyramid[upIndex] = mipUpTexture;
				
				cmd.blit(lastDownTexture,mipDownTexture, _shader, _shaderData, subShader);
				
				lastDownTexture = mipDownTexture;
				tw = Math.max(tw / 2, 1);
				th = Math.max(th / 2, 1);
			}
			
			// Upsample
			var lastUpTexture:RenderTexture = _pyramid[2 * iterations - 3];
			for (i = iterations - 2; i >= 0; i--) {
				downIndex = i * 2;
				upIndex = downIndex + 1;
				mipDownTexture = _pyramid[downIndex];
				mipUpTexture = _pyramid[upIndex];
				cmd.setShaderDataTexture(_shaderData,SHADERVALUE_BLOOMTEX, mipDownTexture);//通过指令延迟设置
				cmd.blit(lastUpTexture,mipUpTexture, _shader, _shaderData, SUBSHADER_UPSAMPLETENT + qualityOffset);
				lastUpTexture = mipUpTexture;
			}
			
			var linearColor:Color = _linearColor;
			color.toLinear(linearColor);
			var intensity:Number = Math.pow(2, _intensity / 10.0) - 1.0;
			var shaderSettings:Vector4 = _shaderSetting;
			_shaderSetting.setValue(sampleScale, intensity, _dirtIntensity, iterations);
			
			//镜头污渍
			//需要保证污渍纹理不变型
			var dirtTexture:Texture2D = dirtTexture ? dirtTexture : Texture2D.blackTexture;
			
			var dirtRatio:Number = dirtTexture.width / dirtTexture.height;
			var screenRatio:Number = viewport.width / viewport.height;
			var dirtTileOffset:Vector4 = _dirtTileOffset;
			dirtTileOffset.setValue(1.0, 1.0, 0.0, 0.0);
			
			if (dirtRatio > screenRatio)
				dirtTileOffset.setValue(screenRatio / dirtRatio, 1.0, (1.0 - dirtTileOffset.x) * 0.5, 0.0);
			else if (dirtRatio < screenRatio)
				dirtTileOffset.setValue(1.0, dirtRatio / screenRatio, 0.0, (1.0 - dirtTileOffset.y) * 0.5);
			
			//合成Shader属性
			var compositeShaderData:ShaderData = context.compositeShaderData;
			var compositeDefineData:DefineDatas = context.compositeDefineData;//TODO:合并Define
			if (fastMode)
				compositeDefineData.add(PostProcess.SHADERDEFINE_BLOOM_LOW);
			else
				compositeDefineData.add(PostProcess.SHADERDEFINE_BLOOM);
			
			compositeShaderData.setVector(PostProcess.SHADERVALUE_BLOOM_DIRTTILEOFFSET, dirtTileOffset);
			compositeShaderData.setVector(PostProcess.SHADERVALUE_BLOOM_SETTINGS, shaderSettings);
			compositeShaderData.setVector(PostProcess.SHADERVALUE_BLOOM_COLOR, new Vector4(linearColor.r, linearColor.g, linearColor.b, linearColor.a));//TODO:需要Color支持
			compositeShaderData.setTexture(PostProcess.SHADERVALUE_BLOOM_DIRTTEX, dirtTexture);
			compositeShaderData.setTexture(PostProcess.SHADERVALUE_BLOOMTEX, lastUpTexture);
			
			//释放渲染纹理
			for (i = 0; i < iterations; i++) {//TODO:需要优化代码
				downIndex = i * 2;
				upIndex = downIndex + 1;
				if (_pyramid[downIndex] != lastUpTexture)
					RenderTexture.setReleaseTemporary(_pyramid[downIndex]);
				if (_pyramid[upIndex] != lastUpTexture)
					RenderTexture.setReleaseTemporary(_pyramid[upIndex]);
			}
			
			context.tempRenderTextures.push(lastUpTexture);//TODO:是否需要改机制
		}
	
	}

}