package laya.d3.component {
	import laya.d3.core.Camera;
	import laya.d3.core.render.PostProcessEffect;
	import laya.d3.core.render.PostProcessRenderContext;
	import laya.d3.core.render.RenderContext3D;
	import laya.d3.core.render.command.BlitCMD;
	import laya.d3.core.render.command.CommandBuffer;
	import laya.d3.resource.RenderTexture;
	import laya.d3.shader.DefineDatas;
	import laya.d3.shader.Shader3D;
	import laya.d3.shader.ShaderData;
	import laya.d3.shader.ShaderDefines;
	import laya.resource.BaseTexture;
	
	/**
	 * <code>PostProcess</code> 类用于创建后期处理组件。
	 */
	public class PostProcess {
		/**@private */
		public static var SHADERDEFINE_BLOOM_LOW:int;
		/**@private */
		public static var SHADERDEFINE_BLOOM:int;
		/**@private */
		public static const SHADERVALUE_MAINTEX:int = Shader3D.propertyNameToID("u_MainTex");
		/**@private */
		public static const SHADERVALUE_BLOOMTEX:int = Shader3D.propertyNameToID("u_BloomTex");
		/**@private */
		public static const SHADERVALUE_AUTOEXPOSURETEX:int = Shader3D.propertyNameToID("u_AutoExposureTex");
		/**@private */
		public static const SHADERVALUE_BLOOM_DIRTTEX:int = Shader3D.propertyNameToID("u_Bloom_DirtTex");
		/**@private */
		public static const SHADERVALUE_BLOOMTEX_TEXELSIZE:int = Shader3D.propertyNameToID("u_BloomTex_TexelSize");
		/**@private */
		public static const SHADERVALUE_BLOOM_DIRTTILEOFFSET:int = Shader3D.propertyNameToID("u_Bloom_DirtTileOffset");
		/**@private */
		public static const SHADERVALUE_BLOOM_SETTINGS:int = Shader3D.propertyNameToID("u_Bloom_Settings");
		/**@private */
		public static const SHADERVALUE_BLOOM_COLOR:int = Shader3D.propertyNameToID("u_Bloom_Color");
		
		/**@private */
		public static var shaderDefines:ShaderDefines = new ShaderDefines();
		
		/**
		 * @private
		 */
		public static function __init__():void {
			SHADERDEFINE_BLOOM_LOW = shaderDefines.registerDefine("BLOOM_LOW");
			SHADERDEFINE_BLOOM = shaderDefines.registerDefine("BLOOM");
		}
		
		/**@private */
		private var _compositeShader:Shader3D = Shader3D.find("PostProcessComposite");
		/**@private */
		private var _compositeShaderData:ShaderData = new ShaderData();
		/**@private */
		private var _compositeDefineData:DefineDatas = new DefineDatas();
		/**@private */
		public var _context:PostProcessRenderContext = null;
		/**@private */
		private var _effects:Vector.<PostProcessEffect> = new Vector.<PostProcessEffect>();
		
		/**
		 * 创建一个 <code>PostProcess</code> 实例。
		 */
		public function PostProcess() {
			_context = new PostProcessRenderContext();
			_context.compositeShaderData = _compositeShaderData;
			_context.compositeDefineData = _compositeDefineData;
		}
		
		/**
		 *@private
		 */
		public function _init(camera:Camera, command:CommandBuffer):void {
			_context.camera = camera;
			_context.command = command;
		}
		
		/**
		 * @private
		 */
		public function _render():void {
			var screenTexture:RenderTexture = RenderTexture.getTemporary(RenderContext3D.clientWidth, RenderContext3D.clientHeight, BaseTexture.FORMAT_R8G8B8, BaseTexture.FORMAT_DEPTHSTENCIL_NONE);
			var cameraTarget:RenderTexture = _context.camera.getRenderTexture();
			_context.command.clear();
			_context.source = screenTexture;
			_context.destination = cameraTarget;
			
			
			//_context.command.blit(cameraTarget,screenTexture, CommandBuffer.screenShader, Camera._screenShaderData);//TODO:
			
			for (var i:int = 0, n:int = _effects.length; i < n; i++)
				_effects[i].render(_context);
				
				
				//uberSheet.EnableKeyword("FINALPASS");
                //dithering.Render(context);
                //ApplyFlip(context, uberSheet.properties);
				
				  //cmd.BlitFullscreenTriangle(context.source, context.destination, uberSheet, 0);
//
            //context.source = context.destination;
            //context.destination = finalDestination;
			
			//释放临时纹理
			RenderTexture.setReleaseTemporary(screenTexture);
			var tempRenderTextures:Vector.<RenderTexture> = _context.tempRenderTextures;
			for (i = 0, n = tempRenderTextures.length; i < n; i++)
				RenderTexture.setReleaseTemporary(tempRenderTextures[i]);
		}
		
		/**
		 * 添加后期处理效果。
		 */
		public function addEffect(effect:PostProcessEffect):void {
			_effects.push(effect);
		}
		
		/**
		 * 移除后期处理效果。
		 */
		public function removeEffect(effect:PostProcessEffect):void {
			var index:int = _effects.indexOf(effect);
			if (index !== -1)
				_effects.splice(index, 1);
		}
	
	}

}