package script {
public class DataProxy {
        public function DataProxy() {
            initData();
        }

        private var _tatolCount:int = 21;

        private var _currrntIndex:int = 1;
        private static var _ins:DataProxy;

        private var SoundData:Array;
        private var SelectData:Array;
        private var DemoBtnListData:Array;

        public static function getIns():DataProxy{
            if(_ins == null) {
                _ins = new DataProxy();
            }
            return _ins;
        }

        public function initData():void{
            SoundData = [];
            for(var i = 1; i<_tatolCount; i++)
            {
                var count = Math.floor(Math.random() * 2) + 1;
                var data = [];
                for(var j  = 0; j<count ; j++ )
                {
                    var t = {
                        name:"音效"+i+" 第" + j +"个" ,
                        sounduUrl:"sound/cat"+j+".mp3"
                    };
                    data.push(t)
                }
                SoundData.push(data);
            }

            SelectData = [];
            for(var i = 1; i<_tatolCount; i++)
            {
                var count = Math.floor(Math.random() * 3) + 1;
                var data = [];
                for(var j  = 0; j<count ; j++ )
                {
                    var t = {
                        name:"选项"+i+" 第" + j +"个" ,
                        ImageUrl:i,
                        isRight:(j == 0)?true:false
                    };
                    data.push(t)
                }
                SelectData.push(data);
            }

            DemoBtnListData = [];
            for(var i = 1; i<_tatolCount; i++)
            {
                var data = {
                    name:"第"+i+"题",
                    dataIndex:i
                };
                DemoBtnListData.push(data);
            }
        }

        public function getDemoBtnListData():Array
        {

            return DemoBtnListData;

        }

        public function setQuestIndex(index:int):void
        {
            _currrntIndex = index;
        }

        public function nextQuest():void
        {
            if(_currrntIndex<19)
            {
                _currrntIndex++;
            }
        }

        public function getCurrentIndexData():int
        {
            return _currrntIndex;
        }

        public function getCurrentSoundData():Array
        {
           return SoundData[_currrntIndex];
        }

        public function getSelectListData():Array
        {
            return SelectData[_currrntIndex];
        }

	}
}
