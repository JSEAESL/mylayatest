package laya.webgl.submit {
	import laya.resource.Context;
	public interface ISubmit {
		function renderSubmit():int;
		function getRenderType():int;
		function releaseRender():void;
		function reUse(context:Context, pos:int):int;
	}
}