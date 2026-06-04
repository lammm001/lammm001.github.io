

function filmix(component, _object) {
    var network = new Lampa.Reguest();
    var extract = {};
    var results = [];
    var object = _object;
    var embed = 'https://vi1pr.netlify.app/pr/http://filmixapp.cyou/api/v2/';
    var select_title = '';
    var filter_items = {};
    var choice = {
        season: 0,
        voice: 0,
        order: 0,
        voice_name: '',
        last_viewed: ''
    };
    var token = Lampa.Storage.get('filmix_token', '');
    if (!window.filmix) {
        window.filmix = {
            max_qualitie: 720,
            is_max_qualitie: false
        };
    }
    var secret = '';

    // var dev_token = 'user_dev_apk=2.0.1&user_dev_id=1d07ba88e4b45d30&user_dev_name=Xiaomi&user_dev_os=12&user_dev_token=aaaabbbbccccddddeeeeffffaaaabbbb&user_dev_vendor=Xiaomi';
    var dev_token = 'user_dev_apk=2.0.1&user_dev_id=&user_dev_name=Xiaomi&user_dev_os=12&user_dev_token=bc170de3b2cafb09283b936011f054ed&user_dev_vendor=Xiaomi';
    var abuse_token = 'user_dev_apk=2.0.1&user_dev_id=1d07ba88e4b45d30&user_dev_name=Xiaomi&user_dev_os=12&user_dev_token=aaaabbbbccccddddeeeeffffaaaabbbb&user_dev_vendor=Xiaomi';

    /**
     * Начать поиск
     * @param {Object} _object
     */
    this.search = function (_object, kp_id, data) {
        var _this = this;
        if (this.wait_similars && data && data[0] && data[0].is_similars) return this.find(data[0].id);
        object = _object;
        select_title = object.search || movieTitle(object);
        var search_date = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
        var search_year = parseInt((search_date + '').slice(0, 4));
        var orig = object.movie.original_title || object.movie.original_name;
        var clean_title = component.cleanTitle(select_title).replace(/\b(\d\d\d\d+)\b/g, '+$1');
        if (search_year) clean_title = clean_title.replace(new RegExp(' \\+(' + search_year + ')$'), ' $1');
        var url = 'https://vi1pr.netlify.app/pr/https://filmix.tech/api/v2/suggestions';
        url = Lampa.Utils.addUrlComponent(url, 'search_word=' + encodeURIComponent(clean_title));
        network.clear();
        network.timeout(15000);
        network.silent(url, function (json) {
            try {
                if (json.posts.length == 0) component.emptyForQuery(select_title);
                else {
                    var cards = json.posts.filter(function (c) {
                        return !c.year || !search_year || c.year > search_year - 2 && c.year < search_year + 2;
                    });

                    if (cards.length > 1) {
                        var tmp = cards.filter(function (c) {
                            return c.year == search_year;
                        });
                        if (tmp.length) cards = tmp;
                    }

                    if (cards.length > 1) {
                        var _tmp = cards.filter(function (c) {
                            return c.original_name == orig;
                        });

                        if (_tmp.length) cards = _tmp;
                    }

                    if (cards.length > 1) {
                        var _tmp2 = cards.filter(function (c) {
                            return c.title == select_title;
                        });

                        if (_tmp2.length) cards = _tmp2;
                    }

                    if (cards.length == 1) _this.find(cards[0].id);
                    else if (json.length) {
                        _this.wait_similars = true;
                        json.forEach(function (c) {
                            c.type = c.last_serie ? 'serial' : 'film';
                            // c.seasons_count = c.last_episode.season;
                            // c.episodes_count = c.last_episode.episode;
                            // c.translations = c.last_episode.translation;
                            c.is_similars = true;
                        });
                        component.similars(json);
                        component.loading(false);
                    } else component.emptyForQuery(select_title);
                }
            } catch (e) {
                console.log('request', "Error on filmix search: " + e);
                Lampa.Noty.show('Error on filmix search');
                component.emptyForQuery(select_title)
            }
        }, function (a, c) {
            component.empty(network.errorDecode(a, c));
        }
        , false, {
            // dataType: 'json',
            headers: {
                'my_Origin': 'https://filmix.tech',
                'my_Referer': 'https://filmix.tech',
                'my_cookie': 'deleted; deleted; deleted; remember_me=1; x-a-key=sinatra; x-auth=1;',
                'my_User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'x-requested-with':'XMLHttpRequest'
            }
        }
        );
    };

    function searchById(filmixId) {
        var url = embed + 'search';
        url = Lampa.Utils.addUrlComponent(url, 'story=' + encodeURIComponent(clean_title));
        network.clear();
        network.timeout(15000);
        network.silent(url + '&' + dev_token, function (json) {
            try {
                if (json.length == 0) component.emptyForQuery(select_title);
                else {
                    var cards = json.filter(function (c) {
                        if (!c.year && c.alt_name) c.year = parseInt(c.alt_name.split('-').pop());
                        return !c.year || !search_year || c.year > search_year - 2 && c.year < search_year + 2;
                    });

                    if (cards.length > 1) {
                        var tmp = cards.filter(function (c) {
                            return c.year == search_year;
                        });
                        if (tmp.length) cards = tmp;
                    }

                    if (cards.length > 1) {
                        var _tmp = cards.filter(function (c) {
                            return c.original_title == orig;
                        });

                        if (_tmp.length) cards = _tmp;
                    }

                    if (cards.length > 1) {
                        var _tmp2 = cards.filter(function (c) {
                            return c.title == select_title;
                        });

                        if (_tmp2.length) cards = _tmp2;
                    }

                    if (cards.length == 1) _this.find(cards[0].id);
                    else if (json.length) {
                        _this.wait_similars = true;
                        json.forEach(function (c) {
                            c.type = c.last_episode ? 'serial' : 'film';
                            c.seasons_count = c.last_episode.season;
                            c.episodes_count = c.last_episode.episode;
                            c.translations = c.last_episode.translation;
                            c.is_similars = true;
                        });
                        component.similars(json);
                        component.loading(false);
                    } else component.emptyForQuery(select_title);
                }
            } catch (e) {
                console.log('request', "Error on filmix search: " + e);
                Lampa.Noty.show('Error on filmix search');
                component.emptyForQuery(select_title)
            }
        }, function (a, c) {
            component.empty(network.errorDecode(a, c));
        }
        // , false, {
        //     // dataType: 'json',
        //     headers: {
        //         'my_Origin': 'https://filmix.tech',
        //         'my_Referer': 'https://filmix.tech',
        //         'my_User-Agent': 'lampa'
        //     }
        // }
        );
    }

    this.find = function (filmix_id) {
        var url = embed;
        if (!window.filmix.is_max_qualitie && token) {
            window.filmix.is_max_qualitie = true;
            network.clear();
            network.timeout(10000);
            network.silent(url + 'user_profile?' + dev_token, function (found) {
                if (found && found.user_data) {
                    if (found.user_data.is_pro) window.filmix.max_qualitie = 1080;
                    if (found.user_data.is_pro_plus) window.filmix.max_qualitie = 2160;
                }
                end_search(filmix_id);
            });
        } else end_search(filmix_id);

        function end_search(filmix_id, secondCall) {
            network.clear();
            network.timeout(10000);
            // network.silent(url + 'post/' + filmix_id + '?' + dev_token, function (found) {
            //     if (found && Lampa.Arrays.getKeys(found).length && (found.player_links.movie.length || Lampa.Arrays.getKeys(found.player_links.playlist).length)) {
            //         success(found);
            //     } else component.emptyForQuery(select_title);
            // }, function (a, c) {
            //     component.empty(network.errorDecode(a, c));
            // });
            network.silent(url + 'post/' + filmix_id + '?' + (secondCall ? dev_token : abuse_token), function (found) {
                if (found && Object.keys(found).length) {
                    if (!secondCall && checkAbuse(found)) end_search(filmix_id, true); else success(found);
                } else component.emptyForQuery(select_title);
            }, function (a, c) {
                component.empty(network.errorDecode(a, c));
            });
        }
    };
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
        filter();
        extractData(results);
        append(filtred());
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
        filter();
        extractData(results);
        append(filtred());
        component.saveChoice(choice);
    };
    /**
     * Уничтожить
     */
    this.destroy = function () {
        network.clear();
        results = null;
    };

    function checkAbuse(data) {
        var pl_links = data.player_links || {};

        if (pl_links.movie && Object.keys(pl_links.movie).length > 0) {

            for (var ID in pl_links.movie) {
                var file = pl_links.movie[ID];
                var stream_url = file.link || '';

                if (file.translation === 'Заблокировано правообладателем!' && stream_url.indexOf('/abuse_') !== -1) {
                    var found = stream_url.match(/https?:\/\/[^\/]+(\/s\/[^\/]*\/)/);

                    if (found) {
                        secret = '$1' + found[1];
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Успешно, есть данные
     * @param {Object} json
     */
    function success(json) {
        results = json;
        extractData(json);
        filter();
        append(filtred());
        component.loading(false);
    }

    /**
     * Получить информацию о фильме
     * @param {Arrays} data
     */
    function extractData(json) {
        var last_episode = json.last_episode;
        var player_links = json.player_links;
        var _max_quality = window.filmix.max_qualitie;
        if (player_links.playlist && Object.keys(player_links.playlist).length > 0) {
            results.serial = 1;
            results.translations = [];
            results.seasons = [];
            Object.entries(player_links.playlist).forEach(function (seasons) {
                var keys = Math.abs(seasons[0]);
                if (results.seasons.indexOf(keys) == -1) results.seasons.push(keys);
                //console.log('keys', keys, 'season', seasons[1]);
                Object.entries(seasons[1]).forEach(function (translations) {
                    var keyt, translation = translations[0];
                    //console.log('keyt', keyt, 'translation', translation);
                    if (results.translations.indexOf(translation) == -1) {
                        results.translations.push(translation);
                        keyt = results.translations.indexOf(translation);
                        extract[keyt] = {
                            json: [],
                            file: "",
                            translation_id: keyt,
                            translation: translation
                        };
                    } else keyt = results.translations.indexOf(translation);
                    var folder = [];
                    Object.entries(translations[1]).forEach(function (episodes) {
                        var keye = episodes[0],
                            episode = episodes[1];
                        //console.log('keye', keye, 'episode', episode);
                        var qualities = episode.qualities.filter(function (elem) {
                            return parseInt(elem) <= _max_quality && parseInt(elem) !== 0;
                        }).sort(function (a, b) {
                            return b - a;
                        });
                        var qualitie = Math.max.apply(null, qualities);
                        var link = episode.link;
                        if (secret) {
                            link = link.replace(/(https?:\/\/[^\/]+)\/s\/[^\/]*\//, secret);
                        }
                        folder[keye] = {
                            id: keys + '_' + keye,
                            comment: keye + ' ' + Lampa.Lang.translate('torrent_serial_episode') + ' <i>' + qualitie + '</i>',
                            file: link,
                            episode: keye,
                            season: keys,
                            rip: json.rip.split(' ')[0],
                            quality: qualitie,
                            qualities: qualities,
                            translation: keyt, //translation,
                        };
                    });
                    extract[keyt].json[keys] = {
                        id: keys,
                        comment: keys + ' ' + Lampa.Lang.translate('torrent_serial_season'),
                        folder: folder,
                        translation: keyt
                    };
                });
            });
        } else if (player_links.movie && player_links.movie.length > 0) {
            results.serial = 0;
            Object.entries(player_links.movie).forEach(function (translations) {
                var translation = translations[0],
                    movie = translations[1];
                //console.log('translation', translation, 'movie', movie);
                var qualities = movie.link.match(/.+\[(.+[\d]),?\].+/i);
                if (qualities) qualities = qualities[1].split(",").filter(function (elem) {
                    return parseInt(elem) <= _max_quality && parseInt(elem) !== 0;
                }).sort(function (a, b) {
                    return b - a;
                });
                var qualitie = Math.max.apply(null, qualities);
                var link = movie.link;
                if (secret) {
                    link = link.replace(/(https?:\/\/[^\/]+)\/s\/[^\/]*\//, secret);
                }
                extract[translation] = {
                    json: {},
                    file: link,
                    translation: movie.translation,
                    rip: json.rip.split(' ')[0],
                    quality: qualitie,
                    qualities: qualities
                };
            });
        }
    }

    /**
     * Найти поток
     * @param {Object} element
     * @param {Int} max_quality
     * @returns string
     */
    function getFile(element, max_quality) {
        var translat = extract[element.translation];
        var id = element.season + '_' + element.episode;
        var file = '';
        var eps = {};
        var quality = false;
        if (translat) {
            if (element.season)
                for (var i in translat.json) {
                    var elem = translat.json[i];
                    if (elem.folder)
                        for (var f in elem.folder) {
                            var folder = elem.folder[f];
                            if (folder.id == id) {
                                eps = folder;
                                break;
                            }
                        } else {
                        if (elem.id == id) {
                            eps = elem;
                            break;
                        }
                    }
                } else eps = translat;
        }
        file = eps.file;
        if (file) {
            quality = {};
            if (eps.qualities) {
                eps.qualities.forEach(function (q) {
                    var files = element.season ? file.replace(/%s(\.mp4)/i, q + "$1") : file.replace(/\[[\d,]*\](\.mp4)/i, q + "$1");
                    quality[q + 'p'] = files;
                });
                file = element.season ? file.replace(/%s(\.mp4)/i, eps.qualities[0] + "$1") : file.replace(/\[[\d,]*\](\.mp4)/i, eps.qualities[0] + "$1");
            }
            var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
            if (quality[preferably]) file = quality[preferably];
        }
        return {
            file: file,
            quality: quality
        };
    }

    /**
     * Построить фильтр
     */
    function filter() {
        filter_items = {
            season: [],
            voice: [],
            order: [],
            voice_info: []
        };
        if (results.serial == 1) {
            component.order.forEach(function (i) {
                filter_items.order.push(i.title);
            });
            results.seasons.forEach(function (season) {
                filter_items.season.sort(function (a, b) {
                    return a - b;
                }).push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (season));
            });
            if (!filter_items.season[choice.season]) choice.season = 0;

            results.translations.forEach(function (translation, keyt) {
                var season = filter_items.season[choice.season].split(' ').pop();
                if (extract[keyt].json[season]) {
                    if (filter_items.voice.indexOf(translation) == -1) {
                        filter_items.voice[keyt] = translation;
                        filter_items.voice_info[keyt] = {
                            id: keyt
                        };
                    }
                }
            });

            if (filter_items.voice_info.length > 0 && !filter_items.voice_info[choice.voice]) {
                choice.voice = undefined;
                filter_items.voice_info.forEach(function (voice_info) {
                    if (choice.voice == undefined) choice.voice = voice_info.id;
                });
            }
        }
        component.filter(filter_items, choice);
    }

    /**
     * Отфильтровать файлы
     * @returns array
     */
    function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');
        if (results.player_links.playlist && Object.keys(results.player_links.playlist).length > 0) {
            for (var keym in extract) {
                var serial = extract[keym];
                for (var keye in serial.json) {
                    var episode = serial.json[keye];
                    if (episode.id == filter_data.season + 1) {
                        episode.folder.forEach(function (media) {
                            if (media.translation == filter_items.voice_info[filter_data.voice].id) {
                                filtred.push({
                                    episode: parseInt(media.episode),
                                    season: media.season,
                                    title: media.episode + (media.title ? ' - ' + media.title : ''),
                                    quality: media.rip + ' - ' + media.quality + 'p ',
                                    translation: media.translation
                                });
                            }
                        });
                    }
                }
            }
        } else if (results.player_links.movie && results.player_links.movie.length > 0) {
            for (var keyt in extract) {
                var movie = extract[keyt];
                filtred.push({
                    title: movie.translation,
                    quality: movie.rip + ' - ' + movie.quality + 'p ',
                    translation: keyt
                });
            }
        }
        return component.order[filter_data.order].id == 'invers' ? filtred.reverse() : filtred;
    }

    /**
     * Добавить видео
     * @param {Array} items
     */
    function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 100, []);
        var last_episode = component.getLastEpisode(items);
        items.forEach(function (element, item_id) {
            if (element.season) element.title = Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
            if (!element.season && element.episode) element.title = movieTitle(object) + ' - ' + Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.title;
            element.info = element.season ? ' / ' + filter_items.voice[choice.voice] : '';
            if (element.season) {
                element.translate_episode_end = last_episode;
                element.translate_voice = filter_items.voice[choice.voice];
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
                var extra = getFile(element, element.quality);
                if (extra.file) {
                    var playlist = [];
                    var first = {
                        url: extra.file,
                        quality: extra.quality,
                        timeline: element.timeline,
                        title: element.season ? element.title : movieTitle(object) + ' / ' + element.title
                    };

                    if (element.season) {
                        items.forEach(function (elem, i) {
                            var ex = getFile(elem, elem.quality);
                            playlist.push({
                                id: i,
                                url: ex.file,
                                quality: ex.quality,
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
                } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
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
                    call(getFile(element, element.quality));
                }
            });
        });
        component.start(true);
    }
}

