package script.Quest {
import laya.events.Event;
import laya.events.MouseManager;
import laya.ui.Box;
import laya.ui.Button;
import laya.utils.Handler;

import script.ConstScene;
import script.DataProxy;
import script.SceneManager;

import ui.demo.DemoSceneUI;

public class MainCtrl extends DemoSceneUI {
		public function MainCtrl():void {
			super();
			MouseManager.multiTouchEnabled = false;
		}

		override public function onEnable():void {
	        initList()
		}

        private function initList():void {
            var datas:Array = DataProxy.getIns().getDemoBtnListData();
            var xCount = 3;
            var yCount = datas.length/3 +1;
            btnList.repeatY = yCount;
			btnList.repeatX = xCount;
            btnList.array = datas;
            btnList.renderHandler = new Handler(this, this.onListRender);
        }

        private function  onListRender(cell: Box, index:Number): void {
            if (index > btnList.array.length) {
                return;
            }
            var data:Object = btnList.array[index];
            var btn: Button = cell.getChildByName("btn") as Button;
            btn.label = data.name;
            btn.on(Event.CLICK,this,onBtnClick,[btnList.array[index]]);
        }

        private function onBtnClick(e):void{
            trace(this);
            DataProxy.getIns().setQuestIndex(e.dataIndex);
            SceneManager.getIns().open(ConstScene.qusetScene)
        }
	}
}