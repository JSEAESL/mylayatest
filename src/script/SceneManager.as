package script {
import laya.display.Scene;
import laya.utils.Handler;

public class SceneManager {
    public function SceneManager() {
    }

    private static var _ins:SceneManager;
    public static function getIns():SceneManager{
        if(_ins == null) {
            _ins = new SceneManager();
        }
        return _ins;
    }

    public function open(url:String, closeOther:Boolean = true, param:* = null, complete:Handler = null, progress:Handler = null) {
       url && Scene.open(url,closeOther,param,complete,progress);
    }
}
}
