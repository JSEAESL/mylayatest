if (!TLck('attachToID')){
    TLbx['attachToID']='thinksuggest'; /* If no elementID specified for TS to attach to, we are supposed to generate our own input field. it will carry the name thinksuggest. */
    TLvarchk('serpUrl','https://www.google.de/search?q={q}');
    TLvarchk('placeholder','Search Google or type a URL');
    TLvarchk('positionY','315px');
}


TLvarchk('serpUrl','https://www.google.com/search?q={q}%20(please%20specify%20serpUrl%20in%20thinksuggest-config)');


TLvarchk('ColorSuggTxt','#0d40c9');
TLvarchk('ColorSuggLnk','#006621');


TLvarchk('ul',navigator.language.substr(0, 2).toLowerCase() || navigator.userLanguage.substr(0, 2).toLowerCase());
TLvarchk('uc',navigator.language.substr(-2).toLowerCase() || navigator.userLanguage.substr(-2).toLowerCase());


TLvarchk('ProcessURLtypeIns',1); /* 0 = off, no URLs are rendered, 1= on, all URLs are directly accessible, 2= only affilate URLs are made directly accessible */
TLvarchk('ResultsMaxHeight',300);
TLvarchk('cap',0); /* cap of domain-suggestion-lines (0=default, where default is 10 in the api)*/
TLvarchk('capPerDomain',1); /* cap of suggestions per domain */
TLvarchk('maxElements',40); /* overall suggestion limit (any type) */
TLvarchk('subid','');
TLvarchk('mo',30);

TLbx['userInputLatest']='';


TLbx['LastMouseMovementTime']=0;
TLbx['localCache'] = [];
TLbx['prefetched']= [];
TLbx['callCount'] = 0;

TLbx['ResultsPaddingTop']=0;
TLbx['waitdelay']=1;
TLbx['arrowKeyPosition']=1;
TLbx['Last_arrowKeyPosition']=-123;

TLbx['callbackFunctionNr']=1;
TLbx['elements']=[];
TLbx['DivIDtoElementSlotNr']=[];


TLbx['querystart-time']=[];


TLbx['lastRendered_txt']='';
TLbx['lastRendered_sr']='';
TLbx['lastRendered_userQuery']='';

ExistingTLDs = 'AC,AD,AE,AERO,AF,AG,AI,AL,AM,AN,AO,AQ,AR,ARPA,AS,ASIA,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BIZ,BJ,BM,BN,BO,BR,BS,BT,BV,BW,BY,BZ,CA,CAT,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,COM,COOP,CR,CU,CV,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EDU,EE,EG,ER,ES,ET,EU,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GOV,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,INFO,INT,IO,IQ,IR,IS,IT,JE,JM,JO,JOBS,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MG,MH,MIL,MK,ML,MM,MN,MO,MOBI,MP,MQ,MR,MS,MT,MU,MUSEUM,MV,MW,MX,MY,MZ,NA,NAME,NC,NE,NET,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,ORG,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PRO,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,ST,SU,SV,SY,SZ,TC,TD,TEL,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TP,TR,TRAVEL,TT,TV,TW,TZ,UA,UG,UK,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,XXX,YE,YT,ZA,ZM,ZW';


//var dyn_functions={};
var TLbxRefreshCalls=0;
function TLbx_refresh(event) {
    TLbxRefreshCalls++;
    /* if call count is 1, then its the VERY first call. which will NOT trigger any visible stuff, because we only want to pre-load (upon init) any potential input-value-content that might be in the input-box already */


    if (event){var char = event.which || event.keyCode;}else{var char=0;}

    //
    if (char==40 || char==38 || char==13 || typeof(char)=='undefined'){
        //
        return;
    }

    if (TLbxGetInpValue() == TLbx['userInputLatest'] && TLbxRefreshCalls>2) {
        //
        return;
    }
    TLbx['userInputLatest'] = TLbxGetInpValue();

    /* Analyse the input to find out whether it's a typed URL */
    UserInputIsDomain=TLbx_directDomainJump(TLbxGetInpValue());


    if (TLbx['userInputLatest']==''){
        /* empty input field does not need requests */
        TLbx_update(currentTimestampMS(),'', '','');
    }else {


        /* immediately update list-view so that the currently typed exact user input (which is shown on position 1) gets updated */
        TLbx_update(currentTimestampMS(),'', 'uselastrendered',TLbx['userInputLatest']);

        /* request new suggestions */
        TLbx['querystart-time'].push({time:currentTimestampMS(),query:TLbx['userInputLatest'],status:'waiting'});

        var sr = 'https://api.bing.com/osjson.aspx?JsonType=callback&JsonCallback=TLbxResponseHandler&query=' + encodeURIComponent(TLbx['userInputLatest']) + '&mkt=' + TLbx['ul'].toLowerCase() + '-' + TLbx['uc'].toUpperCase() + '&_=' + Date.now();
        var script = document.createElement('script');
        script.src = sr;
        TLinsertDom('head',script);



    }
    TLacsResize();


}


function TLbxDecodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function TLbxGetInpValue(){return TLbxLeftTrim(TLbxGetInp().value);}

TLbx['tlQueriesRunning']=0;
function TLbxResponseHandler(o){
    /* this controller handles the responses from the pure text suggestion API.
    It makes sure that generally only one response at a time is processed by thinksuggest - unless the response we got matches the very-last user-query.
    As a result, if responses come unordered, un-relevant/outdated ones will be skipped. (user types a-m-a-z-o-n and we get responses for a, amaz, am, ama, amazon.
     */


    var receivedQuery=o[0];
    for (var t in TLbx['querystart-time']){
        if (TLbx['querystart-time'][t]['query']==receivedQuery){





            //
            if (TLbx['tlQueriesRunning']<1){
                //  
                TLbxF1(o);
            }else if (TLbx['tlQueriesRunning']>=0 && receivedQuery==TLbx['userInputLatest']){
                //       
                TLbxF1(o);
            }

            /* We made a decision for the element. now we can remove it from the list */
            TLbx['querystart-time'].splice(t,1);
            break;
        }
    }

}













function TLvarchk(v,f){
    /* checks a variable and falls back to a default value if variable is empty */
    if (!TLck(v)){
        //
        //
        TLbx[v]=f;
    }
}

function TLck(a){
    /* checks whether a TLbx[] variable is Set. (not empty or "null") */
    if (typeof(TLbx[a])=='undefined' || TLbx[a].length==0){return false;}else{return true;}
}

function TLbxD(id) {
    return document.getElementById(id);
}


function TLbxLeftTrim(word){
    return word.replace(/^\s+/,"");
}



function TLbxF1(o) {




    var t=o[1].length;if (t>10){t=10;}

    var ps = '';


    if (TLbx['ProcessURLtypeIns']!=0){
        /* If user-input is a valid url, we add the Domain of that URL as suggestion-string, so that we can also link the Homepage of that URL, AND we find out whether it is an affiliate-URL. */
        if (UserInputIsDomain['isurl']){
            ps+='%0A'+encodeURIComponent(UserInputIsDomain['domain']);
        }

    }



    for (var i = 0; i < t; i++) {ps = ps + '%0A' + encodeURIComponent(o[1][i]);}



    var sr = 'https://api.thinksuggest.org/?m=s&q=' + encodeURIComponent(o[0]) + '&ul=' + TLbx['ul'] + '&uc=' + TLbx['uc'] + '&pid=' + TLbx['partner'] + '&mo=' + TLbx['mo'] + '&cap=' + TLbx['cap'] + '&ps=' + ps+'&subid='+TLbx['subid'];

    if (TLbx['localCache'][sr] == null) {

        var xhttp = new XMLHttpRequest();
        xhttp._url=sr;
        xhttp._requestTimestamp=currentTimestampMS();
        xhttp._query=o[0];

        TLbx['tlQueriesRunning']++;
        xhttp.onreadystatechange = function () {if (this.readyState == 4 && this.status == 200) {     TLbx['tlQueriesRunning']--;TLbx_update(this._requestTimestamp,this._url, this.responseText,this._query);  }  };
        xhttp.open("GET", sr, true);
        xhttp.send();
        TLbx['callCount']++;
        /**/
    } else {
        /**/
        TLbx_update(currentTimestampMS(),sr, TLbx['localCache'][sr], o[0]);
    }
}






function TLbxBoldTerm(str){
    /* wraps html-b around current search term, if found in string. PER user-query's WORD (str gets space-separated) */

    var s=TLbxGetInpValue().split(' ').concat(TLbxGetInpValue().replace(/\./g,' ').split(' ')); /* we want to compose space-separated highlighting, but "amazon.com" should be listed as "amazon" and "amazon.com" in highlighting, with preference to the full string. so we join two different splits for the comparison array */
    //

    for (var k in s){
        if (s[k].length>2 && s[k]!='b'){
            /* - replacing "b" when tags are <b> would cause some unhappy replacements, so we don't do highlighting if the query is only "b". won't happen often anyway
            *  - we won't replace TLDs, so we only replace stuff longer than 2 chars. that should exclude most TLDs + we don't want to exclude TLD-words like ".areo" or ".online" etc., so should be good.*/
            str=str.replace(new RegExp(s[k], 'ig'), '<b>$&</b>');
        }
    }
    return str;

}

function TLremoveProto(url){
 var u=url.replace('https://','').replace('http://','').replace('www.','');
 if (u.substr(u.length-1,1)=='/'){u=u.substr(0,u.length-1);} /* remove last "/" if there is one */
return u;
}

function TLbxAddDomain(slot,url,element){



    TLbx['elements'][slot]={
        type:'url',
        context:url,
        html:'<li id="[???]" onMouseOver="window.parent.TLbx_updateUnderlay(\'[???]\');" onMouseOut="window.parent.TLbx_updateUnderlay(\'\');"><a class="TLbx_sr" href="' + element['u'] + '" onMouseDown="TLbxClk(\'[???]\',\'down\')" target="_blank" class="TLbx_sl">' +
            '<span class="TLbx_img"><img valign="middle" src="https://www.google.com/s2/favicons?domain=' + element['d'] + '"></span>' +
            '<span class="TLbx_a">'+ TLbxBoldTerm(TLbxDecodeHtml(element['l'])) + '</span>' +
            '<span class="TLbx_url">' + TLbxBoldTerm(TLremoveProto(element['u'])) + '</span></a>' +
            '</li>'
    };

    /* DNS-Prefetch all linked domains to improve clickout performance */
    TLdnsprefetch(element['u']);

}

function TLbxAddText(slot,prop,i){

    TLbx['elements'][slot]={
        type:'txt',
        context:prop,
        html: '<li id="[???]"  onMouseOver="window.parent.TLbx_updateUnderlay(\'[???]\');" onMouseOut="window.parent.TLbx_updateUnderlay(\'\');"><a href="'+buildSerpUrl(prop)+'"  ' +
            'onMouseDown="TLbxClk(\'[???]\',\'down\')" onMouseUp="TLbxClk(\'[???]\',\'up\')"> ' +
            '<span class="TLbx_img"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAMAAADW3miqAAAAb1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt6r1GAAAAJHRSTlMACPkF5Lo3t7Pt3ZCIbWldJB4TDAJ96NfPwKejm5iAd1FFQS2X4xZUAAAA4UlEQVQ4y9WS2W7DIBQFMcHYeLdjZ2/W+f9vbJGaGvXi9jWZJ440HMEF9eIM1/rS2j8Vm2o8ZlovKasPfjB2wUkBvS+ro/GLW1TyPYfer8Z2A66LnQeYnqEvIItIKRzm9NBg5d01ug/yCUohXWEf5jvshFT/2jmAE9IFqjAnoIXUwjHMHZjYBMwY5AZyJTDQBuPfQiOlCTbzDCpwkUdeGyge3z0VUEf/iQZ9ug9J12yBYlQxbo4Z/3hJzOqyp+LqkSVL2XLntMmbrzNn0pKsciB9PSvJgLP6v0s2ya5zot6bTydRGAFRvTDBAAAAAElFTkSuQmCC"></span>' +
            '<span class="autosuggestelement">' + prop.replace(TLbxGetInpValue(), TLbxGetInpValue() + '<b>') + '</b></span></a></li>'
    };
}


TLbx['latestProcessedTimestamp']=0;
var UserInputIsDomain={};
function TLbx_update(requestTimestamp,sr, txt,i) {



    /* In very rare cases, we might get an API repponse we started on Monday might come on Friday, and the one from Wednesday, which suits better to the user, might have been quick and come on Thursday. So we throw away the old stuff on Friday. */
    if (requestTimestamp<TLbx['latestProcessedTimestamp']){
        
        return;
    }




    if (txt=='uselastrendered'){
        /* sometimes we call this function and simply want to update the first line - in that case we reuse the last-rendered information of the auto-suggest, until we get something fresher */
        sr=TLbx['lastRendered_sr'];
        txt=TLbx['lastRendered_txt'];
    }else{
        /* normal response */
        TLbx['lastRendered_txt']=txt;
        TLbx['lastRendered_sr']=sr;
        TLbx['lastRendered_userQuery']=i;

        TLbx['localCache'][sr] = txt; /* cache it for the case it get's re-searched in this session */
        TLbx['latestProcessedTimestamp']=requestTimestamp; /* update the last-update-timestamp */

    }

    //


    /* ---- */


    var KnownAffiliateDomains=[];




    /* display new suggestions */
    var CapPerDomain=[];

    delete TLbx['elements'];
    var sd = '';
    var elementNr=10; /* incrementing numbers, will be used for arrow-key navigation.  normal suggestions start after 10, 2=domain suggestion, 5=exact user input web search */
    TLbx['elements']=[];




    /* add regular suggestions, if the server sent some: */
    if (txt.length > 20) {
        var oobj = JSON.parse(txt.replace(/~/g, TLbx['lastRendered_userQuery']));
        //    

        //  var s = '<ul id="TLbx_s">';

        for (var key in oobj) {

            if (!oobj.hasOwnProperty(key)) continue;

            var obj = oobj[key];


            /* Loop through the text/domain suggestions */
            for (var prop in obj) {
                if (elementNr>TLbx['maxElements']+9) break;
                if (!obj.hasOwnProperty(prop) || prop == '') continue;

                //
                /* Add Domain Suggestions */
                if (obj[prop]) {
                    var domains = oobj[key][prop];
                    for (var thedomain in domains) {
                        if (typeof(CapPerDomain[domains[thedomain]['d']]) == 'undefined') {                            CapPerDomain[domains[thedomain]['d']] = 0;                        }
                        //


                        if (domains[thedomain]['a']==1 && typeof(KnownAffiliateDomains[domains[thedomain]['d']])=='undefined'){
                            /* collect known affiliate domains (for Lookup by ProcessURLtypeIns=2 type, i.e. if partner only wants affiliate Domains to be displayed */
                            //
                            KnownAffiliateDomains[domains[thedomain]['d']]=domains[thedomain];
                        }


                        if (CapPerDomain[domains[thedomain]['d']] < TLbx['capPerDomain']) {
                            CapPerDomain[domains[thedomain]['d']]++;
                            var url = 'https://api.thinksuggest.org/?m=c&t=' + domains[thedomain]['t'] + '&h=' + domains[thedomain]['h'] + '&k=' + encodeURIComponent(prop) + '&q=' + encodeURIComponent(i) + '&pid=' + TLbx['partner'] + '&s=' + domains[thedomain]['s'] + '&subid=' + TLbx['subid'];

                            /* if domain-name EQUALS user-input-workingdomain than place it on a top slot in the sorted list */

                            if ( TLremoveProto(domains[thedomain]['u'].toLowerCase()) ==TLremoveProto(UserInputIsDomain['workingurl']).toLowerCase()   ) {

                                TLbxAddDomain(2, url, domains[thedomain]);
                            } else {
                                elementNr++;
                                TLbxAddDomain(elementNr, url, domains[thedomain]);

                            }
                        }
                    }
                }


                /* Add Text Suggestions (if it is the exact user input, do not add it, as it was by default added on the top already) */
                var propCompareString=TLbxDecodeHtml(prop.toLowerCase());
                if (propCompareString!= i.toLowerCase() && propCompareString != TLbx['lastRendered_userQuery'].toLowerCase() && propCompareString != TLbxGetInpValue().toLowerCase()) {  elementNr++; TLbxAddText(elementNr, prop, i);  }
            }
        }
    }




    /* if
    - the user-input was detected to be a domain/url  "isurl"
    - and - user-input-domains are allowed by partner for direct accessibility (ProcessURLtypeIns=1 or 2)
    - in case of ProcessURLtypeIns=2: Only add URL directly, if it is an affiliate URL, i.e. on the KnownAffiliateDomains-List
    - and the domain was not part of the server suggestions (taken care of later i guess)
    then
    - add this as top suggestion in order to allow a direct jump to that URL rather than kicking off a web search for it */


    //
    if (UserInputIsDomain['isurl'] && (TLbx['ProcessURLtypeIns']==1 || (typeof(KnownAffiliateDomains[UserInputIsDomain['domain']])!='undefined' && TLbx['ProcessURLtypeIns']==2) ) ){
      //
        var url = 'https://api.thinksuggest.org/?m=c&t=j&h=Jump&k=' +  encodeURIComponent(UserInputIsDomain['workingurl'])  + '&q=' + encodeURIComponent(i) + '&pid=' + TLbx['partner']+'&s=&subid='+TLbx['subid'];
        /* create a nice title for the URL. If the URL is an exact domain match without anything after the /, then we use the suggestion-title. Otherwise we use a reduced title as the shop-homepage-title might confuse a user who typed in a long link form that shop */
        if (UserInputIsDomain['workingurl'].substr(0,UserInputIsDomain['workingurl'].length-1).split("/").length <4 && typeof(KnownAffiliateDomains[UserInputIsDomain['domain']])!='undefined'){
            var title=KnownAffiliateDomains[UserInputIsDomain['domain']]['l'];
            //
        }else{
            var title=UserInputIsDomain['domain'].substr(0,UserInputIsDomain['domain'].indexOf('.'))+'';
            //
        }


        elementNr++;
        TLbxAddDomain(2,url,{u:UserInputIsDomain['workingurl'],d:UserInputIsDomain['domain'],l:title});


        // 
        /* we put this on slot 2, so that it appears on the top of the result list */
    }



    /* Always add exact user input as direct search above the regular suggestions */
    if (TLbxGetInpValue().length>0){TLbxAddText(5,TLbxGetInpValue(),TLbxGetInpValue());}






    /* Compose sorted HTML out of collected Elements */

    //
    var DivID=0;
    for(var el in TLbx['elements'] ){
        DivID++;
        var useID='TLelm'+DivID;
        sd+=TLbx['elements'][el]['html'].replace('[???]',useID).replace('[???]',useID).replace('[???]',useID).replace('[???]',useID);
        TLbx['DivIDtoElementSlotNr'][useID]=el;
    }

    TLbx['currentElementCount']=DivID;


    /* response only gets visibly displayed if it contains something AND if its not the Preload-Response from the initial init-triggered call of TS (which is made to pre-load any potential value that the input-field might contain already because TS might be integrated on a result page */

        if (sd.length > 0) {
            //sd = '<ul id="TLbx_sd"  onscroll="TLbx_acsScroll()">'+sd+'</ul>';
            /* echo suggestions visibly */

            TLbx['lastDomainlist'] = sd;
            TLbxD('TLbx_sd').innerHTML = sd;
            if (sd == '') {
                TLbxD('TLbx_sd').style.display = 'none';
            } else {
                TLbxD('TLbx_sd').style.maxHeight = TLbx['ResultsMaxHeight']+'px';
                TLbxD('TLbx_sd').style.paddingTop = TLbx['ResultsPaddingTop'];
                TLbxD('TLbx_sd').style.display = 'block';
                TLbx_acsScroll();
                /* update "there's more"-indicator-shadows to fit the new result */
            }
        }
        if ( sd.length>0){

            if (TLbxRefreshCalls<2 ) {
                
                //TLbxD('TLbx').style.display = 'block';
                TLbx_focusManager_HideIfNoBoxContentFocussed();
            }else {
                TLbxD('TLbx').style.display = 'block';
            }
            TLbx['lastCallHadResults'] = 1;
        } else {
                TLbx['lastCallHadResults'] = 0;
                TLbxD('TLbx').style.display = 'none';
        }

        /* upon new results (regardless of empty result or full result, but NOT if pre-load result) we always reset the cursor result selection to position 1 */
        TLbx['arrowKeyPosition'] = 1;
        TLbx_arrowkeyProcessor();


}
function TLbxClk(id,downup){
    //(
    //
    
    if (TLbx['elements'].length==0){return;} /* if there are no elements known, we cannot click on anything */

    if (TLbx['elements'][  TLbx['DivIDtoElementSlotNr'][id]   ]['type']=='txt') {
        if (downup=='enterkey') {
            /* selected value should no longer trigger a suggestion refresh directly:*/ //TLbxGetInpValue() = '' + TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['context'] + '';TLbx_refresh();
            window.document.location=buildSerpUrl(TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['context']);
            TLbxF(true);
        }else if (downup=='down') {
            /* selected value should no longer trigger a suggestion refresh directly:*/ //TLbxGetInpValue() = '' + TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['context'] + '';TLbx_refresh();
            /* mouseclick will simply click the a-href, which was already set properly upon generation of the suggestions. no need for a js redirect:*/      //window.document.location= buildSerpUrl(TLbxGetInpValue());

            TLbxF(true);
        }else if(downup=='up'){
            TLbxF(true);
        }
    }else if (TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['type']=='url'){
        if (downup=='down') {
            TLbxD(id).getElementsByTagName('a')[0].href=TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['context'];
            TLbxF(true);
        }else if(downup=='up'|| downup=='enterkey') {
            window.open(TLbx['elements'][TLbx['DivIDtoElementSlotNr'][id]]['context']);
            TLbxF(true);
        }
    }

}

function buildSerpUrl(q){
    return TLbx['serpUrl'].replace('{q}', encodeURIComponent(q));
}

function TLbx_updateUnderlay(elmID) {
    /* this function only gets called by OnMouseOver and OnMouseOut events, as stated in the list-entry-html of the result list */

    if (elmID==''){return;}

    /* Set Arroykey-Selection to the hover-selection
    *  BUT ONLY if the mouse really was moved in the last 1 seconds. Otherwise we ignore where the mouse is positioned, as the OnMouseOver-event was likely just fired because of the HTML-DOM Change and not due to user interaction.
    *  --> OnMouseOver and Out are only taken into consideration, if the mouse was actually moved lately. */

    //
    if (currentTimestampMS()-TLbx['LastMouseMovementTime']<1000){
        TLbx['arrowKeyPosition']=elmID.substr(5);
        //
        TLbx_arrowkeyProcessor();
        TLbxF(false);
    }


}

function TLbx_sht(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();
    return str.replace(/<[^>]*>/g, '');
}

function TLbx_submit(){
    //TLbxD('TLelm'+TLbx['arrowKeyPosition']).onmousedown);
    TLbxClk('TLelm'+TLbx['arrowKeyPosition'],'enterkey');
    TLbxF(true);
}

function TLbxGetInp(){
    /* Finds out which element inside the attachToID-Container is the input-field. Will be used to Focus() this field or to attach Eventhandlers */
    var e=TLbxD(TLbx['attachToID']);
    if (e.tagName=='INPUT') {
        return (e);  /* if the attachToID is an input-Tag already */
    }else{
        return (e.getElementsByTagName('input')[0]); /* the first INPUT field inside the input-container */
    }
}
function TLbxF(CursorToEnd){
if (!CursorToEnd) {
    TLbxGetInp().focus();
    setTimeout('TLbxGetInp().focus();', 50);
}else {
    setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);', 1);
    setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);', 10);
    setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);', 50);
}
    TLbx_focusManager('focus');
}


function TLbxinit() {

    if (TLbx['cssinserted']==null){
        /* insert css as fast as possible. dont wait for dom-load */
        TLbx['cssinserted']=1;
        var css=document.createElement('style');css.innerText='.TLbx_acs ul{list-style:none}.TLbx_acs *,#TLbx_sh *,#thinksuggest ul{box-sizing:border-box;margin:0;padding:0}.TLbx_acs,#thinksuggest{position:absolute;display:none}.TLbx_acs,#thinksuggest,.TLbx_acs *,#TLbx_inp{font-family:Roboto,sans-serif}#thinksuggest{width:580px;left:50%;margin-left:-270px;height:44px;vertical-align:top;border:none;border-radius:2px;box-shadow:0 2px 2px 0 rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.08);transition:box-shadow 200ms cubic-bezier(0.4,0.0,0.2,1);z-index:300;background:0 0}#thinksuggest:hover,#thinksuggest:focus{box-shadow:0 3px 8px 0 rgba(0,0,0,0.2),0 0 0 1px rgba(0,0,0,0.08)}.TLbx_sl{text-decoration:none;display:block}.TLbx_sr,.TLbx_sr *{overflow:hidden}.TLbx_sr,.TLbx_sr *,.TLbx_acs ul li{text-decoration:none;white-space:nowrap;text-overflow:ellipsis;color:#000}.TLbx_img img{width:16px;max-height:16px;margin:0;padding:0}.TLbx_img{display:inline-block;vertical-align:middle;margin:0 10px 0 0}.TLbx_a,.TLbx_url{vertical-align:middle;text-indent:0}.TLbx_a{max-width:54%;display:inline-block}.TLbx_url{font-size:90%;padding-right:10px}.TLbx_url:before{content:"-";padding:0 7px;color:#888}.TLbx.c :focus{outline:none}.TLbx_bs{right:-2px;position:relative;background:transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG0AAAAsCAYAAABv/DafAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+dpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1LjEgV2luZG93cyIgeG1wOkNyZWF0ZURhdGU9IjIwMTgtMDQtMTBUMTc6MDM6MjQrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE4LTA0LTEwVDE3OjA3OjI1KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE4LTA0LTEwVDE3OjA3OjI1KzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3RjFCRjI5OTNDQzgxMUU4OEU5QURGNEQ2M0MxNjE2RiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3RjFCRjI5QTNDQzgxMUU4OEU5QURGNEQ2M0MxNjE2RiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjdGMUJGMjk3M0NDODExRTg4RTlBREY0RDYzQzE2MTZGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjdGMUJGMjk4M0NDODExRTg4RTlBREY0RDYzQzE2MTZGIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+YBQABgAAA8lJREFUeNrsml1oHUUUx3/7cWO+bCq15RZJix8PibdI29Q0tYUUIU1RBD8erPqg1IAEow9SpfhQEERtBemLDyKCWI2lihZsStPWQm1IbYS2fkSvFmyISQw1SUNMTNt7d9ezdwJ5SeQ+3ZuJ5w+zM7vMPMz89pw5Z3adVFvUCOyTUo9qoatHyiu+XA5KSep6WKHYsA66Csw6JV1dA/uk0BSaSqGpFJpCUyk0Vf7yF03ysgw2p0LqVk+zYknExDWH3oEE36RL+P1yhsBNLBpoTqotimyewMqKLI9t82nZKm/gHH4jnlznTxEfdDj8MqCWVnTVJK/z+rM3ST377Ps/oG8UllXCxjsgISC3r3FouBP2tIecuugqtKK5w4qA13bOAvvkbMCBkx7jY5Ncz3r4nkNVRSlNDfBCMywtg31Pu7ROZfnukt27gpWvnRsFPL7dI7USAvF/e76EN9s9Bq7AZLaSDGVMB6UMT8CB4/DcezAyBaXC6sVHfCpLMgqt0Fqx3GNno2kf6gn44tR/97/wG+zvMO111bChJqHQCq0tKRDvRxDCh+IS89HhM9A/ZmKu5vWRQiu01q+eytW9QzD+1z95jzv+Y5ir6+8KccOMQiukli9xcnXfCNzIeHmPG75q+paVeIQW521WQvt72tS3Sljv+0He46rKTZ0NQnWPhVbvYEmuXrsKKm4uz3vc1loDKy1u1SFSaIVUV9rkWeXC7sFN+Y3ZKMFLqtpM98gFV5A5Cq2QunQ54GTatFubJDCpnb9vFEUkb4FdD5vJ9o9D9w92n4hYCS10PN6XvGv8GpIoSw72DDy6Ze6+m1MO7z4PtUlJEeT+ncNwZTRrNTSrD4yb6uCNpyQanAkE+8fg696AIYkSq8qgUfawu29zczldrKuSKXx+LuTMry7nf1ZoRdO9NdD2ENStmr9Pn8Dc/xWsqQ5pud/NhSAvfQwnvo1XQKEVRUslgFwn+1rz2oD62x0Svpvby9J/hhy56NEje9jQSJYN9/h81GrGZCSQ3P0pHOuWkMR1FFrRJyXuMprrwENmuq0B9j4BiZmcfFd7DM4ui1uUvxtE851QCZhOcYm7D80+emuHgNwUR5kKbeFaoYA71gUvt5vPOvHX7refhAfuE3CBHXPw+R/KEVBHu00KsHeH+bodg4uBnjgn+12glrZgLa5TLO7Vz8z95A0YnTTWp5a2kMFJMHL0tHlzRybg7Hlp+wrNCnAdXTNux5LV0J9VLZRCU2gqhaZSaApNpdBUCm3RQxvUZbBKgzG0FinDuhZWKObU8q8AAwCpbwyCCdXUtgAAAABJRU5ErkJggg==) no-repeat 0 0;width:109px;height:44px;background-color:transparent;opacity:.8;transition:opacity .15s ease-in-out;z-index:350}.TLbx_bs:hover{opacity:1}.TLbx_sh{width:578px;position:relative;background-color:#fff;z-index:310}#thinksuggest .TLbx_acw{float:left;position:relative;cursor:default}#TLbxUdl{position:absolute;top:0;left:0;width:100%;height:100%;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;text-align:left}.TLbx_acs{display:none;position:absolute;width:100%;z-index:999;background:#fff;padding:0;top:0;left:0;transition:box-shadow 1s ease}.TLbx_acs ul{list-style-type:none}.TLbx_acs ul li{text-indent:8px;padding:0 10px 0 0;cursor:default}.TLbx_acs ul li,.TLbx_url,.TLbx_url b{color:#1a73e8}.autosuggestelement{color:#000}#TLbx_sd{overflow-x:hidden;overflow-y:auto}#TLbx_f{z-index:300}#TLbx_inp{height:44px;background-color:transparent;margin:0;display:inline;border:none;width:469px;padding:0 13px;font-size:18px;color:#222;-webkit-outline:none;position:relative;z-index:320}#TLbx_inp:focus{outline-width:0}.notarrowkeyselected{background:transparent}.notarrowkeyselected:hover{background-color:rgba(0,0,0,0.07)}.arrowkeyselected{background:rgba(0,0,0,0.05)}.arrowkeyselected:hover{background:rgba(0,0,0,0.12)}#TLbx_sd li a{display:block;width:100%;font-size:14px;text-decoration:none}.autosuggestelement,.TLbx_sr{line-height:33px}';
        //var css=document.createElement('link'); css.rel='stylesheet';css.type='text/css';css.href='https://www.thinksuggest.org/simple/suggest.css';

        /* add custom css based on configuration (colors etc) */
        css.innerText+='.TLbx_a,.TLbx_a b{color:'+TLbx['ColorSuggTxt']+'}' +
            '.TLbx_url,.TLbx_url b{color:'+TLbx['ColorSuggLnk']+'}' +
            '.arrowkeyselected .TLbx_a{text-decoration:underline;}';

        TLinsertDom('head',css);
    }

    if (document.getElementsByTagName('body')[0]==null) {
        
        setTimeout('TLbxinit()',0);
    } else {
        


        if (TLbx['attachToID']=='thinksuggest'){
            /* No elementID has been specified where Thinksuggest could attach to underneath. So we generate our own input field */

            var divinp= document.createElement('div');
            divinp.style.top=TLbx['positionY'];
            divinp.style.display='block';
            divinp.id=TLbx['attachToID'];
            divinp.innerHTML='<form id="TLbx_f"  method="get">\n' +
                '<div class="TLbx_sh">\n' +
                '<div id="TLbx_acw-0" class="TLbx_acw"><input type="text" id="TLbx_inp"  value="" autocomplete="off"  placeholder="'+TLbx['placeholder']+'"></div>\n' +
                '<input type="image" class="TLbx_bs" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjEgNjQuMTQwOTQ5LCAyMDEwLzEyLzA3LTEwOjU3OjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDUzUuMSBXaW5kb3dzIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxOC0wMi0wNlQxMjo1Mzo1MyswMjowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTgtMDItMDZUMTI6NTQ6MDgrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTgtMDItMDZUMTI6NTQ6MDgrMDI6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvZ2lmIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjBFNTA4RDdBMEIyQzExRTg4RDc5QzI0ODBGN0ExREZGIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjBFNTA4RDdCMEIyQzExRTg4RDc5QzI0ODBGN0ExREZGIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6MEU1MDhENzgwQjJDMTFFODhENzlDMjQ4MEY3QTFERkYiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6MEU1MDhENzkwQjJDMTFFODhENzlDMjQ4MEY3QTFERkYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQBAAAAACwAAAAAAQABAAACAkQBADs=">\n' +
                '</div>\n' +
                '</form>';
            TLinsertDom('body',divinp);

        }

        TLdnsprefetch('//api.thinksuggest.org');
        TLdnsprefetch('//lnk.thinksuggest.org');
        TLdnsprefetch('//api.bing.com');
        TLdnsprefetch('//www.google.com');

        TLfinishInit();

    }
}

function TLinsertDom(tag,obj){
    var bdy=document.getElementsByTagName(tag)[0];
    bdy.insertBefore(obj,bdy.firstChild);
}

function TLfinishInit(){
    if (TLbx['waitdelay']>1000){
        
        return;
    }else if(TLbxD(TLbx['attachToID'])==null){
        
        TLbx['waitdelay']=(1+TLbx['waitdelay']*1)*1.1;
        setTimeout('TLfinishInit()',TLbx['waitdelay']);
        return;
    }



    /* Create and Position the Autosuggest-Box underneath the Inputbox-Container */
    var acs='<ul id="TLbx_sd" onscroll="TLbx_acsScroll()">nothing</ul>';
    var divacs= document.createElement('div');
    divacs.id='TLbx';
    divacs.style.position='absolute';
    divacs.style.position='top:-999px';
    divacs.className='TLbx_acs';
    divacs.innerHTML=acs;
    TLinsertDom('body',divacs);

    TLbxGetInp().form.setAttribute('action','javascript:TLbx_submit();');


    TLacsResize();

    /* add listeners (and remove foreign ones) + focus the inpout box */
    TLinitializeEventListeners();
    TLbxF(true);


    //setTimeout('TLinitializeEventListeners();',999);

    
    TLbx_refresh(); /* once do the refresh to pre-load potential suggestion data, e.g. is TS was embedded on a SERP and not on a newtab */

}
function TLinitializeEventListeners(){

    /* removes all exstisting listeners and sets our own. this function is called twice: once immediately upon load and once 1 seconds later so that eventual foreign listeners that were loaded later do not interfere */

    /* Remove all existing event listeners from Input-Field */
    var el = TLbxGetInp(), elClone = el.cloneNode(true);
    el.parentNode.replaceChild(elClone, el);

    /* Add our own ones */

    TLbxGetInp().addEventListener('change',  TLbx_refresh);
    TLbxGetInp().addEventListener('textInput',  TLbx_refresh);
    TLbxGetInp().addEventListener('input',   TLbx_refresh);
    TLbxGetInp().addEventListener('keyup',   TLbx_refresh);


    TLbxGetInp().autocomplete='off';/* we dont want the browser-autocomplete */

    TLbxGetInp().addEventListener('blur',  function(e){TLbx_focusManager('blur')});
    TLbxGetInp().addEventListener('focus', function(e){TLbx_focusManager('focus')});

    /* in some partner cases there is a pre-filled input field on the search result page, which is cursor-focussed, but obviously TS should not be active. BUT: if the user then clicks the input-field actively, TS should appear. */
    TLbxGetInp().addEventListener('click', function(e){TLbx_refresh();TLbx_focusManager('focus')});



    TLbxGetInp().addEventListener('keydown',  TLbx_arrowkeyProcessor);
    window.addEventListener('resize' ,         function(e){TLacsResize();});
    window.addEventListener('scroll' ,         function(e){TLacsResize();});

    document.addEventListener('mousemove', TLmouseMoveTimekeeper);


}

function TLacsResize(event){
    //
    /* Position the Autosuggest List underneath the Inputbox */
    if (TLbxD('TLbx')==null){
        
        setTimeout('TLacsResize()',10);return;
    }else {

        TLbxD('TLbx').style.top = TLgetPosition(TLbxD(TLbx['attachToID'])).y + TLbxD(TLbx['attachToID']).offsetHeight + 'px';
        TLbxD('TLbx').style.left = TLgetPosition(TLbxD(TLbx['attachToID'])).x + 'px';
        TLbxD('TLbx').style.width = TLbxD(TLbx['attachToID']).offsetWidth + 'px';
        //

    }
}

function TLbx_focusManager_HideIfNoBoxContentFocussed(){
    /* gets called by TLbx_focusManager in order to hide the box. see explanation there */

    var ids=Array('','','','','','','','','');

    if (document.activeElement!=null) {
        ids[1] = document.activeElement.id;
        if (document.activeElement.parentElement != null) {
            ids[2] = document.activeElement.parentElement.id;
            if (document.activeElement.parentElement.parentElement != null) {
                ids[3] = document.activeElement.parentElement.parentElement.id;
                if (document.activeElement.parentElement.parentElement.parentElement != null) {
                    ids[4] = document.activeElement.parentElement.parentElement.parentElement.id;
                    if (document.activeElement.parentElement.parentElement.parentElement.parentElement != null) {
                        ids[5] = document.activeElement.parentElement.parentElement.parentElement.parentElement.id;
                        if (document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement != null) {
                            ids[6] = document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement.id;
                            if (document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement != null) {
                                ids[7] = document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id;
                                if (document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement != null) {
                                    ids[8] = document.activeElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id;
                                }}}}
                                }
            }
        }
    }

    //

    /* don't hide it, if one of the IDs we found is eighter a TLbx-ID or the AttachToID of the input-field */
    if (ids[1]==TLbx['attachToID'] || ids[2]==TLbx['attachToID'] || ids[3]==TLbx['attachToID'] || ids[4]==TLbx['attachToID'] || ids[5]==TLbx['attachToID'] || ids[6]==TLbx['attachToID'] || ids[7]==TLbx['attachToID'] || ids[8]==TLbx['attachToID']
        || ids[1].substr(0,2)=='TL'|| ids[2].substr(0,2)=='TL'   || ids[3].substr(0,2)=='TL'   || ids[4].substr(0,2)=='TL'   || ids[5].substr(0,2)=='TL'   || ids[6].substr(0,2)=='TL'   || ids[7].substr(0,2)=='TL'   || ids[8].substr(0,2)=='TL' ){
           //
    }else{
           //
        TLbxD('TLbx_sd').style.display='none';
    }


}

function TLbx_focusManager(job){
    /* if input-field looses focus (or user presses ESC), hide suggestion box - otherwise display it */
    if (TLbxD('TLbx_sd')==null){return;} /* exit, if no suggestion-div is present at all/yet*/

    if (job=='blur' || job=='esc'){
        /* there was a request to close the suggestion window, because the input-field lost it's focus.
           BUT: we will do that ONLY IF the new focussed element is something OUTSIDE the suggestion box.
                we do this in order to not close the box, if a box-element gets clicked */

        /* We need to do this check with some timeout. Otherwise always the Body is activeElement */
        setTimeout('TLbx_focusManager_HideIfNoBoxContentFocussed()',10);
    }else if (job=='focus'){

        TLbxD('TLbx_sd').style.display='block';
    }

}




function TLgetPosition(elem) {
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    var clientTop = docElem.clientTop;
    var clientLeft = docElem.clientLeft;


    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;


    return {
        y: Math.round(top),
        x: Math.round(left),
    }
}


function TLbx_arrowkeyProcessor(event){
    /* Change ArrowKey Element Highlight Number according to user input (key) and highlights it via css class */

    if (event){var char = event.which || event.keyCode;}else{var char=0;}
    //



    /* process pressed keys, if applicable */
    if (char==27) {
        /* unfocus input box upon ESC press */
        TLbxGetInp().blur();
        TLbx_focusManager('esc');
    }else if (char==13){
        
        TLbx_submit();

    }else if (char==40){
        TLbx['arrowKeyPosition']++;

    }else if (char==38){
        TLbx['arrowKeyPosition']--;


        /* if it was a keyup, the browser annoyingly puts the cursor at the beginning of the input field. we don't want that and put it to the end */
        setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);',1);
        setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);',10);
        setTimeout('TLbxGetInp().focus();TLbxGetInp().setSelectionRange(TLbxGetInp.length-1,TLbxGetInp.length-1);',50);
    }

    /* make sure available limits of elements are kept */
    if (TLbx['arrowKeyPosition']>TLbx['currentElementCount']){TLbx['arrowKeyPosition']=TLbx['currentElementCount'];}
    if (TLbx['arrowKeyPosition']<1){TLbx['arrowKeyPosition']=1;}


    /* if no elements there, leave */
    if (TLbx['currentElementCount']<1){return;} /* leave this funciton if no results are available */

    /* Update highlighted Element, if sth changed. Pos 1 will always be updated, as it might originate from a updated query */
    if (TLbx['arrowKeyPosition']!=TLbx['Last_arrowKeyPosition'] || TLbx['arrowKeyPosition']==1) {
        TLbx['Last_arrowKeyPosition'] = TLbx['arrowKeyPosition'];

        for (var i = 1; i <= TLbx['currentElementCount']; i++) {
//        
            /* if element exists (should do), we set it's proper classname */
            if (TLbxD('TLelm' + i)!=null) {

                if (i == TLbx['arrowKeyPosition']) {
                    TLbxD('TLelm' + i).className = 'arrowkeyselected';
                } else {
                    TLbxD('TLelm' + i).className = 'notarrowkeyselected';
                }
            }
        }
    }


    /* if it is a real arrow-key-selection, we mirror the selection to the input-field */
    if (char==40 || char==38){
        var SelElm=TLbx['elements'][ TLbx['DivIDtoElementSlotNr'][       'TLelm'+TLbx['arrowKeyPosition']  ]  ];
        if (SelElm!=undefined && SelElm['type']=='txt'){
            TLbxGetInp().value=SelElm['context'];
        }else{
            TLbxGetInp().value=TLbx['userInputLatest'];
        }

    }

}

function currentTimestampMS(){
    //var Date = new Date();
    return  Math.floor(Date.now());
}

function TLbx_directDomainJump(OriginalURL) {
    /* in this function we come to the conclusion whether
        - "TypingADomain" the user is about to type a URL
        - "isUrl" and whether it's typed complete enough to be clickable
        - "Domain" and what the Domain Name is (useful for retrieving it's favicon) */
  

        var Url = OriginalURL.toLowerCase();
        var Urlmerkmale = new Array('www.', 'http://', 'https://');
        var TypingADomain = false;
        for (merkmal in Urlmerkmale) {
            if (Url.indexOf(Urlmerkmale[merkmal]) != -1) {
                TypingADomain = true;
                Url = Url.replace(Urlmerkmale[merkmal], '');
            }
        }

        var Domain = Url;
        if (Domain.indexOf('/') > 0) {
            Domain = Domain.substr(0, Url.indexOf('/'));
        }

        if (Domain.indexOf(' ') == -1 && Domain.indexOf('/') == -1 /* kein leerschlag enthalten oder ein / in der Domain (geht nur wenn vorne keine DOmain steht) */
            && Domain.lastIndexOf('.') > 0 && Domain.lastIndexOf('.') < Domain.length - 2 /*punkt nicht vorhanden (-1), zu frÃ¼h (<1) oder zu spÃ¤t (>ende-3)*/
            && ExistingTLDs.split(',').indexOf(Domain.substr(Domain.lastIndexOf('.') + 1).toUpperCase()) > 0 /* TLD existiert */) {
            isUrl = true;
        } else {
            var isUrl = false;
        }

        /* End of Input-Analysis */

        if (isUrl) {
            var workingurl = OriginalURL;
            if (workingurl.indexOf('//') == -1) {
                workingurl = 'http://' + workingurl;
            }
        } else {
            var workingurl = '';
        }


        //
        return ({typingadomain: TypingADomain, isurl: isUrl, domain: Domain, workingurl: workingurl});
   
}

function TLbx_acsScroll(){
    /* Add dropshadows on top/bottom of scrollable list for more beauty and to make users aware theres more to discover */
    var state=(        Math.round(100*            (TLbxD('TLbx_sd').scrollTop/                (TLbxD('TLbx_sd').scrollHeight-TLbx['ResultsPaddingTop']-TLbx['ResultsMaxHeight'])            )        )    );
    var shadows=new Array();

    /* add the default outside shadows for the box */
    shadows.push('0 3px 8px 0 rgba(0,0,0,0.2)');
    shadows.push('0 0 0 1px rgba(0,0,0,0.08)');

    /* maybe add the scroll-state-dependent inside shadows: */
    if (state>10){shadows.push('inset 0  20px 20px -20px #ccc');  }else{shadows.push('inset 0  20px 20px -20px #fff'); /*top*/ }
    if (state<90 && TLbxD('TLbx_sd').scrollHeight>TLbx['ResultsPaddingTop']+TLbx['ResultsMaxHeight']){shadows.push('inset 0 -20px 20px -20px #ddd'); /*bottom*/  }

    // 
    TLbxD('TLbx').style.boxShadow=shadows.join(',');

}

function TLdnsprefetch(originalurl){
    /* transform Link to Maindomain only */

    /* we will get links like https://google.com/bla/bla - and we need to cut the path to generate a proper href for the dns-prefetch. So let's count "/"s and decide. Two // are allowed as they're for the protocol. */
    if ((originalurl.match(/\//g) || []).length<=2){
        var prefetchDomain=originalurl;
    }else{
        var prefetchDomain= originalurl.substr(0,originalurl.length-(originalurl.split('/').slice(3)).join('/').length-1);
    }

    /* if the domain is prefetched already, we will exit */
    if (typeof(TLbx['prefetched'][prefetchDomain])=='undefined'){
        TLbx['prefetched'][prefetchDomain]=true;
        var lnk= document.createElement('link'); lnk.rel='dns-prefetch'; lnk.href = prefetchDomain;  TLinsertDom('head',lnk);
        var pre= document.createElement('link'); pre.rel='preconnect';   pre.href = prefetchDomain;  TLinsertDom('head',pre);
        
    }
}

function TLbx_reset(){
    /*
    empties the input-field in order to hide all suggestion elements. used by partner sxxl
     */
    TLbxGetInp().value='';
    TLbx_refresh();
}

function TLmouseMoveTimekeeper(e){
    //
    TLbx['LastMouseMovementTime']=currentTimestampMS();
}



TLbxinit();

//setTimeout('TLbxD(\'TLbx_inp\').value=\'Hdmi \';TLbx_refresh();',500);