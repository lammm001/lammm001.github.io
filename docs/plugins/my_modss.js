(function () {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _readOnlyError(name) {
    throw new TypeError("\"" + name + "\" is read-only");
  }

  function Zombie(_component, _params) {
    var component = _component;
    var params = _params;
    var network = new Lampa.Reguest();
    var choice = {
      season: 0,
      voice: 0,
      last_viewed: ''
    };
    var seasons = [];
    var origTitle;

    this.search = function (_params, kinopoiskId) {
      origTitle = params.movie.original_title || params.movie.original_name;
      network.silent('https://apilm.kinogram.best/embed/kp/' + kinopoiskId, function onComplete(respData) {
        try {
          var respDataFixed = respData.replace(/\n/g, '');
          var match = respDataFixed.match(/makePlayer\((\{.*?\})\);/);

          if (!match) {
            Lampa.Noty.show('Video not found');
            component.loading(false);
            return;
          }

          var obj = eval('(' + match[1] + ')');
          var jsonStr = JSON.stringify(obj);
          var videoDetailsJson = JSON.parse(jsonStr);

          if (videoDetailsJson.playlist) {
            seasons = videoDetailsJson.playlist.seasons;
            getEpisodes();
          } else {
            var videoItem = new VideoItem();
            videoItem.title = videoDetailsJson.title; // videoItem.quality = '1080p'

            videoItem.info = videoDetailsJson.source.audio.names.join(', ');
            videoItem.url = videoDetailsJson.source.hls;
            videoItem.subtitles = videoDetailsJson.source.cc ? videoDetailsJson.source.cc.map(function (subs) {
              return {
                label: subs.name,
                url: subs.url
              };
            }) : false;
            videoItem.audioTracks = videoDetailsJson.source.audio.names.map(function (name) {
              return {
                language: name
              };
            });
            showVideoList([videoItem]);
          }
        } catch (e) {
          var msg = "Error parsing searchResponse: ";
          console.log('modss', msg + e);
          Lampa.Noty.show(msg);
          component.loading(false);
        }
      }, function onError(a, c) {
        var msg = "Error searching video: ";
        console.log('modss', msg + network.errorDecode(a, c));
        Lampa.Noty.show(msg);
        component.loading(false);
      }, null, {
        // headers: {
        //     'my_User-Agent': 'lampa'
        // },
        dataType: 'text'
      });
    };

    this.extendChoice = function (saved) {
      Lampa.Arrays.extend(choice, saved, true);
    };

    function getEpisodes() {
      // if(choice.season===0){
      //     choice.season = 1
      // }
      var season = seasons.find(function (s) {
        return s.season === choice.season + 1;
      });
      showVideoList(season.episodes.map(function (episode) {
        var videoItem = new VideoItem();
        videoItem.seasonNum = season.season;
        videoItem.episodeNum = episode.episode;
        videoItem.title = 'S' + videoItem.seasonNum + ' / E' + videoItem.episodeNum; // videoItem.quality = '1080p'

        videoItem.subtitles = episode.cc ? episode.cc.map(function (subs) {
          return {
            label: subs.name,
            url: subs.url
          };
        }) : false;
        videoItem.audioTracks = episode.audio.names.map(function (name) {
          return {
            language: name
          };
        });
        videoItem.url = episode.hls;
        videoItem.info = '';
        return videoItem;
      }));
    }
    /**
     * Сброс фильтра
     */


    this.reset = function () {
      component.reset();
      choice = {
        season: 0
      };
      component.loading(true);
      getEpisodes();
      component.saveChoice(choice);
    };
    /**
     * Применить фильтр
     * @param {*} type
     * @param {*} a
     * @param {*} b
     */


    this.filter = function (type, a, b) {
      choice[a.stype] = b.index; // if (a.stype == 'voice') choice.voice_name = filter_items.voice[b.index]

      component.reset();
      component.loading(true);
      getEpisodes();
      buildFilter();
      component.saveChoice(choice);
      setTimeout(component.closeFilter, 10);
    };

    this.destroy = function () {
      network.clear();
      params = null;
      seasons = null;
    };

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

      var filter_items = {
        season: seasons.sort(compare).map(function (s) {
          return '' + s.season;
        }),
        voice: []
      };
      if (!filter_items.season[choice.season - 1]) choice.season = 0;
      component.filter(filter_items, choice);
    }
    /**
     *
     * @param {VideoItem[]} videoItems
     */


    function showVideoList(videoItems) {
      buildFilter();
      component.reset();
      videoItems.forEach(function (videoItem) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var hash = Lampa.Utils.hash(videoItem.seasonNum ? [videoItem.seasonNum, videoItem.episodeNum, origTitle].join('') : origTitle);
        var view = Lampa.Timeline.view(hash);
        var element = Lampa.Template.get('onlines_v1', videoItem);
        element.timeline = view;
        element.append(Lampa.Timeline.render(view));

        if (Lampa.Timeline.details) {
          element.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
        }

        if (viewed.indexOf(hash) !== -1) element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
        videoItem.timeline = element.timeline;
        element.on('hover:enter', function () {
          choice.last_viewed = videoItem.episodeNum;
          if (params.movie.id) Lampa.Favorite.add('history', params.movie, 100);
          videoItem.playlist = videoItems;
          videoItem.selectedSubsIdx = component.getSelectedSubsIdx(videoItem.subtitles);
          videoItem.translate = {
            tracks: videoItem.audioTracks,
            selectedIdx: component.getSelectedTrackIdx(videoItem.audioTracks)
          };
          Lampa.Player.play(videoItem);
          Lampa.Player.playlist(videoItems); // if (videoItem.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(videoItem.subtitles)

          if (viewed.indexOf(hash) == -1) {
            viewed.push(hash);
            element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
            Lampa.Storage.set('online_view', viewed);
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
      });
      component.start(true);
      component.loading(false);
    }

    var VideoItem = /*#__PURE__*/_createClass(function VideoItem() {
      _classCallCheck(this, VideoItem);

      _defineProperty(this, "seasonNum", void 0);

      _defineProperty(this, "episodeNum", void 0);

      _defineProperty(this, "subtitles", void 0);

      _defineProperty(this, "selectedSubsIdx", void 0);

      _defineProperty(this, "info", void 0);

      _defineProperty(this, "videoId", void 0);

      _defineProperty(this, "title", void 0);

      _defineProperty(this, "url", void 0);

      _defineProperty(this, "timeline", void 0);

      _defineProperty(this, "quality", void 0);

      _defineProperty(this, "qualitys", void 0);

      _defineProperty(this, "playlist", void 0);

      _defineProperty(this, "audioTracks", void 0);
    });
  }

  function Z01VeoVeo(_component, _params) {
    var component = _component;
    var params = _params;
    var network = new Lampa.Reguest();
    var choice = {
      season: 0,
      voice: 0,
      voice_name: '',
      seasonName: '',
      last_viewed: ''
    };
    var seasons = [];
    var voices = {};
    var filter_items = {};
    var isSerial;
    var origTitle;

    this.search = function (_params, kinopoiskId) {
      var title = params.search || params.search_one || movieTitle(params);
      origTitle = params.movie.original_title || params.movie.original_name;
      var url = 'https://z01.online/lite/veoveo?';
      var search_date = params.search_date || params.movie.release_date || params.movie.first_air_date || params.movie.last_air_date || '0000';
      var search_year = parseInt((search_date + '').slice(0, 4));

      if (kinopoiskId) {
        url += '&kinopoisk_id=' + kinopoiskId;
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
            voices = extractVoicesJsonFromHtml(respData);

            if (choice.voice_name) {
              var matches = stringSimilarity.findBestMatch(choice.voice_name, voices.map(function (voice) {
                return voice.name;
              }));

              if (matches.bestMatch.rating > 0.1) {
                choice.voice = matches.bestMatchIndex;
              }
            }

            if (!voices.length) {
              getSeasons(respData);
            } else {
              getSeasons();
            }
          } else {
            var items = extractJsonFromHtml(respData);
            showVideoList(items.map(function (item) {
              var videoItem = new VideoItem();
              videoItem.title = item.title;
              videoItem.info = '';
              videoItem.quality = '1080p';
              videoItem.url = item.url;
              return videoItem;
            }));
          }
        } catch (e) {
          var msg = "Error parsing searchResponse: ";
          console.log('modss', msg + e.stack);
          Lampa.Noty.show(msg);
          component.loading(false);
        }
      }, function onError(a, c) {
        var msg = "Error searching video request. ";
        console.log('modss', msg + network.errorDecode(a, c));
        Lampa.Noty.show(msg);
        component.loading(false);
      }, null, {
        dataType: 'text'
      });
    };

    this.extendChoice = function (saved) {
      Lampa.Arrays.extend(choice, saved, true);
    };

    function getSeasons(seasonsData) {
      if (seasonsData) {
        seasons = extractSeasonsJsonFromHtml(seasonsData);
        getEpisodes();
        return;
      }

      var voice = voices[choice.voice];

      if (!voice) {
        voice = voices[0];
      }

      network.silent(voice.url, function onComplete(respData) {
        try {
          seasons = extractSeasonsJsonFromHtml(respData);
          getEpisodes();
        } catch (e) {
          var msg = "Error parsing seasons. ";
          console.log('modss', msg + e.stack);
          Lampa.Noty.show(msg);
          component.loading(false);
        }
      }, function onError(a, c) {
        var msg = "Error on getSeasons request. ";
        console.log('modss', msg + network.errorDecode(a, c));
        Lampa.Noty.show(msg);
        component.loading(false);
      }, null, {
        dataType: 'text'
      });
    }

    function getEpisodes() {
      if (choice.seasonName) {
        var matches = stringSimilarity.findBestMatch(choice.seasonName, seasons.map(function (s) {
          return s.name;
        }));

        if (matches.bestMatch.rating > 0.1) {
          choice.season = matches.bestMatchIndex;
        }
      }

      var season = seasons[choice.season];

      if (!season) {
        seasons[0], _readOnlyError("season");
      }

      network.silent(season.url, function onComplete(respData) {
        try {
          var episodes = extractEpisodesJsonFromHtml(respData);
          showVideoList(episodes.map(function (item, index) {
            var _season$name$match$, _season$name$match, _item$name$match$, _item$name$match;

            var videoItem = new VideoItem();
            videoItem.title = item.name;
            videoItem.info = '';
            videoItem.seasonNum = (_season$name$match$ = (_season$name$match = season.name.match(/\d+/)) === null || _season$name$match === void 0 ? void 0 : _season$name$match[0]) !== null && _season$name$match$ !== void 0 ? _season$name$match$ : season.name;
            videoItem.episodeNum = (_item$name$match$ = (_item$name$match = item.name.match(/\d+/)) === null || _item$name$match === void 0 ? void 0 : _item$name$match[0]) !== null && _item$name$match$ !== void 0 ? _item$name$match$ : index;
            videoItem.url = item.url;
            return videoItem;
          }));
        } catch (e) {
          var msg = "Error parsing episodes. ";
          console.log('modss', msg + e.stack);
          Lampa.Noty.show(msg);
          component.loading(false);
        }
      }, function onError(a, c) {
        var msg = "Error on getEpisodes request. ";
        console.log('modss', msg + network.errorDecode(a, c));
        Lampa.Noty.show(msg);
        component.loading(false);
      }, null, {
        dataType: 'text'
      });
    }
    /**
     * Сброс фильтра
     */


    this.reset = function () {
      component.reset();
      choice = {
        season: 0,
        seasonName: '',
        voice: 0,
        voice_name: ''
      };
      component.loading(true);
      getSeasons();
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
      if (a.stype == 'season') choice.seasonName = filter_items.season[b.index];
      component.reset();
      component.loading(true);
      getSeasons();
      buildFilter();
      component.saveChoice(choice);
      setTimeout(component.closeFilter, 10);
    };

    this.destroy = function () {
      network.clear();
      params = null;
      seasons = null;
    };

    function buildFilter() {
      if (isSerial) {
        filter_items = {
          season: seasons.map(function (season) {
            return '' + season.name;
          }),
          voice: voices.map(function (voice) {
            return voice.name;
          })
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
      buildFilter();
      component.reset();
      videoItems.forEach(function (videoItem) {
        var viewed = Lampa.Storage.cache('online_view', 5000, []);
        var hash = Lampa.Utils.hash(videoItem.seasonNum ? [videoItem.seasonNum, videoItem.episodeNum, origTitle].join('') : origTitle);
        var view = Lampa.Timeline.view(hash);
        var element = Lampa.Template.get('onlines_v1', videoItem);
        element.timeline = view;
        element.append(Lampa.Timeline.render(view));

        if (Lampa.Timeline.details) {
          element.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
        }

        if (viewed.indexOf(hash) !== -1) element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
        videoItem.timeline = element.timeline;
        videoItem.quality = videoItem.qualitys;
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
          } else playlist.push(first); // if (Platform.is('android')) {
          //     Lampa.Player.runas('android');
          // }


          Lampa.Player.play(first);
          Lampa.Player.playlist(playlist); //
          // videoItem.playlist = videoItems
          //                 Lampa.Player.play(videoItem);
          //                 Lampa.Player.playlist(videoItems)
          // if (videoItem.subtitles && Lampa.Player.subtitles) Lampa.Player.subtitles(videoItem.subtitles)

          if (viewed.indexOf(hash) == -1) {
            viewed.push(hash);
            element.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
            Lampa.Storage.set('online_view', viewed);
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
      });
      component.start(true);
      component.loading(false);
    }

    function movieTitle(object) {
      return object.movie.title = object.movie.name || object.movie.original_title || object.movie.original_name || '';
    }

    function extractJsonFromHtml(htmlString) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      var items = doc.querySelectorAll('[data-json]');
      var result = [];
      items.forEach(function (item) {
        try {
          var jsonStr = item.getAttribute('data-json');
          var parsed = JSON.parse(jsonStr);
          result.push(parsed);
        } catch (e) {
          console.warn('Failed to parse data-json:', e);
        }
      });
      return result;
    }

    function extractVoicesJsonFromHtml(htmlString) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      var divs = doc.querySelectorAll('.videos__button');
      return Array.from(divs).map(function (div) {
        var dataJson = JSON.parse(div.getAttribute('data-json'));
        return {
          url: dataJson.url,
          name: div.textContent.trim()
        };
      });
    }

    function extractSeasonsJsonFromHtml(htmlString) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      var divs = doc.querySelectorAll('.videos__season');
      return Array.from(divs).map(function (div) {
        var dataJson = JSON.parse(div.getAttribute('data-json'));
        return {
          url: dataJson.url,
          name: div.textContent.trim()
        };
      });
    }

    function extractEpisodesJsonFromHtml(htmlString) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(htmlString, 'text/html');
      var divs = doc.querySelectorAll('.videos__movie');
      return Array.from(divs).map(function (div) {
        var dataJson = JSON.parse(div.getAttribute('data-json'));
        return {
          url: dataJson.url,
          name: div.textContent.trim()
        };
      });
    }

    var VideoItem = /*#__PURE__*/_createClass(function VideoItem() {
      _classCallCheck(this, VideoItem);

      _defineProperty(this, "seasonNum", void 0);

      _defineProperty(this, "episodeNum", void 0);

      _defineProperty(this, "subtitles", void 0);

      _defineProperty(this, "selectedSubsIdx", void 0);

      _defineProperty(this, "info", void 0);

      _defineProperty(this, "videoId", void 0);

      _defineProperty(this, "title", void 0);

      _defineProperty(this, "pageUrl", void 0);

      _defineProperty(this, "url", void 0);

      _defineProperty(this, "timeline", void 0);

      _defineProperty(this, "quality", void 0);

      _defineProperty(this, "playlist", void 0);

      _defineProperty(this, "audioTracks", void 0);
    });
  }

  (function () {

    var API = 'https://cr1.lammm.deno.net/http://api.lampa.stream/',
        cards,
        ping_auth;
    var Modss = {
      init: function init() {
        this.buttBack();
        var balansers = [{
          from: 'VideoCDN',
          to: 'videocdn'
        }, {
          from: 'HDRezka',
          to: 'rezka'
        }, {
          from: 'rezka',
          to: 'rezka'
        }, {
          from: 'Kinobase',
          to: 'kinobase'
        }, {
          from: 'Collaps',
          to: 'collaps'
        }, {
          from: 'Filmix',
          to: 'filmix'
        }, {
          from: 'CDNmovies',
          to: 'cdnmovies'
        }, {
          from: 'HDVB',
          to: 'hdvb'
        }, {
          from: 'KinoTochka',
          to: 'kinotochka'
        }, {
          from: 'Original',
          to: 'original'
        }, {
          from: 'KinoKrad',
          to: 'kinokrad'
        }, {
          from: 'SeasonVar',
          to: 'seasonvar'
        }, {
          from: 'UAKino',
          to: 'uakino'
        }, {
          from: 'Pub',
          to: 'pub'
        }, {
          from: 'Kodik',
          to: 'kodik'
        }];
        if (Lampa.Storage.get('move_complite') !== true) balansers.forEach(function (balanser) {
          var from = Lampa.Storage.get('online_choice_' + balanser.from, '{}');
          var to = Lampa.Storage.get('online_choice_' + balanser.to, '{}');

          for (var i in from) {
            to[i] = from[i];
          }

          Lampa.Storage.set('online_choice_' + balanser.to, to);
          Lampa.Storage.set('move_complite', true);
        });
      },
      online: function online(card) {
        // let onlineCard = Lampa.Storage.cache('online_cards', 3000, {})[card.id] || {};
        // var data = Lampa.Storage.cache('online_choice_' + onlineCard.balanser, 500, {});
        // var last_s = (card.number_of_seasons && data[card.id]) ? ('S' + (data[card.id].season + 1) + ' - ' + (data[card.id].last_viewed + 1) + ' ' + Lampa.Lang.translate('torrent_serial_episode').toLowerCase()) : '';
        // var title = Lampa.Storage.field('online_continued') && data[card.id] ? '#{title_online_continue} ' : '#{title_online}';
        var title = '#{title_online}';
        Math.round(new Date(card && (card.release_date || card.first_air_date)).getTime() / 1000.0);
        Math.round(new Date().getTime() / 1000.0);
        if (
        /*reliase < nowDate && */
        !$('.view--onlines_v1', Lampa.Activity.active().activity.render()).length && Lampa.Storage.field('mods_onl')) $('.view--torrent', Lampa.Activity.active().activity.render()).before(Lampa.Lang.translate("<div data-subtitle='Nikolai4 mods_v2.5 (12 Balansers)' class='full-start__button selector view--onlines_v1'><svg height='1792' fill='currentColor' viewBox='0 0 1792 1792' width='1792' xmlns='http://www.w3.org/2000/svg'><path d='M896 128q209 0 385.5 103t279.5 279.5 103 385.5-103 385.5-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103zm384 823q32-18 32-55t-32-55l-544-320q-31-19-64-1-32 19-32 56v640q0 37 32 56 16 8 32 8 17 0 32-9z'/></svg><span>" + title + "</span></div>"));
        if (!Lampa.Storage.field('mods_onl')) $('.view--onlines_v1', Lampa.Activity.active().activity.render()).remove();
        $('.view--onlines_v1', Lampa.Activity.active().activity.render()).unbind('hover:enter click.hover').on('hover:enter click.hover', function () {
          // if (card.number_of_seasons && data[card.id] && Lampa.Storage.field('online_continued'))
          //     Lampa.Select.show({
          //         title: Lampa.Lang.translate('title_action'),
          //         items: [{
          //             title: Lampa.Lang.translate('title_online_continue') + '? ' + last_s,
          //             yes: true
          //         }, {
          //             title: Lampa.Lang.translate('settings_param_no')
          //         }],
          //         onBack: function onBack() {
          //             Lampa.Select.hide();
          //             Lampa.Controller.toggle('content');
          //         },
          //         onSelect: function onSelect(a) {
          //             if (a.yes) {
          //                 data[card.id].continued = true;
          //                 Lampa.Storage.set('online_choice_' + balanser[card.id], data);
          //             }
          //             openOnline();
          //         }
          //     }); else
          openOnline();

          function openOnline() {
            Lampa.Activity.push({
              url: '',
              title: Lampa.Lang.translate('title_online') + " MODS's",
              component: 'onlines_v1',
              search: '',
              search_one: card.title,
              search_two: card.original_title,
              movie: card,
              page: 1
            });
          }
        });
        $('.view--onlines_v1 span', Lampa.Activity.active().activity.render()).text(Lampa.Lang.translate(title));
      },
      buttBack: function buttBack(pos) {
        if ((/iPhone|iPad|iPod|android|x11/i.test(navigator.userAgent) || Lampa.Platform.is('android') && window.innerHeight < 1080) && Lampa.Storage.get('mods_butt_back')) {
          $('body').find('.elem-mobile-back').remove();
          var position = Lampa.Storage.field('mods_butt_pos') == 'left' ? 'left: 0;transform: scaleX(-1);' : 'right: 0;';
          $('body').append('<div class="elem-mobile-back"><style>.elem-mobile-back {' + position + 'position: fixed;z-index:99999;top: 50%;width: 3em;height: 6em;background-image: url(../icons/player/prev.svg);background-repeat: no-repeat;background-position: 100% 50%;-webkit-background-size: contain;-moz-background-size: contain;-o-background-size: contain;background-size: contain;margin-top: -3em;font-size: .72em;display: block}</style><svg width="131" height="262" viewBox="0 0 131 262" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M131 0C58.6507 0 0 58.6507 0 131C0 203.349 58.6507 262 131 262V0Z" fill="white"/><path d="M50.4953 125.318C50.9443 124.878 51.4313 124.506 51.9437 124.183L86.2229 90.4663C89.5671 87.1784 94.9926 87.1769 98.3384 90.4679C101.684 93.7573 101.684 99.0926 98.3384 102.385L68.8168 131.424L98.4907 160.614C101.836 163.904 101.836 169.237 98.4907 172.531C96.817 174.179 94.623 175 92.4338 175C90.2445 175 88.0489 174.179 86.3768 172.531L51.9437 138.658C51.4313 138.335 50.9411 137.964 50.4953 137.524C48.7852 135.842 47.9602 133.626 48.0015 131.421C47.9602 129.216 48.7852 127.002 50.4953 125.318Z" fill="black"/></svg></div>');
          $(".elem-mobile-back").on("click", function () {
            Lampa.Activity.back();
          });
        }
      },
      last_view: function last_view(data) {
        var episodes = Lampa.TimeTable.get(data);
        var viewed;
        episodes.forEach(function (ep) {
          var hash = Lampa.Utils.hash([ep.season_number, ep.episode_number, data.original_title].join(''));
          var view = Lampa.Timeline.view(hash);
          if (view.percent) viewed = {
            ep: ep,
            view: view
          };
        });

        if (viewed) {
          var ep = viewed.ep.episode_number;
          var se = viewed.ep.season_number;
          var last_view = 'S' + se + ':E' + ep;

          if ($('body').find('.full-start__buttons').length) {
            $('.timeline, .card--last_view').remove();
            $('body').find('.full-start__poster').append("<div class='card--last_view' style='top:0.6em;right: -.5em;position: absolute;background: #168FDF;color: #fff;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'><div style='float:left;margin:-5px 0 -4px -4px' class='card__icon icon--history'></div>" + last_view + "</div>").parent().append('<div class="timeline" style="position:relative;"></div>');
            $('body').find('.timeline').append(Lampa.Timeline.render(viewed.view));
          }

          if ($('body').find('.filter--sort').length) $('body').find('.files__left .time-line, .card--last_view').remove();
        } else $('body').find('.timeline,.card--last_view').remove();

        if ($('body').find('.online').length == 0) $('.card--new_ser,.card--viewed').remove();
      },
      serialInfo: function serialInfo(card) {
        if (Lampa.Storage.field('mods_serial_info') && card.source == 'tmdb' && card.seasons && card.last_episode_to_air) {
          var last_seria = card.last_episode_to_air.episode_number;
          var last_seria_inseason = card.last_episode_to_air.season_number;
          card.last_episode_to_air.episode_number;
          var count_eps_last_seas;
          var new_ser;
          var seasons = card.seasons;
          this.last_view(card);
          seasons.forEach(function (eps) {
            if (eps.season_number == last_seria_inseason) count_eps_last_seas = eps.episode_count;
          });

          if (card.next_episode_to_air) {
            var add_ = '<b>' + last_seria;
            var notices = Lampa.Storage.get('account_notice', []).filter(function (n) {
              return n.card_id == card.id;
            });

            if (notices.length) {
              var notice = notices[0];
              var episod_new = JSON.parse(notice.data).card.seasons;
              if (Lampa.Utils.parseTime(notice.date).full == Lampa.Utils.parseTime(Date.now()).full) add_ = '#{season_new} <b>' + episod_new[last_seria_inseason];
            }

            new_ser = add_ + '</b> #{torrent_serial_episode} #{season_from} ' + count_eps_last_seas + ' - S' + last_seria_inseason;
          } else new_ser = last_seria_inseason + ' #{season_ended}';

          if (!$('.card--new_seria', Lampa.Activity.active().activity.render()).length) {
            if (window.innerWidth > 585) $('.full-start__poster', Lampa.Activity.active().activity.render()).append("<div class='card--new_seria' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;bottom:.6em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>" + Lampa.Lang.translate(new_ser) + "</div>");else $('.full-start__tags', Lampa.Activity.active().activity.render()).append('<div class="full-start__tag card--new_seria"><img src="./img/icons/menu/movie.svg" /> <div>' + Lampa.Lang.translate(new_ser) + '</div></div>');
          }
        }
      },
      rating_kp_imdb: function rating_kp_imdb(card) {
        var params = {
          movie: card.title,
          id: card.id,
          url_kp: "https://cr1.lammm.deno.net/http://kinopoiskapiunofficial.tech/",
          headers: {
            'X-API-KEY': '2a4a0808-81a3-40ae-b0d3-e11335ede616'
          },
          cache_time: 60 * 60 * 24 * 1000 //86400000 сек = 1день Время кэша в секундах

        };
        if (Lampa.Storage.field('mods_rating') && $('.rate--kp', Lampa.Activity.active().activity.render()).hasClass('hide') && !$('.wait_rating', Lampa.Activity.active().activity.render()).length) getRating();

        function getRating() {
          var network = new Lampa.Reguest();

          var movieRating = _getCache(params.id);

          $('.info__rate', Lampa.Activity.active().activity.render()).after('<div style="width:2em;margin-top:1em;margin-right:1em" class="wait_rating"><div class="broadcast__scan"><div></div></div><div>');

          if (movieRating) {
            return _showRating(movieRating[params.id]);
          } else {
            var relise = (card.number_of_seasons ? card.first_air_date : card.release_date) || '0000';
            var year = parseInt((relise + '').slice(0, 4));
            /*network.clear();
            network.timeout(5000);
            network.silent(params.url_kp + 'api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(params.movie) +' '+year, function(json) {
            if(json.films.length) {
            var id = json.films[0].filmId;
            network.clear();
            network.timeout(5000);
            network.silent(params.url_kp + 'api/v2.2/films/' + id, function(data) {
            movieRating = _setCache(params.id, {
            kp: data.ratingKinopoisk,
            imdb: data.ratingImdb,
            timestamp: new Date().getTime()
            }); // Кешируем данные
            return _showRating(movieRating, params.id);
            }, function(a, c) {
            Lampa.Noty.show(network.errorDecode(a, c));
            }, false, {
            headers: params.headers
            });
            } else {
            movieRating = _setCache(params.id, {
            kp: 0,
            imdb: 0,
            timestamp: new Date().getTime()
            }); // Кешируем данные
            return _showRating(movieRating);
            }
            }, function(a, c) {
            kp_rating();
            }, false, {
            headers: params.headers
            });
            */

            network.clear();
            network.timeout(5000);
            network.silent(API + 'kp/' + encodeURIComponent(params.movie) + ' ' + year, function (json) {
              if (json.films.length) {
                var id = json.films[0].filmId;
                network.clear();
                network.timeout(5000);
                network.silent(API + 'kp_Id/' + id, function (data) {
                  movieRating = _setCache(params.id, {
                    kp: data.kp_rating,
                    imdb: data.imdb_rating,
                    timestamp: new Date().getTime()
                  }); // Кешируем данные

                  return _showRating(movieRating);
                }, function (a, c) {
                  Lampa.Noty.show(network.errorDecode(a, c));
                });
              } else {
                movieRating = _setCache(params.id, {
                  kp: 0,
                  imdb: 0,
                  timestamp: new Date().getTime()
                }); // Кешируем данные

                return _showRating(movieRating);
              }
            }, function (a, c) {
              Lampa.Noty.show('Рейтинг KP   ' + network.errorDecode(a, c));
            });
          }
        }

        function _getCache(movie) {
          var timestamp = new Date().getTime();
          var cache = Lampa.Storage.cache('kp_rating', 500, {}); //500 это лимит ключей

          if (cache[movie]) {
            if (timestamp - cache[movie].timestamp > params.cache_time) {
              // Если кеш истёк, чистим его
              delete cache[movie];
              Lampa.Storage.set('kp_rating', cache);
              return false;
            }
          } else return false;

          return cache;
        }

        function _setCache(movie, data) {
          var timestamp = new Date().getTime();
          var cache = Lampa.Storage.cache('kp_rating', 500, {}); //500 это лимит ключей

          if (!cache[movie]) {
            cache[movie] = data;
            Lampa.Storage.set('kp_rating', cache);
          } else {
            if (timestamp - cache[movie].timestamp > params.cache_time) {
              data.timestamp = timestamp;
              cache[movie] = data;
              Lampa.Storage.set('kp_rating', cache);
            } else data = cache[movie];
          }

          return data;
        }

        function _showRating(data, movie) {
          if (data) {
            var kp_rating = !isNaN(data.kp) && data.kp !== null ? parseFloat(data.kp).toFixed(1) : '0.0';
            var imdb_rating = !isNaN(data.imdb) && data.imdb !== null ? parseFloat(data.imdb).toFixed(1) : '0.0';
            $('.wait_rating', Lampa.Activity.active().activity.render()).remove();
            $('.rate--imdb', Lampa.Activity.active().activity.render()).removeClass('hide').find('> div').eq(0).text(imdb_rating);
            $('.rate--kp', Lampa.Activity.active().activity.render()).removeClass('hide').find('> div').eq(0).text(kp_rating);
          }
        }
      }
    };
    var Filmix = {
      network: new Lampa.Reguest(),
      api_url: 'https://cr1.lammm.deno.net/http://filmixapp.cyou/api/v2/',
      user_dev: '?user_dev_apk=1.1.6&user_dev_id=' + Lampa.Utils.uid(16) + '&user_dev_name=Xiaomi&user_dev_os=11&user_dev_vendor=Xiaomi&user_dev_token=',
      add_new: function add_new() {
        var user_code = '';
        var user_token = '';
        var modal = $('<div><div class="broadcast__text">' + Lampa.Lang.translate('filmix_modal_text') + '</div><div class="broadcast__device selector" style="text-align: center">Ожидаем код...</div><br><div class="broadcast__scan"><div></div></div></div></div>');
        Lampa.Modal.open({
          title: '',
          html: modal,
          onBack: function onBack() {
            Lampa.Modal.close();
            Lampa.Controller.toggle('settings_component');
            clearInterval(ping_auth);
          },
          onSelect: function onSelect() {
            Lampa.Utils.copyTextToClipboard(user_code, function () {
              Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_secuses'));
            }, function () {
              Lampa.Noty.show(Lampa.Lang.translate('filmix_copy_fail'));
            });
          }
        });
        ping_auth = setInterval(function () {
          Filmix.checkPro(user_token, function () {
            Lampa.Modal.close();
            clearInterval(ping_auth);
            Lampa.Storage.set("filmix_token", user_token);
            $('[data-name="filmix_token"] .settings-param__value').text(user_token);
            Lampa.Controller.toggle('settings_component');
          });
        }, 2000);
        this.network.clear();
        this.network.timeout(10000);
        this.network.quiet(this.api_url + 'token_request' + this.user_dev, function (found) {
          if (found.status == 'ok') {
            user_token = found.code;
            user_code = found.user_code;
            modal.find('.selector').text(user_code);
          } else {
            Lampa.Noty.show(found);
          }
        }, function (a, c) {
          Lampa.Noty.show(Filmix.network.errorDecode(a, c));
        });
      },
      showStatus: function showStatus(ch) {
        var status = Lampa.Storage.get("filmix_status", '{}');
        var statuss = $('.settings-param__status', ch).removeClass('active error wait').addClass('wait');
        var info = Lampa.Lang.translate('filmix_nodevice');
        statuss.removeClass('wait').addClass('error');

        if (status.login) {
          statuss.removeClass('wait').addClass('active');
          var foto = '<img width="30em" src="' + (status.foto.indexOf('noavatar') == -1 ? status.foto : './img/logo-icon.svg') + '"> <span style="vertical-align: middle;"><b style="font-size:1.3em;color:#FF8C00">' + status.login + '</b>';
          if (status.is_pro || status.is_pro_plus) info = foto + ' - <b>' + (status.is_pro ? 'PRO' : 'PRO_PLUS') + '</b> ' + Lampa.Lang.translate('filter_rating_to') + ' - ' + status.pro_date + '</span>';else info = foto + ' - <b>NO PRO</b> - MAX quality 720p</span>';
        }

        if (ch) $('.settings-param__descr', ch).html(info);else $('.settings-param__descr:eq(0)').html(info);
      },
      checkPro: function checkPro(token, call) {
        this.network.clear();
        this.network.timeout(8000);
        token = token ? token : Lampa.Storage.get("filmix_token");
        var url = this.api_url + 'user_profile' + this.user_dev + token;
        this.network.silent(url, function (json) {
          if (json) {
            if (json.user_data) {
              Lampa.Storage.set("filmix_status", json.user_data);
              if (call) call();
            } else {
              Lampa.Storage.set("filmix_status", {});
            }

            Filmix.showStatus();
          }
        }, function (a, c) {
          Lampa.Noty.show(Filmix.network.errorDecode(a, c));
        });
      }
    };

    function collaps(component, _object) {
      var network = new Lampa.Reguest();
      var extract = {};
      var embed = 'https://api.embess.ws/embed/';
      var object = _object;
      var select_title = '';
      var filter_items = {};
      var choice = {
        season: 0,
        voice: 0,
        order: 0,
        last_viewed: ''
      };
      /**
       * Поиск
       * @param {Object} _object
       */

      this.search = function (_object, kinopoisk_id, data) {
        object = _object;
        select_title = object.search;
        var url = embed + 'imdb/' + object.movie.imdb_id;
        network.clear();
        network.timeout(10000);
        network.silent(url, function (str) {
          if (str) {
            parse(str);
          } else component.emptyForQuery(select_title);

          component.loading(false);
        }, function (a, c) {
          if (a.status == 404 && a.responseText && a.responseText.indexOf('видео недоступно') !== -1) component.emptyForQuery(select_title);else component.empty(network.errorDecode(a, c));
        }, false, {
          dataType: 'text'
        });
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
          order: 0
        };
        filter();
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
        component.reset();
        filter();
        append(filtred());
        component.saveChoice(choice);
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        network.clear();
        extract = null;
      };

      function parse(str) {
        str = str.replace(/\n/g, '');
        var find = str.match('makePlayer\\({(.*?)}\\);');
        var json;

        try {
          json = find && eval('({' + find[1] + '})');
        } catch (e) {}

        if (json) {
          extract = json;

          if (extract.playlist && extract.playlist.seasons) {
            extract.playlist.seasons.sort(function (a, b) {
              return a.season - b.season;
            });
          }

          filter();
          append(filtred());
        } else component.emptyForQuery(select_title);
      }
      /**
       * Построить фильтр
       */


      function filter() {
        filter_items = {
          season: [],
          voice: [],
          order: []
        };

        if (extract.playlist && extract.playlist.seasons) {
          component.order.forEach(function (i) {
            filter_items.order.push(i.title);
          });
          extract.playlist.seasons.forEach(function (season) {
            filter_items.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + season.season);
          });
        }

        if (!filter_items.season[choice.season]) choice.season = 0;
        component.filter(filter_items, choice);
      }
      /**
       * Отфильтровать файлы
       * @returns array
       */


      function filtred() {
        var filtred = [];
        var filter_data = Lampa.Storage.get('online_filter', '{}');

        if (extract.playlist) {
          extract.playlist.seasons.forEach(function (season, i) {
            if (i == filter_data.season) {
              season.episodes.forEach(function (episode) {
                var resolution = Lampa.Arrays.getKeys(extract.qualityByWidth).pop();
                var max_quality = resolution ? extract.qualityByWidth[resolution] || 0 : '';
                var audio_tracks = episode.audio.names.map(function (name) {
                  return {
                    language: name
                  };
                });
                filtred.push({
                  file: episode.hls,
                  episode: parseInt(episode.episode),
                  season: parseInt(season.season),
                  title: episode.title,
                  quality: max_quality ? max_quality + 'p' : '',
                  info: episode.audio.names.slice(0, 5).join(', '),
                  subtitles: episode.cc ? episode.cc.map(function (c) {
                    var url = c.url || '';
                    url = url.replace('https://', 'http://');
                    return {
                      label: c.name,
                      url: url
                    };
                  }) : false,
                  audio_tracks: audio_tracks.length ? audio_tracks : false
                });
              });
            }
          });
        } else if (extract.source) {
          var resolution = Lampa.Arrays.getKeys(extract.qualityByWidth).pop();
          var max_quality = extract.qualityByWidth ? extract.qualityByWidth[resolution] || 0 : 0;
          var audio_tracks = extract.source.audio.names.map(function (name) {
            return {
              language: name
            };
          });
          filtred.push({
            file: extract.source.hls,
            title: extract.source.audio.names.slice(0, 5).join(', '),
            quality: max_quality ? max_quality + 'p' : '',
            info: extract.source.audio.names.slice(0, 5).join(', '),
            subtitles: extract.source.cc ? extract.source.cc.map(function (c) {
              var url = c.url || '';
              url = url.replace('https://', 'http://');
              return {
                label: c.name,
                url: url
              };
            }) : false,
            audio_tracks: audio_tracks.length ? audio_tracks : false
          });
        }

        return component.order[filter_data.order].id == 'invers' ? filtred.reverse() : filtred;
      }
      /**
       * Показать файлы
       */


      function append(items) {
        component.reset();
        var viewed = Lampa.Storage.cache('online_view', 100, []);
        items.forEach(function (element, item_id) {
          if (element.season) element.title = Lampa.Lang.translate('torrent_serial_episode') + ' ' + element.episode;
          var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var view = Lampa.Timeline.view(hash);
          var item = Lampa.Template.get('onlines_v1', element);
          var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, object.movie.original_title, element.title].join('') : object.movie.original_title + element.title);
          item.addClass('video--stream');
          element.timeline = view;
          item.append(Lampa.Timeline.render(view));
          var quality = element.season ? '' : " / " + element.quality;
          item.find('.online__title').append(Lampa.Timeline.details(view, quality + " / "));
          if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
          item.on('hover:enter', function () {
            choice.last_viewed = item_id;
            if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);

            if (element.file) {
              var playlist = [];
              var first = {
                url: element.file,
                timeline: view,
                title: element.season ? element.title : movieTitle(object) + ' / ' + element.info,
                subtitles: element.subtitles,
                selectedSubsIdx: component.getSelectedSubsIdx(element.subtitles),
                translate: {
                  tracks: element.audio_tracks,
                  selectedIdx: component.getSelectedTrackIdx(element.audio_tracks)
                }
              };

              if (element.season) {
                items.forEach(function (elem, i) {
                  playlist.push({
                    id: i,
                    title: elem.title,
                    url: elem.file,
                    timeline: elem.timeline,
                    subtitles: elem.subtitles,
                    selectedSubsIdx: component.getSelectedSubsIdx(elem.subtitles),
                    translate: {
                      tracks: elem.audio_tracks,
                      selectedIdx: component.getSelectedTrackIdx(elem.audio_tracks)
                    }
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
                component.new_seria();
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

    function movieTitle(object) {
      return object.movie.title = object.movie.name || object.movie.original_title || object.movie.original_name || '';
    }

    function component(object) {
      var network = new Lampa.Reguest();
      var scroll = new Lampa.Scroll({
        mask: true,
        over: true,
        step: 250
      });
      var balanser = 'VeoVeo'; //Lampa.Storage.get('onlines_balanser', 'rezka');

      var continueWatching;
      var onlineCardCached;
      var contextmenu_all = [];

      if (_typeof(object) == 'object') {
        var files = new Lampa.Files(object);
        var filter = new Lampa.Filter(object);
        onlineCardCached = Lampa.Storage.cache('online_cards', 3000, {})[object.movie.id];

        if (onlineCardCached && onlineCardCached.balanser) {
          balanser = onlineCardCached.balanser;
        }
      }

      var sources = {
        // videocdn: new VideoCdn(this, object),
        // rezka: new SDRezka(this, object),
        VeoVeo: new Z01VeoVeo(this, object),
        collaps: new collaps(this, object),
        zombie: new Zombie(this, object)
      };

      var _this5 = this;

      var last;
      var last_filter;
      var extended;
      var selected_id;
      var filter_translate = {
        season: Lampa.Lang.translate('torrent_serial_season'),
        voice: Lampa.Lang.translate('torrent_parser_voice'),
        source: Lampa.Lang.translate('settings_rest_source')
      };
      var balansers = {
        videocdn: 'VideoCDN',
        VeoVeo: 'VeoVeo',
        rezka: 'Rezka',
        kinobase: 'Kinobase',
        collaps: 'Collaps',
        zombie: 'Zombie',
        filmix: 'Filmix',
        cdnmovies: 'CDNmovies',
        hdvb: 'HDVB',
        original: 'Original',
        kinotochka: 'KinoTochka',
        kinokrad: 'KinoKrad',
        seasonvar: 'SeasonVar',
        uakino: 'UAKino',
        kinoPub: 'KinoPub',
        kodik: 'Kodik',
        videoapi: 'VideoAPI'
      };
      var filter_sources = ['VeoVeo', 'collaps', 'zombie']; // ,  'rezka',  'kinobase' ,       'kodik', 'videoapi', 'zombie', 'videocdn'  'hdvb',  , 'original'    'cdnmovies', 'seasonvar', 'kinoPub'];
      // шаловливые ручки
      // if ((typeof object == 'object') && !object.movie.number_of_seasons) /*filter_sources.push('seasonvar');
      // else */filter_sources.push('kinotochka', 'kinokrad');
      // if (Lampa.Storage.get('pro_pub', false)) filter_sources.push('pub');
      // filter_sources.push('uakino');

      if (filter_sources.indexOf(balanser) == -1) {
        balanser = 'VeoVeo';
        Lampa.Storage.set('onlines_balanser', 'VeoVeo');
      }

      scroll.body().addClass('torrent-list');

      function minus() {
        if (_typeof(object) == 'object') scroll.minus(window.innerWidth > 580 ? false : files.render().find('.files__left'));
      }

      window.addEventListener('resize', minus, false);
      minus();
      /**
       * Подготовка
       */

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));

        filter.onSearch = function (value) {
          Lampa.Activity.replace({
            search: value,
            clarification: true
          });
        };

        filter.onBack = function () {
          _this.start();
        };

        filter.render().find('.selector').on('hover:focus', function (e) {
          last_filter = e.target;
        });

        filter.onSelect = function (type, a, b) {
          if (type == 'filter') {
            if (a.isBalanser) {
              balanser = b.source;
              Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
                oldValue.balanser = balanser;
                return oldValue;
              });

              _this.search();

              setTimeout(Lampa.Select.close, 10);
            } else if (a.reset) {
              if (extended) sources[balanser].reset();else _this.start();
            } else {
              sources[balanser].filter(type, a, b);
            }
          } else if (type == 'nextSeason') {
            _this.search();
          } else if (type == 'sort') {
            balanser = a.source;
            Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
              oldValue.balanser = balanser;
              return oldValue;
            });

            _this.search();

            setTimeout(Lampa.Select.close, 10);
          }

          if (object.movie.number_of_seasons || balanser == 'pub') filter.render().find('.filter--filter').show();else filter.render().find('.filter--filter').hide();
        };

        if (object.movie.number_of_seasons) {
          filter.render().find('.filter--sort').remove();
          filter.render().find('.filter--filter').show();
          filter.render();
          files.append(scroll.render());
        } else {
          filter.render().find('.filter--sort span').text(Lampa.Lang.translate('online_balanser'));
          filter.render().find('.filter--sort').on('hover:enter', function () {
            $('body').find('.selectbox__title').text(Lampa.Lang.translate('online_balanser'));
          });
          filter.render().find('.filter--filter').hide();
          filter.render();
          files.append(scroll.render());
          scroll.append(filter.render());
        }

        Lampa.PlayerPlaylist.listener.follow('playlistEnded', nextSeason);
        Lampa.PlayerPlaylist.listener.follow('select', next);
        Lampa.PlayerPanel.listener.follow('saveParams', saveParams);
        this.search();
        return this.render();
      };
      /**
       * Начать поиск
       */


      this.search = function () {
        this.activity.loader(true);
        this.filter({
          source: filter_sources
        }, {
          source: 0
        });
        this.reset();

        try {
          this.find();
        } catch (e) {
          console.log('request', "Error on component search: " + e);
          Lampa.Noty.show('Error on search');
          this.emptyForQuery("");
        }
      };

      this.find = function () {
        var _this2 = this;

        var imdb_id;
        var query = (object.search || movieTitle(object)).trim();
        var search_date = object.search_date || object.movie.release_date || object.movie.first_air_date || object.movie.last_air_date || '0000';
        var search_year = parseInt((search_date + '').slice(0, 4));
        var orig = object.movie.original_title || object.movie.original_name;

        var display = function display(items) {
          if (items && items.length) {
            var is_sure = false;

            if (object.movie.imdb_id) {
              var tmp = items.filter(function (elem) {
                return (elem.imdb_id || elem.imdbId) == object.movie.imdb_id;
              });

              if (tmp.length) {
                items = tmp;
                is_sure = true;
              }
            }

            var cards = items.filter(function (c) {
              var year = c.start_date || c.year || '0000';
              c.tmp_year = parseInt((year + '').slice(0, 4));
              return !c.tmp_year || !search_year || c.tmp_year > search_year - 2 && c.tmp_year < search_year + 2;
            });

            if (orig) {
              var _tmp = cards.filter(function (elem) {
                return _this2.equalTitle(elem.orig_title || elem.nameOriginal || elem.en_title || elem.nameEn || elem.ru_title || elem.nameRu, orig);
              });

              if (_tmp.length) {
                cards = _tmp;
                is_sure = true;
              }
            }

            if (query) {
              var _tmp2 = cards.filter(function (elem) {
                return _this2.equalTitle(elem.title || elem.ru_title || elem.nameRu || elem.en_title || elem.nameEn || elem.orig_title || elem.nameOriginal, query);
              });

              if (_tmp2.length) {
                cards = _tmp2;
                is_sure = true;
              }
            }

            if (cards.length > 1 && search_year) {
              var _tmp3 = cards.filter(function (c) {
                return c.tmp_year == search_year;
              });

              if (_tmp3.length) cards = _tmp3;
            }

            if (cards.length == 1 && is_sure) {
              _this2.extendChoice();

              sources[balanser].search(object, cards[0].kp_id || cards[0].kinopoiskId || cards[0].filmId, cards);
            } else if (items.length == 1) {
              _this2.extendChoice();

              sources[balanser].search(object, items[0].kp_id || items[0].kinopoiskId || items[0].filmId, items);
            } else {
              _this2.similars(items);

              _this2.loading(false);
            }
          } else _this2.emptyForQuery(query);
        };

        var pillow = function pillow(a, c) {
          _this2.empty(network.errorDecode(a, c));
        };

        var kp_search = function kp_search() {
          // var url = API + 'KPfind/' + encodeURIComponent(query);
          // if (object.movie.imdb_id) url = API + 'KPimdb/' + encodeURIComponent(object.movie.imdb_id);
          network.timeout(1000 * 20);
          var url = 'https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=' + encodeURIComponent(_this2.kpCleanTitle(query));
          network.silent(url, function (json) {
            display(json.films);
          }, function (a, c) {
            _this2.emptyForQuery(query);
          }, null, {
            headers: {
              'X-API-KEY': '2a4a0808-81a3-40ae-b0d3-e11335ede616'
            }
          });
        }; // 'x-api-key': 'eebf7a30-fc43-4baa-b439-f108f5638f59'


        var letgo = function letgo(id) {
          imdb_id = id;
          object.movie.imdb_id = imdb_id; // if (balanser == 'videocdn' || balanser == 'videoapi') vcdn_search();
          // else

          if (
          /*balanser == 'cdnmovies' || balanser == 'rezka' || balanser == 'collaps' ||
          */
          balanser == 'rezka' || balanser == 'zombie') kp_search();else {
            var add = function add(u, params) {
              return u + (/\?/.test(u) ? '&' : '?') + params;
            };

            if (!movieTitle(object).match(/[а-яё]/i) && object.movie.original_language !== 'en') {
              var u = (object.movie.seasons ? 'tv' : 'movie') + '/' + object.movie.id;
              u = add(u, 'api_key=' + Lampa.TMDB.key());
              u = add(u, 'language=en');
              network.silent(Lampa.TMDB.api(u), function (json) {
                object.movie.name = json.title;

                _this2.extendChoice();

                sources[balanser].search(object);
              }, function (a, c) {
                component.empty(network.errorDecode(a, c));
              });
            } else {
              _this2.extendChoice();

              sources[balanser].search(object);
            }
          }
        };

        network.clear();
        if (object.movie.imdb_id) letgo(object.movie.imdb_id);else {
          network.timeout(1000 * 15);
          var tmdburl = (object.movie.name ? 'tv' : 'movie') + '/' + object.movie.id + '/external_ids?api_key=4ef0d7355d9ffb5151e987764708ce96&language=ru';
          var baseurl = typeof Lampa.TMDB !== 'undefined' ? Lampa.TMDB.api(tmdburl) : 'https://cr1.lammm.deno.net/http://api.themoviedb.org' + tmdburl;
          network.silent(baseurl, function (ttid) {
            letgo(ttid.imdb_id);
          }, pillow.bind(_this2));
        }
      };

      this.kpCleanTitle = function (str) {
        return this.cleanTitle(str).replace(/^[ \/\\]+/, '').replace(/[ \/\\]+$/, '').replace(/\+( *[+\/\\])+/g, '+').replace(/([+\/\\] *)+\+/g, '+').replace(/( *[\/\\]+ *)+/g, '+');
      };

      this.cleanTitle = function (str) {
        if (!str) {
          return "";
        }

        return str.replace(/[ .,:;!?]+/g, ' ').trim();
      };

      this.equalTitle = function (t1, t2) {
        return typeof t1 === 'string' && typeof t2 === 'string' && t1.toLowerCase() === t2.toLowerCase();
      };

      this.parsePlaylist = function (str) {
        var pl = [];

        try {
          if (str.charAt(0) === '[') {
            str.substring(1).split(',[').forEach(function (item) {
              var label_end = item.indexOf(']');

              if (label_end >= 0) {
                var label = item.substring(0, label_end);

                if (item.charAt(label_end + 1) === '{') {
                  item.substring(label_end + 2).split(';{').forEach(function (voice_item) {
                    var voice_end = voice_item.indexOf('}');

                    if (voice_end >= 0) {
                      var voice = voice_item.substring(0, voice_end);
                      pl.push({
                        label: label,
                        voice: voice,
                        links: voice_item.substring(voice_end + 1).split(' or ')
                      });
                    }
                  });
                } else {
                  pl.push({
                    label: label,
                    links: item.substring(label_end + 1).split(' or ')
                  });
                }
              }

              return null;
            });
          }
        } catch (e) {}

        return pl;
      };

      this.ReverseObject = function (Obj) {
        var TempArr = [];
        var NewObj = [];

        for (var Key in Obj) {
          TempArr.push(Key);
        }

        for (var i = TempArr.length - 1; i >= 0; i--) {
          NewObj[TempArr[i]] = Obj[TempArr[i]];
        }

        return NewObj;
      };

      this.extendChoice = function () {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        var save = data[selected_id || object.movie.id] || {};
        var onlineCards = Lampa.Storage.get('online_cards', {});
        var onlineCard = onlineCards[selected_id || object.movie.id];

        if (onlineCard) {
          save.season = onlineCard.season;
          save.last_viewed = onlineCard.last_viewed;
          save.voice_name = onlineCard.voice_name;
        }

        extended = true;
        sources[balanser].extendChoice(save);
      };

      this.saveChoice = function (choice) {
        var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
        var movieId = selected_id || object.movie.id;
        data[movieId] = choice;
        Lampa.Storage.set('online_choice_' + balanser, data);
        Lampa.Storage.setCached('online_cards', 3000, movieId, function (oldValue) {
          oldValue.balanser = balanser;
          oldValue.season = choice.season;
          oldValue.voice_name = choice.voice_name;
          oldValue.last_viewed = choice.last_viewed;
          return oldValue;
        });
      };

      this.num_word = function (value, words) {
        value = Math.abs(value) % 100;
        var num = value % 10;
        if (value > 10 && value < 20) return words[2];
        if (num > 1 && num < 5) return words[1];
        if (num == 1) return words[0];
        return words[2];
      };

      this.order = [{
        title: 'Стандартно',
        id: 'normal'
      }, {
        title: 'Инвертировать',
        id: 'invers'
      }];
      /**
       * Есть похожие карточки
       * @param {Object} json
       */

      this.similars = function (json) {
        var _this3 = this;

        json.forEach(function (elem) {
          var title = elem.title || elem.ru_title || elem.nameRu || elem.en_title || elem.nameEn || elem.orig_title || elem.nameOriginal;
          var orig_title = elem.original_title || elem.orig_title || elem.nameOriginal || elem.en_title || elem.nameEn;
          var year = elem.start_date || elem.year || '';
          var transl = elem.translations ? ' - - ' + String(elem.translations).split(',').slice(0, 2) : '';
          var count_s = elem.seasons_count ? elem.seasons_count + ' ' + Lampa.Lang.translate('torrent_serial_season').toLowerCase() + _this3.num_word(elem.seasons_count, ['', 'а', 'ов']) : '';
          var count_eps = elem.episodes_count ? elem.episodes_count + ' эпизод' + _this3.num_word(elem.episodes_count, ['', 'а', 'ов']) : '';
          var info = [];
          if (orig_title && orig_title != elem.title) info.push(orig_title);
          info.push((elem.type == 'serial' || elem.type == 'MINI_SERIES' ? 'Cериал' + (count_s && ' - ' + count_s + ' из них ' + count_eps) : elem.type == 'TV_SHOW' ? ' / Тв-Шоу' : elem.type == ('movie'  ) ? ' / Фильм' : elem.type) + transl);
          elem.title = title;
          elem.info = info.length ? ' / ' + info.join(' / ') : '';
          elem.quality = year ? (year + '').slice(0, 4) : '----';
          var item = Lampa.Template.get('online_folder', elem);
          item.on('hover:focus', function () {
            if (elem.posterUrl) Lampa.Background.immediately(elem.posterUrl);
          }).on('hover:enter', function () {
            _this3.activity.loader(true);

            _this3.reset();

            object.search = elem.title;
            object.search_date = year;
            selected_id = elem.id;

            _this3.extendChoice();

            sources[balanser].search(object, elem.kp_id || elem.kinopoiskId || elem.filmId, [elem]);
          });

          _this3.append(item);
        });
      };
      /**
       * Очистить список файлов
       */


      this.reset = function () {
        contextmenu_all = [];
        last = false;
        scroll.render().find('.empty').remove();
        filter.render().detach();
        scroll.clear();
        scroll.append(filter.render());
      };
      /**
       * Загрузка
       */


      this.loading = function (status) {
        if (status) this.activity.loader(true);else {
          this.activity.loader(false);
          this.activity.toggle();
        }
      };
      /**
       * Построить фильтр
       */


      this.filter = function (filter_items, choice) {
        var select = [];

        var add = function add(type, title) {
          var need = Lampa.Storage.get('online_filter', '{}');
          var items = filter_items[type];
          var subitems = [];
          var value = need[type];
          items.forEach(function (name, i) {
            subitems.push({
              title: name,
              selected: value == i,
              index: i
            });
          });
          select.push({
            title: title,
            subtitle: items[value],
            items: subitems,
            stype: type
          });
        };

        filter_items.source = filter_sources;
        choice.source = filter_sources.indexOf(balanser);

        if (choice.voice_name && filter_items.voice.length) {
          var matches = stringSimilarity.findBestMatch(choice.voice_name, filter_items.voice);

          if (matches.bestMatch.rating > 0.1) {
            choice.voice = matches.bestMatchIndex;
            sources[balanser].extendChoice(choice);
          }
        }

        select.push({
          title: Lampa.Lang.translate('torrent_parser_reset'),
          reset: true
        });
        select.push({
          title: Lampa.Lang.translate('online_balanser'),
          isBalanser: true,
          subtitle: balanser,
          items: filter_sources.map(function (e) {
            return {
              title: balansers[e],
              source: e,
              selected: e == balanser
            };
          })
        });
        Lampa.Storage.set('online_filter', choice); // add('balanser', Lampa.Lang.translate('balanser'))
        // filter_items.balansers = filter_sources;

        if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
        if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season') + '');
        if (filter_items.type && filter_items.type.length) add('type', Lampa.Lang.translate('filter_video_stream') + '');
        if (filter_items.codec && filter_items.codec.length) add('codec', Lampa.Lang.translate('filter_video_codec') + '');
        if (filter_items.order && filter_items.order.length) add('order', Lampa.Lang.translate('filter_series_order') + '');
        filter.set('filter', select);

        if (!object.movie.number_of_seasons) {
          filter.set('sort', filter_sources.map(function (e) {
            return {
              title: balansers[e],
              source: e,
              selected: e == balanser
            };
          }));
        }

        this.selected(filter_items);
      };
      /**
       * Закрыть фильтр
       */


      this.closeFilter = function () {
        if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
      };
      /**
       * Показать что выбрано в фильтре
       */


      this.selected = function (filter_items) {
        var _this = this;

        var need = Lampa.Storage.get('online_filter', '{}'),
            select = [];

        for (var i in need) {
          if (filter_items[i] && filter_items[i].length) {
            if (i == 'voice') {
              select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
            } else if (i !== 'source') {
              if (filter_items.season.length >= 1) {
                select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
              }
            }
          }
        }

        select.unshift(balansers[balanser]);
        filter.chosen('filter', select);
        filter.chosen('sort', [balansers[balanser]]);

        _this.new_seria();
      };

      this.new_seria = function () {
        if (object.movie.number_of_seasons) {
          setTimeout(function () {
            $('.card--new_ser, .card--viewed, .full-start__right .time-line, .card--last_view').remove();

            if ($('body').find('.online').length !== 0) {
              if ($('body').find('.online:last-child .torrent-item__viewed').length == 1 || $('body').find('.online:last-child .time-line.hide').length == 0) $('body').find('.full-start__poster').append("<div class='card--viewed' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;top: 0.8em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>" + Lampa.Lang.translate('online_viewed') + "</div>");else $('body').find('.full-start__poster').append("<div class='card--new_ser' style='right: -0.6em;position: absolute;background: #168FDF;color: #fff;top: 0.8em;padding: 0.4em 0.4em;font-size: 1.2em;-webkit-border-radius: 0.3em;-moz-border-radius: 0.3em;border-radius: 0.3em;'>" + Lampa.Lang.translate('season_new') + " " + Lampa.Lang.translate('torrent_serial_episode') + "</div>");
            }

            Modss.last_view(object.movie);
          }, 50);
        }
      };
      /**
       * Добавить файл
       */


      this.append = function (item) {
        item.on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      };

      function saveParams(params) {
        Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
          oldValue.subName = params.subName;
          oldValue.voice_name = params.trackName;
          return oldValue;
        });

        _this5.extendChoice();
      }

      function next(next) {
        Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
          oldValue.last_viewed = next.position;
          return oldValue;
        });
        filter.onSelect();

        _this5.extendChoice();
      }

      function nextSeason() {
        var onlineCards = Lampa.Storage.get('online_cards', {});
        var onlineCard = onlineCards[selected_id || object.movie.id];

        if (!onlineCard) {
          return;
        }

        var nextSeason = parseInt(onlineCard.season);

        if (nextSeason === NaN) {
          return;
        } else {
          nextSeason++;
        }

        continueWatching = true;
        Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
          oldValue.season = nextSeason;
          oldValue.last_viewed = '';
          return oldValue;
        });
        filter.onSelect('nextSeason');

        _this5.extendChoice();
      }

      this.contextmenu = function (params) {
        var _this = this;

        contextmenu_all.push(params);
        params.item.on('hover:long', function () {
          function show(extra) {
            var enabled = Lampa.Controller.enabled().name;
            var menu = [{
              title: Lampa.Lang.translate('torrent_parser_label_title'),
              mark: true
            }, {
              title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
              clearmark: true
            }, {
              title: Lampa.Lang.translate('online_title_clear_all_mark'),
              clearmark_all: true
            }, {
              title: Lampa.Lang.translate('time_reset'),
              timeclear: true
            }, {
              title: Lampa.Lang.translate('online_title_clear_all_timecode'),
              timeclear_all: true
            }];

            if (extra && extra.file) {
              menu.push({
                title: 'SpeedTest',
                SpeedTest: true
              });
            }

            if (extra) {
              menu.push({
                title: Lampa.Lang.translate('copy_link'),
                copylink: true
              });
            }

            if (Lampa.Platform.is('webos')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Webos',
                player: 'webos'
              });
            }

            if (Lampa.Platform.is('android')) {
              menu.push({
                title: Lampa.Lang.translate('player_lauch') + ' - Android',
                player: 'android'
              });
            }

            menu.push({
              title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
              player: 'lampa'
            });

            if (Lampa.Account.working() && params.element && typeof params.element.season !== 'undefined' && Lampa.Account.subscribeToTranslation) {
              menu.push({
                title: Lampa.Lang.translate('online_voice_subscribe'),
                subscribe: true
              });
            }

            Lampa.Select.show({
              title: Lampa.Lang.translate('title_action'),
              items: menu,
              onBack: function onBack() {
                Lampa.Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                if (a.clearmark) {
                  Lampa.Arrays.remove(params.viewed, params.hash_file);
                  Lampa.Storage.set('online_view', params.viewed);
                  params.item.find('.torrent-item__viewed').remove();

                  _this.new_seria();
                }

                if (a.clearmark_all) {
                  contextmenu_all.forEach(function (params) {
                    Lampa.Arrays.remove(params.viewed, params.hash_file);
                    Lampa.Storage.set('online_view', params.viewed);
                    params.item.find('.torrent-item__viewed').remove();
                  });
                }

                if (a.mark) {
                  if (params.viewed.indexOf(params.hash_file) == -1) {
                    params.viewed.push(params.hash_file);
                    params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');

                    _this.new_seria();

                    Lampa.Storage.set('online_view', params.viewed);
                  }
                }

                if (a.timeclear) {
                  params.view.percent = 0;
                  params.view.time = 0;
                  params.view.duration = 0;

                  _this.new_seria();

                  Lampa.Timeline.update(params.view);
                  Lampa.Arrays.remove(params.viewed, params.hash_file);
                  params.item.find('.torrent-item__viewed').remove();
                  Lampa.Storage.set('online_view', params.viewed);
                }

                if (a.timeclear_all) {
                  contextmenu_all.forEach(function (params) {
                    params.view.percent = 0;
                    params.view.time = 0;
                    params.view.duration = 0;

                    _this.new_seria();

                    Lampa.Timeline.update(params.view);
                    Lampa.Arrays.remove(params.viewed, params.hash_file);
                    params.item.find('.torrent-item__viewed').remove();
                    Lampa.Storage.set('online_view', params.viewed);
                  });
                  Lampa.Timeline.resetForMovie(object.movie.original_title);
                  Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
                    oldValue.last_viewed = '';
                    return oldValue;
                  });
                }

                Lampa.Controller.toggle(enabled);

                if (a.player) {
                  Lampa.Player.runas(a.player);
                  params.item.trigger('hover:enter');
                }

                if (a.SpeedTest) {
                  Lampa.Speedtest.start({
                    url: extra.file
                  });
                }

                if (a.copylink) {
                  if (extra.quality) {
                    var qual = [];

                    for (var i in extra.quality) {
                      qual.push({
                        title: i,
                        file: extra.quality[i]
                      });
                    }

                    Lampa.Select.show({
                      title: Lampa.Lang.translate('online_title_links'),
                      items: qual,
                      onBack: function onBack() {
                        Lampa.Controller.toggle(enabled);
                      },
                      onSelect: function onSelect(b) {
                        Lampa.Utils.copyTextToClipboard(b.file, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                        }, function () {
                          Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                        });
                      }
                    });
                  } else {
                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                    }, function () {
                      Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                    });
                  }
                }

                if (a.subscribe) {
                  Lampa.Account.subscribeToTranslation({
                    card: object.movie,
                    season: params.element.season,
                    episode: params.element.translate_episode_end,
                    voice: params.element.translate_voice
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_success'));
                  }, function () {
                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_error'));
                  });
                }
              }
            });
          }

          params.file(show);
        }).on('hover:focus', function () {
          if (Lampa.Helper) Lampa.Helper.show('online_file', 'Удерживайте клавишу (ОК) для вызова контекстного меню', params.item);
        }).on('hover:enter', function () {
          Lampa.Storage.setCached('online_cards', 3000, object.movie.id, function (oldValue) {
            oldValue.last_viewed = params.choice.last_viewed;
            return oldValue;
          });
        });
      };
      /**
       * Показать пустой результат
       */


      this.emptys = function (descr) {
        var empty = new Lampa.Empty({
          title: '',
          descr: descr
        });
        scroll.append(empty.render(filter.empty()));
        this.loading(false);
      };

      this.empty = function (msg) {
        var empty = Lampa.Template.get('list_empty');
        if (msg) empty.find('.empty__descr').text(msg);
        scroll.append(empty);
        this.loading(false);
      };
      /**
       * Показать пустой результат по ключевому слову
       */


      this.emptyForQuery = function (query) {
        this.empty(Lampa.Lang.translate('online_query_start') + ' (' + query + ') ' + Lampa.Lang.translate('online_query_end'));
      };

      this.getLastEpisode = function (items) {
        var last_episode = 0;
        items.forEach(function (e) {
          if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
        });
        return last_episode;
      };
      /**
       * Начать навигацию по файлам
       */


      this.start = function (first_select) {
        //обязательно, иначе наблюдается баг, активность создается но не стартует, в то время как компонент загружается и стартует самого себя.
        if (Lampa.Activity.active().activity !== this.activity) return;

        if (first_select) {
          var last_viewed;
          var onlineCards = Lampa.Storage.get('online_cards', {});
          var onlineCard = onlineCards[selected_id || object.movie.id];

          if (onlineCard) {
            last_viewed = onlineCard.last_viewed;
          }

          scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
          var last_views = scroll.render().find('.selector.online').eq(last_viewed || 0);
          if (last_views.length) last = last_views.eq(0)[0];else last = scroll.render().find('.selector').eq(3)[0];

          if (continueWatching) {
            continueWatching = false;

            _this5.extendChoice();

            setTimeout(function () {
              $(last).trigger('hover:enter');
            }, balanser == 'videocdn' ? 2000 : 50);
          } // if (Lampa.Storage.field('online_continued') && cont && cont.continued) {
          //     cont.continued = false;
          //     _this5.saveChoice(cont);
          //     _this5.extendChoice();
          //     setTimeout(function () {
          //         $(last).trigger('hover:enter');
          //     }, balanser == 'videocdn' ? 2000 : 50);
          // }

        }

        Lampa.Controller.add('content', {
          toggle: function toggle() {
            Lampa.Controller.collectionSet(scroll.render(), files.render());
            Lampa.Controller.collectionFocus(last || false, scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) {
              if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
                Lampa.Controller.collectionFocus(last_filter, scroll.render());
              } else Navigator.move('up');
            } else Lampa.Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right');else if (object.movie.number_of_seasons) filter.show(Lampa.Lang.translate('title_filter'), 'filter');else filter.show(Lampa.Lang.translate('online_balanser'), 'sort');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
          },
          back: this.back
        });
        Lampa.Controller.toggle('content');
      };

      this.render = function () {
        return files.render();
      };

      this.back = function () {
        _this5.new_seria();

        Lampa.Activity.backward();
      };

      this.pause = function () {};

      this.getSelectedTrackIdx = function (tracks) {
        if (tracks && tracks.length) {
          var onlineCard = Lampa.Storage.cache('online_cards', 3000, {})[object.movie.id];

          if (onlineCard) {
            var trackName = onlineCard.voice_name;

            if (trackName) {
              var matches = stringSimilarity.findBestMatch(trackName, tracks.map(function (x) {
                return x.language;
              }));

              if (matches.bestMatch.rating > 0.1) {
                return matches.bestMatchIndex;
              }
            }
          }
        }

        return;
      };

      this.getSelectedSubsIdx = function (subtitles) {
        if (subtitles && subtitles.length) {
          var onlineCard = Lampa.Storage.cache('online_cards', 3000, {})[object.movie.id];

          if (onlineCard) {
            var subName = onlineCard.subName;

            if (subName) {
              var matches = stringSimilarity.findBestMatch(subName, subtitles.map(function (x) {
                return x.label;
              }));

              if (matches.bestMatch.rating > 0.1) {
                return matches.bestMatchIndex;
              }
            }
          }
        }

        return;
      };

      this.stop = function () {};

      this.destroy = function () {
        network.clear();
        files.destroy();
        scroll.destroy();
        network = null;

        for (var _i = 0, _Object$keys = Object.keys(sources); _i < _Object$keys.length; _i++) {
          var sourceName = _Object$keys[_i];
          sources[sourceName].destroy();
        }

        window.removeEventListener('resize', minus);
        Lampa.PlayerPlaylist.listener.remove('select', next);
        Lampa.PlayerPlaylist.listener.remove('playlistEnded', nextSeason);
        Lampa.PlayerPanel.listener.remove('saveParams', saveParams);
      };
    }

    function startPlugin() {
      window.plugin = true;
      Lampa.Component.add('onlines_v1', component);
      Lampa.Template.add('onlines_v1', "<div class='online onlines_v1 selector'><div class='online__body'><div style='position: absolute;left: 0;top: -0.5em;width: 2.4em;height: 2.4em'><svg style='height: 2.4em; width:  2.4em;' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'>   <circle cx='64' cy='64' r='56' stroke='white' stroke-width='16'/>   <path d='M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z' fill='white'/></svg>  </div><div class='online__title' style='padding-left: 2.1em;'>{title}</div></div></div>");
      Lampa.Template.add('online_folder', "<div class='online selector'> <div class='online__body'><div style='position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em'>    <svg style='height: 2.4em; width:  2.4em;' viewBox='0 0 128 112' fill='none' xmlns='http://www.w3.org/2000/svg'>   <rect y='20' width='128' height='92' rx='13' fill='white'/>   <path d='M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z' fill='white' fill-opacity='0.23'/>   <rect x='11' y='8' width='106' height='76' rx='13' fill='white' fill-opacity='0.51'/>    </svg></div><div class='online__title' style='padding-left: 2.1em;'>{title}</div><div class='online__quality' style='padding-left: 3.4em;'>{quality}{info}</div> </div>\n    </div>");
      Lampa.Template.add('modss_style', "<style>@media screen and (max-width: 585px) {.timeline{bottom:12em}.card--new_seria {right:2em!important;bottom:10em!important} .card--last_view{right:80%!important;top:2em!important}}</style>");
      Lampa.Template.add('hdgo_item', "<div class=\"selector hdgo-item\"><div class=\"hdgo-item__imgbox\"><img class=\"hdgo-item__img\"/><div class=\"card__icons\"><div class=\"card__icons-inner\"></div></div></div><div class=\"hdgo-item__name\">{title}</div></div>");
      Lampa.Template.add('hdgo_style', '<style>.nuamtv {filter: blur(7px);}.nuamtv:hover, .nuamtv:action {filter: blur(0px);}.a-r.b{color:#fff;background: linear-gradient(to right, rgba(204,0,0,1) 0%,rgba(150,0,0,1) 100%);}.a-r.de{color:#fff;background: linear-gradient(to right, #ffbc54 0%,#ff5b55 100%);}.a-r.g{background: linear-gradient(to right, rgba(205,235,142,1) 0%,rgba(165,201,86,1) 100%);color: #12420D;}.card.home.focus .card__img {border-color: green!important;-webkit-box-shadow: 0 0 0 0.4em green!important;-moz-box-shadow: 0 0 0 0.4em green!important;box-shadow: 0 0 0 0.4em green!important;}@media screen and (max-width: 2560px) {.pc.hdgo.card--collection,.pc.card--collection{width:11em!important} .tv_tv,.tv_pc{width:12.5%!important}.tv.hdgo.card--collection{width:10.3em!important} .tv.card--collection{width:14.2%!important}.tv.sort.card--collection{width:25%!important}.tv.sort.hdgo.card--collection{width:25%!important}  .sort.hdgo.card--collection .card__view {padding-bottom:25%!important} .tv.two.sort.card--collection .card__view {padding-bottom: 10%!important} .tv.two.sort.card--collection{height:20%!important;width:50%!important}.pc.card--category, .tv.card--category{width:14.28%}.nuam.card--collection{width:20%!important}}  @media screen and (max-width: 1280px) {.pc.card--collection,.mobile,.mobile_tv{width:16.6%!important} .tv_tv{width:14.3%!important} .pc.hdgo.card--collection,.hdgo.card--collection{width:10em!important}.sort.pc.card--collection{width:25%!important}.sort.hdgo.card--collection{width:25%!important} .sort.hdgo.card--collection .card__view {padding-bottom:40%!important} .two.sort.card--collection{width:50%!important} .pc.two.sort.card--collection .card__view {padding-bottom: 33%!important} .pc.card--category,.nuam.card--category{width:11.8em!important}}  @media screen and (max-width: 420px) {.pc.card--collection,.mobile{width:10.8em!important}.mobile_tv{width:33.3%!important}  .pc.hdgo.card--collection,.hdgo.card--collection{width:10em!important}.pc.card--category,.nuam.card--category{width:8.1em!important}.nuam.card--collection{width:33.3%!important}.sort.hdgo.card--collection .card__view {padding-bottom:60%!important}}   .searc.card--collection .card__view {padding-bottom: 5%!important}.searc.card--collection{width:100%!important}.searc.card--collection .card__img{height:100%!important;}.hdgo-item{margin:0 .3em;width:10.4em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.hdgo-item__imgbox{background-color:#3e3e3e;padding-bottom:60%;position:relative;-webkit-border-radius:.3em;-moz-border-radius:.3em;border-radius:.3em}.hdgo-item__img{position:absolute;top:0;left:0;width:100%;height:100%}.hdgo-item__name{font-size:1.1em;margin-top:.8em}.hdgo-item.focus .hdgo-item__imgbox:after{border:solid .4em #fff;content:"";display:block;position:absolute;left:0;top:0;right:0;bottom:0;-webkit-border-radius:.3em;-moz-border-radius:.3em;border-radius:.3em}.hdgo-item +.hdgo-item{margin:0 .3em}.modss_tv .items-line + .items-line, .forktv .items-line + .items-line {margin-top:0!important;}</style>');

      if (!Lampa.Lang) {
        var lang_data = {};
        Lampa.Lang = {
          add: function add(data) {
            lang_data = data;
          },
          translate: function translate(key) {
            return lang_data[key] ? lang_data[key].ru : key;
          }
        };
      }

      Lampa.Lang.add({
        pub_sort_views: {
          ru: 'По просмотрам',
          uk: 'По переглядах',
          en: 'By views'
        },
        pub_sort_watchers: {
          ru: 'По подпискам',
          uk: 'За підписками',
          en: 'Subscriptions'
        },
        pub_sort_updated: {
          ru: 'По обновлению',
          uk: 'За оновленням',
          en: 'By update'
        },
        pub_sort_created: {
          ru: 'По дате добавления',
          uk: 'За датою додавання',
          en: 'By date added'
        },
        pub_search_coll: {
          ru: 'Поиск по подборкам',
          uk: 'Пошук по добіркам',
          en: 'Search by collections'
        },
        pub_title_all: {
          ru: 'Все',
          uk: 'Все',
          en: 'All'
        },
        pub_title_popular: {
          ru: 'Популярные',
          uk: 'Популярнi',
          en: 'Popular'
        },
        pub_title_new: {
          ru: 'Новые',
          uk: 'Новi',
          en: 'New'
        },
        pub_title_hot: {
          ru: 'Горячие',
          uk: 'Гарячi',
          en: 'Hot'
        },
        pub_title_rating: {
          ru: 'Рейтинговые',
          uk: 'Рейтинговi',
          en: 'Rating'
        },
        pub_title_allingenre: {
          ru: 'Всё в жанре',
          uk: 'Все у жанрі',
          en: 'All in the genre'
        },
        pub_title_popularfilm: {
          ru: 'Популярные фильмы',
          uk: 'Популярні фільми',
          en: 'Popular movies'
        },
        pub_title_popularserial: {
          ru: 'Популярные сериалы',
          uk: 'Популярні сериали',
          en: 'Popular series'
        },
        pub_title_newfilm: {
          ru: 'Новые фильмы',
          uk: 'Новi фiльми',
          en: 'New movies'
        },
        pub_title_newserial: {
          ru: 'Новые сериалы',
          uk: 'Новi серiали',
          en: 'New series'
        },
        pub_title_newconcert: {
          ru: 'Новые концерты',
          uk: 'Новi концерти',
          en: 'New concerts'
        },
        pub_title_newdocfilm: {
          ru: 'Новые док. фильмы',
          uk: 'Новi док. фiльми',
          en: 'New document movies'
        },
        pub_title_newdocserial: {
          ru: 'Новые док. сериалы',
          uk: 'Новi док. серiали',
          en: 'New document series'
        },
        pub_title_newtvshow: {
          ru: 'Новое ТВ шоу',
          uk: 'Нове ТБ шоу',
          en: 'New TV show'
        },
        pub_modal_title: {
          ru: '1. Авторизируйтесь на сайте: <a style="color:#fff" href="#">https://kino.pub/device</a><br>2. В поле "Активация устройства" введите код.',
          uk: '1. Авторизуйтесь на сайті: <a style="color:#fff" href="#">https://kino.pub/device</a><br>2.  Введіть код у полі "Активація пристрою".',
          en: '1. Log in to the site: <a style="color:#fff" href="#">https://kino.pub/device</a><br>2.  Enter the code in the "Device activation" field.'
        },
        pub_title_wait: {
          ru: 'Ожидание идентификации кода',
          uk: 'Очікування ідентифікації коду',
          en: 'Waiting for code identification'
        },
        pub_title_left_days: {
          ru: 'Осталось: ',
          uk: 'Залишилось: ',
          en: 'Left days: '
        },
        pub_title_left_days_d: {
          ru: 'дн.',
          uk: 'дн.',
          en: 'd.'
        },
        pub_title_regdate: {
          ru: 'Дата регистрации:',
          uk: 'Дата реєстрації:',
          en: 'Date of registration:'
        },
        pub_date_end_pro: {
          ru: 'ПРО заканчивается:',
          uk: 'ПРО закінчується:',
          en: 'PRO ends:'
        },
        pub_auth_add_descr: {
          ru: 'Добавить в свой профиль устройство',
          uk: 'Додати у свій профіль пристрій',
          en: 'Add a device to your profile'
        },
        pub_title_not_pro: {
          ru: 'ПРО не активирован',
          uk: 'ПРО не активований',
          en: 'PRO is not activated'
        },
        pub_device_dell_noty: {
          ru: 'Устройство успешно удалено',
          uk: 'Пристрій успішно видалено',
          en: 'Device deleted successfully'
        },
        pub_device_title_options: {
          ru: 'Настройки устройства',
          uk: 'Налаштування пристрою',
          en: 'Device Settings'
        },
        pub_device_options_edited: {
          ru: 'Настройки устройства изменены',
          uk: 'Установки пристрою змінено',
          en: 'Device settings changed'
        },
        saved_collections_clears: {
          ru: 'Сохранённые подборки очищены',
          uk: 'Збірки очищені',
          en: 'Saved collections cleared'
        },
        card_my_clear: {
          ru: 'Убрать с моих подборок',
          uk: 'Прибрати з моїх добірок',
          en: 'Remove from my collections'
        },
        card_my_add: {
          ru: 'Добавить в мои подборки',
          uk: 'Додати до моїх добірок',
          en: 'Add to my collections'
        },
        card_my_descr: {
          ru: 'Смотрите в меню (Подборки)',
          uk: 'Дивитесь в меню (Підбірки)',
          en: 'Look in the menu (Collections)'
        },
        card_my_clear_all: {
          ru: 'Удалить всё',
          uk: 'Видалити все',
          en: 'Delete all'
        },
        card_my_clear_all_descr: {
          ru: 'Очистит все сохранённые подборки',
          uk: 'Очистити всі збережені збірки',
          en: 'Clear all saved selections'
        },
        radio_style: {
          ru: 'Стиль',
          uk: 'Стиль',
          en: 'Style'
        },
        title_on_the: {
          ru: 'на',
          uk: 'на',
          en: 'on'
        },
        title_my_collections: {
          ru: 'Мои подборки',
          uk: 'Мої добiрки',
          en: 'My collections'
        },
        online_nolink: {
          ru: 'Не удалось извлечь ссылку',
          uk: 'Неможливо отримати посилання',
          en: 'Failed to fetch link'
        },
        title_online_continue: {
          ru: 'Продолжить',
          uk: 'Продовжити',
          en: 'Continue'
        },
        online_viewed: {
          ru: 'Просмотрено',
          uk: 'Переглянуто',
          en: 'Viewed'
        },
        online_balanser: {
          ru: 'Балансер',
          uk: 'Балансер',
          en: 'Balancer'
        },
        helper_online_file: {
          ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
          uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
          en: 'Hold the "OK" key to bring up the context menu'
        },
        online_query_start: {
          ru: 'По запросу',
          uk: 'На запит',
          en: 'On request'
        },
        online_query_end: {
          ru: 'нет результатов',
          uk: 'немає результатів',
          en: 'no results'
        },
        filter_series_order: {
          ru: 'Порядок серий',
          uk: 'Порядок серій',
          en: 'Series order'
        },
        filter_video_stream: {
          ru: 'Видео поток',
          uk: 'Відео потік',
          en: 'Video stream'
        },
        filter_video_codec: {
          ru: 'Кодек',
          uk: 'Кодек',
          en: 'Codec'
        },
        title_online: {
          ru: 'Онлайн',
          uk: 'Онлайн',
          en: 'Online'
        },
        title_online_continued: {
          ru: 'Продолжить просмотр',
          uk: 'Продовжити перегляд',
          en: 'Continue browsing'
        },
        title_online_descr: {
          ru: 'Позволяет запускать плеер сразу на том месте, где остановили просмотр. Работает только в ВСТРОЕННОМ плеере.',
          uk: 'Дозволяє запускати плеєр одразу на тому місці, де зупинили перегляд.  Працює тільки у Вбудованому плеєрі.',
          en: 'Allows you to start the player immediately at the place where you stopped browsing.  Works only in the INTEGRATED player.'
        },
        online_waitlink: {
          ru: 'Работаем над извлечением ссылки, подождите...',
          uk: 'Працюємо над отриманням посилання, зачекайте...',
          en: 'Working on extracting the link, please wait...'
        },
        online_title_clear_all_mark: {
          ru: 'Снять отметку у всех',
          uk: 'Зняти відмітку у всіх',
          en: 'Unmark all'
        },
        online_title_clear_all_timecode: {
          ru: 'Сбросить тайм-код у всех',
          uk: 'Скинути тайм-код у всіх',
          en: 'Reset timecode for all'
        },
        online_title_links: {
          ru: 'Качество',
          uk: 'Якість',
          en: 'Quality'
        },
        title_proxy: {
          ru: 'Прокси',
          uk: 'Проксі',
          en: 'Proxy'
        },
        online_proxy_title: {
          ru: 'Личный прокси',
          uk: 'Особистий проксі',
          en: 'Your proxy'
        },
        online_proxy_title_descr: {
          ru: 'Если балансер недоступен или не отвечает, требуется в выбранном Вами балансере "Включить" прокси, или указать ссылку на "Свой URL"',
          uk: 'Якщо балансер недоступний або не відповідає, потрібно у вибраному Вами балансері "Увімкнути" проксі, або вказати посилання на "Свій URL"',
          en: 'If the balancer is not available or does not respond, you need to "Enable" the proxy in the balancer you have chosen, or specify a link to "Custom URL"'
        },
        online_proxy_title_main: {
          ru: 'Встроенный прокси',
          uk: 'Вбудований проксі',
          en: 'Built-in proxy'
        },
        online_proxy_title_main_descr: {
          ru: 'Позволяет использовать встроенный в систему прокси для всех балансеров',
          uk: 'Дозволяє використовувати вбудований у систему проксі для всіх балансерів',
          en: 'Allows you to use the built-in proxy for all balancers'
        },
        online_proxy_descr: {
          ru: 'Позволяет задать личный прокси для всех балансеров',
          uk: 'Дозволяє встановити особистий проксі для всіх балансерів',
          en: 'Allows you to set a personal proxy for all balancers'
        },
        online_proxy_placeholder: {
          ru: 'Например: http://proxy.com',
          uk: 'Наприклад: http://proxy.com',
          en: 'For example: http://proxy.com'
        },
        online_proxy_url: {
          ru: 'Свой URL',
          uk: 'Свiй URL',
          en: 'Mine URL'
        },
        online_voice_subscribe: {
          ru: 'Подписаться на перевод',
          uk: 'Підписатися на переклад',
          en: 'Subscribe to translation'
        },
        online_voice_success: {
          ru: 'Вы успешно подписались',
          uk: 'Ви успішно підписалися',
          en: 'You have successfully subscribed'
        },
        online_voice_error: {
          ru: 'Возникла ошибка',
          uk: 'Виникла помилка',
          en: 'An error has occurred'
        },
        filmix_param_add_title: {
          ru: 'Добавить ТОКЕН от Filmix',
          uk: 'Додати ТОКЕН від Filmix',
          en: 'Add TOKEN from Filmix'
        },
        filmix_param_add_descr: {
          ru: 'Добавьте ТОКЕН для подключения подписки',
          uk: 'Додайте ТОКЕН для підключення передплати',
          en: 'Add a TOKEN to connect a subscription'
        },
        filmix_param_placeholder: {
          ru: 'Например: nxjekeb57385b..',
          uk: 'Наприклад: nxjekeb57385b..',
          en: 'For example: nxjekeb57385b..'
        },
        filmix_params_add_device: {
          ru: 'Добавить устройство на ',
          uk: 'Додати пристрій на ',
          en: 'Add Device to '
        },
        filmix_modal_text: {
          ru: 'Введите его на странице https://filmix.ac/consoles в вашем авторизованном аккаунте!',
          uk: 'Введіть його на сторінці https://filmix.ac/consoles у вашому авторизованому обліковому записі!',
          en: 'Enter it at https://filmix.ac/consoles in your authorized account!'
        },
        filmix_modal_wait: {
          ru: 'Ожидаем код',
          uk: 'Очікуємо код',
          en: 'Waiting for the code'
        },
        filmix_copy_secuses: {
          ru: 'Код скопирован в буфер обмена',
          uk: 'Код скопійовано в буфер обміну',
          en: 'Code copied to clipboard'
        },
        filmix_copy_fail: {
          ru: 'Ошибка при копировании',
          uk: 'Помилка при копіюванні',
          en: 'Copy error'
        },
        filmix_nodevice: {
          ru: 'Устройство не авторизовано',
          uk: 'Пристрій не авторизований',
          en: 'Device not authorized'
        },
        fork_auth_modal_title: {
          ru: '1. Авторизируйтесь на: <a style="color:#fff" href="#">http://forktv.me</a><br>2. Потребуется оформить подписку<br>3. В поле "Ваш ID/MAC" добавьте код',
          uk: '1. Авторизуйтесь на: <a style="color:#fff" href="#">http://forktv.me</a><br>2. Потрібно оформити передплату<br>3. У полі "Ваш ID/MAC" додайте код',
          en: '1. Log in to: <a style="color:#fff" href="#">http://forktv.me</a><br>2. Subscription required<br>3. In the "Your ID / MAC" field, add the code'
        },
        fork_modal_wait: {
          ru: '<b style="font-size:1em">Ожидание идентификации кода</b><hr>После завершения идентификации произойдет перенаправление в обновленный раздел ForkTV',
          uk: '<b style="font-size:1em">Очiкуемо ідентифікації коду</b><hr>Після завершення ідентифікації відбудеться перенаправлення в оновлений розділ ForkTV',
          en: '<b style="font-size:1em">Waiting for code identification</b><hr>After identification is completed, you will be redirected to the updated ForkTV section'
        },
        title_status: {
          ru: 'Статус',
          uk: 'Статус',
          en: 'Status'
        },
        season_ended: {
          ru: 'сезон завершён',
          uk: 'сезон завершено',
          en: 'season ended'
        },
        season_from: {
          ru: 'из',
          uk: 'з',
          en: 'from'
        },
        season_new: {
          ru: 'Новая',
          uk: 'Нова',
          en: 'New'
        },
        info_attention: {
          ru: 'Внимание',
          uk: 'Увага',
          en: 'Attention'
        },
        info_pub_descr: {
          ru: '<b>KinoPub</b> платный ресурс, просмотр онлайн с балансера, а так же спортивные ТВ каналы будут доступны после покупки <b>PRO</b> в аккаунте на сайте',
          uk: '<b>KinoPub</b> платний ресурс, перегляд онлайн з балансера, а також спортивні ТБ канали будуть доступні після покупки <b>PRO</b> в обліковому записі на сайті',
          en: '<b>KinoPub</b> a paid resource, online viewing from a balancer, as well as sports TV channels will be available after purchasing <b>PRO</b> in your account on the site'
        },
        info_filmix_descr: {
          ru: 'Максимально доступное качество для просмотра без подписки - 720p. Для того, чтобы смотреть фильмы и сериалы в качестве - 1080р-2160р требуется подписка <b>PRO</b> или <b>PRO-PLUS</b> на сайте',
          uk: 'Максимально доступна якість для перегляду без підписки – 720p.  Для того, щоб дивитися фільми та серіали як - 1080р-2160р потрібна підписка <b>PRO</b> або <b>PRO-PLUS</b> на сайтi',
          en: 'The maximum available quality for viewing without a subscription is 720p.  In order to watch movies and series in quality - 1080p-2160p, you need a <b>PRO</b> or <b>PRO-PLUS</b> subscription to the site'
        },
        params_pub_on: {
          ru: 'Включить',
          uk: 'Увiмкнути',
          en: 'Enable'
        },
        params_pub_off: {
          ru: 'Выключить',
          uk: 'Вимкнути',
          en: 'Disable'
        },
        params_pub_on_descr: {
          ru: 'Отображает источник "<b>KinoPub</b>", а так же подборки. Для просмотра с балансера, а так же ТВ спорт каналов <span style="color:#ffd402">требуется подписка<span>',
          uk: 'Відображає джерело "<b>KinoPub</b>", а також добірки.  Для перегляду з балансера, а також ТБ спорт каналів <span style="color:#ffd402">потрібна підписка<span>',
          en: 'Displays the "<b>KinoPub</b>" source as well as collections.  To view from the balancer, as well as TV sports channels <span style="color:#ffd402">subscription<span> is required'
        },
        params_pub_add_source: {
          ru: 'Установить источник',
          uk: 'Встановити джерело',
          en: 'Set source'
        },
        pub_source_add_noty: {
          ru: 'KinoPub установлен источником по умолчанию',
          uk: 'KinoPub встановлений стандартним джерелом',
          en: 'KinoPub set as default source'
        },
        descr_pub_settings: {
          ru: 'Настройки сервера, типа потока...',
          uk: 'Налаштування сервера типу потоку...',
          en: 'Server settings, stream type...'
        },
        params_pub_add_source_descr: {
          ru: 'Установить источник по умолчанию на KinoPub',
          uk: 'Встановити стандартне джерело на KinoPub',
          en: 'Set Default Source to KinoPub'
        },
        params_pub_update_tocken: {
          ru: 'Обновить токен',
          uk: 'Оновити токен',
          en: 'Update token'
        },
        params_pub_dell_device: {
          ru: 'Удалить привязку устройства',
          uk: 'Видалити прив\'язку пристрою',
          en: 'Remove device link'
        },
        params_pub_dell_descr: {
          ru: 'Будет удалено устройство с прывязаных устройств в аккаунте',
          uk: 'Буде видалено пристрій із прив\'язаних пристроїв в обліковому записі',
          en: 'The device will be removed from linked devices in the account'
        },
        params_radio_enable: {
          ru: 'Включить радио',
          uk: 'Увiмкнути радiо',
          en: 'Enable radio'
        },
        params_radio_enable_descr: {
          ru: 'Отображает пункт "Радио" в главном меню с популярными радио-станциями',
          uk: 'Відображає пункт "Радіо" в головному меню з популярними радіостанціями',
          en: 'Displays the item "Radio" in the main menu with popular radio stations'
        },
        params_tv_enable: {
          ru: 'Включить ТВ',
          uk: 'Увiмкнути ТВ',
          en: 'Enable TV'
        },
        params_tv_enable_descr: {
          ru: 'Отображает пункт "Modss-TV" в главном меню с популярными каналами',
          uk: 'Відображає пункт "Modss-TV" в головному меню з популярними каналами',
          en: 'Displays the item "Modss-TV" in the main menu with popular channels'
        },
        params_collections_descr: {
          ru: 'Добавляет в пункт "Подборки" популярные разделы, такие как Rezka, Filmix, KinoPub',
          uk: 'Додає до пункту "Підбірки" популярні розділи, такі як Rezka, Filmix, KinoPub',
          en: 'Adds to "Collections" popular sections such as Rezka, Filmix, KinoPub'
        },
        params_styles_title: {
          ru: 'Стилизация',
          uk: 'Стилізація',
          en: 'Stylization'
        },
        placeholder_password: {
          ru: 'Введите пароль',
          uk: 'Введіть пароль',
          en: 'Enter password'
        },
        title_parent_contr: {
          ru: 'Родительский контроль',
          uk: 'Батьківський контроль',
          en: 'Parental control'
        },
        title_addons: {
          ru: 'Дополнения',
          uk: 'Додатки',
          en: 'Add-ons'
        },
        onl_enable_descr: {
          ru: 'Позволяет просматривать фильмы, сериалы в режиме Stream',
          uk: 'Дозволяє переглядати фільми, серіали в режимі Stream',
          en: 'Allows you to watch movies, series in Stream mode'
        },
        fork_enable_descr: {
          ru: 'Отображает пункт <b>"ForkTV"</b> в главном меню с популярными источниками, торрентами',
          uk: 'Відображає пункт <b>"ForkTV"</b> у головному меню з популярними джерелами, торрентами',
          en: 'Displays <b>"ForkTV"</b> item in main menu with popular sources, torrents'
        },
        title_fork_edit_cats: {
          ru: 'Изменить разделы',
          uk: 'Змінити розділи',
          en: 'Edit Sections'
        },
        title_fork_add_cats: {
          ru: 'Добавить разделы',
          uk: 'Додати розділи',
          en: 'Add Sections'
        },
        title_fork_clear: {
          ru: 'Очистить разделы',
          uk: 'Очистити розділи',
          en: 'Clear Sections'
        },
        title_fork_clear_descr: {
          ru: 'Будет выполнена очистка всех выбранных разделов',
          uk: 'Буде виконано очищення всіх вибраних розділів',
          en: 'All selected partitions will be cleared'
        },
        title_fork_clear_noty: {
          ru: 'Разделы успешно очищены',
          uk: 'Розділи успішно очищені',
          en: 'Partitions cleared successfully'
        },
        title_fork_reload_code: {
          ru: 'Обновить код',
          uk: 'Оновити код',
          en: 'Update Code'
        },
        title_fork_current: {
          ru: 'Текущий',
          uk: 'Поточний',
          en: 'Current'
        },
        title_fork_new: {
          ru: 'Новый',
          uk: 'Новий',
          en: 'New'
        },
        title_tv_clear_fav: {
          ru: 'Очистить избранное',
          uk: 'Очистити вибране',
          en: 'Clear Favorites'
        },
        title_tv_clear__fav_descr: {
          ru: 'Будет выполнена очистка избранных каналов',
          uk: 'Буде виконано очищення обраних каналів',
          en: 'Favorite channels will be cleared'
        },
        title_tv_clear_fav_noty: {
          ru: 'Все избранные каналы удалены',
          uk: 'Усі вибрані канали видалені',
          en: 'All favorite channels have been deleted'
        },
        succes_update_noty: {
          ru: 'успешно обновлён',
          uk: 'успішно оновлено',
          en: 'successfully updated'
        },
        title_enable_rating: {
          ru: 'Включить рейтинг',
          uk: 'Увiмкнути рейтинг',
          en: 'Enable rating'
        },
        title_enable_rating_descr: {
          ru: 'Отображает в карточке рейтинг Кинопоиск и IMDB',
          uk: 'Відображає у картці рейтинг Кінопошук та IMDB',
          en: 'Displays the Kinopoisk and IMDB rating in the card'
        },
        title_info_serial: {
          ru: 'Информация о карточке',
          uk: 'Інформація про картку',
          en: 'Card Information'
        },
        title_info_serial_descr: {
          ru: 'Отображает информацию о количестве серий в карточке, в том числе последнею серию на постере',
          uk: 'Відображає інформацію про кількість серій у картці, у тому числі останню серію на постері',
          en: 'Displays information about the number of episodes in the card, including the last episode on the poster'
        },
        title_add_butback: {
          ru: 'Включить кнопку "Назад"',
          uk: 'Увiмкнути кнопку "Назад"',
          en: 'Enable back button'
        },
        title_add_butback_descr: {
          ru: 'Отображает внешнюю кнопку "Назад" для удобной навигации в полноэкраном режиме на различных смартфона',
          uk: 'Відображає зовнішню кнопку "Назад" для зручної навігації в повноекранному режимі на різних смартфонах',
          en: 'Displays an external back button for easy full-screen navigation on various smartphones'
        },
        title_butback_pos: {
          ru: 'Положение кнопки "Назад"',
          uk: 'Розташування кнопки "Назад"',
          en: 'Back button position'
        },
        buttback_right: {
          ru: 'Справа',
          uk: 'Праворуч',
          en: 'Right'
        },
        buttback_left: {
          ru: 'Слева',
          uk: 'Лiворуч',
          en: 'Left'
        },
        title_close_app: {
          ru: 'Закрыть приложение',
          uk: 'Закрити додаток',
          en: 'Close application'
        },
        title_radio: {
          ru: 'Радио',
          uk: 'Радiо',
          en: 'Radio'
        }
      });
      Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
          cards = e.data.movie; //Serial info, last view seria

          Modss.serialInfo(e.data.movie); //Rating and QUALITY

          if (e.data.recomend && e.data.recomend.results.length > 0) {
            var elem = e.data.recomend.results.concat(e.data.movie);
            Lampa.VideoQuality.add(elem);
          }

          Modss.rating_kp_imdb(e.data.movie);
          var modsPassword;

          try {
            modsPassword = parseInt(Lampa.Storage.get('mods_password'));
          } catch (e) {} //Button online


          if (isNaN(modsPassword) || !isNaN(e.data.movie.pg) && e.data.movie.pg <= modsPassword) {
            Modss.online(e.data.movie);
          } //Style buttons


          $('.view--torrent').addClass('selector').empty().append('<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 48 48" width="48px" height="48px"><path d="M 23.501953 4.125 C 12.485953 4.125 3.5019531 13.11 3.5019531 24.125 C 3.5019531 32.932677 9.2467538 40.435277 17.179688 43.091797 L 17.146484 42.996094 L 7 16 L 15 14 C 17.573 20.519 20.825516 32.721688 27.728516 30.929688 C 35.781516 28.948688 28.615 16.981172 27 12.076172 L 34 11 C 38.025862 19.563024 39.693648 25.901226 43.175781 27.089844 C 43.191423 27.095188 43.235077 27.103922 43.275391 27.113281 C 43.422576 26.137952 43.501953 25.140294 43.501953 24.125 C 43.501953 13.11 34.517953 4.125 23.501953 4.125 z M 34.904297 29.314453 C 34.250297 34.648453 28.811359 37.069578 21.943359 35.517578 L 26.316406 43.763672 L 26.392578 43.914062 C 33.176993 42.923925 38.872645 38.505764 41.660156 32.484375 C 41.603665 32.485465 41.546284 32.486418 41.529297 32.486328 C 38.928405 32.472567 36.607552 31.572967 34.904297 29.314453 z"/></svg><span>' + Lampa.Lang.translate('full_torrents') + '</span>');
          $('.view--trailer').empty().append("<svg enable-background='new 0 0 512 512' id='Layer_1' version='1.1' viewBox='0 0 512 512' xml:space='preserve' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g><path fill='currentColor' d='M260.4,449c-57.1-1.8-111.4-3.2-165.7-5.3c-11.7-0.5-23.6-2.3-35-5c-21.4-5-36.2-17.9-43.8-39c-6.1-17-8.3-34.5-9.9-52.3   C2.5,305.6,2.5,263.8,4.2,222c1-23.6,1.6-47.4,7.9-70.3c3.8-13.7,8.4-27.1,19.5-37c11.7-10.5,25.4-16.8,41-17.5   c42.8-2.1,85.5-4.7,128.3-5.1c57.6-0.6,115.3,0.2,172.9,1.3c24.9,0.5,50,1.8,74.7,5c22.6,3,39.5,15.6,48.5,37.6   c6.9,16.9,9.5,34.6,11,52.6c3.9,45.1,4,90.2,1.8,135.3c-1.1,22.9-2.2,45.9-8.7,68.2c-7.4,25.6-23.1,42.5-49.3,48.3   c-10.2,2.2-20.8,3-31.2,3.4C366.2,445.7,311.9,447.4,260.4,449z M205.1,335.3c45.6-23.6,90.7-47,136.7-70.9   c-45.9-24-91-47.5-136.7-71.4C205.1,240.7,205.1,287.6,205.1,335.3z'/></g></svg><span>" + Lampa.Lang.translate('full_trailers') + "</span>");
          $('.open--menu').empty().append("<svg height='48' viewBox='0 0 48 48' width='48' xmlns='http://www.w3.org/2000/svg'><path d='M0 0h48v48H0z' fill='none'/><path fill='currentColor' d='M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm-4 29V15l12 9-12 9z'/></svg><span>" + Lampa.Lang.translate('title_watch') + "</span>");
        }
      });
      Lampa.Listener.follow('activity', function (e) {
        if (e.type == 'archive' && e.component == 'full') {
          Modss.online(e.object.card);
        }

        if (e.component == 'onlines_v1' && e.type == 'destroy') {
          Modss.last_view(e.object.movie);
        }
      });
      Lampa.Storage.listener.follow('change', function (e) {});
      Lampa.Settings.listener.follow('open', function (e) {
        if (e.name == 'main') {
          if (Lampa.Settings.main().render().find('[data-component="pub_param"]').length == 0) {
            Lampa.SettingsApi.addComponent({
              component: 'pub_param',
              name: 'KinoPub',
              icon: '<svg viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M19.7.5H4.3C2.2.5.5 2.2.5 4.3v15.4c0 2.1 1.7 3.8 3.8 3.8h15.4c2.1 0 3.8-1.7 3.8-3.8V4.3c0-2.1-1.7-3.8-3.8-3.8zM13 14.6H8.6c-.3 0-.5.2-.5.5v4.2H6V4.7h7c2.7 0 5 2.2 5 5 0 2.7-2.2 4.9-5 4.9z" fill="#ffffff" class="fill-000000 fill-ffffff"></path><path d="M13 6.8H8.6c-.3 0-.5.2-.5.5V12c0 .3.2.5.5.5H13c1.6 0 2.8-1.3 2.8-2.8.1-1.6-1.2-2.9-2.8-2.9z" fill="#ffffff" class="fill-000000 fill-ffffff"></path></svg>'
            });
          }

          if (Lampa.Settings.main().render().find('[data-component="fork_param"]').length == 0) {
            Lampa.SettingsApi.addComponent({
              component: 'fork_param',
              name: 'ForkTV',
              icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke="#ffffff" stroke-width="2" class="stroke-000000"><path d="M4.4 2h15.2A2.4 2.4 0 0 1 22 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 19.6V4.4A2.4 2.4 0 0 1 4.4 2Z"></path><path d="M12 20.902V9.502c-.026-2.733 1.507-3.867 4.6-3.4M9 13.5h6"></path></g></svg>'
            });
          }

          if (Lampa.Settings.main().render().find('[data-component="rezka_param"]').length == 0) {
            Lampa.SettingsApi.addComponent({
              component: 'rezka_param',
              name: 'HDRezka',
              icon: '<svg height="57" viewBox="0 0 58 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z" fill="white"/><rect x="2" y="2" width="54" height="53" rx="5" stroke="white" stroke-width="4"/></svg>'
            });
          }

          if (Lampa.Settings.main().render().find('[data-component="filmix_param"]').length == 0) {
            Lampa.SettingsApi.addComponent({
              component: 'filmix_param',
              name: 'Filmix',
              icon: '<svg height="57" viewBox="0 0 58 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z" fill="white"/><rect x="2" y="2" width="54" height="53" rx="5" stroke="white" stroke-width="4"/></svg>'
            });
          }

          if (Lampa.Settings.main().render().find('[data-component="modss_tv_param"]').length == 0) {
            Lampa.SettingsApi.addComponent({
              component: 'modss_tv_param',
              name: 'Modss-TV',
              icon: '<svg height="57px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" color="#fff" fill="currentColor" class="bi bi-tv"><path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM13.991 3l.024.001a1.46 1.46 0 0 1 .538.143.757.757 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.464 1.464 0 0 1-.143.538.758.758 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.464 1.464 0 0 1-.538-.143.758.758 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.46 1.46 0 0 1 .143-.538.758.758 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3h11.991zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2z"/></svg>'
            });
          }

          Lampa.Settings.main().update();
          Lampa.Settings.main().render().find('[data-component="filmix"], [data-component="rezka_param"], [data-component="pub_param"], [data-component="filmix_param"], [data-component="fork_param"], [data-component="modss_tv_param"]').addClass('hide');
        }

        if (e.name == 'mods_proxy') {
          $('.settings__title').text(Lampa.Lang.translate('title_proxy') + " MODS's");
          var ads = ['<div style="padding: 1.5em 2em; padding-top: 10px;">', '<div style="background: #3e3e3e; padding: 1em; border-radius: 0.3em;">', '<div style="font-size: 1em; margin-bottom: 1em; color: #ffd402;">#{info_attention} ⚠</div>', '<div style="line-height: 1.4;">#{online_proxy_title_descr}</div>', '</div>', '</div>'].join('');
          e.body.find('[data-name="mods_proxy_all"]').before(Lampa.Lang.translate(ads));
        } else $('.settings__title').text(Lampa.Lang.translate('menu_settings'));

        if (e.name == 'fork_param') $('.settings__title').append(" ForkTV");

        if (e.name == 'filmix_param') {
          var ads = ['<div style="padding: 1.5em 2em; padding-top: 10px;">', '<div style="background: #3e3e3e; padding: 1em; border-radius: 0.3em;">', '<div style="font-size: 1em; margin-bottom: 1em; color: #ffd402;">#{info_attention} ⚠</div>', '<div style="line-height: 1.4;">#{info_filmix_descr} <span style="color: #24b4f9">filmix.ac</span></div>', '</div>', '</div>'].join('');
          e.body.find('[data-static="true"]:eq(0)').after(Lampa.Lang.translate(ads));
          $('.settings__title').append(" Filmix");
        }

        if (e.name == 'pub_param') {
          var ads = ['<div style="padding: 1.5em 2em; padding-top: 10px;">', '<div style="background: #3e3e3e; padding: 1em; border-radius: 0.3em;">', '<div style="font-size: 1em; margin-bottom: 1em; color: #ffd402;">#{info_attention} ⚠</div>', '<div style="line-height: 1.4;">#{info_pub_descr} <span style="color: #24b4f9">kino.pub</span></div>', '</div>', '</div>'].join('');
          e.body.find('[data-static="true"]:eq(0)').after(Lampa.Lang.translate(ads));
          $('.settings__title').append(" KinoPub");
        }

        if (e.name == 'settings_modss') $('.settings__title').text("MODS's");
      });
      Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready' && Lampa.Settings.main) {
          Modss.init(); //	Lampa.Storage.set('guide', '');
          // setTimeout(function () {
          //     if (window.innerHeight > 700 && Lampa.Storage.field('guide') == 'undefined') guide();
          // }, 3000);

          Lampa.SettingsApi.addComponent({
            component: 'settings_modss',
            name: "MODS's",
            icon: "<svg viewBox='0 0 24 24' xml:space='preserve' xmlns='https://www.w3.org/2000/svg'><path d='M19.7.5H4.3C2.2.5.5 2.2.5 4.3v15.4c0 2.1 1.7 3.8 3.8 3.8h15.4c2.1 0 3.8-1.7 3.8-3.8V4.3c0-2.1-1.7-3.8-3.8-3.8zm-2.1 16.4c.3 0 .5.2.5.5s-.2.5-.5.5h-3c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1V8.4l-3.2 5.4-.1.1-.1.1h-.6s-.1 0-.1-.1l-.1-.1-3-5.4v8.5h1c.3 0 .5.2.5.5s-.2.5-.5.5h-3c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1V7.1h-1c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h1.7c.1 0 .2.1.2.2l3.7 6.2 3.7-6.2.2-.2h1.7c.3 0 .5.2.5.5s-.2.5-.5.5h-1v9.8h1z' fill='#ffffff' class='fill-000000'></path></svg>"
          }); //Add-ons

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_status',
              type: 'title'
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:3em;height:2.3em;margin-top:-.5em;padding-right:.5em"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 5.5v7h2v-7h-2zm-.285 0H8.601l-1.497 4.113L5.607 8.5H3.493l2.611 6.964h2L10.715 8.5zm5.285 5h1.5a2.5 2.5 0 1 0 0-5H14v7h2v-2zm0-2v-1h1.5a.5.5 0 1 1 0 1H16z" fill="#ffffff" class="fill-000000"></path></svg></div><div style="font-size:1.3em">Осталось: 0 дней</div></div>'
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_password',
              type: 'static',
              //доступно select,input,trigger,title,static
              placeholder: Lampa.Lang.translate('placeholder_password'),
              values: '',
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('title_parent_contr'),
              description: Lampa.Lang.translate('placeholder_password')
            },
            onRender: function onRender(item) {
              function pass() {
                Lampa.Input.edit({
                  value: '' + Lampa.Storage.get('mods_password') + '',
                  free: true,
                  nosave: true
                }, function (t) {
                  Lampa.Storage.set('mods_password', t);
                  Lampa.Settings.update();
                });
              }

              item.on('hover:enter', function () {
                if (Lampa.Storage.get('mods_password')) Lampa.Input.edit({
                  value: '',
                  title: 'Введите старый пароль',
                  free: true,
                  nosave: true
                }, function (t) {
                  if (t == Lampa.Storage.get('mods_password')) pass();else Lampa.Noty.show('Неверный пароль');
                });else pass();
              });
              if (Lampa.Storage.get('mods_password')) item.find('.settings-param__descr').text('Изменить пароль');else item.find('.settings-param__descr').text(Lampa.Lang.translate('placeholder_password'));
            },
            onChange: function onChange(value) {
              if (value) $('body').find('.settings-param__descr').text('Изменить пароль');else $('body').find('.settings-param__descr').text(Lampa.Lang.translate('placeholder_password'));
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_title',
              type: 'title',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: Lampa.Lang.translate('title_addons')
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_onl',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: Lampa.Lang.translate('params_pub_on') + ' ' + Lampa.Lang.translate('title_online').toLowerCase(),
              description: Lampa.Lang.translate('onl_enable_descr')
            },
            onChange: function onChange(value) {
              Modss.online(cards);
              Lampa.Settings.update();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'online_continued',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('title_online_continued'),
              description: Lampa.Lang.translate('title_online_descr')
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.field('mods_onl')) item.show();else item.hide();
            }
          }); //HDRezka

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'rezka_param',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"></path><path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4.5 8.25V9H6v6h1.5v-2.25h2V15H11V9H9.5v2.25h-2zm7-.75H16a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1.5v-3zM13 9v6h3a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-3z" fill="#ffffff" class="fill-000000"></path></svg></div><div style="font-size:1.3em">HDRezka</div></div>'
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.field('mods_onl')) {
                item.show();
                $('.settings-param__name', item).before('<div class="settings-param__status ' + (Lampa.Storage.field("online_rezka_status") === true ? 'active' : 'error') + '"></div>');
              } else item.hide();

              item.on('hover:enter', function () {
                Lampa.Settings.create('rezka_param');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'rezka_param',
            param: {
              name: 'mods_onl_rezka_status',
              type: 'title',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            onRender: function onRender(item) {
              $('span', item).before('<div class="settings-param__status ' + (Lampa.Storage.field("online_rezka_status") === true ? 'active' : 'error') + '"></div>');
            },
            field: {
              name: Lampa.Lang.translate('settings_server_auth') + ' HDRezka'
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'rezka_param',
            param: {
              name: 'mods_onl_rezka_login',
              type: 'input',
              //доступно select,input,trigger,title,static
              values: '',
              placeholder: Lampa.Lang.translate('settings_server_not_specified'),
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('settings_server_login')
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'rezka_param',
            param: {
              name: 'mods_onl_rezka_password',
              type: 'input',
              //доступно select,input,trigger,title,static
              values: '',
              placeholder: Lampa.Lang.translate('settings_server_not_specified'),
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('settings_server_password')
            },
            onChange: function onChange(value) {
              if (value && Lampa.Storage.field('mods_onl_rezka_login')) Login();else Logout();
              var rezka_login_status = $('.settings-param__status').removeClass('active error wait').addClass('wait');

              function Login(success, error) {
                var url = 'https://hdrezkarfv.org/ajax/login/';
                var postdata = 'login_name=' + encodeURIComponent(Lampa.Storage.field('mods_onl_rezka_login'));
                postdata += '&login_password=' + encodeURIComponent(Lampa.Storage.field('mods_onl_rezka_password'));
                postdata += '&login_not_save=0';
                Pub.network.clear();
                Pub.network.timeout(10000);
                Pub.network.silent(url, function (json) {
                  if (json && (json.success || json.message == 'Уже авторизован на сайте. Необходимо обновить страницу!')) {
                    Lampa.Storage.set("online_rezka_status", 'true');
                    rezka_login_status.removeClass('active error wait').addClass('active');
                  } else {
                    Lampa.Storage.set("online_rezka_status", 'false');
                    rezka_login_status.removeClass('active error wait').addClass('error');
                  }
                }, function (a, c) {
                  Lampa.Noty.show(Pub.network.errorDecode(a, c));
                  rezka_login_status.removeClass('active error wait').addClass('error');
                }, postdata, {
                  withCredentials: true
                });
              }

              function Logout() {
                var url = 'https://hdrezkarfv.org/logout/';
                Pub.network.clear();
                Pub.network.timeout(8000);
                Pub.network.silent(url, function (str) {
                  Lampa.Storage.set("online_rezka_status", 'false');
                  Lampa.Noty.show(Lampa.Lang.translate('torrent_serial_date'));
                  rezka_login_status.removeClass('active error wait').addClass('active');
                }, function (a, c) {
                  Lampa.Noty.show(Pub.network.errorDecode(a, c));
                  rezka_login_status.removeClass('active error wait').addClass('error');
                }, false, {
                  dataType: 'text',
                  withCredentials: true
                });
              }
            }
          }); //Filmix

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'filmix_param',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg height="26" width="26" viewBox="0 0 58 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z" fill="white"/><rect x="2" y="2" width="54" height="53" rx="5" stroke="white" stroke-width="4"/></svg></div><div style="font-size:1.3em">Filmix</div></div>',
              description: ' '
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.field('mods_onl')) {
                item.show();
                $('.settings-param__name', item).before('<div class="settings-param__status"></div>');
                Filmix.showStatus(item);
              } else item.hide();

              item.on('hover:enter', function () {
                Lampa.Settings.create('filmix_param');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'filmix_param',
            param: {
              name: 'filmix_status',
              type: 'title',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: '<b style="color:#fff">' + Lampa.Lang.translate('title_status') + '</b>',
              description: ' '
            },
            onRender: function onRender(item) {
              $('.settings-param__descr', item).before('<div class="settings-param__status"></div>');
              Filmix.showStatus(item);
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'filmix_param',
            param: {
              name: 'filmix_token',
              type: 'input',
              //доступно select,input,trigger,title,static
              values: '',
              placeholder: Lampa.Lang.translate('filmix_param_placeholder'),
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('filmix_param_add_title'),
              description: Lampa.Lang.translate('filmix_param_add_descr')
            },
            onChange: function onChange(value) {
              if (value) Filmix.checkPro(value);else {
                Lampa.Storage.set("filmix_status", {});
                Filmix.showStatus();
              }
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'filmix_param',
            param: {
              name: 'filmix_add',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('filmix_params_add_device') + ' Filmix',
              description: ''
            },
            onRender: function onRender(item) {
              item.on('hover:enter', function () {
                Filmix.add_new();
              });
            }
          }); //ForkTV

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_fork',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('params_pub_on') + ' ForkTV',
              description: Lampa.Lang.translate('fork_enable_descr')
            },
            onChange: function onChange(value) {
              if (value) ForkTV.check_forktv('', true);
              Lampa.Settings.update();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'fork_param',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg height="26" width="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke="#ffffff" stroke-width="2" class="stroke-000000"><path d="M4.4 2h15.2A2.4 2.4 0 0 1 22 4.4v15.2a2.4 2.4 0 0 1-2.4 2.4H4.4A2.4 2.4 0 0 1 2 19.6V4.4A2.4 2.4 0 0 1 4.4 2Z"></path><path d="M12 20.902V9.502c-.026-2.733 1.507-3.867 4.6-3.4M9 13.5h6"></path></g></svg></div><div style="font-size:1.3em">ForkTV</div></div>',
              description: Lampa.Lang.translate('filmix_nodevice')
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.field('mods_fork')) {
                item.show();
                $('.settings-param__name', item).before('<div class="settings-param__status"></div>');
                ForkTV.check_forktv(item, true);
              } else item.hide();

              item.on('hover:enter', function () {
                Lampa.Settings.create('fork_param');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'fork_param',
            param: {
              name: 'forktv_url',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: 'http://no_save.forktv.me',
              description: Lampa.Lang.translate('filmix_nodevice')
            },
            onRender: function onRender(item) {
              $('.settings-param__name', item).before('<div class="settings-param__status"></div>');
              ForkTV.check_forktv(item);
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'fork_param',
            param: {
              name: 'ForkTV_add',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Storage.get('ForkTv_cat') ? Lampa.Lang.translate('title_fork_edit_cats') : Lampa.Lang.translate('title_fork_add_cats'),
              description: ''
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.get('forktv_auth')) {
                item.show();
              } else item.hide();

              item.on('hover:enter', function () {
                ForkTV.check_forktv(item);
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'fork_param',
            param: {
              name: 'ForkTV_clear',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('title_fork_clear'),
              description: Lampa.Lang.translate('title_fork_clear_descr')
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.get('forktv_auth')) {
                item.show();
              } else item.hide();

              item.on('hover:enter', function () {
                Lampa.Storage.set('ForkTv_cat', '');
                Lampa.Noty.show(Lampa.Lang.translate('title_fork_clear_noty'));
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'fork_param',
            param: {
              name: 'ForkTV_clearMac',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('title_fork_reload_code') + ' ID/MAC',
              description: ' '
            },
            onRender: function onRender(item) {
              $('.settings-param__descr', item).text(Lampa.Lang.translate('title_fork_current') + ' ID/MAC: ' + ForkTV.forktv_id);
              item.on('hover:enter', function () {
                ForkTV.updMac(item);
              });
            }
          }); //KinoPub

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_pub',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('params_pub_on') + ' KinoPub',
              description: Lampa.Lang.translate('params_pub_on_descr')
            },
            onChange: function onChange(value) {
              if (value == 'false') Lampa.Storage.set('source', 'tmdb');
              Lampa.Settings.update();
              Modss.tv_pub();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'pub_param',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg height="26" width="26" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M19.7.5H4.3C2.2.5.5 2.2.5 4.3v15.4c0 2.1 1.7 3.8 3.8 3.8h15.4c2.1 0 3.8-1.7 3.8-3.8V4.3c0-2.1-1.7-3.8-3.8-3.8zM13 14.6H8.6c-.3 0-.5.2-.5.5v4.2H6V4.7h7c2.7 0 5 2.2 5 5 0 2.7-2.2 4.9-5 4.9z" fill="#ffffff" class="fill-000000 fill-ffffff"></path><path d="M13 6.8H8.6c-.3 0-.5.2-.5.5V12c0 .3.2.5.5.5H13c1.6 0 2.8-1.3 2.8-2.8.1-1.6-1.2-2.9-2.8-2.9z" fill="#ffffff" class="fill-000000 fill-ffffff"></path></svg></div><div style="font-size:1.3em">KinoPub</div></div>',
              description: Lampa.Lang.translate('filmix_nodevice')
            },
            onRender: function onRender(item) {
              if (Lampa.Storage.field('mods_pub')) {
                item.show();
                $('.settings-param__name', item).before('<div class="settings-param__status"></div>');
                Pub.userInfo(item, true);
              } else item.hide();

              item.on('hover:enter', function () {
                Lampa.Settings.create('pub_param');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_auth',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: ' ',
              description: ' '
            },
            onRender: function onRender(item) {
              $('.settings-param__name', item).before('<div class="settings-param__status"></div>');
              Pub.userInfo(item);
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_auth_add',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: Lampa.Lang.translate('filmix_params_add_device') + ' KinoPub',
              description: Lampa.Lang.translate('pub_auth_add_descr')
            },
            onRender: function onRender(item) {
              item.on('hover:enter', function () {
                Pub.Auth_pub();
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_parametrs',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: Lampa.Lang.translate('title_settings'),
              description: Lampa.Lang.translate('descr_pub_settings')
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.get('logined_pub')) item.hide();
              item.on('hover:enter', function () {
                Pub.info_device();
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_source',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: Lampa.Lang.translate('params_pub_add_source'),
              description: Lampa.Lang.translate('params_pub_add_source_descr')
            },
            onRender: function onRender(item) {
              item.on('hover:enter', function () {
                Lampa.Noty.show(Lampa.Lang.translate('pub_source_add_noty'));
                Lampa.Storage.set('source', 'pub');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_refresh_token',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: Lampa.Lang.translate('params_pub_update_tocken')
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.get('pub_access_token') || !Lampa.Storage.get('logined_pub')) item.hide();
              item.on('hover:enter', function () {
                Pub.refreshTok();
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'pub_param',
            param: {
              name: 'pub_del_device',
              type: 'static' //доступно select,input,trigger,title,static

            },
            field: {
              name: Lampa.Lang.translate('params_pub_dell_device'),
              description: Lampa.Lang.translate('params_pub_dell_descr')
            },
            onRender: function onRender(item) {
              item.on('hover:enter', function () {
                Pub.delete_device(function () {
                  Lampa.Settings.create('pub_param');
                });
              });
              if (!Lampa.Storage.get('pub_access_token') || !Lampa.Storage.get('logined_pub')) item.hide();
            }
          }); //TV

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_tv',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('params_tv_enable'),
              description: Lampa.Lang.translate('params_tv_enable_descr')
            },
            onChange: function onChange(value) {
              Modss.tv_modss();
              Lampa.Settings.update();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'modss_tv_param',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg width="26px" height="26px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" color="#fff" fill="currentColor" class="bi bi-tv"><path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM13.991 3l.024.001a1.46 1.46 0 0 1 .538.143.757.757 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.464 1.464 0 0 1-.143.538.758.758 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.464 1.464 0 0 1-.538-.143.758.758 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.46 1.46 0 0 1 .143-.538.758.758 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3h11.991zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2z"/></svg></div><div style="font-size:1.3em">Modss-TV</div></div>'
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
              item.on('hover:enter', function () {
                Lampa.Settings.create('modss_tv_param');
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_url',
              type: 'input',
              //доступно select,input,trigger,title,static
              values: '',
              placeholder: 'Например: https://tva.org.ua/ip/sam/avto-iptv-tva.m3u',
              "default": ''
            },
            field: {
              name: 'Ссылка на плейлист'
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_source',
              type: 'select',
              //доступно select,input,trigger,title,static
              values: {
                culik: 'Kulik',
                free: 'FreeTv',
                url: 'Свой'
              },
              "default": 'culik'
            },
            field: {
              name: 'Источник',
              description: 'Источник встроенных каналов'
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
            },
            onChange: function onChange(value) {
              if (!Lampa.Storage.field('mods_tv_url') && value == 'url') Lampa.Storage.set('mods_tv_source', 'culik');
              Lampa.Settings.update();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_style',
              type: 'select',
              //доступно select,input,trigger,title,static
              values: {
                line: 'Строчный',
                vert: 'Вертикальный',
                cats: 'Категории'
              },
              "default": 'line'
            },
            field: {
              name: 'Тип навигации',
              description: 'Вид отображения списка каналов'
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_butt_ch',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: 'Переключение каналов',
              description: 'Позволяет переключать каналы кнопками переключения каналов на пульте'
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_cat_clear',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('title_fork_clear'),
              description: Lampa.Lang.translate('title_fork_clear_descr')
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
              item.on('hover:enter', function () {
                Lampa.Storage.set('Modss_tv_cat', '');
                Lampa.Noty.show(Lampa.Lang.translate('title_fork_clear_noty'));
              });
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'modss_tv_param',
            param: {
              name: 'mods_tv_fav_clear',
              type: 'static',
              //доступно select,input,trigger,title,static
              "default": ''
            },
            field: {
              name: Lampa.Lang.translate('title_tv_clear_fav'),
              description: Lampa.Lang.translate('title_tv_clear__fav_descr')
            },
            onRender: function onRender(item) {
              if (!Lampa.Storage.field('mods_tv')) item.hide();
              item.on('hover:enter', function () {
                Lampa.Storage.set('fav_chns', '');
                Lampa.Noty.show(Lampa.Lang.translate('title_tv_clear_fav_noty'));
              });
            }
          }); //Radio

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_radio',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('params_radio_enable'),
              description: Lampa.Lang.translate('params_radio_enable_descr')
            },
            onChange: function onChange(value) {
              Modss.radio();
            }
          }); //Collection

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_collection',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('params_pub_on') + ' ' + Lampa.Lang.translate('menu_collections').toLowerCase(),
              description: Lampa.Lang.translate('params_collections_descr')
            },
            onChange: function onChange(value) {
              if (value == 'true') Modss.collections();else $('body').find('.menu [data-action="collection"]').attr('data-action', 'collections');
            }
          }); //Styles

          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_title',
              type: 'title',
              //доступно select,input,trigger,title,static
              "default": true
            },
            field: {
              name: Lampa.Lang.translate('params_styles_title')
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_rating',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('title_enable_rating'),
              description: Lampa.Lang.translate('title_enable_rating_descr')
            },
            onChange: function onChange(value) {
              if ($('body').find('.full-start__poster').length && value == 'true') Modss.rating_kp_imdb(cards);else $('body').find('.rate--kp, .rate--imdb').addClass('hide');
            }
          });
          Lampa.SettingsApi.addParam({
            component: 'settings_modss',
            param: {
              name: 'mods_serial_info',
              type: 'trigger',
              //доступно select,input,trigger,title,static
              "default": false
            },
            field: {
              name: Lampa.Lang.translate('title_info_serial'),
              description: Lampa.Lang.translate('title_info_serial_descr')
            },
            onChange: function onChange(value) {
              if (value == 'true' && $('body').find('.full-start__poster').length) Modss.serialInfo(cards);else $('body').find('.files__left .time-line, .card--last_view, .card--new_seria').remove();
            }
          });

          if (/iPhone|iPad|iPod|android|x11/i.test(navigator.userAgent) || Lampa.Platform.is('android') && window.innerHeight < 1080) {
            Lampa.SettingsApi.addParam({
              component: 'settings_modss',
              param: {
                name: 'mods_butt_back',
                type: 'trigger',
                //доступно select,input,trigger,title,static
                "default": false
              },
              field: {
                name: Lampa.Lang.translate('title_add_butback'),
                description: Lampa.Lang.translate('title_add_butback_descr')
              },
              onChange: function onChange(value) {
                Lampa.Settings.update();
                if (value == 'true') Modss.buttBack();else $('body').find('.elem-mobile-back').remove();
              }
            });
            Lampa.SettingsApi.addParam({
              component: 'settings_modss',
              param: {
                name: 'mods_butt_pos',
                type: 'select',
                //доступно select,input,trigger,title,static
                values: {
                  right: Lampa.Lang.translate('buttback_right'),
                  left: Lampa.Lang.translate('buttback_left')
                },
                "default": 'right'
              },
              field: {
                name: Lampa.Lang.translate('title_butback_pos')
              },
              onRender: function onRender(item) {
                if (Lampa.Storage.field('mods_butt_back')) item.show();else item.hide();
              },
              onChange: function onChange(value) {
                Modss.buttBack(value);
              }
            });
          } //Proxy mods


          Lampa.SettingsApi.addComponent({
            component: 'mods_proxy',
            name: Lampa.Lang.translate('title_proxy') + ' MODS\'s',
            icon: '<svg fill=none height=46 viewBox="0 0 42 46"xmlns=http://www.w3.org/2000/svg><rect height=18 rx=1.5 width=39 y=26.5 x=1.5 stroke=white stroke-width=3 /><circle cx=9.5 cy=35.5 fill=white r=3.5 /><circle cx=26.5 cy=35.5 fill=white r=2.5 /><circle cx=32.5 cy=35.5 fill=white r=2.5 /><circle cx=21.5 cy=5.5 fill=white r=5.5 /><rect height=3 rx=1.5 width=11 y=4 fill=white x=31 /><rect height=3 rx=1.5 width=11 y=4 fill=white /><rect height=7 rx=1.5 width=3 y=14 fill=white x=20 /></svg>'
          });
          /*Lampa.SettingsApi.addParam({
          component: 'mods_proxy',
          param: {
          name: 'mods_proxy_main',
          type: 'trigger', //доступно select,input,trigger,title,static
          default: false
          },
          field: {
          name: Lampa.Lang.translate('online_proxy_title_main'),
          description: Lampa.Lang.translate('online_proxy_title_main_descr')
          }
          });*/

          Lampa.SettingsApi.addParam({
            component: 'mods_proxy',
            param: {
              name: 'mods_proxy_all',
              type: 'input',
              //доступно select,input,trigger,title,static
              values: '',
              "default": '',
              placeholder: Lampa.Lang.translate('online_proxy_placeholder')
            },
            field: {
              name: Lampa.Lang.translate('online_proxy_title'),
              description: Lampa.Lang.translate('online_proxy_descr')
            }
          });
          ['VideoCDN', 'HDRezka', 'Kinobase', 'Collaps', 'CDNmovies'].forEach(function (itm) {
            Lampa.SettingsApi.addParam({
              component: 'mods_proxy',
              param: {
                name: 'mods_proxy_' + itm.toLowerCase(),
                type: 'select',
                //доступно select,input,trigger,title,static
                values: {
                  on: Lampa.Lang.translate('params_pub_on'),
                  off: Lampa.Lang.translate('params_pub_off'),
                  url: Lampa.Lang.translate('online_proxy_url')
                },
                "default": 'off'
              },
              field: {
                name: itm,
                description: Lampa.Storage.get('onl_mods_proxy_' + itm.toLowerCase()) || ' '
              },
              onRender: function onRender(item) {
                var url = Lampa.Storage.get('onl_mods_proxy_' + itm.toLowerCase());
                if (url.length > 0) item.find('.settings-param__descr').text(url);
                if (url.length == 0) item.find('.settings-param__descr').addClass('hide'); //вызывается когда срабатывает рендер параметра
              },
              onChange: function onChange(value) {
                if (value == 'url') {
                  var name = itm.toLowerCase();
                  Lampa.Input.edit({
                    value: Lampa.Storage.get('onl_mods_proxy_' + name) || ''
                  }, function (t) {
                    if (t !== '') {
                      Lampa.Storage.set('onl_mods_proxy_' + name, t);
                      $('[data-name="mods_proxy_' + name).find('.settings-param__descr').removeClass('hide').text(t);
                    } else if (t == '') {
                      Lampa.Storage.set('mods_proxy_' + name, 'off');
                      Lampa.Storage.set('onl_mods_proxy_' + name, '');
                      $('[data-name="mods_proxy_' + name + '"]').find('.settings-param__descr').addClass('hide').text('');
                    }
                  });
                }
              }
            });
          }); //Close_app

          if (Lampa.Platform.is('android')) {
            Lampa.SettingsApi.addComponent({
              component: 'mods_exit',
              name: Lampa.Lang.translate('title_close_app'),
              icon: '<svg data-name="Layer 1" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect height="46" rx="4" ry="4" width="46" x="1" y="1" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2px" class="stroke-1d1d1b"></rect><path d="m12 12 24 24M12 36l24-24" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2px" class="stroke-1d1d1b"></path></svg>'
            });
            Lampa.SettingsApi.addParam({
              component: 'mods_exit',
              param: {
                name: 'close_app',
                type: 'static',
                //доступно select,input,trigger,title,static
                "default": true
              },
              field: {
                name: ''
              },
              onRender: function onRender(item) {
                Lampa.Android.exit();
              }
            });
          }

          $('body').append(Lampa.Template.get('hdgo_style', {}, true));
          $('body').append(Lampa.Template.get('modss_style', {}, true));
        }
      });

      window.dataLayer = window.dataLayer || [];
    }

    if (!window.plugin) startPlugin();
  })();

})();
