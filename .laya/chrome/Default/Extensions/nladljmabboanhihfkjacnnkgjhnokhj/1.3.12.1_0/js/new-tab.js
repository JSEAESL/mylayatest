(function () {

    'use strict';

    var toggleDropdown = function () {
        document.getElementById('searchBoxOptions').getElementsByTagName('ul')[0].classList.toggle('closed');
    };

    var toggleLanguageDropdown = function () {
        document.getElementById('languageOptions').getElementsByTagName('ul')[0].classList.toggle('closed');
    };

    var toggleThemeDropdown = function () {
        document.getElementById('themeOptions').getElementsByTagName('ul')[0].classList.toggle('closed');
    };

    var settingToggle = function () {
        document.getElementById('settingDetail').classList.toggle('closed');
    }

    var selectedOptionClicked = function () {
        
        toggleDropdown();
    };

    var languageOptionClicked = function () {
        
        toggleLanguageDropdown();
    };

    var themeOptionClicked = function () {
        
        toggleThemeDropdown();
    };

    var settingButtonClicked = function () {
        
        settingToggle();
    };

    var setCloseClicked = function () {
        
        if (document.getElementById('settingDetail').className.indexOf('closed') === -1) {
            settingToggle();
        }
    };
    var readTextFile = function (file, callback) {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                callback(rawFile.responseText);
            }
        }
        rawFile.send(null);
    }

    function checkGeoLocation() {
        
        return new Promise(function (resolve, reject) {
            function onResolved(geoResponse) {
                var parsedResponse = JSON.parse(geoResponse);
                var countryCode = parsedResponse.countryCode;
                resolve(countryCode);
            }
            function onRejected(geoResponse) {
                
                reject();
            }
            adawareUtils.httpGetAsync("http://ip-api.com/json", onResolved, onRejected, "application/json");
        });
    }

    var changeBackground = function (selectedSection) {
        var daySince = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
        var selectedImage = '';
        switch (selectedSection) {
            default:
                var animalPhotos = JSON.parse(localStorage.getItem('Animals'));
                if (animalPhotos != null) {
                    selectedImage = animalPhotos[daySince % (animalPhotos.length)];
                } else {
                    changeDefaultBackground('random');
                    return;
                }
                break;
            case 'nature':
                var naturePhotos = JSON.parse(localStorage.getItem('Nature'));
                if (naturePhotos != null) {
                    selectedImage = naturePhotos[daySince % (naturePhotos.length)];
                } else {
                    changeDefaultBackground('nature');
                    return;
                }
                break;
            case 'urban':
                var urbanPhotos = JSON.parse(localStorage.getItem('Urban'));
                if (urbanPhotos != null) {
                    selectedImage = urbanPhotos[daySince % (urbanPhotos.length)];
                } else {
                    changeDefaultBackground('urban');
                    return;
                }
                break;
            case 'abstract':
                var abstractPhotos = JSON.parse(localStorage.getItem('Abstract'));
                if (abstractPhotos != null) {
                    selectedImage = abstractPhotos[daySince % (abstractPhotos.length)];
                } else {
                    changeDefaultBackground('abstract');
                    return;
                }
                break;
            case 'food':
                var foodPhotos = JSON.parse(localStorage.getItem('Food'));
                if (foodPhotos != null) {
                    selectedImage = foodPhotos[daySince % (foodPhotos.length)];
                } else {
                    changeDefaultBackground('food');
                    return;
                }
                break;
        }
        var imageUrl = updateURLParameter(selectedImage.urls.regular, 'w', 2500);
        document.getElementById('authorNameLink').innerHTML = ' ' + selectedImage.user.name;
        document.getElementById('authorNameLink').href = selectedImage.user.links.html + '?utm_source=Secure Search Extension&utm_medium=referral';
        document.getElementById('backgroundImage').style.backgroundImage = 'url(' + imageUrl + ')';
    }

    var updateURLParameter = function (url, param, paramVal) {
        var TheAnchor = null;
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";

        if (additionalURL) {
            var tmpAnchor = additionalURL.split("#");
            var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
            if (TheAnchor)
                additionalURL = TheParams;

            tempArray = additionalURL.split("&");

            for (var i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != param) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }
        else {
            var tmpAnchor = baseURL.split("#");
            var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];

            if (TheParams)
                baseURL = TheParams;
        }

        if (TheAnchor)
            paramVal += "#" + TheAnchor;

        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }

    var localesAllJSON = function (selectedLanguage) {
        readTextFile("../_locales/" + selectedLanguage + "/messages.json", function (text) {
            var data = JSON.parse(text);
            var currentDate = new Date();
            var months = data.months.list;
            var days = data.days.list;
            document.getElementById('hourText').textContent = getTime12HoursFormat(currentDate);
            document.getElementById('dayText').textContent = days[currentDate.getDay()] + ',';
            document.getElementById('monthText').textContent = months[currentDate.getMonth()] + ' ';
            document.getElementById('dayNumberText').textContent = currentDate.getDate();
            document.getElementById('searchText').setAttribute('placeholder', data.searchPlaceholder.message);
            document.getElementById('settingText').innerHTML = data.settings.message;
            document.getElementById('themeOptions').getElementsByTagName('p')[0].innerHTML = data.themeMessage.message;
            document.querySelector('.themeOption').innerHTML = data[document.querySelector('.themeOption').id].message;
            document.getElementById('languageOptions').getElementsByTagName('p')[0].innerHTML = data.languageMessage.message;
            document.getElementById('searchBoxOptions').getElementsByTagName('p')[0].innerHTML = data.searchEngineMessage.message;
            document.getElementById('reference').innerHTML = data.photoMessage.message;
            document.getElementById('onD').innerHTML = data.onMessage.message;
            document.getElementById('privacy-policy').innerHTML = data.privacy.message;
            document.getElementById('terms-of-use').innerHTML = data.useTerm.message;
            for (var x = 0; x < document.querySelectorAll('.themeOptionsLabel').length; x++) {
                document.querySelectorAll('.themeOptionsLabel')[x].textContent = data[document.querySelectorAll('.themeOptionsLabel')[x].getAttribute('data-i18n')].message;
            }
        });
    }

    var setSettingSearchText = function () {
        var searchEngine = document.querySelector('.selectedOption').id;
        document.getElementsByName(searchEngine)[0].classList.add('checked');
        switch (searchEngine) {
            case 'bing':
                document.querySelector('.selectedOption').innerHTML = 'Bing&#8482;';
                break;
            case 'lavasoft':
                document.querySelector('.selectedOption').innerHTML = 'Adaware Secure Search';
                break;
            case 'yahoo':
                document.querySelector('.selectedOption').innerHTML = 'Yahoo!&#174;';
                break;
            case 'yandex':
                document.querySelector('.selectedOption').innerHTML = 'Яндекс (Yandex)';
                break;
            case 'google':
                document.querySelector('.selectedOption').innerHTML = 'Google&#174;';
                break;
            default:
                break;
        }
    }

    var setImageUrls = function () {
        var clientSecret = "6587d32abd99e2e2edd2b8b55f44b098952c976332c0d0e9369804d883bb9f04";
        var daySince = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
        var pageNumber = (daySince % 3) + 1;
        var urbanPhotos = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = "https://api.unsplash.com/collections/2027006/photos/?page=" + pageNumber + "&per_page=100";
            xhr.open('GET', url);
            xhr.setRequestHeader('Authorization', 'Client-ID ' + clientSecret);
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
        var naturePhotos = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = "https://api.unsplash.com/collections/2039511/photos/?page=" + pageNumber + "&per_page=100";
            xhr.open('GET', url);
            xhr.setRequestHeader('Authorization', 'Client-ID ' + clientSecret);
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
        var abstractPhotos = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = "https://api.unsplash.com/collections/2044069/photos/?page=" + pageNumber + "&per_page=100";
            xhr.open('GET', url);
            xhr.setRequestHeader('Authorization', 'Client-ID ' + clientSecret);
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

        var animalPhotos = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = "https://api.unsplash.com/collections/2310721/photos/?page=" + pageNumber + "&per_page=100";
            xhr.open('GET', url);
            xhr.setRequestHeader('Authorization', 'Client-ID ' + clientSecret);
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

        var foodPhotos = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url = "https://api.unsplash.com/collections/2486588/photos/?page=" + pageNumber + "&per_page=100";
            xhr.open('GET', url);
            xhr.setRequestHeader('Authorization', 'Client-ID ' + clientSecret);
            xhr.onload = () => resolve(xhr.response);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });

        return Promise.all([urbanPhotos, naturePhotos, abstractPhotos, animalPhotos, foodPhotos]).then(function (values) {
            localStorage.setItem('Food', values[4]);
            localStorage.setItem('Animals', values[3]);
            localStorage.setItem('Abstract', values[2]);
            localStorage.setItem('Nature', values[1]);
            localStorage.setItem('Urban', values[0]);
            localStorage.setItem('PageNumber', pageNumber);

            if (localStorage.getItem('Background') !== null) {
                changeBackground(localStorage.getItem('Background'));
            } else {
                changeBackground('random');
            }
        }).catch((e) => {
            changeDefaultBackground('random');
        });
    }
    var changeDefaultBackground = function () {
        var selectedImage = "random";
        if (localStorage.getItem('Background') !== null) {
            selectedImage = localStorage.getItem('Background');
        }
        switch (selectedImage) {
            default:
                document.getElementById('authorNameLink').innerHTML = "Sydney Rae";
                document.getElementById('backgroundImage').style.backgroundImage = 'url(img/animals_default.jpg)';
                document.getElementById('authorNameLink').href = "https://api.unsplash.com/@srz" + '?utm_source=Secure Search Extension&utm_medium=referral';
                break;
            case 'nature':
                document.getElementById('authorNameLink').innerHTML = "Ghost Presenter";
                document.getElementById('backgroundImage').style.backgroundImage = 'url(img/nature_default.jpg)';
                document.getElementById('authorNameLink').href = "https://api.unsplash.com/@ghostpresenter" + '?utm_source=Secure Search Extension&utm_medium=referral';
                break;
            case 'urban':
                document.getElementById('authorNameLink').innerHTML = "Osman Rana";
                document.getElementById('backgroundImage').style.backgroundImage = 'url(img/urban_default.jpg)';
                document.getElementById('authorNameLink').href = "https://api.unsplash.com/@osmanrana" + '?utm_source=Secure Search Extension&utm_medium=referral';
                break;
            case 'abstract':
                document.getElementById('authorNameLink').innerHTML = "Eberhard Grossgasteiger";
                document.getElementById('backgroundImage').style.backgroundImage = 'url(img/abstract_default.jpg)';
                document.getElementById('authorNameLink').href = "https://api.unsplash.com/@eberhardgross" + '?utm_source=Secure Search Extension&utm_medium=referral'
                break;
        }
    }

    var getTime12HoursFormat = function (currentDate) {
        var hour = currentDate.getHours();
        var minutes = currentDate.getMinutes();
        var result = hour;
        if (hour > 12) {
            hour = (hour - 12);
            if (hour < 10) {
                result = "0" + hour;
            }
        }
        else if (hour < 12) {
            result = ((hour < 10) ? "0" + hour : hour);
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        result = result + ":" + minutes;
        return result;
    }

    var addSuggestLinks = function(data) {
        var testLink = data;
        var divDom = document.createElement('div');
        var oneDom = document.createElement('span');
        var twoDom = document.createElement('a');
        var threeDom = document.createElement('img');
        var fourDom = document.createElement('span');
        divDom.classList.add("autocomplete-suggestion-link");
        divDom.classList.add("suggestion-link");
        twoDom.setAttribute("href", testLink.suggestionUrl);
        threeDom.setAttribute("src", "https://www.google.com/s2/favicons?domain="+testLink.d);
        threeDom.setAttribute("valign", "middle");
        fourDom.classList.add("linkSuggest");
        fourDom.innerText = testLink.u;
        oneDom.appendChild(threeDom);
        twoDom.appendChild(oneDom);
        divDom.appendChild(twoDom);
        divDom.appendChild(fourDom);
        twoDom.innerHTML = twoDom.innerHTML + testLink.l;
        document.getElementsByClassName('autocomplete-suggestions')[0].insertBefore(divDom, document.getElementsByClassName('autocomplete-suggestion')[0]);
    }

    // setup dropdown
    document.querySelector('.selectedOption').addEventListener('click', selectedOptionClicked);
    
    document.querySelector('.languageOption').addEventListener('click', languageOptionClicked);

    document.querySelector('.themeOption').addEventListener('click', themeOptionClicked);

    //setup setting options
    document.querySelector('#settingButton').addEventListener('click', settingButtonClicked);

    document.querySelector('#settingText').addEventListener('click', settingButtonClicked);

    document.querySelector('#backgroundBlack').addEventListener('click', setCloseClicked);

    document.querySelector('#backgroundImage').addEventListener('click', setCloseClicked);

    document.querySelector('#searchContainer').addEventListener('click', setCloseClicked);

    document.querySelector('#clock').addEventListener('click', setCloseClicked);

    var firstRun = localStorage.getItem('firstRun');
    if (firstRun == null) {
        localStorage.setItem('firstRun', false);
        localStorage.setItem('Background', 'animals');
        localStorage.setItem('search', 'bing');
        localStorage.setItem('Language', navigator.language.substr(0, 2));
        for (var x = 0; x < document.querySelectorAll('.themeOptionsLabel').length; x++) {
            if (document.querySelectorAll('.themeOptionsLabel')[x].getAttribute('value') == localStorage.getItem('Background')) {
                
                document.querySelectorAll('.themeOptionsLabel')[x].classList.add('checked');
                document.querySelector('.themeOption').setAttribute("id", document.querySelectorAll('.themeOptionsLabel')[x].getAttribute('id'));
                document.querySelector('.themeOption').innerHTML = document.querySelectorAll('.themeOptionsLabel')[x].innerHTML;
            }
        }
        for (var x = 0; x < document.querySelectorAll('.languageOptionsLabel').length; x++) {
            if (document.querySelectorAll('.languageOptionsLabel')[x].getAttribute('value') == localStorage.getItem('Language')) {
                document.querySelectorAll('.languageOptionsLabel')[x].classList.add('checked');
                document.querySelector('.languageOption').setAttribute("id", document.querySelectorAll('.languageOptionsLabel')[x].getAttribute('value'));
                document.querySelector('.languageOption').innerHTML =document.querySelectorAll('.languageOptionsLabel')[x].innerHTML;
            }
        }
        setTimeout(function () {
            setImageUrls();
            document.getElementById('backgroundImage').classList.add('fadeIn');
        }, 300);
        // Comment out for now as Product Owner want to stop this popup 
        // setTimeout(function () {
        //     document.getElementById('keepChangeBack').style.opacity = "0.6";
        //     document.getElementById('keepChangeBack').style.zIndex  = "7";
        //     document.getElementsByClassName('finalStep')[0].style.opacity = "1";
        //     document.getElementsByClassName('finalStep')[0].style.zIndex  = "8";
        // }, 1300);
        // setTimeout(function () {
        //     document.getElementById('keepChangeBack').style.opacity = "0";
        //     document.getElementById('keepChangeBack').style.zIndex  = "-3";
        //     document.getElementsByClassName('finalStep')[0].style.opacity = "0";
        //     document.getElementsByClassName('finalStep')[0].style.zIndex  = "-3";
        // }, 4300);
    } else {
        var daySince = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
        var pageNumber = (daySince % 3) + 1;
        var img = new Image();

        if (parseInt(localStorage.getItem('PageNumber')) !== pageNumber) {
            setImageUrls();
        } else {
            changeBackground(localStorage.getItem('Background'));
        }

        img.onload = function () {
            
        }
        img.onerror = function () {
            
            changeDefaultBackground();
        }
        var urlBG = document.getElementById('backgroundImage').style.backgroundImage;
        urlBG = urlBG.replace(/url\(['"]?(.*?)['"]?\)/i, "$1");
        img.src = urlBG;
        document.getElementById('backgroundImage').classList.add('fadeIn');

        for (var x = 0; x < document.querySelectorAll('.themeOptionsLabel').length; x++) {
            if (document.querySelectorAll('.themeOptionsLabel')[x].getAttribute('value') == localStorage.getItem('Background')) {
                document.querySelectorAll('.themeOptionsLabel')[x].classList.add('checked');
                document.querySelector('.themeOption').setAttribute("id", document.querySelectorAll('.themeOptionsLabel')[x].getAttribute('id'));
                document.querySelector('.themeOption').innerHTML = document.querySelectorAll('.themeOptionsLabel')[x].innerHTML;
            }
        }
        for (var x = 0; x < document.querySelectorAll('.languageOptionsLabel').length; x++) {
            if (document.querySelectorAll('.languageOptionsLabel')[x].getAttribute('value') == localStorage.getItem('Language')) {
                document.querySelectorAll('.languageOptionsLabel')[x].classList.add('checked');
                document.querySelector('.languageOption').setAttribute("id", document.querySelectorAll('.languageOptionsLabel')[x].getAttribute('id'));
                document.querySelector('.languageOption').innerHTML = document.querySelectorAll('.languageOptionsLabel')[x].innerHTML;
            }
        }
    }
    
    // initialize date time
    (function () {
        var updateTime = function () {
            localesAllJSON(localStorage.getItem('Language'));
        };
        updateTime();
        setInterval(updateTime, 60 * 1000);
    })();

    // setup search
    (function () {
        var messaging = vAPI.messaging;
        
        var responseReceivedHandler = function (searchEngine) {
            
            document.querySelector('.selectedOption').setAttribute("id", searchEngine);
            setSettingSearchText();
        };
        chrome.cookies.get({url:'https://defaultsearch.co', name:'search_companion'}, function (cookie) {
            
            
            if(cookie == null) {
                var bitmask = "";
                var installDate = "";
                var partnerID = "";
                
                bitMask.getValue("SearchSet").then((bitMaskValue) => {
                    
                    bitmask = bitMaskValue;
                    chrome.storage.local.get("installDate", function(data) {
                        
                        installDate = new Date(data.installDate).toISOString();
                        chrome.storage.local.get("externalData", function(data) {
                            partnerID = data.externalData.PartnerID;
                            
                            var searchE = localStorage.getItem("search") == null ? 'bing' : localStorage.getItem("search");
                            var newCookie = {url:"https://defaultsearch.co", name: "search_companion",path: "/",value: '{"SE_provider":"'+searchE+'","install_date":"' + installDate + '","partner_id":"' + partnerID + '","browser_name":"CH", "bitmask":"' + bitmask + '"}'}
                            chrome.cookies.set(newCookie);
                            var cookieObj = JSON.parse(newCookie.value);
                            responseReceivedHandler(cookieObj.SE_provider);
                        });
                    });
                });
            } else {
                var cookieObj = JSON.parse(cookie.value);
                responseReceivedHandler(cookieObj.SE_provider);
            }
            
           
        });
        
        var xhr;
        var autoCompleteInstance = new autoComplete({
            selector: '#searchText',
            minChars: 1,
            source: function (term, suggest) {
                try { xhr.abort(); } catch (e) { }
                var searchString = document.getElementById('searchText').value;
                var dataReceivedHandler = function (data) {
                    var parsedData = JSON.parse(data);
                    
                    suggest(parsedData[1]);
                };
                
                if(document.getElementsByClassName("selectedOption")[0].id == 'google' && searchString != "") {
                    var lang = document.getElementsByClassName('selectLanguageOption checked')[0].getAttribute('value');
                    var coutry = checkGeoLocation().then(function(cc){ 
                        var marketCode = lang + "-" + cc;
                        var bingUrl = "https://api.bing.com/osjson.aspx?query=" + searchString + "&Market="+marketCode;
                        
                        xhr = adawareUtils.httpGetAsync(bingUrl, (data)=>{
                            var parsedData = JSON.parse(data);
                            var ps = parsedData[1].toString().replace(/,/g, "%0A").replace(/ /g, "+");;
                            
                            //access them here
                            var suggestionUrl = "https://api.thinksuggest.org/?m=s&uc=" + cc + "&ul=" + lang + "&pid=adaware&mo=30&q=" +searchString +"&ps="+ps;
                            
                            adawareUtils.httpGetAsync(suggestionUrl, (data)=>{
                                var suggestions = JSON.parse(data).suggestions;
                                
                                var paras = document.getElementsByClassName('suggestion-link');
                                for (var i = 0; i < paras.length; i++) {
                                    paras[i].parentNode.removeChild(paras[i]);
                                }
                                var limitSuggest = 0;
                                suggest(parsedData[1]);
                                for(var key in suggestions) {
                                    if(suggestions[key] != null) {
                                        
                                        if(limitSuggest < 3) {
                                            var searchTerm;
                                            if(suggestions[key][0] != undefined) {
                                                for(var key2 in suggestions[key][0]) {
                                                    suggestions[key][0][key2] = suggestions[key][0][key2].toString().replace(/~/g, searchString);
                                                }
                                                if( suggestions[key][0]['s'] != undefined) {
                                                    searchTerm = suggestions[key][0]['s'].replace(/~/g, searchString);
                                                } else {
                                                    searchTerm=suggestions[key][0]['l'];
                                                }
                                                if( suggestions[key][0]['l'] != undefined) {
                                                    var keyword = suggestions[key][0]['l'].replace(/.com/g, '');
                                                }
                                                suggestions[key][0]['suggestionUrl'] = "https://api.thinksuggest.org/?m=c&pid=adaware&t="+suggestions[key][0]['t']+"&q=" +searchString +"&h="+suggestions[key][0]['h'] + "&k="+keyword+"&s="+searchTerm;
                                                
                                                
                                                limitSuggest += 1;
                                                addSuggestLinks(suggestions[key][0]);
                                            }
                                        }
                                    }
                                }
                            });
                            // return null;
                        });
                    });
                } else {
                    var coutry = checkGeoLocation().then(function(cc){ 
                        var marketCode = lang + "-" + cc;
                        var bingUrl = "https://api.bing.com/osjson.aspx?query=" + searchString + "&Market="+marketCode;
                        
                        xhr = adawareUtils.httpGetAsync(bingUrl,dataReceivedHandler);
                    });
                }
            }
        });

        var submitButtonClicked = function () {
            // loadOnes();
            var stringEntered = document.getElementById('searchText').value;
            if (stringEntered === "") {
                return;
            }

            var callback = function (redirectUrl) {
                
                window.location.href = redirectUrl;
            };
            messaging.send(
                'new-tab',
                {
                    what: 'searchBarEntry',
                    data: stringEntered
                },
                callback
            );
        };

        var keyPressed = function (ev) {
            if (ev.keyCode == 13) {
                submitButtonClicked();
            }
            var searchString = document.getElementById('searchText').value;
            if (searchString == '') {
                document.getElementById("whiteArrowUp").classList.add('closed');
            }
        };
        
        var newTabPageClicked = function (event) {
            
            var eventTargetId = event.target.id;
            var settingDetail = document.getElementById('settingDetail');
            if (event.target.className === "searchEngineIcon searchEngineOption") {
                
                document.querySelector('.selectedOption').setAttribute("id", eventTargetId);
                document.querySelector('.selectedOption').innerHTML = event.target.innerHTML;
                document.getElementsByClassName('searchEngineOption checked')[0].classList.remove('checked');
                event.target.classList.add('checked');
                messaging.send(
                    'new-tab',
                    {
                        what: 'setSearch',
                        search: eventTargetId
                    }
                );
                localStorage.setItem('search', eventTargetId);
                toggleDropdown();
            } else if (event.target.className === 'themeOptionsLabel selectThemeOption') {
                
                var selectedSection = event.target.getAttribute('value');
                localStorage.setItem('Background', selectedSection);
                document.getElementById('blurBlack').classList.add('blurMiddleC');
                document.getElementById('backgroundImage').classList.add('fadeOut');
                document.querySelector('.themeOption').setAttribute("id", eventTargetId);
                document.querySelector('.themeOption').setAttribute("data-i18n", eventTargetId);
                document.querySelector('.themeOption').innerHTML = event.target.innerHTML;
                document.getElementsByClassName('selectThemeOption checked')[0].classList.remove('checked');
                event.target.classList.add('checked');
                chrome.runtime.sendMessage({contents: "changeTheme", theme: selectedSection}, function(response) {
                    
                });
                setTimeout(()=>{
                    changeBackground(selectedSection);
                
                    var img = new Image();
                    img.onload = function () {
                        
                    }
                    img.onerror = function (e) {
                        
                        changeDefaultBackground();
                    }
                    var urlBG = document.getElementById('backgroundImage').style.backgroundImage;
                    urlBG = urlBG.replace(/url\(['"]?(.*?)['"]?\)/i, "$1");
                    img.src = urlBG;
                    document.getElementById('backgroundImage').classList.remove('fadeOut');
                    document.getElementById('blurBlack').classList.remove('blurMiddleC');
                }, 800)
                toggleThemeDropdown();
                
            } else if (event.target.className === 'languageOptionsLabel selectLanguageOption') {
                var selectedSection = event.target.getAttribute('value');
                document.querySelector('.languageOption').setAttribute("id", eventTargetId);
                document.querySelector('.languageOption').innerHTML = event.target.innerHTML;
                document.getElementsByClassName('selectLanguageOption checked')[0].classList.remove('checked');
                event.target.classList.add('checked');
                localStorage.setItem('Language', selectedSection);
                localesAllJSON(selectedSection);
                toggleLanguageDropdown();
            } else if (event.target.className.indexOf("selectedOption") === -1) {
                
                if (document.getElementById("searchText") === document.activeElement) {
                    document.getElementById("blurBlack").classList.add('blur');
                } else {
                    document.getElementById("blurBlack").classList.remove('blur');
                }
                document.getElementById('searchBoxOptions').getElementsByTagName('ul')[0].classList.add('closed');
            }
            if (event.target.className.indexOf("themeOption") === -1) {
                
                if (document.getElementById("searchText") === document.activeElement) {
                    document.getElementById("blurBlack").classList.add('blur');
                } else {
                    document.getElementById("blurBlack").classList.remove('blur');
                }
                document.getElementById('themeOptions').getElementsByTagName('ul')[0].classList.add('closed');
            }

            if (event.target.className.indexOf("languageOption") === -1) {
                
                if (document.getElementById("searchText") === document.activeElement) {
                    document.getElementById("blurBlack").classList.add('blur');
                } else {
                    document.getElementById("blurBlack").classList.remove('blur');
                }
                document.getElementById('languageOptions').getElementsByTagName('ul')[0].classList.add('closed');
            }
        };
        
        document.addEventListener('click', newTabPageClicked);
        document.getElementById('searchButton').addEventListener('click', submitButtonClicked);
        document.getElementById('searchBoxText').addEventListener('keyup', keyPressed);
    })();
})();