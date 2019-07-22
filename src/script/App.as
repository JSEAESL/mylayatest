package script {

public class App {
    public function App() {
        init();
    }
    private static var _ins:App;
    public static function getIns():App{
        if(_ins == null) {
            _ins = new App();
        }
    }

    private function init():void{
        SceneManager.getIns().open(ConstScene.demoScene);
    }
}
}
