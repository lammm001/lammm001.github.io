import CryptoJS from "./CryptoJS";

function Original(_component, _params) {
    let component = _component
    let params = _params
    let network = new Lampa.Reguest();
    let corsProxy = 'https://cr.clash-corwin3.workers.dev/?'
    // let mainDomain = 'https://freemovieswatch.tv'
    let mainDomain = 'https://hdtoday.tv'
    // let mainDomain = 'https://freemovieswatch.cc'
    let choice = {
        season: 0,
        last_viewed: ''
    };
    let origTitle;
    let movieYear;
    let seasons = [];
    let shiftNum, array;

    this.search = function (_params, kinopoiskId, selectedSimilarElements) {
        params = _params
        network.clear()
        if (selectedSimilarElements) {
            buildVideoList(selectedSimilarElements[0])
            return
        }
        if (!params.movie.number_of_seasons) {
            var search_date = params.search_date || params.movie.release_date;
            if (search_date) {
                movieYear = (search_date + '').slice(0, 4);
            }
        }
        // origTitle = 'stargate';
        origTitle = params.movie.original_title || params.movie.original_name;
        var clean_title = component.cleanTitle(origTitle);
        // if (movieYear) clean_title = clean_title.replace(new RegExp(' \\+(' + movieYear + ')$'), ' $1');

        let postData = {
            keyword: clean_title
        }
        network.silent(corsProxy + mainDomain + '/ajax/search', function onComplete(searchResponse) {
            try {
                var rootDiv = document.createElement("div");
                rootDiv.innerHTML = searchResponse;
                let videoElements = rootDiv.querySelectorAll("a.nav-item")

                if (!videoElements.length) {
                    Lampa.Noty.show('Nothing found');
                    component.loading(false);
                    return
                }
                let uniqueResult;
                let similarList = []
                videoElements.forEach(function (videoElement, index, arr) {
                    if (isVideoTypeMatches(videoElement)) {
                        if (!uniqueResult &&
                            clean_title === videoElement.querySelector(".film-name")?.textContent &&
                            (!movieYear && params.movie.number_of_seasons.toString() ===
                                videoElement.querySelector("div.film-infor > span")?.textContent.replace('SS ', '')
                                || movieYear === videoElement.querySelector("div.film-infor > span")?.textContent)) {
                            uniqueResult = videoElement
                        } else {
                            similarList.push(videoElement)
                        }
                    }
                });
                rootDiv.remove()
                if (uniqueResult) {
                    buildVideoList(uniqueResult)
                } else if (similarList.length === 1) {
                    buildVideoList(similarList[0])
                } else {
                    let similars = similarList.map(function (videoElement) {
                        return {
                            year: videoElement.querySelector("div.film-infor > span")?.textContent,
                            title: videoElement.querySelector(".film-name")?.textContent,
                            type: videoElement.href.includes('/tv/') ? 'Tv show' : 'Movie',
                            href: videoElement.href
                        };
                    });
                    component.similars(similars)
                    component.loading(false)
                }
            } catch (e) {
                let msg = "Error parsing searchResponse: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error searching video: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, postData, {
            headers: {
                'Accept': '*/*'
            },
            dataType: 'text'
        })
    }
    this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
    }

    /**
     * Сброс фильтра
     */
    this.reset = function () {
        component.reset()
        choice = {
            season: 0
        }
        component.loading(true)
        getEpisodes()
        component.saveChoice(choice)
    }

    /**
     * Применить фильтр
     * @param {*} type
     * @param {*} a
     * @param {*} b
     */
    this.filter = function (type, a, b) {
        choice[a.stype] = b.index
        // if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index]
        component.reset()
        component.loading(true)
        getEpisodes()
        buildFilter()
        component.saveChoice(choice)
        setTimeout(component.closeFilter, 10)
    }

    this.destroy = function () {
        network.clear()
        params = null;
        seasons = null;
        array = null;
    }

    function buildFilter() {
        let filter_items = {
            season: seasons.map(function (v) {
                return v.seasonName;
            }),
        };
        if (!filter_items.season[choice.season - 1]) choice.season = 0;
        component.filter(filter_items, choice);
    }

    function buildVideoList(videoElement) {
        let href = videoElement.href;
        let split = href.split("-");
        let videoId = split[split.length - 1];
        if (params.movie.number_of_seasons) {
            getSeasons(videoId)
        } else {
            let videoItem = new VideoItem();
            videoItem.title = 'Original'
            videoItem.quality = '1080p'
            videoItem.info = ''
            videoItem.videoId = videoId

            showVideoList([videoItem])
        }
    }

    function getSeasons(videoId) {
        network.silent(corsProxy + mainDomain + '/ajax/v2/tv/seasons/' + videoId, function onComplete(response) {
            try {
                let responseFixed = response.replace(/\n/g, '')
                let match = responseFixed.match(/<div class="dropdown-menu.{0,30}?">(.*?)<\/div>/);
                var rootDiv = document.createElement("div");
                rootDiv.innerHTML = match[1];
                let seasonElements = rootDiv.querySelectorAll("a[data-id]")
                seasons = []
                seasonElements.forEach(function (element) {
                    seasons.push({
                        seasonName: element.textContent,
                        seasonId: element.getAttribute('data-id')
                    })
                })
                rootDiv.remove()
                getEpisodes()
            } catch (e) {
                let msg = "Error parsing getSeasons Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open getSeasons Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, null, {
            headers: {
                'Accept': '*/*'
            },
            dataType: 'text'
        })
    }

    function getEpisodes() {
        let seasonId = seasons.find(function (season) {
            return season.seasonName === 'Season ' + (choice.season + 1)
        }).seasonId
        network.silent(corsProxy + mainDomain + '/ajax/v2/season/episodes/' + seasonId, function onComplete(response) {
            try {
                let responseFixed = response.replace(/\n/g, '')
                let match = responseFixed.match(/<ul class="nav">(.*?)<\/ul>/);
                var rootDiv = document.createElement("div");
                rootDiv.innerHTML = match[1];
                let episodeElements = rootDiv.querySelectorAll("a[data-id]")
                let videoItems = []
                episodeElements.forEach(function (element, index) {
                    let videoItem = new VideoItem();
                    videoItem.seasonNum = choice.season + 1
                    videoItem.episodeNum = index
                    videoItem.title = 'S' + videoItem.seasonNum + ' / ' + element.title
                    videoItem.quality = '1080p'
                    videoItem.videoId = element.getAttribute('data-id')
                    videoItem.info = ''
                    videoItems.push(videoItem)
                })
                showVideoList(videoItems)
            } catch (e) {
                let msg = "Error parsing getEpisodes Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open getEpisodes Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, null, {
            dataType: 'text'
        })
    }

    function getSource(videoItem, sourceId, then) {
        network.silent(corsProxy + mainDomain + "/ajax/sources/" + sourceId, function onComplete(json) {
            try {
                let split = json.link.split("/");
                let embedPart = split[3];
                let idPart = split[4].split('?')[0];
                let streamsUrl = 'https://dokicloud.one/ajax/' + embedPart + '/getSources?id=' + idPart;
                let url = 'https://dokicloud.one/js/player/prod/e4-player.min.js?v=' + Date.now()
                getKey(url, streamsUrl, videoItem, then)
            } catch (e) {
                let msg = "Error parsing Video Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open Video Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        })
    }

    function getVideoStreamDetails(videoItem, then) {
        if (params.movie.number_of_seasons) {
            network.silent(corsProxy + mainDomain + "/ajax/v2/episode/servers/" + videoItem.videoId, function onComplete(response) {
                try {
                    let match = response.match(/data-id="(\d*)"/);
                    getSource(videoItem, match[1], then)
                } catch (e) {
                    let msg = "Error parsing episode Details Page: ";
                    console.log('modss', msg + e);
                    Lampa.Noty.show(msg);
                    component.loading(false);
                }
            }, function onError(a, c) {
                let msg = "Error open episode Details Page: ";
                console.log('modss', msg + network.errorDecode(a, c));
                Lampa.Noty.show(msg);
                component.loading(false);
            }, null, {
                headers: {
                    'Accept': '*/*'
                },
                dataType: 'text'
            })
        } else {
            network.silent(corsProxy + mainDomain + "/ajax/movie/episodes/" + videoItem.videoId, function onComplete(response) {
                try {
                    let match = response.match(/data-linkid="(\d*)"/);
                    getSource(videoItem, match[1], then)
                } catch (e) {
                    let msg = "Error parsing movie Page: ";
                    console.log('modss', msg + e);
                    Lampa.Noty.show(msg);
                    component.loading(false);
                }
            }, function onError(a, c) {
                let msg = "Error open movie Page: ";
                console.log('modss', msg + network.errorDecode(a, c));
                Lampa.Noty.show(msg);
                component.loading(false);
            }, null, {
                dataType: 'text'
            })
        }
    }

    function getKey(keyUrl, streamsUrl, videoItem, then) {
        network.silent(corsProxy + keyUrl, function onComplete(response) {
            try {
                let key = '';

                let shuflArrayFnStr = response.match(
                    /\(function\(.{100,500}?while\(!!\[\]\).*?\}\}\}\(.{1,12}?,.{1,12}?\)/)[0];
                let arrayFnName = shuflArrayFnStr.match(/.*\}\}\}\((.{1,12}),.{1,12}\)/)[1];
                let arrayFnStr = response.match(new RegExp('function ' + arrayFnName +
                    '\\(\\)\\{.*?return ' + arrayFnName + '\\(\\);\\}'))[0];
                executeEvalInGlobalScope(arrayFnStr);

                let hashFnNameList = [];
                let hashFnStrList = shuflArrayFnStr.match(/function .{1,12}?\{return .{1,12}?\(.*?\);\}/g);
                hashFnStrList.forEach(function (elem) {
                    let hashFnName = elem.match(/return (.{1,12}?)\(.*?\);\}/)[1];
                    hashFnNameList.push(hashFnName)
                    let hashFnStr = response.match(new RegExp('function ' + hashFnName + '\\(.*?\\},' + hashFnName +
                        '\\(.{1,12}?,.{1,12}?\\);\\}'))[0];
                    executeEvalInGlobalScope(hashFnStr);
                });
                executeEvalInGlobalScope(shuflArrayFnStr + ')');

                let globalHashFnStrList = response.match(
                    /function .{1,12}?\(.{1,12}?,.{1,12}?\)\{.{5,55}?return .{1,12}?=function\(.{1,12}?,.{1,12}?\)\{.{10,400}?'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.*?;\},.{1,12}?\(.{1,12}?,.{1,12}?\);\}/g);
                globalHashFnStrList.forEach(function (elem) {
                    let hashFnName = elem.match(/function (.{1,12}?)\(/)[1];
                    if (!hashFnNameList.includes(hashFnName)) {
                        executeEvalInGlobalScope(elem);
                    }
                })
                let joinFnName = response.match(/,([^(){}]{1,12}?)=[(]\.\.\..{1,12}?[)]=>((?!\(\)).){1,50}?\][(]''[)]/)[1];
                let joinFnParamsStr = response.match(new RegExp("\\(.{1,12}?," + joinFnName + "\\((.*?)\\)\\),"))[1];
                let split = joinFnParamsStr.split(/[,+]/);
                for (let i = 0; i < split.length; i++) {
                    if (!split[i].startsWith("'")) {
                        let parameterStr = split[i];
                        i++;
                        parameterStr += ',' + split[i];
                        let hashFnName = parameterStr.substring(0, parameterStr.indexOf('('));
                        let hashFnStr = response.match(new RegExp('function ' + hashFnName + '\\(.*?}'))[0];
                        executeEvalInGlobalScope(hashFnStr);
                        key += executeEvalInGlobalScope(parameterStr);
                    } else {
                        key += split[i].replaceAll("'", '');
                    }
                }
                getStreams(streamsUrl, key, videoItem, then);
            } catch (e) {
                let msg = "Error parsing getKey Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg + e);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open getKey Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, null, {
            dataType: 'text'
        })
    }

    function getStreams(streamsUrl, key, videoItem, then) {
        network.silent(corsProxy + streamsUrl, function onComplete(json) {
            try {
                videoItem.subtitles = json.tracks.map(function (track, index) {
                    return {
                        label: track.label,
                        url: track.file
                    }
                });
                let file
                if (json.sources[0]?.file) {
                    file = json.sources[0].file
                } else {
                    let decrypted = CryptoJS.AES.decrypt(json.sources, key);
                    let text = decrypted.toString(CryptoJS.enc.Utf8);
                    let sources = JSON.parse(text)[0];
                    file = sources.file
                }
                getQualities(file, videoItem, then)
            } catch (e) {
                let msg = "Error parsing getStreams Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg + e);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open getStreams Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, null, {
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
    }

    function getQualities(url, videoItem, then) {
        network.silent(url, function onComplete(respDt) {
            try {
                let qualities = {};
                let p360 = respDt.match(/http.*360\/index\.m3u8/);
                if (p360) {
                    qualities['360p'] = p360[0];
                }
                let p480 = respDt.match(/http.*480\/index\.m3u8/);
                if (p480) {
                    qualities['480p'] = p480[0];
                }
                let p720 = respDt.match(/http.*720\/index\.m3u8/);
                if (p720) {
                    qualities['720p'] = p720[0];
                }
                let p1080 = respDt.match(/http.*1080\/index\.m3u8/);
                if (p1080) {
                    qualities['1080p'] = p1080[0];
                }
                var preferably = Lampa.Storage.get('video_quality_default');
                if (preferably && qualities[preferably + 'p']) {
                    videoItem.url = qualities[preferably + 'p'];
                } else {
                    videoItem.url = qualities[Object.keys(qualities)[Object.keys(qualities).length - 1]]
                }
                videoItem.quality = qualities
                // videoItem.quality = Object.keys(qualities)[Object.keys(qualities).length - 1]

                then(videoItem)
            } catch (e) {
                let msg = "Error parsing getQualities Page: ";
                console.log('modss', msg + e);
                Lampa.Noty.show(msg);
                component.loading(false);
            }
        }, function onError(a, c) {
            let msg = "Error open getQualities Page: ";
            console.log('modss', msg + network.errorDecode(a, c));
            Lampa.Noty.show(msg);
            component.loading(false);
        }, null, {
            dataType: 'text'
        })
    }

    function isVideoTypeMatches(videoElement) {
        return videoElement.href.includes('/tv/') && params.movie.number_of_seasons ||
            videoElement.href.includes('/movie/') && !params.movie.number_of_seasons;
    }

    function getBaseUrl(url) {
        var pathArray = url.split('/');
        var protocol = pathArray[0];
        var host = pathArray[2];
        return protocol + '//' + host
    }

    function hashingFn1(prm1, prm2) {
        let index = prm1 - shiftNum;
        var arrElement = array[index];
        let decodeUriRes = decodeUriFn(arrElement);

        var numbersArr = [], number = 0, val7, result = '';
        var i;
        for (i = 0; i < 256; i++) {
            numbersArr[i] = i;
        }
        for (i = 0; i < 256; i++) {
            number = (number + numbersArr[i] + char4.charCodeAt(i % char4.length)) % 256;
            val7 = numbersArr[i];
            numbersArr[i] = numbersArr[number];
            numbersArr[number] = val7;
        }
        i = 0, number = 0;
        for (var k = 0; k < decodeUriRes.length; k++) {
            i = (i + 1) % 256;
            number = (number + numbersArr[i]) % 256;
            val7 = numbersArr[i];
            numbersArr[i] = numbersArr[number];
            numbersArr[number] = val7;
            result += String.fromCharCode(decodeUriRes.charCodeAt(k) ^ numbersArr[(numbersArr[i] + numbersArr[number]) % 256]);
        }
        return result;
    }

    function shuflArray(array, number, getEncNumFn) {
        while (!![]) {
            try {
                if (getEncNumFn() === number)
                    break;
                else
                    array.push(array.shift());
            } catch (e) {
                array.push(array.shift());
            }
        }
    }

    function executeEvalInGlobalScope(x) {
        return eval.call(window, x);
        // setTimeout("eval(" + x + ")", 0);
        // Or: $.globalEval(x);
    }

    var decodeUriFn = function (param) {
        var charSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
        var val1 = '', val2 = '';
        for (var i = 0, val3, val4, val5 = 0; val4 = param.charAt(val5++); ~val4 && (val3 = i % 4 ? val3 * 64 + val4 : val4, i++ % 4) ? val1 += String.fromCharCode(255 & val3 >> (-2 * i & 6)) : 0) {
            val4 = charSet.indexOf(val4);
        }
        for (var j = 0, val6 = val1.length; j < val6; j++) {
            val2 += '%' + ('00' + val1.charCodeAt(j).toString(16)).slice(-2);
        }
        return decodeURIComponent(val2);
    };

    /**
     *
     * @param {VideoItem[]} videoItems
     */
    function showVideoList(videoItems) {
        buildFilter()
        component.reset();

        videoItems.forEach(function (videoItem) {
            let viewed = Lampa.Storage.cache('online_view', 5000, [])
            let hash = Lampa.Utils.hash(videoItem.seasonNum ? [videoItem.seasonNum, videoItem.episodeNum, origTitle].join('') : origTitle)
            let view = Lampa.Timeline.view(hash)

            let element = Lampa.Template.get('onlines_v1', videoItem)
            element.timeline = view;
            element.append(Lampa.Timeline.render(view));
            if (Lampa.Timeline.details) {
                element.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
            }
            if (viewed.indexOf(hash) !== -1) element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

            videoItem.timeline = element.timeline
            videoItem.url = (call) => {
                getVideoStreamDetails(videoItem, function then(item) {
                    videoItem.url = item.url
                    videoItem.quality = item.quality
                    call()
                })
            }
            element.on('hover:enter', function () {
                choice.last_viewed = videoItem.episodeNum;
                component.loading(true);
                if (params.movie.id) Lampa.Favorite.add('history', params.movie, 100);
                videoItem.playlist = videoItems
                getVideoStreamDetails(videoItem, function then(item) {
                    component.loading(false);
                    Lampa.Player.play(item);
                    Lampa.Player.playlist(videoItems)
                    if (videoItem.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(videoItem.subtitles)

                    if (viewed.indexOf(hash) == -1) {
                        viewed.push(hash)
                        element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>')
                        Lampa.Storage.set('online_view', viewed)
                    }
                })
            });
            component.append(element);
            component.contextmenu({
                item: element,
                view: view,
                viewed: viewed,
                choice: choice,
                hash_file: hash,
                element: element,
                file: function file(call) {
                    getVideoStreamDetails(videoItem, function then(item) {
                        videoItem.url = item.url
                        videoItem.quality = item.quality
                        call({file: item.url, quality: item.quality})
                    })
                }
            });
        })
        component.start(true);
        component.loading(false);
    }

    class VideoItem {
        seasonNum
        episodeNum
        subtitles
        info
        videoId
        title
        url
        timeline
        quality
        qualitys
        playlist
    }
}


export default Original
