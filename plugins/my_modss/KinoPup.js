
function kinoPub(component, _object) {
    var network = new Lampa.Reguest();
    let movieDetails = {}
    var object = _object;
    let accessToken = 'tke4plvt4gde68tt07fkmpuj9lnw2w16';
    var select_title = '';
    var filter_items = {};
    var choice = {
        season: 0,
        voice: 0,
        order: 0,
        voice_name: '',
        last_viewed: ''
    };

    this.search = function (_object, kp_id, data) {
        var _this = this;
        if (this.wait_similars && data && data[0] && data[0].is_similars) return getItemDetails((data[0].id));
        object = _object;
        select_title = object.search || movieTitle(object);
        var search_date = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
        var search_year = parseInt((search_date + '').slice(0, 4));
        // var orig = object.movie.original_title || object.movie.original_name;
        // var clean_title = component.cleanTitle(select_title).replace(/\b(\d\d\d\d+)\b/g, '+$1');
        // if (search_year) clean_title = clean_title.replace(new RegExp(' \\+(' + search_year + ')$'), ' $1');

        var url = 'https://api.srvkp.com/v1/items/search?access_token=' + accessToken + '&field=title&perpage=20';
        url = Lampa.Utils.addUrlComponent(url, 'q=' + encodeURIComponent(select_title));
        network.clear();
        network.timeout(15000);
        network.silent(url, function (json) {
            if (json.items.length) {
                if (json.items.length > 1) {
                    let match = stringSimilarity.findBestMatch(select_title,
                        json.items.map((x) => x.title));
                    if (match.bestMatch.rating > 0.1) {
                        getItemDetails(json.items[match.bestMatchIndex].id)
                    } else {
                        _this.wait_similars = true;
                        json.items.forEach(function (c) {
                            c.is_similars = true;
                        });
                        component.similars(json.items);
                        component.loading(false);
                    }
                } else {
                    getItemDetails(json.items[0].id)
                }
            } else {
                component.emptyForQuery(select_title);
            }
        }, function (a, c) {
            component.empty(network.errorDecode(a, c));
        });
    };
    // http://alibaba-cdn.net/hls/aWQ9MTgxNjg4NTsxNTg4OTY3MzI4OzI0NjcyOTA3Ozg3NTA4OTsxNjk1Mzg5MDQ1Jmg9bWZ2aVRRNGZCakYzdUpoVGdJUlhzUSZlPTE2OTU0NzU0NDU/demo/master-v1a1.m3u8?loc=nl
    // http://cdn-azure.net/hls4/aWQ9MTgxNjg4NTsxNTg4OTY3MzI4OzI0NjcyOTA3Ozg3NTA4OTsxNjk1Mzg5MTM4Jmg9WWVnZkdXcFRMbllmNFA5Slh4a2NnUSZlPTE2OTU0NzU1Mzg/875089.m3u8?loc=nl
    function getItemDetails(id) {
        network.clear();
        network.timeout(15000);
        let url = 'https://api.srvkp.com/v1/items/' + id + '?access_token=' + accessToken;
        network.silent(url, function (json) {
            movieDetails = json.item;
            delete movieDetails.cast
            delete movieDetails.genres
            delete movieDetails.countries
            delete movieDetails.plot
            delete movieDetails.posters
            delete movieDetails.trailer

            component.loading(false);

            append(filter());
        }, function (a, c) {
            component.empty(network.errorDecode(a, c));
        });
    }

    function filter() {
        filter_items = {
            season: [],
            voice: [],
            order: [],
            voice_info: []
        };
        var filtred = [];
        if (movieDetails.type === 'serial') {
            // component.order.forEach(function (i) {
            //     filter_items.order.push(i.title);
            // });
            movieDetails.seasons.forEach(function (season) {
                filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (season.number));
            });
            if (!filter_items.season[choice.season]) choice.season = 0;

            movieDetails.seasons.forEach(function (season, i) {
                if (i === choice.season) {
                    season.episodes.forEach(function (episode) {
                        let qualities = {}
                        episode.files.forEach(function (qualityObj) {
                            qualities[qualityObj.quality] = qualityObj.url.hls4.replace('/demo.', '/' + episode.id + '.')
                        })
                        let url
                        var preferably = Lampa.Storage.get('video_quality_default');
                        if (preferably && qualities[preferably + 'p']) {
                            url = qualities[preferably + 'p'];
                        } else {
                            url = qualities[Object.keys(qualities)[Object.keys(qualities).length - 1]]
                        }
                        let subtitles = [];
                        episode.subtitles.forEach(function (sub) {
                            let subUrl = sub.file;
                            if (subUrl.startsWith('http')) {
                                subtitles.push({
                                    label: sub.lang,
                                    url: subUrl
                                })
                            }
                        })
                        let audios = episode.audios.map(function (au) {
                            let title = au.lang;
                            if (au.type) {
                                title += ' / ' + au.type.title + ' / ' + au.type.short_title;
                            }
                            return {
                                language: title
                            }
                        })
                        filtred.push({
                            season: season.number,
                            episode: episode.number,
                            title: episode.title,
                            quality: movieDetails.quality,
                            subtitles: subtitles,
                            audios: audios,
                            url: url,
                            qualities: qualities
                        })
                    })
                }
            });
        } else {
            let qualities = {}
            movieDetails.videos[0].files.forEach(function (qualityObj) {
                qualities[qualityObj.quality] = qualityObj.url.hls4.replace('/demo.', '/' + movieDetails.videos[0].id + '.')
            })
            let url
            var preferably = Lampa.Storage.get('video_quality_default');
            if (preferably && qualities[preferably + 'p']) {
                url = qualities[preferably + 'p'];
            } else {
                url = qualities[Object.keys(qualities)[Object.keys(qualities).length - 1]]
            }
            let subtitles = [];
            movieDetails.videos[0].subtitles.forEach(function (sub) {
                let subUrl = sub.file;
                if (!subUrl.startsWith('http')) {
                    let split = url.split('/');
                    subUrl = split[0] + '//' + split[2] + '/hls/' + split[4] + '/subtitles' + subUrl + '/index.m3u8?loc=nl'
                }

                subtitles.push({
                    label: sub.lang,
                    url: subUrl
                })
            })
            let audios = movieDetails.videos[0].audios.map(function (au) {
                let title = au.lang;
                if (au.type) {
                    title += ' / ' + au.type.title + ' / ' + au.type.short_title;
                }
                return {
                    language: title
                }
            })
            filtred.push({
                title: movieDetails.voice ?? movieDetails.title,
                quality: movieDetails.quality,
                url: url,
                subtitles: subtitles,
                audios: audios,
                qualities: qualities
            })
        }
        component.filter(filter_items, choice);
        return filtred
    }

    this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
    };
    /**
     * Сброс фильтра
     */
    this.reset = function () {
        component.reset();
        choice = {
            season: 0,
            voice: 0,
            order: 0,
            voice_name: ''
        };
        append(filter());
        component.saveChoice(choice);
    };
    /**
     * Применить фильтр
     * @param {*} type
     * @param {*} a
     * @param {*} b
     */
    this.filter = function (type, a, b) {
        choice[a.stype] = b.index;
        if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index];
        component.reset();
        append(filter());
        component.saveChoice(choice);
    };
    /**
     * Уничтожить
     */
    this.destroy = function () {
        network.clear();
        movieDetails = {};
    };


    /**
     * Добавить видео
     * @param {Array} items
     */
    function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 100, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element, item_id) {
            // if (element.season) element.title = Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
            // if (!element.season && element.episode) element.title = object.movie.title + ' - ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
            // element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
            if (element.season) {
                element.translate_episode_end = last_episode;
                // element.translate_voice = filter_items.voice[choice.voice];
            }
            var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
            var view = Lampa.Timeline.view(hash);
            var item = Lampa.Template.get('onlines_v1', element);
            var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, filter_items.voice[choice.voice]].join('') : object.movie.original_title + element.title);
            item.addClass('video--stream');
            element.timeline = view;
            item.append(Lampa.Timeline.render(view));
            let quality = element.season ? '' : " / " + element.quality;
            item.find('.online__title').append(Lampa.Timeline.details(view, quality + " / "));
            if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
            item.on('hover:enter', function () {
                choice.last_viewed = item_id;
                if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
                var playlist = [];
                var first = {
                    url: element.url,
                    // quality: element.qualities,
                    subtitles: element.subtitles,
                    selectedSubsIdx: component.getSelectedSubsIdx(element.subtitles),
                    translate: {
                        tracks: element.audios,
                        selectedIdx: component.getSelectedTrackIdx(element.audios)
                    },
                    timeline: element.timeline,
                    title: element.season ? element.title : movieTitle(object) + ' / ' + element.title
                };

                if (element.season) {
                    items.forEach(function (elem, i) {
                        playlist.push({
                            id: i,
                            url: elem.url,
                            // quality: elem.qualities,
                            subtitles: elem.subtitles,
                            selectedSubsIdx: component.getSelectedSubsIdx(elem.subtitles),
                            translate: {
                                tracks: elem.audios,
                                selectedIdx: component.getSelectedTrackIdx(elem.audios)
                            },
                            timeline: elem.timeline,
                            title: elem.title
                        });
                    });
                } else playlist.push(first);
                if (playlist.length > 1) first.playlist = playlist;
                Lampa.Player.play(first);
                Lampa.Player.playlist(playlist);

                if (viewed.indexOf(hash_file) == -1) {
                    viewed.push(hash_file);
                    item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                    Lampa.Storage.set('online_view', viewed);
                }
            });
            component.append(item);
            component.contextmenu({
                item: item,
                view: view,
                viewed: viewed,
                choice: choice,
                hash_file: hash_file,
                element: element,
                file: function file(call) {
                    call({
                        file: element.file
                    });
                }
            });
        });
        component.start(true);
    }
}
