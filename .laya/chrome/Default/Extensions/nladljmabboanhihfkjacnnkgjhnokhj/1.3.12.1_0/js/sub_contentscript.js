"use strict";

var getHostNxame = function (url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        return match[2];
    }
    else {
        return null;
    }
}

if(window.location.hostname == "partnerads.ysm.yahoo.com") {
    var results;
    var urls = {};
    if (document.getElementsByClassName('ypaAdUnit')[0] !== undefined) {
        results = document.getElementsByClassName('ypaAdUnit')[0].getElementsByTagName('li');
        

        for(var i=0; i < results.length; i++) {
            if (results[i].children[0].children[0].href !== undefined) {
                var domain = getHostNxame(results[i].children[0].children[0].href);
                urls[i] = domain;
            }
            
        }
        

        chrome.runtime.sendMessage({
            contents: "contentUrls",
            urls: urls
        }, function(response) {
            
            for (var key in response.urls.validUrls) {
                var icon = document.createElement('img');
                icon.setAttribute("src", 'https://ext.adaware.com/ps/images/icon_check.png');
                icon.setAttribute('style', 'float: left; margin-right: 5px');
                // icon.setAttribute('onmouseover', 
                // 'javascript:var hoverSafe = document.createElement("img");hoverSafe.setAttribute("src", "https://ext.adaware.com/ps/images/SAFE.png");hoverSafe.setAttribute("style", "float:left; margin-right: 50px;");hoverSafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverSafe,this.parentElement.firstChild);');
                // icon.setAttribute('onmouseout', 
                // 'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
                icon.classList.add('defined');
                results[key].insertBefore(icon, results[key].firstChild);
            }
            for (var key in response.urls.unvalidUrls) {
                var icon = document.createElement('img');
                icon.setAttribute("src", 'http://ext.adaware.com/ps/images/icon_close.png');
                icon.setAttribute('style', 'float: left; margin-right: 5px');
                // icon.setAttribute('onmouseover', 
                // 'javascript:var hoverUnsafe = document.createElement("img");hoverUnsafe.setAttribute("src", "https://ext.adaware.com/ps/images/UNSAFE.png");hoverUnsafe.setAttribute("style", "float:left; margin-right: 50px;");hoverUnsafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverUnsafe,this.parentElement.firstChild);');
                // icon.setAttribute('onmouseout', 
                // 'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
                icon.classList.add('defined');
                results[key].insertBefore(icon, results[key].firstChild);
            }
            var children = document.getElementsByClassName('defined');
            for(var i = 0; i < children.length; i++) {
                children[i].parentElement.setAttribute('style', 'overflow:visible');
            }
        });
    }
    
}