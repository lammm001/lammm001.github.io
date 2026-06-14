function Z01Hdvb(_component, _params) {
    let component = _component
    let params = _params
    let network = new Lampa.Reguest();
    let corsProxy = 'https://cr1.lammm.deno.net/'

    let choice = {
        season: 0,
        voice: 0,
        voice_name: '',
        seasonName: '',
        last_viewed: ''
    };
    let seasons = [];
    let voices = {}
    let filter_items = {}
    let isSerial;
    let origTitle;

    this.search = function (_params, kinopoiskId) {
        let title = params.search || params.search_one || movieTitle(params);
        origTitle = params.movie.original_title || params.movie.original_name;
        let url = 'https://z01.online/lite/hdvb?';
        var search_date = params.search_date || params.movie.release_date || params.movie.first_air_date || params.movie.last_air_date || '0000';
        var search_year = parseInt((search_date + '').slice(0, 4));
        if (kinopoiskId) {
            url += '&kinopoisk_id=' + kinopoiskId
        }
        url += '&title=' + encodeURIComponent(title);
        url += '&original_language=' + params.movie.original_language;
        if (params.movie.imdb_id) {
            url += '&imdb_id=' + params.movie.imdb_id;

        }
        if (params.movie.original_language === 'en' || params.movie.original_language === 'ru') {
            url += '&original_title=' + origTitle;
        }
        url += '&year=' + search_year;
        isSerial = !!params.movie.number_of_seasons;
        url += '&serial=' + (isSerial ? 1 : 0);
        network.silent(url, function onComplete(respData) {
                try {
                    if (isSerial) {
                        seasons = extractSeasonsJsonFromHtml(respData);
                        if (choice.seasonName) {
                            var matches = stringSimilarity.findBestMatch(choice.seasonName, seasons.map(s => s.name));
                            if (matches.bestMatch.rating > 0.1) {
                                choice.season = matches.bestMatchIndex;
                            }
                        }
                        getVoices()
                    } else {
                        let items = extractJsonFromHtml(respData);
                        showVideoList(items.map(item => {
                            let videoItem = new VideoItem();
                            videoItem.title = item.title
                            videoItem.info = ''
                            videoItem.quality = '1080p'
                            videoItem.url = item.stream
                            return videoItem
                        }))
                    }
                } catch (e) {
                    let msg = "Error parsing searchResponse: ";
                    console.log('modss', msg + e.stack);
                    Lampa.Noty.show(msg);
                    component.loading(false);
                }
            },
            function onError(a, c) {
                let msg = "Error searching video request. ";
                console.log('modss', msg + network.errorDecode(a, c));
                Lampa.Noty.show(msg);
                component.loading(false);
            },
            null, {
                dataType: 'text'
            }
        )
    }

    this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
    }

    function getVoices(seasonsData) {
        // if (seasonsData) {
        //     seasons = extractSeasonsJsonFromHtml(seasonsData);
        //     getEpisodes()
        //     return
        // }
        // let voice = voices[choice.voice];
        // if (!voice) {
        //     voice = voices[0]
        // }
        //
        // if (choice.voice_name) {
        //     var matches = stringSimilarity.findBestMatch(choice.voice_name, voices.map(voice => voice.name));
        //     if (matches.bestMatch.rating > 0.1) {
        //         choice.voice = matches.bestMatchIndex;
        //     }
        // }
        // if (!voices.length) {
        //     getVoices(respData)
        // } else {
        //     getVoices()
        // }

        network.silent(seasons[choice.season].url, function onComplete(respData) {
                try {
                    voices = extractVoicesJsonFromHtml(respData);
                    if (choice.voice_name) {
                        var matches = stringSimilarity.findBestMatch(choice.voice_name, voices.map(voice => voice.name));
                        if (matches.bestMatch.rating > 0.1) {
                            choice.voice = matches.bestMatchIndex;
                        }
                    }
                    getEpisodes()
                } catch (e) {
                    let msg = "Error parsing seasons. ";
                    console.log('modss', msg + e.stack);
                    Lampa.Noty.show(msg);
                    component.loading(false);
                }
            },
            function onError(a, c) {
                let msg = "Error on getVoices request. ";
                console.log('modss', msg + network.errorDecode(a, c));
                Lampa.Noty.show(msg);
                component.loading(false);
            },
            null, {
                dataType: 'text'
            }
        )
    }

    function getEpisodes() {
        // if (choice.seasonName) {
        //     var matches = stringSimilarity.findBestMatch(choice.seasonName, seasons.map(s => s.name));
        //     if (matches.bestMatch.rating > 0.1) {
        //         choice.season = matches.bestMatchIndex;
        //     }
        // }
        const season = seasons[choice.season]
        if (!season) {
            season = seasons[0]
        }
        network.silent(voices[choice.voice].url, function onComplete(respData) {
                try {
                    let episodes = extractEpisodesJsonFromHtml(respData);
                    showVideoList(episodes.map((item, index) => {
                        let videoItem = new VideoItem();
                        videoItem.title = item.name
                        videoItem.info = ''
                        videoItem.seasonNum = season.name.match(/\d+/)?.[0] ?? season.name
                        videoItem.episodeNum = item.name.match(/\d+/)?.[0] ?? index
                        videoItem.url = item.stream
                        return videoItem
                    }))
                } catch (e) {
                    let msg = "Error parsing episodes. ";
                    console.log('modss', msg + e.stack);
                    Lampa.Noty.show(msg);
                    component.loading(false);
                }
            },
            function onError(a, c) {
                let msg = "Error on getEpisodes request. ";
                console.log('modss', msg + network.errorDecode(a, c));
                Lampa.Noty.show(msg);
                component.loading(false);
            },
            null, {
                dataType: 'text'
            }
        )
    }

    /**
     * Сброс фильтра
     */
    this.reset = function () {
        component.reset()
        choice = {
            season: 0,
            seasonName: '',
            voice: 0,
            voice_name: ''
        }
        component.loading(true)
        getVoices()
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
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index]
        if (a.stype == 'season') choice.seasonName = filter_items.season[b.index]
        component.reset()
        component.loading(true)
        getVoices()
        buildFilter()
        component.saveChoice(choice)
        setTimeout(component.closeFilter, 10)
    }

    this.destroy = function () {
        network.clear()
        params = null;
        seasons = null;
    }

    function buildFilter() {
        if (isSerial) {
            filter_items = {
                season: seasons.map(function (season) {
                    return '' + season.name;
                }),
                voice: voices.map(voice => voice.name)
            };
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

    function movieTitle(object) {
        return object.movie.title = object.movie.name || object.movie.original_title || object.movie.original_name || ''
    }

    function extractJsonFromHtml(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const items = doc.querySelectorAll('[data-json]');

        const result = [];

        items.forEach(item => {
            try {
                const jsonStr = item.getAttribute('data-json');
                const parsed = JSON.parse(jsonStr);
                result.push(parsed);
            } catch (e) {
                console.warn('Failed to parse data-json:', e);
            }
        });

        return result;
    }

    function extractVoicesJsonFromHtml(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const divs = doc.querySelectorAll('.videos__button');

        return Array.from(divs).map(div => {
            const dataJson = JSON.parse(div.getAttribute('data-json'));
            return {
                url: dataJson.url,
                name: div.textContent.trim()
            };
        })
    }

    function extractSeasonsJsonFromHtml(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const divs = doc.querySelectorAll('.videos__season');

        return Array.from(divs).map(div => {
            const dataJson = JSON.parse(div.getAttribute('data-json'));
            return {
                url: dataJson.url,
                name: div.textContent.trim()
            };
        })
    }

    function extractEpisodesJsonFromHtml(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const divs = doc.querySelectorAll('.videos__movie');

        return Array.from(divs).map(div => {
            const dataJson = JSON.parse(div.getAttribute('data-json'));
            return {
                url: dataJson.url,
                name: div.textContent.trim()
            };
        })
    }

    class VideoItem {
        seasonNum
        episodeNum
        subtitles
        selectedSubsIdx
        info
        videoId
        title
        pageUrl
        url
        timeline
        quality
        playlist
        audioTracks
    }
}


export default Z01Hdvb
