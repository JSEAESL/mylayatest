package script.Quest {
import laya.events.Event;
import laya.media.SoundManager;
import laya.ui.Box;
import laya.ui.Button;
import laya.ui.Label;
import laya.ui.Radio;
import laya.utils.Handler;
import laya.utils.Timer;

import script.ConstScene;

import script.DataProxy;
import script.SceneManager;

import ui.quest.QusetSceneUI;

public class QuestCtrl extends QusetSceneUI{
    public function QuestCtrl() {
        super();
    }
    private var radioArr:Array;
    private var radioData:Array;

    override public function onEnable():void {
        refView();
        binEvent();
    }

    public function binEvent():void
    {
        nextBtn.on(Event.CLICK,this,onNextBtn);
        backBtn.on(Event.CLICK,this,onBackBtn);
    }

    private function onBackBtn(e):void
    {
        DataProxy.getIns().setQuestIndex(1);
        SceneManager.getIns().open(ConstScene.demoScene)
    }

    private function onNextBtn(e):void
    {
        DataProxy.getIns().nextQuest();
        refView();
    }

    private function refView():void{
        initSoundList();
        initSelectList();
        initBox();
    }

    private function initBox():void
    {
        timeLabel = timeBox.getChildByName("timeLabel") as Label;
        var startBtn = timeBox.getChildByName("startBtn");
        var reStartBtn = timeBox.getChildByName("reStartBtn");
        timeLabel.text = "00：00：00";

        startBtn.offAll(Event.CLICK);
        reStartBtn.offAll(Event.CLICK);

        startBtn.on(Event.CLICK,this,onStartBtn);
        reStartBtn.on(Event.CLICK,this,onReStartBtn);
    }

    private var time:int = 0;
    private var timeLabel:Label;
    private function reTimeLabel():void{
        timer.clear(this,timeAdd);
        timeLabel.text = "00：00：00";
        time = 0;
    }

    private function timeAdd():void{
        time++;
        var s:int =  parseInt(time%(60));
        var m:int =  parseInt(time/(60*60) );
        var h:int = parseInt(time/(60*60*60) );
        timeLabel.text = parseInt(h) +":"+  parseInt(m) +":"+ parseTime(s);
    }

    private function parseTime(time:int):String{
        if(time == 0)
        {
            return "00"
        }
        if(time<10)
        {
            return "0"+time;
        }
        return time +""
    }

    private function onStartBtn(e):void
    {
        reTimeLabel();
        timer.loop(1000,this,timeAdd);
    }

    private function onReStartBtn(e):void{
        reTimeLabel();
        timer.loop(1000,this,timeAdd);
    }


    private function initSoundList():void{
        var datas:Array = DataProxy.getIns().getCurrentSoundData();
        var xCount = 2;
        var yCount = datas.length/2 +1;
        soundList.repeatY = yCount;
        soundList.repeatX = xCount;
        soundList.array = datas;
        soundList.renderHandler = new Handler(this, this.onSoundRender);
    }

    private function onSoundRender(cell: Box, index:Number): void {
        if (index > soundList.array.length) {
            return;
        }
        var data:Object = soundList.array[index];
        var btn: Button = cell.getChildByName("btn") as Button;
        btn.label = data.name;

        btn.offAll(Event.CLICK);
        btn.on(Event.CLICK,this,onSoundClick,[soundList.array[index]]);
    }

    public function onSoundClick(e):void{
        SoundManager.playSound(e.sounduUrl,1);
    }

    private function initSelectList():void{
        var datas:Array = DataProxy.getIns().getSelectListData();
        var xCount = 2;
        var yCount = datas.length/2 +1;
        selectList.repeatY = yCount;
        selectList.repeatX = xCount;
        selectList.array = datas;

        radioArr = [];
        radioData = [];
        selectList.renderHandler = new Handler(this, this.onSelectListRender);
    }

    private function onSelectListRender(cell: Box, index:Number): void {
        if (index > selectList.array.length) {
            return;
        }
        var data:Object = selectList.array[index];
        var btn: Button = cell.getChildByName("btn") as Button;
        btn.label = data.name;
        var radio:Radio = cell.getChildByName("radio") as Radio;

        cell.offAll(Event.CLICK);
        cell.on(Event.CLICK,this,onSelectClick,[radio]);
        radioArr.push(radio);
        radioData.push(data);
    }

    public function onSelectClick(e):void{
        for each(var i in radioArr)
        {
           i.selected = false;
        }
        var index = radioArr.indexOf(e);
        var data = radioData[index];
        e.selected = true;
        if(data.isRight)
        {
            SoundManager.playSound("sound/hit.wav",1);
        }
    }

}
}
