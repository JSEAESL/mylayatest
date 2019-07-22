"use strict";


(function () {
    

    var getHostNxame = function (url) {
        var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
            return match[2];
        }
        else {
            return null;
        }
    }

    document.addEventListener("DOMContentLoaded", function(event) {
        
        chrome.storage.sync.get({'searchVisit': false}, function(result) {
            if(!result.searchVisit) {
                chrome.storage.sync.set({'searchVisit':true}, function(result) {
                    
                });
                // Comment out for now as Product Owner want to stop this popup 
                // var keepChangeBack = document.createElement('div');
                // keepChangeBack.setAttribute('id', 'keepChangeBack');
                // var keepChange = document.createElement('img');
                // keepChange.setAttribute('class', 'keepChange');
                // keepChange.setAttribute('src', chrome.extension.getURL('img/keepChange.png'));
                // document.getElementsByTagName('body')[0].insertBefore(keepChange, document.getElementsByTagName('body')[0].firstChild);
                // document.getElementsByTagName('body')[0].insertBefore(keepChangeBack, document.getElementsByTagName('body')[0].firstChild);
                // keepChangeBack.style.height = document.getElementsByTagName('html')[0].offsetHeight + 'px';
                // setTimeout(function () {
                //     keepChangeBack.style.opacity = 0;
                //     keepChange.style.opacity = 0;
                //     keepChangeBack.style.zIndex = -8;
                //     keepChange.style.zIndex = -9;
                // }, 5000);
            }
        });
        if(window.location.hostname == "lavasoft.gosearchresults.com") {
            // Comment out this part of code because it's not working for iframe issue
            // Look at sub_contentscript.js
            var iframe = document.getElementById('ypaAdWrapper-ALGO_MIDDLE-iframe');
            if (iframe) {
            //     iframe.onload = function (ev) {
            //         
                    
            //         var xhr = new XMLHttpRequest();
            //         xhr.open("GET", ev.target.src, true);
            //         xhr.onreadystatechange = function() {
            //             if (xhr.readyState == 4) {
            //                 // WARNING! Might be evaluating an evil script!
            //                 var resp = xhr.responseText;
            //                 //
            //                 document.getElementById("ypaAdWrapper-ALGO_MIDDLE").innerHTML = resp;
            //                 var urls = {};
            //                 var results;
            //                 results = document.getElementsByClassName('ypaAdUnit')[0].getElementsByTagName('li');
            //                 
        
            //                 for(var i=0; i < results.length; i++) {
            //                     var domain = getHostNxame(results[i].children[0].children[0].href);
            //                     urls[i] = domain;
            //                 }
        
            //                 
            //                 chrome.runtime.sendMessage({
            //                     contents: "contentUrls",
            //                     urls: urls
            //                 }, function(response) {
            //                     
            //                     for (var key in response.urls.validUrls) {
            //                         var icon = document.createElement('img');
            //                         icon.setAttribute("src", 'https://ext.adaware.com/ps/images/icon_check.png');
            //                         icon.setAttribute('style', 'float: left; margin-left:-20px');
            //                         icon.setAttribute('onmouseover', 
            //                         'javascript:var hoverSafe = document.createElement("img");hoverSafe.setAttribute("src", "https://ext.adaware.com/ps/images/SAFE.png");hoverSafe.setAttribute("style", "float:left; margin-left: -75px;");hoverSafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverSafe,this.parentElement.firstChild);');
            //                         icon.setAttribute('onmouseout', 
            //                         'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
            //                         icon.classList.add('defined');
            //                         results[key].insertBefore(icon, results[key].firstChild);
            //                     }
            //                     for (var key in response.urls.unvalidUrls) {
            //                         var icon = document.createElement('img');
            //                         icon.setAttribute("src", 'http://ext.adaware.com/ps/images/icon_close.png');
            //                         icon.setAttribute('style', 'float: left; margin-left:-20px');
            //                         icon.setAttribute('onmouseover', 
            //                         'javascript:var hoverUnsafe = document.createElement("img");hoverUnsafe.setAttribute("src", "https://ext.adaware.com/ps/images/UNSAFE.png");hoverUnsafe.setAttribute("style", "float:left; margin-left: -75px;");hoverUnsafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverUnsafe,this.parentElement.firstChild);');
            //                         icon.setAttribute('onmouseout', 
            //                         'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
            //                         icon.classList.add('defined');
            //                         results[key].insertBefore(icon, results[key].firstChild);
            //                     }
            //                     var children = document.getElementsByClassName('defined');
            //                     for(var i = 0; i < children.length; i++) {
            //                         children[i].parentElement.setAttribute('style', 'overflow:visible');
            //                     }
            //                 });
            //             }
            //         }
            //         xhr.send();
            //     }
            } else {
                var urls = {};
                var sponsored = document.getElementsByClassName('listing-result')[0].classList.contains('sponsored-container');
                var results;
                if(sponsored) {
                    results = document.getElementsByClassName('listing-result')[1].getElementsByTagName('li');
                } else {
                    results = document.getElementsByClassName('listing-result')[0].getElementsByTagName('li');
                }
                
                for(var i=0; i < results.length; i++) {
                    var domain = getHostNxame(results[i].children[0].children[0].href);
                    urls[i] = domain;
                }

                

                chrome.runtime.sendMessage({
                    contents: "contentUrls",
                    urls: urls
                }, function(response) {
                    
                    if(sponsored) {
                        document.getElementsByClassName('listing-result')[1].setAttribute('style', 'overflow:initial');
                    } else {
                        document.getElementsByClassName('listing-result')[0].setAttribute('style', 'overflow:initial');
                    }
                    for (var key in response.urls.validUrls) {
                        var icon = document.createElement('img');
                        icon.setAttribute("src", 'https://ext.adaware.com/ps/images/icon_check.png');
                        icon.setAttribute('style', 'float: left; margin-left:-20px');
                        icon.setAttribute('onmouseover', 
                        'javascript:var hoverSafe = document.createElement("img");hoverSafe.setAttribute("src", "https://ext.adaware.com/ps/images/SAFE.png");hoverSafe.setAttribute("style", "float:left; margin-left: -75px;");hoverSafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverSafe,this.parentElement.firstChild);');
                        icon.setAttribute('onmouseout', 
                        'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
                        icon.classList.add('defined');
                        results[key].insertBefore(icon, results[key].firstChild);
                    }
                    for (var key in response.urls.unvalidUrls) {
                        var icon = document.createElement('img');
                        icon.setAttribute("src", 'http://ext.adaware.com/ps/images/icon_close.png');
                        icon.setAttribute('style', 'float: left; margin-left:-20px');
                        icon.setAttribute('onmouseover', 
                        'javascript:var hoverUnsafe = document.createElement("img");hoverUnsafe.setAttribute("src", "https://ext.adaware.com/ps/images/UNSAFE.png");hoverUnsafe.setAttribute("style", "float:left; margin-left: -75px;");hoverUnsafe.classList.add("hoverImg");this.parentElement.insertBefore(hoverUnsafe,this.parentElement.firstChild);');
                        icon.setAttribute('onmouseout', 
                        'javascript:this.parentElement.getElementsByClassName("hoverImg")[0].remove();');
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
    });
})();