function VideoCdn(_component, _params) {
    let component = _component
    let params = _params
    let network = new Lampa.Reguest();
    let corsProxy = 'https://cr.clash-corwin3.workers.dev/?'

    let choice = {
        season: 0,
        voice: 0,
        voice_name: '',
        last_viewed: ''
    };
    // let seasons = [];
    let voices = {}
    let resultData = {}

    let filter_items = {}
    let isSerie;
    let origTitle;

    function decode(pass, src) {
             var pass_len = pass.length;
             var pass_arr = Array.from(pass, function (c) {
                 return c.charCodeAt(0);
             });
             var src_len = src.length;
             var res = [];

             for (var i = 0; i < src_len; i += 2) {
                 var hex = src.slice(i, i + 2);
                 var code = parseInt(hex, 16);
                 var secret = pass_arr[i / 2 % pass_len] % 255;
                 res.push(code ^ secret);
             }

             return res.map(function (code) {
                 return String.fromCharCode(code);
             }).join('');
         }

    function parseQualities(string) {
        let qualities = {}
        string.split(',').forEach(qualityStr => {
            let split = qualityStr.split('//');
            qualities[split[0].replaceAll('[', '').replaceAll(']', '')] = 'http://' + split[1].split("?")[0]
        })
        return qualities;
    }

    function parseSearchResponse(raw) {
        let response = raw.replace(/\n/g, '');

        var client_id = response.match(/id="client_id" value="([^"]*)"/);
        var sentry_id = response.match(/id="sentry_id" value="([^"]*)"/);
        var fs = client_id && sentry_id && decode(client_id[1], sentry_id[1]);

        // var match = response.match(/<option.*?value="(.*?)".*?>(.*?)</g);
        //
        // var jsonMatch = response.match(/id="cfgdhd" value="([^']*)"/);
        // if (!jsonMatch) {
        //     jsonMatch = response.match(/id="sdsgw" value="(.*?)"/);
        // }
        var text = document.createElement("textarea");
        text.innerHTML = fs;
        resultData = Lampa.Arrays.decodeJson(text.value, {});


        let voiceMatch = response.match(/<option.*?<\//g);
        if (voiceMatch) {
            voiceMatch.forEach(optionAsStr => {
                let voiceId = optionAsStr.match(/value="(.*?)"/)[1];
                let voiceName = optionAsStr.match(/option.*?>(.*?)<\//)[1];
                voices[voiceId] = voiceName.trim()
            })
        } else {
            voices[Object.keys(resultData)[0]] = "Default"
        }

        for (var key in resultData) {
            isSerie = resultData[key][0].hasOwnProperty('folder')
            break
        }
        if (isSerie) {
            if (choice.voice_name) {
                var matches = stringSimilarity.findBestMatch(choice.voice_name, Object.keys(voices).map(voiceKey => voices[voiceKey]));
                if (matches.bestMatch.rating > 0.1) {
                    choice.voice = matches.bestMatchIndex;
                }
            }
            getEpisodes()
        } else {
            showVideoList(Object.keys(voices).map(voiceId => {
                let videoItem = new VideoItem();
                videoItem.title = voices[voiceId]
                // videoItem.quality = '1080p'dfasdf
                videoItem.info = ''
                videoItem.qualitys = parseQualities(resultData[voiceId])
                var preferably = Lampa.Storage.get('video_quality_default');
                if (preferably && videoItem.qualitys[preferably + 'p']) {
                    videoItem.url = videoItem.qualitys[preferably + 'p'];
                } else {
                    videoItem.url = videoItem.qualitys[Object.keys(videoItem.qualitys)[Object.keys(videoItem.qualitys).length - 1]]
                }
                return videoItem
            }))
        }
    }

    this.search = function (_params, kinopoiskId) {
        origTitle = params.movie.original_title || params.movie.original_name;

        network.silent('https://cr.clash-corwin3.workers.dev/?http://videocdn.tv/api/short?api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE&imdb_id=' +
            encodeURIComponent(params.movie.imdb_id), function onComplete(json) {
            try {
                if (json.data && json.data.length) {
                    let url;
                    let headers;
                    let meta
                    let referrer;
                    if (Lampa.Platform.is('android')) {
                        url = 'http:' + json.data[0].iframe_src;
                        headers = {
                            'Origin': 'https://lampaprod.netlify.app',
                            'Referer': 'https://lampaprod.netlify.app/'
                            // 'Origin': 'https://videocdn.tv',
                            // 'Referer': 'https://videocdn.tv/',
                        }
                    } else {
                        url = 'https://cors.nb557.workers.dev:8443/http:' + json.data[0].iframe_src;
                        headers = {}
                        //
                        //     meta = $('head meta[name="referrer"]');
                        //     referrer = meta.attr('content') || 'never';
                        //     meta.attr('content', 'origin');
                    }
                    network.native(url, function onComplete(resp) {
                        try {
                            parseSearchResponse(resp);
                        } catch (e) {
                            let msg = "Error#2 parsing searchResponse: ";
                            console.log('modss', msg + e);
                            Lampa.Noty.show(msg);
                            component.loading(false);
                        }
                    }, function onError(a, c) {
                        let msg = "Error#2 searching video: ";
                        console.log('modss', msg + network.errorDecode(a, c));
                        Lampa.Noty.show(msg);
                        component.loading(false);
                    }, false, {
                        headers: headers,
                        dataType: 'text'
                    });

                    // if (!Lampa.Platform.is('android')) {
                    //     meta.attr('content', referrer);
                    // }
                } else {
                    Lampa.Noty.show('Video not found');
                    component.loading(false);
                    return
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
        })
    }

    this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
    }

    function getEpisodes() {

        showVideoList(resultData[Object.keys(voices)[choice.voice]]
            .find(season => season.id === (choice.season + 1))
            .folder.map(episode => {
                let videoItem = new VideoItem();
                videoItem.seasonNum = choice.season + 1
                videoItem.episodeNum = episode.id.split('_')[1]
                videoItem.title = 'S' + videoItem.seasonNum + ' / E' + videoItem.episodeNum
                videoItem.qualitys = {}
                Object.keys(episode.download).forEach(qualityKey => {
                    videoItem.qualitys[qualityKey] = 'http:' + episode.download[qualityKey].split("?")[0]
                })
                var preferably = Lampa.Storage.get('video_quality_default');
                if (preferably && videoItem.qualitys[preferably + 'p']) {
                    videoItem.url = videoItem.qualitys[preferably + 'p'];
                } else {
                    videoItem.url = videoItem.qualitys[Object.keys(videoItem.qualitys)[Object.keys(videoItem.qualitys).length - 1]]
                }
                videoItem.info = ''
                return videoItem
            }))
    }

    /**
     * Сброс фильтра
     */
    this.reset = function () {
        component.reset()
        choice = {
            voice: 0,
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
        if (a.stype == 'voice') {
            choice.voice_name = filter_items.voice[b.index]
        }
        component.reset()
        component.loading(true)
        buildFilter()
        getEpisodes()
        component.saveChoice(choice)
        setTimeout(component.closeFilter, 10)
    }

    this.destroy = function () {
        network.clear()
        params = null;
        resultData = null;
        voices = null
        filter_items = null;
    }

    function buildFilter() {
        function compare(a, b) {
            if (a.season < b.season) {
                return -1;
            }
            if (a.season > b.season) {
                return 1;
            }
            return 0;
        }

        if (isSerie) {
            filter_items = {
                season: resultData[Object.keys(voices)[choice.voice]].map(function (season) {
                    return '' + season.id;
                }),
                voice: Object.keys(voices).map(voiceKey => voices[voiceKey])
            };
            if (!filter_items.season.includes("" + (choice.season + 1))) {
                choice.season = 0;
            }
            if (!filter_items.voice.includes(voices[choice.voice])) {
                choice.voice = 0;
            }
        } else {
            filter_items = {
                season: [],
                voice: []
            };
        }
        component.filter(filter_items, choice);
    }

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
            videoItem.quality = videoItem.qualitys

            element.on('hover:enter', function () {
                choice.last_viewed = videoItem.episodeNum;
                if (params.movie.id) Lampa.Favorite.add('history', params.movie, 100);

                var playlist = [];
                var first = {
                    url: videoItem.url,
                    quality: videoItem.quality,
                    timeline: view,
                    title: videoItem.title
                };
                if (videoItem.seasonNum) {
                    videoItems.forEach(function (vi, i) {
                        playlist.push({
                            id: i,
                            title: vi.title,
                            url: vi.url,
                            quality: vi.quality,
                            timeline: vi.timeline
                        });
                    });
                } else playlist.push(first);

                // if (Platform.is('android')) {
                //     Lampa.Player.runas('android');
                // }
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);
                //
                // videoItem.playlist = videoItems
                //                 Lampa.Player.play(videoItem);
                //                 Lampa.Player.playlist(videoItems)

                // if (videoItem.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(videoItem.subtitles)

                if (viewed.indexOf(hash) == -1) {
                    viewed.push(hash)
                    element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>')
                    Lampa.Storage.set('online_view', viewed)
                }
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
                    call({
                        file: videoItem.url
                    });
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


export default VideoCdn
