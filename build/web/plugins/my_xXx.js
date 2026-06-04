(function () {
    'use strict';

    function Xvideos(component) {
      var network = new Lampa.Reguest(); // let proxy = ''
      // let proxy = 'https://cors.nb557.workers.dev/'

      var proxy = 'https://vi1pr.netlify.app/pr/';
      var baseUrl = proxy + 'https://www.xvideos.com';
      var durationMapping = {
        'any': '',
        '10+ min': '&durf=10min_more',
        '20+ min': '&durf=20min_more'
      };
      var qualityMapping = {
        'any': '',
        '720p+': '&quality=hd',
        '1080p+': '&quality=1080P'
      };

      this.loadItemDetails = function (item, onComplete, onError) {
        network.silent(item.detailsUrl, function (respData) {
          var match = respData.match(/html5player.setVideoHLS\('(.*\/hls.m3u8.*)'\);/);

          if (!match) {
            Lampa.Noty.show('Video not found');
            onError();
            return;
          }

          var hlsDetailsUrl = match[1];
          network.silent(hlsDetailsUrl, function (respDt) {
            try {
              item.qualities = {};
              var qualitiesBaseUrl = hlsDetailsUrl.split('hls.m3u8')[0];
              var p360 = respDt.match(/hls-360p.*/);

              if (p360) {
                item.qualities['360p'] = qualitiesBaseUrl + p360[0];
              }

              var p480 = respDt.match(/hls-480p.*/);

              if (p480) {
                item.qualities['480p'] = qualitiesBaseUrl + p480[0];
              }

              var p720 = respDt.match(/hls-720p.*/);

              if (p720) {
                item.qualities['720p'] = qualitiesBaseUrl + p720[0];
              }

              var p1080 = respDt.match(/hls-1080p.*/);

              if (p1080) {
                item.qualities['1080p'] = qualitiesBaseUrl + p1080[0];
              }

              var preferably = Lampa.Storage.get('video_quality_default');

              if (preferably && item.qualities[preferably + 'p']) {
                item.url = item.qualities[preferably + 'p'];
              } else {
                item.url = item.qualities[Object.keys(item.qualities)[Object.keys(item.qualities).length - 1]];
              }

              onComplete(item);
            } catch (e) {
              console.log('xxx', "Error parsing videoDetails: " + e);
              Lampa.Noty.show('Error parsing videoDetails');
              onError();
            }
          }, function (a, c) {
            console.log('xxx', "Error loading videoDetails2: " + network.errorDecode(a, c));
            Lampa.Noty.show('Error loading videoDetails2');
            onError();
          }, false, {
            dataType: 'text'
          });
        }, function (a, c) {
          console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
          Lampa.Noty.show('Error loading videoDetails');
          onError();
        }, false, {
          dataType: 'text'
        });
      };

      this.getItems = function (page, filterItems, onComplete, onError) {
        var title = filterItems.find(function (item) {
          return item.titleInput;
        }).subtitle;
        var durationFilter = filterItems.find(function (item) {
          return item.durationItem;
        }).items.find(function (item) {
          return item.selected;
        }).duration;
        var qualityFilter = filterItems.find(function (item) {
          return item.qualityItem;
        }).items.find(function (item) {
          return item.selected;
        }).quality;
        var pageQuery = page - 1;
        var url = baseUrl;

        if (title) {
          url += '?k=' + encodeURIComponent(title);

          if (pageQuery < 1) {
            pageQuery = '';
          }

          url += '&p=' + pageQuery;
          url += durationMapping[durationFilter] + qualityMapping[qualityFilter];
        } else {
          if (pageQuery > 0) {
            url += '/best/' + getPrevMonth() + '/' + pageQuery;
          } else {
            url += '/best/' + getPrevMonth();
          }
        }

        network.silent(url, function (respData) {
          var resultItems = [];

          try {
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(respData, 'text/html');
            var videoElements = htmlDoc.querySelectorAll('.mozaique > div[data-video] , .mozaique > div[data-id]');

            if (videoElements.length) {
              videoElements.forEach(function (element) {
                var item = buildItem(element);

                if ((qualityFilter === 'any' || item.quality && extractNumber(item.quality) >= extractNumber(qualityFilter)) && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                  resultItems.push(item);
                }
              });
            } else {
              if (!respData.includes('<h3>No video match with this search.</h3>')) {
                console.log('xxx', "xVideos Error parsing video list: no match");
                Lampa.Noty.show("xVideos Error parsing video list: no match"); // onError();
              }
            }
          } catch (e) {
            console.log('xxx', "xVideos Error parsing video list: " + e);
            Lampa.Noty.show('xVideos Error parsing video list'); // onError();
          }

          onComplete(resultItems);
        }, function (a, c) {
          console.log('xxx', "xVideos Error loading video list: " + network.errorDecode(a, c));
          Lampa.Noty.show('xVideos Error loading video list');
          onComplete([]);
        }, false, {
          dataType: 'text'
        });
      };

      function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
      }

      function getPrevMonth() {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate(); // First, go to the 1st day of the current month

        var firstOfThisMonth = new Date(year, month, 1); // Subtract one day to get the last day of the previous month

        var lastOfPrevMonth = new Date(firstOfThisMonth - 1); // Pick the smaller of the original day and last day of prev month

        var newDay = Math.min(day, lastOfPrevMonth.getDate());
        return new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), newDay).toISOString().slice(0, 7);
      }

      function buildItem(element) {
        var _element$querySelecto, _element$querySelecto2, _element$querySelecto3, _element$querySelecto4;

        var item = {};
        item.name = (_element$querySelecto = element.querySelector(".thumb-under > p.title > a , .video-under .video-title a")) === null || _element$querySelecto === void 0 ? void 0 : _element$querySelecto.childNodes[0].nodeValue;
        item.picture = proxy + ((_element$querySelecto2 = element.querySelector(".thumb-inside a > img[data-videoid] , .video-thumb a img")) === null || _element$querySelecto2 === void 0 ? void 0 : _element$querySelecto2.getAttribute('data-src'));
        var href = element.querySelector(".thumb-inside a , a.thumb-link").href;

        if (href.startsWith('http')) {
          href = href.replace(/^.*\/\/[^\/]+/, '');
        }

        item.detailsUrl = baseUrl + '/' + href;
        item.time = (_element$querySelecto3 = element.querySelector(".thumb-under > p.metadata span.duration, .video-under .video-metadata span.duration")) === null || _element$querySelecto3 === void 0 ? void 0 : _element$querySelecto3.textContent;
        item.quality = (_element$querySelecto4 = element.querySelector(".thumb-inside a > span, .video-hd-mark")) === null || _element$querySelecto4 === void 0 ? void 0 : _element$querySelecto4.textContent;
        item.sourceName = 'xvideos';
        return item;
      }
    }

    function SpankBang(component) {
      var network = new Lampa.Reguest(); // let proxy = ''
      // let proxy = 'https://vi1pr.netlify.app/pr/'

      var proxy = 'https://cr-jgp4.onrender.com/';
      var baseUrl = proxy + 'https://spankbang.com';
      var cookie = 'coe=ww; cookie_consent_required=1; show_cookie_consent_modal=1; age_pass=1; coc=PL; cor=Unknown; cfc_ok=00|2|ww|spankbang|master|0; av=simple:False:True; backend_version=main; _cfuvid=JQkhuxq5tUhWAr7SYBWKt287axcY00PKgwRwKE6S4P4-1780241291.6168897-1.0.1.1-hupyIZk_UUFjyAYSm0PJmKhy6btmP7iHigB.v0Xe2d0; sb_session=eyJfcGVybWFuZW50Ijp0cnVlLCJ1c2VyIjp7ImlkIjowfX0.ahxTjQ.Y83sNaldPrkAKvSr719jGVz1wcM; ana_vid=40e3da24135c8aa1951fb0101e27d0114fa33d862a85f7ead242a7b91380163e; ana_sid=40e3da24135c8aa1951fb0101e27d0114fa33d862a85f7ead242a7b91380163e; cf_clearance=_zDLdwOxuWpuMUu5Jtqo6L7yv3fUun6nrfURfN_u.T4-1780241299-1.2.1.1-SjMXkaP5Y6_Zlf4YWZukqzez2dfFtFk2aN8Yrlm1iaEF7n0Vuh4NrSaq7DNS2ZhSSub45VYHRBb.._0.AoVMoywJvswa4XnIk0VHpxoSk1iS7_fDfoijvHtt9vP5MRhaVWqT5RxqqKddE5RaoEECRMf.9ae1Wy15Q9SMijLTKtxcmkCK0O87AU4GbrRhh9tIlbaBtIQ.xlEcdz.DsXyH3fN4BqvYX0YAD_CA5uqUZOrkGxkgKjTXzfcOLyO1wURxDuuLTZuhIV2RjI55LJN9hrKuBvgLvuZkr9OlyYtMeMpvsENeC0MG3mumrMYSDVl1cSnfemSuivTCJe0VySJ8aA; __cf_bm=Hr2Yhi2o2Zar4M86H2Yl7nm7vUNHk7tsD09YMnYqQLI-1780241299.6080015-1.0.1.1-V2Nsrt_ri3_2D7NbvFliyEceNoUlk07VCP4O67DVN4jmZTzUbYISAA4n9TMDr8ZDS8QYaQERCMJcKsqKyJqfjU8rLHt1.KYA7jpxBm5gE.mjdDmwcetF2wEWY1gp1Tom; media_layout=four-col; cookie_consent=eyJ1dWlkIjoiY2Q4NjJlZmQtOTY3My00OWU1LWE2YmItYzBiYWFlMDc2YzZkIiwidGltZXN0YW1wIjoxNzgwMjQxMzM2NDE1LCJjYXRlZ29yaWVzIjp7ImVzc2VudGlhbCI6dHJ1ZSwiZnVuY3Rpb25hbCI6dHJ1ZSwiYW5hbHl0aWNzIjp0cnVlLCJ0YXJnZXRpbmciOnRydWV9LCJ2ZXJzaW9uIjoidjEuMCIsInVzZXJfaWQiOjB9\n';
      var durationMapping = {
        'any': '',
        '10+ min': '&d=10',
        '20+ min': '&d=20'
      };
      var qualityMapping = {
        'any': '',
        '720p+': '&q=hd',
        '1080p+': '&q=fhd'
      };

      this.getItems = function (page, filterItems, onComplete, onError) {
        var title = filterItems.find(function (item) {
          return item.titleInput;
        }).subtitle;
        var durationFilter = filterItems.find(function (item) {
          return item.durationItem;
        }).items.find(function (item) {
          return item.selected;
        }).duration;
        var qualityFilter = filterItems.find(function (item) {
          return item.qualityItem;
        }).items.find(function (item) {
          return item.selected;
        }).quality;
        var url = baseUrl;

        if (title) {
          url += '/s/' + encodeURIComponent(title);
        } else {
          url += '/ci/channel/nubile+films';
        }

        url += '/' + page;
        url += '/?o=all' + durationMapping[durationFilter] + qualityMapping[qualityFilter]; // 'https://cors.nb557.workers.dev:8443/'+

        network["native"](url, function (respData) {
          // network.native(url, (respData) => {
          var resultItems = [];

          try {
            var respDataFixed = respData.replace(/\n/g, '');
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(respData, 'text/html');
            var videoElements = htmlDoc.querySelectorAll('[data-testid="main"] [x-data="videoList"] div[data-id]'); // let match = respDataFixed.match(/<div class="results results_search">(<div class="video-list.*)<.* class="paginat/);
            // if (!match) {
            //     match = respDataFixed.match(/p>(<div class="video-list.*)<div class="pagination"/);
            // }

            if (videoElements.length) {
              // var rootDiv = document.createElement("div");
              // rootDiv.innerHTML = match[1];
              // let videoElements = rootDiv.querySelectorAll("div[data-id][id]")
              videoElements.forEach(function (element) {
                var item = buildItem(element);
                var itemQuality = item.quality;

                if (itemQuality === 'HD') {
                  itemQuality = '1080p';
                } else if (itemQuality === '4K') {
                  itemQuality = '2160p';
                }

                if ((qualityFilter === 'any' || itemQuality && extractNumber(itemQuality) >= extractNumber(qualityFilter)) && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                  resultItems.push(item);
                }
              }); // rootDiv.remove()
            } else {
              if (!respDataFixed.includes('<div id="search_empty">')) {
                console.log('xxx', "Spank: Error parsing video list: no match");
                Lampa.Noty.show('Spank: Error parsing video list'); // onError();
              }
            }
          } catch (e) {
            console.log('xxx', "Spank: Error parsing video list: " + e);
            Lampa.Noty.show('Spank: Error parsing video list'); // onError();
          }

          onComplete(resultItems);
        }, function (a, c) {
          console.log('xxx', "Error loading video list: " + network.errorDecode(a, c));
          Lampa.Noty.show('Error loading video list');
          onComplete([]);
        }, false, {
          dataType: 'text',
          headers: {
            // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            // 'sec-ch-ua-mobile': '?1',
            'my_User-Agent': 'PostmanRuntime/7.54.0',
            'my_Cookie': cookie
          }
        });
      };

      this.loadItemDetails = function (item, onComplete, onError) {
        network["native"](item.detailsUrl, function (respData) {
          try {
            var match = respData.replace(/\n/g, '').match(/var stream_data = (.*);\n?.*var live_keywords/);
            var dataJson = JSON.parse(match[1].replace(/'/g, '"'));
            item.qualities = {};
            var p320 = dataJson['320p'];

            if (p320 && p320[0]) {
              item.qualities['320p'] = p320[0];
            }

            var p480 = dataJson['480p'];

            if (p480 && p480[0]) {
              item.qualities['480p'] = p480[0];
            }

            var p720 = dataJson['720p'];

            if (p720 && p720[0]) {
              item.qualities['720p'] = p720[0];
            }

            var p1080 = dataJson['1080p'];

            if (p1080 && p1080[0]) {
              item.qualities['1080p'] = p1080[0];
            }

            var p2160 = dataJson['4k'];

            if (p2160 && p2160[0]) {
              item.qualities['2160p'] = p2160[0];
            }

            var preferably = Lampa.Storage.get('video_quality_default');

            if (preferably && item.qualities[preferably + 'p']) {
              item.url = item.qualities[preferably + 'p'];
            } else {
              item.url = item.qualities[Object.keys(item.qualities)[Object.keys(item.qualities).length - 1]];
            }

            onComplete(item);
          } catch (e) {
            console.log('xxx', "Error parsing videoDetails: " + e);
            Lampa.Noty.show('Error parsing videoDetails');
            onError();
          }
        }, function (a, c) {
          component.empty(network.errorDecode(a, c));
          console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
          Lampa.Noty.show('Error loading videoDetails');
          onError();
        }, false, {
          dataType: 'text',
          headers: {
            'my_User-Agent': 'PostmanRuntime/7.54.0' // 'my_Referer': 'https://spankbang.com',
            // 'my_Cookie': cookie

          }
        });
      };

      function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
      }

      function buildItem(element) {
        var _element$querySelecto, _element$querySelecto2;

        var item = {};
        item.name = element.querySelector('a > picture > img').getAttribute('alt');
        item.picture = proxy + ((_element$querySelecto = element.querySelector('a > picture > img')) === null || _element$querySelecto === void 0 ? void 0 : _element$querySelecto.getAttribute('src'));
        item.time = (_element$querySelecto2 = element.querySelector('div[data-testid="video-item-length"]')) === null || _element$querySelecto2 === void 0 ? void 0 : _element$querySelecto2.textContent; // item.quality = element.querySelector('a[x-data="videoItem"] .left-2')?.textContent

        item.quality = "1080p";
        var href = element.querySelector('a').href;

        if (href.startsWith('http')) {
          href = href.replace(/^.*\/\/[^\/]+/, '');
        }

        var detailsUrl = baseUrl + '/' + href;
        item.detailsUrl = detailsUrl;
        item.sourceName = 'spankBang';
        return item;
      }
    }

    function subscribe() {
      this.add = function (type, listener) {
        if (this._listeners === undefined) this._listeners = {};
        var listeners = this._listeners;

        if (listeners[type] === undefined) {
          listeners[type] = [];
        }

        if (listeners[type].indexOf(listener) === -1) {
          listeners[type].push(listener);
        }
      };

      this.follow = function (type, listener) {
        var _this = this;

        type.split(',').forEach(function (name) {
          _this.add(name, listener);
        });
      };

      this.has = function (type, listener) {
        if (this._listeners === undefined) return false;
        var listeners = this._listeners;
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
      };

      this.remove = function (type, listener) {
        if (this._listeners === undefined) return;
        var listeners = this._listeners;
        var listenerArray = listeners[type];

        if (listenerArray !== undefined) {
          var index = listenerArray.indexOf(listener);

          if (index !== -1) {
            listenerArray.splice(index, 1);
          }
        }
      };

      this.send = function (type) {
        var event = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (this._listeners === undefined) return;
        var listeners = this._listeners;
        var listenerArray = listeners[type];

        if (listenerArray !== undefined) {
          event.target = this;
          var array = listenerArray.slice(0);

          for (var i = 0, l = array.length; i < l; i++) {
            array[i].call(this, event);
          }
        }
      };

      this.destroy = function () {
        this._listeners = null;
      };
    }

    function start$4() {
      return new subscribe();
    }

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function (sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }

      return target;
    }

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

    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      Object.defineProperty(subClass, "prototype", {
        writable: false
      });
      if (superClass) _setPrototypeOf(subClass, superClass);
    }

    function _getPrototypeOf(o) {
      _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
      return _getPrototypeOf(o);
    }

    function _setPrototypeOf(o, p) {
      _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };
      return _setPrototypeOf(o, p);
    }

    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct) return false;
      if (Reflect.construct.sham) return false;
      if (typeof Proxy === "function") return true;

      try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        return true;
      } catch (e) {
        return false;
      }
    }

    function _assertThisInitialized(self) {
      if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return self;
    }

    function _possibleConstructorReturn(self, call) {
      if (call && (typeof call === "object" || typeof call === "function")) {
        return call;
      } else if (call !== void 0) {
        throw new TypeError("Derived constructors may only return object or undefined");
      }

      return _assertThisInitialized(self);
    }

    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();

      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived),
            result;

        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;

          result = Reflect.construct(Super, arguments, NewTarget);
        } else {
          result = Super.apply(this, arguments);
        }

        return _possibleConstructorReturn(this, result);
      };
    }

    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
    }

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    function _iterableToArrayLimit(arr, i) {
      var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

      if (_i == null) return;
      var _arr = [];
      var _n = true;
      var _d = false;

      var _s, _e;

      try {
        for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }

    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;

      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

      return arr2;
    }

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    function toObject(a) {
      if (Object.prototype.toString.call(a) === '[object Object]') return a;else {
        a = {};
        return a;
      }
    }

    function toArray(a) {
      if (Object.prototype.toString.call(a) === '[object Object]') {
        var b = [];

        for (var i in a) {
          b.push(a[i]);
        }

        return b;
      } else if (typeof a == 'string' || a == null || typeof a == 'number' || typeof a == 'undefined') return [];else return a;
    }

    function decodeJson(string, empty) {
      var json = empty || {};

      if (string) {
        try {
          json = JSON.parse(string);
        } catch (e) {}
      }

      return json;
    }

    function isObject(a) {
      return Object.prototype.toString.call(a) === '[object Object]';
    }

    function isArray(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    }

    function extend(a, b, replase) {
      for (var i in b) {
        if (_typeof(b[i]) == 'object') {
          if (a[i] == undefined) a[i] = Object.prototype.toString.call(b[i]) == '[object Array]' ? [] : {};
          this.extend(a[i], b[i], replase);
        } else if ((a[i] == undefined || replase) && b[i] !== undefined) a[i] = b[i];
      }
    }

    function empty$1(a, b) {
      for (var i in b) {
        if (!a[i]) a[i] = b[i];
      }
    }

    function getKeys(a, add) {
      var k = add || [];

      for (var i in a) {
        k.push(i);
      }

      return k;
    }

    function getValues(a, add) {
      var k = add || [];

      for (var i in a) {
        k.push(a[i]);
      }

      return k;
    }

    function remove$2(from, need) {
      var inx = from.indexOf(need);
      if (inx >= 0) from.splice(inx, 1);
    }

    function clone(a) {
      return JSON.parse(JSON.stringify(a));
    }

    function insert(where, index, item) {
      where.splice(index, 0, item);
    }

    function destroy$7(arr) {
      var call_function = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'destroy';
      var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      var where = toArray(arr);

      for (var i = where.length - 1; i >= 0; i--) {
        if (where[i] && where[i][call_function]) where[i][call_function](value);
      }
    }

    function groupBy(xs, key) {
      return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    }

    function removeNoIncludes(where, items) {
      for (var i = where.length - 1; i >= 0; i--) {
        if (items.indexOf(where[i]) === -1) remove$2(where, where[i]);
      }

      return where;
    }

    function shuffle(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }

      return array;
    }

    var Arrays = {
      toObject: toObject,
      toArray: toArray,
      decodeJson: decodeJson,
      isObject: isObject,
      isArray: isArray,
      extend: extend,
      getKeys: getKeys,
      getValues: getValues,
      insert: insert,
      clone: clone,
      remove: remove$2,
      destroy: destroy$7,
      empty: empty$1,
      groupBy: groupBy,
      removeNoIncludes: removeNoIncludes,
      shuffle: shuffle
    };

    var ru = {
      lang_choice_title: 'Добро пожаловать',
      lang_choice_subtitle: 'Выберите свой язык',
      more: 'Еще',
      show_more: 'Показать ещё',
      more_results: 'Показать больше результатов',
      loading: 'Загрузка',
      nofind_movie: 'Не удалось найти фильм.',
      noname: 'Без названия',
      nochoice: 'Не выбрано',
      cancel: 'Отменить',
      confirm: 'Подтверждаю',
      sure: 'Вы уверены?',
      nodata: 'Нет данных',
      back: 'Назад',
      ready: 'Готово',
      search: 'Поиск',
      search_input: 'Введите текст',
      search_empty: 'История поиска пуста.',
      search_delete: 'Влево - удалить',
      search_start_typing: 'Начните вводить текст для поиска.',
      search_searching: 'Идет поиск...',
      search_start: 'Начать поиск',
      search_nofound: 'По вашему запросу ничего не найдено.',
      full_genre: 'Жанр',
      full_production: 'Производство',
      full_date_of_release: 'Дата релиза',
      full_budget: 'Бюджет',
      full_countries: 'Страны',
      full_like: 'Нравится',
      full_torrents: 'Торренты',
      full_trailers: 'Трейлеры',
      full_detail: 'Подробно',
      full_notext: 'Без описания.',
      full_series_release: 'Выход серий',
      full_next_episode: 'Следующая',
      full_episode_days_left: 'Осталось дней',
      full_trailer_official: 'Официальный',
      full_trailer_no_official: 'Неофициальный',
      full_season: 'Cезон',
      full_episode: 'Эпизод',
      full_directing: 'Режиссура',
      full_writing: 'Сценарий',
      settings_cub_sync: 'Синхронизация',
      settings_cub_sync_descr: 'Синхронизация с сервисом CUB: синхронизация ваших закладок, истории просмотров, меток и тайм-кодов. Сайт: www.cub.watch',
      settings_cub_account: 'Аккаунт',
      settings_cub_logged_in_as: 'Вошли как',
      settings_cub_profile: 'Профиль',
      settings_cub_sync_btn: 'Синхронизировать',
      settings_cub_sync_btn_descr: 'Сохранить локальные закладки в аккаунт CUB',
      settings_cub_backup: 'Бэкап',
      settings_cub_backup_descr: 'Сохранить или загрузить бэкап данных',
      settings_cub_logout: 'Выйти из аккаунта',
      settings_cub_signin: 'Авторизация',
      settings_cub_not_specified: 'Не указан',
      settings_cub_password: 'Пароль',
      settings_cub_status: 'Статус',
      settings_cub_backup_import: 'Импорт',
      settings_cub_backup_export: 'Экспорт',
      settings_cub_sync_filters: 'Синхронизация фильтров',
      settings_cub_sync_calendar: 'Синхронизация календаря',
      settings_cub_sync_quality: 'Синхронизация отметок (качество)',
      settings_cub_sync_search: 'Синхронизация истории поиска',
      settings_cub_sync_recomends: 'Синхронизация рекомендаций',
      settings_cub_sync_timecodes: 'Синхронизация тайм-кодов',
      settings_cub_signin_button: 'Выполнить вход',
      settings_input_links: 'Избранное',
      settings_interface_type: 'Облегчённая версия',
      settings_interface_size: 'Размер интерфейса',
      settings_interface_background: 'Фон',
      settings_interface_background_use: 'Показывать фон',
      settings_interface_background_type: 'Тип фона',
      settings_interface_performance: 'Быстродействие',
      settings_interface_animation: 'Анимация',
      settings_interface_animation_descr: 'Анимация карточек и контента',
      settings_interface_attenuation: 'Затухание',
      settings_interface_attenuation_descr: 'Плавное затухание карточек снизу и сверху',
      settings_interface_scroll: 'Тип скролинга',
      settings_interface_view_card: 'Тип просмотра карточек',
      settings_interface_view_card_descr: 'По мере скроллинга ленты карточки будут подгружаться постепенно или загружаться все',
      settings_interface_lang: 'Язык интерфейса',
      settings_interface_lang_reload: 'Необходимо перезапустить приложение, нажмите «OK» для перезагрузки',
      settings_interface_card_interfice: 'Интерфейс карточек',
      settings_interface_card_poster: 'Показать постер',
      settings_interface_card_cover: 'Показать обложку',
      settings_interface_glass: 'Стекло',
      settings_interface_glass_descr: 'Показывать интерфейс в стекловидном стиле',
      settings_interface_glass_opacity: 'Прозрачность стекла',
      settings_interface_black_style: 'Чёрный стиль',
      settings_interface_hide_outside_the_screen: 'Скрывать карточки за пределами экрана',
      settings_interface_hide_outside_the_screen_descr: 'Это ускорит рендер интерфейса и улучшит производительность',
      settings_main_account: 'Аккаунт',
      settings_main_interface: 'Интерфейс',
      settings_main_player: 'Плеер',
      settings_main_parser: 'Парсер',
      settings_main_torrserver: 'TorrServer',
      settings_main_plugins: 'Расширения',
      settings_main_rest: 'Остальное',
      settings_rest_start: 'Стартовая страница',
      settings_rest_start_descr: 'С какой страницы начинать при запуске',
      settings_rest_source: 'Источник',
      settings_rest_source_use: 'Основной источник',
      settings_rest_source_descr: 'Откуда брать информацию о фильмах',
      settings_rest_tmdb_lang: 'На каком языке отображать данные с TMDB',
      settings_rest_tmdb_prox: 'Проксировать TMDB',
      settings_rest_tmdb_prox_auto: 'Включить прокси автоматически',
      settings_rest_tmdb_posters: 'Разрешение постеров TMDB',
      settings_rest_screensaver: 'Скринсейвер',
      settings_rest_screensaver_use: 'Показывать заставку при бездействии',
      settings_rest_screensaver_type: 'Тип заставки',
      settings_rest_screensaver_time: 'Через сколько минут запустить скринсейвер',
      settings_rest_helper: 'Подсказки',
      settings_rest_helper_use: 'Показывать подсказки',
      settings_rest_helper_reset: 'Показать подсказки снова',
      settings_rest_pages: 'Сколько страниц хранить в памяти',
      settings_rest_pages_descr: 'Хранит страницы в том состоянии, в котором вы их покинули.',
      settings_rest_time: 'Сместить время',
      settings_rest_navigation: 'Тип навигации',
      settings_rest_keyboard: 'Тип клавиатуры',
      settings_rest_device: 'Название устройства',
      settings_rest_device_placeholder: 'Например: Моя Лампа',
      settings_rest_cache: 'Очистить кэш',
      settings_rest_cache_descr: 'Будут очищены все настройки и данные',
      settings_rest_tmdb_example: 'Например:',
      settings_rest_tmdb_api_descr: 'Для получения данных',
      settings_rest_tmdb_image_descr: 'Для получения изображений',
      settings_rest_card_quality: 'Отметки качества',
      settings_rest_card_quality_descr: 'Отображать отметки качества на карточках',
      settings_rest_card_episodes: 'Отметки эпизодов',
      settings_rest_card_episodes_descr: 'Отображать отметки эпизодов на карточках',
      settings_rest_cache_images: 'Кэш изображений',
      settings_rest_cache_images_descr: 'Кэшировать постеры и фоны в локальное хранилище',
      settings_parser_use: 'Использовать парсер',
      settings_parser_use_descr: 'Тем самым, вы соглашаетесь принять на себя всю ответственность за использование публичных ссылок для просмотра торрент и онлайн контента.',
      settings_parser_type: 'Тип парсера для торрентов',
      settings_parser_jackett_placeholder: 'Например: 192.168.х',
      settings_parser_jackett_link: 'Ссылка',
      settings_parser_jackett_link_descr: 'Укажите ссылку на скрипт Jackett',
      settings_parser_jackett_key_placeholder: 'Например: sa0sk83d..',
      settings_parser_jackett_key: 'Api-ключ',
      settings_parser_jackett_key_descr: 'Находится в Jackett',
      settings_parser_torlook_type: 'Метод парсинга сайта TorLook',
      settings_parser_scraperapi_placeholder: 'Например: scraperapi.com',
      settings_parser_scraperapi_link: 'Ссылка на парсер сайтов',
      settings_parser_scraperapi_descr: 'Зарегистрируйтесь на сайте scraperapi.com, введите ссылку api.scraperapi.com?api_key=...&url={q}<br>В {q} будет поставляться сайт w41.torlook.info',
      settings_parser_search: 'Поиск',
      settings_parser_search_descr: 'На каком языке производить поиск?',
      settings_parser_in_search: 'Парсер в поиске',
      settings_parser_in_search_descr: 'Показывать результаты в поиске?',
      settings_parser_timeout_title: 'Таймаут парсера',
      settings_parser_timeout_descr: 'Время (в секундах) ожидания ответа от сервера',
      settings_player_type: 'Тип плеера',
      settings_player_type_descr: 'Каким плеером воспроизводить',
      settings_player_iptv_type: 'Тип плеера для IPTV',
      settings_player_iptv_type_descr: 'Каким плеером воспроизводить IPTV каналы',
      settings_player_reset: 'Сбросить плеер по умолчанию',
      settings_player_reset_descr: 'Сбрасывает выбранный Android плеер в приложении',
      settings_player_path: 'Путь к плееру',
      settings_player_path_descr: 'Укажите путь к плееру .exe',
      settings_player_normalization: 'Нормализация звука',
      settings_player_normalization_descr: 'Нормализирует звук в один уровень, понижает громкие звуки и повышает тихие.',
      settings_player_next_episode: 'Следующая серия',
      settings_player_next_episode_descr: 'Автоматически переключать на следующую серию по окончании текущей',
      settings_player_timecode: 'Тайм-код',
      settings_player_timecode_descr: 'Продолжить с последнего места просмотра',
      settings_player_scale: 'Метод масштабирования',
      settings_player_scale_descr: 'Каким образом производить вычисления для масштабирования видео',
      settings_player_subs: 'Субтитры',
      settings_player_subs_use: 'Включить',
      settings_player_subs_use_descr: 'Всегда включать субтитры после запуска видео',
      settings_player_subs_size: 'Размер',
      settings_player_subs_size_descr: 'Размер субтитров на экране',
      settings_player_subs_stroke_use: 'Использовать окантовку',
      settings_player_subs_stroke_use_descr: 'Субтитры будут обведены черным цветом для улучшения читаемости',
      settings_player_subs_backdrop_use: 'Использовать подложку',
      settings_player_subs_backdrop_use_descr: 'Субтитры будут отображаться на полупрозрачной подложке для улучшения читаемости',
      settings_player_quality: 'Качество видео по умолчанию',
      settings_player_quality_descr: 'Предпочтительное качество видео для просмотра',
      settings_player_hls_title: 'Обработка потока .m3u8',
      settings_player_hls_descr: 'Не трогайте этот параметр, если не знаете, зачем он',
      settings_player_rewind_title: 'Перемотка',
      settings_player_rewind_descr: 'Интервал перемотки в секундах',
      settings_plugins_notice: 'Для применения плагина необходимо перезагрузить приложение',
      settings_plugins_add: 'Добавить плагин',
      settings_plugins_add_descr: 'Для удаления добавленного плагина удерживайте или нажмите дважды клавишу (OK) на нем',
      settings_plugins_install: 'Установить плагин',
      settings_plugins_install_descr: 'Установить плагин из списка доступных',
      settings_server_link: 'Использовать ссылку',
      settings_server_links: 'Ссылки',
      settings_server_placeholder: 'Например: 192.168.х',
      settings_server_link_one: 'Основная ссылка',
      settings_server_link_one_descr: 'Укажите основную ссылку на скрипт TorrServer',
      settings_server_link_two: 'Дополнительная ссылка',
      settings_server_link_two_descr: 'Укажите дополнительную ссылку на скрипт TorrServer',
      settings_server_additionally: 'Дополнительно',
      settings_server_client: 'Встроенный клиент',
      settings_server_client_descr: 'Использовать встроенный JS-клиент TorrServe, иначе запускается системный.',
      settings_server_base: 'Сохранять в базу',
      settings_server_base_descr: 'Торрент будет добавлен в базу TorrServer',
      settings_server_preload: 'Использовать буфер пред.загрузки',
      settings_server_preload_descr: 'Дожидаться заполнения буфера предварительной загрузки TorrServer перед проигрыванием',
      settings_server_auth: 'Авторизация',
      settings_server_password_use: 'Вход по паролю',
      settings_server_login: 'Логин',
      settings_server_password: 'Пароль',
      settings_server_not_specified: 'Не указан',
      settings_webos_launcher: 'Запуск приложения',
      settings_webos_launcher_add_device: 'Установить как стартовое',
      settings_webos_launcher_remove_device: 'Убрать из стартовых приложений',
      torent_nohash_reasons: 'Причины',
      torent_nohash_reason_one: 'TorServer не смог скачать торрент файл',
      torent_nohash_reason_two: 'Ответ от TorServer',
      torent_nohash_reason_three: 'Ссылка',
      torent_nohash_do: 'Что делать?',
      torent_nohash_do_one: 'Проверьте правильно ли вы настроили Jackett',
      torent_nohash_do_two: 'Приватные источники могут не выдавать ссылку на файл',
      torent_nohash_do_three: 'Убедитесь что Jackett тоже может скачать файл',
      torent_nohash_do_four: 'Написать в нашу Telegram-группу: @lampa_group',
      torent_nohash_do_five: 'Укажите какой фильм, какая раздача и по возможности фото этой раздачи',
      torrent_error_text: 'Не удалось подключиться к TorrServe. Давайте быстро пройдёмся по списку возможных проблем и всё проверим.',
      torrent_error_step_1: 'Запущен ли TorrServe',
      torrent_error_step_2: 'Динамический IP-адрес',
      torrent_error_step_3: 'Протокол и порт',
      torrent_error_step_4: 'Блокировка антивирусами',
      torrent_error_step_5: 'Проверьте на доступность',
      torrent_error_step_6: 'Все равно не работает',
      torrent_error_info_1: 'Убедитесь, что вы запустили TorrServe на устройстве, где он установлен.',
      torrent_error_info_2: 'Частая ошибка, изменился IP-адрес устройства с TorrServe. Убедитесь, что IP-адрес, который вы ввели - {ip}, совпадает с адресом устройства, на котором установлен TorrServe.',
      torrent_error_info_3: 'Для подключения к TorrServe, необходимо указать протокол http:// в начале и порт :8090 в конце адреса. Убедитесь, что после IP-адреса указан порт, ваш текущий адрес - {ip}',
      torrent_error_info_4: 'Частое явление, антивирус или брандмауэр может блокировать доступ по IP-адресу, попробуйте отключить антивирус и брандмауэр.',
      torrent_error_info_5: 'На любом другом устройстве в этой же сети, откройте в браузере адрес {ip} и проверьте, доступен ли веб-интерфейс TorrServe.',
      torrent_error_info_6: 'Если после всех проверок всё равно возникает ошибка подключения, попробуйте перезагрузить TorrServe и интернет-адаптер.',
      torrent_error_info_7: 'Если проблема не устранена, пишите в Telegram-группу @lampa_group с текстом (Lampa не подключается к TorrServe после всех проверок, текущий адрес {ip})',
      torrent_error_start: 'Начать проверку',
      torrent_error_nomatrix: 'Не удалось подтвердить версию Matrix',
      torrent_error_made: 'Выполнено',
      torrent_error_from: 'из',
      torrent_error_next: 'Далее',
      torrent_error_complite: 'Завершить',
      torrent_error_connect: 'Ошибка подключения',
      torrent_error_check_no_auth: 'Сервер ответил на запрос, но не удалось пройти авторизацию',
      torrent_install_need: 'Необходим TorrServe',
      torrent_install_text: 'TorrServe – приложение, которое позволяет просматривать контент из торрент-файлов в онлайн режиме.<br><br>Более детальную информацию по установке вы найдете в Telegram-группах, указанных ниже.',
      torrent_install_contact: 'Telegram-группы',
      torrent_item_bitrate: 'Битрейт',
      torrent_item_seeds: 'Раздают',
      torrent_item_grabs: 'Качают',
      torrent_item_mb: 'Мбит/с',
      torrent_serial_episode: 'Серия',
      torrent_serial_season: 'Сезон',
      torrent_serial_date: 'Выход',
      torrent_get_magnet: 'Запрашиваю magnet ссылку',
      torrent_remove_title: 'Удалить',
      torrent_remove_descr: 'Торрент будет удален из вашего списка',
      torrent_parser_any_one: 'Любое',
      torrent_parser_any_two: 'Любой',
      torrent_parser_no_choice: 'Не выбрано',
      torrent_parser_yes: 'Да',
      torrent_parser_no: 'Нет',
      torrent_parser_quality: 'Качество',
      torrent_parser_subs: 'Субтитры',
      torrent_parser_voice: 'Перевод',
      torrent_parser_tracker: 'Трекер',
      torrent_parser_year: 'Год',
      torrent_parser_season: 'Сезон',
      torrent_parser_sort_by_seeders: 'По раздающим',
      torrent_parser_sort_by_size: 'По размеру',
      torrent_parser_sort_by_name: 'По названию',
      torrent_parser_sort_by_tracker: 'По источнику',
      torrent_parser_sort_by_date: 'По дате',
      torrent_parser_sort_by_viewed: 'По просмотренным',
      torrent_parser_voice_dubbing: 'Дубляж',
      torrent_parser_voice_polyphonic: 'Многоголосый',
      torrent_parser_voice_two: 'Двухголосый',
      torrent_parser_voice_amateur: 'Любительский',
      torrent_parser_reset: 'Сбросить фильтр',
      torrent_parser_empty: 'Не удалось получить результатов',
      torrent_parser_no_hash: 'Не удалось получить HASH',
      torrent_parser_added_to_mytorrents: 'добавлено в «Мои торренты»',
      torrent_parser_add_to_mytorrents: 'Добавить в «Мои торренты»',
      torrent_parser_label_title: 'Пометить',
      torrent_parser_label_descr: 'Пометить раздачу с флагом (просмотрено)',
      torrent_parser_label_cancel_title: 'Снять отметку',
      torrent_parser_label_cancel_descr: 'Снять отметку с раздачи (просмотрено)',
      torrent_parser_timeout: 'Время ожидания истекло',
      torrent_parser_nofiles: 'Не удалось извлечь подходящие файлы',
      torrent_parser_set_link: 'Укажите ссылку для парсинга',
      torrent_parser_request_error: 'Ошибка в запросе',
      torrent_parser_magnet_error: 'Не удалось получить magnet ссылку',
      torrent_parser_no_responce: 'Парсер не отвечает на запрос',
      torrent_parser_torlook_fallback_search_notification: 'Парсер Jackett не доступен или настройки подключения не верны. Осуществляется поиск в Torlook...',
      about_text: 'Приложение полностью бесплатное и использует публичные ссылки для получения информации о видео, новинках, популярных фильмах и т.д. Вся доступная информация используется исключительно в познавательных целях, приложение не использует свои собственные серверы для распространения информации.',
      about_channel: 'Наш канал',
      about_group: 'Группа',
      about_version: 'Версия',
      about_donate: 'Донат',
      title_watched: 'Вы смотрели',
      title_settings: 'Настройки',
      title_collections: 'Подборки',
      title_company: 'Компания',
      title_actors: 'Актеры',
      title_actor: 'Актер',
      title_actress: 'Актриса',
      title_person: 'Персона',
      title_comments: 'Комментарии',
      title_torrents: 'Торренты',
      title_trailers: 'Трейлеры',
      title_watch: 'Смотреть',
      title_error: 'Ошибка',
      title_links: 'Ссылки',
      title_choice: 'Выбрать',
      title_main: 'Главная',
      title_book: 'Закладки',
      title_like: 'Нравится',
      title_wath: 'Позже',
      title_history: 'История просмотров',
      title_mytorrents: 'Мои торренты',
      title_last: 'Последняя',
      title_action: 'Действие',
      title_producer: 'Режиссер',
      title_collection: 'Коллекция',
      title_recomendations: 'Рекомендации',
      title_similar: 'Похожие',
      title_about: 'О приложении',
      title_timetable: 'Расписание',
      title_relises: 'Цифровые релизы',
      title_catalog: 'Каталог',
      title_category: 'Категория',
      title_parser: 'Парсер',
      title_type: 'Тип',
      title_rating: 'Рейтинг',
      title_country: 'Страна',
      title_year: 'Год',
      title_genre: 'Жанр',
      title_filter: 'Фильтр',
      title_notice: 'Уведомления',
      title_files: 'Файлы',
      title_now_watch: 'Сейчас смотрят',
      title_latest: 'Последнее добавление',
      title_continue: 'Продолжить просмотр',
      title_recomend_watch: 'Рекомендуем посмотреть',
      title_new_episodes: 'Новые серии',
      title_popular: 'Популярное',
      title_popular_movie: 'Популярные фильмы',
      title_popular_tv: 'Популярные сериалы',
      title_new_this_year: 'Новинки этого года',
      title_hight_voite: 'С высоким рейтингом',
      title_new: 'Новинки',
      title_trend_day: 'Сегодня в тренде',
      title_trend_week: 'В тренде за неделю',
      title_upcoming: 'Смотрите в кинозалах',
      title_top_movie: 'Топ фильмы',
      title_top_tv: 'Топ сериалы',
      title_tv_today: 'Сегодня в эфире',
      title_this_week: 'На этой неделе',
      title_in_top: 'В топе',
      title_out: 'Выход',
      title_out_confirm: 'Да, выйти',
      title_continue_two: 'Продолжить',
      title_choice_language: 'Выбрать язык',
      title_subscribe: 'Подписаться',
      title_subscribes: 'Подписки',
      title_unsubscribe: 'Отписаться',
      title_language: 'Язык оригинала',
      title_ongoing: 'Онгоинги',
      title_pgrating: 'Возрастное ограничение',
      title_card: 'Карточка',
      title_seasons: 'Сезоны',
      title_episodes: 'Серии',
      title_rewiews: 'Отзывы',
      title_channel: 'Канал',
      title_in_high_quality: 'В высоком качестве',
      title_author: 'Автор',
      title_buffer: 'Буфер',
      title_upcoming_episodes: 'Ближайшие выходы эпизодов',
      subscribe_success: 'Вы успешно подписались',
      subscribe_error: 'Возникла ошибка при подписке, попробуйте позже',
      subscribe_noinfo: 'Не удалось получить информацию, попробуйте позже',
      company_headquarters: 'Штаб',
      company_homepage: 'Сайт',
      company_country: 'Страна',
      country_ad: 'Андорра',
      country_ae: 'ОАЭ',
      country_af: 'Афганистан',
      country_al: 'Албания',
      country_am: 'Армения',
      country_ao: 'Ангола',
      country_ar: 'Аргентина',
      country_at: 'Австрия',
      country_au: 'Австралия',
      country_aw: 'Аруба',
      country_az: 'Азербайджан',
      country_bа: 'Босния и Герцеговина',
      country_bd: 'Бангладеш',
      country_be: 'Бельгия',
      country_bg: 'Болгария',
      country_bh: 'Бахрейн',
      country_bi: 'Бурунди',
      country_bj: 'Бенин',
      country_bo: 'Боливия',
      country_br: 'Бразилия',
      country_bs: 'Багамские о-ва',
      country_bt: 'Бутан',
      country_bw: 'Ботсвана',
      country_by: 'Беларусь',
      country_ca: 'Канада',
      country_ch: 'Швейцария',
      country_cl: 'Чили',
      country_cm: 'Камерун',
      country_cn: 'Китай',
      country_co: 'Колумбия',
      country_cr: 'Коста-Рика',
      country_cu: 'Куба',
      country_cv: 'Кабо-Верде',
      country_cy: 'Кипр',
      country_cz: 'Чехия',
      country_de: 'Германия',
      country_dj: 'Джибути',
      country_dk: 'Дания',
      country_do: 'Доминикана',
      country_dz: 'Алжир',
      country_ec: 'Эквадор',
      country_ee: 'Эстония',
      country_eg: 'Египет',
      country_es: 'Испания',
      country_et: 'Эфиопия',
      country_fi: 'Финляндия',
      country_fo: 'Фарерские о-ва',
      country_fr: 'Франция',
      country_ga: 'Габон',
      country_gb: 'Великобритания',
      country_ge: 'Грузия',
      country_gh: 'Гана',
      country_gl: 'Гренландия',
      country_gp: 'Гваделупа',
      country_gr: 'Греция',
      country_gt: 'Гватемала',
      country_hk: 'Гонконг',
      country_hr: 'Хорватия',
      country_ht: 'Гаити',
      country_hu: 'Венгрия',
      country_id: 'Индонезия',
      country_ie: 'Ирландия',
      country_il: 'Израиль',
      country_in: 'Индия',
      country_iq: 'Ирак',
      country_ir: 'Иран',
      country_is: 'Исландия',
      country_it: 'Италия',
      country_jm: 'Ямайка',
      country_jo: 'Иордания',
      country_jp: 'Япония',
      country_ke: 'Кения',
      country_kg: 'Киргизия',
      country_kh: 'Камбоджа',
      country_kp: 'Северная Корея',
      country_kr: 'Южная Корея',
      country_kz: 'Казахстан',
      country_kw: 'Кувейт',
      country_la: 'Лаос',
      country_lb: 'Ливан',
      country_li: 'Лихтенштейн',
      country_lk: 'Шри-Ланка',
      country_lr: 'Либерия',
      country_lt: 'Литва',
      country_lu: 'Люксембург',
      country_lv: 'Латвия',
      country_ly: 'Ливия',
      country_ma: 'Марокко',
      country_mc: 'Монако',
      country_md: 'Молдова',
      country_me: 'Черногория',
      country_mk: 'Македония',
      country_mm: 'Мьянма',
      country_mn: 'Монголия',
      country_mo: 'Макао',
      country_mt: 'Мальта',
      country_mu: 'Маврикий',
      country_mv: 'Мальдивы',
      country_mw: 'Малави',
      country_mx: 'Мексика',
      country_my: 'Малайзия',
      country_mz: 'Мозамбик',
      country_na: 'Намибия',
      country_ne: 'Нигер',
      country_ng: 'Нигерия',
      country_ni: 'Никарагуа',
      country_nl: 'Нидерланды',
      country_no: 'Норвегия',
      country_np: 'Непал',
      country_nz: 'Новая Зеландия',
      country_om: 'Оман',
      country_pa: 'Панама',
      country_pe: 'Перу',
      country_pg: 'Папуа - Новая Гвинея',
      country_ph: 'Филиппины',
      country_pk: 'Пакистан',
      country_pl: 'Польша',
      country_pr: 'Пуэрто-Рико',
      country_ps: 'Палестина',
      country_pt: 'Португалия',
      country_py: 'Парагвай',
      country_qa: 'Катар',
      country_ro: 'Румыния',
      country_rs: 'Сербия',
      country_ru: 'Россия',
      country_rw: 'Руанда',
      country_sa: 'Саудовская Аравия',
      country_sd: 'Судан',
      country_se: 'Швеция',
      country_sg: 'Сингапур',
      country_si: 'Словения',
      country_sk: 'Словакия',
      country_sn: 'Сенегал',
      country_su: 'СССР',
      country_sv: 'Сальвадор',
      country_sy: 'Сирия',
      country_th: 'Таиланд',
      country_tj: 'Таджикистан',
      country_tm: 'Туркменистан',
      country_tn: 'Тунис',
      country_tr: 'Турция',
      country_tw: 'Тайвань',
      country_tz: 'Танзания',
      country_ua: 'Украина',
      country_ug: 'Уганда',
      country_us: 'США',
      country_uy: 'Уругвай',
      country_uz: 'Узбекистан',
      country_ve: 'Венесуэла',
      country_vn: 'Вьетнам',
      country_ws: 'Самоа',
      country_xk: 'Косово',
      country_ye: 'Йемен',
      country_yu: 'Югославия',
      country_za: 'ЮАР',
      country_zm: 'Замбия',
      country_zw: 'Зимбабве',
      filter_clarify: 'Уточнить',
      filter_clarify_two: 'Уточнить поиск',
      filter_set_name: 'Указать название',
      filter_sorted: 'Сортировать',
      filter_filtred: 'Фильтр',
      filter_any: 'Любой',
      filter_combinations: 'Комбинации',
      filter_alt_names: 'Другие названия',
      filter_rating_from: 'от',
      filter_rating_to: 'до',
      filter_lang_af: 'Африкаанс',
      filter_lang_ar: 'Арабский',
      filter_lang_az: 'Азербайджанский',
      filter_lang_ba: 'Башкирский',
      filter_lang_be: 'Белорусский',
      filter_lang_bg: 'Болгарский',
      filter_lang_bn: 'Бенгальский',
      filter_lang_bs: 'Боснийский',
      filter_lang_ca: 'Каталанский',
      filter_lang_ce: 'Чеченский',
      filter_lang_cs: 'Чешский',
      filter_lang_da: 'Датский',
      filter_lang_de: 'Немецкий',
      filter_lang_el: 'Греческий',
      filter_lang_en: 'Английский',
      filter_lang_es: 'Испанский',
      filter_lang_et: 'Эстонский',
      filter_lang_fa: 'Персидский',
      filter_lang_fi: 'Финский',
      filter_lang_fr: 'Французский',
      filter_lang_ga: 'Ирландский',
      filter_lang_gl: 'Галисийский',
      filter_lang_gn: 'Гуарани',
      filter_lang_he: 'Иврит',
      filter_lang_hi: 'Хинди',
      filter_lang_hr: 'Хорватский',
      filter_lang_hu: 'Венгерский',
      filter_lang_hy: 'Армянский',
      filter_lang_id: 'Индонезийский',
      filter_lang_is: 'Исландский',
      filter_lang_it: 'Итальянский',
      filter_lang_ja: 'Японский',
      filter_lang_ka: 'Грузинский',
      filter_lang_kk: 'Казахский',
      filter_lang_ko: 'Корейский',
      filter_lang_ks: 'Кашмири',
      filter_lang_ku: 'Курдский',
      filter_lang_ky: 'Киргизский',
      filter_lang_lt: 'Литовский',
      filter_lang_lv: 'Латышский',
      filter_lang_mi: 'Маори',
      filter_lang_mk: 'Македонский',
      filter_lang_mn: 'Монгольский',
      filter_lang_mo: 'Молдавский',
      filter_lang_mt: 'Мальтийский',
      filter_lang_ne: 'Непальский',
      filter_lang_nl: 'Нидерландский',
      filter_lang_no: 'Норвежский',
      filter_lang_pa: 'Панджаби',
      filter_lang_pl: 'Польский',
      filter_lang_ps: 'Пушту',
      filter_lang_pt: 'Португальский',
      filter_lang_ro: 'Румынский',
      filter_lang_ru: 'Русский',
      filter_lang_si: 'Сингальский',
      filter_lang_sk: 'Словацкий',
      filter_lang_sl: 'Словенский',
      filter_lang_sm: 'Самоанский',
      filter_lang_so: 'Сомалийский',
      filter_lang_sq: 'Албанский',
      filter_lang_sr: 'Сербский',
      filter_lang_sv: 'Шведский',
      filter_lang_sw: 'Суахили',
      filter_lang_ta: 'Тамильский',
      filter_lang_tg: 'Таджикский',
      filter_lang_th: 'Тайский',
      filter_lang_tk: 'Туркменский',
      filter_lang_tr: 'Турецкий',
      filter_lang_tt: 'Татарский',
      filter_lang_ur: 'Урду',
      filter_lang_uk: 'Украинский',
      filter_lang_uz: 'Узбекский',
      filter_lang_vi: 'Вьетнамский',
      filter_lang_yi: 'Идиш',
      filter_lang_zh: 'Китайский',
      filter_genre_ac: 'Боевик',
      filter_genre_ad: 'Приключения',
      filter_genre_mv: 'Мультфильм',
      filter_genre_cm: 'Комедия',
      filter_genre_cr: 'Криминал',
      filter_genre_dc: 'Документальный',
      filter_genre_dr: 'Драма',
      filter_genre_fm: 'Семейный',
      filter_genre_fe: 'Фэнтези',
      filter_genre_hi: 'История',
      filter_genre_ho: 'Ужасы',
      filter_genre_mu: 'Музыка',
      filter_genre_de: 'Детектив',
      filter_genre_md: 'Мелодрама',
      filter_genre_fa: 'Фантастика',
      filter_genre_tv: 'Телевизионный фильм',
      filter_genre_tr: 'Триллер',
      filter_genre_mi: 'Военный',
      filter_genre_ve: 'Вестерн',
      filter_genre_aa: 'Боевик и Приключения',
      filter_genre_ch: 'Детский',
      filter_genre_nw: 'Новости',
      filter_genre_rs: 'Реалити-шоу',
      filter_genre_hf: 'НФ и Фэнтези',
      filter_genre_op: 'Мыльная опера',
      filter_genre_tc: 'Ток-шоу',
      filter_genre_mp: 'Война и Политика',
      empty_title: 'Пусто',
      empty_text: 'По вашему фильтру ничего не нашлось, уточните фильтр.',
      empty_title_two: 'Здесь пусто',
      empty_text_two: 'На данный момент список пустой',
      menu_main: 'Главная',
      menu_movies: 'Фильмы',
      menu_tv: 'Сериалы',
      menu_catalog: 'Каталог',
      menu_filter: 'Фильтр',
      menu_collections: 'Подборки',
      menu_relises: 'Релизы',
      menu_anime: 'Аниме',
      menu_bookmark: 'Закладки',
      menu_like: 'Нравится',
      menu_time: 'Позже',
      menu_history: 'История',
      menu_timeline: 'Расписание',
      menu_torrents: 'Торренты',
      menu_settings: 'Настройки',
      menu_about: 'Информация',
      menu_console: 'Консоль',
      menu_multmovie: 'Мультфильмы',
      menu_multtv: 'Мультсериалы',
      plugins_catalog_work: 'Рабочие плагины',
      plugins_catalog_work_descr: 'Плагины, которые точно работают в лампе.',
      plugins_catalog_popular: 'Популярные плагины среди пользователей',
      plugins_catalog_popular_descr: 'Установка из неизвестных источников может привести к некорректной работе приложения.',
      plugins_online: 'Просмотр онлайн',
      plugins_check_fail: 'Не удалось проверить работоспособность плагина. Однако это не означает, что плагин не работает. Перезагрузите приложение для выяснения, загружается ли плагин.',
      plugins_need_reload: 'Для применения плагина необходимо перезагрузить приложение',
      plugins_install: 'Установить',
      plugins_install_ready: 'Этот плагин уже установлен.',
      plugins_installed: 'Установок',
      plugins_load_from: 'Загружено из CUB',
      plugins_ok_for_check: 'Нажмите (OK) для проверки плагина',
      plugins_no_loaded: 'При загрузке приложения, часть плагинов не удалось загрузить',
      plugins_remove: 'Удалить плагины',
      time_viewed: 'Просмотрено',
      time_from: 'из',
      time_reset: 'Сбросить тайм-код',
      settings_clear_cache: 'Кеш и данные очищены',
      settings_user_links: 'Пользовательская ссылка',
      settings_for_local: 'Для локального TorrServer',
      settings_add: 'Добавить',
      settings_remove: 'Удалить',
      settings_this_value: 'текущее значение',
      settings_added: 'Добавлено',
      settings_removed: 'Удалено',
      settings_reset: 'Сброс настроек',
      settings_param_player_inner: 'Встроенный',
      settings_param_player_outside: 'Внешний',
      settings_param_yes: 'Да',
      settings_param_no: 'Нет',
      settings_param_interface_size_small: 'Меньше',
      settings_param_interface_size_normal: 'Нормальный',
      settings_param_interface_size_bigger: 'Больше',
      settings_param_poster_quality_low: 'Низкое',
      settings_param_poster_quality_average: 'Среднее',
      settings_param_poster_quality_high: 'Высокое',
      settings_param_parse_directly: 'Напрямую',
      settings_param_parse_api: 'Через API сайта',
      settings_param_background_complex: 'Сложный',
      settings_param_background_simple: 'Простой',
      settings_param_background_image: 'Картинка',
      settings_param_link_use_one: 'Основную',
      settings_param_link_use_two: 'Дополнительную',
      settings_param_subtitles_size_small: 'Маленькие',
      settings_param_subtitles_size_normal: 'Обычные',
      settings_param_subtitles_size_bigger: 'Большие',
      settings_param_screensaver_nature: 'Природа',
      settings_param_torrent_lang_orig: 'Оригинал',
      settings_param_player_timecode_again: 'Начать с начала',
      settings_param_player_timecode_continue: 'Продолжить',
      settings_param_player_timecode_ask: 'Спрашивать',
      settings_param_player_scale_method: 'Рассчитать',
      settings_param_player_hls_app: 'Системный',
      settings_param_player_hls_js: 'Программный',
      settings_param_card_view_load: 'Подгружать',
      settings_param_card_view_all: 'Показать все',
      settings_param_navigation_remote: 'Пульт',
      settings_param_navigation_mouse: 'Пульт с мышкой',
      settings_param_keyboard_lampa: 'Встроенная',
      settings_param_keyboard_system: 'Системная',
      settings_param_card_interface_old: 'Старый',
      settings_param_card_interface_new: 'Новый',
      settings_param_glass_easy: 'Прозрачная',
      settings_param_glass_medium: 'Полупрозрачная',
      settings_param_glass_blacked: 'Затемнённая',
      settings_param_jackett_interview_all: 'Все',
      settings_param_jackett_interview_healthy: 'Только доступные',
      settings_parser_jackett_interview: 'Опрашивать трекеры',
      helper_keyboard: 'После ввода значения нажмите кнопку «Назад» для сохранения',
      helper_torrents: 'Удерживайте клавишу (ОК) для вызова контекстного меню',
      helper_cleared: 'Успешно, подсказки будут показаны заново.',
      helper_torrents_view: 'Для сброса тайм-кода и вызова меню удерживайте клавишу (ОК)',
      fav_sync_title: 'Синхронизация закладок',
      fav_sync_text: 'Ваши любимые закладки вместе с Вами. Подключите синхронизацию и просматривайте на любом устройстве. <br><br>Для этого зарегистрируйтесь на сайте www.cub.watch, создайте профиль и авторизуйтесь в приложение.',
      fav_sync_site: 'Сайт',
      fav_remove_title: 'Удалить из истории',
      fav_remove_descr: 'Удалить выделенную карточку',
      fav_clear_title: 'Очистить историю',
      fav_clear_descr: 'Удалить все карточки из истории',
      fav_clear_label_title: 'Очистить метки',
      fav_clear_label_descr: 'Очистить метки о просмотрах',
      fav_clear_time_title: 'Очистить тайм-коды',
      fav_clear_time_descr: 'Очистить все тайм-коды',
      fav_label_cleared: 'Отметки очищены',
      fav_time_cleared: 'Тайм-коды очищены',
      timetable_empty: 'В этом разделе будут отображаться даты выхода новых серий',
      player_quality: 'Качество',
      player_tracks: 'Аудиодорожки',
      player_disabled: 'Отключено',
      player_unknown: 'Неизвестно',
      player_subs: 'Субтитры',
      player_size_default_title: 'По умолчанию',
      player_size_default_descr: 'Размер видео по умолчанию',
      player_size_cover_title: 'Расширить',
      player_size_cover_descr: 'Расширяет видео на весь экран',
      player_size_fill_title: 'Заполнить',
      player_size_fill_descr: 'Вместить видео на весь экран',
      player_size_s115_title: 'Увеличить 115%',
      player_size_s115_descr: 'Увеличить видео на 115%',
      player_size_s130_title: 'Увеличить 130%',
      player_size_s130_descr: 'Увеличить видео на 130%',
      player_size_v115_title: 'По вертикали 115%',
      player_size_v115_descr: 'Увеличить видео на 115%',
      player_size_v130_title: 'По вертикали 130%',
      player_size_v130_descr: 'Увеличить видео на 130%',
      player_video_size: 'Размер видео',
      player_playlist: 'Плейлист',
      player_error_one: 'Не удалось декодировать видео',
      player_error_two: 'Видео не найдено или повреждено',
      player_start_from: 'Продолжить просмотр с',
      player_not_found: 'Плеер не найден',
      player_lauch: 'Запустить плеер',
      player_speed_default_title: 'Обычная',
      player_speed_two_descr: 'Воспроизводиться без звука',
      player_video_speed: 'Скорость воспроизведения',
      player_share_title: 'Поделиться',
      player_share_descr: 'Запустить это видео на другом устройстве',
      player_normalization_power_title: 'Сила нормализации',
      player_normalization_smooth_title: 'Скорость нормализации',
      player_normalization_step_low: 'Низкое',
      player_normalization_step_medium: 'Среднее',
      player_normalization_step_hight: 'Высокое',
      player_normalization: 'Нормализация',
      player_youtube_no_played: 'К сожалению, это видео не доступно в вашем регионе, возможно, оно было заблокировано или удалено.',
      player_youtube_start_play: 'Для начала проигрывания видео, нажмите кнопку "Плей"',
      broadcast_open: 'Открыть карточку на другом устройстве',
      broadcast_play: 'Выберите устройство для просмотра',
      card_new_episode: 'Новая серия',
      card_book_remove: 'Убрать из закладок',
      card_book_add: 'В закладки',
      card_book_descr: 'Смотрите в меню (Закладки)',
      card_like_remove: 'Убрать из понравившихся',
      card_like_add: 'Нравится',
      card_like_descr: 'Смотрите в меню (Нравится)',
      card_wath_remove: 'Убрать из ожидаемых',
      card_wath_add: 'Смотреть позже',
      card_wath_descr: 'Смотрите в меню (Позже)',
      card_history_remove: 'Убрать из истории',
      card_history_add: 'Добавить в историю',
      card_history_descr: 'Смотрите в меню (История)',
      keyboard_listen: 'Говорите, я слушаю...',
      keyboard_nomic: 'Нет доступа к микрофону',
      notice_new_quality: 'Доступно новое качество',
      notice_quality: 'Качество',
      notice_new_episode: 'Новая серия',
      notice_none: 'У вас еще нет никаких уведомлений, зарегистрируйтесь на сайте <b>www.cub.watch</b>, чтобы следить за новыми сериями и релизами.',
      notice_in_quality: 'В качестве',
      notice_none_account: 'У вас еще нет никаких уведомлений, добавьте сериалы в закладки и ожидайте уведомления о новых сериях.',
      notice_none_system: 'На данный момент у вас отсутствуют уведомления. Мы обязательно оповестим вас, когда появятся новые уведомления.',
      copy_link: 'Копировать ссылку на видео',
      copy_secuses: 'Ссылка скопирована в буфер обмена',
      copy_error: 'Ошибка при копирование ссылки',
      account_sync_to_profile: 'Все закладки будут перенесены в профиль',
      account_sync_secuses: 'Все закладки успешно перенесены',
      account_profiles: 'Профили',
      account_profiles_empty: 'Не удалось получить список профилей',
      account_authorized: 'Авторизованы',
      account_logged_in: 'Вы вошли под аккаунтом',
      account_login_failed: 'Вход не выполнен',
      account_login_wait: 'Ожидаем входа в аккаунт',
      account_profile_main: 'Общий',
      account_export_secuses: 'Экспорт успешно завершён',
      account_export_fail: 'Ошибка при экспорте',
      account_import_secuses: 'Импорт успешно завершён',
      account_import_fail: 'Ошибка при импорте',
      account_imported: 'импортировано',
      account_reload_after: 'перезагрузка через 5 сек.',
      account_create: 'Откройте больше возможностей с аккаунтом CUB. Зарегистрируйтесь на сайте <span class="account-modal__site">www.cub.watch</span> и получите доступ к синхронизации ваших закладок, тайм-кодов и других возможностей аккаунта CUB.',
      account_premium: 'Раскройте новые горизонты с аккаунтом CUB Premium! Наслаждайтесь увеличенными лимитами и обогащенным функционалом сервиса. Дополнительные возможности ждут вас уже сегодня!',
      account_premium_more: 'Подробнее о CUB Premium',
      account_limited: 'Вы достигли максимального лимита. Увеличьте лимит с аккаунтом CUB Premium. Подробнее на сайте <span class="account-modal__site">www.cub.watch/premium</span>',
      account_premium_include_1: 'Увеличение количество закладок',
      account_premium_include_2: 'Увеличение истории просмотров',
      account_premium_include_3: 'Увеличение количество тайм-кодов',
      account_premium_include_4: 'Количество профилей на аккаунт',
      account_premium_include_5: 'Уведомления',
      account_premium_include_6: 'Синхронизация данных',
      account_premium_include_text_1: 'Больше закладок - больше возможностей! Сохраняйте свои любимые фильмы и сериалы, создавайте списки просмотра и наслаждайтесь просмотром в любое удобное время.',
      account_premium_include_text_2: 'Увеличьте историю просмотров в приложении и следите за тем, что уже посмотрели. Легко находите и пересматривайте свои любимые фильмы и сериалы.',
      account_premium_include_text_3: 'Не бойтесь пропустить ни одной важной сцены! Увеличьте количество тайм-кодов в приложении и легко отслеживайте, где остановились в просмотре любимых фильмов и сериалов.',
      account_premium_include_text_4: 'Получите больше свободы с нашим премиум доступом! Увеличьте количество профилей на аккаунте и позвольте своим друзьям и близким наслаждаться фильмами и сериалами вместе с вами. Никаких ограничений - наслаждайтесь просмотром с любимыми людьми.',
      account_premium_include_text_5: 'Не пропустите ни одной новой серии или перевода! Получайте уведомления вовремя и будьте в курсе всех обновлений. Увеличьте свой кинопоток вместе с нами и получайте уведомления о выходе новых серий и переводов прямо на свой смартфон.',
      account_premium_include_text_6: 'Синхронизуйте свои данные между устройствами с премиум доступом! Больше не нужно тратить время на поиск последнего эпизода, на котором вы остановились. С нашим премиум доступом вы можете синхронизировать свои данные между устройствами, чтобы продолжать просмотр с места, где вы остановились, на любом устройстве, где установлено приложение.',
      account_code_enter: 'Введите шестизначный код',
      account_code_error: 'Возможно, вы ввели неверный или устаревший код',
      account_code_wrong: 'Возможно, вы указали неверный формат',
      account_code_where: 'Перейдите на сайт <span class="account-add-device__site">cub.watch/add</span> и введите указанный там код.',
      account_code_input: 'Ввести код',
      network_noconnect: 'Нет подключения к сети',
      network_404: 'Запрошенная страница не найдена. [404]',
      network_401: 'Авторизация не удалась',
      network_500: 'Внутренняя ошибка сервера. [500]',
      network_parsererror: 'Запрошенный синтаксический анализ JSON завершился неудачно.',
      network_timeout: 'Время запроса истекло.',
      network_abort: 'Запрос был прерван.',
      network_error: 'Неизвестная ошибка',
      size_zero: '0 Байт',
      size_byte: 'Байт',
      size_kb: 'КБ',
      size_mb: 'МБ',
      size_gb: 'ГБ',
      size_tb: 'ТБ',
      size_pp: 'ПБ',
      speed_bit: 'бит',
      speed_kb: 'Кбит',
      speed_mb: 'Мбит',
      speed_gb: 'Гбит',
      speed_tb: 'Тбит',
      speed_pp: 'Пбит',
      month_1: 'Январь',
      month_2: 'Февраль',
      month_3: 'Март',
      month_4: 'Апрель',
      month_5: 'Ма',
      month_6: 'Июнь',
      month_7: 'Июль',
      month_8: 'Август',
      month_9: 'Сентябрь',
      month_10: 'Октябрь',
      month_11: 'Ноябрь',
      month_12: 'Декабрь',
      day_1: 'Понедельник',
      day_2: 'Вторник',
      day_3: 'Среда',
      day_4: 'Четверг',
      day_5: 'Пятница',
      day_6: 'Суббота',
      day_7: 'Воскресенье',
      month_1_e: 'Января',
      month_2_e: 'Февраля',
      month_3_e: 'Марта',
      month_4_e: 'Апреля',
      month_5_e: 'Мая',
      month_6_e: 'Июня',
      month_7_e: 'Июля',
      month_8_e: 'Августа',
      month_9_e: 'Сентября',
      month_10_e: 'Октября',
      month_11_e: 'Ноября',
      month_12_e: 'Декабря',
      week_1: 'Пн',
      week_2: 'Вт',
      week_3: 'Ср',
      week_4: 'Чт',
      week_5: 'Пт',
      week_6: 'Сб',
      week_7: 'Вс',
      time_h: 'ч.',
      time_m: 'м.',
      time_s: 'с.',
      extensions_enable: 'Включить',
      extensions_disable: 'Отключить',
      extensions_check: 'Проверить статус',
      extensions_install: 'Установить',
      extensions_info: 'Информация',
      extensions_edit: 'Редактировать',
      extensions_change_name: 'Изменить название',
      extensions_change_link: 'Изменить ссылку',
      extensions_remove: 'Удалить',
      extensions_set_name: 'Введите название плагина',
      extensions_set_url: 'Введите адрес плагина',
      extensions_ready: 'Этот плагин уже установлен',
      extensions_no_info: 'Без информации',
      extensions_no_name: 'Без названия',
      extensions_worked: 'Рабочий',
      extensions_no_plugin: 'Плагин не подтверждён ',
      extensions_add: 'Добавить плагин',
      extensions_from_memory: 'Установленные в память ',
      extensions_from_cub: 'Установленные из CUB',
      extensions_from_popular: 'Популярные плагины',
      extensions_from_lib: 'Библиотека плагинов',
      extensions_from_connected: 'Подключенные плагины',
      extensions_hpu_best: 'Популярные',
      extensions_hpu_recomend: 'Рекомендуем',
      extensions_hpu_theme: 'Темы',
      extensions_hpu_screensaver: 'Скринсейвер',
      extensions_hpu_video: 'Видео',
      extensions_hpu_control: 'Управление',
      extensions_hpu_other: 'Разное',
      extensions_hpu_: 'Остальное',
      speedtest_connect: 'подключение',
      speedtest_test: 'тестирование',
      speedtest_ready: 'готово',
      speedtest_button: 'Тестировать скорость',
      change_source_on_cub: 'Сменить источник на CUB',
      input_detection_touch: 'Хотите переключить на сенсорное управление?',
      input_detection_mouse: 'Хотите переключить на управление мышью?',
      input_detection_remote: 'Хотите переключить на управление пультом?',
      https_text: 'Вы используйте HTTPS протокол, в этом протоколе лампа работает некорректно. Для корректной работы лампы, используйте адрес с протоколом HTTP'
    };

    var en = {
      lang_choice_title: 'Welcome',
      lang_choice_subtitle: 'Choose your language',
      more: 'More',
      show_more: 'Show more',
      more_results: 'Show more results',
      loading: 'Loading',
      nofind_movie: 'The movie could not be found.',
      noname: 'Untitled',
      nochoice: 'Not chosen',
      cancel: 'Cancel',
      confirm: 'I confirm',
      sure: 'Are you sure?',
      nodata: 'No data',
      back: 'Back',
      ready: 'Ready',
      search: 'Search',
      search_input: 'Enter text',
      search_empty: 'Search history is empty.',
      search_delete: 'Left - delete',
      search_start_typing: 'Start typing search text.',
      search_searching: 'Search in progress...',
      search_start: 'To start searching',
      search_nofound: 'Nothing was found according to your request.',
      full_genre: 'Genre',
      full_production: 'Production',
      full_date_of_release: 'date of release',
      full_budget: 'Budget',
      full_countries: 'Countries',
      full_like: 'Like',
      full_torrents: 'Torrents',
      full_trailers: 'Trailers',
      full_detail: 'In detail',
      full_notext: 'No description.',
      full_series_release: 'Series release',
      full_next_episode: 'Next',
      full_episode_days_left: 'Days left',
      full_trailer_official: 'Official',
      full_trailer_no_official: 'Informal',
      full_season: 'Season',
      full_episode: 'Episode',
      full_directing: 'Directing',
      full_writing: 'Writing',
      settings_cub_sync: 'Synchronization',
      settings_cub_sync_descr: 'Synchronization with the CUB service: Synchronization of your bookmarks, browsing history, tags and timecodes. Website: www.cub.watch',
      settings_cub_account: 'Account',
      settings_cub_logged_in_as: 'Logged in as',
      settings_cub_profile: 'Profile',
      settings_cub_sync_btn: 'Synchronize',
      settings_cub_sync_btn_descr: 'Save local bookmarks to CUB account',
      settings_cub_backup: 'Backup',
      settings_cub_backup_descr: 'Save or load backup data',
      settings_cub_logout: 'Sign out',
      settings_cub_signin: 'Authorization',
      settings_cub_not_specified: 'Not specified',
      settings_cub_password: 'Password',
      settings_cub_status: 'Status',
      settings_cub_backup_import: 'Import',
      settings_cub_backup_export: 'Export',
      settings_cub_sync_filters: 'Filters sync',
      settings_cub_sync_calendar: 'Calendar sync',
      settings_cub_sync_quality: 'Quality sync',
      settings_cub_sync_search: 'Search history sync',
      settings_cub_sync_recomends: 'Recommendations sync',
      settings_cub_sync_timecodes: 'Timecode Synchronization',
      settings_input_links: 'Favorites',
      settings_interface_type: 'Lite version',
      settings_interface_size: 'Interface size',
      settings_interface_background: 'Background',
      settings_interface_background_use: 'Show background',
      settings_interface_background_type: 'Background type',
      settings_interface_performance: 'Performance',
      settings_interface_animation: 'Animation',
      settings_interface_animation_descr: 'Animation of cards and content',
      settings_interface_attenuation: 'Attenuation',
      settings_interface_attenuation_descr: 'Smooth fading of cards from below and from above',
      settings_interface_scroll: 'Scroll Type',
      settings_interface_view_card: 'Card view type',
      settings_interface_view_card_descr: 'As you scroll the feed, the cards will load gradually or load all',
      settings_interface_lang: 'Interface language',
      settings_interface_lang_reload: 'You need to restart the application, click "OK" to restart.',
      settings_main_account: 'Account',
      settings_main_interface: 'Interface',
      settings_main_player: 'Player',
      settings_main_parser: 'Parser',
      settings_main_torrserver: 'TorrServer',
      settings_main_plugins: 'Extensions',
      settings_main_rest: 'Other',
      settings_rest_start: 'Start page',
      settings_rest_start_descr: 'Which page to start at startup',
      settings_rest_source: 'Source',
      settings_rest_source_use: 'Main source',
      settings_rest_source_descr: 'Where to get information about films',
      settings_rest_tmdb_lang: 'What language to display data from TMDB',
      settings_rest_tmdb_prox: 'Proxy TMDB',
      settings_rest_tmdb_prox_auto: 'Enable proxy automatically',
      settings_rest_tmdb_posters: 'Resolution of TMDB posters',
      settings_rest_screensaver: 'Screensaver',
      settings_rest_screensaver_use: 'Show splash screen when idle',
      settings_rest_screensaver_type: 'Screen saver type',
      settings_rest_helper: 'Hints',
      settings_rest_helper_use: 'Show hints',
      settings_rest_helper_reset: 'Show hints again',
      settings_rest_pages: 'How many pages to keep in memory',
      settings_rest_pages_descr: 'Keeps pages in the state you left them in',
      settings_rest_time: 'Shift time',
      settings_rest_navigation: 'Navigation type',
      settings_rest_keyboard: 'Keyboard type',
      settings_rest_device: 'Device name',
      settings_rest_device_placeholder: 'For example: My Lamp',
      settings_rest_cache: 'Clear cache',
      settings_rest_cache_descr: 'All settings and data will be cleared',
      settings_rest_tmdb_example: 'For example:',
      settings_rest_tmdb_api_descr: 'To get data',
      settings_rest_tmdb_image_descr: 'To get images',
      settings_rest_card_quality: 'Quality marks',
      settings_rest_card_quality_descr: 'Display quality marks on cards',
      settings_rest_card_episodes: 'Episode marks',
      settings_rest_card_episodes_descr: 'Display episode markers on cards',
      settings_parser_use: 'Use parser',
      settings_parser_use_descr: 'Hereby, you agree to accept all responsibility for the use of public links to view torrent and online content.',
      settings_parser_type: 'Parser type for torrents',
      settings_parser_jackett_placeholder: 'For example: 192.168.x',
      settings_parser_jackett_link: 'Link',
      settings_parser_jackett_link_descr: 'Provide a link to the Jackett script',
      settings_parser_jackett_key_placeholder: 'For example: sa0sk83d..',
      settings_parser_jackett_key: 'Api key',
      settings_parser_jackett_key_descr: 'Located in Jackett',
      settings_parser_torlook_type: 'TorLook site parsing method',
      settings_parser_scraperapi_placeholder: 'For example: scraperapi.com',
      settings_parser_scraperapi_link: 'Link to site parser',
      settings_parser_scraperapi_descr: 'Register on the site scraperapi.com, enter the link api.scraperapi.com?api_key=...&url={q}<br>W41.torlook.info will be delivered to {q}',
      settings_parser_search: 'Search',
      settings_parser_search_descr: 'What language to search in?',
      settings_parser_in_search: 'Parser in search',
      settings_parser_in_search_descr: 'Show search results?',
      settings_parser_timeout_title: 'Parser timeout',
      settings_parser_timeout_descr: 'Time in seconds to wait for a response from the server',
      settings_player_type: 'Player type',
      settings_player_type_descr: 'Which player to play',
      settings_player_iptv_type: 'Player type for IPTV',
      settings_player_iptv_type_descr: 'Which player to play IPTV channels',
      settings_player_reset: 'Reset default player',
      settings_player_reset_descr: 'Resets the selected Android player in the application',
      settings_player_path: 'Path to the player',
      settings_player_path_descr: 'Specify the path to the player .exe',
      settings_player_normalization: 'Sound normalization',
      settings_player_normalization_descr: 'Normalizes sound to one level, lowers loud sounds and boosts quiet ones.',
      settings_player_next_episode: 'Next episode',
      settings_player_next_episode_descr: 'Automatically switch to the next series after the end of the current one',
      settings_player_timecode: 'Timecode',
      settings_player_timecode_descr: 'Continue from last viewed location',
      settings_player_scale: 'Scaling Method',
      settings_player_scale_descr: 'How to calculate video scaling',
      settings_player_subs: 'Subtitles',
      settings_player_subs_use: 'Turn on',
      settings_player_subs_use_descr: 'Always turn on subtitles after starting a video',
      settings_player_subs_size: 'The size',
      settings_player_subs_size_descr: 'Screen size of subtitles',
      settings_player_subs_stroke_use: 'Use edging',
      settings_player_subs_stroke_use_descr: 'Subtitles will be outlined in black for better readability',
      settings_player_subs_backdrop_use: 'Use an underlay',
      settings_player_subs_backdrop_use_descr: 'Subtitles will be displayed on a translucent backing to improve readability',
      settings_player_quality: 'Default video quality',
      settings_player_quality_descr: 'Preferred video quality for viewing',
      settings_player_hls_title: 'Processing the .m3u8 stream',
      settings_player_hls_descr: 'Do not touch this parameter if you do not know why it is.',
      settings_plugins_notice: 'To apply the plugin, you need to restart the application',
      settings_plugins_add: 'Add Plugin',
      settings_plugins_add_descr: 'To delete an added plugin, hold or double-click the (OK) key on it',
      settings_plugins_install: 'Install Plugin',
      settings_plugins_install_descr: 'Install a plugin from the list of available',
      settings_server_link: 'Use link',
      settings_server_links: 'Links',
      settings_server_placeholder: 'For example: 192.168.X',
      settings_server_link_one: 'Main Link',
      settings_server_link_one_descr: 'Specify the main link to the TorrServer script',
      settings_server_link_two: 'Additional link',
      settings_server_link_two_descr: 'Provide an additional link to the TorrServer script',
      settings_server_additionally: 'Additionally',
      settings_server_client: 'Embedded client',
      settings_server_client_descr: 'Use the built-in TorrServe JS client, otherwise the system one starts.',
      settings_server_base: 'Save to database',
      settings_server_base_descr: 'The torrent will be added to the TorrServer database',
      settings_server_preload: 'Use prefetch buffer',
      settings_server_preload_descr: 'Wait for TorrServer\'s preload buffer to fill before playing',
      settings_server_auth: 'Authorization',
      settings_server_password_use: 'Password login',
      settings_server_login: 'Login',
      settings_server_password: 'Password',
      settings_server_not_specified: 'Not specified',
      torent_nohash_reasons: 'The reasons',
      torent_nohash_reason_one: 'TorServer was unable to download the torrent file',
      torent_nohash_reason_two: 'Reply from TorServer',
      torent_nohash_reason_three: 'Link',
      torent_nohash_do: 'What to do?',
      torent_nohash_do_one: 'Check if you configured Jackett correctly',
      torent_nohash_do_two: 'Private sources may not provide a link to the file',
      torent_nohash_do_three: 'Make sure Jackett can download the file too',
      torent_nohash_do_four: 'Write to our telegram group: @lampa_group',
      torent_nohash_do_five: 'Specify which movie, which distribution and, if possible, a photo of this distribution',
      torrent_error_text: 'Failed to connect to TorrServe. Let\'s quickly go through the list of possible problems and check everything.',
      torrent_error_step_1: 'Is TorrServe running',
      torrent_error_step_2: 'Dynamic IP',
      torrent_error_step_3: 'Protocol and Port',
      torrent_error_step_4: 'Antivirus blocking',
      torrent_error_step_5: 'Check for availability',
      torrent_error_step_6: 'Still doesn\'t work',
      torrent_error_info_1: 'Make sure you have launched TorrServe on the device where it is installed.',
      torrent_error_info_2: 'A common mistake, the IP address of the device with TorrServe has changed. Make sure that the IP address you entered - {ip} - matches the address of the device on which TorrServe is installed.',
      torrent_error_info_3: 'To connect to TorrServe, you must specify the protocol http:// at the beginning and port :8090 at the end of the address. Make sure there is a port after the IP address, your current address is {ip}',
      torrent_error_info_4: 'Frequent occurrence, antivirus or firewall can block access by IP address, try disabling antivirus and firewall.',
      torrent_error_info_5: 'On any other device on the same network, open the {ip} address in a browser and check if the TorrServe web interface is available.',
      torrent_error_info_6: 'If, after all the checks, a connection error still occurs, try restarting TorrServe and the Internet adapter.',
      torrent_error_info_7: 'If the problem persists, write to the Telegram group @lampa_group with the text (Lampa does not connect to TorrServe after all checks, the current address is {ip})',
      torrent_error_start: 'Start verification',
      torrent_error_nomatrix: 'Failed to verify Matrix version',
      torrent_error_made: 'Performed',
      torrent_error_from: 'from',
      torrent_error_next: 'Further',
      torrent_error_complite: 'To complete',
      torrent_error_connect: 'Connection error',
      torrent_install_need: 'Requires TorrServe',
      torrent_install_text: 'TorrServe is an application that allows you to view content from torrent files online.<br><br>More detailed information on installation can be found in the Telegram groups below.',
      torrent_install_contact: 'Telegram groups',
      torrent_item_bitrate: 'Bitrate',
      torrent_item_seeds: 'Seeds',
      torrent_item_grabs: 'Leechers',
      torrent_item_mb: 'Mbps',
      torrent_serial_episode: 'Series',
      torrent_serial_season: 'Season',
      torrent_serial_date: 'Exit',
      torrent_get_magnet: 'Requesting a magnet link',
      torrent_remove_title: 'Delete',
      torrent_remove_descr: 'The torrent will be removed from your list',
      torrent_parser_any_one: 'Any',
      torrent_parser_any_two: 'Any',
      torrent_parser_no_choice: 'Not chosen',
      torrent_parser_yes: 'Yes',
      torrent_parser_no: 'No',
      torrent_parser_quality: 'Quality',
      torrent_parser_subs: 'Subtitles',
      torrent_parser_voice: 'Translation',
      torrent_parser_tracker: 'tracker',
      torrent_parser_year: 'Year',
      torrent_parser_season: 'Season',
      torrent_parser_sort_by_seeders: 'By distributors',
      torrent_parser_sort_by_size: 'To size',
      torrent_parser_sort_by_name: 'by name',
      torrent_parser_sort_by_tracker: 'By source',
      torrent_parser_sort_by_date: 'By date',
      torrent_parser_sort_by_viewed: 'Viewed',
      torrent_parser_voice_dubbing: 'Dubbing',
      torrent_parser_voice_polyphonic: 'Polyphonic',
      torrent_parser_voice_two: 'Two-voiced',
      torrent_parser_voice_amateur: 'Amateur',
      torrent_parser_reset: 'Reset filter',
      torrent_parser_empty: 'Failed to get results',
      torrent_parser_no_hash: 'Failed to get HASH',
      torrent_parser_added_to_mytorrents: 'added to "My torrents"',
      torrent_parser_add_to_mytorrents: 'Add to "My torrents"',
      torrent_parser_label_title: 'Flag',
      torrent_parser_label_descr: 'Flag a hand with a flag (viewed)',
      torrent_parser_label_cancel_title: 'Uncheck',
      torrent_parser_label_cancel_descr: 'Remove the mark from the distribution (viewed)',
      torrent_parser_timeout: 'Timeout expired',
      torrent_parser_nofiles: 'Failed to extract suitable files',
      torrent_parser_set_link: 'Specify a link for parsing',
      torrent_parser_request_error: 'Request error',
      torrent_parser_magnet_error: 'Failed to get magnet link',
      torrent_parser_no_responce: 'The parser is not responding to the request',
      torrent_parser_torlook_fallback_search_notification: 'Jackett parser is not available or the connection settings are incorrect. Searching Torlook...',
      about_text: 'The application is completely free and uses public links to get information about videos, new releases, popular movies, etc. All available information is used solely for educational purposes, the application does not use its own servers to distribute information.',
      about_channel: 'Our channel',
      about_group: 'Group',
      about_version: 'Version',
      about_donate: 'Donat',
      title_watched: 'You watched',
      title_settings: 'Settings',
      title_collections: 'Collections',
      title_company: 'Company',
      title_actors: 'Actors',
      title_actor: 'Actor',
      title_actress: 'Actress',
      title_person: 'A person',
      title_comments: 'Comments',
      title_torrents: 'Torrents',
      title_trailers: 'Trailers',
      title_watch: 'Watch',
      title_error: 'Error',
      title_links: 'Links',
      title_choice: 'Choose',
      title_main: 'Home',
      title_book: 'Bookmarks',
      title_like: 'Like',
      title_wath: 'Later',
      title_history: 'Browsing history',
      title_mytorrents: 'My torrents',
      title_last: 'Last',
      title_action: 'Action',
      title_producer: 'Producer',
      title_collection: 'Collection',
      title_recomendations: 'Recommendations',
      title_similar: 'Similar',
      title_about: 'About the application',
      title_timetable: 'Schedule',
      title_relises: 'Digital releases',
      title_catalog: 'Catalog',
      title_category: 'Category',
      title_parser: 'Parser',
      title_type: 'Type of',
      title_rating: 'Rating',
      title_country: 'Country',
      title_year: 'Year',
      title_genre: 'Genre',
      title_filter: 'Filter',
      title_notice: 'Notifications',
      title_files: 'Files',
      title_now_watch: 'Watching now',
      title_latest: 'Last addition',
      title_continue: 'Continue browsing',
      title_recomend_watch: 'We recommend to see',
      title_new_episodes: 'New episodes',
      title_popular: 'Popular',
      title_popular_movie: 'Popular films',
      title_popular_tv: 'Popular TV shows',
      title_new_this_year: 'New this year',
      title_hight_voite: 'Highly rated',
      title_new: 'New',
      title_trend_day: 'Today in trend',
      title_trend_week: 'Trending for the week',
      title_upcoming: 'Watch in cinemas',
      title_top_movie: 'Top movies',
      title_top_tv: 'Top series',
      title_tv_today: 'On air today',
      title_this_week: 'This week',
      title_in_top: 'Top',
      title_out: 'Exit',
      title_out_confirm: 'Yes, get out',
      title_continue_two: 'Proceed',
      title_choice_language: 'Choose a language',
      title_subscribe: 'Subscribe',
      title_subscribes: 'Subscriptions',
      title_unsubscribe: 'Unsubscribe',
      title_language: 'Original language',
      subscribe_success: 'You have successfully subscribed',
      subscribe_error: 'An error occurred while subscribing, please try again later',
      subscribe_noinfo: 'Failed to retrieve information, please try again later',
      company_headquarters: 'Headquarters',
      company_homepage: 'Website',
      company_country: 'Country',
      country_ad: 'Andorra',
      country_ae: 'UAE',
      country_af: 'Afghanistan',
      country_al: 'Albania',
      country_am: 'Armenia',
      country_ao: 'Angola',
      country_ar: 'Argentina',
      country_at: 'Austria',
      country_au: 'Australia',
      country_aw: 'Aruba',
      country_az: 'Azerbaijan',
      country_bа: 'Bosnia & Herzegovina',
      country_bd: 'Bangladesh',
      country_be: 'Belgium',
      country_bg: 'Bulgaria',
      country_bh: 'Bahrain',
      country_bi: 'Burundi',
      country_bj: 'Benin',
      country_bo: 'Bolivia',
      country_br: 'Brazil',
      country_bs: 'Bahamas',
      country_bt: 'Bhutan',
      country_bw: 'Botswana',
      country_by: 'Belarus',
      country_ca: 'Canada',
      country_ch: 'Switzerland',
      country_cl: 'Chile',
      country_cm: 'Cameroon',
      country_cn: 'China',
      country_co: 'Colombia',
      country_cr: 'Costa Rica',
      country_cu: 'Cuba',
      country_cv: 'Cape Verde',
      country_cy: 'Cyprus',
      country_cz: 'Czech Republic',
      country_de: 'Germany',
      country_dj: 'Djibouti',
      country_dk: 'Denmark',
      country_do: 'Dominican Republic',
      country_dz: 'Algeria',
      country_ec: 'Ecuador',
      country_ee: 'Estonia',
      country_eg: 'Egypt',
      country_es: 'Spain',
      country_et: 'Ethiopia',
      country_fi: 'Finland',
      country_fo: 'Faroe Islands',
      country_fr: 'France',
      country_ga: 'Gabon',
      country_gb: 'United Kingdom',
      country_ge: 'Georgia',
      country_gh: 'Ghana',
      country_gl: 'Greenland',
      country_gp: 'Guadeloupe',
      country_gr: 'Greece',
      country_gt: 'Guatemala',
      country_hk: 'Hong Kong',
      country_hr: 'Croatia',
      country_ht: 'Haiti',
      country_hu: 'Hungary',
      country_id: 'Indonesia',
      country_ie: 'Ireland',
      country_il: 'Israel',
      country_in: 'India',
      country_iq: 'Iraq',
      country_ir: 'Iran',
      country_is: 'Iceland',
      country_it: 'Italy',
      country_jm: 'Jamaica',
      country_jo: 'Jordan',
      country_jp: 'Japan',
      country_ke: 'Kenya',
      country_kg: 'Kyrgyzstan',
      country_kh: 'Cambodia',
      country_kp: 'North Korea',
      country_kr: 'South Korea',
      country_kz: 'Kazakhstan',
      country_kw: 'Kuwait',
      country_la: 'Laos',
      country_lb: 'Lebanon',
      country_li: 'Liechtenstein',
      country_lk: 'Sri Lanka',
      country_lr: 'Liberia',
      country_lt: 'Lithuania',
      country_lu: 'Luxembourg',
      country_lv: 'Latvia',
      country_ly: 'Libya',
      country_ma: 'Morocco',
      country_mc: 'Monaco',
      country_md: 'Moldova',
      country_me: 'Montenegro',
      country_mk: 'Macedonia',
      country_mm: 'Myanmar',
      country_mn: 'Mongolia',
      country_mo: 'Macau',
      country_mt: 'Malta',
      country_mu: 'Mauritius',
      country_mv: 'Maldives',
      country_mw: 'Malawi',
      country_mx: 'Mexico',
      country_my: 'Malaysia',
      country_mz: 'Mozambique',
      country_na: 'Namibia',
      country_ne: 'Niger',
      country_ng: 'Nigeria',
      country_ni: 'Nicaragua',
      country_nl: 'Netherlands',
      country_no: 'Norway',
      country_np: 'Nepal',
      country_nz: 'New Zealand',
      country_om: 'Oman',
      country_pa: 'Panama',
      country_pe: 'Peru',
      country_pg: 'Papua New Guinea',
      country_ph: 'Philippines',
      country_pk: 'Pakistan',
      country_pl: 'Poland',
      country_pr: 'Puerto Rico',
      country_ps: 'Palestinian Territory',
      country_pt: 'Portugal',
      country_py: 'Paraguay',
      country_qa: 'Qatar',
      country_ro: 'Romania',
      country_rs: 'Serbia',
      country_ru: 'Russia',
      country_rw: 'Rwanda',
      country_sa: 'Saudi Arabia',
      country_sd: 'Sudan',
      country_se: 'Sweden',
      country_sg: 'Singapore',
      country_si: 'Slovenia',
      country_sk: 'Slovakia',
      country_sn: 'Senegal',
      country_su: 'USSR',
      country_sv: 'El Salvador',
      country_sy: 'Syria',
      country_th: 'Thailand',
      country_tj: 'Tajikistan',
      country_tm: 'Turkmenistan',
      country_tn: 'Tunisia',
      country_tr: 'Turkey',
      country_tw: 'Taiwan',
      country_tz: 'Tanzania',
      country_ua: 'Ukraine',
      country_ug: 'Uganda',
      country_us: 'USA',
      country_uy: 'Uruguay',
      country_uz: 'Uzbekistan',
      country_ve: 'Venezuela',
      country_vn: 'Viet Nam',
      country_xk: 'Kosovo',
      country_ws: 'Samoa',
      country_ye: 'Yemen',
      country_yu: 'Yugoslavia',
      country_za: 'South Africa',
      country_zm: 'Zambia',
      country_zw: 'Zimbabwe',
      filter_clarify: 'Clarify',
      filter_clarify_two: 'Refine Search',
      filter_set_name: 'Specify title',
      filter_sorted: 'Sort',
      filter_filtred: 'Filter',
      filter_any: 'Any',
      filter_combinations: 'Combinations',
      filter_alt_names: 'Other names',
      filter_rating_from: 'from',
      filter_rating_to: 'to',
      filter_lang_af: 'Afrikaans',
      filter_lang_ar: 'Arabic',
      filter_lang_az: 'Azerbaijani',
      filter_lang_ba: 'Bashkir',
      filter_lang_be: 'Belarusian',
      filter_lang_bg: 'Bulgarian',
      filter_lang_bn: 'Bengali',
      filter_lang_bs: 'Bosnian',
      filter_lang_ca: 'Catalan',
      filter_lang_ce: 'Chechen',
      filter_lang_cs: 'Czech',
      filter_lang_da: 'Danish',
      filter_lang_de: 'German',
      filter_lang_el: 'Greek',
      filter_lang_en: 'English',
      filter_lang_es: 'Spanish',
      filter_lang_et: 'Estonian',
      filter_lang_fa: 'Persian',
      filter_lang_fi: 'Finnish',
      filter_lang_fr: 'French',
      filter_lang_ga: 'Irish',
      filter_lang_gl: 'Galician',
      filter_lang_gn: 'Guarani',
      filter_lang_he: 'Hebrew',
      filter_lang_hi: 'Hindi',
      filter_lang_hr: 'Croatian',
      filter_lang_hu: 'Hungarian',
      filter_lang_hy: 'Armenian',
      filter_lang_id: 'Indonesian',
      filter_lang_is: 'Icelandic',
      filter_lang_it: 'Italian',
      filter_lang_ja: 'Japanese',
      filter_lang_ka: 'Georgian',
      filter_lang_kk: 'Kazakh',
      filter_lang_ko: 'Korean',
      filter_lang_ks: 'Kashmiri',
      filter_lang_ku: 'Kurdish',
      filter_lang_ky: 'Kirghiz',
      filter_lang_lt: 'Lithuanian',
      filter_lang_lv: 'Latvian',
      filter_lang_mi: 'Maori',
      filter_lang_mk: 'Macedonian',
      filter_lang_mn: 'Mongolian',
      filter_lang_mo: 'Moldavian',
      filter_lang_mt: 'Maltese',
      filter_lang_ne: 'Nepali',
      filter_lang_nl: 'Dutch (Nederlands)',
      filter_lang_no: 'Norwegian',
      filter_lang_pa: 'Punjabi',
      filter_lang_pl: 'Polish',
      filter_lang_ps: 'Pushto',
      filter_lang_pt: 'Portuguese',
      filter_lang_ro: 'Romanian',
      filter_lang_ru: 'Russian',
      filter_lang_si: 'Sinhalese',
      filter_lang_sk: 'Slovak',
      filter_lang_sl: 'Slovenian',
      filter_lang_sm: 'Samoan',
      filter_lang_so: 'Somali',
      filter_lang_sq: 'Albanian',
      filter_lang_sr: 'Serbian',
      filter_lang_sv: 'Swedish',
      filter_lang_sw: 'Swahili',
      filter_lang_ta: 'Tamil',
      filter_lang_tg: 'Tajik',
      filter_lang_th: 'Thai',
      filter_lang_tk: 'Turkmen',
      filter_lang_tr: 'Turkish',
      filter_lang_tt: 'Tatar',
      filter_lang_ur: 'Urdu',
      filter_lang_uk: 'Ukrainian',
      filter_lang_uz: 'Uzbek',
      filter_lang_vi: 'Vietnamese',
      filter_lang_yi: 'Yiddish',
      filter_lang_zh: 'Chinese',
      filter_genre_ac: 'Action',
      filter_genre_ad: 'Adventures',
      filter_genre_mv: 'Cartoon',
      filter_genre_cm: 'Comedy',
      filter_genre_cr: 'Crime',
      filter_genre_dc: 'Documentary',
      filter_genre_dr: 'Drama',
      filter_genre_fm: 'Family',
      filter_genre_fe: 'Fantasy',
      filter_genre_hi: 'Story',
      filter_genre_ho: 'Horror',
      filter_genre_mu: 'Music',
      filter_genre_de: 'Detective',
      filter_genre_md: 'Melodrama',
      filter_genre_fa: 'Fiction',
      filter_genre_tv: 'TV film',
      filter_genre_tr: 'Thriller',
      filter_genre_mi: 'Military',
      filter_genre_ve: 'Western',
      filter_genre_aa: 'Action & Adventure',
      filter_genre_ch: 'Children\'s',
      filter_genre_nw: 'News',
      filter_genre_rs: 'Reality show',
      filter_genre_hf: 'Sci-Fi and Fantasy',
      filter_genre_op: 'Soap opera',
      filter_genre_tc: 'Talk show',
      filter_genre_mp: 'War and Politics',
      empty_title: 'Empty',
      empty_text: 'Nothing found for your filter, please refine your filter.',
      empty_title_two: 'It\'s empty here',
      empty_text_two: 'The list is currently empty.',
      menu_main: 'Home',
      menu_movies: 'Movies',
      menu_tv: 'Series',
      menu_catalog: 'Catalog',
      menu_filter: 'Filter',
      menu_collections: 'Collections',
      menu_relises: 'Releases',
      menu_anime: 'Anime',
      menu_bookmark: 'Bookmarks',
      menu_like: 'Like',
      menu_time: 'Later',
      menu_history: 'History',
      menu_timeline: 'Schedule',
      menu_torrents: 'Torrents',
      menu_settings: 'Settings',
      menu_about: 'Information',
      menu_console: 'Console',
      menu_multmovie: 'Cartoons',
      menu_multtv: 'Animated series',
      plugins_catalog_work: 'Working plugins',
      plugins_catalog_work_descr: 'Plugins that work exactly in the lamp.',
      plugins_catalog_popular: 'Popular plugins among users',
      plugins_catalog_popular_descr: 'Installation from unknown sources may cause the application to work incorrectly.',
      plugins_online: 'View online',
      plugins_check_fail: 'Failed to test the functionality of the plugin. However, this does not mean that the plugin does not work. Reload the application to see if the plugin is loading.',
      plugins_need_reload: 'To apply the plugin, you need to restart the application',
      plugins_install: 'Install',
      plugins_install_ready: 'This plugin is already installed.',
      plugins_installed: 'Installations',
      plugins_load_from: 'Loaded from CUB',
      plugins_ok_for_check: 'Click (OK) to test the plugin',
      plugins_no_loaded: 'When loading the application, some plugins could not be loaded',
      time_viewed: 'Viewed',
      time_from: 'from',
      time_reset: 'Reset timecode',
      settings_clear_cache: 'Cache and data cleared',
      settings_user_links: 'Custom Link',
      settings_for_local: 'For local TorrServer',
      settings_add: 'Add',
      settings_remove: 'Delete',
      settings_this_value: 'present value',
      settings_added: 'Added',
      settings_removed: 'Removed',
      settings_param_player_inner: 'Lampa',
      settings_param_player_outside: 'External',
      settings_param_yes: 'Yes',
      settings_param_no: 'No',
      settings_param_interface_size_small: 'Smaller',
      settings_param_interface_size_normal: 'Normal',
      settings_param_interface_size_bigger: 'More',
      settings_param_poster_quality_low: 'Low',
      settings_param_poster_quality_average: 'Average',
      settings_param_poster_quality_high: 'High',
      settings_param_parse_directly: 'Directly',
      settings_param_parse_api: 'Through the website API',
      settings_param_background_complex: 'Complex',
      settings_param_background_simple: 'Simple',
      settings_param_background_image: 'Picture',
      settings_param_link_use_one: 'Main',
      settings_param_link_use_two: 'Additional',
      settings_param_subtitles_size_small: 'small',
      settings_param_subtitles_size_normal: 'Ordinary',
      settings_param_subtitles_size_bigger: 'Large',
      settings_param_screensaver_nature: 'Nature',
      settings_param_torrent_lang_orig: 'Original',
      settings_param_torrent_lang_ru: 'Russian',
      settings_param_player_timecode_again: 'Start over',
      settings_param_player_timecode_continue: 'Proceed',
      settings_param_player_timecode_ask: 'To ask',
      settings_param_player_scale_method: 'Calculate',
      settings_param_player_hls_app: 'Systemic',
      settings_param_player_hls_js: 'Program',
      settings_param_card_view_load: 'Upload',
      settings_param_card_view_all: 'Show all',
      settings_param_navigation_remote: 'Remote controller',
      settings_param_navigation_mouse: 'Remote control with mouse',
      settings_param_keyboard_lampa: 'Lampa',
      settings_param_keyboard_system: 'Systemic',
      helper_keyboard: 'After entering the value, press the "Back" button to save',
      helper_torrents: 'Hold down the (OK) key to bring up the context menu',
      helper_cleared: 'Success, tooltips will be shown again.',
      helper_torrents_view: 'Hold down the (OK) key to reset the timecode and display the menu',
      fav_sync_title: 'Bookmark sync',
      fav_sync_text: 'Your favorite bookmarks with you. Connect synchronization and view on any device. <br><br>To do this, register on the site www.cub.watch, create a profile and log in to the application.',
      fav_sync_site: 'Website',
      fav_remove_title: 'Remove from history',
      fav_remove_descr: 'Delete selected card',
      fav_clear_title: 'Clear the history',
      fav_clear_descr: 'Delete all cards from history',
      fav_clear_label_title: 'Clear labels',
      fav_clear_label_descr: 'Clear View Tags',
      fav_clear_time_title: 'Clear Timecodes',
      fav_clear_time_descr: 'Clear all timecodes',
      fav_label_cleared: 'Marks cleared',
      fav_time_cleared: 'Timecodes cleared',
      timetable_empty: 'This section will display the release dates of new episodes.',
      player_quality: 'Quality',
      player_tracks: 'Audio tracks',
      player_disabled: 'Disabled',
      player_unknown: 'Unknown',
      player_subs: 'Subtitles',
      player_size_default_title: 'Default',
      player_size_default_descr: 'Default video size',
      player_size_cover_title: 'Expand',
      player_size_cover_descr: 'Expands video to full screen',
      player_size_fill_title: 'Fill',
      player_size_fill_descr: 'Fit video to full screen',
      player_size_s115_title: 'Zoom 115%',
      player_size_s115_descr: 'Enlarge video by 115%',
      player_size_s130_title: 'Zoom 130%',
      player_size_s130_descr: 'Enlarge video by 130%',
      player_size_v115_title: 'Vertical 115%',
      player_size_v115_descr: 'Enlarge video by 115%',
      player_size_v130_title: 'Vertical 130%',
      player_size_v130_descr: 'Enlarge video by 130%',
      player_video_size: 'Video size',
      player_playlist: 'Playlist',
      player_error_one: 'Failed to decode video',
      player_error_two: 'Video not found or corrupted',
      player_start_from: 'Continue browsing from',
      player_not_found: 'Player not found',
      player_lauch: 'Launch player',
      player_speed_default_title: 'Plain',
      player_speed_two_descr: 'Play without sound',
      player_video_speed: 'Playback speed',
      player_share_title: 'Share',
      player_share_descr: 'Play this video on another device',
      player_normalization_power_title: 'Normalization power',
      player_normalization_smooth_title: 'Normalization speed',
      player_normalization_step_low: 'Low',
      player_normalization_step_medium: 'Average',
      player_normalization_step_hight: 'High',
      player_youtube_no_played: 'Sorry, this video is not available in your region and may have been blocked or removed.',
      player_youtube_start_play: 'To start playing the video, click the "Play" button.',
      broadcast_open: 'Open card on another device',
      broadcast_play: 'Choose the device to watch on',
      card_new_episode: 'New series',
      card_book_remove: 'Remove from bookmarks',
      card_book_add: 'To bookmarks',
      card_book_descr: 'Look in the menu (Bookmarks)',
      card_like_remove: 'Remove from favorites',
      card_like_add: 'Like',
      card_like_descr: 'Look at the menu (Like)',
      card_wath_remove: 'Remove from expected',
      card_wath_add: 'Watch Later',
      card_wath_descr: 'See the menu (Later)',
      card_history_remove: 'Remove from history',
      card_history_add: 'Add to history',
      card_history_descr: 'Look in the menu (History)',
      keyboard_listen: 'Speak, I\'m listening...',
      keyboard_nomic: 'No microphone access',
      notice_new_quality: 'New quality available',
      notice_quality: 'Quality',
      notice_new_episode: 'New series',
      notice_none: 'You don\'t have any notifications yet, register at <b>www.cub.watch</b> to follow new episodes and releases.',
      notice_in_quality: 'As',
      notice_none_account: 'You don\'t have any notifications yet, bookmark the series and wait for notifications of new episodes.',
      notice_none_system: 'You currently have no notifications. We will be sure to notify you when new notifications become available.',
      copy_link: 'Copy video link',
      copy_secuses: 'Link copied to clipboard',
      copy_error: 'Error copying link',
      account_sync_to_profile: 'All bookmarks will be moved to the profile',
      account_sync_secuses: 'All bookmarks have been successfully transferred',
      account_profiles: 'Profiles',
      account_profiles_empty: 'Failed to get list of profiles',
      account_authorized: 'Authorized',
      account_logged_in: 'You are logged in',
      account_login_failed: 'Login failed',
      account_login_wait: 'Waiting for login',
      account_profile_main: 'General',
      account_export_secuses: 'Export completed successfully',
      account_export_fail: 'Export error',
      account_import_secuses: 'Import completed successfully',
      account_import_fail: 'Import error',
      account_imported: 'imported',
      account_reload_after: 'reboot after 5 sec.',
      account_create: 'Discover more opportunities with a CUB account. Register at <span class="account-modal__site">www.cub.watch</span> and get access to sync your bookmarks, timecodes and other CUB account features.',
      account_premium: 'Discover more features with a CUB Premium account. Increasing limits and access to additional features of the service.',
      account_premium_more: 'Learn more about CUB Premium',
      account_limited: 'You have reached the maximum limit. Increase the limit with a CUB Premium account. Learn more at <span class="account-modal__site">www.cub.watch/premium</span>',
      account_code_enter: 'Enter a six-digit code',
      account_code_error: 'Perhaps you entered an incorrect or outdated code',
      account_code_wrong: 'Perhaps you entered an incorrect format',
      account_code_where: 'Go to the <span class="account-add-device__site">cub.watch/add</span> website and enter the code provided there.',
      account_code_input: 'Enter code',
      settings_cub_signin_button: 'Sign in',
      network_noconnect: 'No network connection',
      network_404: 'The requested page was not found. [404]',
      network_401: 'Authorization failed',
      network_500: 'Internal Server Error. [500]',
      network_parsererror: 'The requested JSON parsing failed.',
      network_timeout: 'Request timed out.',
      network_abort: 'The request has been aborted.',
      network_error: 'Unknown error',
      size_zero: '0 Byte',
      size_byte: 'Byte',
      size_kb: 'KB',
      size_mb: 'MB',
      size_gb: 'GB',
      size_tb: 'TB',
      size_pp: 'PB',
      speed_bit: 'bit',
      speed_kb: 'Kbps',
      speed_mb: 'Mbps',
      speed_gb: 'Gbit',
      speed_tb: 'Tbit',
      speed_pp: 'Pbit',
      month_1: 'January',
      month_2: 'February',
      month_3: 'March',
      month_4: 'April',
      month_5: 'May',
      month_6: 'June',
      month_7: 'July',
      month_8: 'August',
      month_9: 'September',
      month_10: 'October',
      month_11: 'November',
      month_12: 'December',
      day_1: 'Monday',
      day_2: 'Tuesday',
      day_3: 'Wednesday',
      day_4: 'Thursday',
      day_5: 'Friday',
      day_6: 'Saturday',
      day_7: 'Sunday',
      month_1_e: 'January',
      month_2_e: 'February',
      month_3_e: 'March',
      month_4_e: 'April',
      month_5_e: 'May',
      month_6_e: 'June',
      month_7_e: 'July',
      month_8_e: 'August',
      month_9_e: 'September',
      month_10_e: 'October',
      month_11_e: 'November',
      month_12_e: 'December',
      week_1: 'Mon',
      week_2: 'Tue',
      week_3: 'Wed',
      week_4: 'Thu',
      week_5: 'Fri',
      week_6: 'Sat',
      week_7: 'Sun',
      extensions_enable: 'Turn on',
      extensions_disable: 'Disable',
      extensions_check: 'Check status',
      extensions_install: 'Install',
      extensions_info: 'Information',
      extensions_edit: 'Edit',
      extensions_change_name: 'Change name',
      extensions_change_link: 'Change link',
      extensions_remove: 'Delete',
      extensions_set_name: 'Enter plugin name',
      extensions_set_url: 'Enter plugin url',
      extensions_ready: 'This plugin is already installed',
      extensions_no_info: 'Without information',
      extensions_no_name: 'Untitled',
      extensions_worked: 'Worker',
      extensions_no_plugin: 'Plugin not verified',
      extensions_add: 'Add Plugin',
      extensions_from_memory: 'Installed in memory',
      extensions_from_cub: 'Installed from CUB',
      extensions_from_popular: 'Popular plugins',
      extensions_from_lib: 'Plugin Library',
      extensions_from_connected: 'Connected plugins',
      settings_webos_launcher: 'Application launch',
      settings_webos_launcher_add_device: 'Install as starter app',
      settings_webos_launcher_remove_device: 'Remove from starter spplications',
      player_normalization: 'Normalization',
      change_source_on_cub: 'Change source to CUB',
      settings_param_jackett_interview_all: 'All',
      settings_param_jackett_interview_healthy: 'Available only',
      settings_parser_jackett_interview: 'Poll trackers',
      title_ongoing: 'Ongoings',
      title_pgrating: 'Age limit',
      settings_interface_card_interfice: 'Card interface',
      settings_interface_card_poster: 'Show poster',
      title_card: 'Card',
      settings_param_card_interface_old: 'Old',
      settings_param_card_interface_new: 'New',
      title_seasons: 'Seasons',
      title_episodes: 'Episodes',
      title_rewiews: 'Reviews',
      settings_interface_glass: 'Glass',
      settings_interface_glass_descr: 'Show interface in glassy style',
      settings_interface_black_style: 'Black style',
      plugins_remove: 'Remove plugins',
      settings_reset: 'Reset',
      title_channel: 'Channel',
      input_detection_touch: 'Want to switch to touch control?',
      input_detection_mouse: 'Want to switch to mouse control?',
      input_detection_remote: 'Want to switch to remote control?',
      settings_interface_hide_outside_the_screen: 'Hide cards off screen',
      settings_interface_hide_outside_the_screen_descr: 'This will speed up UI rendering and improve performance',
      https_text: 'You are using the HTTPS protocol, in this protocol the lamp does not work correctly. For the correct operation of the lamp, use the address with the HTTP protocol',
      extensions_hpu_best: 'Popular',
      extensions_hpu_recomend: 'Recommended',
      extensions_hpu_theme: 'Themes',
      extensions_hpu_screensaver: 'Screensaver',
      extensions_hpu_video: 'Video',
      extensions_hpu_control: 'Control',
      extensions_hpu_other: 'Miscellaneous',
      extensions_hpu_: 'Other',
      title_author: 'Author',
      title_buffer: 'Buffer',
      settings_rest_screensaver_time: 'After how many minutes to start the screensaver',
      time_h: 'h.',
      time_m: 'm.',
      time_s: 's.',
      settings_param_glass_easy: 'Transparent',
      settings_param_glass_medium: 'Semitransparent',
      settings_param_glass_blacked: 'Blacked out',
      settings_interface_glass_opacity: 'Glass transparency',
      torrent_error_check_no_auth: 'The server responded to the request, but the authorization failed',
      settings_interface_card_cover: 'Show cover',
      title_upcoming_episodes: 'Upcoming episode releases',
      settings_rest_cache_images: 'Image cache',
      settings_rest_cache_images_descr: 'Cache posters and backgrounds to local storage',
      settings_player_rewind_title: 'Rewind',
      settings_player_rewind_descr: 'Rewind interval in seconds',
      speedtest_connect: 'connection',
      speedtest_test: 'testing',
      speedtest_ready: 'ready',
      speedtest_button: 'Test Speed'
    };

    var uk = {
      lang_choice_title: 'Ласкаво просимо',
      lang_choice_subtitle: 'Виберіть мову',
      more: 'Ще',
      back: 'Назад',
      ready: 'Готово',
      show_more: 'Показати ще',
      more_results: 'Показати більше результатів',
      loading: 'Завантаження',
      nofind_movie: 'Не вдалось знайти фільм.',
      noname: 'Без назви',
      nochoice: 'Не вибрано',
      cancel: 'Скасувати',
      confirm: 'Підтверджую',
      sure: 'Ви впевнені?',
      nodata: 'Немає даних',
      search: 'Пошук',
      search_input: 'Введіть текст',
      search_empty: 'Історія пошуку порожня.',
      search_delete: 'Ліворуч - видалити',
      search_start_typing: 'Почніть вводити текст для пошуку.',
      search_searching: 'Йде пошук...',
      search_start: 'Розпочати пошук',
      search_nofound: 'На ваш запит нічого не знайдено.',
      full_genre: 'Жанр',
      full_production: 'Виробництво',
      full_date_of_release: 'Дата релізу',
      full_budget: 'Бюджет',
      full_countries: 'Країни',
      full_like: 'Подобається',
      full_torrents: 'Торренти',
      full_trailers: 'Трейлери',
      full_detail: 'Детально',
      full_notext: 'Без опису.',
      full_series_release: 'Вихід серій',
      full_next_episode: 'Наступна',
      full_episode_days_left: 'Залишилось днів',
      full_trailer_official: 'Офіційний',
      full_trailer_no_official: 'Неофіційний',
      full_season: 'Сезон',
      full_episode: 'Епізод',
      full_directing: 'Режисура',
      full_writing: 'Сценарій',
      settings_cub_sync: 'Синхронізація',
      settings_cub_sync_descr: 'Синхронізація із сервісом CUB: синхронізація ваших закладок, історії переглядів, міток та тайм-кодів. Сайт: www.cub.watch',
      settings_cub_account: 'Акаунт',
      settings_cub_logged_in_as: 'Увійшли як',
      settings_cub_profile: 'Профіль',
      settings_cub_sync_btn: 'Синхронізувати',
      settings_cub_sync_btn_descr: 'Зберегти локальні закладки в обліковий запис CUB',
      settings_cub_backup: 'Бекап',
      settings_cub_backup_descr: 'Зберегти або завантажити бекап даних',
      settings_cub_logout: 'Вийти з облікового запису',
      settings_cub_signin: 'Авторизація',
      settings_cub_not_specified: 'Не вказано',
      settings_cub_password: 'Пароль',
      settings_cub_status: 'Статус',
      settings_cub_backup_import: 'Імпорт',
      settings_cub_backup_export: 'Експорт',
      settings_cub_sync_filters: 'Синхронізація фільтрів',
      settings_cub_sync_calendar: 'Синхронізація календаря',
      settings_cub_sync_quality: 'Синхронізація позначок (якість)',
      settings_cub_sync_search: 'Синхронізація історії пошуку',
      settings_cub_sync_recomends: 'Синхронізація рекомендацій',
      settings_cub_sync_timecodes: 'Синхронізація тайм-кодів',
      settings_input_links: 'Вибране',
      settings_interface_type: 'Полегшена версія',
      settings_interface_size: 'Розмір інтерфейсу',
      settings_interface_background: 'Фон',
      settings_interface_background_use: 'Показувати фон',
      settings_interface_background_type: 'Тип фону',
      settings_interface_performance: 'Швидкодія',
      settings_interface_animation: 'Анімація',
      settings_interface_animation_descr: 'Анімація карток та контенту',
      settings_interface_attenuation: 'Згасання',
      settings_interface_attenuation_descr: 'Плавне згасання карток знизу та зверху',
      settings_interface_scroll: 'Тип скролінгу',
      settings_interface_view_card: 'Тип перегляду карток',
      settings_interface_view_card_descr: 'У міру скролінгу стрічки картки підвантажуватимуться поступово або завантажуватимуться всі',
      settings_interface_lang: 'Мова інтерфейсу',
      settings_interface_lang_reload: 'Необхідно перезавантажити програму, натисніть "OK" для перезавантаження.',
      settings_main_account: 'Акаунт',
      settings_main_interface: 'Інтерфейс',
      settings_main_player: 'Плеєр',
      settings_main_parser: 'Парсер',
      settings_main_torrserver: 'TorrServer',
      settings_main_plugins: 'Розширення',
      settings_main_rest: 'Iнше',
      settings_rest_start: 'Початкова сторінка',
      settings_rest_start_descr: 'З якої сторінки починати під час запуску',
      settings_rest_source: 'Джерело',
      settings_rest_source_use: 'Основне джерело',
      settings_rest_source_descr: 'Звідки брати інформацію про фільми',
      settings_rest_tmdb_lang: 'Якою мовою відображати дані з TMDB',
      settings_rest_tmdb_prox: 'Проксирувати TMDB',
      settings_rest_tmdb_prox_auto: 'Увімкнути проксі автоматично',
      settings_rest_tmdb_posters: 'Раздільна здатність TMDB',
      settings_rest_screensaver: 'Скрінсейвер',
      settings_rest_screensaver_use: 'Показувати заставку за бездіяльності',
      settings_rest_screensaver_type: 'Тип заставки',
      settings_rest_helper: 'Підказки',
      settings_rest_helper_use: 'Показувати підказки',
      settings_rest_helper_reset: 'Показати підказки знову',
      settings_rest_pages: 'Скільки сторінок зберігати у пам\'яті',
      settings_rest_pages_descr: 'Зберігає сторінки в тому стані, в якому ви їх покинули',
      settings_rest_time: 'Змістити час',
      settings_rest_navigation: 'Тип навігації',
      settings_rest_keyboard: 'Тип клавіатури',
      settings_rest_device: 'Назва пристрою',
      settings_rest_device_placeholder: 'Наприклад: Моя Лампа',
      settings_rest_cache: 'Очистити кеш',
      settings_rest_cache_descr: 'Будуть очищені всі налаштування та дані',
      settings_rest_tmdb_example: 'Наприклад:',
      settings_rest_tmdb_api_descr: 'Для отримання даних',
      settings_rest_tmdb_image_descr: 'Для отримання зображень',
      settings_rest_card_quality: 'Відмітки якості',
      settings_rest_card_quality_descr: 'Відображати позначки якості на картках',
      settings_rest_card_episodes: 'Відмітки епізодів',
      settings_rest_card_episodes_descr: 'Показувати позначки епізодів на картках',
      settings_parser_use: 'Використовувати парсер',
      settings_parser_use_descr: 'Тим самим ви погоджуєтесь взяти на себе всю відповідальність за використання публічних посилань для перегляду торрент та онлайн контенту.',
      settings_parser_type: 'Тип парсера для торентів',
      settings_parser_jackett_placeholder: 'Наприклад: 192.168.х',
      settings_parser_jackett_link: 'Посилання',
      settings_parser_jackett_link_descr: 'Вкажіть посилання на скрипт Jackett',
      settings_parser_jackett_key_placeholder: 'Наприклад: sa0sk83d.',
      settings_parser_jackett_key: 'Api ключ',
      settings_parser_jackett_key_descr: 'Знаходиться у Jackett',
      settings_parser_torlook_type: 'Метод парсингу сайту TorLook',
      settings_parser_scraperapi_placeholder: 'Наприклад: scraperapi.com',
      settings_parser_scraperapi_link: 'Посилання на парсер сайтів',
      settings_parser_scraperapi_descr: 'Зареєструйтесь на сайті scraperapi.com, введіть посилання api.scraperapi.com?api_key=...&url={q}<br>У {q} буде поставлятися сайт w41.torlook.info',
      settings_parser_search: 'Пошук',
      settings_parser_search_descr: 'Якою мовою здійснювати пошук?',
      settings_parser_in_search: 'Парсер у пошуку',
      settings_parser_in_search_descr: 'Показувати результати у пошуку?',
      settings_parser_timeout_title: 'Таймаут парсера',
      settings_parser_timeout_descr: 'Час у секундах, який очікуватиметься відповіді від сервера',
      settings_player_type: 'Тип плеєра',
      settings_player_type_descr: 'Яким плеєром відтворювати',
      settings_player_iptv_type: 'Тип плеєра для IPTV',
      settings_player_iptv_type_descr: 'Яким плеєром відтворювати IPTV канали',
      settings_player_reset: 'Скинути програвач за замовчуванням',
      settings_player_reset_descr: 'Скидає вибраний Android плеєр у програмі',
      settings_player_path: 'Шлях до плеєра',
      settings_player_path_descr: 'Вкажіть шлях до програвача .exe.',
      settings_player_normalization: 'Нормалізація звуку',
      settings_player_normalization_descr: 'Нормалізує звук в один рівень, знижує гучні звуки та підвищує тихі.',
      settings_player_next_episode: 'Наступна серія',
      settings_player_next_episode_descr: 'Автоматично перемикати на наступну серію після закінчення поточної',
      settings_player_timecode: 'Тайм-код',
      settings_player_timecode_descr: 'Продовжити з останнього місця перегляду',
      settings_player_scale: 'Метод масштабування',
      settings_player_scale_descr: 'Як проводити обчислення для масштабування відео',
      settings_player_subs: 'Субтитри',
      settings_player_subs_use: 'Увімкнути',
      settings_player_subs_use_descr: 'Завжди включати субтитри після запуску відео',
      settings_player_subs_size: 'Розмір',
      settings_player_subs_size_descr: 'Розмір субтитрів на екрані',
      settings_player_subs_stroke_use: 'Використовувати окантовку',
      settings_player_subs_stroke_use_descr: 'Субтитри будуть обведені чорним кольором для покращення читаності',
      settings_player_subs_backdrop_use: 'Використовувати підкладку',
      settings_player_subs_backdrop_use_descr: 'Субтитри відображатимуться на напівпрозорій підкладці для покращення читаності',
      settings_player_quality: 'Якість відео за замовчуванням',
      settings_player_quality_descr: 'Переважна якість відео для перегляду',
      settings_player_hls_title: 'Обробка потоку .m3u8',
      settings_player_hls_descr: 'Не чіпайте цей параметр, якщо не знаєте навіщо він.',
      settings_plugins_notice: 'Для застосування плагіна необхідно перезавантажити програму',
      settings_plugins_add: 'Додати плагін',
      settings_plugins_add_descr: 'Щоб видалити доданий плагін, утримуйте або натисніть двічі клавішу (OK) на ньому.',
      settings_plugins_install: 'Встановити плагін',
      settings_plugins_install_descr: 'Встановити плагін зі списку доступних',
      settings_server_link: 'Використовувати посилання',
      settings_server_links: 'Посилання',
      settings_server_placeholder: 'Наприклад: 192.168.х',
      settings_server_link_one: 'Основне посилання',
      settings_server_link_one_descr: 'Вкажіть основне посилання на скрипт TorrServer',
      settings_server_link_two: 'Додаткове посилання',
      settings_server_link_two_descr: 'Вкажіть додаткове посилання на скрипт TorrServer',
      settings_server_additionally: 'Додатково',
      settings_server_client: 'Вбудований клієнт',
      settings_server_client_descr: 'Використовувати вбудований JS-клієнт TorrServe, інакше запускається системний.',
      settings_server_base: 'Зберегти у базу',
      settings_server_base_descr: 'Торрент буде додано до бази TorrServer',
      settings_server_preload: 'Використовувати буфер попереднього завантаження',
      settings_server_preload_descr: 'Чекати на заповнення буфера попереднього завантаження TorrServer перед програванням',
      settings_server_auth: 'Авторизація',
      settings_server_password_use: 'Вхід паролем',
      settings_server_login: 'Логін',
      settings_server_password: 'Пароль',
      settings_server_not_specified: 'Не вказано',
      torent_nohash_reasons: 'Причини',
      torent_nohash_reason_one: 'TorServer не зміг завантажити файл торрент',
      torent_nohash_reason_two: 'Відповідь від TorServer',
      torent_nohash_reason_three: 'Посилання',
      torent_nohash_do: 'Що робити?',
      torent_nohash_do_one: 'Перевірте, чи правильно ви налаштували Jackett',
      torent_nohash_do_two: 'Приватні джерела можуть не видавати посилання на файл',
      torent_nohash_do_three: 'Переконайтеся, що Jackett теж може завантажити файл',
      torent_nohash_do_four: 'Написати в нашу телеграму групу: @lampa_group',
      torent_nohash_do_five: 'Вкажіть який фільм, яка роздача та по можливості фото цієї роздачі',
      torrent_error_text: 'Не вдалося підключитися до TorrServe. Давайте швидко пройдемося по списку можливих проблем і перевіримо все.',
      torrent_error_step_1: 'Чи запущений TorrServe',
      torrent_error_step_2: 'Динамічна IP-адреса',
      torrent_error_step_3: 'Протокол та порт',
      torrent_error_step_4: 'Блокування антивірусами',
      torrent_error_step_5: 'Перевірте доступність',
      torrent_error_step_6: 'Все одно не працює',
      torrent_error_info_1: 'Переконайтеся, що TorrServe запущено на пристрої, де він встановлений.',
      torrent_error_info_2: 'Часта помилка змінилася IP-адреса пристрою з TorrServe. Переконайтеся, що IP-адреса, яку ви ввели - {ip}, збігається з адресою пристрою, на якому встановлено TorrServe.',
      torrent_error_info_3: 'Для підключення до TorrServe необхідно вказати протокол http:// на початку та порт :8090 в кінці адреси. Переконайтеся, що після IP-адреси вказано порт, ваша поточна адреса - {ip}',
      torrent_error_info_4: 'Часте явище, антивірус або брандмауер може блокувати доступ за IP-адресою, спробуйте вимкнути антивірус та брандмауер.',
      torrent_error_info_5: 'На будь-якому іншому пристрої в цій мережі, відкрийте в браузері адресу {ip} і перевірте, чи доступний веб-інтерфейс TorrServe.',
      torrent_error_info_6: 'Якщо після всіх перевірок все одно виникає помилка підключення, спробуйте перезавантажити TorrServe та інтернет-адаптер.',
      torrent_error_info_7: 'Якщо проблему не вирішено, пишіть у Telegram-групу @lampa_group з текстом (Lampa не підключається до TorrServe після всіх перевірок, поточна адреса {ip})',
      torrent_error_start: 'Розпочати перевірку',
      torrent_error_nomatrix: 'Неможливо підтвердити версію Matrix',
      torrent_error_made: 'Виконано',
      torrent_error_from: 'з',
      torrent_error_next: 'Далі',
      torrent_error_complite: 'Завершити',
      torrent_error_connect: 'Помилка підключення',
      torrent_install_need: 'Необхідний TorrServe',
      torrent_install_text: 'TorrServe – додаток, який дозволяє переглядати контент з торрент-файлів в онлайн режимі.',
      torrent_install_contact: 'Telegram-групи',
      torrent_item_bitrate: 'Бітрейт',
      torrent_item_seeds: 'Роздають',
      torrent_item_grabs: 'Качають',
      torrent_item_mb: 'Мбіт/с',
      torrent_serial_episode: 'Серія',
      torrent_serial_season: 'Сезон',
      torrent_serial_date: 'Вихід',
      torrent_get_magnet: 'Запитую magnet посилання',
      torrent_remove_title: 'вилучити',
      torrent_remove_descr: 'Торрент буде видалено зі списку',
      torrent_parser_any_one: 'Будь-яке',
      torrent_parser_any_two: 'Будь-який',
      torrent_parser_no_choice: 'Не вибрано',
      torrent_parser_yes: 'Так',
      torrent_parser_no: 'Ні',
      torrent_parser_quality: 'Якість',
      torrent_parser_subs: 'Субтитри',
      torrent_parser_voice: 'Переклад',
      torrent_parser_tracker: 'Трекер',
      torrent_parser_year: 'Рік',
      torrent_parser_season: 'Сезон',
      torrent_parser_sort_by_seeders: 'По роздаючих',
      torrent_parser_sort_by_size: 'По розміру',
      torrent_parser_sort_by_name: 'За назвою',
      torrent_parser_sort_by_tracker: 'За джерелом',
      torrent_parser_sort_by_date: 'По даті',
      torrent_parser_sort_by_viewed: 'За переглянутими',
      torrent_parser_voice_dubbing: 'Дубляж',
      torrent_parser_voice_polyphonic: 'Багатоголосий',
      torrent_parser_voice_two: 'Двоголосий',
      torrent_parser_voice_amateur: 'Аматорський',
      torrent_parser_reset: 'Скинути фільтр',
      torrent_parser_empty: 'Не вдалося отримати результатів',
      torrent_parser_no_hash: 'Неможливо отримати HASH',
      torrent_parser_added_to_mytorrents: 'додано до «Моїх торрентів»',
      torrent_parser_add_to_mytorrents: 'Додати до «Моїх торентів»',
      torrent_parser_label_title: 'Позначити',
      torrent_parser_label_descr: 'Позначити роздачу з прапором (переглянуто)',
      torrent_parser_label_cancel_title: 'Зняти позначку',
      torrent_parser_label_cancel_descr: 'Зняти відмітку з роздачі (переглянуто)',
      torrent_parser_timeout: 'Час очікування минув',
      torrent_parser_nofiles: 'Не вдалося вилучити відповідні файли',
      torrent_parser_set_link: 'Вкажіть посилання для парсингу',
      torrent_parser_request_error: 'Помилка у запиті',
      torrent_parser_magnet_error: 'Не вдалося отримати magnet посилання',
      torrent_parser_torlook_fallback_search_notification: 'Парсер Jackett недоступний або налаштування підключення не вірні. Здійснюється пошук у Torlook...',
      about_text: 'Додаток повністю безкоштовний і використовує публічні посилання для отримання інформації про відео, новинки, популярні фільми і т.д. Вся доступна інформація використовується виключно з пізнавальною метою, додаток не використовує свої власні сервери для поширення інформації.',
      about_channel: 'Наш канал',
      about_group: 'Група',
      about_version: 'Версія',
      about_donate: 'Донат',
      title_watched: 'Ви дивилися',
      title_settings: 'Налаштування',
      title_collections: 'Добірки',
      title_company: 'Компанія',
      title_actors: 'Актори',
      title_actor: 'Актор',
      title_actress: 'Актриса',
      title_person: 'Персона',
      title_comments: 'Коментарі',
      title_torrents: 'Торренти',
      title_trailers: 'Трейлери',
      title_watch: 'Дивитись',
      title_error: 'Помилка',
      title_links: 'Посилання',
      title_choice: 'Вибрати',
      title_main: 'Головна',
      title_book: 'Закладки',
      title_like: 'Подобається',
      title_wath: 'Пізніше',
      title_history: 'Історія переглядів',
      title_mytorrents: 'Мої торенти',
      title_last: 'Остання',
      title_action: 'Дія',
      title_producer: 'Режисер',
      title_collection: 'Колекція',
      title_recomendations: 'Рекомендації',
      title_similar: 'Подібні',
      title_about: 'Про додаток',
      title_timetable: 'Розклад',
      title_relises: 'Цифрові релізи',
      title_catalog: 'Каталог',
      title_category: 'Категорія',
      title_parser: 'Парсер',
      title_type: 'Тип',
      title_rating: 'Рейтинг',
      title_country: 'Країна',
      title_year: 'Рік',
      title_genre: 'Жанр',
      title_filter: 'Фільтр',
      title_notice: 'Повідомлення',
      title_files: 'Файли',
      title_now_watch: 'Зараз дивляться',
      title_latest: 'Останнє додавання',
      title_continue: 'Продовжити перегляд',
      title_recomend_watch: 'Рекомендуємо подивитись',
      title_new_episodes: 'Нові серії',
      title_popular: 'Популярне',
      title_popular_movie: 'Популярні фільми',
      title_popular_tv: 'Популярні серіали',
      title_new_this_year: 'Новинки цього року',
      title_hight_voite: 'З високим рейтингом',
      title_new: 'Новинки',
      title_trend_day: 'Сьогодні у тренді',
      title_trend_week: 'У тренді за тиждень',
      title_upcoming: 'Дивіться у кінозалах',
      title_top_movie: 'Топ фільми',
      title_top_tv: 'Топ серіали',
      title_tv_today: 'Сьогодні в ефірі',
      title_this_week: 'На цьому тижні',
      title_in_top: 'У топі',
      title_out: 'Вихід',
      title_out_confirm: 'Так, вийти',
      title_continue_two: 'Продовжити',
      title_choice_language: 'Вибрати мову',
      title_subscribe: 'Підписатися',
      title_subscribes: 'Підписки',
      title_unsubscribe: 'Відписатися',
      title_language: 'Мова оригіналу',
      subscribe_success: 'Ви успішно підписалися',
      subscribe_error: 'Виникла помилка під час передплати, спробуйте пізніше',
      subscribe_noinfo: 'Не вдалося отримати інформацію, спробуйте пізніше',
      company_headquarters: 'Штаб',
      company_homepage: 'Сайт',
      company_country: 'Країна',
      country_al: 'Албанія',
      country_az: 'Азербайджан',
      country_bg: 'Болгарія',
      country_by: 'Білорусь',
      country_cn: 'Китай',
      country_cz: 'Чеська Республіка',
      country_de: 'Німеччина',
      country_dk: 'Данія',
      country_ee: 'Естонія',
      country_es: 'Іспанія',
      country_fi: 'Фінляндія',
      country_fr: 'Франція',
      country_ge: 'Грузія',
      country_hr: 'Хорватія',
      country_ie: 'Ірландія',
      country_it: 'Італія',
      country_jp: 'Японія',
      country_kr: 'Корея',
      country_kz: 'Казахстан',
      country_lv: 'Латвія',
      country_ne: 'Непал',
      country_no: 'Норвегія',
      country_pl: 'Польща',
      country_ro: 'Румунія',
      country_rs: 'Сербія',
      country_ru: 'Росія',
      country_se: 'Швеція',
      country_si: 'Словенія',
      country_sk: 'Словаччина',
      country_tj: 'Таджикистан',
      country_tr: 'Туреччина',
      country_ua: 'Україна',
      country_us: 'США',
      country_uz: 'Узбекистан',
      filter_clarify: 'Уточнити',
      filter_clarify_two: 'Уточнити пошук',
      filter_set_name: 'Вказати назву',
      filter_sorted: 'Сортувати',
      filter_filtred: 'Фільтр',
      filter_any: 'Будь-який',
      filter_combinations: 'Комбінації',
      filter_alt_names: 'Інші назви',
      filter_rating_from: 'від',
      filter_rating_to: 'до',
      filter_lang_af: 'Африкаанс',
      filter_lang_ar: 'Арабська',
      filter_lang_az: 'Азербайджанська',
      filter_lang_ba: 'Башкирська',
      filter_lang_be: 'Білоруська',
      filter_lang_bg: 'Болгарська',
      filter_lang_bn: 'Бенгальська',
      filter_lang_bs: 'Боснійська',
      filter_lang_ca: 'Каталанська',
      filter_lang_ce: 'Чеченська',
      filter_lang_cs: 'Чеська',
      filter_lang_da: 'Дацька',
      filter_lang_de: 'Німецька',
      filter_lang_el: 'Грецька',
      filter_lang_en: 'Англійська',
      filter_lang_es: 'Іспанська',
      filter_lang_et: 'Естонська',
      filter_lang_fa: 'Персидська',
      filter_lang_fi: 'Фінська',
      filter_lang_fr: 'Французька',
      filter_lang_ga: 'Ірландська',
      filter_lang_gl: 'Галісійська',
      filter_lang_gn: 'Гуарані',
      filter_lang_he: 'Іврит',
      filter_lang_hi: 'Хінді',
      filter_lang_hr: 'Хорватська',
      filter_lang_hu: 'Угорська',
      filter_lang_hy: 'Вірменська',
      filter_lang_id: 'Індонезійська',
      filter_lang_is: 'Ісландська',
      filter_lang_it: 'Італійська',
      filter_lang_ja: 'Японська',
      filter_lang_ka: 'Грузинська',
      filter_lang_kk: 'Казахська',
      filter_lang_ko: 'Корейська',
      filter_lang_ks: 'Кашмірі',
      filter_lang_ku: 'Курдська',
      filter_lang_ky: 'Киргизька',
      filter_lang_lt: 'Литовська',
      filter_lang_lv: 'Латишська',
      filter_lang_mi: 'Маорі',
      filter_lang_mk: 'Македонська',
      filter_lang_mn: 'Монгольська',
      filter_lang_mo: 'Молдовська',
      filter_lang_mt: 'Мальтійська',
      filter_lang_ne: 'Непальська',
      filter_lang_nl: 'Нідерландська',
      filter_lang_no: 'Норвезька',
      filter_lang_pa: 'Пенджабська',
      filter_lang_pl: 'Польська',
      filter_lang_ps: 'Пушту',
      filter_lang_pt: 'Португальська',
      filter_lang_ro: 'Румунська',
      filter_lang_ru: 'Російська',
      filter_lang_si: 'Сінгальська',
      filter_lang_sk: 'Словацька',
      filter_lang_sl: 'Словенська',
      filter_lang_sm: 'Самоанська',
      filter_lang_so: 'Сомалійська',
      filter_lang_sq: 'Албанська',
      filter_lang_sr: 'Сербська',
      filter_lang_sv: 'Шведська',
      filter_lang_sw: 'Суахілі',
      filter_lang_ta: 'Тамільська',
      filter_lang_tg: 'Таджицька',
      filter_lang_th: 'Тайська',
      filter_lang_tk: 'Туркменська',
      filter_lang_tr: 'Турецька',
      filter_lang_tt: 'Татарська',
      filter_lang_ur: 'Урду',
      filter_lang_uk: 'Українська',
      filter_lang_uz: 'Узбецька',
      filter_lang_vi: 'В\'єтнамська',
      filter_lang_yi: 'Ідиш',
      filter_lang_zh: 'Китайська',
      filter_genre_ac: 'Бойовик',
      filter_genre_ad: 'Пригоди',
      filter_genre_mv: 'Мультфільм',
      filter_genre_cm: 'Комедія',
      filter_genre_cr: 'Кримінал',
      filter_genre_dc: 'Документальний',
      filter_genre_dr: 'Драма',
      filter_genre_fm: 'Сімейний',
      filter_genre_fe: 'Фентезі',
      filter_genre_hi: 'Історія',
      filter_genre_ho: 'Жахи',
      filter_genre_mu: 'Музика',
      filter_genre_de: 'Детектив',
      filter_genre_md: 'Мелодрама',
      filter_genre_fa: 'Фантастика',
      filter_genre_tv: 'Телевізійний фільм',
      filter_genre_tr: 'Трилер',
      filter_genre_mi: 'Військовий',
      filter_genre_ve: 'Вестерн',
      filter_genre_aa: 'Бойовик та Пригоди',
      filter_genre_ch: 'Дитячий',
      filter_genre_nw: 'Новини',
      filter_genre_rs: 'Реаліті шоу',
      filter_genre_hf: 'НФ та Фентезі',
      filter_genre_op: 'Мильна опера',
      filter_genre_tc: 'Ток шоу',
      filter_genre_mp: 'Війна та Політика',
      empty_title: 'Пусто',
      empty_text: 'За вашим фільтром нічого не знайшлося, уточніть фільтр.',
      empty_title_two: 'Тут порожньо',
      empty_text_two: 'На даний момент список порожній',
      menu_main: 'Головна',
      menu_movies: 'Фільми',
      menu_tv: 'Серіали',
      menu_catalog: 'Каталог',
      menu_filter: 'Фільтр',
      menu_collections: 'Добірки',
      menu_relises: 'Релізи',
      menu_anime: 'Аніме',
      menu_bookmark: 'Закладки',
      menu_like: 'Подобається',
      menu_time: 'Пізніше',
      menu_history: 'Історія',
      menu_timeline: 'Розклад',
      menu_torrents: 'Торренти',
      menu_settings: 'Налаштування',
      menu_about: 'Інформація',
      menu_console: 'Консоль',
      menu_multmovie: 'Мультфільми',
      menu_multtv: 'Мультсеріали',
      plugins_catalog_work: 'Робочі плагіни',
      plugins_catalog_work_descr: 'Плагіни, які точно працюють у лампі.',
      plugins_catalog_popular: 'Популярні плагіни серед користувачів',
      plugins_catalog_popular_descr: 'Встановлення з невідомих джерел може призвести до некоректної роботи програми.',
      plugins_online: 'Перегляд онлайн',
      plugins_check_fail: 'Не вдалося перевірити працездатність плагіна. Однак це не означає, що плагін не працює. Перезавантажте програму для з\'ясування, чи завантажується плагін.',
      plugins_need_reload: 'Для застосування плагіна необхідно перезавантажити програму',
      plugins_install: 'Встановити',
      plugins_install_ready: 'Цей плагін вже встановлено.',
      plugins_installed: 'Установок',
      plugins_load_from: 'Завантажено із CUB',
      plugins_ok_for_check: 'Натисніть (OK), щоб перевірити плагін',
      plugins_no_loaded: 'При завантаженні програми частина плагінів не вдалося завантажити',
      time_viewed: 'Переглянуто',
      time_from: 'з',
      time_reset: 'Скинути тайм-код',
      settings_clear_cache: 'Кеш та дані очищені',
      settings_user_links: 'Користувальницьке посилання',
      settings_for_local: 'Для локального TorrServer',
      settings_add: 'Додати',
      settings_remove: 'Вилучити',
      settings_this_value: 'поточне значення',
      settings_added: 'Додано',
      settings_removed: 'Вилучено',
      settings_param_player_inner: 'Вбудований',
      settings_param_player_outside: 'Зовнішній',
      settings_param_yes: 'Так',
      settings_param_no: 'Ні',
      settings_param_interface_size_small: 'Менше',
      settings_param_interface_size_normal: 'Нормальний',
      settings_param_interface_size_bigger: 'Більше',
      settings_param_poster_quality_low: 'Низьке',
      settings_param_poster_quality_average: 'Середнє',
      settings_param_poster_quality_high: 'Висока',
      settings_param_parse_directly: 'Безпосередньо',
      settings_param_parse_api: 'Через API сайту',
      settings_param_background_complex: 'Складний',
      settings_param_background_simple: 'Простий',
      settings_param_background_image: 'Картинка',
      settings_param_link_use_one: 'Основну',
      settings_param_link_use_two: 'Додаткову',
      settings_param_subtitles_size_small: 'Маленькі',
      settings_param_subtitles_size_normal: 'Звичайні',
      settings_param_subtitles_size_bigger: 'Великі',
      settings_param_screensaver_nature: 'Природа',
      settings_param_torrent_lang_orig: 'Оригінал',
      settings_param_torrent_lang_ru: 'Русский',
      settings_param_player_timecode_again: 'Почати спочатку',
      settings_param_player_timecode_continue: 'Продовжити',
      settings_param_player_timecode_ask: 'Запитувати',
      settings_param_player_scale_method: 'Розрахувати',
      settings_param_player_hls_app: 'Системний',
      settings_param_player_hls_js: 'Програмний',
      settings_param_card_view_load: 'Підвантажувати',
      settings_param_card_view_all: 'Показати все',
      settings_param_navigation_remote: 'Пульт',
      settings_param_navigation_mouse: 'Пульт з мишкою',
      settings_param_keyboard_lampa: 'Вбудована',
      settings_param_keyboard_system: 'Системна',
      helper_keyboard: 'Після введення значення натисніть кнопку «Назад», щоб зберегти',
      helper_torrents: 'Утримуйте клавішу (OK), щоб викликати контекстне меню',
      helper_cleared: 'Успішно підказки будуть показані заново.',
      helper_torrents_view: 'Щоб скинути тайм-код та виклик меню, утримуйте (OK).',
      fav_sync_title: 'Синхронізація закладок',
      fav_sync_text: 'Ваші улюблені закладки разом із Вами. Підключіть синхронізацію та переглядайте на будь-якому пристрої. <br><br>Для цього зареєструйтесь на сайті www.cub.watch, створіть профіль та авторизуйтесь у додаток.',
      fav_sync_site: 'Сайт',
      fav_remove_title: 'Видалити з історії',
      fav_remove_descr: 'Видалити виділену картку',
      fav_clear_title: 'Очистити історію',
      fav_clear_descr: 'Видалити всі картки з історії',
      fav_clear_label_title: 'Очистити мітки',
      fav_clear_label_descr: 'Очистити мітки про перегляд',
      fav_clear_time_title: 'Очистити тайм-коди',
      fav_clear_time_descr: 'Очистити всі тайм-коди',
      fav_label_cleared: 'Відмітки очищені',
      fav_time_cleared: 'Тайм-коди очищені',
      timetable_empty: 'У цьому розділі відображатимуться дати виходу нових серій',
      player_quality: 'Якість',
      player_tracks: 'Аудіодоріжки',
      player_disabled: 'Вимкнено',
      player_unknown: 'Невідомо',
      player_subs: 'Субтитри',
      player_size_default_title: 'За замовчуванням',
      player_size_default_descr: 'Розмір відео за замовчуванням',
      player_size_cover_title: 'Розширити',
      player_size_cover_descr: 'Розширює відео на весь екран',
      player_size_fill_title: 'Заповнити',
      player_size_fill_descr: 'Помістити відео на весь екран',
      player_size_s115_title: 'Збільшити 115%',
      player_size_s115_descr: 'Збільшити відео на 115%',
      player_size_s130_title: 'Збільшити 130%',
      player_size_s130_descr: 'Збільшити відео на 130%',
      player_size_v115_title: 'По вертикалі 115%',
      player_size_v115_descr: 'Збільшити відео на 115%',
      player_size_v130_title: 'По вертикалі 130%',
      player_size_v130_descr: 'Збільшити відео на 130%',
      player_video_size: 'Розмір відео',
      player_playlist: 'Плейлист',
      player_error_one: 'Не вдалося декодувати відео',
      player_error_two: 'Відео не знайдено або пошкоджено',
      player_start_from: 'Продовжити перегляд з',
      player_not_found: 'Плеєр не знайдено',
      player_lauch: 'Запустити плеєр',
      player_speed_default_title: 'Звичайна',
      player_speed_two_descr: 'Відтворення без звуку',
      player_video_speed: 'Швидкість відтворення',
      player_share_title: 'Поділиться',
      player_share_descr: 'Запустити це відео на іншому пристрої',
      player_normalization_power_title: 'Сила нормалізації',
      player_normalization_smooth_title: 'Швидкість нормалізації',
      player_normalization_step_low: 'Низьке',
      player_normalization_step_medium: 'Середнє',
      player_normalization_step_hight: 'Висока',
      player_youtube_no_played: 'На жаль, це відео не доступне у вашому регіоні, можливо, воно було заблоковане або видалено.',
      player_youtube_start_play: 'Для початку відтворення відео, натисніть кнопку "Плей"',
      broadcast_open: 'Відкрити картку на іншому пристрої',
      broadcast_play: 'Виберіть пристрій, на якому дивитися',
      card_new_episode: 'Нова серія',
      card_book_remove: 'Прибрати із закладок',
      card_book_add: 'В закладки',
      card_book_descr: 'Дивіться у меню (Закладки)',
      card_like_remove: 'Прибрати з уподобаних',
      card_like_add: 'Подобається',
      card_like_descr: 'Дивіться у меню (Подобається)',
      card_wath_remove: 'Прибрати з очікуваних',
      card_wath_add: 'Дивитися пізніше',
      card_wath_descr: 'Дивіться в меню (Пізніше)',
      card_history_remove: 'Прибрати з історії',
      card_history_add: 'Додати в історію',
      card_history_descr: 'Дивіться у меню (Історія)',
      keyboard_listen: 'Кажіть, я слухаю...',
      keyboard_nomic: 'Немає доступу до мікрофону',
      notice_new_quality: 'Доступна нова якість',
      notice_quality: 'Якість',
      notice_new_episode: 'Нова серія',
      notice_none: 'У вас ще немає жодних повідомлень, зареєструйтесь на сайті <b>www.cub.watch</b>, щоб стежити за новими серіями та релізами.',
      notice_in_quality: 'В якості',
      copy_link: 'Копіювати посилання на відео',
      copy_secuses: 'Посилання скопійоване в буфер обміну',
      copy_error: 'Помилка під час копіювання посилання',
      account_sync_to_profile: 'Усі закладки будуть перенесені до профілю',
      account_sync_secuses: 'Усі закладки успішно перенесені',
      account_profiles: 'Профілі',
      account_profiles_empty: 'Неможливо отримати список профілів',
      account_authorized: 'Авторизовані',
      account_logged_in: 'Ви увійшли під обліковий запис',
      account_login_failed: 'Вхід не виконано',
      account_login_wait: 'Очікуємо входу до облікового запису',
      account_profile_main: 'Загальний',
      account_export_secuses: 'Експорт успішно завершено',
      account_export_fail: 'Помилка під час експорту',
      account_import_secuses: 'Імпорт успішно завершено',
      account_import_fail: 'Помилка при імпорті',
      account_imported: 'імпортовано',
      account_reload_after: 'перезавантаження через 5 с.',
      account_create: 'Відкрийте більше можливостей з облікового запису CUB. Зареєструйтесь на сайті <span class="account-modal__site">www.cub.watch</span> та отримайте доступ до синхронізації ваших закладок, тайм-кодів та інших можливостей облікового запису CUB.',
      account_premium: 'Розкрийте нові горизонти з обліковим записом CUB Premium! Насолоджуйтесь збільшеними лімітами та збагаченим функціоналом сервісу. Додаткові можливості чекають на вас вже сьогодні!',
      account_premium_more: 'Докладніше про CUB Premium',
      account_limited: 'Ви досягли максимального ліміту. Збільште ліміт з обліковим записом CUB Premium. Докладніше на сайті <span class="account-modal__site">www.cub.watch/premium</span>',
      account_premium_include_1: 'Збільшення кількості закладок',
      account_premium_include_2: 'Збільшення історії переглядів',
      account_premium_include_3: 'Збільшення кількості тайм-кодів',
      account_premium_include_4: 'Кількість профілів на обліковий запис',
      account_premium_include_5: 'Повідомлення',
      account_premium_include_6: 'Синхронізація даних',
      account_premium_include_text_1: 'Більше закладок – більше можливостей! Зберігайте свої улюблені фільми та серіали, створюйте списки перегляду та насолоджуйтесь переглядом у будь-який зручний час.',
      account_premium_include_text_2: 'Збільште історію переглядів у програмі та стежте за тим, що вже подивилися. Легко знаходите та переглядайте свої улюблені фільми та серіали.',
      account_premium_include_text_3: 'Не бійтеся пропустити жодну важливу сцену! Збільште кількість тайм-кодів у додатку та легко відстежуйте, де зупинилися у перегляді улюблених фільмів та серіалів.',
      account_premium_include_text_4: 'Отримайте більше свободи з нашим преміум-доступом! Збільште кількість профілів на обліковому записі та дозвольте своїм друзям та близьким насолоджуватися фільмами та серіалами разом з вами. Жодних обмежень - насолоджуйтесь переглядом з коханими людьми.',
      account_premium_include_text_5: 'Не пропустіть жодної нової серії чи перекладу! Отримуйте сповіщення вчасно та будьте в курсі всіх оновлень. Збільште свій кінопотік разом з нами та отримуйте повідомлення про вихід нових серій та перекладів прямо на свій смартфон.',
      account_premium_include_text_6: 'Синхронізуйте дані між пристроями з преміум-доступом! Більше не потрібно гаяти час на пошук останнього епізоду, на якому ви зупинилися. З нашим преміум доступом ви можете синхронізувати свої дані між пристроями, щоб продовжувати перегляд з місця, де ви зупинилися, на будь-якому пристрої, де встановлено програму.',
      account_code_enter: 'Введіть шестизначний код',
      account_code_error: 'Можливо, ви ввели невірний або застарілий код',
      account_code_wrong: 'Можливо, ви вказали неправильний формат',
      account_code_where: 'Перейдіть на сайт <span class="account-add-device__site">cub.watch/add</span> та введіть вказаний там код.',
      account_code_input: 'Ввести код',
      settings_cub_signin_button: 'Увійти',
      network_noconnect: 'Немає підключення до мережі',
      network_404: 'Запрошеної сторінки не знайдено. [404]',
      network_401: 'Авторизація не вдалася',
      network_500: 'Внутрішня помилка сервера. [500]',
      network_parsererror: 'Запитаний синтаксичний аналіз JSON завершився невдало.',
      network_timeout: 'Час запиту минув.',
      network_abort: 'Запит було перервано.',
      network_error: 'Невідома помилка',
      size_zero: '0 Байт',
      size_byte: 'Байт',
      size_kb: 'КБ',
      size_mb: 'МБ',
      size_gb: 'ГБ',
      size_tb: 'ТБ',
      size_pp: 'ПБ',
      speed_bit: 'біт',
      speed_kb: 'Кбіт',
      speed_mb: 'Мбіт',
      speed_gb: 'Гбіт',
      speed_tb: 'Тбіт',
      speed_pp: 'Пбіт',
      month_1: 'Січень',
      month_2: 'Лютий',
      month_3: 'Березень',
      month_4: 'Квітень',
      month_5: 'Травень',
      month_6: 'Червень',
      month_7: 'Липня',
      month_8: 'Серпень',
      month_9: 'Вересень',
      month_10: 'Жовтень',
      month_11: 'Листопад',
      month_12: 'Грудень',
      day_1: 'Понеділок',
      day_2: 'Вівторок',
      day_3: 'Середа',
      day_4: 'Четвер',
      day_5: 'П\'ятниця',
      day_6: 'Субота',
      day_7: 'Неділя',
      month_1_e: 'Січня',
      month_2_e: 'Лютого',
      month_3_e: 'Березня',
      month_4_e: 'Квітня',
      month_5_e: 'Травня',
      month_6_e: 'Червня',
      month_7_e: 'Липня',
      month_8_e: 'Серпня',
      month_9_e: 'Вересня',
      month_10_e: 'Жовтня',
      month_11_e: 'Листопада',
      month_12_e: 'Грудня',
      week_1: 'Пн',
      week_2: 'Вт',
      week_3: 'Ср',
      week_4: 'Чт',
      week_5: 'Пт',
      week_6: 'Сб',
      week_7: 'Нд',
      notice_none_account: 'У вас ще немає жодних повідомлень, додайте серіали в закладки та чекайте на повідомлення про нові серії.',
      notice_none_system: 'На даний момент у вас відсутні повідомлення. Ми обов\'язково повідомимо вас, коли з\'являться нові повідомлення.',
      torrent_parser_no_responce: 'Парсер не відповідає на запит',
      extensions_enable: 'Увімкнути',
      extensions_disable: 'Вимкнути',
      extensions_check: 'Перевірити статус',
      extensions_install: 'Встановити',
      extensions_info: 'Інформація',
      extensions_edit: 'Редагувати',
      extensions_change_name: 'Змінити назву',
      extensions_change_link: 'Змінити посилання',
      extensions_remove: 'Вилучити',
      extensions_set_name: 'Введіть назву плагіна',
      extensions_set_url: 'Введіть адресу плагіна',
      extensions_ready: 'Цей плагін вже встановлено',
      extensions_no_info: 'Без інформації',
      extensions_no_name: 'Без назви',
      extensions_worked: 'Робочий',
      extensions_no_plugin: 'Плагін не підтверджений',
      extensions_add: 'Додати плагін',
      extensions_from_memory: 'Встановлені в пам\'ять',
      extensions_from_cub: 'Встановлені з CUB',
      extensions_from_popular: 'Популярні плагіни',
      extensions_from_lib: 'Бібліотека плагінів',
      extensions_from_connected: 'Підключені плагіни',
      settings_webos_launcher: 'Запуск програми',
      settings_webos_launcher_add_device: 'Встановити як стартове',
      settings_webos_launcher_remove_device: 'Прибрати зі стартових додатків',
      player_normalization: 'Нормалізація',
      change_source_on_cub: 'Змінити джерело на CUB',
      settings_param_jackett_interview_all: 'Всі',
      settings_param_jackett_interview_healthy: 'Тільки доступні',
      settings_parser_jackett_interview: 'Опитувати трекери',
      title_ongoing: 'Онгоїнги',
      title_pgrating: 'Вікове обмеження',
      settings_interface_card_interfice: 'Інтерфейс карток',
      settings_interface_card_poster: 'Показати постер',
      title_card: 'Картка',
      settings_param_card_interface_old: 'Старий',
      settings_param_card_interface_new: 'Новий',
      title_seasons: 'Сезони',
      title_episodes: 'Серії',
      title_rewiews: 'Відгуки',
      settings_interface_glass: 'Скло',
      settings_interface_glass_descr: 'Показувати інтерфейс у склоподібному стилі',
      settings_interface_black_style: 'Чорний стиль',
      plugins_remove: 'Видалити плагіни',
      settings_reset: 'Скидання налаштувань',
      title_channel: 'Канал',
      input_detection_touch: 'Бажаєте переключити на сенсорне керування?',
      input_detection_mouse: 'Бажаєте переключити на керування мишею?',
      input_detection_remote: 'Бажаєте переключити на керування пультом?',
      settings_interface_hide_outside_the_screen: 'Приховувати картки поза екраном',
      settings_interface_hide_outside_the_screen_descr: 'Це прискорить рендер інтерфейсу та покращить продуктивність',
      https_text: 'Використовуйте протокол HTTPS, в цьому протоколі лампа працює некоректно. Для коректної роботи лампи використовуйте адресу з протоколом HTTP',
      extensions_hpu_best: 'Популярні',
      extensions_hpu_recomend: 'Рекомендуємо',
      extensions_hpu_theme: 'Теми',
      extensions_hpu_screensaver: 'Скрінсейвер',
      extensions_hpu_video: 'Відео',
      extensions_hpu_control: 'Управління',
      extensions_hpu_other: 'Різне',
      extensions_hpu_: 'Решта',
      title_author: 'Автор',
      title_buffer: 'Буфер',
      settings_rest_screensaver_time: 'Через скільки хвилин запустити скрінсейвер',
      time_h: 'г.',
      time_m: 'х.',
      time_s: 'с.',
      settings_param_glass_easy: 'Прозора',
      settings_param_glass_medium: 'Напівпрозора',
      settings_param_glass_blacked: 'Затемнена',
      settings_interface_glass_opacity: 'Прозорість скла',
      torrent_error_check_no_auth: 'Сервер відповів на запит, але не вдалося пройти авторизацію',
      settings_interface_card_cover: 'Показати обкладинку',
      title_upcoming_episodes: 'Найближчі виходи епізодів',
      settings_rest_cache_images: 'Кеш зображень',
      settings_rest_cache_images_descr: 'Кешувати постери та фони у локальне сховище',
      settings_player_rewind_title: 'Перемотування',
      settings_player_rewind_descr: 'Інтервал перемотування за секунди',
      speedtest_connect: 'підключення',
      speedtest_test: 'тестування',
      speedtest_ready: 'готово',
      speedtest_button: 'Тестувати швидкість'
    };

    var be = {
      lang_choice_title: 'Сардэчна запрашаем',
      lang_choice_subtitle: 'Выберыце сваю мову',
      more: 'Яшчэ',
      show_more: 'Паказаць яшчэ',
      more_results: 'Паказаць больш вынікаў',
      loading: 'Загрузка',
      nofind_movie: 'Не атрымалася знайсці фільм.',
      noname: 'Без назвы',
      nochoice: 'Не абрана',
      cancel: 'Адмяніць',
      confirm: 'Сцвярджаю',
      sure: 'Вы ўпэўненыя?',
      nodata: 'Няма дадзеных',
      back: 'Назад',
      ready: 'Гатова',
      search: 'Пошук',
      search_input: 'Увядзіце тэкст',
      search_empty: 'Гісторыя пошуку пустая.',
      search_delete: 'Налева - выдаліць',
      search_start_typing: 'Пачніце ўводзіць тэкст для пошуку.',
      search_searching: 'Ідзе пошук...',
      search_start: 'Пачаць пошук',
      search_nofound: 'Па вашым запыце нічога не знойдзена.',
      full_genre: 'Жанр',
      full_production: 'Вытворчасць',
      full_date_of_release: 'Дата рэлізу',
      full_budget: 'Бюджэт',
      full_countries: 'Краіны',
      full_like: 'Падабаецца',
      full_torrents: 'Торэнты',
      full_trailers: 'Трэйлеры',
      full_detail: 'Падрабязна',
      full_notext: 'Без апісання.',
      full_series_release: 'Выхад серый',
      full_next_episode: 'Наступная',
      full_episode_days_left: 'Засталося дзён',
      full_trailer_official: 'Афіцыйны',
      full_trailer_no_official: 'Неафіцыйны',
      full_season: 'Сезон',
      full_episode: 'Эпізод',
      full_directing: 'Рэжысура',
      settings_cub_sync: 'Сінхранізацыя',
      settings_cub_sync_descr: 'Сінхранізацыя з сэрвісам CUB: сінхранізацыя вашых закладак, гісторыі праглядаў, пазнак і тайм-кодаў. Сайт: www.cub.watch',
      settings_cub_account: 'Акаўнт',
      settings_cub_logged_in_as: 'Увайшлі як',
      settings_cub_profile: 'Профіль',
      settings_cub_sync_btn: 'Сінхранізаваць',
      settings_cub_sync_btn_descr: 'Захаваць лакальныя закладкі ў рахунак CUB',
      settings_cub_backup: 'Бэкап',
      settings_cub_backup_descr: 'Захаваць або загрузіць бэкап дадзеных',
      settings_cub_logout: 'Выйсці з акаўнта',
      settings_cub_signin: 'аўтарызацыя',
      settings_cub_not_specified: 'Не паказаны',
      settings_cub_password: 'Пароль',
      settings_cub_status: 'Статус',
      settings_cub_backup_import: 'Імпарт',
      settings_cub_backup_export: 'Экспарт',
      settings_cub_sync_filters: 'Сінхранізацыя фільтраў',
      settings_cub_sync_calendar: 'Сінхранізацыя календара',
      settings_cub_sync_quality: 'Сінхранізацыя адзнак (якасць)',
      settings_cub_sync_search: 'Сінхранізацыя гісторыі пошуку',
      settings_cub_sync_recomends: 'Сінхранізацыя рэкамендацый',
      settings_cub_sync_timecodes: 'Сінхранізацыя тайм-кодаў',
      settings_input_links: 'Выбранае',
      settings_interface_type: 'Аблегчаная версія',
      settings_interface_size: 'Памер інтэрфейсу',
      settings_interface_background: 'Фон',
      settings_interface_background_use: 'Паказваць фон',
      settings_interface_background_type: 'Тып фону',
      settings_interface_performance: 'Хуткадзейнасць',
      settings_interface_animation: 'Анімацыя',
      settings_interface_animation_descr: 'Анімацыя картак і кантэнту',
      settings_interface_attenuation: 'Згасанне',
      settings_interface_attenuation_descr: 'Плыўнае згасанне картак знізу і зверху',
      settings_interface_scroll: 'Тып скролінга',
      settings_interface_view_card: 'Тып прагляду картак',
      settings_interface_view_card_descr: 'Па меры скралінга стужкі карткі будуць падгружацца паступова або загружацца ўсё',
      settings_interface_lang: 'Мова інтэрфейсу',
      settings_interface_lang_reload: 'Неабходна перазагрузіць дадатак, націсніце "OK" для перазагрузкі.',
      settings_main_account: 'Акаўнт',
      settings_main_interface: 'Інтэрфейс',
      settings_main_player: 'Плэер',
      settings_main_parser: 'Парсер',
      settings_main_torrserver: 'TorrServer',
      settings_main_plugins: 'Пашырэння',
      settings_main_rest: 'Астатняе',
      settings_rest_start: 'Стартавая старонка',
      settings_rest_start_descr: 'З якой старонкі пачынаць пры запуску',
      settings_rest_source: 'Крыніца',
      settings_rest_source_use: 'Асноўная крыніца',
      settings_rest_source_descr: 'Адкуль браць інфармацыю пра фільмы',
      settings_rest_tmdb_lang: 'На якой мове адлюстроўваць дадзеныя з TMDB',
      settings_rest_tmdb_prox: 'Праксіраваць TMDB',
      settings_rest_tmdb_prox_auto: 'Уключыць проксі аўтаматычна',
      settings_rest_tmdb_posters: 'Разрозненне постэраў TMDB',
      settings_rest_screensaver: 'Скрынсэйвер',
      settings_rest_screensaver_use: 'Паказваць застаўку пры бяздзейнасці',
      settings_rest_screensaver_type: 'Тып застаўкі',
      settings_rest_helper: 'Падказкі',
      settings_rest_helper_use: 'Паказваць падказкі',
      settings_rest_helper_reset: 'Паказаць падказкі зноў',
      settings_rest_pages: 'Колькі старонак захоўваць у памяці',
      settings_rest_pages_descr: 'Захоўвае старонкі ў тым стане, у якім вы іх пакінулі',
      settings_rest_time: 'Зрушыць час',
      settings_rest_navigation: 'Тып навігацыі',
      settings_rest_keyboard: 'Тып клавіятуры',
      settings_rest_device: 'Назва прылады',
      settings_rest_device_placeholder: 'Напрыклад: Мая Лямпа',
      settings_rest_cache: 'Ачысціць кэш',
      settings_rest_cache_descr: 'Будуць ачышчаны ўсе налады і дадзеныя',
      settings_rest_tmdb_example: 'Напрыклад:',
      settings_rest_tmdb_api_descr: 'Для атрымання дадзеных',
      settings_rest_tmdb_image_descr: 'Для атрымання малюнкаў',
      settings_rest_card_quality: 'Адзнакі якасці',
      settings_rest_card_quality_descr: 'Адлюстроўваць адзнакі якасці на картках',
      settings_rest_card_episodes: 'Адзнакі эпізодаў',
      settings_rest_card_episodes_descr: 'Адлюстроўваць адзнакі эпізодаў на картках',
      settings_parser_use: 'Выкарыстоўваць парсер',
      settings_parser_use_descr: 'Тым самым, вы згаджаецеся прыняць на сябе ўсю адказнасць за выкарыстанне публічных спасылак для прагляду торэнт і анлайн кантэнту.',
      settings_parser_type: 'Тып парсера для торэнтаў',
      settings_parser_jackett_placeholder: 'Напрыклад: 192.168.х',
      settings_parser_jackett_link: 'спасылка',
      settings_parser_jackett_link_descr: 'Укажыце спасылку на скрыпт Jackett',
      settings_parser_jackett_key_placeholder: 'Напрыклад: sa0sk83d..',
      settings_parser_jackett_key: 'Api ключ',
      settings_parser_jackett_key_descr: 'Знаходзіцца ў Jackett',
      settings_parser_torlook_type: 'Метад парсінгу сайта TorLook',
      settings_parser_scraperapi_placeholder: 'Напрыклад: scraperapi.com',
      settings_parser_scraperapi_link: 'Спасылка на парсер сайтаў',
      settings_parser_scraperapi_descr: 'Зарэгіструйцеся на сайце scraperapi.com, увядзіце спасылку api.scraperapi.com?api_key=...&url={q}<br>У {q} будзе пастаўляцца сайт w41.torlook.info',
      settings_parser_search: 'Пошук',
      settings_parser_search_descr: 'На якой мове рабіць пошук?',
      settings_parser_in_search: 'Парсер у пошуку',
      settings_parser_in_search_descr: 'Паказваць вынікі ў пошуку?',
      settings_parser_timeout_title: 'Таймаўт парсера',
      settings_parser_timeout_descr: 'Час у секундах, які будзе чакацца адказу ад сервера',
      settings_player_type: 'Тып плэера',
      settings_player_type_descr: 'Якім плэерам прайграваць',
      settings_player_iptv_type: 'Тып плэера для IPTV',
      settings_player_iptv_type_descr: 'Якім плэерам прайграваць IPTV каналы',
      settings_player_reset: 'Скінуць плэер па змаўчанні',
      settings_player_reset_descr: 'Скідае абраны Android плэер у дадатку',
      settings_player_path: 'Шлях да плэера',
      settings_player_path_descr: 'Укажыце шлях да плэера .exe',
      settings_player_normalization: 'Нармалізацыя гуку',
      settings_player_normalization_descr: 'Нармалізуе гук у адзін узровень, паніжае гучныя гукі і павялічвае ціхія.',
      settings_player_next_episode: 'Наступная серыя',
      settings_player_next_episode_descr: 'Аўтаматычна пераключаць на наступную серыю пасля заканчэння бягучай',
      settings_player_timecode: 'Тайм-код',
      settings_player_timecode_descr: 'Працягнуць з апошняга месца прагляду',
      settings_player_scale: 'Метад маштабавання',
      settings_player_scale_descr: 'Якім чынам рабіць вылічэнні для маштабавання відэа',
      settings_player_subs: 'Субтытры',
      settings_player_subs_use: 'Уключыць',
      settings_player_subs_use_descr: 'Заўсёды ўключаць субтытры пасля запуску відэа',
      settings_player_subs_size: 'Памер',
      settings_player_subs_size_descr: 'Памер субтытраў на экране',
      settings_player_subs_stroke_use: 'Выкарыстоўваць акантоўку',
      settings_player_subs_stroke_use_descr: 'Субтытры будуць абведзены чорным колерам для паляпшэння чытальнасці',
      settings_player_subs_backdrop_use: 'Выкарыстоўваць падкладку',
      settings_player_subs_backdrop_use_descr: 'Субтытры будуць адлюстроўвацца на напаўпразрыстай падкладцы для паляпшэння чытальнасці',
      settings_player_quality: 'Якасць відэа па змаўчанні',
      settings_player_quality_descr: 'Пераважная якасць відэа для прагляду',
      settings_player_hls_title: 'Апрацоўка патоку .m3u8',
      settings_player_hls_descr: 'Не чапайце гэты параметр калі не ведаеце навошта ён.',
      settings_plugins_notice: 'Для прымянення плагіна неабходна перазагрузіць дадатак',
      settings_plugins_add: 'Дадаць плагін',
      settings_plugins_add_descr: 'Для выдалення дададзенага плагіна ўтрымлівайце ці націсніце двойчы клавішу (OK) на ім',
      settings_plugins_install: 'Усталяваць плагін',
      settings_plugins_install_descr: 'Усталяваць плагін са спісу даступных',
      settings_server_link: 'Выкарыстоўваць спасылку',
      settings_server_links: 'Спасылкі',
      settings_server_placeholder: 'Напрыклад: 192.168.х',
      settings_server_link_one: 'Асноўная спасылка',
      settings_server_link_one_descr: 'Укажыце асноўную спасылку на скрыпт TorrServer',
      settings_server_link_two: 'Дадатковая спасылка',
      settings_server_link_two_descr: 'Укажыце дадатковую спасылку на скрыпт TorrServer',
      settings_server_additionally: 'Дадаткова',
      settings_server_client: 'Убудаваны кліент',
      settings_server_client_descr: 'Выкарыстоўваць убудаваны JS-кліент TorrServe, інакш запускаецца сістэмны.',
      settings_server_base: 'Захаваць у базу',
      settings_server_base_descr: 'Торэнт будзе дададзены ў базу TorrServer',
      settings_server_preload: 'Выкарыстоўваць буфер перад.загрузкі',
      settings_server_preload_descr: 'Чакаць запаўнення буфера папярэдняй загрузкі TorrServer перад прайграваннем',
      settings_server_auth: 'аўтарызацыя',
      settings_server_password_use: 'Уваход па паролі',
      settings_server_login: 'Лагін',
      settings_server_password: 'Пароль',
      settings_server_not_specified: 'Не паказаны',
      torent_nohash_reasons: 'Прычыны',
      torent_nohash_reason_one: 'TorServer не змог спампаваць торэнт файл',
      torent_nohash_reason_two: 'Адказ ад TorServer',
      torent_nohash_reason_three: 'Спасылка',
      torent_nohash_do: 'Што рабіць?',
      torent_nohash_do_one: 'Праверце ці правільна вы наладзілі Jackett',
      torent_nohash_do_two: 'Прыватныя крыніцы могуць не выдаваць спасылку на файл',
      torent_nohash_do_three: 'Пераканайцеся, што Jackett таксама можа спампаваць файл',
      torent_nohash_do_four: 'Напісаць у нашу тэлеграм групу: @lampa_group',
      torent_nohash_do_five: 'Пакажыце які фільм, якая раздача і па магчымасці фота гэтай раздачы',
      torrent_error_text: 'Немагчыма падлучыцца да TorrServe. Давайце хутка пройдземся па спісе магчымых праблем і ўсё праверым.',
      torrent_error_step_1: 'Ці запушчаны TorrServe',
      torrent_error_step_2: 'Дынамічны IP-адрас',
      torrent_error_step_3: 'Пратакол і порт',
      torrent_error_step_4: 'Блакіроўка антывірусамі',
      torrent_error_step_5: 'Праверце на даступнасць',
      torrent_error_step_6: 'Усё роўна не працуе',
      torrent_error_info_1: 'Упэўніцеся, што вы запусцілі TorrServe на прыладзе, дзе ён усталяваны.',
      torrent_error_info_2: 'Частая памылка, змяніўся IP-адрас прылады з TorrServe. Упэўніцеся, што IP-адрас, які вы ўвялі - {ip}, супадае з адрасам прылады, на якім усталяваны TorrServe.',
      torrent_error_info_3: 'Для падключэння да TorrServe, неабходна пазначыць пратакол http:// у пачатку і порт :8090 у канцы адрасу. Пераканайцеся, што пасля IP-адрасы паказаны порт, ваш бягучы адрас - {ip}',
      torrent_error_info_4: 'Частая з\'ява, антывірус ці брандмаўэр можа блакаваць доступ па IP-адрасу, паспрабуйце адключыць антывірус і брандмаўэр.',
      torrent_error_info_5: 'На любой іншай прыладзе ў гэтай жа сетцы, адкрыйце ў браўзэры адрас {ip} і праверце, ці даступны вэб-інтэрфейс TorrServe.',
      torrent_error_info_6: 'Калі пасля ўсіх праверак усё роўна ўзнікае памылка падлучэння, паспрабуйце перазагрузіць TorrServe і інтэрнэт-адаптар.',
      torrent_error_info_7: 'Калі праблема не ўхіленая, пішыце ў Telegram-групу @lampa_group з тэкстам (Lampa не падлучаецца да TorrServe пасля ўсіх праверак, бягучы адрас {ip})',
      torrent_error_start: 'Пачаць праверку',
      torrent_error_nomatrix: 'Не атрымалася пацвердзіць версію Matrix',
      torrent_error_made: 'Выканана',
      torrent_error_from: 'з',
      torrent_error_next: 'Далей',
      torrent_error_complite: 'Завяршыць',
      torrent_error_connect: 'Памылка падключэння',
      torrent_install_need: 'Неабходны TorrServe',
      torrent_install_text: 'TorrServe – дадатак, якое дазваляе праглядаць кантэнт з торэнт-файлаў у анлайн рэжыме.<br><br>Больш дэталёвую інфармацыю па ўстаноўцы вы знойдзеце ў Telegram-групах, указаных ніжэй.',
      torrent_install_contact: 'Telegram-групы',
      torrent_item_bitrate: 'Бітрэйт',
      torrent_item_seeds: 'Раздаюць',
      torrent_item_grabs: 'пампуюць',
      torrent_item_mb: 'Мбіт/с',
      torrent_serial_episode: 'Серыя',
      torrent_serial_season: 'Сезон',
      torrent_serial_date: 'Выхад',
      torrent_get_magnet: 'Запытваю magnet спасылку',
      torrent_remove_title: 'Выдаліць',
      torrent_remove_descr: 'Торэнт будзе выдалены з вашага спісу',
      torrent_parser_any_one: 'Любое',
      torrent_parser_any_two: 'Любы',
      torrent_parser_no_choice: 'Не абрана',
      torrent_parser_yes: 'Так',
      torrent_parser_no: 'Не',
      torrent_parser_quality: 'Якасць',
      torrent_parser_subs: 'Субтытры',
      torrent_parser_voice: 'Пераклад',
      torrent_parser_tracker: 'Трэкер',
      torrent_parser_year: 'Год',
      torrent_parser_season: 'Сезон',
      torrent_parser_sort_by_seeders: 'Па раздавальных',
      torrent_parser_sort_by_size: 'Па памеры',
      torrent_parser_sort_by_name: 'Па назве',
      torrent_parser_sort_by_tracker: 'Па крыніцы',
      torrent_parser_sort_by_date: 'Па даце',
      torrent_parser_sort_by_viewed: 'Па прагледжаным',
      torrent_parser_voice_dubbing: 'Дубляж',
      torrent_parser_voice_polyphonic: 'Шматгалосы',
      torrent_parser_voice_two: 'Двухгалосы',
      torrent_parser_voice_amateur: 'Любіцельскі',
      torrent_parser_reset: 'Скінуць фільтр',
      torrent_parser_empty: 'Немагчыма атрымаць вынікаў',
      torrent_parser_no_hash: 'Не атрымалася атрымаць HASH',
      torrent_parser_added_to_mytorrents: 'дададзена ў «Мае торэнты»',
      torrent_parser_add_to_mytorrents: 'Дадаць у «Мае торэнты»',
      torrent_parser_label_title: 'Пазначыць',
      torrent_parser_label_descr: 'Пазначыць раздачу са сцягам (прагледжана)',
      torrent_parser_label_cancel_title: 'Зняць адзнаку',
      torrent_parser_label_cancel_descr: 'Зняць адзнаку з раздачы (прагледжана)',
      torrent_parser_timeout: 'Час чакання скончыўся',
      torrent_parser_nofiles: 'Немагчыма атрымаць патрэбныя файлы',
      torrent_parser_set_link: 'Пазначце спасылку для парсінгу',
      torrent_parser_request_error: 'Памылка ў запыце',
      torrent_parser_magnet_error: 'Не ўдалося атрымаць magnet спасылку',
      torrent_parser_no_responce: 'Парсер не адказвае на запыт',
      torrent_parser_torlook_fallback_search_notification: 'Парсэр Jackett не даступны або налады падлучэння не дакладныя. Ажыццяўляецца пошук у Torlook...',
      about_text: 'Дадатак цалкам бясплатны і выкарыстоўвае публічныя спасылкі для атрымання інфармацыі пра відэа, навінкі, папулярныя фільмы і г.д. Уся даступная інфармацыя выкарыстоўваецца выключна ў пазнавальных мэтах, прыкладанне не выкарыстоўвае свае ўласныя серверы для распаўсюджвання інфармацыі.',
      about_channel: 'Наш канал',
      about_group: 'Група',
      about_version: 'Версія',
      about_donate: 'Данат',
      title_watched: 'Вы глядзелі',
      title_settings: 'Налады',
      title_collections: 'Падборкі',
      title_company: 'Кампанія',
      title_actors: 'Акцёры',
      title_actor: 'Акцёр',
      title_actress: 'Актрыса',
      title_person: 'Персона',
      title_comments: 'Каментары',
      title_torrents: 'Торэнты',
      title_trailers: 'Трэйлеры',
      title_watch: 'Глядзець',
      title_error: 'Памылка',
      title_links: 'Спасылкі',
      title_choice: 'Выбраць',
      title_main: 'Галоўная',
      title_book: 'Закладкі',
      title_like: 'Падабаецца',
      title_wath: 'Пазней',
      title_history: 'Гісторыя праглядаў',
      title_mytorrents: 'Мае торэнты',
      title_last: 'Апошняя',
      title_action: 'Дзеянне',
      title_producer: 'Рэжысёр',
      title_collection: 'Калекцыя',
      title_recomendations: 'Рэкамендацыі',
      title_similar: 'Падобныя',
      title_about: 'Пра прыкладанне',
      title_timetable: 'Расклад',
      title_relises: 'Лічбавыя рэлізы',
      title_catalog: 'Каталог',
      title_category: 'Катэгорыя',
      title_parser: 'Парсер',
      title_type: 'Тып',
      title_rating: 'Рэйтынг',
      title_country: 'Краіна',
      title_year: 'Год',
      title_genre: 'Жанр',
      title_filter: 'Фільтр',
      title_notice: 'Апавяшчэнні',
      title_files: 'Файлы',
      title_now_watch: 'Глядзяць зараз',
      title_latest: 'Апошняе даданне',
      title_continue: 'Працягнуць прагляд',
      title_recomend_watch: 'Рэкамендуем паглядзець',
      title_new_episodes: 'Новыя серыі',
      title_popular: 'Папулярнае',
      title_popular_movie: 'Папулярныя фільмы',
      title_popular_tv: 'Папулярныя серыялы',
      title_new_this_year: 'Навінкі гэтага года',
      title_hight_voite: 'З высокім рэйтынгам',
      title_new: 'Навінкі',
      title_trend_day: 'Сёння ў трэндзе',
      title_trend_week: 'У трэндзе за тыдзень',
      title_upcoming: 'Глядзіце ў кіназалах',
      title_top_movie: 'Топ фільмы',
      title_top_tv: 'Топ серыялы',
      title_tv_today: 'Сёння ў эфіры',
      title_this_week: 'На гэтым тыдні',
      title_in_top: 'У топе',
      title_out: 'Выхад',
      title_out_confirm: 'Так, выйсці',
      title_continue_two: 'Працягнуць',
      title_choice_language: 'Выберыце мову',
      title_subscribe: 'Падпісацца',
      title_subscribes: 'Падпіскі',
      title_unsubscribe: 'Адпісацца',
      title_language: 'Арыгінальная мова',
      subscribe_success: 'Вы паспяхова падпісаліся',
      subscribe_error: 'Узнікла памылка пры падпісцы, паспрабуйце пазней',
      subscribe_noinfo: 'Не ўдалося атрымаць інфармацыю, паспрабуйце пазней',
      company_headquarters: 'Штаб',
      company_homepage: 'Сайт',
      company_country: 'Краіна',
      country_ad: 'Андора',
      country_ae: 'ААЭ',
      country_af: 'Афганістан',
      country_al: 'Албанія',
      country_am: 'Арменія',
      country_ao: 'Ангола',
      country_ar: 'Аргенціна',
      country_at: 'Аўстрыя',
      country_au: 'Аўстралія',
      country_aw: 'Аруба',
      country_az: 'Азербайджан',
      country_bа: 'Боснія і Герцагавіна',
      country_bd: 'Бангладэш',
      country_be: 'Бельгія',
      country_bg: 'Балгарыя',
      country_bh: 'Бахрэйн',
      country_bi: 'Бурунды',
      country_bj: 'Бенін',
      country_bo: 'Балівія',
      country_br: 'Бразілія',
      country_bs: 'Багамскія а-вы',
      country_bt: 'Бутан',
      country_bw: 'Батсвана',
      country_by: 'Беларусь',
      country_ca: 'Канада',
      country_ch: 'Швейцарыя',
      country_cl: 'Чылі',
      country_cm: 'Камерун',
      country_cn: 'Кітай',
      country_co: 'Калумбія',
      country_cr: 'Коста-Рыка',
      country_cu: 'Куба',
      country_cv: 'Каба-Вэрдэ',
      country_cy: 'Кіпр',
      country_cz: 'Чэхія',
      country_de: 'Германія',
      country_dj: 'Джыбуці',
      country_dk: 'Данія',
      country_do: 'Дамінікана',
      country_dz: 'Алжыр',
      country_ec: 'Эквадор',
      country_ee: 'Эстонія',
      country_eg: 'Егіпет',
      country_es: 'Іспанія',
      country_et: 'Эфіопія',
      country_fi: 'Фінляндыя',
      country_fo: 'Фарэрскія а-вы',
      country_fr: 'Францыя',
      country_ga: 'Габон',
      country_gb: 'Вялікабрытанія',
      country_ge: 'Грузія',
      country_gh: 'Гана',
      country_gl: 'Грэнландыя',
      country_gp: 'Гвадэлупа',
      country_gr: 'Грэцыя',
      country_gt: 'Гватэмала',
      country_hk: 'Ганконг',
      country_hr: 'Харватыя',
      country_ht: 'Гаіці',
      country_hu: 'Венгрыя',
      country_id: 'Інданезія',
      country_ie: 'Ірландыя',
      country_il: 'Ізраіль',
      country_in: 'Індыя',
      country_iq: 'Ірак',
      country_ir: 'Іран',
      country_is: 'Ісландыя',
      country_it: 'Італія',
      country_jm: 'Ямайка',
      country_jo: 'Іарданія',
      country_jp: 'Японія',
      country_ke: 'Кенія',
      country_kg: 'Кіргізія',
      country_kh: 'Камбоджа',
      country_kp: 'Паўночная Карэя',
      country_kr: 'Паўднёвая Карэя',
      country_kz: 'Казахстан',
      country_kw: 'Кувейт',
      country_la: 'Лаос',
      country_lb: 'Ліван',
      country_li: 'Ліхтэнштэйн',
      country_lk: 'Шры-Ланка',
      country_lr: 'Ліберыя',
      country_lt: 'Літва',
      country_lu: 'Люксембург',
      country_lv: 'Латвія',
      country_ly: 'Лівія',
      country_ma: 'Марока',
      country_mc: 'Манака',
      country_md: 'Малдова',
      country_me: 'Чарнагорыя',
      country_mk: 'Македонія',
      country_mm: 'М\'янма',
      country_mn: 'Манголія',
      country_mo: 'Макаа',
      country_mt: 'Мальта',
      country_mu: 'Маўрыкій',
      country_mv: 'Мальдывы',
      country_mw: 'Малаві',
      country_mx: 'Мексіка',
      country_my: 'Малайзія',
      country_mz: 'Мазамбік',
      country_na: 'Намібія',
      country_ne: 'Нігер',
      country_ng: 'Нігерыя',
      country_ni: 'Нікарагуа',
      country_nl: 'Нідэрланды',
      country_no: 'Нарвегія',
      country_np: 'Непал',
      country_nz: 'Новая Зеландыя',
      country_om: 'Аман',
      country_pa: 'Панама',
      country_pe: 'Пяру',
      country_pg: 'Папуа - Новая Гвінея',
      country_ph: 'Філіпіны',
      country_pk: 'Пакістан',
      country_pl: 'Польшча',
      country_pr: 'Пуэрта-Рыка',
      country_ps: 'Палестына',
      country_pt: 'Партугалія',
      country_py: 'Парагвай',
      country_qa: 'Катар',
      country_ro: 'Румынія',
      country_rs: 'Сербія',
      country_ru: 'Расія',
      country_rw: 'Руанда',
      country_sa: 'Саудаўская Аравія',
      country_sd: 'Судан',
      country_se: 'Швецыя',
      country_sg: 'Сінгапур',
      country_si: 'Славенія',
      country_sk: 'Славакія',
      country_sn: 'Сенегал',
      country_su: 'СССР',
      country_sv: 'Сальвадор',
      country_sy: 'Сірыя',
      country_th: 'Тайланд',
      country_tj: 'Таджыкістан',
      country_tm: 'Туркменістан',
      country_tn: 'Туніс',
      country_tr: 'Турцыя',
      country_tw: 'Тайвань',
      country_tz: 'Танзанія',
      country_ua: 'Украіна',
      country_ug: 'Уганда',
      country_us: 'ЗША',
      country_uy: 'Уругвай',
      country_uz: 'Узбекістан',
      country_ve: 'Венесуэла',
      country_vn: 'В\'етнам',
      country_ws: 'Самаа',
      country_xk: 'Косава',
      country_ye: 'Емен',
      country_yu: 'Югаславія',
      country_za: 'ПАР',
      country_zm: 'Замбія',
      country_zw: 'Зімбабвэ',
      filter_clarify: 'Удакладніць',
      filter_clarify_two: 'Удакладніць пошук',
      filter_set_name: 'Указаць назву',
      filter_sorted: 'Сартаваць',
      filter_filtred: 'Фільтр',
      filter_any: 'Любы',
      filter_combinations: 'Камбінацыі',
      filter_alt_names: 'Іншыя назвы',
      filter_rating_from: 'ад',
      filter_rating_to: 'да',
      filter_lang_af: 'Афрыкаанс',
      filter_lang_ar: 'Арабская',
      filter_lang_az: 'Азербайджанская',
      filter_lang_ba: 'Башкірская',
      filter_lang_be: 'Беларуская',
      filter_lang_bg: 'Балгарская',
      filter_lang_bn: 'Бенгальская',
      filter_lang_bs: 'Баснійская',
      filter_lang_ca: 'Каталанская',
      filter_lang_ce: 'Чачэнская',
      filter_lang_cs: 'Чэшская',
      filter_lang_da: 'Дацкая',
      filter_lang_de: 'Нямецкая',
      filter_lang_el: 'Грэчаская',
      filter_lang_en: 'Англійская',
      filter_lang_es: 'Іспанская',
      filter_lang_et: 'Эстонская',
      filter_lang_fa: 'Персідская',
      filter_lang_fi: 'Фінская',
      filter_lang_fr: 'Французская',
      filter_lang_ga: 'Ірландская',
      filter_lang_gl: 'Галісійская',
      filter_lang_gn: 'Гуарані',
      filter_lang_he: 'Іўрыт',
      filter_lang_hi: 'Хіндзі',
      filter_lang_hr: 'Харвацкая',
      filter_lang_hu: 'Венгерская',
      filter_lang_hy: 'Армянская',
      filter_lang_id: 'Інданезійская',
      filter_lang_is: 'Ісландская',
      filter_lang_it: 'Італьянская',
      filter_lang_ja: 'Японская',
      filter_lang_ka: 'Грузінская',
      filter_lang_kk: 'Казахская',
      filter_lang_ko: 'Карэйская',
      filter_lang_ks: 'Кашміры',
      filter_lang_ku: 'Курдская',
      filter_lang_ky: 'Кіргізская',
      filter_lang_lt: 'Літоўская',
      filter_lang_lv: 'Латышская',
      filter_lang_mi: 'Маоры',
      filter_lang_mk: 'Македонская',
      filter_lang_mn: 'Мангольская',
      filter_lang_mo: 'Малдаўская',
      filter_lang_mt: 'Мальтыйская',
      filter_lang_ne: 'Непальская',
      filter_lang_nl: 'Нідэрландская',
      filter_lang_no: 'Нарвежская',
      filter_lang_pa: 'Панджабі',
      filter_lang_pl: 'Польская',
      filter_lang_ps: 'Пушту',
      filter_lang_pt: 'Партугальская',
      filter_lang_ro: 'Румынская',
      filter_lang_ru: 'Руская',
      filter_lang_si: 'Сінгальская',
      filter_lang_sk: 'Славацкі',
      filter_lang_sl: 'Славенская',
      filter_lang_sm: 'Самаанская',
      filter_lang_so: 'Самалійская',
      filter_lang_sq: 'Албанская',
      filter_lang_sr: 'Сербская',
      filter_lang_sv: 'Шведская',
      filter_lang_sw: 'Суахілі',
      filter_lang_ta: 'Тамільская',
      filter_lang_tg: 'Таджыкская',
      filter_lang_th: 'Тайская',
      filter_lang_tk: 'Туркменская',
      filter_lang_tr: 'Турэцкая',
      filter_lang_tt: 'Татарская',
      filter_lang_ur: 'Урду',
      filter_lang_uk: 'Украінская',
      filter_lang_uz: 'Узбекская',
      filter_lang_vi: 'В\'етнамская',
      filter_lang_yi: 'Ідыш',
      filter_lang_zh: 'Кітайская',
      filter_genre_ac: 'Баявік',
      filter_genre_ad: 'Прыгоды',
      filter_genre_mv: 'Мультфільм',
      filter_genre_cm: 'Камедыя',
      filter_genre_cr: 'Крымінал',
      filter_genre_dc: 'Дакументальны',
      filter_genre_dr: 'Драма',
      filter_genre_fm: 'Сямейны',
      filter_genre_fe: 'Фэнтэзі',
      filter_genre_hi: 'Гісторыя',
      filter_genre_ho: 'Жахі',
      filter_genre_mu: 'Музыка',
      filter_genre_de: 'Дэтэктыў',
      filter_genre_md: 'Меладрама',
      filter_genre_fa: 'Фантастыка',
      filter_genre_tv: 'Тэлевізійны фільм',
      filter_genre_tr: 'Трылер',
      filter_genre_mi: 'Ваенны',
      filter_genre_ve: 'Вэстэрн',
      filter_genre_aa: 'Баявік і Прыгоды',
      filter_genre_ch: 'Дзіцячы',
      filter_genre_nw: 'Навіны',
      filter_genre_rs: 'Рэаліці-шоў',
      filter_genre_hf: 'НФ і Фэнтэзі',
      filter_genre_op: 'Мыльная опера',
      filter_genre_tc: 'Ток-шоу',
      filter_genre_mp: 'Вайна і Палітыка',
      empty_title: 'Пуста',
      empty_text: 'Па вашым фільтры нічога не знайшлося, удакладніце фільтр.',
      empty_title_two: 'Тут пуста',
      empty_text_two: 'На дадзены момант спіс пусты',
      menu_main: 'Галоўная',
      menu_movies: 'Фільмы',
      menu_tv: 'Серыялы',
      menu_catalog: 'Каталог',
      menu_filter: 'Фільтр',
      menu_collections: 'Падборкі',
      menu_relises: 'Рэлізы',
      menu_anime: 'Анімэ',
      menu_bookmark: 'Закладкі',
      menu_like: 'Падабаецца',
      menu_time: 'Пазней',
      menu_history: 'Гісторыя',
      menu_timeline: 'Расклад',
      menu_torrents: 'Торэнты',
      menu_settings: 'Налады',
      menu_about: 'Інфармацыя',
      menu_console: 'Кансоль',
      menu_multmovie: 'Мультфільмы',
      menu_multtv: 'Мультсерыялы',
      plugins_catalog_work: 'Працаздольныя плагіны',
      plugins_catalog_work_descr: 'Плагіны, якія сапраўды працуюць у лямпе.',
      plugins_catalog_popular: 'Папулярныя плагіны сярод карыстальнікаў',
      plugins_catalog_popular_descr: 'Усталяванне з невядомых крыніц можа прывесці да некарэктнай працы прыкладання.',
      plugins_online: 'Прагляд анлайн',
      plugins_check_fail: 'Немагчыма праверыць працаздольнасць плагіна. Аднак гэта не азначае, што плягін не працуе. Перазагрузіце прыкладанне для высвятлення, ці загружаецца плягін.',
      plugins_need_reload: 'Для прымянення плагіна неабходна перазагрузіць дадатак',
      plugins_install: 'Усталяваць',
      plugins_install_ready: 'Гэты плагін ужо ўсталяваны.',
      plugins_installed: 'Усталёвак',
      plugins_load_from: 'Загружана з CUB',
      plugins_ok_for_check: 'Націсніце (OK) для праверкі плагіна',
      plugins_no_loaded: 'Пры загрузцы прыкладання, частка плагінаў не атрымалася загрузіць',
      time_viewed: 'Прагледжана',
      time_from: 'з',
      time_reset: 'Скінуць тайм-код',
      settings_clear_cache: 'Кэш і дадзеныя ачышчаны',
      settings_user_links: 'Карыстацкая спасылка',
      settings_for_local: 'Для лакальнага TorrServer',
      settings_add: 'Дадаць',
      settings_remove: 'Выдаліць',
      settings_this_value: 'бягучае значэнне',
      settings_added: 'Дададзена',
      settings_removed: 'Выдалена',
      settings_param_player_inner: 'Убудаваны',
      settings_param_player_outside: 'Вонкавы',
      settings_param_yes: 'Так',
      settings_param_no: 'Не',
      settings_param_interface_size_small: 'Менш',
      settings_param_interface_size_normal: 'Нармальны',
      settings_param_interface_size_bigger: 'Больш',
      settings_param_poster_quality_low: 'Нізкае',
      settings_param_poster_quality_average: 'Сярэдняе',
      settings_param_poster_quality_high: 'Высокае',
      settings_param_parse_directly: 'Напрамую',
      settings_param_parse_api: 'Праз API сайта',
      settings_param_background_complex: 'Складаны',
      settings_param_background_simple: 'Просты',
      settings_param_background_image: 'Малюнак',
      settings_param_link_use_one: 'Асноўную',
      settings_param_link_use_two: 'Дадатковую',
      settings_param_subtitles_size_small: 'Маленькія',
      settings_param_subtitles_size_normal: 'Звычайныя',
      settings_param_subtitles_size_bigger: 'Вялікія',
      settings_param_screensaver_nature: 'Прырода',
      settings_param_torrent_lang_orig: 'Арыгінал',
      settings_param_torrent_lang_ru: 'Рускі',
      settings_param_player_timecode_again: 'Пачаць з пачатку',
      settings_param_player_timecode_continue: 'Працягнуць',
      settings_param_player_timecode_ask: 'Пытаць',
      settings_param_player_scale_method: 'Разлічыць',
      settings_param_player_hls_app: 'Сістэмны',
      settings_param_player_hls_js: 'Праграмны',
      settings_param_card_view_load: 'Падгружаць',
      settings_param_card_view_all: 'Паказаць усё',
      settings_param_navigation_remote: 'Пульт',
      settings_param_navigation_mouse: 'Пульт з мышкай',
      settings_param_keyboard_lampa: 'Убудаваная',
      settings_param_keyboard_system: 'Сістэмная',
      helper_keyboard: 'Пасля ўводу значэння націсніце кнопку "Назад" для захавання',
      helper_torrents: 'Утрымлівайце клавішу (ОК) для выкліку кантэкстнага меню',
      helper_cleared: 'Паспяхова, падказкі будуць паказаны нанава.',
      helper_torrents_view: 'Для скіду тайм-кода і выкліку меню ўтрымлівайце клавішу (ОК)',
      fav_sync_title: 'Сінхранізацыя закладак',
      fav_sync_text: 'Вашыя любімыя закладкі разам з Вамі. Падлучыце сінхранізацыю і праглядайце на любой прыладзе. <br><br>Для гэтага зарэгіструйцеся на сайце www.cub.watch, стварыце профіль і аўтарызуйцеся ў дадатак.',
      fav_sync_site: 'Сайт',
      fav_remove_title: 'Выдаліць з гісторыі',
      fav_remove_descr: 'Выдаліць выдзеленую картку',
      fav_clear_title: 'Ачысціць гісторыю',
      fav_clear_descr: 'Выдаліць усе карткі з гісторыі',
      fav_clear_label_title: 'Ачысціць пазнакі',
      fav_clear_label_descr: 'Ачысціць пазнакі аб праглядах',
      fav_clear_time_title: 'Ачысціць тайм-коды',
      fav_clear_time_descr: 'Ачысціць усе тайм-коды',
      fav_label_cleared: 'Пазнакі ачышчаны',
      fav_time_cleared: 'Тайм-коды ачышчаны',
      timetable_empty: 'У гэтым раздзеле будуць адлюстроўвацца даты выхаду новых серый',
      player_quality: 'Якасць',
      player_tracks: 'Аўдыёдарожкі',
      player_disabled: 'Адключана',
      player_unknown: 'Невядома',
      player_subs: 'Субтытры',
      player_size_default_title: 'Па змаўчанні',
      player_size_default_descr: 'Памер відэа па змаўчанні',
      player_size_cover_title: 'Пашырыць',
      player_size_cover_descr: 'Пашырае відэа на ўвесь экран',
      player_size_fill_title: 'Запоўніць',
      player_size_fill_descr: 'Змясціць відэа на ўвесь экран',
      player_size_s115_title: 'Павялічыць 115%',
      player_size_s115_descr: 'Павялічыць відэа на 115%',
      player_size_s130_title: 'Павялічыць 130%',
      player_size_s130_descr: 'Павялічыць відэа на 130%',
      player_size_v115_title: 'Па вертыкалі 115%',
      player_size_v115_descr: 'Павялічыць відэа на 115%',
      player_size_v130_title: 'Па вертыкалі 130%',
      player_size_v130_descr: 'Павялічыць відэа на 130%',
      player_video_size: 'Памер відэа',
      player_playlist: 'Плэйліст',
      player_error_one: 'Не атрымалася дэкадаваць відэа',
      player_error_two: 'Відэа не знойдзена ці пашкоджана',
      player_start_from: 'Працягнуць прагляд з',
      player_not_found: 'Плэер не знойдзены',
      player_lauch: 'Запусціць плэер',
      player_speed_default_title: 'Звычайная',
      player_speed_two_descr: 'Прайграваць без гуку',
      player_video_speed: 'Хуткасць прайгравання',
      player_share_title: 'Падзеліцца',
      player_share_descr: 'Запусціць гэтае відэа на іншай прыладзе',
      player_normalization_power_title: 'Сіла нармалізацыі',
      player_normalization_smooth_title: 'Хуткасць нармалізацыі',
      player_normalization_step_low: 'Нізкае',
      player_normalization_step_medium: 'Сярэдняе',
      player_normalization_step_hight: 'Высокае',
      player_youtube_no_played: 'Нажаль, гэта відэа не даступна ў вашым рэгіёне, магчыма, яно было заблакавана ці выдаленае.',
      player_youtube_start_play: 'Для пачатку прайгравання відэа, націсніце кнопку "Плэй"',
      broadcast_open: 'Адкрыць картку на іншай прыладзе',
      broadcast_play: 'Абярыце прыладу на якой глядзець',
      card_new_episode: 'Новая серыя',
      card_book_remove: 'Прыбраць з закладак',
      card_book_add: 'У закладкі',
      card_book_descr: 'Глядзіце ў меню (Закладкі)',
      card_like_remove: 'Прыбраць з упадабаных',
      card_like_add: 'Падабаецца',
      card_like_descr: 'Глядзіце ў меню (Падабаецца)',
      card_wath_remove: 'Прыбраць з чаканых',
      card_wath_add: 'Глядзець пазней',
      card_wath_descr: 'Глядзіце ў меню (Пазней)',
      card_history_remove: 'Прыбраць з гісторыі',
      card_history_add: 'Дадаць у гісторыю',
      card_history_descr: 'Глядзіце ў меню (Гісторыя)',
      keyboard_listen: 'Гаварыце, я слухаю...',
      keyboard_nomic: 'Няма доступу да мікрафона',
      notice_new_quality: 'Даступна новая якасць',
      notice_quality: 'Якасць',
      notice_new_episode: 'Новая серыя',
      notice_none: 'У вас яшчэ няма ніякіх апавяшчэнняў, зарэгіструйцеся на сайце <b>www.cub.watch</b>, каб сачыць за новымі серыямі і рэлізамі.',
      notice_in_quality: 'У якасці',
      copy_link: 'Капіяваць спасылку на відэа',
      copy_secuses: 'Спасылка скапіявана ў буфер абмену',
      copy_error: 'Памылка пры капіраванні спасылкі',
      account_sync_to_profile: 'Усе закладкі будуць перанесеныя ў профіль',
      account_sync_secuses: 'Усе закладкі паспяхова перанесены',
      account_profiles: 'Профілі',
      account_profiles_empty: 'Немагчыма атрымаць спіс профіляў',
      account_authorized: 'Аўтарызаваны',
      account_logged_in: 'Вы ўвайшлі пад акаўнтам',
      account_login_failed: 'Уваход не выкананы',
      account_login_wait: 'Чакаем уваходу ў акаўнт',
      account_profile_main: 'агульны',
      account_export_secuses: 'Экспарт паспяхова завершаны',
      account_export_fail: 'Памылка пры экспарце',
      account_import_secuses: 'Імпарт паспяхова завершаны',
      account_import_fail: 'Памылка пры імпарце',
      account_imported: 'імпартавана',
      account_reload_after: 'перазагрузка праз 5 сек.',
      account_create: 'Адкрыйце больш магчымасцяў з акаўнтам CUB. Зарэгіструйцеся на сайце <span class="account-modal__site">www.cub.watch</span> і атрымайце доступ да сінхранізацыі вашых закладак, тайм-кодаў і іншых магчымасцяў акаўнта CUB.',
      account_premium: 'Раскрыйце новыя гарызонты з акаўнтам CUB Premium! Атрымлівайце асалоду ад павялічанымі лімітамі і ўзбагачаным функцыяналам сэрвісу. Дадатковыя магчымасці чакаюць вас ужо сёння!',
      account_premium_more: 'Больш падрабязна пра CUB Premium',
      account_limited: 'Вы дасягнулі максімальнага ліміту. Павялічце ліміт з акаўнтам CUB Premium. Падрабязней на сайце <span class="account-modal__site">www.cub.watch/premium</span>',
      account_premium_include_1: 'Павелічэнне колькасць закладак',
      account_premium_include_2: 'Павелічэнне гісторыі праглядаў',
      account_premium_include_3: 'Павелічэнне колькасць тайм-кодаў',
      account_premium_include_4: 'Колькасць профіляў на рахунак',
      account_premium_include_5: 'Апавяшчэнні',
      account_premium_include_6: 'Сінхранізацыя дадзеных',
      account_premium_include_text_1: 'Больш закладак - больш магчымасцяў! Захоўвайце свае любімыя фільмы і серыялы, стварайце спісы прагляду і атрымлівайце асалоду ад прагляду ў любы зручны час.',
      account_premium_include_text_2: 'Павялічце гісторыю праглядаў у дадатку і сачыце за тым, што ўжо паглядзелі. Лёгка знаходзіце і пераглядайце свае любімыя фільмы і серыялы.',
      account_premium_include_text_3: 'Не бойцеся прапусціць ніводнай важнай сцэны! Павялічце колькасць тайм-кодаў у дадатку і лёгка адсочвайце, дзе спыніліся ў праглядзе любімых фільмаў і серыялаў.',
      account_premium_include_text_4: 'Атрымайце больш свабоды з нашым прэміум доступам! Павялічце колькасць профіляў на акаўнце і дазвольце сваім сябрам і блізкім атрымліваць асалоду ад фільмамі і серыяламі разам з вамі. Ніякіх абмежаванняў - атрымлівайце асалоду ад прагляду з каханымі людзьмі.',
      account_premium_include_text_5: 'Не прапусціце ніводнай новай серыі або перакладу! Атрымлівайце апавяшчэння своечасова і будзьце ў курсе ўсіх абнаўленняў. Павялічце свой кінаструмень разам з намі і атрымлівайце апавяшчэння аб выхадзе новых серый і перакладаў прама на свой смартфон.',
      account_premium_include_text_6: 'Сінхранізуйце свае дадзеныя паміж прыладамі з прэміум доступам! Больш не трэба марнаваць час на пошук апошняга эпізоду, на якім вы спыніліся. З нашым прэміум доступам вы можаце сінхранізаваць свае дадзеныя паміж прыладамі, каб працягваць прагляд з месца, дзе вы спыніліся, на любой прыладзе, дзе ўстаноўлена прыкладанне.',
      account_code_enter: 'Калі ласка, увядзіце шэсцізначны код',
      account_code_error: 'Магчыма, вы ўвялі няправільны ці старэлы код',
      account_code_wrong: 'Магчыма, вы ўказалі няправільны фармат',
      account_code_where: 'Перайдзіце на сайт <span class="account-add-device__site">cub.watch/add</span> і ўвядзіце там указаны код.',
      account_code_input: 'Увесці код',
      settings_cub_signin_button: 'Увайсці',
      network_noconnect: 'Няма падлучэння да сеткі',
      network_404: 'Запытаная старонка не знойдзена. [404]',
      network_401: 'Аўтарызацыя не ўдалася',
      network_500: 'Унутраная памылка сервера. [500]',
      network_parsererror: 'Запытаны сінтаксічны аналіз JSON завяршыўся няўдала.',
      network_timeout: 'Час запыту скончыўся.',
      network_abort: 'Запыт быў перарваны.',
      network_error: 'Невядомая памылка',
      size_zero: '0 Байт',
      size_byte: 'Байт',
      size_kb: 'КБ',
      size_mb: 'МБ',
      size_gb: 'ГБ',
      size_tb: 'ТБ',
      size_pp: 'ПБ',
      speed_bit: 'біт',
      speed_kb: 'Кбіт',
      speed_mb: 'Мбіт',
      speed_gb: 'Гбіт',
      speed_tb: 'Тбіт',
      speed_pp: 'Пбіт',
      month_1: 'Студзень',
      month_2: 'Люты',
      month_3: 'Сакавік',
      month_4: 'Красавік',
      month_5: 'Май',
      month_6: 'Чэрвень',
      month_7: 'Ліпень',
      month_8: 'Жнівень',
      month_9: 'Верасень',
      month_10: 'Кастрычнік',
      month_11: 'Лістапад',
      month_12: 'Снежань',
      day_1: 'Панядзелак',
      day_2: 'Аўторак',
      day_3: 'Серада',
      day_4: 'Чацвер',
      day_5: 'Пятніца',
      day_6: 'Субота',
      day_7: 'Нядзеля',
      month_1_e: 'Студзеня',
      month_2_e: 'Лютага',
      month_3_e: 'Сакавіка',
      month_4_e: 'Красавіка',
      month_5_e: 'Мая',
      month_6_e: 'Чэрвеня',
      month_7_e: 'Ліпеня',
      month_8_e: 'Жніўня',
      month_9_e: 'Верасня',
      month_10_e: 'Кастрычніка',
      month_11_e: 'Лістапада',
      month_12_e: 'Снежня',
      week_1: 'Пн',
      week_2: 'Аў',
      week_3: 'Ср',
      week_4: 'Чц',
      week_5: 'Пт',
      week_6: 'Сб',
      week_7: 'Нд',
      notice_none_account: 'У вас яшчэ няма ніякіх апавяшчэнняў, дадайце серыялы ў закладкі і чакайце апавяшчэння аб новых серыях.',
      notice_none_system: 'На дадзены момант у вас адсутнічаюць апавяшчэння. Мы абавязкова апавясцім вас, калі з\'явяцца новыя апавяшчэнні.',
      extensions_enable: 'Уключыць',
      extensions_disable: 'Адключыць',
      extensions_check: 'Праверыць статус',
      extensions_install: 'Усталяваць',
      extensions_info: 'Інфармацыя',
      extensions_edit: 'рэдагаваць',
      extensions_change_name: 'Змяніць назву',
      extensions_change_link: 'Змяніць спасылку',
      extensions_remove: 'Выдаліць',
      extensions_set_name: 'Увядзіце назву плагіна',
      extensions_set_url: 'Увядзіце адрас плагіна',
      extensions_ready: 'Гэты плагін ужо ўсталяваны',
      extensions_no_info: 'Без інфармацыі',
      extensions_no_name: 'Без назвы',
      extensions_worked: 'Працаздольны',
      extensions_no_plugin: 'Плагін не пацверджаны ',
      extensions_add: 'Дадаць плагін',
      extensions_from_memory: 'Устаноўленыя ў памяць ',
      extensions_from_cub: 'Устаноўленыя з CUB',
      extensions_from_popular: 'Папулярныя плагіны',
      extensions_from_lib: 'Бібліятэка плагінаў',
      extensions_from_connected: 'Падлучаныя плагіны',
      settings_webos_launcher: 'Запуск прыкладання',
      settings_webos_launcher_add_device: 'Усталяваць як стартавае',
      settings_webos_launcher_remove_device: 'Прыбраць са стартавых прыкладанняў',
      player_normalization: 'Нармалізацыя',
      change_source_on_cub: 'Змяніць крыніцу на CUB',
      settings_param_jackett_interview_all: 'Усё',
      settings_param_jackett_interview_healthy: 'Толькі даступныя',
      settings_parser_jackett_interview: 'Апытваць трэкеры',
      title_ongoing: 'Ангоінгі',
      title_pgrating: 'Узроставае абмежаванне',
      settings_interface_card_interfice: 'Інтэрфейс картак',
      settings_interface_card_poster: 'Паказаць постэр',
      title_card: 'Картка',
      settings_param_card_interface_old: 'Стары',
      settings_param_card_interface_new: 'Новы',
      title_seasons: 'Сезоны',
      title_episodes: 'Серыі',
      title_rewiews: 'Водгукі',
      settings_interface_glass: 'Шкло',
      settings_interface_glass_descr: 'Паказваць інтэрфейс у шклопадобным стылі',
      settings_interface_black_style: 'Чорны стыль',
      plugins_remove: 'Выдаліць плагіны',
      settings_reset: 'Скід налад',
      title_channel: 'Канал',
      input_detection_touch: 'Жадаеце пераключыць на сэнсарнае кіраванне?',
      input_detection_mouse: 'Жадаеце пераключыць на кіраванне мышшу?',
      input_detection_remote: 'Жадаеце пераключыць на кіраванне пультам?',
      settings_interface_hide_outside_the_screen: 'Хаваць карткі за межамі экрана',
      settings_interface_hide_outside_the_screen_descr: 'Гэта паскорыць рэндэр інтэрфейсу і палепшыць прадукцыйнасць',
      https_text: 'Вы выкарыстоўвайце HTTPS пратакол, у гэтым пратаколе лямпа працуе некарэктна. Для карэктнай працы лямпы, выкарыстоўвайце адрас з пратаколам HTTP',
      extensions_hpu_best: 'Папулярныя',
      extensions_hpu_recomend: 'Рэкамендуем',
      extensions_hpu_theme: 'Тэмы',
      extensions_hpu_screensaver: 'Скрынсэйвер',
      extensions_hpu_video: 'Відэа',
      extensions_hpu_control: 'Упраўленне',
      extensions_hpu_other: 'Рознае',
      extensions_hpu_: 'Астатняе',
      title_author: 'Аўтар',
      title_buffer: 'Буфер',
      settings_rest_screensaver_time: 'Праз колькі хвілін запусціць скрынсэйвер',
      time_h: 'г.',
      time_m: 'х.',
      time_s: 'с.',
      settings_param_glass_easy: 'Празрыстая',
      settings_param_glass_medium: 'Напаўпразрыстая',
      settings_param_glass_blacked: 'Зацемненая',
      settings_interface_glass_opacity: 'Празрыстасць шкла',
      torrent_error_check_no_auth: 'Сервер адказаў на запыт, але не ўдалося прайсці аўтарызацыю',
      settings_interface_card_cover: 'Паказаць вокладку',
      title_upcoming_episodes: 'Бліжэйшыя выхады эпізодаў',
      settings_rest_cache_images: 'Кэш малюнкаў',
      settings_rest_cache_images_descr: 'Кэшаваць постэры і фоны ў лакальнае сховішча',
      settings_player_rewind_title: 'Перамотка',
      settings_player_rewind_descr: 'Інтэрвал перамоткі ў секундах',
      speedtest_connect: 'падлучэнне',
      speedtest_test: 'тэставанне',
      speedtest_ready: 'гатова',
      speedtest_button: 'Тэставаць хуткасць'
    };

    var zh = {
      lang_choice_title: '欢迎',
      lang_choice_subtitle: '选择你的语言',
      back: '后退',
      more: '更多',
      ready: '准备好',
      show_more: '显示更多',
      more_results: '显示更多结果',
      loading: '加载中',
      nofind_movie: '找不到电影。',
      noname: '无标题',
      nochoice: '未选择',
      cancel: '取消',
      confirm: '我确认',
      sure: '你确定吗？',
      nodata: '无数据',
      search: '搜索',
      search_input: '输入文本',
      search_empty: '搜索历史为空。',
      search_delete: '左 - 删除',
      search_start_typing: '开始输入搜索文本。',
      search_searching: '搜索中...',
      search_start: '开始搜索',
      search_nofound: '根据您的要求没有找到相关内容。',
      full_genre: '类型',
      full_production: '出品公司',
      full_date_of_release: '发布日期',
      full_budget: '预算',
      full_countries: '国家',
      full_like: '喜欢',
      full_torrents: '种子',
      full_trailers: '预告片',
      full_detail: '详细',
      full_notext: '无描述。',
      full_series_release: '系列发布',
      full_next_episode: '下一集',
      full_episode_days_left: '剩余天数',
      full_trailer_official: '官方',
      full_trailer_no_official: '非正式',
      full_season: '季',
      full_episode: '剧集',
      full_directing: '导演',
      settings_cub_sync: '同步',
      settings_cub_sync_descr: '与 CUB 服务同步：同步您的书签、浏览历史、标签和时间码。网站：www.cub.watch',
      settings_cub_account: '帐户',
      settings_cub_logged_in_as: '登录身份',
      settings_cub_profile: '个人资料',
      settings_cub_sync_btn: '同步',
      settings_cub_sync_btn_descr: '将本地书签保存到 CUB 帐户',
      settings_cub_backup: '备份',
      settings_cub_backup_descr: '保存或加载备份数据',
      settings_cub_logout: '注销',
      settings_cub_signin: '授权',
      settings_cub_not_specified: '未指定',
      settings_cub_password: '密码',
      settings_cub_status: '状态',
      settings_cub_backup_import: '导入',
      settings_cub_backup_export: '导出',
      settings_cub_sync_filters: '筛选同步',
      settings_cub_sync_calendar: '日历同步',
      settings_cub_sync_quality: '标记同步（质量）',
      settings_cub_sync_search: '检索历史同步',
      settings_cub_sync_recomends: '推荐同步',
      settings_cub_sync_timecodes: '时间码同步',
      settings_input_links: '收藏夹',
      settings_interface_type: '精简版',
      settings_interface_size: '界面大小',
      settings_interface_background: '背景',
      settings_interface_background_use: '显示背景',
      settings_interface_background_type: '背景类型',
      settings_interface_performance: '性能',
      settings_interface_animation: '动画',
      settings_interface_animation_descr: '卡片和内容的动画',
      settings_interface_attenuation: '淡入淡出',
      settings_interface_attenuation_descr: '从下方和上方平滑淡入卡片',
      settings_interface_scroll: '滚动类型',
      settings_interface_view_card: '卡片视图类型',
      settings_interface_view_card_descr: '当您滚动时，卡片将逐渐加载或全部加载',
      settings_interface_lang: '界面语言',
      settings_interface_lang_reload: '需要重启应用，点击“确定”重启。',
      settings_main_account: '帐户',
      settings_main_interface: '界面',
      settings_main_player: '播放器',
      settings_main_parser: '解析器',
      settings_main_torrserver: 'TorrServer',
      settings_main_plugins: '扩展',
      settings_main_rest: '其他',
      settings_rest_start: '起始页',
      settings_rest_start_descr: '启动时要启动的页面',
      settings_rest_source: '源',
      settings_rest_source_use: '主要来源',
      settings_rest_source_descr: '从何处获取有关电影的信息',
      settings_rest_tmdb_lang: '从 TMDB 显示数据的语言',
      settings_rest_tmdb_prox: '代理 TMDB',
      settings_rest_tmdb_prox_auto: '自动启用代理',
      settings_rest_tmdb_posters: 'TMDB 海报的分辨率',
      settings_rest_screensaver: '屏幕保护程序',
      settings_rest_screensaver_use: '空闲时启动屏保',
      settings_rest_screensaver_type: '屏幕保护类型',
      settings_rest_helper: '提示',
      settings_rest_helper_use: '显示提示',
      settings_rest_helper_reset: '再次显示提示',
      settings_rest_pages: '要在内存中保留多少页',
      settings_rest_pages_descr: '将页面保持在您离开它们的状态',
      settings_rest_time: '移位时间',
      settings_rest_navigation: '导航类型',
      settings_rest_keyboard: '键盘类型',
      settings_rest_device: '设备名称',
      settings_rest_device_placeholder: '例如：我的Lampa',
      settings_rest_cache: '清除缓存',
      settings_rest_cache_descr: '所有设置和数据将被清除',
      settings_rest_tmdb_example: '例如：',
      settings_rest_tmdb_api_descr: '获取数据',
      settings_rest_tmdb_image_descr: '获取图像',
      settings_rest_card_quality: '质量标志',
      settings_rest_card_quality_descr: '在卡片上显示质量标记',
      settings_rest_card_episodes: '剧集标记',
      settings_rest_card_episodes_descr: '在卡片上显示剧集标记',
      settings_parser_use: '使用解析器',
      settings_parser_use_descr: '在此，您同意接受所有使用责任用于查看 种子和在线内容的公共链接。',
      settings_parser_type: '种子的解析器类型',
      settings_parser_jackett_placeholder: '例如：192.168.x',
      settings_parser_jackett_link: '链接',
      settings_parser_jackett_link_descr: '提供Jackett脚本的链接',
      settings_parser_jackett_key_placeholder: '例如：sa0sk83d..',
      settings_parser_jackett_key: 'Api key',
      settings_parser_jackett_key_descr: '位于Jackett',
      settings_parser_torlook_type: 'TorLook网站解析方法',
      settings_parser_scraperapi_placeholder: '例如：scraperapi.com',
      settings_parser_scraperapi_link: '链接到站点解析器',
      settings_parser_scraperapi_descr: '在网站 scraperapi.com 上注册，输入链接 api.scraperapi.com?api_key=...&url={q}<br>W41.torlook.info 将发送到 {q}',
      settings_parser_search: '搜索',
      settings_parser_search_descr: '用什么语言搜索？',
      settings_parser_in_search: '在搜索中显示种子结果',
      settings_parser_in_search_descr: '显示搜索结果？',
      settings_parser_timeout_title: '解析器超时',
      settings_parser_timeout_descr: '等待服务器响应的时间（以秒为单位）',
      settings_player_type: '播放器类型',
      settings_player_type_descr: '用哪个播放器',
      settings_player_iptv_type: 'IPTV播放器类型',
      settings_player_iptv_type_descr: '哪个播放器播放IPTV频道',
      settings_player_reset: '重置默认播放器',
      settings_player_reset_descr: '重置应用程序中选定的Android播放器',
      settings_player_path: '播放器路径',
      settings_player_path_descr: '指定播放器.exe的路径',
      settings_player_normalization: '声音标准化',
      settings_player_normalization_descr: '将声音标准化为一级，降低响亮的声音并增强安静的',
      settings_player_next_episode: '下一集',
      settings_player_next_episode_descr: '当前一集结束后自动切换到下一个系列',
      settings_player_timecode: '时间码',
      settings_player_timecode_descr: '从上次播放的位置继续',
      settings_player_scale: '缩放方法',
      settings_player_scale_descr: '如何计算视频缩放',
      settings_player_subs: '字幕',
      settings_player_subs_use: '启用',
      settings_player_subs_use_descr: '开始视频后总是打开字幕',
      settings_player_subs_size: '大小',
      settings_player_subs_size_descr: '字幕屏幕大小',
      settings_player_subs_stroke_use: '使用边缘',
      settings_player_subs_stroke_use_descr: '字幕将用黑色勾勒以提高可读性',
      settings_player_subs_backdrop_use: '使用底衬',
      settings_player_subs_backdrop_use_descr: '字幕将显示在半透明背景上以提高可读性',
      settings_player_quality: '默认视频质量',
      settings_player_quality_descr: '首选视频质量观看',
      settings_player_hls_title: '处理.m3u8流媒体',
      settings_player_hls_descr: '如果您不知道为什么，请不要修改此参数。',
      settings_plugins_notice: '要应用插件，你需要重新启动应用程序',
      settings_plugins_add: '添加插件',
      settings_plugins_add_descr: '要删除添加的插件，请按住或双击其上的（确定）键',
      settings_plugins_install: '安装插件',
      settings_plugins_install_descr: '从可用列表中安装插件',
      settings_server_link: '使用链接',
      settings_server_links: '链接',
      settings_server_placeholder: '例如：192.168.X',
      settings_server_link_one: '主链接',
      settings_server_link_one_descr: '指定TorrServer脚本的主链接',
      settings_server_link_two: '额外链接',
      settings_server_link_two_descr: '提供TorrServer脚本的额外链接',
      settings_server_additionally: '高级',
      settings_server_client: '内置客户端',
      settings_server_client_descr: '使用内置的TorrServe JS客户端，否则系统启动。',
      settings_server_base: '保存到数据库',
      settings_server_base_descr: 'torrent 将被添加到 TorrServer 数据库',
      settings_server_preload: '使用预取缓冲区',
      settings_server_preload_descr: '播放前等待TorrServer的预加载缓冲区填满',
      settings_server_auth: '授权',
      settings_server_password_use: '密码登录',
      settings_server_login: '登录',
      settings_server_password: '密码',
      settings_server_not_specified: '未指定',
      torent_nohash_reasons: '原因',
      torent_nohash_reason_one: 'TorServer 无法下载 torrent 文件',
      torent_nohash_reason_two: '来自 TorServer 的回复',
      torent_nohash_reason_three: '链接',
      torent_nohash_do: '怎么办？',
      torent_nohash_do_one: '检查是否正确配置了 Jackett',
      torent_nohash_do_two: '私人来源可能没有提供文件的链接',
      torent_nohash_do_three: '确保 Jackett 可以下载文件也是',
      torent_nohash_do_four: '写信给我们的电报群组：@lampa_group',
      torent_nohash_do_five: '指定哪部电影，哪个发行版，如果可能，请注明发行版的照片',
      torrent_error_text: '无法连接到 TorrServe。让我们快速浏览可能的问题列表并检查所有内容。',
      torrent_error_step_1: 'TorrServe 是否正在运行',
      torrent_error_step_2: '动态 IP',
      torrent_error_step_3: '协议和端口',
      torrent_error_step_4: '防病毒阻止',
      torrent_error_step_5: '检查可用性',
      torrent_error_step_6: '仍然无法工作',
      torrent_error_info_1: '确保您已在安装 TorrServe 的设备上启动。',
      torrent_error_info_2: '一个常见的错误，带有 TorrServe 的设备的 IP 地址已更改。确保您输入的 IP 地址 - {ip} - 与安装了 TorrServe 的设备的地址匹配。',
      torrent_error_info_3: '要连接到 TorrServe,地址开头必须指定协议http://，结尾指定端口：8090。确保IP地址后面有一个端口，你当前的地址是{ip}',
      torrent_error_info_4: '频繁出现，杀毒或防火墙可以通过 IP 地址阻止访问，尝试禁用防病毒和防火墙。',
      torrent_error_info_5: '在同一网络上的任何其他设备上，在浏览器中打开 {ip} 地址并检查 TorrServe Web 界面是否可用。',
      torrent_error_info_6: '如果在所有检查后仍然出现连接错误，请尝试重新启动 TorrServe 和 Internet 适配器。',
      torrent_error_info_7: '如果问题仍然存在，请使用文本写入 Telegram 组@lampa_group（Lampa 在所有检查后未连接到 TorrServe ,当前地址是{ip})',
      torrent_error_start: '开始验证',
      torrent_error_nomatrix: '验证Matrix版本失败',
      torrent_error_made: '执行',
      torrent_error_from: '片长',
      torrent_error_next: '进一步',
      torrent_error_complite: '要完成',
      torrent_error_connect: '连接错误',
      torrent_install_need: '需要 TorrServe',
      torrent_install_text: 'TorrServe 是一个允许您在线查看 torrent 文件内容的应用程序。<br><br>有关安装的更多详细信息可以在下面的电报组中找到。',
      torrent_install_contact: '电报组',
      torrent_item_bitrate: '比特率',
      torrent_item_seeds: '种子',
      torrent_item_grabs: 'Leechers',
      torrent_item_mb: 'Mbps',
      torrent_serial_episode: '剧集',
      torrent_serial_season: '季',
      torrent_serial_date: '退出',
      torrent_get_magnet: '请求磁力链接',
      torrent_remove_title: '删除',
      torrent_remove_descr: '种子将从您的列表中删除',
      torrent_parser_any_one: '任何',
      torrent_parser_any_two: '任何',
      torrent_parser_no_choice: '未选择',
      torrent_parser_yes: '是',
      torrent_parser_no: '否',
      torrent_parser_quality: '质量',
      torrent_parser_subs: '字幕',
      torrent_parser_voice: '翻译',
      torrent_parser_tracker: '跟踪器',
      torrent_parser_year: '年份',
      torrent_parser_season: '季',
      torrent_parser_sort_by_seeders: '按种子数',
      torrent_parser_sort_by_size: '按大小',
      torrent_parser_sort_by_name: '按名称',
      torrent_parser_sort_by_tracker: '按来源',
      torrent_parser_sort_by_date: '按日期',
      torrent_parser_sort_by_viewed: '已查看',
      torrent_parser_voice_dubbing: '配音',
      torrent_parser_voice_polyphonic: '复音',
      torrent_parser_voice_two: '双声部',
      torrent_parser_voice_amateur: '业余',
      torrent_parser_reset: '重置筛选',
      torrent_parser_empty: '获取结果失败',
      torrent_parser_no_hash: '获取HASH失败',
      torrent_parser_added_to_mytorrents: '添加到“我的种子”',
      torrent_parser_add_to_mytorrents: '添加到“我的种子”',
      torrent_parser_label_title: '标记',
      torrent_parser_label_descr: '用旗帜标记（查看)',
      torrent_parser_label_cancel_title: '取消选中',
      torrent_parser_label_cancel_descr: '从分发中删除标记（已查看）',
      torrent_parser_timeout: '超时',
      torrent_parser_nofiles: '提取合适文件失败',
      torrent_parser_set_link: '指定解析链接',
      torrent_parser_request_error: '请求错误',
      torrent_parser_magnet_error: '获取磁力链接失败',
      torrent_parser_torlook_fallback_search_notification: 'Jackett 解析器不可用或连接设置不正确。 正在搜索 Torlook...',
      torrent_parser_no_responce: '解析器没有响应请求',
      about_text: '应用完全免费，使用公共链接获取有关视频、新版本、热门电影等的信息。所有可用信息仅用于教育目的，该应用程序不使用自己的服务器分发信息。',
      about_channel: '我们的频道',
      about_group: '组',
      about_version: '版本',
      about_donate: '捐赠',
      title_watched: '你看过',
      title_settings: '设置',
      title_collections: '合集',
      title_company: '公司',
      title_actors: '演员',
      title_actor: '演员',
      title_actress: '女演员',
      title_person: '个人',
      title_comments: '评论',
      title_torrents: '种子',
      title_trailers: '预告片',
      title_watch: '观看',
      title_error: '错误',
      title_links: '链接',
      title_choice: '选择',
      title_main: '首页',
      title_book: '书签',
      title_like: '喜欢',
      title_wath: '稍后',
      title_history: '浏览历史',
      title_mytorrents: '我的种子',
      title_last: '最后',
      title_action: '动作',
      title_producer: '制片人',
      title_collection: '合集',
      title_recomendations: '推荐',
      title_similar: '类似',
      title_about: '关于应用程序',
      title_timetable: '日历',
      title_relises: '数字版本',
      title_catalog: '目录',
      title_category: '类别',
      title_parser: '解析器',
      title_type: '类型',
      title_rating: '评级',
      title_country: '国家',
      title_year: '年份',
      title_genre: '类型',
      title_filter: '筛选',
      title_notice: '通知',
      title_files: '文件',
      title_now_watch: '正在观看',
      title_latest: '最后添加',
      title_continue: '继续浏览',
      title_recomend_watch: '我们推荐看',
      title_new_episodes: '新剧集',
      title_popular: '热门',
      title_popular_movie: '热门电影',
      title_popular_tv: '热门电视节目',
      title_new_this_year: '今年新',
      title_hight_voite: '高度评价',
      title_new: '新',
      title_trend_day: '今日趋势',
      title_trend_week: '本周趋势',
      title_upcoming: '在电影院观看',
      title_top_movie: '热门电影',
      title_top_tv: '热门系列',
      title_tv_today: '今天播出',
      title_this_week: '本周',
      title_in_top: '热门',
      title_out: '退出',
      title_out_confirm: '是的，退出',
      title_continue_two: '继续',
      title_choice_language: '选择一种语言',
      title_subscribe: '订阅',
      title_subscribes: '订阅',
      title_unsubscribe: '退订',
      subscribe_success: '您已成功订阅',
      subscribe_error: '订阅时出错，请稍后重试',
      subscribe_noinfo: '检索信息失败，请稍后重试',
      company_headquarters: '总部',
      company_homepage: '网站',
      company_country: '国家',
      country_az: '阿塞拜疆',
      country_by: '白俄罗斯',
      country_bg: '保加利亚',
      country_cz: '捷克共和国',
      country_dk: '丹麦',
      country_de: '德国',
      country_us: '美国',
      country_es: '西班牙',
      country_ee: '爱沙尼亚',
      country_fi: '芬兰',
      country_fr: '法国',
      country_ie: '爱尔兰',
      country_hr: '克罗地亚',
      country_it: '意大利',
      country_jp: '日本',
      country_ka: '格鲁吉亚',
      country_kr: '韩国',
      country_kz: '哈萨克斯坦',
      country_lv: '拉脱维亚',
      country_ne: '尼泊尔',
      country_no: '挪威',
      country_pl: '波兰',
      country_ro: '罗马尼亚',
      country_ru: '俄罗斯',
      country_sk: '斯洛伐克',
      country_si: '斯洛文尼亚',
      country_al: '阿尔巴尼亚',
      country_rs: '塞尔维亚',
      country_se: '瑞典',
      country_tj: '塔吉克斯坦',
      country_tr: '土耳其',
      country_ua: '乌克兰',
      country_uz: '乌兹别克斯坦',
      country_cn: '中国',
      filter_clarify: '优化',
      filter_clarify_two: '优化搜索',
      filter_set_name: '指定标题',
      filter_sorted: '排序',
      filter_filtred: '筛选',
      filter_any: '任何',
      filter_combinations: '组合',
      filter_alt_names: '其他名称',
      filter_rating_from: '从',
      filter_rating_to: '到',
      filter_genre_ac: '动作',
      filter_genre_ad: '冒险',
      filter_genre_mv: '卡通',
      filter_genre_cm: '喜剧',
      filter_genre_cr: '犯罪',
      filter_genre_dc: '纪录片',
      filter_genre_dr: '戏剧',
      filter_genre_fm: '首页',
      filter_genre_fe: '奇幻',
      filter_genre_hi: '故事',
      filter_genre_ho: '恐怖',
      filter_genre_mu: '音乐',
      filter_genre_de: '侦探',
      filter_genre_md: '情节剧',
      filter_genre_fa: '小说',
      filter_genre_tv: '电视电影',
      filter_genre_tr: '惊悚片',
      filter_genre_mi: '军事',
      filter_genre_ve: '西部',
      filter_genre_aa: '动作与冒险',
      filter_genre_ch: '儿童',
      filter_genre_nw: '新闻',
      filter_genre_rs: '真人秀',
      filter_genre_hf: '科幻与奇幻',
      filter_genre_op: '肥皂剧',
      filter_genre_tc: '脱口秀',
      filter_genre_mp: '战争与政治',
      empty_title: '空',
      empty_text: '没有找到适合您的筛选，请优化您的筛选。',
      empty_title_two: '此处为空',
      empty_text_two: '列表当前为空。',
      menu_main: '首页',
      menu_movies: '电影',
      menu_tv: '剧集',
      menu_catalog: '目录',
      menu_filter: '筛选',
      menu_collections: '合集',
      menu_relises: '发布',
      menu_anime: '动漫',
      menu_bookmark: '书签',
      menu_like: '喜欢',
      menu_time: '稍后',
      menu_history: '历史',
      menu_timeline: '日历',
      menu_torrents: '种子',
      menu_settings: '设置',
      menu_about: '关于',
      menu_console: '日志',
      menu_multmovie: '卡通',
      menu_multtv: '动画系列',
      plugins_catalog_work: '工作插件',
      plugins_catalog_work_descr: '完全在Lampa中工作的插件。',
      plugins_catalog_popular: '用户中流行的插件',
      plugins_catalog_popular_descr: '从未知来源安装可能导致应用程序无法正常工作。',
      plugins_online: '在线查看',
      plugins_check_fail: '插件功能测试失败。但这并不代表插件不起作用。重新加载应用看看插件是否在加载中。',
      plugins_need_reload: '要应用插件，需要重新启动应用程序',
      plugins_install: '安装',
      plugins_install_ready: '这个插件已经安装了。',
      plugins_installed: '安装ations',
      plugins_load_from: '从CUB中加载',
      plugins_ok_for_check: '点击(OK)测试插件',
      plugins_no_loaded: '加载应用时，有些插件无法安装已加载',
      time_viewed: '看至',
      time_from: '片长',
      time_reset: '重置时间码',
      settings_clear_cache: '缓存和数据清除',
      settings_user_links: '自定义链接',
      settings_for_local: '对于本地 TorrServer',
      settings_add: '添加',
      settings_remove: '删除',
      settings_this_value: '当前值',
      settings_added: '添加',
      settings_removed: '已删除',
      settings_param_player_inner: 'Lampa',
      settings_param_player_outside: '外部',
      settings_param_yes: '是',
      settings_param_no: '否',
      settings_param_interface_size_small: '较小',
      settings_param_interface_size_normal: '正常',
      settings_param_interface_size_bigger: '更多的',
      settings_param_poster_quality_low: '低',
      settings_param_poster_quality_average: '中',
      settings_param_poster_quality_high: '高',
      settings_param_parse_directly: '直接',
      settings_param_parse_api: '通过网站 API',
      settings_param_background_complex: '复杂',
      settings_param_background_simple: '简单',
      settings_param_background_image: '图片',
      settings_param_link_use_one: '主要',
      settings_param_link_use_two: '额外',
      settings_param_subtitles_size_small: '小',
      settings_param_subtitles_size_normal: '普通',
      settings_param_subtitles_size_bigger: '大',
      settings_param_screensaver_nature: '自然',
      settings_param_torrent_lang_orig: '原始',
      settings_param_torrent_lang_ru: '俄语',
      settings_param_player_timecode_again: '重新开始',
      settings_param_player_timecode_continue: '继续',
      settings_param_player_timecode_ask: '询问',
      settings_param_player_scale_method: '计算',
      settings_param_player_hls_app: 'Systemic',
      settings_param_player_hls_js: 'Program',
      settings_param_card_view_load: '预加载',
      settings_param_card_view_all: '显示全部',
      settings_param_navigation_remote: '遥控器',
      settings_param_navigation_mouse: '用鼠标遥控',
      settings_param_keyboard_lampa: 'Lampa',
      settings_param_keyboard_system: '系统',
      helper_keyboard: '输入数值后按"返回"键保存',
      helper_torrents: '按住(OK)键调出上下文菜单',
      helper_cleared: '成功，将再次显示工具提示。',
      helper_torrents_view: '按住（OK）键重置时间码并显示菜单',
      fav_sync_title: '书签同步',
      fav_sync_text: '您最喜欢的书签。连接同步并在任何设备上查看。<br><br>为此，请在网站 www.cub.watch 上注册，创建个人资料并登录应用程序.',
      fav_sync_site: '网站',
      fav_remove_title: '从历史记录中删除',
      fav_remove_descr: '删除所选卡片',
      fav_clear_title: '清除历史记录',
      fav_clear_descr: '从历史记录中删除所有卡片',
      fav_clear_label_title: '清除标签',
      fav_clear_label_descr: '清除查看标签',
      fav_clear_time_title: '清除时间码',
      fav_clear_time_descr: '清除所有时间码',
      fav_label_cleared: '清除标记',
      fav_time_cleared: '清除时间码',
      timetable_empty: '此部分将显示新剧集的发布日期。',
      player_quality: '质量',
      player_tracks: '音轨',
      player_disabled: '已禁用',
      player_unknown: '未知',
      player_subs: '字幕',
      player_size_default_title: '默认',
      player_size_default_descr: '默认视频大小',
      player_size_cover_title: '扩展',
      player_size_cover_descr: '将视频扩展到全屏',
      player_size_fill_title: '填充',
      player_size_fill_descr: '使视频适合全屏',
      player_size_s115_title: '缩放 115%',
      player_size_s115_descr: '将视频放大 115%',
      player_size_s130_title: '缩放 130%',
      player_size_s130_descr: '将视频放大 130%',
      player_size_v115_title: '垂直 115%',
      player_size_v115_descr: '放大视频 115%',
      player_size_v130_title: '垂直 130%',
      player_size_v130_descr: '将视频放大 130%',
      player_video_size: '视频大小',
      player_playlist: '播放列表',
      player_error_one: '视频解码失败',
      player_error_two: '视频未找到或损坏',
      player_start_from: '继续浏览',
      player_not_found: '找不到播放器',
      player_lauch: '启动播放器',
      player_speed_default_title: '普通',
      player_speed_two_descr: '无声播放',
      player_video_speed: '播放速度',
      player_share_title: '分享',
      player_share_descr: '在另一台设备上播放此视频',
      player_normalization_power_title: '标准化功率',
      player_normalization_smooth_title: '标准化速度',
      player_normalization_step_low: '低的',
      player_normalization_step_medium: '平均',
      player_normalization_step_hight: '高',
      player_youtube_no_played: '抱歉，该视频在您所在的地区不可用，可能已被屏蔽或删除。',
      player_youtube_start_play: '要开始播放视频，请单击“播放”按钮',
      broadcast_open: '在另一台设备上打开卡片',
      broadcast_play: '选择要观看的设备',
      card_new_episode: '新系列',
      card_book_remove: '从书签中删除',
      card_book_add: '到书签',
      card_book_descr: '查看菜单（书签）',
      card_like_remove: '从收藏夹中删除',
      card_like_add: '喜欢',
      card_like_descr: '查看菜单（喜欢）',
      card_wath_remove: '从预期中删除',
      card_wath_add: '稍后观看',
      card_wath_descr: '查看菜单（稍后）',
      card_history_remove: '从历史记录中删除',
      card_history_add: '添加到历史记录',
      card_history_descr: '查看在菜单（历史）中',
      keyboard_listen: '说话，我在听...',
      keyboard_nomic: '没有麦克风访问权限',
      notice_new_quality: '新质量可用',
      notice_quality: '质量',
      notice_new_episode: '新系列',
      notice_none: '您还没有任何通知，请在 <b>www.cub.watch</b> 注册关注新剧集和发布。',
      notice_in_quality: 'As',
      notice_none_account: '你还没有任何通知，收藏该系列并等待新剧集的通知。',
      notice_none_system: '您目前没有任何通知。 当有新通知可用时，我们一定会通知您。',
      copy_link: '复制视频链接',
      copy_secuses: '链接复制到剪贴板',
      copy_error: '复制链接时出错',
      account_sync_to_profile: '所有书签将被移动到个人资料',
      account_sync_secuses: '所有书签已成功转移',
      account_profiles: '个人资料',
      account_profiles_empty: '无法获取个人资料列表',
      account_authorized: '已授权',
      account_logged_in: '您已登录',
      account_login_failed: '登录失败',
      account_login_wait: '等待登录',
      account_profile_main: '常规',
      account_export_secuses: '导出成功',
      account_export_fail: '导出错误',
      account_import_secuses: '导入成功',
      account_import_fail: '导入错误',
      account_imported: '导入',
      account_reload_after: '5 秒后重启',
      account_create: '使用 CUB 帐户发现更多机会。 在 <span class="account-modal__site">www.cub.watch</span> 注册并获得同步您的书签、时间码和其他 CUB 帐户功能的权限。',
      account_premium: '使用 CUB Premium 帐户发现更多功能。 增加对服务附加功能的限制和访问权限。',
      account_premium_more: '了解有关 CUB 高级版的更多信息',
      account_code_enter: '请输入六位验证码',
      account_code_error: '可能您输入了错误或已过期的验证码',
      account_code_wrong: '可能您输入了错误的格式',
      account_code_where: '请前往<span class="account-add-device__site">cub.watch/add</span>网站，并输入该网站上提供的验证码。',
      account_code_input: '输入验证码',
      settings_cub_signin_button: '登录',
      account_limited: '您已达到最大限制。 使用 CUB Premium 帐户提高限制。 在 <span class="account-modal__site">www.cub.watch/premium</span> 了解更多信息',
      network_noconnect: '没有网络连接',
      network_404: '未找到请求的页面。[404]',
      network_401: '授权失败',
      network_500: '内部服务器错误。[500]',
      network_parsererror: '请求的 JSON 解析失败。',
      network_timeout: '请求超时。',
      network_abort: '请求已中止。',
      network_error: '未知错误',
      size_zero: '0 字节',
      size_byte: '字节',
      size_kb: 'KB',
      size_mb: 'MB',
      size_gb: 'GB',
      size_tb: 'TB',
      size_pp: 'PB',
      speed_bit: '位',
      speed_kb: 'Kbps',
      speed_mb: 'Mbps',
      speed_gb: 'Gbit',
      speed_tb: 'Tbit',
      speed_pp: 'Pbit',
      month_1: '一月',
      month_2: '二月',
      month_3: '三月',
      month_4: '四月',
      month_5: '五月',
      month_6: '六月',
      month_7: '七月',
      month_8: '八月',
      month_9: '九月',
      month_10: '十月',
      month_11: '十一月',
      month_12: '十二月',
      day_1: '星期一',
      day_2: '星期二',
      day_3: '星期三',
      day_4: '星期四',
      day_5: '星期五',
      day_6: '星期六',
      day_7: '星期日',
      month_1_e: '一月',
      month_2_e: '二月',
      month_3_e: '三月',
      month_4_e: '四月',
      month_5_e: '五月',
      month_6_e: '六月',
      month_7_e: '七月',
      month_8_e: '八月',
      month_9_e: '九月',
      month_10_e: '十月',
      month_11_e: '十一月',
      month_12_e: '十二月',
      week_1: '星期一',
      week_2: '星期二',
      week_3: '星期三',
      week_4: '星期四',
      week_5: '星期五',
      week_6: '星期六',
      week_7: '星期天',
      extensions_enable: '启用',
      extensions_disable: '禁用',
      extensions_check: '检查状态',
      extensions_install: '安装',
      extensions_info: '关于',
      extensions_edit: '编辑',
      extensions_change_name: '更改名称',
      extensions_change_link: '更改链接',
      extensions_remove: '删除',
      extensions_set_name: '输入插件名称',
      extensions_set_url: '输入插件网址',
      extensions_ready: '此插件已安装',
      extensions_no_info: '无信息',
      extensions_no_name: '无标题',
      extensions_worked: '工作中',
      extensions_no_plugin: '插件未验证',
      extensions_add: '添加插件',
      extensions_from_memory: '安装在内存中',
      extensions_from_cub: '从 CUB 安装',
      extensions_from_popular: '流行插件',
      extensions_from_lib: '插件库',
      extensions_from_connected: '已连接插件',
      settings_webos_launcher: '应用程序启动',
      settings_webos_launcher_add_device: '设置为开始',
      settings_webos_launcher_remove_device: '从入门应用程序中删除',
      player_normalization: '正常化',
      change_source_on_cub: '将源更改为 CUB',
      settings_param_jackett_interview_all: '全部',
      settings_param_jackett_interview_healthy: '仅提供',
      settings_parser_jackett_interview: '投票跟踪器',
      title_ongoing: '进行中',
      title_pgrating: '年龄限制',
      settings_interface_card_interfice: '卡片界面',
      settings_interface_card_poster: '展示海报',
      title_card: '卡片',
      settings_param_card_interface_old: '老界面',
      settings_param_card_interface_new: '新界面',
      title_seasons: '季',
      title_episodes: '集',
      title_rewiews: '评论',
      settings_interface_glass: '玻璃',
      settings_interface_glass_descr: '以玻璃风格显示界面',
      settings_interface_black_style: '黑色风格',
      plugins_remove: '删除插件',
      settings_reset: '重置',
      title_channel: '渠道',
      input_detection_touch: '想切换到触摸控制？',
      input_detection_mouse: '想切换到鼠标控制？',
      input_detection_remote: '想切换到远程控制？',
      settings_interface_hide_outside_the_screen: '在屏幕外隐藏卡片',
      settings_interface_hide_outside_the_screen_descr: '这将加快 UI 渲染并提高性能。',
      https_text: '您使用的是 HTTPS 协议，在此协议下灯无法正常工作。 为了灯的正确操作，请使用具有 HTTP 协议的地址',
      extensions_hpu_best: '受欢迎的',
      extensions_hpu_recomend: '受到推崇的',
      extensions_hpu_theme: '主题',
      extensions_hpu_screensaver: '屏幕保护程序',
      extensions_hpu_video: '视频',
      extensions_hpu_control: '控制',
      extensions_hpu_other: '各种各样的',
      extensions_hpu_: '休息',
      title_author: '作者',
      title_buffer: '缓冲',
      settings_rest_screensaver_time: '多少分钟后启动屏保',
      time_h: 'h.',
      time_m: 'm.',
      time_s: 's.',
      settings_param_glass_easy: '透明的',
      settings_param_glass_medium: '半透明',
      settings_param_glass_blacked: '黑屏了',
      settings_interface_glass_opacity: '玻璃透明度',
      torrent_error_check_no_auth: '服务器响应请求，但授权失败。',
      settings_interface_card_cover: '显示封面',
      title_upcoming_episodes: '即将发布的剧集',
      settings_rest_cache_images: '图片缓存',
      settings_rest_cache_images_descr: '将海报和背景缓存到本地存储',
      settings_player_rewind_title: '倒带',
      settings_player_rewind_descr: '以秒为单位的倒带间隔',
      speedtest_connect: '连接',
      speedtest_test: '测试',
      speedtest_ready: '准备就绪',
      speedtest_button: '测试速度'
    };

    var langs = {};
    var keys = {};
    var lang_default = 'ru';
    Object.defineProperty(langs, 'ru', {
      get: function get() {
        return ru;
      }
    });
    Object.defineProperty(langs, 'uk', {
      get: function get() {
        return uk;
      }
    });
    Object.defineProperty(langs, 'en', {
      get: function get() {
        return en;
      }
    });
    Object.defineProperty(langs, 'be', {
      get: function get() {
        return be;
      }
    });
    Object.defineProperty(langs, 'zh', {
      get: function get() {
        return zh;
      }
    });
    Object.defineProperty(keys, 'ru', {
      get: function get() {
        return 'Русский';
      }
    });
    Object.defineProperty(keys, 'uk', {
      get: function get() {
        return 'Українська';
      }
    });
    Object.defineProperty(keys, 'en', {
      get: function get() {
        return 'English';
      }
    });
    Object.defineProperty(keys, 'be', {
      get: function get() {
        return 'Беларуская';
      }
    });
    Object.defineProperty(keys, 'zh', {
      get: function get() {
        return '简体中文';
      }
    });
    /**
     * Перевести
     * @param {string} name
     * @param {string} custom_code - ru/en/uk...
     * @returns
     */

    function translate(name, custom_code) {
      name = name + '';
      var code = custom_code || Storage.get('language', 'ru');
      if (!langs[code]) code = lang_default;

      if (name.indexOf('#{') >= 0) {
        return name.replace(/#{([a-z_0-9-]+)}/g, function (e, s) {
          return langs[code][s] || langs[lang_default][s] || s;
        });
      } else {
        return langs[code][name] || langs[lang_default][name] || name;
      }
    }
    /**
     * Добавить переводы
     * @param {{key_name:{en:string,ru:string}}} data
     */


    function add$b(data) {
      for (var name in data) {
        for (var code in data[name]) {
          if (langs[code]) {
            langs[code][name] = data[name][code];
          }
        }
      }
    }
    /**
     * Добавить перевод для кода
     * @param {string} code
     * @param {{key1:string,key2:string}} data
     */


    function AddTranslation(code, data) {
      if (!langs[code]) langs[code] = {};

      for (var name in data) {
        langs[code][name] = data[name];
      }
    }
    /**
     * Добавить коды
     * @param {{code_name:string}} new_codes
     */


    function addCodes(new_codes) {
      for (var i in new_codes) {
        keys[i] = new_codes[i];
        langs[i] = {};
      }
    }
    /**
     * Получить список кодов
     * @returns {{ru:string,en:string}}
     */


    function codes() {
      var all = {
        ru: keys.ru,
        uk: keys.uk,
        en: keys.en,
        be: keys.be,
        zh: keys.zh
      };

      for (var i in keys) {
        all[i] = keys[i];
      }

      return all;
    }

    var Lang = {
      translate: translate,
      add: add$b,
      codes: codes,
      addCodes: addCodes,
      AddTranslation: AddTranslation
    };

    var html$1r = "<div class=\"head\">\n    <div class=\"head__body\">\n        <div class=\"head__logo-icon\">\n            <img src=\"./img/logo-icon.svg\" />\n        </div>\n\n        <div class=\"head__split\"></div>\n\n<!--        <div class=\"head__logo\">-->\n<!--            <img src=\"./img/logo.svg\" />-->\n<!--        </div>-->\n\n        <div class=\"head__title\"></div>\n        \n        <div class=\"head__split\"></div>\n        \n        <div class=\"head__selected\"></div>\n        \n        <div style=\"margin-right: auto\"></div>\n        \n        <div class=\"head__actions\">\n            <div class=\"head__action head__settings selector open--search\">\n                <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n                    viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\">\n                        <path fill=\"currentColor\" d=\"M225.474,0C101.151,0,0,101.151,0,225.474c0,124.33,101.151,225.474,225.474,225.474\n                            c124.33,0,225.474-101.144,225.474-225.474C450.948,101.151,349.804,0,225.474,0z M225.474,409.323\n                            c-101.373,0-183.848-82.475-183.848-183.848S124.101,41.626,225.474,41.626s183.848,82.475,183.848,183.848\n                            S326.847,409.323,225.474,409.323z\"/>\n                        <path fill=\"currentColor\" d=\"M505.902,476.472L386.574,357.144c-8.131-8.131-21.299-8.131-29.43,0c-8.131,8.124-8.131,21.306,0,29.43l119.328,119.328\n                            c4.065,4.065,9.387,6.098,14.715,6.098c5.321,0,10.649-2.033,14.715-6.098C514.033,497.778,514.033,484.596,505.902,476.472z\"/>\n                </svg>\n            </div>\n\n            <div class=\"head__action head__settings selector open--broadcast\">\n                <svg viewBox=\"0 0 42 34\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M3.00006 3H39.0001V31H23.9777C23.9925 31.3315 24 31.6649 24 32C24 32.6742 23.9697 33.3413 23.9103 34H42.0001V0H6.10352e-05V10.0897C0.658765 10.0303 1.32584 10 2 10C2.33516 10 2.66856 10.0075 3.00006 10.0223V3Z\" fill=\"currentColor\"/>\n                <path d=\"M18.8836 34C18.9605 33.344 19 32.6766 19 32C19 22.6112 11.3888 15 2 15C1.32339 15 0.65602 15.0395 6.10352e-05 15.1164V18.1418C0.653248 18.0483 1.32098 18 2 18C9.73199 18 16 24.268 16 32C16 32.679 15.9517 33.3468 15.8582 34H18.8836Z\" fill=\"currentColor\"/>\n                <path d=\"M10.777 34C10.923 33.3568 11.0001 32.6874 11.0001 32C11.0001 27.0294 6.97062 23 2.00006 23C1.31267 23 0.643284 23.0771 6.10352e-05 23.223V34H10.777Z\" fill=\"currentColor\"/>\n                </svg>\n            \n            </div>\n\n            <div class=\"head__action selector open--settings\">\n                <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 368 368\" style=\"enable-background:new 0 0 368 368;\" xml:space=\"preserve\">\n                    <path fill=\"currentColor\" d=\"M344,144h-29.952c-2.512-8.2-5.8-16.12-9.792-23.664l21.16-21.16c4.528-4.528,7.024-10.56,7.024-16.984\n                        c0-6.416-2.496-12.448-7.024-16.976l-22.64-22.64c-9.048-9.048-24.888-9.072-33.952,0l-21.16,21.16\n                        c-7.536-3.992-15.464-7.272-23.664-9.792V24c0-13.232-10.768-24-24-24h-32c-13.232,0-24,10.768-24,24v29.952\n                        c-8.2,2.52-16.12,5.8-23.664,9.792l-21.168-21.16c-9.36-9.36-24.592-9.36-33.952,0l-22.648,22.64\n                        c-9.352,9.36-9.352,24.592,0,33.952l21.16,21.168c-3.992,7.536-7.272,15.464-9.792,23.664H24c-13.232,0-24,10.768-24,24v32\n                        C0,213.232,10.768,224,24,224h29.952c2.52,8.2,5.8,16.12,9.792,23.664l-21.16,21.168c-9.36,9.36-9.36,24.592,0,33.952\n                        l22.64,22.648c9.36,9.352,24.592,9.352,33.952,0l21.168-21.16c7.536,3.992,15.464,7.272,23.664,9.792V344\n                        c0,13.232,10.768,24,24,24h32c13.232,0,24-10.768,24-24v-29.952c8.2-2.52,16.128-5.8,23.664-9.792l21.16,21.168\n                        c9.072,9.064,24.912,9.048,33.952,0l22.64-22.64c4.528-4.528,7.024-10.56,7.024-16.976c0-6.424-2.496-12.448-7.024-16.976\n                        l-21.16-21.168c3.992-7.536,7.272-15.464,9.792-23.664H344c13.232,0,24-10.768,24-24v-32C368,154.768,357.232,144,344,144z\n                            M352,200c0,4.408-3.584,8-8,8h-36c-3.648,0-6.832,2.472-7.744,6c-2.832,10.92-7.144,21.344-12.832,30.976\n                        c-1.848,3.144-1.344,7.144,1.232,9.72l25.44,25.448c1.504,1.504,2.336,3.512,2.336,5.664c0,2.152-0.832,4.16-2.336,5.664\n                        l-22.64,22.64c-3.008,3.008-8.312,3.008-11.328,0l-25.44-25.44c-2.576-2.584-6.576-3.08-9.728-1.232\n                        c-9.616,5.68-20.04,10-30.968,12.824c-3.52,0.904-5.992,4.088-5.992,7.736v36c0,4.408-3.584,8-8,8h-32c-4.408,0-8-3.592-8-8v-36\n                        c0-3.648-2.472-6.832-6-7.744c-10.92-2.824-21.344-7.136-30.976-12.824c-1.264-0.752-2.664-1.112-4.064-1.112\n                        c-2.072,0-4.12,0.8-5.664,2.344l-25.44,25.44c-3.128,3.12-8.2,3.12-11.328,0l-22.64-22.64c-3.128-3.128-3.128-8.208,0-11.328\n                        l25.44-25.44c2.584-2.584,3.088-6.584,1.232-9.72c-5.68-9.632-10-20.048-12.824-30.976c-0.904-3.528-4.088-6-7.736-6H24\n                        c-4.408,0-8-3.592-8-8v-32c0-4.408,3.592-8,8-8h36c3.648,0,6.832-2.472,7.744-6c2.824-10.92,7.136-21.344,12.824-30.976\n                        c1.856-3.144,1.352-7.144-1.232-9.72l-25.44-25.44c-3.12-3.12-3.12-8.2,0-11.328l22.64-22.64c3.128-3.128,8.2-3.12,11.328,0\n                        l25.44,25.44c2.584,2.584,6.576,3.096,9.72,1.232c9.632-5.68,20.048-10,30.976-12.824c3.528-0.912,6-4.096,6-7.744V24\n                        c0-4.408,3.592-8,8-8h32c4.416,0,8,3.592,8,8v36c0,3.648,2.472,6.832,6,7.744c10.928,2.824,21.352,7.144,30.968,12.824\n                        c3.152,1.856,7.152,1.36,9.728-1.232l25.44-25.44c3.016-3.024,8.32-3.016,11.328,0l22.64,22.64\n                        c1.504,1.504,2.336,3.52,2.336,5.664s-0.832,4.16-2.336,5.664l-25.44,25.44c-2.576,2.584-3.088,6.584-1.232,9.72\n                        c5.688,9.632,10,20.048,12.832,30.976c0.904,3.528,4.088,6,7.736,6h36c4.416,0,8,3.592,8,8V200z\"/>\n                    \n                    <path fill=\"currentColor\" d=\"M184,112c-39.696,0-72,32.304-72,72s32.304,72,72,72c39.704,0,72-32.304,72-72S223.704,112,184,112z M184,240 c-30.88,0-56-25.12-56-56s25.12-56,56-56c30.872,0,56,25.12,56,56S214.872,240,184,240z\"/>\n                    \n                </svg>\n            </div>\n\n            <div class=\"head__action selector open--notice notice--icon\">\n                <svg enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path fill=\"currentColor\" d=\"m411 262.862v-47.862c0-69.822-46.411-129.001-110-148.33v-21.67c0-24.813-20.187-45-45-45s-45 20.187-45 45v21.67c-63.59 19.329-110 78.507-110 148.33v47.862c0 61.332-23.378 119.488-65.827 163.756-4.16 4.338-5.329 10.739-2.971 16.267s7.788 9.115 13.798 9.115h136.509c6.968 34.192 37.272 60 73.491 60 36.22 0 66.522-25.808 73.491-60h136.509c6.01 0 11.439-3.587 13.797-9.115s1.189-11.929-2.97-16.267c-42.449-44.268-65.827-102.425-65.827-163.756zm-170-217.862c0-8.271 6.729-15 15-15s15 6.729 15 15v15.728c-4.937-.476-9.94-.728-15-.728s-10.063.252-15 .728zm15 437c-19.555 0-36.228-12.541-42.42-30h84.84c-6.192 17.459-22.865 30-42.42 30zm-177.67-60c34.161-45.792 52.67-101.208 52.67-159.138v-47.862c0-68.925 56.075-125 125-125s125 56.075 125 125v47.862c0 57.93 18.509 113.346 52.671 159.138z\"/><path fill=\"currentColor\" d=\"m451 215c0 8.284 6.716 15 15 15s15-6.716 15-15c0-60.1-23.404-116.603-65.901-159.1-5.857-5.857-15.355-5.858-21.213 0s-5.858 15.355 0 21.213c36.831 36.831 57.114 85.8 57.114 137.887z\"/><path fill=\"currentColor\" d=\"m46 230c8.284 0 15-6.716 15-15 0-52.086 20.284-101.055 57.114-137.886 5.858-5.858 5.858-15.355 0-21.213-5.857-5.858-15.355-5.858-21.213 0-42.497 42.497-65.901 98.999-65.901 159.099 0 8.284 6.716 15 15 15z\"/></g></svg>\n            </div>\n\n            <div class=\"head__action hide selector open--profile\">\n                <img />\n            </div>\n\n            <div class=\"head__action selector hide full-screen\">\n                <svg width=\"25\" height=\"23\" viewBox=\"0 0 25 23\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M17 23H21C23.2091 23 25 21.2091 25 19V15H23V19C23 20.1046 22.1046 21 21 21H17V23Z\" fill=\"currentColor\"/>\n                <path d=\"M17 2H21C22.1046 2 23 2.89543 23 4V8H25V4C25 1.79086 23.2091 0 21 0H17V2Z\" fill=\"currentColor\"/>\n                <path d=\"M8 0L8 2H4C2.89543 2 2 2.89543 2 4V8H0V4C0 1.79086 1.79086 0 4 0H8Z\" fill=\"currentColor\"/>\n                <path d=\"M8 21V23H4C1.79086 23 0 21.2091 0 19V15H2V19C2 20.1046 2.89543 21 4 21H8Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n        </div>\n\n<!--        <div class=\"head__split\"></div>-->\n\n<!--        <div class=\"head__time\">-->\n<!--            <div class=\"head__time-now time&#45;&#45;clock\"></div>-->\n<!--            <div>-->\n<!--                <div class=\"head__time-date time&#45;&#45;full\"></div>-->\n<!--                <div class=\"head__time-week time&#45;&#45;week\"></div>-->\n<!--            </div>-->\n<!--        </div>-->\n    </div>\n</div>";

    var html$1q = "<div class=\"wrap layer--height layer--width\">\n    <div class=\"wrap__left layer--height\"></div>\n    <div class=\"wrap__content layer--height layer--width\"></div>\n</div>";

    var html$1p = "<div class=\"menu\">\n\n    <div class=\"menu__case\">\n        <ul class=\"menu__list\">\n<!--            <li class=\"menu__item selector\" data-action=\"main\">-->\n<!--                <div class=\"menu__ico\"><img src=\"./img/icons/menu/home.svg\" /></div>-->\n<!--                <div class=\"menu__text\">#{menu_main}</div>-->\n<!--            </li>-->\n\n            <li class=\"menu__item selector\" data-action=\"movie\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/movie.svg\" /></div>\n                <div class=\"menu__text\">#{menu_movies}</div>\n            </li>\n\n            <li class=\"menu__item selector\" data-action=\"tv\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/tv.svg\" /></div>\n                <div class=\"menu__text\">#{menu_tv}</div>\n            </li>\n\n<!--            <li class=\"menu__item selector\" data-action=\"catalog\">-->\n<!--                <div class=\"menu__ico\"><img src=\"./img/icons/menu/catalog.svg\" /></div>-->\n<!--                <div class=\"menu__text\">#{menu_catalog}</div>-->\n<!--            </li>-->\n            <li class=\"menu__item selector\" data-action=\"filter\">\n                <div class=\"menu__ico\">\n                    <svg height=\"36\" viewBox=\"0 0 38 36\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <rect x=\"1.5\" y=\"1.5\" width=\"35\" height=\"33\" rx=\"1.5\" stroke=\"white\" stroke-width=\"3\"/>\n                        <rect x=\"7\" y=\"8\" width=\"24\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                        <rect x=\"7\" y=\"16\" width=\"24\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                        <rect x=\"7\" y=\"25\" width=\"24\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                        <circle cx=\"13.5\" cy=\"17.5\" r=\"3.5\" fill=\"white\"/>\n                        <circle cx=\"23.5\" cy=\"26.5\" r=\"3.5\" fill=\"white\"/>\n                        <circle cx=\"21.5\" cy=\"9.5\" r=\"3.5\" fill=\"white\"/>\n                    </svg>\n                </div>\n                <div class=\"menu__text\">#{menu_filter}</div>\n            </li>\n<!--            <li class=\"menu__item selector\" data-action=\"collections\">-->\n<!--                <div class=\"menu__ico\"><img src=\"./img/icons/menu/catalog.svg\" /></div>-->\n<!--                <div class=\"menu__text\">#{menu_collections}</div>-->\n<!--            </li>-->\n\n<!--            <li class=\"menu__item selector\" data-action=\"relise\">-->\n<!--                <div class=\"menu__ico\">-->\n<!--                    <svg height=\"30\" viewBox=\"0 0 38 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">-->\n<!--                    <rect x=\"1.5\" y=\"1.5\" width=\"35\" height=\"27\" rx=\"1.5\" stroke=\"white\" stroke-width=\"3\"/>-->\n<!--                    <path d=\"M18.105 22H15.2936V16H9.8114V22H7V8H9.8114V13.6731H15.2936V8H18.105V22Z\" fill=\"white\"/>-->\n<!--                    <path d=\"M20.5697 22V8H24.7681C25.9676 8 27.039 8.27885 27.9824 8.83654C28.9321 9.38782 29.6724 10.1763 30.2034 11.2019C30.7345 12.2212 31 13.3814 31 14.6827V15.3269C31 16.6282 30.7376 17.7853 30.2128 18.7981C29.6943 19.8109 28.9602 20.5962 28.0105 21.1538C27.0609 21.7115 25.9895 21.9936 24.7962 22H20.5697ZM23.3811 10.3365V19.6827H24.7399C25.8395 19.6827 26.6798 19.3141 27.2608 18.5769C27.8419 17.8397 28.1386 16.7853 28.1511 15.4135V14.6731C28.1511 13.25 27.8637 12.1731 27.289 11.4423C26.7142 10.7051 25.8739 10.3365 24.7681 10.3365H23.3811Z\" fill=\"white\"/>-->\n<!--                    </svg>-->\n<!--                </div>-->\n<!--                <div class=\"menu__text\">#{menu_relises}</div>-->\n<!--            </li>-->\n\n<!--            <li class=\"menu__item selector\" data-action=\"anime\">-->\n<!--                <div class=\"menu__ico\">-->\n<!--                    <svg height=\"173\" viewBox=\"0 0 180 173\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">-->\n<!--                    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M126 3C126 18.464 109.435 31 89 31C68.5655 31 52 18.464 52 3C52 2.4505 52.0209 1.90466 52.0622 1.36298C21.3146 15.6761 0 46.8489 0 83C0 132.706 40.2944 173 90 173C139.706 173 180 132.706 180 83C180 46.0344 157.714 14.2739 125.845 0.421326C125.948 1.27051 126 2.13062 126 3ZM88.5 169C125.779 169 156 141.466 156 107.5C156 84.6425 142.314 64.6974 122 54.0966C116.6 51.2787 110.733 55.1047 104.529 59.1496C99.3914 62.4998 94.0231 66 88.5 66C82.9769 66 77.6086 62.4998 72.4707 59.1496C66.2673 55.1047 60.3995 51.2787 55 54.0966C34.6864 64.6974 21 84.6425 21 107.5C21 141.466 51.2208 169 88.5 169Z\" fill=\"white\"/>-->\n<!--                    <path d=\"M133 121.5C133 143.315 114.196 161 91 161C67.804 161 49 143.315 49 121.5C49 99.6848 67.804 116.5 91 116.5C114.196 116.5 133 99.6848 133 121.5Z\" fill=\"white\"/>-->\n<!--                    <path d=\"M72 81C72 89.8366 66.1797 97 59 97C51.8203 97 46 89.8366 46 81C46 72.1634 51.8203 65 59 65C66.1797 65 72 72.1634 72 81Z\" fill=\"white\"/>-->\n<!--                    <path d=\"M131 81C131 89.8366 125.18 97 118 97C110.82 97 105 89.8366 105 81C105 72.1634 110.82 65 118 65C125.18 65 131 72.1634 131 81Z\" fill=\"white\"/>-->\n<!--                    </svg>-->\n<!--                </div>-->\n<!--                <div class=\"menu__text\">#{menu_anime}</div>-->\n<!--            </li>-->\n        </ul>\n    </div>\n\n<!--    <div class=\"menu__split\"></div>-->\n\n    <div class=\"menu__case\">\n        <ul class=\"menu__list\">\n            <li class=\"menu__item selector\" data-action=\"favorite\" data-type=\"book\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/bookmark.svg\" /></div>\n                <div class=\"menu__text\">#{menu_bookmark}</div>\n            </li>\n\n            <li class=\"menu__item selector\" data-action=\"favorite\" data-type=\"like\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/like.svg\" /></div>\n                <div class=\"menu__text\">#{menu_like}</div>\n            </li>\n\n            <li class=\"menu__item selector\" data-action=\"favorite\" data-type=\"wath\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/time.svg\" /></div>\n                <div class=\"menu__text\">#{menu_time}</div>\n            </li>\n\n            <li class=\"menu__item selector\" data-action=\"favorite\" data-type=\"history\">\n                <div class=\"menu__ico\">\n                    <svg height=\"34\" viewBox=\"0 0 28 34\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"1.5\" y=\"1.5\" width=\"25\" height=\"31\" rx=\"2.5\" stroke=\"white\" stroke-width=\"3\"/>\n                    <rect x=\"6\" y=\"7\" width=\"9\" height=\"9\" rx=\"1\" fill=\"white\"/>\n                    <rect x=\"6\" y=\"19\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                    <rect x=\"6\" y=\"25\" width=\"11\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                    <rect x=\"17\" y=\"7\" width=\"5\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                    </svg>\n                </div>\n                <div class=\"menu__text\">#{menu_history}</div>\n            </li>\n\n<!--            <li class=\"menu__item selector\" data-action=\"subscribes\">-->\n<!--                <div class=\"menu__ico\">-->\n<!--                    <svg xmlns=\"http://www.w3.org/2000/svg\" height=\"512\" viewBox=\"0 0 59 59.5\" xml:space=\"preserve\"><g><g xmlns=\"http://www.w3.org/2000/svg\">-->\n<!--                        <path d=\"m48.5 20.5h-38a10.51 10.51 0 0 0 -10.5 10.5v18a10.51 10.51 0 0 0 10.5 10.5h38a10.51 10.51 0 0 0 10.5-10.5v-18a10.51 10.51 0 0 0 -10.5-10.5zm-9.23 16.06-10.42 10.44a2.51 2.51 0 0 1 -3.54 0l-5.58-5.6a2.5 2.5 0 1 1 3.54-3.54l3.81 3.82 8.65-8.68a2.5 2.5 0 0 1 3.54 3.53z\" fill=\"#ffffff\"></path>-->\n<!--                        <path d=\"m49.5 16h-40a3 3 0 0 1 0-6h40a3 3 0 0 1 0 6z\" fill=\"#ffffff\"></path>-->\n<!--                        <path d=\"m45.5 6h-32a3 3 0 0 1 0-6h32a3 3 0 0 1 0 6z\" fill=\"#ffffff\"></path>-->\n<!--                    </svg>-->\n<!--                </div>-->\n<!--                <div class=\"menu__text\">#{title_subscribes}</div>-->\n<!--            </li>-->\n\n<!--            <li class=\"menu__item selector\" data-action=\"timetable\">-->\n<!--                <div class=\"menu__ico\">-->\n<!--                    <svg height=\"28\" viewBox=\"0 0 28 28\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">-->\n<!--                        <rect x=\"1.5\" y=\"3.5\" width=\"25\" height=\"23\" rx=\"2.5\" stroke=\"white\" stroke-width=\"3\"/>-->\n<!--                        <rect x=\"6\" width=\"3\" height=\"7\" rx=\"1.5\" fill=\"white\"/>-->\n<!--                        <rect x=\"19\" width=\"3\" height=\"7\" rx=\"1.5\" fill=\"white\"/>-->\n<!--                        <circle cx=\"7\" cy=\"12\" r=\"2\" fill=\"white\"/>-->\n<!--                        <circle cx=\"7\" cy=\"19\" r=\"2\" fill=\"white\"/>-->\n<!--                        <circle cx=\"14\" cy=\"12\" r=\"2\" fill=\"white\"/>-->\n<!--                        <circle cx=\"14\" cy=\"19\" r=\"2\" fill=\"white\"/>-->\n<!--                        <circle cx=\"21\" cy=\"12\" r=\"2\" fill=\"white\"/>-->\n<!--                        <circle cx=\"21\" cy=\"19\" r=\"2\" fill=\"white\"/>-->\n<!--                    </svg>-->\n<!--                </div>-->\n<!--                <div class=\"menu__text\">#{menu_timeline}</div>-->\n<!--            </li>-->\n\n<!--            <li class=\"menu__item selector\" data-action=\"mytorrents\">-->\n<!--                <div class=\"menu__ico\">-->\n<!--                    <svg height=\"34\" viewBox=\"0 0 28 34\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">-->\n<!--                    <rect x=\"1.5\" y=\"1.5\" width=\"25\" height=\"31\" rx=\"2.5\" stroke=\"white\" stroke-width=\"3\"/>-->\n<!--                    <rect x=\"6\" y=\"7\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"white\"/>-->\n<!--                    <rect x=\"6\" y=\"13\" width=\"16\" height=\"3\" rx=\"1.5\" fill=\"white\"/>-->\n<!--                    </svg>-->\n<!--                </div>-->\n<!--                <div class=\"menu__text\">#{menu_torrents}</div>-->\n<!--            </li>-->\n        </ul>\n    </div>\n\n<!--    <div class=\"menu__split\"></div>-->\n\n    <div class=\"menu__case\">\n        <ul class=\"menu__list\">\n            <li class=\"menu__item selector\" data-action=\"settings\">\n                <div class=\"menu__ico\"><img src=\"./img/icons/menu/settings.svg\" /></div>\n                <div class=\"menu__text\">#{menu_settings}</div>\n            </li>\n\n<!--            <li class=\"menu__item selector\" data-action=\"about\">-->\n<!--                <div class=\"menu__ico\"><img src=\"./img/icons/menu/info.svg\" /></div>-->\n<!--                <div class=\"menu__text\">#{menu_about}</div>-->\n<!--            </li>-->\n\n            <li class=\"menu__item selector\" data-action=\"console\">\n                <div class=\"menu__ico\">\n                    <svg height=\"30\" viewBox=\"0 0 38 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"1.5\" y=\"1.5\" width=\"35\" height=\"27\" rx=\"1.5\" stroke=\"white\" stroke-width=\"3\"/>\n                    <rect x=\"6\" y=\"7\" width=\"25\" height=\"3\" fill=\"white\"/>\n                    <rect x=\"6\" y=\"13\" width=\"13\" height=\"3\" fill=\"white\"/>\n                    <rect x=\"6\" y=\"19\" width=\"19\" height=\"3\" fill=\"white\"/>\n                    </svg>\n                </div>\n                <div class=\"menu__text\">#{menu_console}</div>\n            </li>\n        </ul>\n    </div>\n</div>";

    var html$1o = "<div class=\"activitys layer--width\">\n    <div class=\"activitys__slides\"></div>\n</div>";

    var html$1n = "<div class=\"activity layer--width\">\n    <div class=\"activity__body\"></div>\n    <div class=\"activity__loader\"></div>\n</div>";

    var html$1m = "<div class=\"scroll\">\n    <div class=\"scroll__content\">\n        <div class=\"scroll__body\">\n            \n        </div>\n    </div>\n</div>";

    var html$1l = "<div class=\"settings\">\n    <div class=\"settings__layer\"></div>\n    <div class=\"settings__content layer--height\">\n        <div class=\"settings__head\">\n            <div class=\"settings__title\">#{title_settings}</div>\n        </div>\n        <div class=\"settings__body\"></div>\n    </div>\n</div>";

    var html$1k = "<div>\n    <div class=\"settings-folder selector\" data-component=\"account\">\n        <div class=\"settings-folder__icon\">\n            <svg height=\"169\" viewBox=\"0 0 172 169\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <circle cx=\"85.765\" cy=\"47.5683\" r=\"15.5683\" stroke=\"white\" stroke-width=\"12\"/>\n                <path d=\"M121.53 112C121.53 92.2474 105.518 76.2349 85.7651 76.2349C66.0126 76.2349 50 92.2474 50 112\" stroke=\"white\" stroke-width=\"12\"/>\n                <rect x=\"44\" y=\"125\" width=\"84\" height=\"16\" rx=\"8\" fill=\"white\"/>\n                <rect x=\"6\" y=\"6\" width=\"160\" height=\"157\" rx=\"21\" stroke=\"white\" stroke-width=\"12\"/>\n            </svg>\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_account}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"interface\">\n        <div class=\"settings-folder__icon\">\n            <img src=\"./img/icons/settings/panel.svg\" />\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_interface}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"player\">\n        <div class=\"settings-folder__icon\">\n            <img src=\"./img/icons/settings/player.svg\" />\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_player}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"parser\">\n        <div class=\"settings-folder__icon\">\n            <img src=\"./img/icons/settings/parser.svg\" />\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_parser}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"server\">\n        <div class=\"settings-folder__icon\">\n            <img src=\"./img/icons/settings/server.svg\" />\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_torrserver}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"tmdb\">\n        <div class=\"settings-folder__icon\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" height=\"32\" viewBox=\"0 0 32 32\">\n                <path fill=\"white\" d=\"M25.99 29.198c2.807 0 4.708-1.896 4.708-4.708v-19.781c0-2.807-1.901-4.708-4.708-4.708h-19.979c-2.807 0-4.708 1.901-4.708 4.708v27.292l2.411-2.802v-24.49c0.005-1.266 1.031-2.292 2.297-2.292h19.974c1.266 0 2.292 1.026 2.292 2.292v19.781c0 1.266-1.026 2.292-2.292 2.292h-16.755l-2.417 2.417-0.016-0.016zM11.714 15.286h-2.26v7.599h2.26c5.057 0 5.057-7.599 0-7.599zM11.714 21.365h-0.734v-4.557h0.734c2.958 0 2.958 4.557 0 4.557zM11.276 13.854h1.516v-6.083h1.891v-1.505h-5.302v1.505h1.896zM18.75 9.599l-2.625-3.333h-0.49v7.714h1.542v-4.24l1.573 2.042 1.578-2.042-0.010 4.24h1.542v-7.714h-0.479zM21.313 19.089c0.474-0.333 0.677-0.922 0.698-1.5 0.031-1.339-0.807-2.307-2.156-2.307h-3.005v7.609h3.005c1.24-0.010 2.245-1.021 2.245-2.26v-0.036c0-0.62-0.307-1.172-0.781-1.5zM18.37 16.802h1.354c0.432 0 0.698 0.339 0.698 0.766 0.031 0.406-0.286 0.76-0.698 0.76h-1.354zM19.724 21.37h-1.354v-1.516h1.37c0.411 0 0.745 0.333 0.745 0.745v0.016c0 0.417-0.333 0.755-0.75 0.755z\"/>\n            </svg>\n        </div>\n        <div class=\"settings-folder__name\">TMDB</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"plugins\" data-static=\"true\">\n        <div class=\"settings-folder__icon\">\n            <svg height=\"44\" viewBox=\"0 0 44 44\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect width=\"21\" height=\"21\" rx=\"2\" fill=\"white\"/>\n            <mask id=\"path-2-inside-1_154:24\" fill=\"white\">\n            <rect x=\"2\" y=\"27\" width=\"17\" height=\"17\" rx=\"2\"/>\n            </mask>\n            <rect x=\"2\" y=\"27\" width=\"17\" height=\"17\" rx=\"2\" stroke=\"white\" stroke-width=\"6\" mask=\"url(#path-2-inside-1_154:24)\"/>\n            <rect x=\"27\" y=\"2\" width=\"17\" height=\"17\" rx=\"2\" fill=\"white\"/>\n            <rect x=\"27\" y=\"34\" width=\"17\" height=\"3\" fill=\"white\"/>\n            <rect x=\"34\" y=\"44\" width=\"17\" height=\"3\" transform=\"rotate(-90 34 44)\" fill=\"white\"/>\n            </svg>\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_plugins}</div>\n    </div>\n    <div class=\"settings-folder selector\" data-component=\"more\">\n        <div class=\"settings-folder__icon\">\n            <img src=\"./img/icons/settings/more.svg\" />\n        </div>\n        <div class=\"settings-folder__name\">#{settings_main_rest}</div>\n    </div>\n    \n</div>";

    var html$1j = "<div>\n    <div class=\"settings-param selector\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_interface_lang}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"light_version\">\n        <div class=\"settings-param__name\">#{settings_interface_type}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"interface_size\">\n        <div class=\"settings-param__name\">#{settings_interface_size}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_interface_background}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"background\">\n        <div class=\"settings-param__name\">#{settings_interface_background_use}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"background_type\">\n        <div class=\"settings-param__name\">#{settings_interface_background_type}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_interface_performance}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"animation\">\n        <div class=\"settings-param__name\">#{settings_interface_animation}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_interface_animation_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"mask\">\n        <div class=\"settings-param__name\">#{settings_interface_attenuation}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_interface_attenuation_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"scroll_type\">\n        <div class=\"settings-param__name\">#{settings_interface_scroll}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"card_views_type\">\n        <div class=\"settings-param__name\">#{settings_interface_view_card}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_interface_view_card_descr}</div>\n    </div>\n\n</div>";

    var html$1i = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"parser_use\">\n        <div class=\"settings-param__name\">#{settings_parser_use}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_use_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"parser_torrent_type\">\n        <div class=\"settings-param__name\">#{settings_parser_type}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>Jackett</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"jackett_url\" placeholder=\"#{settings_parser_jackett_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_parser_jackett_link}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_jackett_link_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"jackett_key\" placeholder=\"#{settings_parser_jackett_key_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_parser_jackett_key}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_jackett_key_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title is--torllok\"><span>Torlook</span></div> \n\n    <div class=\"settings-param selector is--torllok\" data-type=\"toggle\" data-name=\"torlook_parse_type\">\n        <div class=\"settings-param__name\">#{settings_parser_torlook_type}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector is--torllok\" data-type=\"input\" data-name=\"parser_website_url\" placeholder=\"#{settings_parser_scraperapi_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_parser_scraperapi_link}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_scraperapi_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{more}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"select\" data-name=\"parse_lang\">\n        <div class=\"settings-param__name\">#{settings_parser_search}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_search_descr}</div>\n    </div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"parse_timeout\">\n        <div class=\"settings-param__name\">#{settings_parser_timeout_title}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_timeout_descr}</div>\n    </div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"parse_in_search\">\n        <div class=\"settings-param__name\">#{settings_parser_in_search}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_parser_in_search_descr}</div>\n    </div>\n</div>";

    var html$1h = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"torrserver_use_link\">\n        <div class=\"settings-param__name\">#{settings_server_link}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_server_links}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"torrserver_url\" placeholder=\"#{settings_server_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_server_link_one}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_server_link_one_descr}</div>\n        <div class=\"settings-param__status\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"torrserver_url_two\" placeholder=\"#{settings_server_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_server_link_two}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_server_link_two_descr}</div>\n        <div class=\"settings-param__status\"></div>\n    </div>\n    \n    <div class=\"settings-param-title\"><span>#{settings_server_additionally}</span></div>\n\n    <div class=\"settings-param selector is--android\" data-type=\"toggle\" data-name=\"internal_torrclient\">\n        <div class=\"settings-param__name\">#{settings_server_client}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_server_client_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"torrserver_savedb\">\n        <div class=\"settings-param__name\">#{settings_server_base}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_server_base_descr}</div>\n    </div>\n    \n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"torrserver_preload\">\n        <div class=\"settings-param__name\">#{settings_server_preload}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_server_preload_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_server_auth}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"torrserver_auth\">\n        <div class=\"settings-param__name\">#{settings_server_password_use}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"torrserver_login\" placeholder=\"#{settings_server_not_specified}\">\n        <div class=\"settings-param__name\">#{settings_server_login}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"torrserver_password\" data-string=\"true\" placeholder=\"#{settings_server_not_specified}\">\n        <div class=\"settings-param__name\">#{settings_server_password}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n</div>";

    var html$1g = "<div>\n    <div class=\"settings-param selector is--player\" data-type=\"toggle\" data-name=\"player\">\n        <div class=\"settings-param__name\">#{settings_player_type}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_type_descr}</div>\n    </div>\n    \n    <div class=\"settings-param selector is--android\" data-type=\"button\" data-name=\"reset_player\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_player_reset}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_reset_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector is--nw\" data-type=\"input\" data-name=\"player_nw_path\" placeholder=\"\">\n        <div class=\"settings-param__name\">#{settings_player_path}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_path_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"player_normalization\">\n        <div class=\"settings-param__name\">#{settings_player_normalization}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_normalization_descr}</div>\n    </div>\n    \n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"playlist_next\">\n        <div class=\"settings-param__name\">#{settings_player_next_episode}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_next_episode_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"player_timecode\">\n        <div class=\"settings-param__name\">#{settings_player_timecode}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_timecode_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"player_scale_method\">\n        <div class=\"settings-param__name\">#{settings_player_scale}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_scale_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"player_hls_method\">\n        <div class=\"settings-param__name\">#{settings_player_hls_title}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_hls_descr}</div>\n    </div>\n    \n    <div class=\"is--has_subs\">\n        <div class=\"settings-param-title\"><span>#{settings_player_subs}</span></div>\n\n        <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"subtitles_start\">\n            <div class=\"settings-param__name\">#{settings_player_subs_use}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{settings_player_subs_use_descr}</div>\n        </div>\n\n        <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"subtitles_size\">\n            <div class=\"settings-param__name\">#{settings_player_subs_size}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{settings_player_subs_size_descr}</div>\n        </div>\n        \n        <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"subtitles_stroke\">\n            <div class=\"settings-param__name\">#{settings_player_subs_stroke_use}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{settings_player_subs_stroke_use_descr}</div>\n        </div>\n        \n        <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"subtitles_backdrop\">\n            <div class=\"settings-param__name\">#{settings_player_subs_backdrop_use}</div>\n            <div class=\"settings-param__value\"></div>\n            <div class=\"settings-param__descr\">#{settings_player_subs_backdrop_use_descr}</div>\n        </div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{more}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"video_quality_default\">\n        <div class=\"settings-param__name\">#{settings_player_quality}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_player_quality_descr}</div>\n    </div>\n</div>";

    var html$1f = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"start_page\">\n        <div class=\"settings-param__name\">#{settings_rest_start}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_start_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"source\">\n        <div class=\"settings-param__name\">#{settings_rest_source_use}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_source_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_rest_screensaver}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"screensaver\">\n        <div class=\"settings-param__name\">#{settings_rest_screensaver_use}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"screensaver_type\">\n        <div class=\"settings-param__name\">#{settings_rest_screensaver_type}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_rest_helper}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"helper\">\n        <div class=\"settings-param__name\">#{settings_rest_helper_use}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector helper--start-again\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_rest_helper_reset}</div>\n    </div>\n    \n    <div class=\"settings-param-title\"><span>#{more}</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"pages_save_total\">\n        <div class=\"settings-param__name\">#{settings_rest_pages}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_pages_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"select\" data-name=\"time_offset\">\n        <div class=\"settings-param__name\">#{settings_rest_time}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"select\" data-name=\"navigation_type\">\n        <div class=\"settings-param__name\">#{settings_rest_navigation}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"select\" data-name=\"keyboard_type\">\n        <div class=\"settings-param__name\">#{settings_rest_keyboard}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"card_quality\">\n        <div class=\"settings-param__name\">#{settings_rest_card_quality}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_card_quality_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"card_episodes\">\n        <div class=\"settings-param__name\">#{settings_rest_card_episodes}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_card_episodes_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"device_name\" placeholder=\"#{settings_rest_device_placeholder}\">\n        <div class=\"settings-param__name\">#{settings_rest_device}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector clear-storage\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_rest_cache}</div>\n        <div class=\"settings-param__value\">#{settings_rest_cache_descr}</div>\n    </div>\n</div>";

    var html$1e = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"tmdb_lang\">\n        <div class=\"settings-param__name\">TMDB</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_tmdb_lang}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"poster_size\">\n        <div class=\"settings-param__name\">#{settings_rest_tmdb_posters}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"proxy_tmdb_auto\">\n        <div class=\"settings-param__name\">#{settings_rest_tmdb_prox_auto}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"proxy_tmdb\" data-children=\"proxy\">\n        <div class=\"settings-param__name\">#{settings_rest_tmdb_prox}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector\" data-parent=\"proxy\" data-type=\"input\" data-name=\"tmdb_proxy_api\" placeholder=\"#{settings_rest_tmdb_example} api.proxy.com\">\n        <div class=\"settings-param__name\">Api</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_tmdb_api_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector\" data-parent=\"proxy\" data-type=\"input\" data-name=\"tmdb_proxy_image\" placeholder=\"#{settings_rest_tmdb_example} image.proxy.com\">\n        <div class=\"settings-param__name\">Image</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_rest_tmdb_image_descr}</div>\n    </div>\n</div>";

    var html$1d = "<div>\n    <div class=\"settings-param selector\" data-name=\"plugins\" data-static=\"true\" data-notice=\"#{settings_plugins_notice}\">\n        <div class=\"settings-param__name\">#{settings_plugins_add}</div>\n        <div class=\"settings-param__descr\">#{settings_plugins_add_descr}</div>\n    </div>\n    <div class=\"settings-param selector\" data-name=\"install\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_plugins_install}</div>\n        <div class=\"settings-param__descr\">#{settings_plugins_install_descr}</div>\n    </div>\n</div>";

    var html$1c = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"cloud_use\">\n        <div class=\"settings-param__name\">\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0434\u0430\u0451\u0442 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u044C \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u0430\u0448\u0438 \u0437\u0430\u043A\u043B\u0430\u0434\u043A\u0438, \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432, \u043C\u0435\u0442\u043A\u0438 \u0438 \u0442\u0430\u0439\u043C-\u043A\u043E\u0434\u044B. \u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044F \u043F\u043E \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044E https://github.com/yumata/lampa/wiki</div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F</span></div>\n\n    <div class=\"settings-param selector\" data-type=\"input\" data-name=\"cloud_token\" placeholder=\"\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\">\n        <div class=\"settings-param__name\">Token</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>\u0421\u0442\u0430\u0442\u0443\u0441</span></div>\n\n    <div class=\"settings-param selector settings--cloud-status\" data-static=\"true\">\n        <div class=\"settings-param__name\"></div>\n        <div class=\"settings-param__descr\"></div>\n    </div>\n</div>";

    var html$1b = "<div>\n    <div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"account_use\">\n        <div class=\"settings-param__name\">#{settings_cub_sync}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{settings_cub_sync_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title settings--account-user hide\"><span>#{settings_cub_account}</span> <span class=\"settings-param__label hide\">Premium</span></div>\n\n    <div class=\"settings-param selector settings--account-user settings--account-user-info hide\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_logged_in_as}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector settings--account-user settings--account-user-profile hide\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_profile}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param selector settings--account-user settings--account-user-out hide\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_logout}</div>\n    </div>\n\n    <div class=\"settings-param-title settings--account-signin\"><span>#{settings_cub_signin}</span></div>\n\n    <div class=\"settings-param selector settings--account-signin settings--account-device-add\" data-type=\"button\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_signin_button}</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>#{settings_cub_status}</span></div>\n\n    <div class=\"settings-param selector settings--account-status\" data-static=\"true\">\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\"></div>\n    </div>\n\n    <div class=\"settings-param-title settings--account-user hide\"><span>#{more}</span></div>\n\n    <div class=\"settings-param selector settings--account-user settings--account-user-sync hide\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_sync_btn}</div>\n        <div class=\"settings-param__value\">#{settings_cub_sync_btn_descr}</div>\n    </div>\n\n    <div class=\"settings-param selector settings--account-user settings--account-user-backup hide\" data-static=\"true\">\n        <div class=\"settings-param__name\">#{settings_cub_backup}</div>\n        <div class=\"settings-param__value\">#{settings_cub_backup_descr}</div>\n    </div>\n\n    <div class=\"settings-param-title\"><span>CUB Premium</span></div>\n\n    <div class=\"selectbox-item selector selectbox-item--checkbox settings--account-premium\" data-static=\"true\">\n        <div class=\"selectbox-item__title\">#{settings_cub_sync_filters}</div>\n        <div class=\"selectbox-item__checkbox\"></div>\n    </div>\n    <div class=\"selectbox-item selector selectbox-item--checkbox settings--account-premium\" data-static=\"true\">\n        <div class=\"selectbox-item__title\">#{settings_cub_sync_calendar}</div>\n        <div class=\"selectbox-item__checkbox\"></div>\n    </div>\n    <div class=\"selectbox-item selector selectbox-item--checkbox settings--account-premium\" data-static=\"true\">\n        <div class=\"selectbox-item__title\">#{settings_cub_sync_timecodes}</div>\n        <div class=\"selectbox-item__checkbox\"></div>\n    </div>\n    <div class=\"selectbox-item selector selectbox-item--checkbox settings--account-premium\" data-static=\"true\">\n        <div class=\"selectbox-item__title\">#{settings_cub_sync_search}</div>\n        <div class=\"selectbox-item__checkbox\"></div>\n    </div>\n</div>";

    var html$1a = "<div class=\"items-line\">\n    <div class=\"items-line__head\">\n        <div class=\"items-line__title\">{title}</div>\n    </div>\n    <div class=\"items-line__body\"></div>\n</div>";

    var html$19 = "<div class=\"card selector\">\n    <div class=\"card__view\">\n        <img src=\"./img/img_load.svg\" class=\"card__img\" />\n\n        <div class=\"card__icons\">\n            <div class=\"card__icons-inner\">\n                \n            </div>\n        </div>\n    </div>\n\n    <div class=\"card__title\">{title}</div>\n    <div class=\"card__age\">{release_year}</div>\n</div>";

    var html$18 = "<div class=\"card-parser selector\">\n    <div class=\"card-parser__title\">{Title}</div>\n\n    <div class=\"card-parser__footer\">\n        <div class=\"card-parser__details\">\n            <div>#{torrent_item_seeds}: <span>{Seeders}</span></div>\n            <div>#{torrent_item_grabs}: <span>{Peers}</span></div>\n        </div>\n        <div class=\"card-parser__size\">{size}</div>\n    </div>\n</div>";

    var html$17 = "<div class=\"card-watched\">\n    <div class=\"card-watched__inner\">\n        <div class=\"card-watched__title\">#{title_watched}</div>\n        <div class=\"card-watched__body\"></div>\n    </div>\n</div>";

    var html$16 = "<div class=\"full-start\">\n\n    <img class=\"full-start__background\">\n\n    <div class=\"full-start__body\">\n        <div class=\"full-start__right\">\n            <div class=\"full-start__poster\">\n                <img src=\"./img/img_broken.svg\" class=\"full-start__img\" />\n            </div>\n        </div>\n\n        <div class=\"full-start__left\">\n            <div class=\"full-start__deta\">\n                <div class=\"info__rate\"><span>{r_themovie}</span><div>TMDB</div></div>\n\n                <div class=\"full-start__rate rate--imdb hide\"><div></div><div>IMDB</div></div>\n                <div class=\"full-start__rate rate--kp hide\"><div></div><div>KP</div></div>\n\n                <div class=\"full-start__pg hide\"></div>\n            </div>\n\n            <div class=\"full-start__title\">{title}</div>\n            <div class=\"full-start__title-original\">{original_title}</div>\n\n            <div class=\"full-start__tags\">\n                <div class=\"full-start__tag tag--quality hide\">\n                    <div></div>\n                </div>\n                <div class=\"full-start__tag tag--year hide\">\n                    <img src=\"./img/icons/add.svg\" /> <div></div>\n                </div>\n                <div class=\"full-start__tag tag--genres\">\n                    <img src=\"./img/icons/pulse.svg\" /> <div>{genres}</div>\n                </div>\n                <div class=\"full-start__tag tag--time\">\n                    <img src=\"./img/icons/time.svg\" /> <div>{time}</div>\n                </div>\n                <div class=\"full-start__tag hide is--serial\">\n                    <img src=\"./img/icons/menu/catalog.svg\" /> <div>{seasons}</div>\n                </div>\n                <div class=\"full-start__tag hide is--serial\">\n                    <img src=\"./img/icons/menu/movie.svg\" /> <div>{episodes}</div>\n                </div>\n                <div class=\"full-start__tag tag--episode hide\">\n                    <img src=\"./img/icons/time.svg\" /> <div></div>\n                </div>\n            </div>\n\n            <div class=\"full-start__icons\">\n                <div class=\"info__icon icon--book selector\" data-type=\"book\"></div>\n                <div class=\"info__icon icon--like selector\" data-type=\"like\"></div>\n                <div class=\"info__icon icon--wath selector\" data-type=\"wath\"></div>\n                <div class=\"info__icon icon--subscribe selector hide\" data-type=\"subscribe\">\n                    <svg enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path fill=\"currentColor\" d=\"m411 262.862v-47.862c0-69.822-46.411-129.001-110-148.33v-21.67c0-24.813-20.187-45-45-45s-45 20.187-45 45v21.67c-63.59 19.329-110 78.507-110 148.33v47.862c0 61.332-23.378 119.488-65.827 163.756-4.16 4.338-5.329 10.739-2.971 16.267s7.788 9.115 13.798 9.115h136.509c6.968 34.192 37.272 60 73.491 60 36.22 0 66.522-25.808 73.491-60h136.509c6.01 0 11.439-3.587 13.797-9.115s1.189-11.929-2.97-16.267c-42.449-44.268-65.827-102.425-65.827-163.756zm-170-217.862c0-8.271 6.729-15 15-15s15 6.729 15 15v15.728c-4.937-.476-9.94-.728-15-.728s-10.063.252-15 .728zm15 437c-19.555 0-36.228-12.541-42.42-30h84.84c-6.192 17.459-22.865 30-42.42 30zm-177.67-60c34.161-45.792 52.67-101.208 52.67-159.138v-47.862c0-68.925 56.075-125 125-125s125 56.075 125 125v47.862c0 57.93 18.509 113.346 52.671 159.138z\"></path><path fill=\"currentColor\" d=\"m451 215c0 8.284 6.716 15 15 15s15-6.716 15-15c0-60.1-23.404-116.603-65.901-159.1-5.857-5.857-15.355-5.858-21.213 0s-5.858 15.355 0 21.213c36.831 36.831 57.114 85.8 57.114 137.887z\"></path><path fill=\"currentColor\" d=\"m46 230c8.284 0 15-6.716 15-15 0-52.086 20.284-101.055 57.114-137.886 5.858-5.858 5.858-15.355 0-21.213-5.857-5.858-15.355-5.858-21.213 0-42.497 42.497-65.901 98.999-65.901 159.099 0 8.284 6.716 15 15 15z\"></path></g></svg>\n                </div>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"full-start__footer\">\n            <div class=\"full-start__buttons-scroll\"></div>\n\n            <div class=\"full-start__buttons\">\n                <div class=\"full-start__button view--torrent hide\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 30.051 30.051\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\" class=\"\">\n                        <path d=\"M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069   c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532   c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z\" fill=\"currentColor\"/>\n                        <path d=\"M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021   C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518   c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z\" fill=\"currentColor\"/>\n                    </svg>\n\n                    <span>#{full_torrents}</span>\n                </div>\n\n                <div class=\"full-start__button selector view--trailer\">\n                    <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\">\n                        <path fill=\"currentColor\" d=\"M482.909,67.2H29.091C13.05,67.2,0,80.25,0,96.291v319.418C0,431.75,13.05,444.8,29.091,444.8h453.818\n                            c16.041,0,29.091-13.05,29.091-29.091V96.291C512,80.25,498.95,67.2,482.909,67.2z M477.091,409.891H34.909V102.109h442.182\n                            V409.891z\"/>\n                        <rect fill=\"currentColor\" x=\"126.836\" y=\"84.655\" width=\"34.909\" height=\"342.109\"/>\n                        <rect fill=\"currentColor\" x=\"350.255\" y=\"84.655\" width=\"34.909\" height=\"342.109\"/>\n                        <rect fill=\"currentColor\" x=\"367.709\" y=\"184.145\" width=\"126.836\" height=\"34.909\"/>\n                        <rect fill=\"currentColor\" x=\"17.455\" y=\"184.145\" width=\"126.836\" height=\"34.909\"/>\n                        <rect fill=\"currentColor\" x=\"367.709\" y=\"292.364\" width=\"126.836\" height=\"34.909\"/>\n                        <rect fill=\"currentColor\" x=\"17.455\" y=\"292.364\" width=\"126.836\" height=\"34.909\"/>\n                    </svg>\n\n                    <span>#{full_trailers}</span>\n                </div>\n            </div>\n    </div>\n</div>";

    var html$15 = "<div class=\"full-descr\">\n    <div class=\"full-descr__left\">\n        <div class=\"full-descr__text\">{text}</div>\n\n        <div class=\"full-descr__line full--genres\">\n            <div class=\"full-descr__line-name\">#{full_genre}</div>\n            <div class=\"full-descr__line-body\">{genres}</div>\n        </div>\n\n        <div class=\"full-descr__line full--companies\">\n            <div class=\"full-descr__line-name\">#{full_production}</div>\n            <div class=\"full-descr__line-body\">{companies}</div>\n        </div>\n    </div>\n\n    <div class=\"full-descr__right\">\n        <div class=\"full-descr__info\">\n            <div class=\"full-descr__info-name\">#{full_date_of_release}</div>\n            <div class=\"full-descr__info-body\">{relise}</div>\n        </div>\n\n        <div class=\"full-descr__info\">\n            <div class=\"full-descr__info-name\">#{full_budget}</div>\n            <div class=\"full-descr__info-body\">{budget}</div>\n        </div>\n\n        <div class=\"full-descr__info\">\n            <div class=\"full-descr__info-name\">#{full_countries}</div>\n            <div class=\"full-descr__info-body\">{countries}</div>\n        </div>\n    </div>\n</div>";

    var html$14 = "<div class=\"full-person selector\">\n    <div style=\"background-image: url('{img}');\" class=\"full-person__photo\"></div>\n\n    <div class=\"full-person__body\">\n        <div class=\"full-person__name\">{name}</div>\n        <div class=\"full-person__role\">{role}</div>\n    </div>\n</div>";

    var html$13 = "<div class=\"full-review selector\">\n    <div class=\"full-review__text\">{text}</div>\n\n    <div class=\"full-review__footer\">#{full_like}: {like_count}</div>\n</div>";

    var html$12 = "<div class=\"full-episode selector\">\n    <div class=\"full-episode__left\">\n        <div class=\"full-episode__img\">\n            <img />\n        </div>\n    </div>\n\n    <div class=\"full-episode__body\">\n        <div class=\"full-episode__name\">{name}</div>\n        <div class=\"full-episode__date\">{date}</div>\n    </div>\n</div>";

    var html$11 = "<div class=\"player\">\n    \n</div>";

    var html$10 = "<div class=\"player-panel\">\n\n    <div class=\"player-panel__body\">\n        <div class=\"player-panel__timeline-wrapper\">\n          <div class=\"player-panel__timeline selector\">\n            <div class=\"player-panel__peding\"></div>\n            <div class=\"player-panel__position\"><div></div></div>\n            <div class=\"player-panel__time hide\"></div>\n        </div>\n\n        <div class=\"player-panel__line\">\n            <div class=\"player-panel__timenow\"></div>\n            <div class=\"player-panel__timeend\"></div>\n          </div>\n        </div>\n\n        <div class=\"player-panel__line\">\n            <div class=\"player-panel__left\">\n                <div class=\"player-panel__prev button selector\">\n                    <svg width=\"23\" height=\"24\" viewBox=\"0 0 23 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M2.75 13.7698C1.41666 13 1.41667 11.0755 2.75 10.3057L20 0.34638C21.3333 -0.42342 23 0.538831 23 2.07843L23 21.997C23 23.5366 21.3333 24.4989 20 23.7291L2.75 13.7698Z\" fill=\"currentColor\"/>\n                    <rect x=\"6\" y=\"24\" width=\"6\" height=\"24\" rx=\"2\" transform=\"rotate(180 6 24)\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__next button selector\">\n                    <svg width=\"23\" height=\"24\" viewBox=\"0 0 23 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M20.25 10.2302C21.5833 11 21.5833 12.9245 20.25 13.6943L3 23.6536C1.66666 24.4234 -6.72981e-08 23.4612 0 21.9216L8.70669e-07 2.00298C9.37967e-07 0.463381 1.66667 -0.498867 3 0.270933L20.25 10.2302Z\" fill=\"currentColor\"/>\n                    <rect x=\"17\" width=\"6\" height=\"24\" rx=\"2\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n\n                <div class=\"player-panel__next-episode-name hide\"></div>\n            </div>\n            <div class=\"player-panel__center\">\n                <div class=\"player-panel__tstart button selector\">\n                    <svg width=\"35\" height=\"24\" viewBox=\"0 0 35 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M14.75 10.2302C13.4167 11 13.4167 12.9245 14.75 13.6943L32 23.6536C33.3333 24.4234 35 23.4612 35 21.9216L35 2.00298C35 0.463381 33.3333 -0.498867 32 0.270933L14.75 10.2302Z\" fill=\"currentColor\"/>\n                    <path d=\"M1.75 10.2302C0.416665 11 0.416667 12.9245 1.75 13.6943L19 23.6536C20.3333 24.4234 22 23.4612 22 21.9216L22 2.00298C22 0.463381 20.3333 -0.498867 19 0.270933L1.75 10.2302Z\" fill=\"currentColor\"/>\n                    <rect width=\"6\" height=\"24\" rx=\"2\" transform=\"matrix(-1 0 0 1 6 0)\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__rprev button selector\">\n                    <svg width=\"35\" height=\"25\" viewBox=\"0 0 35 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M14 10.7679C12.6667 11.5377 12.6667 13.4622 14 14.232L31.25 24.1913C32.5833 24.9611 34.25 23.9989 34.25 22.4593L34.25 2.5407C34.25 1.0011 32.5833 0.0388526 31.25 0.808653L14 10.7679Z\" fill=\"currentColor\"/>\n                    <path d=\"M0.999998 10.7679C-0.333335 11.5377 -0.333333 13.4622 1 14.232L18.25 24.1913C19.5833 24.9611 21.25 23.9989 21.25 22.4593L21.25 2.5407C21.25 1.0011 19.5833 0.0388526 18.25 0.808653L0.999998 10.7679Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__playpause button selector\">\n                    <div>\n                        <svg width=\"22\" height=\"25\" viewBox=\"0 0 22 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <path d=\"M21 10.7679C22.3333 11.5377 22.3333 13.4622 21 14.232L3.75 24.1913C2.41666 24.9611 0.75 23.9989 0.75 22.4593L0.750001 2.5407C0.750001 1.0011 2.41667 0.0388526 3.75 0.808653L21 10.7679Z\" fill=\"currentColor\"/>\n                        </svg>\n                    </div>\n                    <div>\n                        <svg width=\"19\" height=\"25\" viewBox=\"0 0 19 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <rect width=\"6\" height=\"25\" rx=\"2\" fill=\"currentColor\"/>\n                        <rect x=\"13\" width=\"6\" height=\"25\" rx=\"2\" fill=\"currentColor\"/>\n                        </svg>                    \n                    </div>\n                </div>\n                <div class=\"player-panel__rnext button selector\">\n                    <svg width=\"35\" height=\"25\" viewBox=\"0 0 35 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M20.25 10.7679C21.5833 11.5377 21.5833 13.4622 20.25 14.232L3 24.1913C1.66666 24.9611 -6.72981e-08 23.9989 0 22.4593L8.70669e-07 2.5407C9.37967e-07 1.0011 1.66667 0.0388526 3 0.808653L20.25 10.7679Z\" fill=\"currentColor\"/>\n                    <path d=\"M33.25 10.7679C34.5833 11.5377 34.5833 13.4622 33.25 14.232L16 24.1913C14.6667 24.9611 13 23.9989 13 22.4593L13 2.5407C13 1.0011 14.6667 0.0388526 16 0.808653L33.25 10.7679Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__tend button selector\">\n                    <svg width=\"35\" height=\"24\" viewBox=\"0 0 35 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M20.25 10.2302C21.5833 11 21.5833 12.9245 20.25 13.6943L3 23.6536C1.66666 24.4234 -6.72981e-08 23.4612 0 21.9216L8.70669e-07 2.00298C9.37967e-07 0.463381 1.66667 -0.498867 3 0.270933L20.25 10.2302Z\" fill=\"currentColor\"/>\n                    <path d=\"M33.25 10.2302C34.5833 11 34.5833 12.9245 33.25 13.6943L16 23.6536C14.6667 24.4234 13 23.4612 13 21.9216L13 2.00298C13 0.463381 14.6667 -0.498867 16 0.270933L33.25 10.2302Z\" fill=\"currentColor\"/>\n                    <rect x=\"29\" width=\"6\" height=\"24\" rx=\"2\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n            </div>\n            <div class=\"player-panel__right\">\n                <div class=\"player-panel__quality button selector\">auto</div>\n                <div class=\"player-panel__playlist button selector\">\n                    <svg width=\"25\" height=\"25\" viewBox=\"0 0 25 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"5\" width=\"5\" height=\"25\" rx=\"2\" transform=\"rotate(-90 0 5)\" fill=\"currentColor\"/>\n                    <rect y=\"15\" width=\"5\" height=\"25\" rx=\"2\" transform=\"rotate(-90 0 15)\" fill=\"currentColor\"/>\n                    <rect y=\"25\" width=\"5\" height=\"25\" rx=\"2\" transform=\"rotate(-90 0 25)\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__subs button selector hide\">\n                    <svg width=\"23\" height=\"25\" viewBox=\"0 0 23 25\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M22.4357 20.0861C20.1515 23.0732 16.5508 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0C16.5508 0 20.1515 1.9268 22.4357 4.9139L18.8439 7.84254C17.2872 6.09824 15.0219 5 12.5 5C7.80558 5 5 7.80558 5 12.5C5 17.1944 7.80558 20 12.5 20C15.0219 20 17.2872 18.9018 18.8439 17.1575L22.4357 20.0861Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__tracks button selector hide\">\n                    <svg width=\"24\" height=\"31\" viewBox=\"0 0 24 31\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect x=\"5\" width=\"14\" height=\"23\" rx=\"7\" fill=\"currentColor\"/>\n                    <path d=\"M3.39272 18.4429C3.08504 17.6737 2.21209 17.2996 1.44291 17.6073C0.673739 17.915 0.299615 18.7879 0.607285 19.5571L3.39272 18.4429ZM23.3927 19.5571C23.7004 18.7879 23.3263 17.915 22.5571 17.6073C21.7879 17.2996 20.915 17.6737 20.6073 18.4429L23.3927 19.5571ZM0.607285 19.5571C2.85606 25.179 7.44515 27.5 12 27.5V24.5C8.55485 24.5 5.14394 22.821 3.39272 18.4429L0.607285 19.5571ZM12 27.5C16.5549 27.5 21.1439 25.179 23.3927 19.5571L20.6073 18.4429C18.8561 22.821 15.4451 24.5 12 24.5V27.5Z\" fill=\"currentColor\"/>\n                    <rect x=\"10\" y=\"25\" width=\"4\" height=\"6\" rx=\"2\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__pip button selector\">\n                    <svg width=\"25\" height=\"23\" viewBox=\"0 0 25 23\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M4 2H21C22.1046 2 23 2.89543 23 4V11H25V4C25 1.79086 23.2091 0 21 0H4C1.79086 0 0 1.79086 0 4V19C0 21.2091 1.79086 23 4 23H9V21H4C2.89543 21 2 20.1046 2 19V4C2 2.89543 2.89543 2 4 2Z\" fill=\"currentColor\"/>\n                    <path d=\"M11.0988 12.2064C11.7657 12.3811 12.3811 11.7657 12.2064 11.0988L11.2241 7.34718C11.0494 6.68023 10.2157 6.46192 9.72343 6.95423L6.95422 9.72344C6.46192 10.2157 6.68022 11.0494 7.34717 11.2241L11.0988 12.2064Z\" fill=\"currentColor\"/>\n                    <path d=\"M7.53735 9.45591C8.06025 9.97881 8.91363 9.97322 9.44343 9.44342C9.97322 8.91362 9.97882 8.06024 9.45592 7.53734L6.93114 5.01257C6.40824 4.48967 5.55486 4.49526 5.02506 5.02506C4.49527 5.55485 4.48967 6.40823 5.01257 6.93113L7.53735 9.45591Z\" fill=\"currentColor\"/>\n                    <rect x=\"12\" y=\"14\" width=\"13\" height=\"9\" rx=\"2\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__settings button selector\">\n                    <svg width=\"22\" height=\"23\" viewBox=\"0 0 22 23\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M19.3973 12.6213L21.7828 14.5245C21.9976 14.7028 22.0598 15.0133 21.9184 15.2605L19.6572 19.2453C19.5159 19.4925 19.222 19.5903 18.9676 19.4925L16.1525 18.3368C15.5703 18.7968 14.9315 19.1763 14.2419 19.4695L13.8179 22.517C13.7727 22.7872 13.5409 23 13.2583 23H8.73601C8.45339 23 8.22159 22.7872 8.17638 22.517L7.75242 19.4695C7.06279 19.1763 6.42404 18.7911 5.84178 18.3368L3.02667 19.4925C2.77229 19.596 2.47838 19.4925 2.33704 19.2453L0.0758898 15.2605C-0.0654487 15.0075 -0.00323221 14.697 0.211558 14.5245L2.59704 12.6213C2.55183 12.2532 2.51791 11.8795 2.51791 11.5C2.51791 11.1205 2.55183 10.7468 2.59704 10.3787L0.211558 8.47548C-0.00323221 8.29726 -0.0654487 7.98676 0.0758898 7.73949L2.33709 3.75474C2.47838 3.50747 2.77234 3.40974 3.02672 3.50747L5.84183 4.66322C6.42404 4.20324 7.06285 3.82374 7.75247 3.53049L8.17644 0.483001C8.22164 0.212768 8.45344 0 8.73607 0H13.2583C13.5409 0 13.7727 0.212768 13.8236 0.483001L14.2476 3.53049C14.9372 3.82374 15.576 4.20895 16.1582 4.66322L18.9733 3.50747C19.2277 3.40397 19.5216 3.50747 19.663 3.75474L21.9241 7.73949C22.0654 7.99248 22.0032 8.30298 21.7884 8.47548L19.3973 10.3787C19.4425 10.7468 19.4764 11.1205 19.4764 11.5C19.4764 11.8795 19.4425 12.2532 19.3973 12.6213ZM11 17.3385C14.1356 17.3385 16.6774 14.8037 16.6774 11.6769C16.6774 8.55014 14.1356 6.01538 11 6.01538C7.86445 6.01538 5.32258 8.55014 5.32258 11.6769C5.32258 14.8037 7.86445 17.3385 11 17.3385Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n                <div class=\"player-panel__fullscreen button selector\">\n                    <svg width=\"25\" height=\"23\" viewBox=\"0 0 25 23\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <path d=\"M17 23H21C23.2091 23 25 21.2091 25 19V15H23V19C23 20.1046 22.1046 21 21 21H17V23Z\" fill=\"currentColor\"/>\n                    <path d=\"M17 2H21C22.1046 2 23 2.89543 23 4V8H25V4C25 1.79086 23.2091 0 21 0H17V2Z\" fill=\"currentColor\"/>\n                    <path d=\"M8 0L8 2H4C2.89543 2 2 2.89543 2 4V8H0V4C0 1.79086 1.79086 0 4 0H8Z\" fill=\"currentColor\"/>\n                    <path d=\"M8 21V23H4C1.79086 23 0 21.2091 0 19V15H2V19C2 20.1046 2.89543 21 4 21H8Z\" fill=\"currentColor\"/>\n                    </svg>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>";

    var html$$ = "<div class=\"player-video\">\n    <div class=\"player-video__display\"></div>\n    <div class=\"player-video__loader\"></div>\n    <div class=\"player-video__paused hide\">\n        Paused\n    </div>\n    <div class=\"player-video__subtitles hide\">\n        <div class=\"player-video__subtitles-text\"></div>\n    </div>\n    <div class=\"player-video__rewind-icon\">\n            <i class=\"left-triangle triangle\">\u25C0\u25C0\u25C0</i>\n            <span class=\"rewind\">-10 sec</span>\n    </div>\n    <div class=\"player-video__forward-icon\">\n            <i class=\"right-triangle triangle\">\u25B6\u25B6\u25B6</i>\n            <span class=\"forward\">+10 sec</span>\n    </div>\n</div>";

    var html$_ = "<div class=\"player-info\">\n    <div class=\"player-info__body\">\n        <div class=\"player-info__line\">\n            <div class=\"player-info__name\"></div>\n            <div class=\"player-info__time\"><span class=\"time--clock\"></span></div>\n        </div>\n\n        <div class=\"player-info__values\">\n            <div class=\"value--size\">\n                <span>#{loading}...</span>\n            </div>\n            <div class=\"value--stat\">\n                <span></span>\n            </div>\n            <div class=\"value--speed\">\n                <span></span>\n            </div>\n        </div>\n\n        <div class=\"player-info__error hide\"></div>\n    </div>\n</div>";

    var html$Z = "<div class=\"selectbox\">\n    <div class=\"selectbox__layer\"></div>\n    <div class=\"selectbox__content layer--height\">\n        <div class=\"selectbox__head\">\n            <div class=\"selectbox__title\"></div>\n        </div>\n        <div class=\"selectbox__body\"></div>\n    </div>\n</div>";

    var html$Y = "<div class=\"selectbox-item selector\">\n    <div class=\"selectbox-item__title\">{title}</div>\n    <div class=\"selectbox-item__subtitle\">{subtitle}</div>\n</div>";

    var html$X = "<div class=\"selectbox-item selectbox-item--icon selector\">\n    <div class=\"selectbox-item__icon\">{icon}</div>\n    <div>\n        <div class=\"selectbox-item__title\">{title}</div>\n        <div class=\"selectbox-item__subtitle\">{subtitle}</div>\n    </div>\n</div>";

    var html$W = "<div class=\"info layer--width\">\n    <div class=\"info__rate\"><span></span></div>\n    <div class=\"info__left\">\n        <div class=\"info__title\"></div>\n        <div class=\"info__title-original\"></div>\n    </div>\n    <div class=\"info__right\">\n        <div class=\"info__icon icon--book\"></div>\n        <div class=\"info__icon icon--like\"></div>\n        <div class=\"info__icon icon--wath\"></div>\n    </div>\n</div>";

    var html$V = "<div>\n    <div class=\"simple-button selector filter--search\">\n            <svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n            viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\">\n        <g>\n            <path fill=\"currentColor\" d=\"M225.474,0C101.151,0,0,101.151,0,225.474c0,124.33,101.151,225.474,225.474,225.474\n                c124.33,0,225.474-101.144,225.474-225.474C450.948,101.151,349.804,0,225.474,0z M225.474,409.323\n                c-101.373,0-183.848-82.475-183.848-183.848S124.101,41.626,225.474,41.626s183.848,82.475,183.848,183.848\n                S326.847,409.323,225.474,409.323z\"/>\n        </g>\n        <g>\n            <path fill=\"currentColor\" d=\"M505.902,476.472L386.574,357.144c-8.131-8.131-21.299-8.131-29.43,0c-8.131,8.124-8.131,21.306,0,29.43l119.328,119.328\n                c4.065,4.065,9.387,6.098,14.715,6.098c5.321,0,10.649-2.033,14.715-6.098C514.033,497.778,514.033,484.596,505.902,476.472z\"/>\n        </g>\n\n        </svg>\n\n<!--        <span>#{filter_clarify}</span>-->\n    </div>\n    <div class=\"simple-button simple-button--filter selector filter--sort\">\n        <span>#{filter_sorted}</span><div class=\"hide\"></div>\n    </div>\n\n    <div class=\"simple-button simple-button--filter selector filter--filter\">\n        <span>#{filter_filtred}</span><div class=\"hide\"></div>\n    </div>\n</div>";

    var html$U = "<div class=\"card-more selector\">\n    <div class=\"card-more__box\">\n        <div class=\"card-more__title\">\n            #{more}\n        </div>\n    </div>\n</div>";

    var html$T = "<div class=\"search__body\">\n    <div class=\"search__input\">#{search_input}...</div>\n    <div class=\"search__keypad\"><div class=\"simple-keyboard\"></div></div>\n    <div class=\"search__history\" data-area=\"history\"></div>\n    <div class=\"search__sources\" style=\"display: none\" data-area=\"sources\"></div>\n    <div class=\"search__results\"></div>\n</div>";

    var html$S = "<div class=\"settings-input\">\n    <div class=\"settings-input__content\">\n        <div class=\"settings-input__input\"></div>\n\n        <div class=\"simple-keyboard\"></div>\n\n        <div class=\"settings-input__links\">#{settings_input_links}</div>\n    </div>\n</div>";

    var html$R = "<div class=\"modal\">\n    <div class=\"modal__content\">\n        <div class=\"modal__head\">\n            <div class=\"modal__title\">{title}</div>\n        </div>\n        <div class=\"modal__body\">\n            \n        </div>\n    </div>\n</div>";

    var html$Q = "<div class=\"company\">\n    <div class=\"company__name\">{name}</div>\n    <div class=\"company__headquarters\">#{company_headquarters}: {headquarters}</div>\n    <div class=\"company__homepage\">#{company_homepage}: {homepage}</div>\n    <div class=\"company__country\">#{company_country}: {origin_country}</div>\n</div>";

    var html$P = "<div class=\"modal-loading\">\n    \n</div>";

    var html$O = "<div class=\"modal-pending\">\n    <div class=\"modal-pending__loading\"></div>\n    <div class=\"modal-pending__text\">{text}</div>\n</div>";

    var html$N = "<div class=\"person-start\">\n\n    <div class=\"person-start__body\">\n        <div class=\"person-start__right\">\n            <div class=\"person-start__poster\">\n                <img src=\"{img}\" class=\"person-start__img\" />\n            </div>\n        </div>\n\n        <div class=\"person-start__left\">\n            <div class=\"person-start__tags\">\n                <div class=\"person-start__tag\">\n                    <img src=\"./img/icons/pulse.svg\" /> <div>{birthday}</div>\n                </div>\n            </div>\n            \n            <div class=\"person-start__name\">{name}</div>\n            <div class=\"person-start__place\">{place}</div>\n\n            <div class=\"person-start__descr\">{descr}</div>\n\n\n            \n        </div>\n    </div>\n\n    <div class=\"full-start__buttons hide\">\n        <div class=\"full-start__button selector\">\n            <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\">\n                <g>\n                    <g>\n                        <path fill=\"currentColor\" d=\"M436.742,180.742c-41.497,0-75.258,33.761-75.258,75.258s33.755,75.258,75.258,75.258\n                            C478.239,331.258,512,297.503,512,256C512,214.503,478.239,180.742,436.742,180.742z M436.742,294.246\n                            c-21.091,0-38.246-17.155-38.246-38.246s17.155-38.246,38.246-38.246s38.246,17.155,38.246,38.246\n                            S457.833,294.246,436.742,294.246z\"/>\n                    </g>\n                </g>\n                <g>\n                    <g>\n                        <path fill=\"currentColor\" d=\"M256,180.742c-41.497,0-75.258,33.761-75.258,75.258s33.761,75.258,75.258,75.258c41.503,0,75.258-33.755,75.258-75.258\n                            C331.258,214.503,297.503,180.742,256,180.742z M256,294.246c-21.091,0-38.246-17.155-38.246-38.246s17.155-38.246,38.246-38.246\n                            s38.246,17.155,38.246,38.246S277.091,294.246,256,294.246z\"/>\n                    </g>\n                </g>\n                <g>\n                    <g>\n                        <path fill=\"currentColor\" d=\"M75.258,180.742C33.761,180.742,0,214.503,0,256c0,41.503,33.761,75.258,75.258,75.258\n                            c41.497,0,75.258-33.755,75.258-75.258C150.516,214.503,116.755,180.742,75.258,180.742z M75.258,294.246\n                            c-21.091,0-38.246-17.155-38.246-38.246s17.155-38.246,38.246-38.246c21.091,0,38.246,17.155,38.246,38.246\n                            S96.342,294.246,75.258,294.246z\"/>\n                    </g>\n                </g>\n            </svg>\n        </div>\n\n        <div class=\"full-start__icons\">\n            <div class=\"info__icon icon--like\"></div>\n        </div>\n    </div>\n</div>";

    var html$M = "<div class=\"empty\">\n    <div class=\"empty__img selector\"></div>\n    <div class=\"empty__title\">{title}</div>\n    <div class=\"empty__descr\">{descr}</div>\n</div>";

    var html$L = "<div class=\"notice selector\">\n    <div class=\"notice__head\">\n        <div class=\"notice__title\">{title}</div>\n        <div class=\"notice__time\">{time}</div>\n    </div>\n    \n    <div class=\"notice__descr\">{descr}</div>\n</div>";

    var html$K = "<div class=\"notice notice--card selector\">\n    <div class=\"notice__left\">\n        <div class=\"notice__img\">\n            <img src=\"{img}\" />\n        </div>\n    </div>\n    <div class=\"notice__body\">\n        <div class=\"notice__head\">\n            <div class=\"notice__title\">{title}</div>\n            <div class=\"notice__time\">{time}</div>\n        </div>\n        \n        <div class=\"notice__descr\">{descr}</div>\n    </div>\n</div>";

    var html$J = "<div class=\"torrent-item selector\">\n    <div class=\"torrent-item__title\">{title}</div>\n    <div class=\"torrent-item__details\">\n        <div class=\"torrent-item__date\">{date}</div>\n        <div class=\"torrent-item__tracker\">{tracker}</div>\n\n        <div class=\"torrent-item__bitrate bitrate\">#{torrent_item_bitrate}: <span>{bitrate} #{torrent_item_mb}</span></div>\n        <div class=\"torrent-item__seeds\">#{torrent_item_seeds}: <span>{seeds}</span></div>\n        <div class=\"torrent-item__grabs\">#{torrent_item_grabs}: <span>{grabs}</span></div>\n        \n        <div class=\"torrent-item__size\">{size}</div>\n    </div>\n</div>";

    var html$I = "<div class=\"torrent-file selector\">\n    <div class=\"torrent-file__title\">{title}</div>\n    <div class=\"torrent-file__size\">{size}</div>\n</div>";

    var html$H = "<div class=\"files\">\n    <div class=\"files__left\">\n        <div class=\"full-start__poster selector\">\n            <img src=\"{img}\" class=\"full-start__img\" />\n        </div>\n\n        <div class=\"files__info\">\n            <div class=\"files__title\">{title}</div>\n            <div class=\"files__title-original\">{original_title}</div>\n        </div>\n    </div>\n    <div class=\"files__body\">\n        \n    </div>\n</div>";

    var html$G = "<div class=\"about\">\n    <div>#{about_text}</div>\n\n\n    <div class=\"about__contacts\">\n        <div>\n            <small>#{about_channel}</small><br>\n            @lampa_channel\n        </div>\n\n        <div>\n            <small>#{about_group}</small><br>\n            @lampa_group\n        </div>\n\n        <div>\n            <small>#{about_version}</small><br>\n            <span class=\"version_app\"></span>\n        </div>\n\n        <div class=\"hide platform_android\">\n            <small>#{about_version} Android</small><br>\n            <span class=\"version_android\"></span>\n        </div>\n    </div>\n\n    <div class=\"about__contacts\">\n        <div>\n            <small>#{about_donate}</small><br>\n            www.boosty.to/lampatv\n        </div>\n    </div>\n</div>";

    var html$F = "<div class=\"error\">\n    <div class=\"error__ico\"></div>\n    <div class=\"error__body\">\n        <div class=\"error__title\">{title}</div>\n        <div class=\"error__text\">{text}</div>\n    </div>\n</div>";

    var html$E = "<div class=\"error\">\n    <div class=\"error__ico\"></div>\n    <div class=\"error__body\">\n        <div class=\"error__title\">{title}</div>\n        <div class=\"error__text\">{text}</div>\n    </div>\n</div>\n\n<div class=\"torrent-error noconnect\">\n    <div>\n        <div>\u041F\u0440\u0438\u0447\u0438\u043D\u044B</div>\n        <ul>\n            <li>\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0430\u0434\u0440\u0435\u0441: <code>{ip}</code></li>\n            <li class=\"nocorect\">\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0430\u0434\u0440\u0435\u0441 <code>{ip}</code> \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u043C!</li>\n            <li>\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043E\u0442\u0432\u0435\u0442: <code>{echo}</code></li>\n        </ul>\n    </div>\n\n    <div>\n        <div>\u041A\u0430\u043A \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E?</div>\n        <ul>\n            <li>\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0430\u0434\u0440\u0435\u0441: <code>192.168.0.\u0445\u0445\u0445:8090</code></li>\n            <li>\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0432\u0435\u0440\u0441\u0438\u044E Matrix</li>\n        </ul>\n    </div>\n\n    <div>\n        <div>\u041A\u0430\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C?</div>\n        <ul>\n            <li>\u041D\u0430 \u044D\u0442\u043E\u043C \u0436\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435, \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0438 \u0437\u0430\u0439\u0434\u0438\u0442\u0435 \u043F\u043E \u0430\u0434\u0440\u0435\u0441\u0443 <code>{ip}/echo</code></li>\n            <li>\u0415\u0441\u043B\u0438 \u0436\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u0442, \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D \u043B\u0438 TorrServe, \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0435\u0433\u043E.</li>\n            <li>\u0415\u0441\u043B\u0438 \u0436\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043E\u0442\u0432\u0435\u0442\u0438\u043B, \u0443\u0431\u0435\u0434\u0438\u0442\u0435\u0441\u044C \u0447\u0442\u043E \u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0435\u0441\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u0430 <code>MatriX</code></li>\n        </ul>\n    </div>\n</div>";

    var html$D = "<div class=\"error\">\n    <div class=\"error__ico\"></div>\n    <div class=\"error__body\">\n        <div class=\"error__title\">{title}</div>\n        <div class=\"error__text\">{text}</div>\n    </div>\n</div>\n\n<div class=\"torrent-error noconnect\">\n    <div>\n        <div>\u041F\u0440\u0438\u0447\u0438\u043D\u044B</div>\n        <ul>\n            <li>\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043F\u0438\u043D\u0433 \u0432\u0435\u0440\u043D\u0443\u043B \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442</li>\n            <li>\u041E\u0442\u0432\u0435\u0442 \u043E\u0442 TorServer: <code>{echo}</code></li>\n        </ul>\n    </div>\n\n    <div>\n        <div>\u0427\u0442\u043E \u0434\u0435\u043B\u0430\u0442\u044C?</div>\n        <ul>\n            <li>\u0423\u0431\u0435\u0434\u0438\u0442\u0435\u0441\u044C \u0447\u0442\u043E \u0443 \u0432\u0430\u0441 \u0441\u0442\u043E\u0438\u0442 \u0432\u0435\u0440\u0441\u0438\u044F Matrix</li>\n        </ul>\n    </div>\n\n    <div>\n        <div>\u041A\u0430\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C?</div>\n        <ul>\n            <li>\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0438 \u0437\u0430\u0439\u0434\u0438\u0442\u0435 \u043F\u043E \u0430\u0434\u0440\u0435\u0441\u0443 <code>{ip}/echo</code></li>\n            <li>\u0423\u0431\u0435\u0434\u0438\u0442\u0435\u0441\u044C \u0447\u0442\u043E \u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0435\u0441\u0442\u044C \u043D\u0430\u043B\u0438\u0447\u0438\u0435 \u043A\u043E\u0434\u0430 <code>MatriX</code></li>\n        </ul>\n    </div>\n</div>";

    var html$C = "<div class=\"error\">\n    <div class=\"error__ico\"></div>\n    <div class=\"error__body\">\n        <div class=\"error__title\">{title}</div>\n        <div class=\"error__text\">{text}</div>\n    </div>\n</div>\n\n<div class=\"torrent-error noconnect\">\n    <div>\n        <div>#{torent_nohash_reasons}</div>\n        <ul>\n            <li>#{torent_nohash_reason_one}</li>\n            <li>#{torent_nohash_reason_two}: {echo}</li>\n            <li>#{torent_nohash_reason_three}: <code>{url}</code></li>\n        </ul>\n    </div>\n\n    <div class=\"is--jackett\">\n        <div>#{torent_nohash_do}</div>\n        <ul>\n            <li>#{torent_nohash_do_one}</li>\n            <li>#{torent_nohash_do_two}</li>\n            <li>#{torent_nohash_do_three}</li>\n        </ul>\n    </div>\n\n    <div class=\"is--torlook\">\n        <div>#{torent_nohash_do}</div>\n        <ul>\n            <li>#{torent_nohash_do_four}</li>\n            <li>#{torent_nohash_do_five}</li>\n        </ul>\n    </div>\n</div>";

    var html$B = "<div class=\"torrent-install\">\n    <div class=\"torrent-install__left\">\n        <img src=\"https://yumata.github.io/lampa/img/ili/tv.png\" class=\"torrent-install\"/>\n    </div>\n    <div class=\"torrent-install__details\">\n        <div class=\"torrent-install__title\">#{torrent_install_need}</div>\n        <div class=\"torrent-install__descr\">#{torrent_install_text}</div>\n        \n        <div class=\"torrent-install__label\">#{torrent_install_contact}</div>\n\n        <div class=\"torrent-install__links\">\n            <div class=\"torrent-install__link\">\n                <div>LG - Samsung</div>\n                <div>@lampa_group</div>\n            </div>\n\n            <div class=\"torrent-install__link\">\n                <div>Android</div>\n                <div>@lampa_android</div>\n            </div>\n        </div>\n    </div>\n</div>";

    var html$A = "<div class=\"torrent-checklist\">\n    <div class=\"torrent-checklist__descr\">#{torrent_error_text}</div>\n\n    <div class=\"torrent-checklist__progress-steps\"></div>\n    <div class=\"torrent-checklist__progress-bar\">\n        <div style=\"width: 0\"></div>\n    </div>\n\n    <div class=\"torrent-checklist__content\">\n        <div class=\"torrent-checklist__steps\">\n            <ul class=\"torrent-checklist__list\">\n                <li>#{torrent_error_step_1}</li>\n                <li>#{torrent_error_step_2}</li>\n                <li>#{torrent_error_step_3}</li>\n                <li>#{torrent_error_step_4}</li>\n                <li>#{torrent_error_step_5}</li>\n                <li>#{torrent_error_step_6}</li>\n            </ul>\n        </div>\n\n        <div class=\"torrent-checklist__info\">\n            <div class=\"hide\">#{torrent_error_info_1}</div>\n            <div class=\"hide\">#{torrent_error_info_2}</div>\n            <div class=\"hide\">#{torrent_error_info_3}</div>\n            <div class=\"hide\">#{torrent_error_info_4}</div>\n            <div class=\"hide\">#{torrent_error_info_5}</div>\n            <div class=\"hide\">#{torrent_error_info_6}</div>\n            <div class=\"hide\">#{torrent_error_info_7}</div>\n        </div>\n    </div>\n\n    <div class=\"torrent-checklist__footer\">\n        <div class=\"simple-button selector\">#{torrent_error_start}</div><div class=\"torrent-checklist__next-step\"></div>\n    </div>\n</div>";

    var html$z = "<div class=\"torrent-serial selector\">\n    <img src=\"{img}\" class=\"torrent-serial__img\" />\n    <div class=\"torrent-serial__content\">\n        <div class=\"torrent-serial__body\">\n            <div class=\"torrent-serial__title\">{fname}</div>\n            <div class=\"torrent-serial__line\">#{torrent_serial_episode} - <b>{episode}</b> &nbsp;\u2022&nbsp; #{torrent_serial_season} - <b>{season}</b> &nbsp;\u2022&nbsp; #{torrent_serial_date} - {air_date}</div>\n        </div>\n        <div class=\"torrent-serial__detail\">\n            <div class=\"torrent-serial__size\">{size}</div>\n            <div class=\"torrent-serial__exe\">.{exe}</div>\n        </div>\n    </div>\n    <div class=\"torrent-serial__episode\">{episode}</div>\n</div>";

    var html$y = "<div class=\"search-box\">\n    <div class=\"search-box__input search__input\"></div>\n    <div class=\"search-box__keypad\"><div class=\"simple-keyboard\"></div></div>\n</div>";

    var html$x = "<div class=\"console\">\n    <div class=\"console__tabs\"></div>\n    <div class=\"console__body\"></div>\n</div>";

    var html$w = "\n<svg width=\"15\" height=\"14\" viewBox=\"0 0 15 14\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.54893 0.927035C6.84828 0.00572455 8.15169 0.00572705 8.45104 0.927038L9.40835 3.87334C9.54223 4.28537 9.92618 4.56433 10.3594 4.56433H13.4573C14.4261 4.56433 14.8288 5.80394 14.0451 6.37334L11.5388 8.19426C11.1884 8.4489 11.0417 8.90027 11.1756 9.31229L12.1329 12.2586C12.4322 13.1799 11.3778 13.946 10.594 13.3766L8.08777 11.5557C7.73728 11.3011 7.26268 11.3011 6.9122 11.5557L4.40592 13.3766C3.6222 13.946 2.56773 13.1799 2.86708 12.2586L3.82439 9.31229C3.95827 8.90027 3.81161 8.4489 3.46112 8.19426L0.954841 6.37334C0.171128 5.80394 0.573906 4.56433 1.54263 4.56433H4.64056C5.07378 4.56433 5.45774 4.28536 5.59161 3.87334L6.54893 0.927035Z\" fill=\"currentColor\"/>\n</svg>\n";

    var html$v = "<div class=\"time-line\" data-hash=\"{hash}\">\n    <div style=\"width: {percent}%\"></div>\n</div>";

    var html$u = "<span class=\"time-line-details\" data-hash=\"{hash}\">\n<span a=\"t\">{time}</span> <span a=\"p\">({percent})</span> #{time_from} <span a=\"d\">{duration}</span>\n</span>";

    var html$t = "<div class=\"empty empty--list\">\n    <div class=\"empty__title\">#{empty_title}</div>\n    <div class=\"empty__descr\">#{empty_text}</div>\n</div>";

    var html$s = "<div class=\"screensaver\">\n    <div class=\"screensaver__slides\">\n        <img class=\"screensaver__slides-one\" />\n        <img class=\"screensaver__slides-two\" />\n    </div>\n    <div class=\"screensaver__gradient\"></div>\n    <div class=\"screensaver__title\">\n        <div class=\"screensaver__title-name\"></div>\n        <div class=\"screensaver__title-tagline\"></div>\n    </div>\n    <div class=\"screensaver__datetime\">\n        <div class=\"screensaver__datetime-time\"><span class=\"time--clock\"></span></div>\n        <div class=\"screensaver__datetime-date\"><span class=\"time--full\"></span></div>\n    </div>\n</div>";

    var html$r = "<div class=\"plugins-catalog\">\n\n    <div class=\"plugins-catalog__block\">\n        <div class=\"plugins-catalog__title selector\">#{plugins_catalog_work}</div>\n        <div class=\"plugins-catalog__descr\">#{plugins_catalog_work_descr}</div>\n        <div class=\"plugins-catalog__list\">\n            \n        </div>\n    </div>\n\n    <div class=\"plugins-catalog__block\">\n        <div class=\"plugins-catalog__title\">#{plugins_catalog_popular}</div>\n        <div class=\"plugins-catalog__descr\">#{plugins_catalog_popular_descr}</div>\n        <div class=\"plugins-catalog__list\">\n            \n        </div>\n    </div>\n</div>";

    var html$q = "<div class=\"broadcast\">\n    <div class=\"broadcast__text\">{text}</div>\n\n    <div class=\"broadcast__scan\"><div></div></div>\n\n    <div class=\"broadcast__devices\">\n    \n    </div>\n</div>";

    var html$p = "<div class=\"lang\">\n    <div class=\"lang__body\">\n        <div class=\"lang__logo\">\n            <img src=\"./img/logo-icon.svg\" />\n        </div>\n        <div class=\"lang__title\"></div>\n        <div class=\"lang__subtitle\"></div>\n        <div class=\"lang__selector\"></div>\n    </div>\n</div>";

    var html$o = "<div class=\"extensions\">\n    <div class=\"extensions__head\">\n        <div class=\"extensions__head-title\">#{settings_main_plugins}</div>\n    </div>\n    <div class=\"extensions__body\"></div>\n</div>";

    var html$n = "<div class=\"extensions__block\">\n    <div class=\"extensions__block-head\">\n        <div class=\"extensions__block-title\">{title}</div>\n    </div>\n    <div class=\"extensions__block-body\"></div>\n</div>";

    var html$m = "<div class=\"extensions__item selector\">\n    <div class=\"extensions__item-author\"></div>\n    <div class=\"extensions__item-name\"></div>\n    <div class=\"extensions__item-descr\"></div>\n    <div class=\"extensions__item-footer\">\n        <div class=\"extensions__item-included hide\"></div>\n        <div class=\"extensions__item-check\"></div>\n        <div class=\"extensions__item-code hide success\"></div>\n        <div class=\"extensions__item-status hide\"></div>\n        <div class=\"extensions__item-disabled hide\">#{player_disabled}</div>\n    </div>\n</div>";

    var html$l = "<div class=\"iframe\">\n    <div class=\"iframe__body\">\n        <iframe src=\"\" class=\"iframe__window\"></iframe>\n    </div>\n</div>";

    var html$k = "<div class=\"account-modal\">\n    <div class=\"account-modal__icon\">\n        <svg width=\"86\" height=\"93\" viewBox=\"0 0 86 93\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <circle cx=\"42.6763\" cy=\"23.3238\" r=\"19.3238\" stroke=\"white\" stroke-width=\"8\"/>\n            <path d=\"M81.3524 93C81.3524 71.6398 64.0365 54.3239 42.6762 54.3239C21.3159 54.3239 4 71.6398 4 93\" stroke=\"white\" stroke-width=\"8\"/>\n        </svg>\n    </div>\n\n    <div class=\"account-modal__desc\">\n        #{account_create}\n    </div>\n</div>";

    var html$j = "<div class=\"account-modal\">\n    <div class=\"account-modal__icon-svg\">\n        <svg height=\"184\" viewBox=\"0 0 199 184\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <circle cx=\"100\" cy=\"92\" r=\"92\" fill=\"#D9D9D9\" fill-opacity=\"0.06\"/>\n            <path d=\"M161.917 23H78.1668C75.2052 23 72.365 24.1765 70.2708 26.2706C68.1767 28.3648 67.0002 31.2051 67.0002 34.1667V109.542H55.8335V115.125H89.3335C90.0739 115.125 90.784 114.831 91.3075 114.307C91.831 113.784 92.1252 113.074 92.1252 112.333V106.529L112.381 120.708L92.1252 134.887V129.083C92.1252 128.343 91.831 127.633 91.3075 127.109C90.784 126.586 90.0739 126.292 89.3335 126.292H55.8335V131.875H67.0002V145.833C67.0002 148.795 68.1767 151.635 70.2708 153.729C72.365 155.824 75.2052 157 78.1668 157H161.917C164.878 157 167.719 155.824 169.813 153.729C171.907 151.635 173.083 148.795 173.083 145.833V34.1667C173.083 31.2051 171.907 28.3648 169.813 26.2706C167.719 24.1765 164.878 23 161.917 23V23ZM78.1668 28.5833H161.917C163.398 28.5833 164.818 29.1716 165.865 30.2187C166.912 31.2657 167.5 32.6859 167.5 34.1667V38.7701L160.434 47.603C159.609 48.6389 158.561 49.4751 157.368 50.0489C156.174 50.6227 154.866 50.9194 153.542 50.9167H133.721C133.08 47.7613 131.368 44.9244 128.875 42.8868C126.382 40.8491 123.262 39.736 120.042 39.736C116.822 39.736 113.701 40.8491 111.208 42.8868C108.715 44.9244 107.003 47.7613 106.363 50.9167H86.5418C85.2175 50.9194 83.9097 50.6227 82.7162 50.0489C81.5226 49.4751 80.4742 48.6389 79.6492 47.603L72.5835 38.7701V34.1667C72.5835 32.6859 73.1717 31.2657 74.2188 30.2187C75.2659 29.1716 76.686 28.5833 78.1668 28.5833V28.5833ZM128.417 53.7083C128.417 55.3648 127.926 56.984 127.005 58.3612C126.085 59.7385 124.777 60.8119 123.247 61.4458C121.716 62.0797 120.033 62.2456 118.408 61.9224C116.783 61.5993 115.291 60.8016 114.12 59.6304C112.949 58.4591 112.151 56.9668 111.828 55.3422C111.505 53.7176 111.67 52.0337 112.304 50.5034C112.938 48.973 114.012 47.665 115.389 46.7448C116.766 45.8245 118.385 45.3333 120.042 45.3333C122.263 45.3333 124.393 46.2157 125.964 47.7863C127.534 49.3569 128.417 51.4871 128.417 53.7083ZM161.917 151.417H78.1668C76.686 151.417 75.2659 150.828 74.2188 149.781C73.1717 148.734 72.5835 147.314 72.5835 145.833V131.875H86.5418V140.25C86.5421 140.76 86.6823 141.261 86.9472 141.697C87.2121 142.134 87.5915 142.489 88.0443 142.725C88.497 142.96 89.0057 143.067 89.515 143.034C90.0243 143.001 90.5148 142.829 90.9331 142.536L118.85 122.995C119.217 122.737 119.517 122.395 119.724 121.997C119.931 121.599 120.04 121.157 120.04 120.708C120.04 120.26 119.931 119.818 119.724 119.42C119.517 119.022 119.217 118.679 118.85 118.422L90.9331 98.8803C90.5148 98.5878 90.0243 98.4156 89.515 98.3825C89.0057 98.3493 88.497 98.4564 88.0443 98.6921C87.5915 98.9278 87.2121 99.2831 86.9472 99.7194C86.6823 100.156 86.5421 100.656 86.5418 101.167V109.542H72.5835V47.709L75.2914 51.0925C76.6378 52.7836 78.3491 54.1484 80.2973 55.0848C82.2455 56.0212 84.3803 56.505 86.5418 56.5H106.363C107.003 59.6554 108.715 62.4922 111.208 64.5299C113.701 66.5675 116.822 67.6807 120.042 67.6807C123.262 67.6807 126.382 66.5675 128.875 64.5299C131.368 62.4922 133.08 59.6554 133.721 56.5H153.542C155.703 56.505 157.838 56.0212 159.786 55.0848C161.735 54.1484 163.446 52.7836 164.792 51.0925L167.5 47.709V145.833C167.5 147.314 166.912 148.734 165.865 149.781C164.818 150.828 163.398 151.417 161.917 151.417V151.417Z\" fill=\"white\"/>\n            <path d=\"M117.25 50.9166H122.833V56.5H117.25V50.9166Z\" fill=\"white\"/>\n            <path d=\"M22.3335 36.9584H55.8335V42.5417H22.3335V36.9584Z\" fill=\"white\"/>\n            <path d=\"M11.1665 36.9584H16.7498V42.5417H11.1665V36.9584Z\" fill=\"white\"/>\n            <path d=\"M0 56.5H33.5V62.0833H0V56.5Z\" fill=\"white\"/>\n            <path d=\"M30.7085 151.417H55.8335V157H30.7085V151.417Z\" fill=\"white\"/>\n            <path d=\"M19.5415 151.417H25.1248V157H19.5415V151.417Z\" fill=\"white\"/>\n            <path d=\"M0 137.458H47.4583V143.042H0V137.458Z\" fill=\"white\"/>\n            <path d=\"M44.6665 90H61.4165V95.5833H44.6665V90Z\" fill=\"white\"/>\n            <path d=\"M33.5 90H39.0833V95.5833H33.5V90Z\" fill=\"white\"/>\n            <path d=\"M145.167 129.083H161.917V134.667H145.167V129.083Z\" fill=\"white\"/>\n            <path d=\"M122.833 140.25H161.917V145.833H122.833V140.25Z\" fill=\"white\"/>\n            <circle cx=\"169\" cy=\"32\" r=\"30\" fill=\"white\"/>\n            <rect x=\"159.808\" y=\"18.5649\" width=\"32\" height=\"6\" rx=\"3\" transform=\"rotate(45 159.808 18.5649)\" fill=\"#0C0C0C\"/>\n            <rect x=\"155.565\" y=\"41.1924\" width=\"32\" height=\"6\" rx=\"3\" transform=\"rotate(-45 155.565 41.1924)\" fill=\"#0C0C0C\"/>\n        </svg>\n    </div>\n\n    <div class=\"account-modal__desc\">\n        #{account_limited}\n    </div>\n</div>";

    var html$i = "<div class=\"cub-premium\">\n    <div class=\"cub-premium__title\">CUB Premium</div>\n    <div class=\"cub-premium__descr\">\n        #{account_premium}\n    </div>\n    <div class=\"cub-premium__descr\">#{account_premium_more}</div>\n    <div class=\"cub-premium__url\">cubnotrip.top/premium</div>\n</div>";

    var html$h = "<div class=\"head-backward selector\">\n    <div class=\"head-backward__button\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 492 492\" xml:space=\"preserve\">\n            <path d=\"M198.608 246.104 382.664 62.04c5.068-5.056 7.856-11.816 7.856-19.024 0-7.212-2.788-13.968-7.856-19.032l-16.128-16.12C361.476 2.792 354.712 0 347.504 0s-13.964 2.792-19.028 7.864L109.328 227.008c-5.084 5.08-7.868 11.868-7.848 19.084-.02 7.248 2.76 14.028 7.848 19.112l218.944 218.932c5.064 5.072 11.82 7.864 19.032 7.864 7.208 0 13.964-2.792 19.032-7.864l16.124-16.12c10.492-10.492 10.492-27.572 0-38.06L198.608 246.104z\" fill=\"currentColor\"></path>\n        </svg>\n    </div>\n    <div class=\"head-backward__title\">{title}</div>\n</div>";

    var html$g = "<div class=\"account-add-device\">\n    <div class=\"about\">\n        #{account_code_where}\n    </div>\n\n    <div class=\"simple-button selector\">#{account_code_input}</div>\n</div>";

    var html$f = "<div class=\"speedtest\">\n    <div class=\"speedtest__body\">\n        <svg viewBox=\"-250 -250 500 305\" width=\"100%\">\n            <g class=\"scale\">\n                <circle r=\"200\" fill=\"none\" stroke-width=\"15\" class=\"speedtest__progress\" id=\"speedtest_progress\"></circle>\n                <circle r=\"200\" fill=\"none\" stroke-width=\"5\" stroke=\"currentColor\" class=\"speedtest__frequency\"></circle>\n                <circle r=\"200\" fill=\"none\" stroke-width=\"10\" class=\"speedtest__fill\"></circle>\n            </g>\n        \n            <path d=\"m-220 0 a120 -120 0 0 1 440 0\" fill=\"none\" stroke=\"blue\" stroke-width=\"0\" id=\"speedtest_path\"></path>\n\n            <text font-size=\"20px\" x=\"0\">\n                <textpath href=\"#speedtest_path\" data-text=\"0\">0</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"69\">\n                <textpath href=\"#speedtest_path\" data-text=\"5\">5</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"139\">\n                <textpath href=\"#speedtest_path\" data-text=\"10\">10</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"216\">\n                <textpath href=\"#speedtest_path\" data-text=\"15\">15</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"293\">\n                <textpath href=\"#speedtest_path\" data-text=\"20\">20</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"371\">\n                <textpath href=\"#speedtest_path\" data-text=\"30\">30</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"447\">\n                <textpath href=\"#speedtest_path\" data-text=\"60\">60</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"515\">\n                <textpath href=\"#speedtest_path\" data-text=\"100\">100</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"595\">\n                <textpath href=\"#speedtest_path\" data-text=\"200\">200</textpath>\n            </text>\n            <text font-size=\"20px\" x=\"655\">\n                <textpath href=\"#speedtest_path\" data-text=\"500\">500</textpath>\n            </text>\n        \n            <text id=\"speedtest_num\" text-anchor=\"middle\" alignment-baseline=\"central\" y=\"-80\" font-size=\"70\">0.000</text>\n            <text id=\"speedtest_num-text\" text-anchor=\"middle\" alignment-baseline=\"central\" y=\"-20\" font-size=\"25\">Mbps</text>\n            <text id=\"speedtest_status\" text-anchor=\"middle\" alignment-baseline=\"central\" y=\"35\" font-size=\"20\"></text>\n        </svg>\n\n        <svg viewBox=\"-250 -300 500 55\" width=\"100%\">\n            <polyline id=\"speedtest_graph\" points=\"-250,-250\" stroke=\"currentColor\" stroke-width=\"2\" fill=\"none\"></polyline>\n        </svg>\n    </div>\n</div>";

    var _templates;
    var templates = (_templates = {
      account_add_device: html$g,
      head: html$1r,
      wrap: html$1q,
      menu: html$1p,
      activitys: html$1o,
      activity: html$1n,
      settings: html$1l,
      settings_main: html$1k,
      settings_interface: html$1j,
      settings_parser: html$1i,
      settings_server: html$1h,
      settings_player: html$1g,
      settings_more: html$1f,
      settings_tmdb: html$1e,
      settings_plugins: html$1d,
      settings_cloud: html$1c,
      settings_account: html$1b,
      scroll: html$1m,
      items_line: html$1a,
      card: html$19,
      card_parser: html$18,
      card_watched: html$17,
      full_start: html$16,
      full_descr: html$15,
      full_person: html$14,
      full_review: html$13,
      full_episode: html$12,
      player: html$11,
      player_panel: html$10,
      player_video: html$$,
      player_info: html$_,
      selectbox: html$Z,
      selectbox_item: html$Y,
      info: html$W,
      more: html$U,
      search: html$T,
      settings_input: html$S,
      modal: html$R,
      company: html$Q,
      modal_loading: html$P,
      modal_pending: html$O,
      person_start: html$N,
      empty: html$M,
      notice: html$L,
      notice_card: html$K,
      torrent: html$J,
      torrent_file: html$I,
      files: html$H,
      about: html$G,
      error: html$F,
      torrent_noconnect: html$E,
      torrent_file_serial: html$z,
      torrent_nocheck: html$D,
      torrent_nohash: html$C,
      torrent_install: html$B,
      torrent_error: html$A,
      filter: html$V,
      search_box: html$y,
      console: html$x,
      icon_star: html$w,
      timeline: html$v,
      timeline_details: html$u,
      list_empty: html$t,
      screensaver: html$s,
      plugins_catalog: html$r,
      broadcast: html$q,
      lang_choice: html$p,
      extensions: html$o,
      extensions_block: html$n,
      extensions_item: html$m,
      iframe: html$l,
      account: html$k,
      account_limited: html$j,
      cub_premium: html$i,
      selectbox_icon: html$X,
      head_backward: html$h
    }, _defineProperty(_templates, "account_add_device", html$g), _defineProperty(_templates, "speedtest", html$f), _templates);
    var created = {};

    function get$e(name) {
      var vars = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var like_static = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var tpl = templates[name];
      if (!tpl) throw 'Template [' + name + '] not found';
      tpl = Lang.translate(tpl);

      for (var n in vars) {
        tpl = tpl.replace(new RegExp('{' + n + '}', 'g'), vars[n]);
      }

      tpl = tpl.replace(/{\@([a-z_-]+)}/g, function (e, s) {
        return templates[s] || '';
      });
      return like_static ? tpl : $(tpl);
    }

    function build(tree) {
      function create(item) {
        var elem = item.elem.cloneNode(); //document.createElement(item.tag)

        /*
        if(!item.elem && item.attributes){
            for(let i = 0; i < item.attributes.length; i++){
                elem.setAttribute(item.attributes[i].name, item.attributes[i].value)
            }
        }
        */

        item.clildrens.forEach(function (child_data) {
          var child = create(child_data);
          elem.appendChild(child);
        });
        return elem;
      }

      var root = create(tree);
      return root;
    }

    function js(name, vars) {
      if (!created[name]) {
        var extract = function extract(elem) {
          var data = {
            tag: elem.tagName,
            attributes: elem.attributes,
            elem: elem,
            clildrens: []
          };

          for (var i = 0; i < elem.childNodes.length; i++) {
            if (elem.childNodes[i].tagName) data.clildrens.push(extract(elem.childNodes[i]));
          }

          return data;
        };

        var tpl = get$e(name);
        var tree = extract(tpl[0]);
        created[name] = tree;
      }

      return build(created[name]);
    }

    function add$a(name, html) {
      templates[name] = html;
    }

    function all$3() {
      return templates;
    }

    var Template$1 = {
      get: get$e,
      js: js,
      add: add$a,
      all: all$3
    };

    var Base64 = {
      // private property
      _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      // public method for encoding
      encode: function encode(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = Base64._utf8_encode(input);

        while (i < input.length) {
          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);
          enc1 = chr1 >> 2;
          enc2 = (chr1 & 3) << 4 | chr2 >> 4;
          enc3 = (chr2 & 15) << 2 | chr3 >> 6;
          enc4 = chr3 & 63;

          if (isNaN(chr2)) {
            enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
            enc4 = 64;
          }

          output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }

        return output;
      },
      // public method for decoding
      decode: function decode(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
          enc1 = this._keyStr.indexOf(input.charAt(i++));
          enc2 = this._keyStr.indexOf(input.charAt(i++));
          enc3 = this._keyStr.indexOf(input.charAt(i++));
          enc4 = this._keyStr.indexOf(input.charAt(i++));
          chr1 = enc1 << 2 | enc2 >> 4;
          chr2 = (enc2 & 15) << 4 | enc3 >> 2;
          chr3 = (enc3 & 3) << 6 | enc4;
          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
          }

          if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
          }
        }

        output = Base64._utf8_decode(output);
        return output;
      },
      // private method for UTF-8 encoding
      _utf8_encode: function _utf8_encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);

          if (c < 128) {
            utftext += String.fromCharCode(c);
          } else if (c > 127 && c < 2048) {
            utftext += String.fromCharCode(c >> 6 | 192);
            utftext += String.fromCharCode(c & 63 | 128);
          } else {
            utftext += String.fromCharCode(c >> 12 | 224);
            utftext += String.fromCharCode(c >> 6 & 63 | 128);
            utftext += String.fromCharCode(c & 63 | 128);
          }
        }

        return utftext;
      },
      // private method for UTF-8 decoding
      _utf8_decode: function _utf8_decode(utftext) {
        var string = "";
        var i = 0;
        var c = 0;
        var c2 = 0;

        while (i < utftext.length) {
          c = utftext.charCodeAt(i);

          if (c < 128) {
            string += String.fromCharCode(c);
            i++;
          } else if (c > 191 && c < 224) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode((c & 31) << 6 | c2 & 63);
            i += 2;
          } else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
            i += 3;
          }
        }

        return string;
      }
    };

    var html$e = $('<div class="noty"><div class="noty__body"><div class="noty__text"></div></div></div>'),
        body$3 = html$e.find('.noty__text'),
        time$3;

    function show$5(text) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      clearTimeout(time$3);
      time$3 = setTimeout(function () {
        html$e.removeClass('noty--visible');
      }, params.time || 3000);
      body$3.html(text);
      html$e.addClass('noty--visible');
    }

    function render$d() {
      return html$e;
    }

    var Noty = {
      show: show$5,
      render: render$d
    };

    var reqCallback = {};
    var timeCallback = {};

    function exit$1() {
      if (checkVersion(1)) AndroidJS.exit();else $('<a href="lampa://exit"></a>')[0].click();
    }

    function playHash(SERVER) {
      var magnet = "magnet:?xt=urn:btih:" + SERVER.hash;

      if (checkVersion(10)) {
        var intentExtra = "";

        if (SERVER.movie) {
          intentExtra = {
            title: "[LAMPA] " + (SERVER.movie.title || 'No title').replace(/\s+/g, ' ').trim(),
            poster: SERVER.movie.img,
            data: {
              lampa: true,
              movie: SERVER.movie
            }
          };
        }

        AndroidJS.openTorrentLink(magnet, JSON.stringify(intentExtra));
      } else {
        $('<a href="' + magnet + '"/>')[0].click();
      }
    }

    function openTorrent(SERVER) {
      if (checkVersion(10)) {
        var intentExtra = {
          title: "[LAMPA] " + (SERVER.movie.title || 'No title').replace(/\s+/g, ' ').trim(),
          poster: SERVER.object.poster,
          data: {
            lampa: true,
            movie: SERVER.movie
          }
        };
        AndroidJS.openTorrentLink(SERVER.object.MagnetUri || SERVER.object.Link, JSON.stringify(intentExtra));
      } else {
        $('<a href="' + (SERVER.object.MagnetUri || SERVER.object.Link) + '"/>')[0].click();
      }
    }

    function openPlayer(link, data) {
      if (checkVersion(98, true)) {
        if (data.timeline) {
          data.timeline.time = Math.round(data.timeline.time);
          data.timeline.duration = Math.round(data.timeline.duration); // Lampa.Noty.show('time: ' + data.timeline.time)
          // console.log('Timecode', data.timeline)

          timeCallback[data.timeline.hash] = data;
        }
      }

      if (checkVersion(10)) AndroidJS.openPlayer(link, JSON.stringify(data));else $('<a href="' + link + '"><a/>')[0].click();
    }

    function resetDefaultPlayer() {
      if (checkVersion(15)) AndroidJS.clearDefaultPlayer();
    }

    function httpReq(data, call) {
      var index = Math.floor(Math.random() * 5000);
      reqCallback[index] = call;
      if (checkVersion(16)) AndroidJS.httpReq(JSON.stringify(data), index);else call.error({
        responseText: "No Native request"
      });
    }

    function httpCall(index, callback) {
      var req = reqCallback[index];

      if (req[callback]) {
        var resp = AndroidJS.getResp(index);

        try {
          var json = JSON.parse(resp);
          req[callback](json);
        } catch (_unused) {
          req[callback](resp);
        } finally {
          delete reqCallback[index];
        }
      }
    }

    function timeCall(timeline) {
      var hash = timeline.hash;

      if (timeCallback[hash]) {
        timeCallback[hash].timeline.handler(timeline.percent, timeline.time, timeline.duration);
        timeCallback[hash].timeline.percent = timeline.percent;
        timeCallback[hash].timeline.duration = timeline.duration;
        timeCallback[hash].timeline.time = timeline.time;
        delete timeCallback[hash];
      }
    }

    function voiceStart() {
      if (checkVersion(25)) AndroidJS.voiceStart();else Lampa.Noty.show("Работает только на Android TV");
    }

    function updateChannel(where) {
      if (checkVersion(28)) AndroidJS.updateChannel(where);
    }

    function checkVersion(needVersion) {
      var silent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (typeof AndroidJS !== 'undefined') {
        try {
          var current = AndroidJS.appVersion().split('-');
          var versionCode = current.pop();

          if (parseInt(versionCode, 10) >= needVersion) {
            return true;
          } else {
            if (!silent) Lampa.Noty.show("Обновите приложение.<br>Требуется версия: " + needVersion + "<br>Текущая версия: " + versionCode);
            return false;
          }
        } catch (e) {
          Lampa.Noty.show("Обновите приложение.<br>Требуется версия: " + needVersion);
          return false;
        }
      } else return false;
    }

    var Android = {
      exit: exit$1,
      openTorrent: openTorrent,
      openPlayer: openPlayer,
      playHash: playHash,
      resetDefaultPlayer: resetDefaultPlayer,
      httpReq: httpReq,
      voiceStart: voiceStart,
      httpCall: httpCall,
      timeCall: timeCall,
      updateChannel: updateChannel
    };

    function create$p() {
      var listener = start$4();
      var _calls = [];

      var _last;

      var last_reguest;
      var need = {
        timeout: 1000 * 60
      };

      this.timeout = function (time) {
        need.timeout = time;
      };
      /**
       * Видимый запрос
       * @param {String} url адрес
       * @param {Function} complite успешно
       * @param {Function} error ошибка
       * @param {Object} post_data данные для пост запроса
       */


      this.get = function (url, _complite, _error, post_data) {
        clear();
        go({
          url: url,
          post_data: post_data,
          start: function start() {
            listener.send('start');
          },
          before_complite: function before_complite() {
            listener.send('before_complite');
          },
          complite: function complite(data) {
            if (_complite) _complite(data);
          },
          after_complite: function after_complite() {
            listener.send('after_complite');
          },
          before_error: function before_error() {
            listener.send('before_error');
          },
          error: function error(data) {
            if (_error) _error(data);
          },
          after_error: function after_error() {
            listener.send('after_error');
          },
          end: function end() {
            listener.send('end');
          }
        });
      };
      /**
       * Тихий запрос, отработает в любом случае
       * @param {String} url адрес
       * @param {Function} complite успешно
       * @param {Function} error ошибка
       * @param {Object} post_data данные для пост запроса
       * @param {Object} params дополнительные параметры
       */


      this.quiet = function (url, _complite2, _error2, post_data, params) {
        var add_params = {};

        if (params) {
          add_params = params;
        }

        var data = {
          url: url,
          post_data: post_data,
          complite: function complite(data) {
            if (_complite2) _complite2(data);
          },
          error: function error(data) {
            if (_error2) _error2(data);
          }
        };
        Arrays.extend(data, add_params, true);
        go(data);
      };
      /**
       * Бесшумный запрос, сработает прерывание при новом запросе
       * @param {String} url адрес
       * @param {Function} complite успешно
       * @param {Function} error ошибка
       * @param {Object} post_data данные для пост запроса
       * @param {Object} params дополнительные параметры
       */


      this.silent = function (url, complite, error, post_data, params) {
        var add_params = {};

        if (params) {
          add_params = params;
        }

        var reguest = {
          url: url,
          complite: complite,
          error: error
        };

        _calls.push(reguest);

        var data = {
          url: url,
          post_data: post_data,
          complite: function complite(data) {
            if (_calls.indexOf(reguest) !== -1 && reguest.complite) reguest.complite(data);
          },
          error: function error(data) {
            if (_calls.indexOf(reguest) !== -1 && reguest.error) reguest.error(data);
          },
          end: function end() {
            listener.send('end');
          }
        };
        Arrays.extend(data, add_params, true);
        go(data);
      };
      /**
       * Отработать только последний запрос в стеке
       * @param {String} url адрес
       * @param {Function} complite успешно
       * @param {Function} error ошибка
       * @param {Object} post_data данные для пост запроса
       */


      this.last = function (url, complite, error, post_data) {
        var reguest = {
          url: url,
          complite: complite,
          error: error
        };
        _last = reguest;
        go({
          url: url,
          post_data: post_data,
          complite: function complite(data) {
            if (_last && _last.complite) _last.complite(data);
          },
          error: function error(data) {
            if (_last && _last.error) _last.error(data);
          },
          end: function end() {
            dispatchEvent({
              type: 'load:end'
            });
          }
        });
      };

      this["native"] = function (url, complite, error, post_data, params) {
        var add_params = {};

        if (params) {
          add_params = params;
        }

        var reguest = {
          url: url,
          complite: complite,
          error: error
        };

        _calls.push(reguest);

        var data = {
          url: url,
          post_data: post_data,
          complite: function complite(data) {
            if (_calls.indexOf(reguest) !== -1 && reguest.complite) reguest.complite(data);
          },
          error: function error(data) {
            if (_calls.indexOf(reguest) !== -1 && reguest.error) reguest.error(data);
          },
          end: function end() {
            listener.send('end');
          }
        };
        Arrays.extend(data, add_params, true);

        _native(data);
      };
      /**
       * Очистить все запросы
       */


      this.clear = function () {
        _calls = [];
      };
      /**
       * Повторить запрос
       * @param {Object} custom
       */


      this.again = function (custom) {
        if (custom || last_reguest) {
          go(custom || last_reguest);
        }
      };
      /**
       * Вернуть обьект последненго запроса
       * @returns Object
       */


      this.latest = function () {
        return last_reguest;
      };
      /**
       * Декодировать ошибку в запросе
       * @param {Object} jqXHR
       * @param {String} exception
       * @returns String
       */


      this.errorDecode = function (jqXHR, exception) {
        return errorDecode(jqXHR, exception);
      };

      function errorDecode(jqXHR, exception) {
        var msg = '';

        if (jqXHR.status === 0 && exception !== 'timeout') {
          msg = Lang.translate('network_noconnect');
        } else if (jqXHR.status == 404) {
          msg = Lang.translate('network_404');
        } else if (jqXHR.status == 401) {
          msg = Lang.translate('network_401');
        } else if (jqXHR.status == 500) {
          msg = Lang.translate('network_500');
        } else if (exception === 'parsererror') {
          msg = Lang.translate('network_parsererror');
        } else if (exception === 'timeout') {
          msg = Lang.translate('network_timeout');
        } else if (exception === 'abort') {
          msg = Lang.translate('network_abort');
        } else if (exception === 'custom') {
          msg = jqXHR.responseText;
        } else {
          msg = Lang.translate('network_error') + ': ' + jqXHR.responseText;
        }

        return msg;
      }
      /**
       * Сделать запрос
       * @param {Object} params
       */


      function go(params) {
        var error = function error(jqXHR, exception) {
          console.log('Request', 'error of ' + params.url + ' :', errorDecode(jqXHR, exception));
          if (params.before_error) params.before_error(jqXHR, exception);
          if (params.error) params.error(jqXHR, exception);
          if (params.after_error) params.after_error(jqXHR, exception);
          if (params.end) params.end();
        };

        if (typeof params.url !== 'string' || !params.url) return error({
          status: 404
        }, '');
        listener.send('go');
        last_reguest = params;
        if (params.start) params.start();

        var secuses = function secuses(data) {
          if (params.before_complite) params.before_complite(data);

          if (params.complite) {
            try {
              params.complite(data);
            } catch (e) {
              console.error('Request', 'complite error:', e.message + "\n\n" + e.stack);
              Noty.show('Error: ' + (e.error || e).message + '<br><br>' + (e.error && e.error.stack ? e.error.stack : e.stack || '').split("\n").join('<br>'));
            }
          }

          if (params.after_complite) params.after_complite(data);
          if (params.end) params.end();
        };

        var data = {
          dataType: params.dataType || 'json',
          url: params.url,
          timeout: need.timeout,
          crossDomain: true,
          success: function success(data) {
            //console.log('Request','result of '+params.url+' :',data)
            secuses(data);
          },
          error: error,
          beforeSend: function beforeSend(xhr) {
            var use = Storage.field('torrserver_auth');
            var srv = Storage.get(Storage.field('torrserver_use_link') == 'two' ? 'torrserver_url_two' : 'torrserver_url');
            if (use && params.url.indexOf(srv) > -1) xhr.setRequestHeader("Authorization", "Basic " + Base64.encode(Storage.get('torrserver_login') + ':' + Storage.get('torrserver_password')));

            if (params.beforeSend) {
              xhr.setRequestHeader(params.beforeSend.name, params.beforeSend.value);
            }
          }
        };

        if (params.withCredentials) {
          data.xhrFields = {
            withCredentials: true
          };
        }

        if (params.post_data) {
          data.type = 'POST';
          data.data = params.post_data;
        }

        if (params.type) data.type = params.type;

        if (params.headers) {
          data.headers = params.headers;
        }

        $.ajax(data);
        need.timeout = 1000 * 60;
      }

      function _native(params) {
        var platform = Storage.get('platform', '');
        if (platform == 'webos') go(params);else if (platform == 'tizen') go(params);else if (platform == 'android') {
          listener.send('go');
          last_reguest = params;
          if (params.start) params.start();
          Android.httpReq(params, {
            complite: params.complite,
            error: params.error
          });
          need.timeout = 1000 * 60;
        } else go(params);
      }
    }

    function secondsToTime$1(sec, _short) {
      var sec_num = parseInt(sec, 10);
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      var seconds = sec_num - hours * 3600 - minutes * 60;

      if (hours < 10) {
        hours = "0" + hours;
      }

      if (minutes < 10) {
        minutes = "0" + minutes;
      }

      if (seconds < 10) {
        seconds = "0" + seconds;
      }

      if (_short) return hours + ':' + minutes;
      return hours + ':' + minutes + ':' + seconds;
    }

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function substr(txt, len) {
      txt = txt || '';
      return txt.length > len ? txt.substr(0, len) + '...' : txt;
    }

    function numberWithSpaces(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    function bytesToSize(bytes, speed) {
      if (bytes == 0) {
        return Lang.translate('size_zero');
      }

      var unitMultiple = 1024;
      var unitNames = [Lang.translate('size_byte'), Lang.translate('size_kb'), Lang.translate('size_mb'), Lang.translate('size_gb'), Lang.translate('size_tb'), Lang.translate('size_pp')];

      if (speed) {
        unitMultiple = 1000;
        unitNames = [Lang.translate('speed_bit'), Lang.translate('speed_kb'), Lang.translate('speed_mb'), Lang.translate('speed_gb'), Lang.translate('speed_tb'), Lang.translate('speed_pp')];
      }

      var unitChanges = Math.floor(Math.log(bytes) / Math.log(unitMultiple));
      return parseFloat((bytes / Math.pow(unitMultiple, unitChanges)).toFixed(2)) + ' ' + unitNames[unitChanges];
    }

    function sizeToBytes(str) {
      var gsize = str.match(/([0-9\\.,]+)\s+(Mb|МБ|GB|ГБ|TB|ТБ)/i);

      if (gsize) {
        var size = parseFloat(gsize[1].replace(',', '.'));
        if (/gb|гб/.test(gsize[2].toLowerCase())) size *= 1024;
        if (/tb|тб/.test(gsize[2].toLowerCase())) size *= 1048576;
        return size * 1048576;
      }

      return 0;
    }

    function calcBitrate(byteSize, minutes) {
      if (!minutes) return 0;
      var sec = minutes * 60;
      var bitSize = byteSize * 8;
      return (bitSize / Math.pow(1000, 2) / sec).toFixed(2);
    }

    function getMoths(ended) {
      var need = ended ? '_e' : '';
      var all = [];

      for (var i = 1; i <= 12; i++) {
        all.push(Lang.translate('month_' + i + need));
      }

      return all;
    }

    function time$2(html) {
      var create = function create() {
        var months = getMoths();
        var months_end = getMoths(true);
        var days = [Lang.translate('day_7'), Lang.translate('day_1'), Lang.translate('day_2'), Lang.translate('day_3'), Lang.translate('day_4'), Lang.translate('day_5'), Lang.translate('day_6')];

        this.tik = function () {
          var date = new Date(),
              time = date.getTime(),
              ofst = parseInt((localStorage.getItem('time_offset') == null ? 'n0' : localStorage.getItem('time_offset')).replace('n', ''));
          date = new Date(time + ofst * 1000 * 60 * 60);
          time = [date.getHours(), date.getMinutes(), date.getSeconds(), date.getFullYear()];

          if (time[0] < 10) {
            time[0] = "0" + time[0];
          }

          if (time[1] < 10) {
            time[1] = "0" + time[1];
          }

          if (time[2] < 10) {
            time[2] = "0" + time[2];
          }

          var current_time = [time[0], time[1]].join(':'),
              current_week = date.getDay(),
              current_day = date.getDate();
          $('.time--clock', html).text(current_time);
          $('.time--week', html).text(days[current_week]);
          $('.time--day', html).text(current_day);
          $('.time--moth', html).text(months[date.getMonth()]);
          $('.time--full', html).text(current_day + ' ' + months_end[date.getMonth()] + ' ' + time[3]);
        };

        setInterval(this.tik.bind(this), 1000);
        this.tik();
      };

      return new create();
    }

    function parseTime(str) {
      var months = getMoths();
      var months_end = getMoths(true);
      var days = [Lang.translate('day_7'), Lang.translate('day_1'), Lang.translate('day_2'), Lang.translate('day_3'), Lang.translate('day_4'), Lang.translate('day_5'), Lang.translate('day_6')];
      var date = new Date(str),
          time = [date.getHours(), date.getMinutes(), date.getSeconds(), date.getFullYear()];

      if (time[0] < 10) {
        time[0] = "0" + time[0];
      }

      if (time[1] < 10) {
        time[1] = "0" + time[1];
      }

      if (time[2] < 10) {
        time[2] = "0" + time[2];
      }

      var current_time = [time[0], time[1]].join(':'),
          current_week = date.getDay(),
          current_day = date.getDate();
      return {
        time: current_time,
        week: days[current_week],
        day: current_day,
        mouth: months[date.getMonth()],
        full: current_day + ' ' + months_end[date.getMonth()] + ' ' + time[3],
        "short": current_day + ' ' + months_end[date.getMonth()]
      };
    }

    function secondsToTimeHuman(sec_num) {
      var hours = Math.trunc(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      return (hours ? hours + 'ч. ' : '') + minutes + 'м.';
    }

    function strToTime(str) {
      var date = new Date(str);
      return date.getTime();
    }

    function checkHttp(url) {
      url = url + ''; //url = url.replace(/https:\/\//,'')
      //url = url.replace(/http:\/\//,'')

      if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) return url;
      url = protocol() + url;
      return url;
    }

    function shortText(fullStr, strLen, separator) {
      if (fullStr.length <= strLen) return fullStr;
      separator = separator || '...';
      var sepLen = separator.length,
          charsToShow = strLen - sepLen,
          frontChars = Math.ceil(charsToShow / 2),
          backChars = Math.floor(charsToShow / 2);
      return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
    }

    function protocol() {
      return window.location.protocol == 'https:' ? 'https://' : 'http://';
    }

    function addUrlComponent(url, params) {
      return url + (/\?/.test(url) ? '&' : '?') + params;
    }

    function putScript(items, complite, error, success, show_logs) {
      var p = 0;
      var l = typeof show_logs !== 'undefined' ? show_logs : true;

      function next() {
        if (p >= items.length) return complite();
        var u = items[p];

        if (!u) {
          p++;
          return next();
        }

        if (l) console.log('Script', 'create:', u);
        var s = document.createElement('script');

        s.onload = function () {
          if (l) console.log('Script', 'include:', u);
          if (success) success(u);
          next();
        };

        s.onerror = function () {
          if (l) console.log('Script', 'error:', u);
          if (error) error(u);
          next();
        };

        s.setAttribute('src', u);
        document.body.appendChild(s);
        p++;
      }

      next();
    }

    function putStyle(items, complite, error) {
      var p = 0;

      function next() {
        if (p >= items.length) return complite();
        var u = items[p];
        $.get(u, function (css) {
          css = css.replace(/\.\.\//g, './');
          var style = document.createElement('style');
          style.type = 'text/css';

          if (style.styleSheet) {
            // This is required for IE8 and below.
            style.styleSheet.cssText = css;
          } else {
            style.appendChild(document.createTextNode(css));
          }

          document.body.appendChild(style);
          next();
        }, function () {
          if (error) error(u);
          next();
        }, 'TEXT');
        p++;
      }

      next(items[0]);
    }

    function clearTitle(title) {
      return title.replace(/[^a-zа-я0-9\s]/gi, '');
    }

    function cardImgBackground(card_data) {
      if (Storage.field('background')) {
        if (Storage.get('background_type', 'complex') == 'poster' && window.innerWidth > 790) {
          return card_data.backdrop_path ? Api.img(card_data.backdrop_path, 'original') : card_data.background_image ? card_data.background_image : '';
        }

        return card_data.poster_path ? Api.img(card_data.poster_path) : card_data.poster || card_data.img || '';
      }

      return '';
    }

    function stringToHslColor(str, s, l) {
      var hash = 0;

      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      var h = hash % 360;
      return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
    }

    function pathToNormalTitle(path) {
      var add_exe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var name = path.split('.');
      var exe = name.pop();
      name = name.join('.');
      return (name + '').replace(/_|\./g, ' ') + (add_exe ? ' <span class="exe">.' + exe + '</span>' : '');
    }

    function hash$2(input) {
      var str = (input || '') + '';
      var hash = 0;
      if (str.length == 0) return hash;

      for (var i = 0; i < str.length; i++) {
        var _char = str.charCodeAt(i);

        hash = (hash << 5) - hash + _char;
        hash = hash & hash; // Convert to 32bit integer
      }

      return Math.abs(hash) + '';
    }

    function uid(len) {
      var ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var ID_LENGTH = len || 8;
      var id = '';

      for (var i = 0; i < ID_LENGTH; i++) {
        id += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
      }

      return id;
    }

    function copyTextToClipboard(text, succes, error) {
      var textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand('copy');
        if (successful) succes();else error();
      } catch (err) {
        error();
      }

      document.body.removeChild(textArea);
    }

    function imgLoad(image, src, onload, onerror) {
      var img = $(image)[0];

      img.onload = function () {
        if (onload) onload();
      };

      img.onerror = function (e) {
        img.src = './img/img_broken.svg';
        if (onerror) onerror();
      };

      img.src = src;
    }

    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }

    function canFullScreen() {
      var doc = window.document;
      var elem = doc.documentElement;
      return elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen;
    }

    function toggleFullscreen() {
      var doc = window.document;
      var elem = doc.documentElement;
      var requestFullScreen = elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen;
      var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

      if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(elem);
      } else {
        cancelFullScreen.call(doc);
      }
    }

    function countSeasons(movie) {
      var seasons = movie.seasons || [];
      var count = 0;

      for (var i = 0; i < seasons.length; i++) {
        if (seasons[i].episode_count > 0) count++;
      }

      if (count > movie.number_of_seasons) count = movie.number_of_seasons;
      return count;
    }

    function countDays(time_a, time_b) {
      var d1 = new Date(time_a);
      var d2 = new Date(time_b);
      var days = (d2 - d1) / (1000 * 60 * 60 * 24);
      days = Math.round(days);
      return days <= 0 ? 0 : days;
    }

    function decodePG(pg) {
      var lang = Storage.field('language');
      var keys = {
        'G': '3+',
        'PG': '6+',
        'PG-13': '13+',
        'R': '17+',
        'NC-17': '18+',
        'TV-Y': '0+',
        'TV-Y7': '7+',
        'TV-G': '3+',
        'TV-PG': '6+',
        'TV-14': '14+',
        'TV-MA': '17+'
      };

      if (lang == 'ru' || lang == 'uk' || lang == 'be') {
        for (var key in keys) {
          if (pg == key) return keys[key];
        }
      }

      return pg;
    }

    var Utils = {
      secondsToTime: secondsToTime$1,
      secondsToTimeHuman: secondsToTimeHuman,
      capitalizeFirstLetter: capitalizeFirstLetter,
      substr: substr,
      numberWithSpaces: numberWithSpaces,
      time: time$2,
      bytesToSize: bytesToSize,
      calcBitrate: calcBitrate,
      parseTime: parseTime,
      checkHttp: checkHttp,
      shortText: shortText,
      protocol: protocol,
      addUrlComponent: addUrlComponent,
      sizeToBytes: sizeToBytes,
      putScript: putScript,
      putStyle: putStyle,
      clearTitle: clearTitle,
      cardImgBackground: cardImgBackground,
      strToTime: strToTime,
      stringToHslColor: stringToHslColor,
      pathToNormalTitle: pathToNormalTitle,
      hash: hash$2,
      uid: uid,
      copyTextToClipboard: copyTextToClipboard,
      imgLoad: imgLoad,
      isTouchDevice: isTouchDevice,
      toggleFullscreen: toggleFullscreen,
      canFullScreen: canFullScreen,
      countSeasons: countSeasons,
      countDays: countDays,
      decodePG: decodePG
    };

    function create$o() {
      var _this = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var html = Template$1.get('scroll');
      var body = html.find('.scroll__body');
      var content = html.find('.scroll__content');
      html.toggleClass('scroll--horizontal', params.horizontal ? true : false);
      html.toggleClass('scroll--mask', params.mask ? true : false);
      html.toggleClass('scroll--over', params.over ? true : false);
      html.toggleClass('scroll--nopadding', params.nopadding ? true : false);
      body.data('scroll', 0);
      var scroll_time = 0,
          scroll_step = params.step || 150;
      html.on('mousewheel', function (e) {
        var parent = $(e.target).parents('.scroll');
        var inner = onTheRightSide(e, true);
        if (!params.horizontal && html.is(parent[0])) inner = true;

        if (Storage.field('navigation_type') == 'mouse' && Date.now() - scroll_time > 100 && inner) {
          scroll_time = Date.now();

          if (e.originalEvent.wheelDelta / 120 > 0) {
            if (_this.onWheel) _this.onWheel(-scroll_step);

            _this.wheel(-scroll_step);
          } else {
            if (_this.onWheel) _this.onWheel(scroll_step);

            _this.wheel(scroll_step);
          }
        }
      }).on('mousemove', function (e) {
        html.toggleClass('scroll--horizontal-scroll', Boolean(onTheRightSide(e)));
      });

      function onTheRightSide(e) {
        var inleft = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var offset = content.offset().left;
        var width = window.innerWidth - offset;
        var position = e.clientX - offset;
        return params.horizontal ? position > width / 2 : inleft ? position < width / 2 : false;
      }

      function maxOffset(offset) {
        var w = params.horizontal ? html.width() : html.height();
        var p = parseInt(content.css('padding-' + (params.horizontal ? 'left' : 'top')));
        var s = body[0][params.horizontal ? 'scrollWidth' : 'scrollHeight'];
        offset = Math.min(0, offset);
        offset = Math.max(-(Math.max(s + p * 2, w) - w), offset);
        return offset;
      }

      this.wheel = function (size) {
        html.toggleClass('scroll--wheel', true);
        var direct = params.horizontal ? 'left' : 'top';
        var scrl = body.data('scroll'),
            scrl_offset = html.offset()[direct],
            scrl_padding = parseInt(content.css('padding-' + direct));

        if (params.scroll_by_item) {
          var pos = body.data('scroll-position');
          pos = pos || 0;
          var items = $('>*', body);
          pos += size > 0 ? 1 : -1;
          pos = Math.max(0, Math.min(items.length - 1, pos));
          body.data('scroll-position', pos);
          var item = items.eq(pos),
              ofst = item.offset()[direct];
          size = ofst - scrl_offset - scrl_padding;
        }

        var max = params.horizontal ? 10000 : body.height();
        max -= params.horizontal ? html.width() : html.height();
        max += scrl_padding * 2;
        scrl -= size;
        scrl = Math.min(0, Math.max(-max, scrl));
        scrl = maxOffset(scrl);
        this.reset();

        if (Storage.field('scroll_type') == 'css') {
          body.css('transform', 'translate3d(' + (params.horizontal ? scrl : 0) + 'px, ' + (params.horizontal ? 0 : scrl) + 'px, 0px)');
        } else {
          body.css('margin-left', (params.horizontal ? scrl : 0) + 'px');
          body.css('margin-top', (params.horizontal ? 0 : scrl) + 'px');
        }

        body.data('scroll', scrl);
      };

      this.update = function (elem, tocenter) {
        if (elem.data('ismouse')) return;
        html.toggleClass('scroll--wheel', false);
        var dir = params.horizontal ? 'left' : 'top',
            siz = params.horizontal ? 'width' : 'height';
        var toh = Lampa.Utils.isTouchDevice();
        var ofs_elm = elem.offset()[dir],
            ofs_box = body.offset()[dir],
            vieport = html[siz](),
            center = ofs_box + (tocenter ? content[siz]() / 2 - elem[siz]() / 2 : 0),
            size = body[siz](),
            scrl = Math.min(0, center - ofs_elm);
        scrl = maxOffset(scrl);
        this.reset();

        if (toh) {
          if (params.horizontal) html.stop().animate({
            scrollLeft: -scrl
          }, 200);else html.stop().animate({
            scrollTop: -scrl
          }, 200);
        } else {
          if (Storage.field('scroll_type') == 'css') {
            body.css('transform', 'translate3d(' + (params.horizontal ? scrl : 0) + 'px, ' + (params.horizontal ? 0 : scrl) + 'px, 0px)');
          } else {
            body.css('margin-left', (params.horizontal ? scrl : 0) + 'px');
            body.css('margin-top', (params.horizontal ? 0 : scrl) + 'px');
          }
        }

        body.data('scroll', scrl);
        if (this.onScroll) this.onScroll({
          position: scrl,
          direstion: dir,
          size: size,
          vieport: vieport
        });
        if (this.onEnd && this.isEnd()) this.onEnd();
      };

      this.isEnd = function () {
        if ($('body').hasClass('touch-device')) {
          var scrl = html.scrollTop(),
              size = body[0][params.horizontal ? 'scrollWidth' : 'scrollHeight'],
              vieport = html[params.horizontal ? 'width' : 'height']();
          return size - vieport * Math.max(1, params.end_ratio || 1) < Math.abs(scrl);
        } else {
          var _scrl = body.data('scroll'),
              _size = body[params.horizontal ? 'width' : 'height'](),
              _vieport = html[params.horizontal ? 'width' : 'height']();

          return _size - _vieport * Math.max(1, params.end_ratio || 1) < Math.abs(_scrl);
        }
      };

      this.append = function (object) {
        body.append(object);
      };

      this.minus = function (minus) {
        html.addClass('layer--wheight');
        html.data('mheight', minus);
      };

      this.height = function (minus) {
        html.addClass('layer--height');
        html.data('mheight', minus);
      };

      this.body = function () {
        return body;
      };

      this.render = function (object) {
        if (object) body.append(object);
        return html;
      };

      this.clear = function () {
        body.empty();
      };

      this.reset = function () {
        body.css('transform', 'translate3d(0px, 0px, 0px)');
        body.css('margin', '0px');
        body.data('scroll', 0); //body.data('scroll-position',0)
      };

      this.destroy = function () {
        html.remove();
      };
    }

    var object$2 = {
      author: 'Yumata',
      github: 'https://github.com/yumata/lampa-source',
      css_version: '1.6.9',
      app_version: '1.5.1'
    };
    Object.defineProperty(object$2, 'app_digital', {
      get: function get() {
        return parseInt(object$2.app_version.replace(/\./g, ''));
      }
    });
    Object.defineProperty(object$2, 'css_digital', {
      get: function get() {
        return parseInt(object$2.css_version.replace(/\./g, ''));
      }
    });

    function init$m() {
      if (typeof webOS !== 'undefined' && webOS.platform.tv === true) {
        Storage.set('platform', 'webos');
        webOS.deviceInfo(function (e) {
          webOS.sdk_version = parseFloat(e.sdkVersion);
        });
      } else if (typeof webapis !== 'undefined' && typeof tizen !== 'undefined') {
        Storage.set('platform', 'tizen');
        tizen.tvinputdevice.registerKey("MediaPlayPause");
        tizen.tvinputdevice.registerKey("MediaPlay");
        tizen.tvinputdevice.registerKey("MediaStop");
        tizen.tvinputdevice.registerKey("MediaPause");
        tizen.tvinputdevice.registerKey("MediaRewind");
        tizen.tvinputdevice.registerKey("MediaFastForward");
      } else if (navigator.userAgent.toLowerCase().indexOf("lampa_client") > -1) {
        Storage.set('platform', 'android');
      } else if (typeof nw !== 'undefined') {
        Storage.set('platform', 'nw');
      } else if (navigator.userAgent.toLowerCase().indexOf("electron") > -1) {
        Storage.set('platform', 'electron');
      } else if (navigator.userAgent.toLowerCase().indexOf("netcast") > -1) {
        Storage.set('platform', 'netcast');
      } else if (navigator.userAgent.toLowerCase().indexOf("windows nt") > -1) {
        Storage.set('platform', 'browser');
      } else if (navigator.userAgent.toLowerCase().indexOf("maple") > -1) {
        Storage.set('platform', 'orsay');
      } else {
        Storage.set('platform', '');
      }

      Storage.set('native', Storage.get('platform') ? true : false);
    }
    /**
     * Какая платформа
     * @returns String
     */


    function get$d() {
      return Storage.get('platform', '');
    }
    /**
     * Если это платформа
     * @param {String} need - какая нужна? tizen, webos, android, orsay
     * @returns Boolean
     */


    function is(need) {
      return get$d() == need ? true : false;
    }
    /**
     * Если хоть одна из платформ tizen, webos, android
     * @returns Boolean
     */


    function any$1() {
      return is('tizen') || is('webos') || is('android') || is('netcast') || desktop() ? true : false;
    }
    /**
     * Если это именно телек
     * @returns Boolean
     */


    function tv() {
      return is('tizen') || is('webos') || is('orsay') || is('netcast') ? true : false;
    }
    /**
     * Если это NW.js или Electron
     * @returns Boolean
     */


    function desktop() {
      return is('nw') || is('electron');
    }

    function version(name) {
      if (name == 'app') {
        return object$2.app_version;
      } else if (name == 'android') {
        return AndroidJS.appVersion();
      } else {
        return '';
      }
    }

    var Platform = {
      init: init$m,
      get: get$d,
      any: any$1,
      is: is,
      tv: tv,
      desktop: desktop,
      version: version
    };

    var components$2 = {};
    var params$2 = {};
    /**
     * Добавить компонент
     * @param {{component:string, icon:string, name:string}} data
     */

    function addComponent(data) {
      components$2[data.component] = data;
      Template$1.add('settings_' + data.component, '<div></div>');
    }
    /**
     * Получить компонент
     * @param {string} component
     * @returns {{component:string, icon:string, name:string}}
     */


    function getComponent(component) {
      return components$2[component];
    }
    /**
     * Добавить параметр
     * @param {{component:string, name:string, type:string, values:string|object, default:string|boolean}} data
     */


    function addParam(data) {
      if (!params$2[data.component]) params$2[data.component] = [];
      params$2[data.component].push(data);
      if (data.param.type == 'select' || data.param.type == 'input') Params.select(data.param.name, data.param.values, data.param["default"]);
      if (data.param.type == 'trigger') Params.trigger(data.param.name, data.param["default"]);
    }
    /**
     * Получить параметры
     * @param {string} component
     * @returns {[{component:string, name:string, type:string, values:string|object, default:string|boolean}]}
     */


    function getParam(component) {
      return params$2[component];
    }
    /**
     * Получить все компоненты
     * @returns {{name:{component:string, icon:string, name:string}}}
     */


    function allComponents() {
      return components$2;
    }
    /**
     * Получить все параметры
     * @returns {{component:[{component:string, name:string, type:string, values:string|object, default:string|boolean}]}}
     */


    function allParams() {
      return params$2;
    }

    var Api$1 = {
      allComponents: allComponents,
      allParams: allParams,
      addComponent: addComponent,
      addParam: addParam,
      getComponent: getComponent,
      getParam: getParam
    };

    function Component$1(name) {
      var component_params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var scrl = new create$o({
        mask: true,
        over: true,
        step: 200
      });
      var comp = Template$1.get('settings_' + name);
      var last;
      /**
       * Обновить скролл
       */

      function updateScroll() {
        comp.find('.selector').unbind('hover:focus').on('hover:focus', function (e) {
          last = e.target;
          scrl.update($(e.target), true);
        });
      }
      /**
       * Билдим все события
       */


      function buildEvents() {
        if (Storage.get('native')) {
          comp.find('.is--torllok').remove();
        }

        if (!Platform.is('android')) {
          comp.find('.is--android').remove();
        }

        if (!Platform.any()) {
          comp.find('.is--player').remove();
        }

        if (!Platform.desktop()) {
          comp.find('.is--nw').remove();
        }

        scrl.render().find('.scroll__content').addClass('layer--wheight').data('mheight', $('.settings__head'));
        comp.find('.clear-storage').on('hover:enter', function () {
          Noty.show(Lang.translate('settings_clear_cache'));
          localStorage.clear();
          setTimeout(function () {
            window.location.reload();
          }, 1000);
        });
        Params.bind(comp.find('.selector'));
        Params.listener.follow('update_scroll', updateScroll);
        updateScroll();
      }
      /**
       * Добавляем пользовательские параметры
       */


      function addParams() {
        var params = Api$1.getParam(name);

        if (params) {
          params.forEach(function (data) {
            var item;

            if (data.param.type == 'select') {
              item = $("<div class=\"settings-param selector\" data-type=\"select\" data-name=\"".concat(data.param.name, "\">\n                        <div class=\"settings-param__name\">").concat(data.field.name, "</div>\n                        <div class=\"settings-param__value\"></div>\n                    </div>"));
            }

            if (data.param.type == 'trigger') {
              item = $("<div class=\"settings-param selector\" data-type=\"toggle\" data-name=\"".concat(data.param.name, "\">\n                        <div class=\"settings-param__name\">").concat(data.field.name, "</div>\n                        <div class=\"settings-param__value\"></div>\n                    </div>"));
            }

            if (data.param.type == 'input') {
              item = $("<div class=\"settings-param selector\" data-type=\"input\" data-name=\"".concat(data.param.name, "\" placeholder=\"").concat(data.param.placeholder, "\">\n                        <div class=\"settings-param__name\">").concat(data.field.name, "</div>\n                        <div class=\"settings-param__value\"></div>\n                    </div>"));
            }

            if (data.param.type == 'title') {
              item = $("<div class=\"settings-param-title\"><span>".concat(data.field.name, "</span></div>"));
            }

            if (data.param.type == 'static') {
              item = $("<div class=\"settings-param selector\" data-static=\"true\">\n                        <div class=\"settings-param__name\">".concat(data.field.name, "</div>\n                    </div>"));
            }

            if (item) {
              if (data.field.description) item.append("<div class=\"settings-param__descr\">".concat(data.field.description, "</div>"));
              if (typeof data.onRender == 'function') data.onRender(item);
              if (typeof data.onChange == 'function') item.data('onChange', data.onChange);
              comp.append(item);
            }
          });
        }
      }
      /**
       * Стартуем
       */


      function start() {
        addParams();
        buildEvents();
        if (typeof component_params.last_index !== 'undefined' && component_params.last_index > 0) last = comp.find('.selector').eq(component_params.last_index)[0];
        Controller.add('settings_component', {
          toggle: function toggle() {
            Controller.collectionSet(comp);
            Controller.collectionFocus(last, comp);
          },
          up: function up() {
            Navigator.move('up');
          },
          down: function down() {
            Navigator.move('down');
          },
          back: function back() {
            scrl.destroy();
            comp.remove();
            Params.listener.remove('update_scroll', updateScroll);
            Controller.toggle('settings');
          }
        });
      }

      start();
      /**
       * Уничтожить
       */

      this.destroy = function () {
        scrl.destroy();
        comp.remove();
        comp = null;
        Params.listener.remove('update_scroll', updateScroll);
      };
      /**
       * Рендер
       * @returns {object}
       */


      this.render = function () {
        return scrl.render(comp);
      };
    }

    function Main() {
      var _this = this;

      var comp;
      var scrl = new create$o({
        mask: true,
        over: true,
        step: 200
      });
      var last;
      /**
       * Создать
       */

      this.create = function () {
        comp = Template$1.get('settings_main');

        _this.update();
      };
      /**
       * Обновить события
       */


      this.update = function () {
        var components = Api$1.allComponents();

        for (var name in components) {
          var aded = components[name];

          if (!comp.find('[data-component="' + name + '"]').length) {
            var item = $("<div class=\"settings-folder selector\" data-component=\"".concat(name, "\">\n                    <div class=\"settings-folder__icon\">\n                        ").concat(aded.icon, "\n                    </div>\n                    <div class=\"settings-folder__name\">").concat(aded.name, "</div>\n                </div>"));
            comp.append(item);
          }
        }

        comp.find('.selector').unbind('hover:focus').on('hover:focus', function (event) {
          last = event.target;
          scrl.update($(event.target), true);
        }).not('[data-static]').unbind('hover:enter').on('hover:enter', function (event) {
          _this.render().detach();

          _this.onCreate($(event.target).data('component'));
        });
      };
      /**
       * Сделать активным
       */


      this.active = function () {
        Controller.collectionSet(comp);
        Controller.collectionFocus(last, comp);
        scrl.height($('.settings__head'));
      };
      /**
       * Рендер
       * @returns {object}
       */


      this.render = function () {
        return scrl.render(comp);
      };
    }

    var html$d;
    var body$2;
    var listener$g = start$4();
    var last$3 = '';

    var _main;
    /**
     * Запуск
     */


    function init$l() {
      html$d = Template$1.get('settings');
      body$2 = html$d.find('.settings__body');
      html$d.find('.settings__layer').on('click', function () {
        window.history.back();
      });
      _main = new Main();
      _main.onCreate = create$n;

      _main.create();

      Controller.add('settings', {
        toggle: function toggle() {
          _main.render().detach();

          _main.update();

          listener$g.send('open', {
            name: 'main',
            body: _main.render()
          });
          body$2.empty().append(_main.render());

          _main.active();

          $('body').toggleClass('settings--open', true);
        },
        up: function up() {
          Navigator.move('up');
        },
        down: function down() {
          Navigator.move('down');
        },
        left: function left() {
          _main.render().detach();

          Controller.toggle('content');
        },
        gone: function gone(to) {
          if (to !== 'settings_component') $('body').toggleClass('settings--open', false);
        },
        back: function back() {
          _main.render().detach();

          Controller.toggle('head');
        }
      });
    }
    /**
     * Создать компонент
     * @param {string} name
     * @param {{last_index:integer}} params
     */


    function create$n(name) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var comp = new Component$1(name, params);
      body$2.empty().append(comp.render());
      listener$g.send('open', {
        name: name,
        body: comp.render(),
        params: params
      });
      last$3 = name;
      Controller.toggle('settings_component');
    }
    /**
     * Обновить открытый компонент
     */


    function update$7() {
      var selects = body$2.find('.selector');
      var lastinx = selects.index(body$2.find('.selector.focus'));
      create$n(last$3, {
        last_index: lastinx
      });
    }
    /**
     * Рендер
     * @returns {object}
     */


    function render$c() {
      return html$d;
    }

    var Settings = {
      listener: listener$g,
      init: init$l,
      render: render$c,
      update: update$7,
      create: create$n,
      main: function main() {
        return _main;
      }
    };

    var html$c;
    var scroll$2;
    var active$4;

    function init$k() {
      html$c = Template$1.get('selectbox');
      scroll$2 = new create$o({
        mask: true,
        over: true
      });
      html$c.find('.selectbox__body').append(scroll$2.render());
      html$c.find('.selectbox__layer').on('click', function () {
        window.history.back();
      });
      $('body').append(html$c);
    }

    function bind$3() {
      scroll$2.clear();
      html$c.find('.selectbox__title').text(active$4.title);
      active$4.items.forEach(function (element) {
        if (element.hide) return;
        element.title = Utils.capitalizeFirstLetter(element.title || '');

        if (element.separator) {
          var _item = $('<div class="settings-param-title"><span>' + element.title + '</span></div>');

          return scroll$2.append(_item);
        }

        var item = Template$1.get(element.template || 'selectbox_item', element);
        if (!element.subtitle) item.find('.selectbox-item__subtitle').remove();

        if (element.checkbox) {
          item.addClass('selectbox-item--checkbox');
          item.append('<div class="selectbox-item__checkbox"></div>');
          if (element.checked) item.addClass('selectbox-item--checked');
        }

        if (element.ghost) item.css('opacity', 0.5);

        if (!element.noenter) {
          var goclose = function goclose() {
            if (!active$4.nohide) hide$1();
            if (active$4.onSelect) active$4.onSelect(element);
          };

          item.on('hover:enter', function () {
            if (element.checkbox) {
              element.checked = !element.checked;
              item.toggleClass('selectbox-item--checked', element.checked);
              if (active$4.onCheck) active$4.onCheck(element);
            } else if (active$4.onBeforeClose) {
              if (active$4.onBeforeClose()) goclose();
            } else goclose();
          }).on('hover:focus', function (e) {
            scroll$2.update($(e.target), true);
            if (active$4.onFocus) active$4.onFocus(element, e.target);
          }).on('hover:long', function (e) {
            if (active$4.onLong) active$4.onLong(element, e.target);
          });
        }

        if (element.selected) item.addClass('selected');
        scroll$2.append(item);
      });
    }

    function show$4(object) {
      active$4 = object;
      bind$3();
      $('body').toggleClass('selectbox--open', true);
      html$c.find('.selectbox__body').addClass('layer--wheight').data('mheight', html$c.find('.selectbox__head'));
      toggle$a();
    }

    function toggle$a() {
      Controller.add('select', {
        toggle: function toggle() {
          var selected = scroll$2.render().find('.selected');
          Controller.collectionSet(html$c);
          Controller.collectionFocus(selected.length ? selected[0] : false, html$c);
        },
        up: function up() {
          Navigator.move('up');
        },
        down: function down() {
          Navigator.move('down');
        },
        left: close$3,
        back: close$3
      });
      Controller.toggle('select');
    }

    function hide$1() {
      $('body').toggleClass('selectbox--open', false);
    }

    function close$3() {
      hide$1();
      if (active$4.onBack) active$4.onBack();
    }

    function render$b() {
      return html$c;
    }

    var Select = {
      init: init$k,
      show: show$4,
      hide: hide$1,
      close: close$3,
      render: render$b
    };

    function AVPlay(call_video) {
      var stream_url, loaded;
      var object = $('<object class="player-video_video" type="application/avplayer"</object>');
      var video = object[0];
      var listener = start$4();
      var change_scale_later;
      var change_speed_later;
      object.width(window.innerWidth);
      object.height(window.innerHeight);
      /**
       * Установить урл
       */

      Object.defineProperty(video, "src", {
        set: function set(url) {
          if (url) {
            stream_url = url;
            webapis.avplay.open(url);
            webapis.avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');

            try {
              webapis.avplay.setSilentSubtitle(false);
            } catch (e) {}
          }
        },
        get: function get() {}
      });
      /**
       * Позиция
       */

      Object.defineProperty(video, "currentTime", {
        set: function set(t) {
          try {
            webapis.avplay.seekTo(t * 1000);
          } catch (e) {}
        },
        get: function get() {
          var d = 0;

          try {
            d = webapis.avplay.getCurrentTime();
          } catch (e) {}

          return d ? d / 1000 : 0;
        }
      });
      /**
       * Длительность
       */

      Object.defineProperty(video, "duration", {
        set: function set() {},
        get: function get() {
          var d = 0;

          try {
            d = webapis.avplay.getDuration();
          } catch (e) {}

          return d ? d / 1000 : 0;
        }
      });
      /**
       * Пауза
       */

      Object.defineProperty(video, "paused", {
        set: function set() {},
        get: function get() {
          try {
            return webapis.avplay.getState() == 'PAUSED';
          } catch (e) {
            return false;
          }
        }
      });
      /**
       * Аудиодорожки
       */

      Object.defineProperty(video, "audioTracks", {
        set: function set() {},
        get: function get() {
          try {
            var totalTrackInfo = webapis.avplay.getTotalTrackInfo();
            var tracks = totalTrackInfo.filter(function (track) {
              return track.type === 'AUDIO';
            }).map(function (track) {
              var info = JSON.parse(track.extra_info);
              var item = {
                extra: JSON.parse(track.extra_info),
                index: parseInt(track.index),
                language: info.language
              };
              Object.defineProperty(item, "enabled", {
                set: function set(v) {
                  if (v) {
                    try {
                      webapis.avplay.setSelectTrack('AUDIO', item.index);
                    } catch (e) {
                      console.log('Player', 'no change audio:', e.message);
                    }
                  }
                },
                get: function get() {}
              });
              return item;
            }).sort(function (a, b) {
              return a.index - b.index;
            });
            return tracks;
          } catch (e) {
            return [];
          }
        }
      });
      /**
       * Субтитры
       */

      Object.defineProperty(video, "textTracks", {
        set: function set() {},
        get: function get() {
          try {
            var totalTrackInfo = webapis.avplay.getTotalTrackInfo();
            var tracks = totalTrackInfo.filter(function (track) {
              return track.type === 'TEXT';
            }).map(function (track) {
              var info = JSON.parse(track.extra_info),
                  item = {
                extra: JSON.parse(track.extra_info),
                index: parseInt(track.index),
                language: info.track_lang
              };
              Object.defineProperty(item, "mode", {
                set: function set(v) {
                  if (v == 'showing') {
                    try {
                      webapis.avplay.setSelectTrack('TEXT', item.index);
                    } catch (e) {
                      console.log('Player', 'no change text:', e.message);
                    }
                  }
                },
                get: function get() {}
              });
              return item;
            }).sort(function (a, b) {
              return a.index - b.index;
            });
            return tracks;
          } catch (e) {
            return [];
          }
        }
      });
      /**
       * Ширина видео
       */

      Object.defineProperty(video, "videoWidth", {
        set: function set() {},
        get: function get() {
          var info = videoInfo();
          return info.Width || 0;
        }
      });
      /**
       * Высота видео
       */

      Object.defineProperty(video, "videoHeight", {
        set: function set() {},
        get: function get() {
          var info = videoInfo();
          return info.Height || 0;
        }
      });
      /**
       * Получить информацию о видео
       * @returns {object}
       */

      function videoInfo() {
        try {
          var info = webapis.avplay.getCurrentStreamInfo(),
              json = {};

          for (var i = 0; i < info.length; i++) {
            var detail = info[i];

            if (detail.type == 'VIDEO') {
              json = JSON.parse(detail.extra_info);
            }
          }

          return json;
        } catch (e) {
          return {};
        }
      }
      /**
       * Меняем размер видео
       * @param {string} scale - default|cover
       */


      function changeScale(scale) {
        try {
          if (scale == 'cover') {
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
          } else {
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
          }
        } catch (e) {
          change_scale_later = scale;
        }
      }

      function changeSpeed(speed) {
        try {
          webapis.avplay.setSpeed(speed);
        } catch (e) {
          change_speed_later = speed;
        }
      }
      /**
       * Всегда говорим да, мы можем играть
       */


      video.canPlayType = function () {
        return true;
      };
      /**
       * Вешаем кастомные события
       */


      video.addEventListener = listener.follow.bind(listener);
      /**
       * Вешаем события от плеера тайзен
       */

      webapis.avplay.setListener({
        onbufferingstart: function onbufferingstart() {
          console.log('Player', 'buffering start');
          listener.send('waiting');
        },
        onbufferingprogress: function onbufferingprogress(percent) {
          listener.send('progress', {
            percent: percent
          });
        },
        onbufferingcomplete: function onbufferingcomplete() {
          console.log('Player', 'buffering complete');
          listener.send('playing');
        },
        onstreamcompleted: function onstreamcompleted() {
          console.log('Player', 'stream completed');
          webapis.avplay.stop();
          listener.send('ended');
        },
        oncurrentplaytime: function oncurrentplaytime() {
          listener.send('timeupdate');

          if (change_scale_later) {
            change_scale_later = false;
            changeScale(change_scale_later);
          }

          if (change_speed_later) {
            change_speed_later = false;
            changeSpeed(change_speed_later);
          }
        },
        onerror: function onerror(eventType) {
          listener.send('error', {
            error: {
              code: 'tizen',
              message: eventType
            }
          });
        },
        onevent: function onevent(eventType, eventData) {
          console.log('Player', 'event type:', eventType, 'data:', eventData);
        },
        onsubtitlechange: function onsubtitlechange(duration, text, data3, data4) {
          listener.send('subtitle', {
            text: text
          });
        },
        ondrmevent: function ondrmevent(drmEvent, drmData) {}
      });
      /**
       * Загрузить
       */

      video.load = function () {
        if (stream_url) {
          webapis.avplay.prepareAsync(function () {
            loaded = true;
            webapis.avplay.play();

            try {
              webapis.avplay.setSilentSubtitle(false);
            } catch (e) {}

            listener.send('canplay');
            listener.send('playing');
            listener.send('loadeddata');
          }, function (e) {
            listener.send('error', {
              error: 'code [' + e.code + '] ' + e.message
            });
          });
        }
      };
      /**
       * Играть
       */


      video.play = function () {
        if (loaded) webapis.avplay.play();
      };
      /**
       * Пауза
       */


      video.pause = function () {
        if (loaded) webapis.avplay.pause();
      };
      /**
       * Установить масштаб
       */


      video.size = function (type) {
        changeScale(type);
      };
      /**
       * Установить скорость
       */


      video.speed = function (speed) {
        changeSpeed(speed);
      };
      /**
       * Уничтожить
       */


      video.destroy = function () {
        try {
          webapis.avplay.close();
        } catch (e) {}

        video.remove();
        listener.destroy();
      };

      call_video(video);
      return object;
    }

    function create$m(object) {
      this.state = object.state;

      this.start = function () {
        this.dispath(this.state);
      };

      this.dispath = function (action_name) {
        var action = object.transitions[action_name];

        if (action) {
          action.call(this);
        } else {
          console.log('invalid action');
        }
      };
    }

    var html$b;
    var listener$f = start$4();
    var state;
    var elems$1;
    var condition = {};
    var timer$6 = {};
    var tracks = [];
    var subs = [];
    var qualitys = false;
    var translates = {};

    function init$j() {
      html$b = Template$1.get('player_panel');
      elems$1 = {
        peding: $('.player-panel__peding', html$b),
        position: $('.player-panel__position', html$b),
        time: $('.player-panel__time', html$b),
        timenow: $('.player-panel__timenow', html$b),
        timeend: $('.player-panel__timeend', html$b),
        title: $('.player-panel__filename', html$b),
        tracks: $('.player-panel__tracks', html$b),
        subs: $('.player-panel__subs', html$b),
        timeline: $('.player-panel__timeline', html$b),
        timelineWrapper: $('.player-panel__timeline-wrapper', html$b),
        quality: $('.player-panel__quality', html$b),
        episode: $('.player-panel__next-episode-name', html$b)
      };
      html$b.find('.player-panel__fullscreen').toggleClass('hide', Platform.tv() || !Utils.isTouchDevice() || !Utils.canFullScreen());
      /**
       * Отсеживаем состояние,
       * когда надо показать панель, а когда нет
       */

      state = new create$m({
        state: 'start',
        transitions: {
          start: function start() {
            clearTimeout(timer$6.hide);
            clearTimeout(timer$6.rewind);
            this.dispath('canplay');
          },
          canplay: function canplay() {
            if (condition.canplay) this.dispath('visible');else _visible(true);
          },
          visible: function visible() {
            if (condition.visible) _visible(true);else this.dispath('rewind');
          },
          rewind: function rewind() {
            var _this = this;

            clearTimeout(timer$6.rewind);

            if (condition.rewind) {
              timer$6.rewind = setTimeout(function () {
                condition.rewind = false;

                _this.dispath('hide');
              }, 1000);
            } else {
              this.dispath('hide');
            }
          },
          hide: function hide() {
            clearTimeout(timer$6.hide);
            timer$6.hide = setTimeout(function () {
              _visible(false);
            }, 3000);
          }
        }
      });
      html$b.find('.selector').on('hover:focus', function (e) {
      });
      html$b.find('.player-panel__playpause').on('hover:enter', function (e) {
        listener$f.send('playpause', {});
      });
      html$b.find('.player-panel__next').on('hover:enter', function (e) {
        listener$f.send('next', {});
      });
      html$b.find('.player-panel__prev').on('hover:enter', function (e) {
        listener$f.send('prev', {});
      });
      html$b.find('.player-panel__rprev').on('hover:enter', function (e) {
        listener$f.send('rprev', {});
      });
      html$b.find('.player-panel__rnext').on('hover:enter', function (e) {
        listener$f.send('rnext', {});
      });
      html$b.find('.player-panel__playlist').on('hover:enter', function (e) {
        listener$f.send('playlist', {});
      });
      html$b.find('.player-panel__tstart').on('hover:enter', function (e) {
        listener$f.send('to_start', {});
      });
      html$b.find('.player-panel__tend').on('hover:enter', function (e) {
        listener$f.send('to_end', {});
      });
      html$b.find('.player-panel__fullscreen').on('hover:enter', function (e) {
        listener$f.send('fullscreen', {});
      });
      html$b.find('.player-panel__settings').on('hover:enter', settings);
      html$b.find('.player-panel__pip').on('hover:enter', function () {
        listener$f.send('pip', {});
      }).toggleClass('hide', Platform.tv());
      elems$1.timeline.attr('data-controller', 'player_rewind');
      elems$1.timeline.on('mousemove', function (e) {
        listener$f.send('mouse_rewind', {
          method: 'move',
          time: elems$1.time,
          percent: percent(e)
        });
      }).on('mouseout', function () {
        elems$1.time.addClass('hide');
      });
      elems$1.timelineWrapper.on('click', function (e) {
        listener$f.send('mouse_rewind', {
          method: 'click',
          time: elems$1.time,
          percent: percent(e)
        });
      });
      html$b.find('.player-panel__line:eq(1) .selector').attr('data-controller', 'player_panel');
      /**
       * Выбор качества
       */

      elems$1.quality.text('auto').on('hover:enter', function () {
        if (qualitys) {
          var qs = [];
          var nw = elems$1.quality.text();

          if (Arrays.isArray(qualitys)) {
            qs = qualitys;
          } else {
            for (var i in qualitys) {
              qs.push({
                title: i,
                url: qualitys[i],
                selected: nw == i
              });
            }
          }

          if (!qs.length) return;
          var enabled = Controller.enabled();
          Select.show({
            title: Lang.translate('player_quality'),
            items: qs,
            onSelect: function onSelect(a) {
              elems$1.quality.text(a.title);
              a.enabled = true;
              if (!Arrays.isArray(qualitys)) listener$f.send('quality', {
                name: a.title,
                url: a.url
              });
              Controller.toggle(enabled.name);
            },
            onBack: function onBack() {
              Controller.toggle(enabled.name);
            }
          });
        }
      });
      /**
       * Выбор аудиодорожки
       */

      elems$1.tracks.on('hover:enter', function (e) {
        if (tracks.length) {
          tracks.forEach(function (element, p) {
            var name = [];
            var from = translates.tracks && Arrays.isArray(translates.tracks) && translates.tracks[p] ? translates.tracks[p] : element;
            name.push(p + 1);
            name.push(from.language || from.name || Lang.translate('player_unknown'));
            if (from.label) name.push(from.label);

            if (from.extra) {
              if (from.extra.channels) name.push(from.extra.channels + ' Ch');
              if (from.extra.fourCC) name.push(from.extra.fourCC);
            }

            element.title = name.join(' / ');
          });
          var enabled = Controller.enabled();
          Select.show({
            title: Lang.translate('player_tracks'),
            items: tracks,
            onSelect: function onSelect(a) {
              tracks.forEach(function (element) {
                element.enabled = false;
                element.selected = false;
              });
              a.enabled = true;
              a.selected = true;
              Controller.toggle(enabled.name);
              setTimeout(function () {
                listener$f.send('saveParams', Video.saveParams());
              }, 1000);
            },
            onBack: function onBack() {
              Controller.toggle(enabled.name);
            }
          });
        }
      });
      /**
       * Выбор субтитров
       */

      elems$1.subs.on('hover:enter', function (e) {
        if (subs.length) {
          if (subs[0].index !== -1) {
            var any_select = subs.find(function (s) {
              return s.selected;
            });
            Arrays.insert(subs, 0, {
              title: Lang.translate('player_disabled'),
              selected: any_select ? false : true,
              index: -1
            });
          }

          subs.forEach(function (element, p) {
            if (element.index !== -1) {
              var from = translates.subs && Arrays.isArray(translates.subs) && translates.subs[element.index] ? translates.subs[element.index] : element;
              element.title = p + ' / ' + (from.language && from.label ? from.language + ' / ' + from.label : from.language || from.label || Lang.translate('player_unknown'));
            }
          });
          var enabled = Controller.enabled();
          Select.show({
            title: Lang.translate('player_subs'),
            items: subs,
            onSelect: function onSelect(a) {
              subs.forEach(function (element) {
                element.mode = 'disabled';
                element.selected = false;
              });
              a.mode = 'showing';
              a.selected = true;
              listener$f.send('subsview', {
                status: a.index > -1
              });
              Controller.toggle(enabled.name);
              setTimeout(function () {
                listener$f.send('saveParams', Video.saveParams());
              }, 1000);
            },
            onBack: function onBack() {
              Controller.toggle(enabled.name);
            }
          });
        }
      });
    }

    function settings() {
      var speed = Storage.get('player_speed', 'default');
      var items = [{
        title: Lang.translate('player_video_size'),
        subtitle: Lang.translate('player_size_' + Storage.get('player_size', 'default') + '_title'),
        method: 'size'
      }, {
        title: Lang.translate('player_video_speed'),
        subtitle: speed == 'default' ? Lang.translate('player_speed_default_title') : speed,
        method: 'speed'
      }, {
        title: Lang.translate('player_share_title'),
        subtitle: Lang.translate('player_share_descr'),
        method: 'share'
      }];

      if (Storage.field('player_normalization')) {
        items.push({
          title: Lang.translate('player_normalization_power_title'),
          subtitle: Lang.translate('player_normalization_step_' + Storage.get('player_normalization_power', 'hight')),
          method: 'normalization_power'
        });
        items.push({
          title: Lang.translate('player_normalization_smooth_title'),
          subtitle: Lang.translate('player_normalization_step_' + Storage.get('player_normalization_smooth', 'medium')),
          method: 'normalization_smooth'
        });
      }

      Select.show({
        title: Lang.translate('title_settings'),
        items: items,
        onSelect: function onSelect(a) {
          if (a.method == 'size') selectSize();
          if (a.method == 'speed') selectSpeed();
          if (a.method == 'normalization_power') selectNormalizationStep('power', 'hight');
          if (a.method == 'normalization_smooth') selectNormalizationStep('smooth', 'medium');

          if (a.method == 'share') {
            Controller.toggle('player_panel');
            listener$f.send('share', {});
          }
        },
        onBack: function onBack() {
          Controller.toggle('player_panel');
        }
      });
    }

    function selectNormalizationStep(type, def) {
      var select = Storage.get('player_normalization_' + type, def);
      var items = [{
        title: Lang.translate('player_normalization_step_low'),
        value: 'low',
        selected: select == 'low'
      }, {
        title: Lang.translate('player_normalization_step_medium'),
        value: 'medium',
        selected: select == 'medium'
      }, {
        title: Lang.translate('player_normalization_step_hight'),
        value: 'hight',
        selected: select == 'hight'
      }];
      Select.show({
        title: Lang.translate('player_normalization_' + type + '_title'),
        items: items,
        nohide: true,
        onBack: settings,
        onSelect: function onSelect(a) {
          Storage.set('player_normalization_' + type, a.value);
        }
      });
    }
    /**
     * Выбор масштаба видео
     */


    function selectSize() {
      var select = Storage.get('player_size', 'default');
      var items = [{
        title: Lang.translate('player_size_default_title'),
        subtitle: Lang.translate('player_size_default_descr'),
        value: 'default',
        selected: select == 'default'
      }, {
        title: Lang.translate('player_size_cover_title'),
        subtitle: Lang.translate('player_size_cover_descr'),
        value: 'cover',
        selected: select == 'cover'
      }];

      if (!(Platform.is('tizen') && Storage.field('player') == 'tizen')) {
        items = items.concat([{
          title: Lang.translate('player_size_fill_title'),
          subtitle: Lang.translate('player_size_fill_descr'),
          value: 'fill',
          selected: select == 'fill'
        }, {
          title: Lang.translate('player_size_s115_title'),
          subtitle: Lang.translate('player_size_s115_descr'),
          value: 's115',
          selected: select == 's115'
        }, {
          title: Lang.translate('player_size_s130_title'),
          subtitle: Lang.translate('player_size_s130_descr'),
          value: 's130',
          selected: select == 's130'
        }, {
          title: Lang.translate('player_size_v115_title'),
          subtitle: Lang.translate('player_size_v115_descr'),
          value: 'v115',
          selected: select == 'v115'
        }, {
          title: Lang.translate('player_size_v130_title'),
          subtitle: Lang.translate('player_size_v130_descr'),
          value: 'v130',
          selected: select == 'v130'
        }]);
      } else {
        if (select == 's130' || select == 'fill') {
          items[0].selected = true;
        }
      }

      Select.show({
        title: Lang.translate('player_video_size'),
        items: items,
        nohide: true,
        onSelect: function onSelect(a) {
          listener$f.send('size', {
            size: a.value
          });
        },
        onBack: settings
      });
    }

    function selectSpeed() {
      var select = Storage.get('player_speed', 'default');
      var items = [{
        title: '0.25',
        value: '0.25'
      }, {
        title: '0.50',
        value: '0.50'
      }, {
        title: '0.75',
        value: '0.75'
      }, {
        title: Lang.translate('player_speed_default_title'),
        value: 'default'
      }, {
        title: '1.25',
        value: '1.25'
      }, {
        title: '1.50',
        value: '1.50'
      }, {
        title: '1.75',
        value: '1.75'
      }, {
        title: '2',
        value: '2'
      }];

      if (Platform.is('tizen') && Storage.field('player') == 'tizen') {
        items = [{
          title: Lang.translate('player_speed_default_title'),
          value: 'default',
          selected: select == 'default'
        }, {
          title: '2',
          value: '2'
        }];
      }

      var any;
      items.forEach(function (e) {
        if (e.value == select) {
          any = true;
          e.selected = true;
        }
      });

      if (!any) {
        Storage.set('player_speed', 'default');
        if (items.length == 3) items[0].selected = true;else items[3].selected = true;
      }

      Select.show({
        title: Lang.translate('player_video_speed'),
        items: items,
        nohide: true,
        onSelect: function onSelect(a) {
          Storage.set('player_speed', a.value);
          listener$f.send('speed', {
            speed: a.value
          });
        },
        onBack: settings
      });
    }
    /**
     * Добавить контроллеры
     */


    function addController() {
      Controller.add('player_rewind', {
        toggle: function toggle() {
          Controller.collectionSet(render$a());
          Controller.collectionFocus(false, render$a());
        },
        up: function up() {
          Controller.toggle('player');
        },
        down: function down() {
          toggleButtons();
        },
        right: function right() {
          listener$f.send('rnext', {});
        },
        left: function left() {
          listener$f.send('rprev', {});
        },
        gone: function gone() {
          html$b.find('.selector').removeClass('focus');
        },
        back: function back() {
          Controller.toggle('player');
          hide();
        }
      });
      Controller.add('player_panel', {
        toggle: function toggle() {
          Controller.collectionSet(render$a());
          Controller.collectionFocus($('.player-panel__playpause', html$b)[0], render$a());
        },
        up: function up() {
          toggleRewind();
        },
        right: function right() {
          Navigator.move('right');
        },
        left: function left() {
          Navigator.move('left');
        },
        down: function down() {
          listener$f.send('playlist', {});
        },
        gone: function gone() {
          html$b.find('.selector').removeClass('focus');
        },
        back: function back() {
          Controller.toggle('player');
          hide();
        }
      });
    }
    /**
     * Рассчитать проценты
     * @param {object} e
     * @returns {number}
     */


    function percent(e) {
      var offset = elems$1.timeline.offset();
      var width = elems$1.timeline.width();
      return (e.clientX - offset.left) / width;
    }
    /**
     * Обновляем состояние панели
     * @param {string} need - что нужно обновить
     * @param {string|number} value - значение
     */


    function update$6(need, value) {
      if (need == 'position') {
        elems$1.position.css({
          width: value
        });
      }

      if (need == 'peding') {
        elems$1.peding.css({
          width: value
        });
      }

      if (need == 'timeend') {
        elems$1.timeend.text(value);
      }

      if (need == 'timenow') {
        elems$1.timenow.text(value);
      }

      if (need == 'play') {
        html$b.toggleClass('panel--paused', false);
      }

      if (need == 'pause') {
        html$b.toggleClass('panel--paused', true);
      }
    }
    /**
     * Показать или скрыть панель
     * @param {boolean} status
     */


    function _visible(status) {
      // если менять без задержки то будет конфликтовать...
      timer$6.toggleVisible = setTimeout(function () {
        condition.panelVisible = status;
      }, 400);
      listener$f.send('visible', {
        status: status
      });
      html$b.toggleClass('panel--visible', status);
    }
    /**
     * Можем играть, далее отслеживаем статус
     */


    function canplay() {
      condition.canplay = true;
      state.start();
    }
    /**
     * Перемотка
     */


    function rewind$1() {
      condition.rewind = true;
      state.start();
    }
    /**
     * Переключить на контроллер перемотки
     */


    function toggleRewind() {
      Controller.toggle('player_rewind');
    }
    /**
     * Переключить на контроллер кнопки
     */


    function toggleButtons() {
      Controller.toggle('player_panel');
    }
    /**
     * Контроллер
     */


    function toggle$9() {
      condition.visible = true;
      state.start();
      toggleRewind();
    }
    /**
     * Показать\скрыть панель
     */


    function toggleVisibility() {
      if (condition.panelVisible) {
        _visible(false);
      } else {
        clearTimeout(timer$6.hide);

        _visible(true);

        timer$6.hide = setTimeout(function () {
          _visible(false);
        }, 3000);
      }
    }
    /**
     * Показать панель
     */


    function show$3() {
      state.start();
      addController();
    }
    /**
     * Если двигали мышку
     */


    function mousemove() {
      condition.mousemove = true;
      state.start();
    }
    /**
     * Скрыть панель
     */


    function hide() {
      condition.visible = false;

      _visible(false);
    }
    /**
     * Установить субтитры
     * @param {[{index:integer, language:string, label:string}]} su
     */


    function setSubs(su) {
      subs = su;
      elems$1.subs.toggleClass('hide', false);
    }
    /**
     * Установить дорожки
     * @param {[{index:integer, language:string, label:string}]} tr
     */


    function setTracks(tr) {
      tracks = tr;
      elems$1.tracks.toggleClass('hide', false);
    }
    /**
     * Установить качество
     * @param {[{title:string, url:string}]} levels
     * @param {string} current
     */


    function setLevels(levels, current) {
      if (qualitys && Object.keys(qualitys).length) return;
      qualitys = levels;
      elems$1.quality.text(current);
    }
    /**
     * Показать текущие качество
     * @param {[{title:string, url:string}]} qs
     * @param {string} url
     */


    function quality(qs, url) {
      if (qs) {
        elems$1.quality.toggleClass('hide', false);
        qualitys = qs;

        for (var i in qs) {
          if (qs[i] == url) elems$1.quality.text(i);
        }
      }
    }
    /**
     * Показать название следующего эпизода
     * @param {{position:integer, playlist:[{title:string, url:string}]}} e
     */


    function showNextEpisodeName(e) {
      if (e.playlist[e.position + 1]) {
        elems$1.episode.text(e.playlist[e.position + 1].title).toggleClass('hide', false);
      } else elems$1.episode.toggleClass('hide', true);
    }
    /**
     * Установить перевод для дорожек и сабов
     * @param {{subs:[],tracks:[]}} data
     */


    function setTranslate(data) {
      if (_typeof(data) == 'object') translates = data;
    }
    /**
     * Уничтожить
     */


    function destroy$6() {
      condition = {};
      tracks = [];
      subs = [];
      qualitys = false;
      translates = {};
      elems$1.peding.css({
        width: 0
      });
      elems$1.position.css({
        width: 0
      });
      elems$1.time.text('00:00');
      elems$1.timenow.text('00:00');
      elems$1.timeend.text('00:00');
      elems$1.quality.text('auto');
      elems$1.subs.toggleClass('hide', true);
      elems$1.tracks.toggleClass('hide', true);
      elems$1.episode.toggleClass('hide', true);
      clearTimeout(timer$6.toggleVisible);
      clearTimeout(timer$6.hide);
      html$b.toggleClass('panel--paused', false);
    }
    /**
     * Получить html
     * @returns {object}
     */


    function render$a() {
      return html$b;
    }

    var Panel = {
      init: init$j,
      listener: listener$f,
      render: render$a,
      toggle: toggle$9,
      toggleVisibility: toggleVisibility,
      show: show$3,
      destroy: destroy$6,
      hide: hide,
      canplay: canplay,
      update: update$6,
      rewind: rewind$1,
      setTracks: setTracks,
      setSubs: setSubs,
      setLevels: setLevels,
      mousemove: mousemove,
      quality: quality,
      showNextEpisodeName: showNextEpisodeName,
      setTranslate: setTranslate
    };

    var widgetAPI,
        tvKey,
        pluginAPI,
        orsay_loaded,
        orsay_call = Date.now();

    function init$i() {
      $('body').append($("<div style=\"position: absolute; left: -1000px; top: -1000px;\">\n    <object id=\"pluginObjectNNavi\" border=\"0\" classid=\"clsid:SAMSUNG-INFOLINK-NNAVI\" style=\"opacity: 0.0; background-color: #000; width: 1px; height: 1px;\"></object>\n    <object id=\"pluginObjectTVMW\" border=\"0\" classid=\"clsid:SAMSUNG-INFOLINK-TVMW\" style=\"opacity: 0.0; background-color: #000; width: 1px; height: 1px;\"></object>\n    <object id=\"pluginObjectSef\" border=\"0\" classid=\"clsid:SAMSUNG-INFOLINK-SEF\" style=\"opacity:0.0;background-color:#000;width:1px;height:1px;\"></object>\n</div>"));
      Utils.putScript(['$MANAGER_WIDGET/Common/API/Widget.js', '$MANAGER_WIDGET/Common/API/TVKeyValue.js', '$MANAGER_WIDGET/Common/API/Plugin.js'], function () {
        try {
          if (typeof Common !== 'undefined' && Common.API && Common.API.TVKeyValue && Common.API.Plugin && Common.API.Widget) {
            widgetAPI = new Common.API.Widget();
            tvKey = new Common.API.TVKeyValue();
            pluginAPI = new Common.API.Plugin();
            window.onShow = orsayOnshow;
            setTimeout(function () {
              orsayOnshow();
            }, 2000);
            widgetAPI.sendReadyEvent();
          } else {
            if (orsay_call + 5 * 1000 > Date.now()) setTimeout(orsayOnLoad, 50);
          }
        } catch (e) {}
      });
    }

    function orsayOnshow() {
      if (orsay_loaded) return;
      orsay_loaded = true;

      try {
        //Включает анимацию изменения громкости на ТВ и т.д.
        pluginAPI.SetBannerState(1); //Отключает перехват кнопок, этими кнопками управляет система ТВ

        pluginAPI.unregistKey(tvKey.KEY_INFO);
        pluginAPI.unregistKey(tvKey.KEY_TOOLS);
        pluginAPI.unregistKey(tvKey.KEY_MENU);
        pluginAPI.unregistKey(tvKey.KEY_VOL_UP);
        pluginAPI.unregistKey(tvKey.KEY_VOL_DOWN);
        pluginAPI.unregistKey(tvKey.KEY_MUTE);
      } catch (e) {}
    }

    function exit() {
      widgetAPI.sendReturnEvent();
    }

    var orsay = {
      init: init$i,
      exit: exit
    };

    var enabled$2 = false;
    var listener$e = start$4();
    var lastdown = 0;
    var timer$5;
    var longpress;

    function toggle$8(new_status) {
      enabled$2 = new_status;
      listener$e.send('toggle', {
        status: enabled$2
      });
    }

    function enable$2() {
      toggle$8(true);
    }

    function disable$1() {
      toggle$8(false);
    }

    function isEnter(keycode) {
      return keycode == 13 || keycode == 29443 || keycode == 117 || keycode == 65385;
    }

    function keyCode(e) {
      var keycode;

      if (window.event) {
        keycode = e.keyCode;
      } else if (e.which) {
        keycode = e.which;
      }

      return keycode;
    }

    function init$h() {
      window.addEventListener("keydown", function (e) {
        lastdown = keyCode(e);

        if (!timer$5) {
          timer$5 = setTimeout(function () {
            if (isEnter(lastdown)) {
              longpress = true;
              listener$e.send('longdown', {});
              Controller["long"]();
            }
          }, 800);
        }
      });
      window.addEventListener("keyup", function (e) {
        clearTimeout(timer$5);
        timer$5 = null;
        listener$e.send('keyup', {
          code: keyCode(e),
          enabled: enabled$2,
          event: e
        });

        if (!longpress) {
          if (isEnter(keyCode(e)) && !e.defaultPrevented) Controller.enter();
        } else longpress = false;
      });
      window.addEventListener("keydown", function (e) {
        var keycode = keyCode(e);
        listener$e.send('keydown', {
          code: keycode,
          enabled: enabled$2,
          event: e
        });
        if (e.defaultPrevented) return;
        if (isEnter(keycode)) return;
        if (!enabled$2) return; //отключить все
        //4 - Samsung orsay

        if (keycode == 37 || keycode == 4) {
          Controller.move('left');
        } //29460 - Samsung orsay


        if (keycode == 38 || keycode == 29460) {
          Controller.move('up');
        } //5 - Samsung orsay


        if (keycode == 39 || keycode == 5) {
          Controller.move('right');
        } //5 - Samsung orsay
        //29461 - Samsung orsay


        if (keycode == 40 || keycode == 29461) {
          Controller.move('down');
        } //33 - LG; 427 - Samsung


        if (keycode == 33 || keycode == 427) {
          Controller.move('toup');
        } //34 - LG; 428 - Samsung


        if (keycode == 34 || keycode == 428) {
          Controller.move('todown');
        } //Абсолютный Enter
        //10252 - Samsung tizen


        if (keycode == 32 || keycode == 179 || keycode == 10252) {
          Controller.trigger('playpause');
        } //Samsung media
        //71 - Samsung orsay


        if (keycode == 415 || keycode == 71) {
          Controller.trigger('play');
        } //Samsung stop


        if (keycode == 413) {
          Controller.trigger('stop');
        } //69 - Samsung orsay


        if (keycode == 412 || keycode == 69 || keycode == 177) {
          Controller.trigger('rewindBack');
        } //72 - Samsung orsay


        if (keycode == 418 || keycode == 417 || keycode == 72 || keycode == 176) {
          Controller.trigger('rewindForward');
        } //74 - Samsung orsay


        if (keycode == 19 || keycode == 74) {
          Controller.trigger('pause');
        }

        if (keycode == 457) {
          Controller.trigger('info');
        } //E-Manual


        if (keycode == 10146) {
          e.preventDefault();
        }

        if (keycode == 10133) {
          Controller.toggle('settings');
        } //Кнопка назад
        //8 - браузер
        //27
        //461 - LG
        //10009 - Samsung
        //88 - Samsung orsay


        if (keycode == 8 || keycode == 27 || keycode == 461 || keycode == 10009 || keycode == 88) {
          e.preventDefault();
          Activity$1.back();
          return false;
        } //Exit orsay


        if (keycode == 45) {
          orsay.exit();
        }

        e.preventDefault();
      });
    }

    var Keypad = {
      listener: listener$e,
      init: init$h,
      enable: enable$2,
      disable: disable$1
    };

    var subparams;

    var listener$d = function listener(e) {
      if (e.code == 405) getWebosmediaId(setSubtitleColor);
      if (e.code == 406) getWebosmediaId(setSubtitleBackgroundColor);
      if (e.code == 403) getWebosmediaId(setSubtitleFontSize);
      if (e.code == 404) getWebosmediaId(setSubtitlePosition);
      if (e.code == 55) getWebosmediaId(setSubtitleBackgroundOpacity);
      if (e.code == 57) getWebosmediaId(setSubtitleCharacterOpacity);
    };

    Keypad.listener.follow('keydown', listener$d);

    function luna$1(params, call, fail) {
      if (call) params.onSuccess = call;

      params.onFailure = function (result) {
        console.log('WebOS', params.method + " [fail][" + result.errorCode + "] " + result.errorText);
        if (fail) fail();
      };

      webOS.service.request("luna://com.webos.media", params);
    }

    function initStorage() {
      if (!subparams) {
        subparams = Storage.get('webos_subs_params', '{}');
        Arrays.extend(subparams, {
          color: 2,
          font_size: 1,
          bg_color: 'black',
          position: -1,
          bg_opacity: 0,
          char_opacity: 255
        });
      }
    }

    function subCallParams(mediaId, method, func_params) {
      var parameters = {
        mediaId: mediaId
      };
      Arrays.extend(parameters, func_params);
      luna$1({
        parameters: parameters,
        method: method
      });
      Storage.set('webos_subs_params', subparams);
    }

    function getWebosmediaId(func) {
      var video = document.querySelector('video');

      if (video && video.mediaId) {
        initStorage();
        setTimeout(function () {
          subCallParams(video.mediaId, func.name, func());
        }, 300);
      }
    }

    function setSubtitleColor() {
      subparams.color++;
      if (subparams.color == 6) subparams.color = 0;
      return {
        color: subparams.color
      };
    }

    function setSubtitleBackgroundColor() {
      var bgcolors = ['black', 'white', 'yellow', 'red', 'green', 'blue'];
      var ixcolors = bgcolors.indexOf(subparams.bg_color);
      ixcolors++;
      if (ixcolors == -1) ixcolors = 0;
      subparams.bg_color = bgcolors[ixcolors];
      return {
        bgColor: subparams.bg_color
      };
    }

    function setSubtitleFontSize() {
      subparams.font_size++;
      if (subparams.font_size == 5) subparams.font_size = 0;
      return {
        fontSize: subparams.font_size
      };
    }

    function setSubtitlePosition() {
      subparams.position++;
      if (subparams.position == 5) subparams.position = -3;
      return {
        position: subparams.position
      };
    }

    function setSubtitleBackgroundOpacity() {
      subparams.bg_opacity += 15;
      if (subparams.bg_opacity > 255) subparams.bg_opacity = 0;
      return {
        bgOpacity: subparams.bg_opacity
      };
    }

    function setSubtitleCharacterOpacity() {
      subparams.char_opacity += 15;
      if (subparams.char_opacity > 255) subparams.char_opacity = 45;
      return {
        charOpacity: subparams.char_opacity
      };
    }

    function initialize() {
      var video = document.querySelector('video');

      if (video && video.mediaId) {
        initStorage();
        var methods = ['setSubtitleColor', 'setSubtitleBackgroundColor', 'setSubtitleFontSize', 'setSubtitlePosition', 'setSubtitleBackgroundOpacity', 'setSubtitleCharacterOpacity'];
        var parameters = {
          mediaId: video.mediaId,
          color: subparams.color,
          bgColor: subparams.bg_color,
          position: subparams.position,
          fontSize: subparams.font_size,
          bgOpacity: subparams.bg_opacity,
          charOpacity: subparams.char_opacity
        };
        Arrays.extend(parameters, subparams);
        methods.forEach(function (method) {
          luna$1({
            parameters: parameters,
            method: method
          });
        });
      }
    }

    var WebosSubs = {
      initialize: initialize
    };

    /**
     * Для запросов в луну
     * @param {object} params
     * @param {function} call
     * @param {function} fail
     */

    function luna(params, call, fail) {
      if (call) params.onSuccess = call;

      params.onFailure = function (result) {
        console.log('WebOS', params.method + " [fail][" + result.errorCode + "] " + result.errorText);
        if (fail) fail();
      };

      webOS.service.request("luna://com.webos.media", params);
    }

    function create$l(_video) {
      var video = _video;
      var media_id;
      var subtitle_visible = false;
      var timer;
      var timer_repet;
      var count = 0;
      var count_message = 0;
      var data = {
        subs: [],
        tracks: []
      };
      this.subscribed = false;
      this.repeted = false;
      /**
       * Начинаем поиск видео
       */

      this.start = function () {
        timer = setInterval(this.search.bind(this), 300);
      };
      /**
       * Включить/выключить сабы
       * @param {boolean} status
       */


      this.toggleSubtitles = function (status) {
        subtitle_visible = status;
        luna({
          method: 'setSubtitleEnable',
          parameters: {
            'mediaId': media_id,
            'enable': status
          }
        });
        if (status) WebosSubs.initialize();
      };
      /**
       * Получили сабы, выводим в панель
       * @param {object} info
       */


      this.subtitles = function (info) {
        var _this = this;

        if (info.numSubtitleTracks) {
          var all = [];

          var add = function add(sub, index) {
            sub.index = index;
            sub.language = sub.language == '(null)' ? '' : sub.language;
            Object.defineProperty(sub, 'mode', {
              set: function set(v) {
                if (v == 'showing') {
                  _this.toggleSubtitles(sub.index == -1 ? false : true);

                  console.log('WebOS', 'change subtitles for id: ', media_id, ' index:', sub.index);

                  if (sub.index !== -1) {
                    setTimeout(function () {
                      luna({
                        method: 'selectTrack',
                        parameters: {
                          'type': 'text',
                          'mediaId': media_id,
                          'index': sub.index
                        }
                      });
                    }, 500);
                  }
                }
              },
              get: function get() {}
            });
            all.push(sub);
          };

          add({
            title: Lang.translate('player_disabled'),
            selected: true
          }, -1);

          for (var i = 0; i < info.subtitleTrackInfo.length; i++) {
            add(info.subtitleTrackInfo[i], i);
          }

          data.subs = all;
          Video.listener.send('webos_subs', {
            subs: data.subs
          });
          Panel.setSubs(data.subs);
        }
      };
      /**
       * Получили дорожки, выводим в панель
       * @param {object} info
       */


      this.tracks = function (info) {
        if (info.numAudioTracks) {
          var all = [];

          var add = function add(track, index) {
            track.index = index;
            track.selected = index == -1;
            track.extra = {
              channels: track.channels,
              fourCC: track.codec
            };
            Object.defineProperty(track, 'enabled', {
              set: function set(v) {
                if (v) {
                  console.log('WebOS', 'change audio for id:', media_id, ' index:', track.index);
                  luna({
                    method: 'selectTrack',
                    parameters: {
                      'type': 'audio',
                      'mediaId': media_id,
                      'index': track.index
                    }
                  });

                  if (video.audioTracks) {
                    for (var i = 0; i < video.audioTracks.length; i++) {
                      video.audioTracks[i].enabled = false;
                    }

                    if (video.audioTracks[track.index]) {
                      video.audioTracks[track.index].enabled = true;
                      console.log('WebOS', 'change audio two method:', track.index);
                    }
                  }
                }
              },
              get: function get() {}
            });
            all.push(track);
          };

          for (var i = 0; i < info.audioTrackInfo.length; i++) {
            add(info.audioTrackInfo[i], i);
          }

          data.tracks = all;
          Video.listener.send('webos_tracks', {
            tracks: data.tracks
          });
          Panel.setTracks(data.tracks, true);
        }
      };
      /**
       * Подписываемся на видео и ждем события
       */


      this.subscribe = function () {
        var _this2 = this;

        this.subscribed = true;
        luna({
          method: 'subscribe',
          parameters: {
            'mediaId': media_id,
            'subscribe': true
          }
        }, function (result) {
          if (result.sourceInfo && !_this2.sourceInfo) {
            _this2.sourceInfo = true;
            var info = result.sourceInfo.programInfo[0];

            _this2.subtitles(info);

            _this2.tracks(info);

            _this2.unsubscribe();

            _this2.call();
          }

          if (result.bufferRange) {
            count_message++;

            if (count_message == 30) {
              _this2.unsubscribe();

              _this2.call();
            }
          }
        }, function () {
          _this2.call();
        });
      };
      /**
       * Отписка от видео
       */


      this.unsubscribe = function () {
        luna({
          method: 'unload',
          parameters: {
            'mediaId': media_id
          }
        });
      };
      /**
       * Сканируем наличия видео
       */


      this.search = function () {
        var _this3 = this;

        count++;

        if (count > 3) {
          clearInterval(timer);
          clearInterval(timer_repet);
        }

        var rootSubscribe = function rootSubscribe() {
          console.log('WebOS', 'Run root', 'version:', webOS.sdk_version);

          _this3.toggleSubtitles(false);

          if (_this3.subscribed) clearInterval(timer_repet);
          if (!_this3.subscribed) _this3.subscribe();else {
            if (data.tracks.length) {
              Video.listener.send('webos_tracks', {
                tracks: data.tracks
              });
              Panel.setTracks(data.tracks, true);
            }

            if (data.subs.length) {
              Video.listener.send('webos_subs', {
                subs: data.subs
              });
              Panel.setSubs(data.subs);
            }
          }
          clearInterval(timer);
        };

        console.log('WebOS', 'try get id:', video.mediaId);

        if (video.mediaId) {
          media_id = video.mediaId;
          console.log('WebOS', 'video id:', media_id);
          rootSubscribe();
        }
      };
      /**
       * Вызываем и завершаем работу
       */


      this.call = function () {
        if (this.callback) this.callback();
        this.callback = false;
      };
      /**
       * Создаем новое видео
       * @param {object} new_video
       */


      this.repet = function (new_video) {
        video = new_video;
        console.log('WebOS', 'repeat to new video', new_video ? true : false);
        media_id = '';
        clearInterval(timer);
        count = 0;
        this.repeted = true;
        timer_repet = setInterval(this.search.bind(this), 300);
      };
      /**
       * После перемотки включаем состояние сабов
       */


      this.rewinded = function () {
        this.toggleSubtitles(subtitle_visible);
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        clearInterval(timer);
        clearInterval(timer_repet);
        if (media_id) this.unsubscribe();
        data = null;
        this.subscribed = false;
        this.callback = false;
      };
    }

    /**
     * Поучить время
     * @param {string} val
     * @returns {number}
     */

    function time$1(val) {
      var regex = /(\d+):(\d{2}):(\d{2})/;
      var parts = regex.exec(val);
      if (parts === null) return 0;

      for (var i = 1; i < 5; i++) {
        parts[i] = parseInt(parts[i], 10);
        if (isNaN(parts[i])) parts[i] = 0;
      } //hours + minutes + seconds + ms


      return parts[1] * 3600000 + parts[2] * 60000 + parts[3] * 1000;
    }
    /**
     * Парсить
     * @param {string} data
     * @param {boolean} ms
     * @returns
     */


    function parse$2(data, ms) {
      if (/WEBVTT/gi.test(data)) return parseVTT(data, ms);else return parseSRT(data, ms);
    }
    /**
     * Парсить SRT
     * @param {string} data
     * @param {boolean} ms
     * @returns {[{id:string, startTime:number, endTime:number, text:string}]}
     */


    function parseSRT(data, ms) {
      var useMs = ms ? true : false;
      data = data.replace(/\r/g, '');
      var regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
      data = data.split(regex);
      data.shift();
      var items = [];

      for (var i = 0; i < data.length; i += 4) {
        items.push({
          id: data[i].trim(),
          startTime: useMs ? time$1(data[i + 1].trim()) : data[i + 1].trim(),
          endTime: useMs ? time$1(data[i + 2].trim()) : data[i + 2].trim(),
          text: data[i + 3].trim()
        });
      }

      return items;
    }
    /**
     * Парсить VTT
     * @param {string} data
     * @param {boolean} ms
     * @returns {[{id:string, startTime:number, endTime:number, text:string}]}
     */


    function parseVTT(data, ms) {
      var useMs = ms ? true : false;
      data = data.replace(/WEBVTT/gi, '').trim();
      data = data.replace(/\r/g, '');
      data = data.replace(/(\d+):(\d+)\.(\d+) --> (\d+):(\d+)\.(\d+)/g, '00:$1:$2.$3 --> 00:$4:$5.$6');
      var regex = /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/g;
      data = data.split(regex);
      data.shift();
      var items = [];

      for (var i = 0; i < data.length; i += 3) {
        items.push({
          id: data[i].trim(),
          startTime: useMs ? time$1(data[i + 0].trim()) : data[i + 0].trim(),
          endTime: useMs ? time$1(data[i + 1].trim()) : data[i + 1].trim(),
          text: data[i + 2].trim()
        });
      }

      return items;
    }
    /**
     * Класс
     */


    function CustomSubs() {
      var parsed;
      var network = new create$p();
      this.listener = start$4();
      /**
       * Загрузить
       * @param {string} url
       */

      this.load = function (url) {
        network.silent(url, function (data) {
          if (data) {
            parsed = parse$2(data, true);
          }
        }, false, false, {
          dataType: 'text'
        });
      };
      /**
       * Показать текст
       * @param {number} time_sec
       */


      this.update = function (time_sec) {
        var time_ms = time_sec * 1000;

        if (parsed) {
          var text = '';

          for (var i = 0; i < parsed.length; i++) {
            var sub = parsed[i];

            if (time_ms > sub.startTime && time_ms < sub.endTime) {
              text = sub.text.replace("\n", '<br>');
              break;
            }
          }

          this.listener.send('subtitle', {
            text: text.trim()
          });
        }
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        network.clear();
        network = null;
        this.listener = null;
      };
    }

    var context;

    function smooth(a, b, s, c) {
      return a + (b - a) * (s * 0.02);
    }

    function toDb(_float) {
      var db = 20 * (Math.log(_float) / Math.log(10));
      db = Math.max(-48, Math.min(db, 0));
      return db;
    }

    function Source(video) {
      var source = context.createMediaElementSource(video);
      var analyser = context.createAnalyser();
      var volume = context.createGain();
      var destroy = false;
      var display = true;
      var draw_html = $('<div class="normalization normalization--visible"><canvas></canvas></div>');
      var draw_canvas = draw_html.find('canvas')[0];
      var draw_context = draw_canvas.getContext("2d");
      draw_canvas.width = 5;
      draw_canvas.height = 200; //размер буффера

      try {
        analyser.fftSize = 2048 * 4;
      } catch (e) {
        try {
          analyser.fftSize = 2048 * 2;
        } catch (e) {
          analyser.fftSize = 2048;
        }
      } //данные от анализа


      analyser.time_array = new Uint8Array(analyser.fftSize); //нижний порог

      analyser.min_db = 0; //подключаем анализ

      source.connect(analyser); //подключаем регулятор звука

      analyser.connect(volume); //подключаем к выходу

      volume.connect(context.destination);
      $('body').append(draw_html);

      function update() {
        if (!destroy) requestAnimationFrame(update);
        analyser.getByteTimeDomainData(analyser.time_array);
        var total = 0,
            rms = 0,
            i = 0;

        var _float2, mdb;

        var min = -48;

        while (i < analyser.fftSize) {
          _float2 = analyser.time_array[i++] / 0x80 - 1;
          total += _float2 * _float2;
          rms = Math.max(rms, _float2);
          mdb = toDb(_float2);
          if (!isNaN(mdb)) min = Math.max(min, mdb);
        }

        rms = Math.sqrt(total / analyser.fftSize);
        var db = toDb(rms);
        var sm = Storage.get('player_normalization_smooth', 'medium');
        var pw = Storage.get('player_normalization_power', 'hight');
        if (min === -48) min = db;
        if (min === -48) min = -40;
        analyser.min_db = smooth(analyser.min_db, min, sm == 'hight' ? 45 : sm == 'medium' ? 25 : 10);
        var low = (-48 - analyser.min_db) * (pw == 'hight' ? 1 : pw == 'medium' ? 0.75 : 0.5);
        volume.gain.value = Math.max(0.0, Math.min(2, db / low));

        if (display) {
          draw_context.clearRect(0, 0, draw_canvas.width, draw_canvas.height);
          var down = Math.min(1, Math.max(0, 1 - volume.gain.value));
          var up = Math.min(1, Math.max(0, volume.gain.value - 1));
          var half = draw_canvas.height / 2;
          draw_context.fillStyle = 'rgba(251,91,91,1)';
          draw_context.fillRect(0, half, draw_canvas.width, half * down);
          draw_context.fillStyle = 'rgba(91,213,251,1)';
          draw_context.fillRect(0, half - half * up, draw_canvas.width, half * up);
        }
      }

      update();

      this.visible = function (status) {
        display = status;
        draw_html.toggleClass('normalization--visible', status);
      };

      this.destroy = function () {
        volume.disconnect();
        analyser.disconnect();
        source.disconnect();
        destroy = true;
        draw_html.remove();
      };
    }

    function Normalization() {

      if (!context) {
        var classContext = window.AudioContext || window.webkitAudioContext;
        context = new classContext();
      }

      var source;

      this.attach = function (video) {
        if (!source) source = new Source(video);
      };

      this.visible = function (status) {
        if (source) source.visible(status);
      };

      this.destroy = function () {
        if (source) source.destroy();
        source = null;
      };
    }

    var listener$c = start$4();
    var html$a;
    var display;
    var paused;
    var subtitles$1;
    var rewindIcon;
    var rewindIconValue;
    var forwardIcon;
    var forwardIconValue;
    var clickTimer;
    var numClicks = 0;
    var seekSpeed = 30;
    var touchDevice;
    var timer$4 = {};
    var params$1 = {};
    var rewind_position = 0;
    var rewind_force = 0;
    var last_mutation = 0;
    var customsubs;

    var _video;

    var wait;
    var neeed_sacle;
    var neeed_sacle_last;
    var neeed_speed;
    var webos;
    var hls;
    var webos_wait = {};
    var normalization;

    function init$g() {
      html$a = Template$1.get('player_video');
      display = html$a.find('.player-video__display');
      paused = html$a.find('.player-video__paused');
      subtitles$1 = html$a.find('.player-video__subtitles');
      rewindIcon = html$a.find('.player-video__rewind-icon');
      rewindIcon[0].addEventListener('animationend', function () {
        rewindIcon.removeClass('animate-in-rewind');
      });
      rewindIconValue = html$a.find('.player-video__rewind-icon span')[0];
      forwardIcon = html$a.find('.player-video__forward-icon');
      forwardIcon[0].addEventListener('animationend', function () {
        forwardIcon.removeClass('animate-in-forward');
      });
      forwardIconValue = html$a.find('.player-video__forward-icon span')[0];
      touchDevice = Utils.isTouchDevice();
      html$a.on('click', function (e) {
        if (Storage.field('navigation_type') == 'mouse') {
          if (touchDevice) {
            handleClick(e);
          } else {
            playpause();
          }
        }
      });
      $(window).on('resize', function () {
        if (_video) {
          neeed_sacle = neeed_sacle_last;
          scale();
        }
      });
      /**
       * Специально для вебось
       */

      listener$c.follow('webos_subs', function (data) {
        webos_wait.subs = convertToArray(data.subs);
      });
      listener$c.follow('webos_tracks', function (data) {
        webos_wait.tracks = convertToArray(data.tracks);
      });
    }
    /**
     * Переключаем субтитры с предыдущей серии
     */


    function webosLoadSubs() {
      var subs = webos_wait.subs;
      _video.webos_subs = subs;
      var inx = params$1.sub + 1;

      if (typeof params$1.sub !== 'undefined' && subs[inx]) {
        subs.forEach(function (e) {
          e.mode = 'disabled';
          e.selected = false;
        });
        subs[inx].mode = 'showing';
        subs[inx].selected = true;
        console.log('WebOS', 'enable subs', inx);
        subsview(true);
      } else if (Storage.field('subtitles_start')) {
        var full = subs.find(function (s) {
          return (s.label || '').indexOf('олные') >= 0;
        });
        subs[0].selected = false;

        if (full) {
          full.mode = 'showing';
          full.selected = true;
        } else {
          subs[1].mode = 'showing';
          subs[1].selected = true;
        }

        subsview(true);
      }
    }
    /**
     * Переключаем дорожки с предыдущей серии
     */


    function webosLoadTracks() {
      var tracks = webos_wait.tracks;
      _video.webos_tracks = tracks;

      if (typeof params$1.track !== 'undefined' && tracks[params$1.track]) {
        tracks.forEach(function (e) {
          return e.selected = false;
        });
        console.log('WebOS', 'enable tracks', params$1.track);
        tracks[params$1.track].enabled = true;
        tracks[params$1.track].selected = true;
      }
    }
    /**
     * Добовляем события к контейнеру
     */


    function bind$2() {
      // ждем загрузки
      _video.addEventListener("waiting", function () {
        loader$1(true);
      }); // начали играть


      _video.addEventListener("playing", function () {
        loader$1(false);
      }); // видео закончилось


      _video.addEventListener('ended', function () {
        listener$c.send('ended', {});
      }); // что-то пошло не так


      _video.addEventListener('error', function (e) {
        var error = _video.error || {};
        var msg = (error.message || '').toUpperCase();

        if (msg.indexOf('EMPTY SRC') == -1) {
          if (error.code == 3) {
            listener$c.send('error', {
              error: Lang.translate('player_error_one')
            });
          } else if (error.code == 4) {
            listener$c.send('error', {
              error: Lang.translate('player_error_two')
            });
          } else if (typeof error.code !== 'undefined') {
            listener$c.send('error', {
              error: 'code [' + error.code + '] details [' + msg + ']'
            });
          }
        }
      }); // прогресс буферизации


      _video.addEventListener('progress', function (e) {
        if (e.percent) {
          listener$c.send('progress', {
            down: e.percent
          });
        } else {
          var duration = _video.duration;
          var seconds = 0;

          if (duration > 0) {
            try {
              for (var i = 0; i < _video.buffered.length; i++) {
                if (_video.buffered.start && _video.buffered.start(_video.buffered.length - 1 - i) < _video.currentTime) {
                  var down = Math.max(0, Math.min(100, _video.buffered.end(_video.buffered.length - 1 - i) / duration * 100)) + "%";
                  seconds = Math.max(0, _video.buffered.end(_video.buffered.length - 1 - i) - _video.currentTime);
                  listener$c.send('progress', {
                    down: down
                  });
                  break;
                }
              }
            } catch (e) {}

            hlsBitrate(seconds);
          }
        }
      });

      function hlsBitrate(seconds) {
        if (hls && hls.streamController && hls.streamController.fragPlaying && hls.streamController.fragPlaying.baseurl) {
          var ch = Lang.translate('title_channel') + ' ' + parseFloat(hls.streamController.fragLastKbps / 1000).toFixed(2) + ' ' + Lang.translate('speed_mb');
          var bt = ' / ' + Lang.translate('torrent_item_bitrate') + ' ~' + parseFloat(hls.streamController.fragPlaying.stats.total / 1000000 / 10 * 8).toFixed(2) + ' ' + Lang.translate('speed_mb');
          var bf = ' / ' + Lang.translate('title_buffer') + ' ' + Utils.secondsToTimeHuman(seconds);
          Lampa.PlayerInfo.set('bitrate', ch + bt + bf);
        }
      } // можно ли уже проигрывать?


      _video.addEventListener('canplay', function () {
        listener$c.send('canplay', {});
      }); // сколько прошло


      _video.addEventListener('timeupdate', function () {
        listener$c.send('timeupdate', {
          duration: _video.duration,
          current: _video.currentTime
        });
        listener$c.send('videosize', {
          width: _video.videoWidth,
          height: _video.videoHeight
        });
        scale();
        mutation();
        if (customsubs) customsubs.update(_video.currentTime);
      }); // обновляем субтитры


      _video.addEventListener('subtitle', function (e) {
        //В srt существует тег {\anX}, где X - цифра от 1 до 9, Тег определяет нестандартное положение субтитра на экране.
        //Здесь удаляется тег из строки и обрабатывается положение 8 (субтитр вверху по центру).
        //{\an8} используется когда нужно, чтобы субтитр не перекрывал надписи в нижней части экрана или субтитры вшитые в видеоряд.
        subtitles$1.removeClass('on-top');
        var posTag = e.text.match(/^{\\an(\d)}/);

        if (posTag) {
          e.text = e.text.replace(/^{\\an(\d)}/, '');

          if (posTag[1] && parseInt(posTag[1]) === 8) {
            subtitles$1.addClass('on-top');
          }
        }

        e.text = e.text.trim();
        $('> div', subtitles$1).html(e.text ? e.text : '&nbsp;').css({
          display: e.text ? 'inline-block' : 'none'
        });
      }); //получены первые данные


      _video.addEventListener('loadeddata', function (e) {
        listener$c.send('videosize', {
          width: _video.videoWidth,
          height: _video.videoHeight
        });
        scale();
        if (neeed_speed) speed(neeed_speed);
        loaded$1();
      }); // для страховки


      _video.volume = 1;
      _video.muted = false;
    }
    /**
     * Может поможет избавится от скринсейва
     */


    function mutation() {
      if (last_mutation < Date.now() - 5000) {
        var style = _video.style;
        style.top = style.top;
        style.left = style.left;
        style.width = style.width;
        style.height = style.height;
        last_mutation = Date.now();
      }
    }
    /**
     * Конвертировать object to array
     * @param {object[]} arr
     * @returns {array}
     */


    function convertToArray(arr) {
      if (!Arrays.isArray(arr)) {
        var new_arr = [];

        for (var index = 0; index < arr.length; index++) {
          new_arr.push(arr[index]);
        }

        arr = new_arr;
      }

      return arr;
    }
    /**
     * Масштаб видео
     */


    function scale() {
      if (!neeed_sacle) return;
      var vw = _video.videoWidth,
          vh = _video.videoHeight,
          rt = 1,
          sx = 1.00,
          sy = 1.00;
      if (vw == 0 || vh == 0 || typeof vw == 'undefined') return;

      var increase = function increase(sfx, sfy) {
        rt = Math.min(window.innerWidth / vw, window.innerHeight / vh);
        sx = sfx;
        sy = sfy;
      };

      if (neeed_sacle == 'default') {
        rt = Math.min(window.innerWidth / vw, window.innerHeight / vh);
      } else if (neeed_sacle == 'fill') {
        rt = Math.min(window.innerWidth / vw, window.innerHeight / vh);
        sx = window.innerWidth / (vw * rt);
        sy = window.innerHeight / (vh * rt);
      } else if (neeed_sacle == 's115') {
        increase(1.15, 1.15);
      } else if (neeed_sacle == 's130') {
        increase(1.34, 1.34);
      } else if (neeed_sacle == 'v115') {
        increase(1.01, 1.15);
      } else if (neeed_sacle == 'v130') {
        increase(1.01, 1.34);
      } else {
        rt = Math.min(window.innerWidth / vw, window.innerHeight / vh);
        vw = vw * rt;
        vh = vh * rt;
        rt = Math.max(window.innerWidth / vw, window.innerHeight / vh);
        sx = rt;
        sy = rt;
      }

      sx = sx.toFixed(2);
      sy = sy.toFixed(2);

      if (Platform.is('orsay') || Storage.field('player_scale_method') == 'calculate') {
        var nw = vw * rt,
            nh = vh * rt;
        var sz = {
          width: Math.round(nw * sx) + 'px',
          height: Math.round(nh * sy) + 'px',
          marginLeft: Math.round(window.innerWidth / 2 - nw * sx / 2) + 'px',
          marginTop: Math.round(window.innerHeight / 2 - nh * sy / 2) + 'px'
        };
      } else {
        var sz = {
          width: Math.round(window.innerWidth) + 'px',
          height: Math.round(window.innerHeight) + 'px',
          transform: sx == 1.00 ? 'unset' : 'scaleX(' + sx + ') scaleY(' + sy + ')'
        };
      }

      $(_video).css(sz);
      neeed_sacle = false;
    }
    /**
     * Сохранить текущие состояние дорожек и сабов
     * @returns {{sub:integer, track:integer, level:integer}}
     */


    function saveParams() {
      var subs = _video.customSubs || _video.webos_subs || _video.textTracks || [];
      var tracks = [];
      if (hls && hls.audioTracks && hls.audioTracks.length) tracks = hls.audioTracks;else if (_video.audioTracks && _video.audioTracks.length) tracks = _video.audioTracks;
      if (webos && webos.sourceInfo) tracks = _video.webos_tracks || [];

      if (tracks.length) {
        for (var i = 0; i < tracks.length; i++) {
          if (tracks[i].enabled == true || tracks[i].selected == true) {
            params$1.track = i;
            params$1.trackName = tracks[i].title;
          }
        }
      }

      if (subs.length) {
        for (var _i = 0; _i < subs.length; _i++) {
          if (subs[_i].enabled == true || subs[_i].selected == true) {
            params$1.sub = subs[_i].index;
            params$1.subName = subs[_i].title;
          }
        }
      }

      if (hls && hls.levels) params$1.level = hls.currentLevel;
      console.log('WebOS', 'saved params', params$1);
      return params$1;
    }
    /**
     * Очисить состояние
     */


    function clearParamas() {
      params$1 = {};
    }
    /**
     * Загрузитьновое состояние из прошлого
     * @param {{sub:integer, track:integer, level:integer}} saved_params
     */


    function setParams(saved_params) {
      params$1 = saved_params;
    }
    /**
     * Смотрим есть ли дорожки и сабы
     */


    function loaded$1() {
      var tracks = [];
      var subs = _video.customSubs || _video.textTracks || [];
      console.log('WebOS', 'video full loaded');
      if (hls) console.log('Player', 'hls test', hls.audioTracks.length);

      if (hls && hls.audioTracks && hls.audioTracks.length) {
        tracks = hls.audioTracks;
        tracks.forEach(function (track) {
          if (hls.audioTrack == track.id) track.selected = true;
          Object.defineProperty(track, "enabled", {
            set: function set(v) {
              if (v) hls.audioTrack = track.id;
            },
            get: function get() {}
          });
        });
      } else if (_video.audioTracks && _video.audioTracks.length) tracks = _video.audioTracks;

      console.log('Player', 'tracks', _video.audioTracks);

      if (webos && webos.sourceInfo) {
        tracks = [];
        if (webos_wait.tracks) webosLoadTracks();
        if (webos_wait.subs) webosLoadSubs();
      }

      if (tracks.length) {
        tracks = convertToArray(tracks);

        if (typeof params$1.track !== 'undefined' && tracks[params$1.track]) {
          tracks.forEach(function (e) {
            e.selected = false;
          });
          tracks[params$1.track].enabled = true;
          tracks[params$1.track].selected = true;
          console.log('WebOS', 'enable track by default');
        }

        listener$c.send('tracks', {
          tracks: tracks
        });
      }

      if (subs.length) {
        subs = convertToArray(subs);

        if (typeof params$1.sub !== 'undefined' && subs[params$1.sub]) {
          subs.forEach(function (e) {
            e.mode = 'disabled';
            e.selected = false;
          });
          subs[params$1.sub].mode = 'showing';
          subs[params$1.sub].selected = true;
          subsview(true);
        } else if (Storage.field('subtitles_start')) {
          var full = subs.find(function (s) {
            return (s.label || '').indexOf('олные') >= 0;
          });

          if (full) {
            full.mode = 'showing';
            full.selected = true;
          } else {
            subs[0].mode = 'showing';
            subs[0].selected = true;
          }

          subsview(true);
        }

        listener$c.send('subs', {
          subs: subs
        });
      }

      if (hls && hls.levels) {
        var current_level = 'AUTO';
        hls.levels.forEach(function (level, i) {
          level.title = level.qu ? level.qu : level.width ? level.width + 'x' + level.height : 'AUTO';

          if (hls.currentLevel == i) {
            current_level = level.title;
            level.selected = true;
          }

          Object.defineProperty(level, "enabled", {
            set: function set(v) {
              if (v) hls.currentLevel = i;
            },
            get: function get() {}
          });
        });

        if (typeof params$1.level !== 'undefined' && hls.levels[params$1.level]) {
          hls.levels.map(function (e) {
            return e.selected = false;
          });
          hls.levels[params$1.level].enabled = true;
          hls.levels[params$1.level].selected = true;
          current_level = hls.levels[params$1.level].title;
        }

        listener$c.send('levels', {
          levels: hls.levels,
          current: current_level
        });
      }
    }
    /**
     * Установить собственные субтитры
     * @param {[{index:integer, label:string, url:string}]} subs
     */


    function customSubs(subs) {
      _video.customSubs = Arrays.clone(subs);
      console.log('Player', 'custom subs', subs);
      customsubs = new CustomSubs();
      customsubs.listener.follow('subtitle', function (e) {
        $('> div', subtitles$1).html(e.text ? e.text : '&nbsp;').css({
          display: e.text ? 'inline-block' : 'none'
        });
      });
      var index = -1;

      _video.customSubs.forEach(function (sub) {
        index++;
        if (typeof sub.index == 'undefined') sub.index = index;

        if (!sub.ready) {
          sub.ready = true;
          Object.defineProperty(sub, "mode", {
            set: function set(v) {
              if (v == 'showing') {
                customsubs.load(sub.url);
              }
            },
            get: function get() {}
          });
        }
      });
    }
    /**
     * Включить или выключить субтитры
     * @param {boolean} status
     */


    function subsview(status) {
      subtitles$1.toggleClass('hide', !status);
    }
    /**
     * Применяет к блоку субтитров пользовательские настройки
     */


    function applySubsSettings() {
      var hasStroke = Storage.field('subtitles_stroke'),
          hasBackdrop = Storage.field('subtitles_backdrop'),
          size = Storage.field('subtitles_size');
      subtitles$1.removeClass('has--stroke has--backdrop size--normal size--large size--small');
      subtitles$1.addClass('size--' + size);

      if (hasStroke) {
        subtitles$1.addClass('has--stroke');
      }

      if (hasBackdrop) {
        subtitles$1.addClass('has--backdrop');
      }
    }
    /**
     * Создать контейнер для видео
     */


    function create$k() {
      var videobox;

      if (Platform.is('tizen') && Storage.field('player') == 'tizen') {
        videobox = AVPlay(function (object) {
          _video = object;
        });
      } else {
        videobox = $('<video class="player-video__video" poster="./img/video_poster.png" crossorigin="anonymous"></video>');
        _video = videobox[0];

        if (Storage.field('player_normalization')) {
          try {
            console.log('Player', 'normalization enabled');
            normalization = new Normalization();
            normalization.attach(_video);
          } catch (e) {
            console.log('Player', 'normalization error:', e.stack);
          }
        }
      }

      applySubsSettings();
      display.append(videobox);

      if (Platform.is('webos') && !webos) {
        webos = new create$l(_video);

        webos.callback = function () {
          var src = _video.src;
          var sub = _video.customSubs;
          console.log('WebOS', 'video loaded');
          $(_video).remove();
          if (normalization) normalization.destroy();
          url$5(src);
          _video.customSubs = sub;
          webos.repet(_video);
          listener$c.send('reset_continue', {});
        };

        webos.start();
      }

      bind$2();
    }

    function normalizationVisible(status) {
      if (normalization) normalization.visible(status);
    }
    /**
     * Показать згразку или нет
     * @param {boolean} status
     */


    function loader$1(status) {
      wait = status;
      html$a.toggleClass('video--load', status);
    }
    /**
     * Устанавливаем ссылку на видео
     * @param {string} src
     */


    function url$5(src) {
      loader$1(true);

      if (hls) {
        hls.destroy();
        hls = false;
      }

      create$k();

      if (/.m3u8/.test(src) && typeof Hls !== 'undefined') {
        if (navigator.userAgent.toLowerCase().indexOf('maple') > -1) src += '|COMPONENT=HLS';

        if (Storage.field('player_hls_method') == 'application' && _video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Player', 'use hls:', 'application');
          load$1(src);
        } else if (Hls.isSupported() && !(Platform.is('tizen') && Storage.field('player') == 'tizen')) {
          console.log('Player', 'use hls:', 'program');

          try {
            hls = new Hls();
            hls.attachMedia(_video);
            hls.loadSource(src);
            hls.on(Hls.Events.ERROR, function (event, data) {
              if (data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR) {
                if (data.reason === "no EXTM3U delimiter") {
                  load$1(src);
                }
              }
            });
            hls.on(Hls.Events.MANIFEST_LOADED, function () {
              play$1();
            });
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
              hls.currentLevel = hlsLevelDefault(hls);
            });
          } catch (e) {
            console.log('Player', 'HLS play error:', e.message);
            load$1(src);
          }
        } else load$1(src);
      } else load$1(src);
    }

    function hlsLevelDefault(where) {
      var start_level = where.levels.find(function (level, i) {
        var level_width = level.width || 0;
        var level_height = level.height || 0;
        var quality_width = Math.round(Storage.field('video_quality_default') * 1.777);
        var quality_height = Storage.field('video_quality_default');
        var w = level_width > quality_width - 50 && level_width < quality_width + 50;
        var h = level_height > quality_height - 50 && level_height < quality_height + 50;
        return w || h;
      });
      return start_level ? where.levels.indexOf(start_level) : where.currentLevel;
    }
    /**
     * Начать загрузку
     * @param {string} src
     */


    function load$1(src) {
      _video.src = src;

      _video.load();

      play$1();
    }
    /**
     * Играем
     */


    function play$1() {
      if (timer$4.retryPlayOnError) clearTimeout(timer$4.retryPlayOnError);
      var playPromise;

      try {
        playPromise = _video.play();
      } catch (e) {}

      var videoUrl = _video.src;

      if (playPromise !== undefined) {
        playPromise.then(function () {
          console.log('Player', 'start plaining');
        })["catch"](function (e) {
          console.log('Player', 'play promise error:', e.message); // let pausePromise = pause();
          // if (pausePromise) {
          //     pausePromise.then(function () {
          //         setTimeout(function () {
          //             play();
          //         }, 1000);
          //     });
          // }

          if (e.message && !e.message.includes('request was interrupted by a call to pause') && (_video.src === videoUrl || hls)) {
            timer$4.retryPlayOnError = setTimeout(function () {
              listener$c.send('restart', {});
              listener$c.send('reset_continue', {});
            }, 5000);
          }
        });
      }

      paused.addClass('hide');
      listener$c.send('play', {});
    }
    /**
     * Пауза
     */


    function pause() {
      if (timer$4.retryPlayOnError) clearTimeout(timer$4.retryPlayOnError);
      var pausePromise;

      try {
        pausePromise = _video.pause();
      } catch (e) {}

      if (pausePromise !== undefined) {
        pausePromise.then(function () {
          console.log('Player', 'pause');
        })["catch"](function (e) {
          console.log('Player', 'pause promise error:', e.message);
        });
      }

      paused.removeClass('hide');
      listener$c.send('pause', {});
    }
    /**
     * Играем или пауза
     */


    function playpause() {
      if (wait || rewind_position) return;

      if (_video.paused) {
        play$1();
        listener$c.send('play', {});
      } else {
        pause();
        listener$c.send('pause', {});
      }
    }
    /**
     * Завершаем перемотку
     * @param {boolean} immediately - завершить немедленно
     */


    function rewindEnd(immediately) {
      clearTimeout(timer$4.rewind_call);
      timer$4.rewind_call = setTimeout(function () {
        _video.currentTime = rewind_position;
        rewind_position = 0;
        rewind_force = 0;
        play$1();
        if (webos) webos.rewinded();
      }, immediately ? 0 : 500);
    }
    /**
     * Подготовка к перемотке
     * @param {number} position_time - новое время
     * @param {boolean} immediately - завершить немедленно
     */


    function rewindStart(position_time, immediately) {
      if (!_video.duration) return;
      rewind_position = Math.max(0, Math.min(position_time, _video.duration));
      pause();
      if (rewind_position == 0) _video.currentTime = 0;else if (rewind_position == _video.duration) _video.currentTime = _video.duration;
      timer$4.rewind = Date.now();
      listener$c.send('timeupdate', {
        duration: _video.duration,
        current: rewind_position
      });
      listener$c.send('rewind', {});
      rewindEnd(immediately);
    }
    /**
     * Начать перематывать
     * @param {boolean} forward - направление, true - вперед
     * @param {number} custom_step - свое значение в секундах
     */


    function rewind(forward, custom_step) {
      if (_video.duration) {
        var time = Date.now(),
            step = _video.duration / (30 * 60),
            mini = time - (timer$4.rewind || 0) > 50 ? 20 : 60;

        if (rewind_position == 0) {
          rewind_force = Math.min(mini, custom_step || 30 * step);
          rewind_position = _video.currentTime;
        }

        rewind_force *= 1.03;

        if (forward) {
          rewind_position += rewind_force;
        } else {
          rewind_position -= rewind_force;
        }

        rewindStart(rewind_position);
      }
    }
    /**
     * Размер видео, масштаб
     * @param {string} type
     */


    function size$1(type) {
      neeed_sacle = type;
      neeed_sacle_last = type;
      scale();
      if (_video.size) _video.size(type);
    }

    function speed(value) {
      neeed_speed = value;
      var fv = value == 'default' ? 1 : parseFloat(value);
      if (_video.speed) _video.speed(fv);else _video.playbackRate = fv;
    }
    /**
     * Перемотка на позицию
     * @param {number} type
     */


    function to(seconds) {
      pause();
      if (seconds == -1) _video.currentTime = _video.duration - 3;else _video.currentTime = seconds;
      play$1();
    }

    function enterToPIP() {
      if (!document.pictureInPictureElement && document.pictureInPictureEnabled && _video.requestPictureInPicture) {
        _video.requestPictureInPicture();
      }
    }

    function exitFromPIP() {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
    }

    function togglePictureInPicture() {
      if (document.pictureInPictureElement) exitFromPIP();else enterToPIP();
    }
    /**
     * Уничтожить
     * @param {boolean} type - сохранить с параметрами
     */


    function destroy$5(savemeta) {
      subsview(false);
      neeed_sacle = false;
      paused.addClass('hide');
      if (webos) webos.destroy();
      webos = null;
      webos_wait = {};
      var hls_destoyed = false;

      if (hls) {
        hls.destroy();
        hls = false;
        hls_destoyed = true;
      }

      if (!savemeta) {
        if (customsubs) {
          customsubs.destroy();
          customsubs = false;
        }
      }

      exitFromPIP();

      if (_video && !hls_destoyed) {
        if (_video.destroy) _video.destroy();else {
          _video.src = "";

          _video.load();
        }
      }

      if (normalization) {
        normalization.destroy();
        normalization = false;
      }

      display.empty();
      if (clickTimer) clearTimeout(clickTimer);
      if (timer$4.retryPlayOnError) clearTimeout(timer$4.retryPlayOnError);
      loader$1(false);
    }

    function render$9() {
      return html$a;
    }

    function isShouldRewindVideo(e) {
      var videoWidth = _video.offsetWidth;
      return e.offsetX < videoWidth / 2;
    }

    function rewindOnMultiClick(numClicks) {
      var rewindSeconds = (numClicks - 1) * seekSpeed;
      rewindIconValue.innerHTML = "-".concat(rewindSeconds, "  sec");
      rewindIcon.addClass('animate-in-rewind');
      to(_video.currentTime - rewindSeconds);
    }

    function forwardOnMultiClick(numClicks) {
      var forwardSeconds = (numClicks - 1) * seekSpeed;
      forwardIconValue.innerHTML = "+".concat(forwardSeconds, "  sec");
      forwardIcon.addClass('animate-in-forward');
      to(_video.currentTime + forwardSeconds);
    }

    function handleClick(e) {
      var shouldRewindVideo = isShouldRewindVideo(e);
      if (clickTimer) clearTimeout(clickTimer);
      numClicks++;

      if (numClicks === 1) {
        clickTimer = setTimeout(function () {
          numClicks = 0;
          Panel.toggleVisibility();
        }, 300);
      } else if (numClicks > 1) {
        clickTimer = setTimeout(function () {
          shouldRewindVideo ? rewindOnMultiClick(numClicks) : forwardOnMultiClick(numClicks);
          numClicks = 0;
        }, 300);
      }
    }

    var Video = {
      init: init$g,
      listener: listener$c,
      url: url$5,
      render: render$9,
      destroy: destroy$5,
      playpause: playpause,
      rewind: rewind,
      play: play$1,
      pause: pause,
      size: size$1,
      speed: speed,
      subsview: subsview,
      customSubs: customSubs,
      to: to,
      video: function video() {
        return _video;
      },
      saveParams: saveParams,
      clearParamas: clearParamas,
      setParams: setParams,
      normalizationVisible: normalizationVisible,
      togglePictureInPicture: togglePictureInPicture
    };

    var html$9;
    var listener$b = start$4();
    var network$a = new create$p();
    var elems;
    var error$1, stat_timer;

    function init$f() {
      html$9 = Template$1.get('player_info');
      elems = {
        name: $('.player-info__name', html$9),
        size: $('.value--size span', html$9),
        stat: $('.value--stat span', html$9),
        speed: $('.value--speed span', html$9),
        error: $('.player-info__error', html$9)
      };
      Utils.time(html$9);
    }
    /**
     * Установить значение
     * @param {string} need
     * @param {string|{width,height}} value
     */


    function set$2(need, value) {
      if (need == 'name') elems.name.html(value);else if (need == 'size' && value.width && value.height) elems.size.text(value.width + 'x' + value.height);else if (need == 'error') {
        clearTimeout(error$1);
        elems.error.removeClass('hide').text(value);
        error$1 = setTimeout(function () {
          elems.error.addClass('hide');
        }, 10000);
      } else if (need == 'stat') stat$1(value);else if (need == 'bitrate') elems.stat.text(value);
    }
    /**
     * Показываем статистику по торренту
     * @param {string} url
     */


    function stat$1(url) {
      var wait = 0;
      elems.stat.text('- / - • - seeds');
      elems.speed.text('--');

      var update = function update() {
        // если панель скрыта, то зачем каждую секунду чекать? хватит и 5 сек
        // проверено, если ставить на паузу, разадача удаляется, но если чекать постоянно, то все норм
        if (!html$9.hasClass('info--visible')) {
          wait++;
          if (wait <= 5) return;else wait = 0;
        }

        network$a.timeout(2000);
        network$a.silent(url.replace('preload', 'stat').replace('play', 'stat'), function (data) {
          elems.stat.text((data.active_peers || 0) + ' / ' + (data.total_peers || 0) + ' • ' + (data.connected_seeders || 0) + ' ' + Lang.translate('connected_seeds'));
          elems.speed.text(Utils.bytesToSize(data.download_speed ? data.download_speed * 8 : 0, true));
          url.match(/link=(.*?)\&/);
          listener$b.send('stat', {
            data: data
          });
        });
      };

      stat_timer = setInterval(update, 2000);
      update();
    }
    /**
     * Показать скрыть инфо
     * @param {boolean} status
     */


    function toggle$7(status) {
      html$9.toggleClass('info--visible', status);
    }

    function loading$1() {
      elems.size.text(Lang.translate('loading') + '...');
    }
    /**
     * Уничтожить
     */


    function destroy$4() {
      elems.size.text(Lang.translate('loading') + '...');
      elems.stat.text('');
      elems.speed.text('');
      elems.error.addClass('hide');
      clearTimeout(error$1);
      clearInterval(stat_timer);
      network$a.clear();
    }

    function render$8() {
      return html$9;
    }

    var Info = {
      init: init$f,
      listener: listener$b,
      render: render$8,
      set: set$2,
      toggle: toggle$7,
      loading: loading$1,
      destroy: destroy$4
    };

    var listener$a = start$4();
    var current = '';
    var playlist$1 = [];
    var position$1 = 0;
    /**
     * Показать плейлист
     */

    function show$2() {
      active$3();
      var enabled = Controller.enabled();
      Select.show({
        title: Lang.translate('player_playlist'),
        items: playlist$1,
        onSelect: function onSelect(a) {
          Controller.toggle(enabled.name);
          listener$a.send('select', {
            playlist: playlist$1,
            item: a,
            position: position$1
          });
        },
        onBack: function onBack() {
          Controller.toggle(enabled.name);
        }
      });
    }
    /**
     * Установить активным
     */


    function active$3() {
      playlist$1.forEach(function (element) {
        element.selected = element.url == current;
        if (element.selected) position$1 = playlist$1.indexOf(element);
      });
    }
    /**
     * Назад
     */


    function prev() {
      active$3();

      if (position$1 > 0) {
        listener$a.send('select', {
          playlist: playlist$1,
          position: position$1 - 1,
          item: playlist$1[position$1 - 1]
        });
      }
    }
    /**
     * Далее
     */


    function next() {
      active$3();

      if (position$1 < playlist$1.length - 1) {
        listener$a.send('select', {
          playlist: playlist$1,
          position: position$1 + 1,
          item: playlist$1[position$1 + 1]
        });
      } else {
        listener$a.send('playlistEnded');
      }
    }
    /**
     * Установить плейлист
     * @param {[{title:string, url:string}]} p
     */


    function set$1(p) {
      playlist$1 = p;
      playlist$1.forEach(function (l, i) {
        if (l.url == current) position$1 = i;
      });
      listener$a.send('set', {
        playlist: playlist$1,
        position: position$1
      });
    }
    /**
     * Получить список
     * @returns {[{title:string, url:string}]}
     */


    function get$c() {
      return playlist$1;
    }
    /**
     * Установить текуший урл
     * @param {string} u
     */


    function url$4(u) {
      current = u;
    }

    var Playlist = {
      listener: listener$a,
      show: show$2,
      url: url$4,
      get: get$c,
      set: set$1,
      prev: prev,
      next: next
    };

    var listener$9 = start$4();
    var enabled$1 = false;
    var worked = false;
    var chrome = false;
    var img$3;
    var html$8;
    var movies = [];
    var timer$3 = {};
    var position = 0;
    var slides$1 = 'one';
    var direct = ['lt', 'rt', 'br', 'lb', 'ct'];

    function toggle$6(is_enabled) {
      enabled$1 = is_enabled;
      if (enabled$1) resetTimer();else clearTimeout(timer$3.wait);
      listener$9.send('toggle', {
        status: enabled$1
      });
    }

    function enable$1() {
      toggle$6(true);
    }

    function disable() {
      toggle$6(false);
    }

    function resetTimer() {
      if (!enabled$1) return;
      clearTimeout(timer$3.wait);
      if (!Storage.field('screensaver')) return;
      timer$3.wait = setTimeout(function () {
        if (Storage.field('screensaver_type') == 'nature') startSlideshow();else startChrome();
      }, 300 * 1000); //300 * 1000 = 5 минут
    }

    function startChrome() {
      worked = true;
      chrome = $('<div class="screensaver-chrome"><iframe src="https://clients3.google.com/cast/chromecast/home" class="screensaver-chrome__iframe"></iframe><div class="screensaver-chrome__overlay"></div></div>');
      chrome.find('.screensaver-chrome__overlay').on('click', function () {
        stopSlideshow();
      });
      $('body').append(chrome);
    }

    function startSlideshow() {
      if (!Storage.field('screensaver')) return;
      worked = true;
      html$8.fadeIn(300);
      Utils.time(html$8);
      nextSlide();
      timer$3.work = setInterval(function () {
        nextSlide();
      }, 30000);
      timer$3.start = setTimeout(function () {
        html$8.addClass('visible');
      }, 5000);
    }

    function nextSlide() {
      var movie = movies[position];
      var image = 'https://source.unsplash.com/1600x900/?nature&order_by=relevant&v=' + Math.random();
      img$3 = null;
      img$3 = new Image();
      img$3.src = image;

      img$3.onload = function () {
        var to = $('.screensaver__slides-' + (slides$1 == 'one' ? 'two' : 'one'), html$8);
        to[0].src = img$3.src;
        to.removeClass(direct.join(' ') + ' animate').addClass(direct[Math.floor(Math.random() * direct.length)]);
        setTimeout(function () {
          $('.screensaver__title', html$8).removeClass('visible');
          $('.screensaver__slides-' + slides$1, html$8).removeClass('visible');
          slides$1 = slides$1 == 'one' ? 'two' : 'one';
          to.addClass('visible').addClass('animate');

          if (movie) {
            setTimeout(function () {
              $('.screensaver__title-name', html$8).text(movie.title || movie.name);
              $('.screensaver__title-tagline', html$8).text(movie.original_title || movie.original_name);
              $('.screensaver__title', html$8).addClass('visible');
            }, 500);
          }
        }, 3000);
      };

      img$3.onerror = function (e) {
        console.error(e);
      };

      position++;
      if (position >= movies.length) position = 0;
    }

    function stopSlideshow() {
      setTimeout(function () {
        worked = false;
      }, 300);
      html$8.fadeOut(300, function () {
        html$8.removeClass('visible');
      });
      clearInterval(timer$3.work);
      clearTimeout(timer$3.start);
      movies = [];

      if (chrome) {
        chrome.remove();
        chrome = false;
      }
    }

    function init$e() {
      html$8 = Template$1.get('screensaver');
      html$8.on('click', function () {
        if (isWorked()) stopSlideshow();
      });
      $('body').append(html$8);
      resetTimer();
      Keypad.listener.follow('keydown', function (e) {
        resetTimer();

        if (worked) {
          stopSlideshow();
          e.event.preventDefault();
        }
      });
      Keypad.listener.follow('keyup', function (e) {
        if (worked) e.event.preventDefault();
      });
      $(window).on('mousedown', function (e) {
        resetTimer();
      });
    }

    function isWorked() {
      return enabled$1 ? worked : enabled$1;
    }

    function render$7() {
      return html$8;
    }

    var Screensaver = {
      listener: listener$9,
      init: init$e,
      enable: enable$1,
      render: render$7,
      disable: disable,
      isWorked: isWorked,
      //for android back
      stopSlideshow: stopSlideshow //for android back

    };

    var html$7, active$2, scroll$1, last$2;

    function open$4(params) {
      active$2 = params;
      html$7 = Template$1.get('modal', {
        title: params.title
      });
      html$7.on('click', function (e) {
        if (!$(e.target).closest($('.modal__content', html$7)).length) window.history.back();
      });
      title$1(params.title);
      html$7.toggleClass('modal--medium', params.size == 'medium' ? true : false);
      html$7.toggleClass('modal--large', params.size == 'large' ? true : false);
      html$7.toggleClass('modal--overlay', params.overlay ? true : false);
      scroll$1 = new create$o({
        over: true,
        mask: params.mask
      });
      html$7.find('.modal__body').append(scroll$1.render());
      bind$1(params.html);
      scroll$1.append(params.html);
      $('body').append(html$7);
      toggle$5();
    }

    function bind$1(where) {
      where.find('.selector').on('hover:focus', function (e) {
        last$2 = e.target;
        scroll$1.update($(e.target));
      }).on('hover:enter', function (e) {
        if (active$2.onSelect) active$2.onSelect($(e.target));
      });
    }

    function jump(tofoward) {
      var select = scroll$1.render().find('.selector.focus');
      if (tofoward) select = select.nextAll().filter('.selector');else select = select.prevAll().filter('.selector');
      select = select.slice(0, 10);
      select = select.last();

      if (select.length) {
        Controller.collectionFocus(select[0], scroll$1.render());
      }
    }

    function toggle$5() {
      Controller.add('modal', {
        invisible: true,
        toggle: function toggle() {
          Controller.collectionSet(scroll$1.render());
          Controller.collectionFocus(last$2, scroll$1.render());
        },
        up: function up() {
          Navigator.move('up');
        },
        down: function down() {
          Navigator.move('down');
        },
        right: function right() {
          jump(true);
        },
        left: function left() {
          jump(false);
        },
        back: function back() {
          if (active$2.onBack) active$2.onBack();
        }
      });
      Controller.toggle('modal');
    }

    function update$5(new_html, lastViewed) {
      last$2 = lastViewed ? lastViewed : false;
      scroll$1.clear();
      scroll$1.append(new_html);
      bind$1(new_html);
      toggle$5();
    }

    function title$1(tit) {
      html$7.find('.modal__title').text(tit);
      html$7.toggleClass('modal--empty-title', tit ? false : true);
    }

    function destroy$3() {
      last$2 = false;
      scroll$1.destroy();
      html$7.remove();
    }

    function close$2() {
      destroy$3();
    }

    function render$6() {
      return html$7;
    }

    var Modal = {
      open: open$4,
      close: close$2,
      update: update$5,
      title: title$1,
      toggle: toggle$5,
      render: render$6
    };

    var network$9 = new create$p();

    function url$3() {
      var u = ip();
      return u ? Utils.checkHttp(u) : u;
    }

    function ip() {
      return Storage.get(Storage.field('torrserver_use_link') == 'two' ? 'torrserver_url_two' : 'torrserver_url');
    }

    function my(success, fail) {
      var data = JSON.stringify({
        action: 'list'
      });
      clear$8();
      network$9.silent(url$3() + '/torrents', function (result) {
        if (result.length) success(result);else fail();
      }, fail, data);
    }

    function add$9(object, success, fail) {
      var data = JSON.stringify({
        action: 'add',
        link: object.link,
        title: '[LAMPA] ' + (object.title + '').replace('??', '?'),
        poster: object.poster,
        data: object.data ? JSON.stringify(object.data) : '',
        save_to_db: true
      });
      clear$8();
      network$9.silent(url$3() + '/torrents', success, fail, data);
    }

    function hash$1(object, success, fail) {
      var data = JSON.stringify({
        action: 'add',
        link: object.link,
        title: '[LAMPA] ' + (object.title + '').replace('??', '?'),
        poster: object.poster,
        data: object.data ? JSON.stringify(object.data) : '',
        save_to_db: Storage.get('torrserver_savedb', 'false')
      });
      clear$8();
      network$9.silent(url$3() + '/torrents', success, function (a, c) {
        fail(network$9.errorDecode(a, c));
      }, data);
    }

    function files$1(hash, success, fail) {
      var data = JSON.stringify({
        action: 'get',
        hash: hash
      });
      clear$8();
      network$9.timeout(2000);
      network$9.silent(url$3() + '/torrents', function (json) {
        if (json.file_stats) {
          success(json);
        }
      }, fail, data);
    }

    function viewed$1(hash, success, fail) {
      var data = JSON.stringify({
        action: 'list',
        hash: hash
      });
      clear$8();
      network$9.timeout(5000);
      network$9.silent(url$3() + '/viewed', function (json) {
        // [{"hash":"e60299487674774eaa769aeb31ab28f26b457899","file_index":1}]   -json array
        success(json);
      }, fail, data);
    }

    function resetViewed(hash, success, fail) {
      var data = JSON.stringify({
        "action": "rem",
        "file_index": -1,
        "hash": hash
      });
      clear$8();
      network$9.timeout(5000);
      network$9.silent(url$3() + '/viewed', success, fail, data, {
        dataType: 'text'
      });
    }

    function connected(success, fail) {
      clear$8();
      network$9.timeout(220000);
      network$9.silent(url$3() + '/settings', function (json) {
        if (typeof json.CacheSize == 'undefined') {
          fail(Lang.translate('torrent_error_nomatrix'));
        } else {
          success(json);
        }
      }, function (a, c) {
        fail(network$9.errorDecode(a, c));
      }, JSON.stringify({
        action: 'get'
      }));
    }

    function stream(path, hash, id) {
      return url$3() + '/stream/' + encodeURIComponent(path.split('\\').pop().split('/').pop()) + '?link=' + hash + '&index=' + id + '&' + (Storage.field('torrserver_preload') ? 'preload' : 'play');
    }

    function drop(hash, success, fail) {
      var data = JSON.stringify({
        action: 'drop',
        hash: hash
      });
      clear$8();
      network$9.silent(url$3() + '/torrents', success, fail, data, {
        dataType: 'text'
      });
    }

    function remove$1(hash, success, fail) {
      var data = JSON.stringify({
        action: 'rem',
        hash: hash
      });
      clear$8();
      network$9.silent(url$3() + '/torrents', success, fail, data, {
        dataType: 'text'
      });
    }

    function parse$1(file_path, movie, is_file) {
      var path = file_path.toLowerCase();
      var data = {
        hash: '',
        season: 0,
        episode: 0,
        serial: movie.number_of_seasons ? true : false
      };
      var math = path.match(/s([0-9]+)\.?ep?([0-9]+)/);
      if (!math) math = path.match(/s([0-9]{2})([0-9]+)/);
      if (!math) math = path.match(/[ |\[|(]([0-9]{1,2})x([0-9]+)/);

      if (!math) {
        math = path.match(/[ |\[|(]([0-9]{1,3}) of ([0-9]+)/);
        if (math) math = [0, 1, math[1]];
      }

      if (!math) {
        math = path.match(/ep?([0-9]+)/);
        if (math) math = [0, 0, math[1]];
      }

      if (is_file) {
        data.hash = Utils.hash(file_path);
      } else if (math && movie.number_of_seasons) {
        data.season = parseInt(math[1]);
        data.episode = parseInt(math[2]);

        if (data.season === 0) {
          math = path.match(/s([0-9]+)/);
          if (math) data.season = parseInt(math[1]);
        }

        if (data.episode === 0) {
          math = path.match(/ep?([0-9]+)/);
          if (math) data.episode = parseInt(math[1]);
        }

        if (isNaN(data.season)) data.season = 0;
        if (isNaN(data.episode)) data.episode = 0;

        if (data.season && data.episode) {
          data.hash = [Utils.hash(movie.original_title), data.season, data.episode].join('_');
        } else if (data.episode) {
          data.season = 1;
          data.hash = [Utils.hash(movie.original_title), data.season, data.episode].join('_');
        } else {
          hash$1 = Utils.hash(file_path);
        }
      } else if (movie.original_title && !data.serial) {
        data.hash = Utils.hash(movie.original_title);
      } else {
        data.hash = Utils.hash(file_path);
      }

      return data;
    }

    function clear$8() {
      network$9.clear();
    }

    function error() {
      var temp = Template$1.get('torrent_error', {
        ip: ip()
      });
      var list = temp.find('.torrent-checklist__list > li');
      var info = temp.find('.torrent-checklist__info > div');
      var next = temp.find('.torrent-checklist__next-step');
      var prog = temp.find('.torrent-checklist__progress-bar > div');
      var comp = temp.find('.torrent-checklist__progress-steps');
      var btn = temp.find('.selector');
      var position = -2;

      function makeStep() {
        position++;
        list.slice(0, position + 1).addClass('wait');
        var total = list.length;
        comp.text(Lang.translate('torrent_error_made') + ' ' + Math.max(0, position) + ' ' + Lang.translate('torrent_error_from') + ' ' + total);

        if (position > list.length) {
          Modal.close();
          Controller.toggle('content');
        } else if (position >= 0) {
          info.addClass('hide');
          info.eq(position).removeClass('hide');
          var next_step = list.eq(position + 1);
          prog.css('width', Math.round(position / total * 100) + '%');
          list.slice(0, position).addClass('check');
          btn.text(position < total ? Lang.translate('torrent_error_next') : Lang.translate('torrent_error_complite'));
          next.text(next_step.length ? '- ' + next_step.text() : '');
        }
      }

      makeStep();
      btn.on('hover:enter', function () {
        makeStep();
      });
      Modal.title(Lang.translate('torrent_error_connect'));
      Modal.update(temp);
      Controller.add('modal', {
        invisible: true,
        toggle: function toggle() {
          Controller.collectionSet(temp);
          Controller.collectionFocus(false, temp);
        },
        back: function back() {
          Modal.close();
          Controller.toggle('content');
        }
      });
      Controller.toggle('modal');
    }

    var Torserver = {
      ip: ip,
      my: my,
      add: add$9,
      url: url$3,
      hash: hash$1,
      files: files$1,
      clear: clear$8,
      drop: drop,
      stream: stream,
      remove: remove$1,
      connected: connected,
      parse: parse$1,
      resetViewed: resetViewed,
      viewed: viewed$1,
      error: error
    };

    var timer$2;
    var listener$8;
    /**
     * Открыть окно
     * @param {{type:string, object:{}}} params
     */

    function open$3(params) {
      var enabled = Controller.enabled().name;
      var text = params.type == 'card' ? Lang.translate('broadcast_open') : params.type == 'play' ? Lang.translate('broadcast_play') : '';
      var temp = Template$1.get('broadcast', {
        text: text
      });
      var list = temp.find('.broadcast__devices');
      if (!text) temp.find('.about').remove();

      listener$8 = function listener(e) {
        if (e.method == 'devices') {
          var devices = e.data.filter(function (d) {
            return !(d.name == 'CUB' || d.device_id == Socket.uid());
          });
          list.empty();
          devices.forEach(function (device) {
            var item = $('<div class="broadcast__device selector">' + device.name + '</div>');
            item.on('hover:enter', function () {
              close$1();
              Controller.toggle(enabled);

              if (params.type == 'card') {
                Socket.send('open', {
                  params: params.object,
                  uid: device.uid
                });
              }

              if (params.type == 'play') {
                Socket.send('other', {
                  params: {
                    submethod: 'play',
                    object: params.object
                  },
                  uid: device.uid
                });
              }
            });
            list.append(item);
          });
          Modal.toggle();
        }
      };

      Modal.open({
        title: '',
        html: temp,
        size: 'small',
        mask: true,
        onBack: function onBack() {
          close$1();
          Controller.toggle(enabled);
        }
      });
      listener$8({
        method: 'devices',
        data: Socket.devices()
      });
      Socket.listener.follow('message', listener$8);
    }
    /**
     * Закрыть окно
     */


    function close$1() {
      Socket.listener.remove('message', listener$8);
      clearInterval(timer$2);
      Modal.close();
      listener$8 = null;
    }

    var Broadcast = {
      open: open$3
    };

    var html$6;
    var listener$7 = start$4();
    var network$8 = new create$p();
    var callback$2;
    var work = false;
    var launch_player;
    var timer_ask;
    var timer_save;
    var wait_for_loading_url = false;
    var preloader = {
      wait: false
    };
    var viewing = {
      time: 0,
      difference: 0,
      current: 0
    };
    /**
     * Подписываемся на события
     */

    function init$d() {
      Panel.init();
      Video.init();
      Info.init();
      html$6 = Template$1.get('player');
      html$6.append(Video.render());
      html$6.append(Panel.render());
      html$6.append(Info.render());
      /** Следим за обновлением времени */

      Video.listener.follow('timeupdate', function (e) {
        Panel.update('time', Utils.secondsToTime(e.current | 0, true));
        Panel.update('timenow', Utils.secondsToTime(e.current || 0));
        Panel.update('timeend', Utils.secondsToTime(e.duration || 0));
        Panel.update('position', e.current / e.duration * 100 + '%');

        if (work && work.timeline && !work.timeline.waiting_for_user && e.duration) {
          if (Storage.field('player_timecode') !== 'again' && !work.timeline.continued) {
            var prend = e.duration - 15,
                posit = Math.round(e.duration * work.timeline.percent / 100);
            if (posit > 10) Video.to(posit > prend ? prend : posit);
            work.timeline.continued = true;
          } else {
            work.timeline.percent = Math.round(e.current / e.duration * 100);
            work.timeline.time = e.current;
            work.timeline.duration = e.duration;
          }
        }

        viewing.difference = e.current - viewing.current;
        viewing.current = e.current;
        if (viewing.difference > 0 && viewing.difference < 3) viewing.time += viewing.difference;
      });
      /** Буферизация видео */

      Video.listener.follow('progress', function (e) {
        Panel.update('peding', e.down);
      });
      /** Может ли плеер начать играть */

      Video.listener.follow('canplay', function (e) {
        Panel.canplay();
      });
      /** Плей видео */

      Video.listener.follow('play', function (e) {
        Screensaver.disable();
        Panel.update('play');
      });
      /** Пауза видео */

      Video.listener.follow('pause', function (e) {
        Screensaver.enable();
        Panel.update('pause');
      });
      /** Перемотка видео */

      Video.listener.follow('rewind', function (e) {
        Panel.rewind();
      });
      /** Видео было завершено */

      Video.listener.follow('ended', function (e) {
        if (Storage.field('playlist_next')) Playlist.next();
      });
      /** Дорожки полученые из видео */

      Video.listener.follow('tracks', function (e) {
        Panel.setTracks(e.tracks);
      });
      /** Субтитры полученые из видео */

      Video.listener.follow('subs', function (e) {
        Panel.setSubs(e.subs);
      });
      /** Качество видео в m3u8 */

      Video.listener.follow('levels', function (e) {
        Panel.setLevels(e.levels, e.current);
      });
      /** Размер видео */

      Video.listener.follow('videosize', function (e) {
        Info.set('size', e);
      });
      /** Ошибка при попытки возпроизвести */

      Video.listener.follow('error', function (e) {
        if (work) Info.set('error', e.error);
      });
      /** Сбросить (продолжить) */

      Video.listener.follow('reset_continue', function (e) {
        if (work && work.timeline) work.timeline.continued = false;
      });
      /** Перемотка мышкой */

      Panel.listener.follow('mouse_rewind', function (e) {
        var vid = Video.video();

        if (vid && vid.duration) {
          e.time.removeClass('hide').text(Utils.secondsToTime(vid.duration * e.percent)).css('left', e.percent * 100 + '%');

          if (e.method == 'click') {
            Video.to(vid.duration * e.percent);
          }
        }
      });
      /** Плей/Пауза */

      Panel.listener.follow('playpause', function (e) {
        Video.playpause();
      });
      /** Нажали на плейлист */

      Panel.listener.follow('playlist', function (e) {
        Playlist.show();
      });
      /** Изменить размер видео */

      Panel.listener.follow('size', function (e) {
        Video.size(e.size);
        Storage.set('player_size', e.size);
      });
      /** Изменить скорость видео */

      Panel.listener.follow('speed', function (e) {
        Video.speed(e.speed);
        Storage.set('player_speed', e.speed);
      });
      /** Предыдущая серия */

      Panel.listener.follow('prev', function (e) {
        Playlist.prev();
      });
      /** Следуюшия серия */

      Panel.listener.follow('next', function (e) {
        Playlist.next();
      });
      /** Перемотать назад */

      Panel.listener.follow('rprev', function (e) {
        Video.rewind(false);
      });
      /** Перемотать далее */

      Panel.listener.follow('rnext', function (e) {
        Video.rewind(true);
      });
      /** Показать/скрыть субтитры */

      Panel.listener.follow('subsview', function (e) {
        Video.subsview(e.status);
      });
      /** Состояние панели, скрыта или нет */

      Panel.listener.follow('visible', function (e) {
        Info.toggle(e.status);
        Video.normalizationVisible(e.status);
      });
      /** К началу видео */

      Panel.listener.follow('to_start', function (e) {
        Video.to(0);
      });
      /** К концу видео */

      Panel.listener.follow('to_end', function (e) {
        Video.to(-1);
      });
      /** На весь экран */

      Panel.listener.follow('fullscreen', function () {
        Utils.toggleFullscreen();
      });
      /** Картинка в картинке */

      Panel.listener.follow('pip', function (e) {
        Video.togglePictureInPicture();
      });
      /** Переключили качемтво видео */

      Panel.listener.follow('quality', function (e) {
        Video.destroy(true);
        Video.url(e.url);
        if (work && work.timeline) work.timeline.continued = false;
      });
      /** Нажали на кнопку (отправить) */

      Panel.listener.follow('share', function (e) {
        Broadcast.open({
          type: 'play',
          object: {
            player: work,
            playlist: Playlist.get()
          }
        });
      });
      Playlist.listener.follow('playlistEnded', function (e) {
        backward$1();
      });
      /** Событие на переключение серии */

      Playlist.listener.follow('select', function (e) {
        var type = _typeof(e.item.url);

        var call = function call() {
          var params = Video.saveParams();
          destroy$2();
          play(e.item);
          Video.setParams(params);
          if (Torserver.ip() && e.item.url.indexOf(Torserver.ip()) > -1) Info.set('stat', e.item.url);
          Panel.showNextEpisodeName({
            playlist: e.playlist,
            position: e.position
          });
        };

        if (type == 'string') call();else if (type == 'function' && !wait_for_loading_url) {
          Info.loading();
          wait_for_loading_url = true;
          e.item.url(call);
        }
      });
      Video.listener.follow('restart', function (e) {
        var params = Video.saveParams();
        var item = work;
        destroy$2();
        play(item);
        Video.setParams(params);
      });
      /** Установить название следующей серии */

      Playlist.listener.follow('set', Panel.showNextEpisodeName);
      /** Прослушиваем на сколько загрузилось, затем запускаем видео */

      Info.listener.follow('stat', function (e) {
        if (preloader.wait) {
          var pb = e.data.preloaded_bytes || 0,
              ps = e.data.preload_size || 0;
          var progress = Math.min(100, pb * 100 / ps);
          Panel.update('timenow', Math.round(progress) + '%');
          Panel.update('timeend', 100 + '%');
          Panel.update('peding', progress + '%');

          if (progress >= 90 || isNaN(progress)) {
            Panel.update('peding', '0%');
            preloader.wait = false;
            preloader.call();
          }
        }
      });
    }
    /**
     * Главный контроллер
     */


    function toggle$4() {
      Controller.add('player', {
        invisible: true,
        toggle: function toggle() {
          Panel.hide();
        },
        up: function up() {
          Panel.toggle();
        },
        down: function down() {
          Panel.toggle();
        },
        right: function right() {
          Video.rewind(true);
        },
        left: function left() {
          Video.rewind(false);
        },
        gone: function gone() {},
        enter: function enter() {
          Video.playpause();
        },
        playpause: function playpause() {
          Video.playpause();
        },
        play: function play() {
          Video.play();
        },
        pause: function pause() {
          Video.pause();
        },
        rewindForward: function rewindForward() {
          Video.rewind(true);
        },
        rewindBack: function rewindBack() {
          Video.rewind(false);
        },
        back: backward$1
      });
      Controller.toggle('player');
    }
    /**
     * Контроллер предзагрузки
     */


    function togglePreload() {
      Controller.add('player_preload', {
        invisible: true,
        toggle: function toggle() {},
        enter: function enter() {
          Panel.update('peding', '0%');
          preloader.wait = false;
          preloader.call();
        },
        back: backward$1
      });
      Controller.toggle('player_preload');
    }
    /**
     * Вызвать событие назад
     */


    function backward$1() {
      destroy$2();
      if (callback$2) callback$2();else Controller.toggle('content');
      callback$2 = false;
    }
    /**
     * Уничтожить плеер
     */


    function destroy$2() {
      saveTimeView();
      if (work.viewed) work.viewed(viewing.time);
      clearTimeout(timer_ask);
      clearInterval(timer_save);
      work = false;
      preloader.wait = false;
      preloader.call = null;
      wait_for_loading_url = false;
      viewing.time = 0;
      viewing.difference = 0;
      viewing.current = 0;
      Screensaver.enable();
      Video.destroy();
      Video.clearParamas();
      Panel.destroy();
      Info.destroy();
      html$6.detach();
      listener$7.send('destroy', {});
    }
    /**
     * Запустить webos плеер
     * @param {Object} params
     */


    function runWebOS(params) {
      webOS.service.request("luna://com.webos.applicationManager", {
        method: "launch",
        parameters: {
          "id": params.need,
          "params": {
            "payload": [{
              "fullPath": params.url,
              "artist": "",
              "subtitle": "",
              "dlnaInfo": {
                "flagVal": 4096,
                "cleartextSize": "-1",
                "contentLength": "-1",
                "opVal": 1,
                "protocolInfo": "http-get:*:video/x-matroska:DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000",
                "duration": 0
              },
              "mediaType": "VIDEO",
              "thumbnail": "",
              "deviceType": "DMR",
              "album": "",
              "fileName": params.name,
              "lastPlayPosition": params.position
            }]
          }
        },
        onSuccess: function onSuccess() {
          console.log('Player', 'The app is launched');
        },
        onFailure: function onFailure(inError) {
          console.log('Player', "Failed to launch the app (" + params.need + "): ", "[" + inError.errorCode + "]: " + inError.errorText);

          if (params.need == 'com.webos.app.photovideo') {
            params.need = 'com.webos.app.smartshare';
            runWebOS(params);
          } else if (params.need == 'com.webos.app.smartshare') {
            params.need = 'com.webos.app.mediadiscovery';
            runWebOS(params);
          }
        }
      });
    }
    /**
     * Показать предзагрузку торрента
     * @param {Object} data
     * @param {Function} call
     */


    function preload(data, call) {
      if (Torserver.ip() && data.url.indexOf(Torserver.ip()) > -1 && data.url.indexOf('&preload') > -1) {
        preloader.wait = true;
        Info.set('name', data.title);
        $('body').append(html$6);
        Panel.show(true);
        togglePreload();
        network$8.timeout(2000);
        network$8.silent(data.url);

        preloader.call = function () {
          data.url = data.url.replace('&preload', '&play');
          call();
        };
      } else call();
    }
    /**
     * Спросить продолжать ли просмотр
     */


    function ask() {
      if (work && work.timeline && work.timeline.percent) {
        work.timeline.waiting_for_user = false;

        if (Storage.field('player_timecode') == 'ask') {
          work.timeline.waiting_for_user = true;
          Select.show({
            title: Lang.translate('title_action'),
            items: [{
              title: Lang.translate('player_start_from') + ' ' + Utils.secondsToTime(work.timeline.time) + '?',
              yes: true
            }, {
              title: Lang.translate('settings_param_no')
            }],
            onBack: function onBack() {
              work.timeline.continued = true;
              toggle$4();
              clearTimeout(timer_ask);
            },
            onSelect: function onSelect(a) {
              work.timeline.waiting_for_user = false;
              if (!a.yes) work.timeline.continued = true;
              toggle$4();
              clearTimeout(timer_ask);
            }
          });
          clearTimeout(timer_ask);
          timer_ask = setTimeout(function () {
            work.timeline.continued = true;
            Select.hide();
            toggle$4();
          }, 8000);
        }
      }
    }
    /**
     * Сохранить отметку просмотра
     */


    function saveTimeView() {
      if (work.timeline && work.timeline.handler) work.timeline.handler(work.timeline.percent, work.timeline.time, work.timeline.duration);
    }
    /**
     * Сохранять отметку просмотра каждые N секунд
     */


    function saveTimeLoop() {
      if (work.timeline) {
        timer_save = setInterval(saveTimeView, 1000 * 30);
      }
    }
    /**
     * Запустить плеер
     * @param {Object} data
     */


    function play(data) {
      console.log('Player', 'url:', data.url);

      var lauch = function lauch() {
        preload(data, function () {
          var _data$translate;

          listener$7.send('start', data);
          work = data;
          if (work.timeline) work.timeline.continued = false;
          Playlist.url(data.url);
          Panel.quality(data.quality, data.url);
          if (data.translate) Panel.setTranslate(data.translate);
          Video.url(data.url);
          Video.size(Storage.get('player_size', 'default'));
          Video.speed(Storage.get('player_speed', 'default'));
          if (data.subtitles) Video.customSubs(data.subtitles);
          Info.set('name', data.title);
          if (!preloader.call) $('body').append(html$6);
          toggle$4();
          Panel.show(true);
          Controller.updateSelects();
          ask();
          saveTimeLoop();
          listener$7.send('ready', data);
          Video.setParams({
            track: (_data$translate = data.translate) === null || _data$translate === void 0 ? void 0 : _data$translate.selectedIdx,
            sub: data.selectedSubsIdx
          });
        });
      };

      if (launch_player === 'other') {
        window.open(data.url, '_blank');
      } else if (launch_player == 'lampa') lauch();else if (Platform.is('webos') && (Storage.field('player') == 'webos' || launch_player == 'webos')) {
        data.url = data.url.replace('&preload', '&play');
        runWebOS({
          need: 'com.webos.app.photovideo',
          url: data.url,
          name: data.path || data.title,
          position: data.timeline ? data.timeline.time || -1 : -1
        });
      } else if (Platform.is('android') && (Storage.field('player') == 'android' || launch_player == 'android')) {
        data.url = data.url.replace('&preload', '&play');

        if (data.playlist && Array.isArray(data.playlist)) {
          data.playlist.forEach(function (a) {
            a.url = a.url.replace('&preload', '&play');
          });
        }

        Android.openPlayer(data.url, data);
      } else if (Platform.desktop() && Storage.field('player') == 'other') {
        var path = Storage.field('player_nw_path');

        var file = require('fs');

        if (file.existsSync(path)) {
          var spawn = require('child_process').spawn;

          spawn(path, [data.url.replace(/\s/g, '%20')]);
        } else {
          Noty.show(Lang.translate('player_not_found') + ': ' + path);
        }
      } else lauch();

      launch_player = '';
    }
    /**
     * Статистика для торрсервера
     * @param {String} url
     */


    function stat(url) {
      if (work || preloader.wait) Info.set('stat', url);
    }
    /**
     * Установить плейлист
     * @param {Array} playlist
     */


    function playlist(playlist) {
      if (work || preloader.wait) Playlist.set(playlist);
    }
    /**
     * Установить субтитры
     * @param {Array} subs
     */


    function subtitles(subs) {
      if (work || preloader.wait) {
        Video.customSubs(subs);
      }
    }
    /**
     * Запустить другой плеер
     * @param {String} need - тип плеера
     */


    function runas(need) {
      launch_player = need;
    }
    /**
     * Обратный вызов
     * @param {Function} back
     */


    function onBack(back) {
      callback$2 = back;
    }
    /**
     * Рендер плеера
     * @returns Html
     */


    function render$5() {
      return html$6;
    }
    /**
     * Возвращает статус, открыт ли плеер
     * @returns boolean
     */


    function opened$1() {
      return $('body').find('.player').length ? true : false;
    }

    var Player = {
      init: init$d,
      listener: listener$7,
      play: play,
      playlist: playlist,
      destroy: destroy$2,
      render: render$5,
      stat: stat,
      subtitles: subtitles,
      runas: runas,
      callback: onBack,
      opened: opened$1
    };

    function resetForMovie(title) {
      var viewed = Storage.cache('file_view', 10000, {});

      for (var seasonNum = 0; seasonNum < 50; seasonNum++) {
        for (var episodeNum = 0; episodeNum < 200; episodeNum++) {
          var hash = Lampa.Utils.hash([seasonNum, episodeNum, title].join(''));
          delete viewed[hash];
        }
      }

      Storage.set('file_view', viewed);
    }

    function update$4(params) {
      if (params.hash == 0) return;
      var viewed = Storage.cache('file_view', 10000, {});
      var road = viewed[params.hash];

      if (typeof road == 'undefined' || typeof road == 'number') {
        road = {
          duration: 0,
          time: 0,
          percent: 0
        };
        viewed[params.hash] = road;
      }

      if (params.duration === 0) {
        // it's a reset
        delete viewed[params.hash];
      }

      road.percent = params.percent;
      if (typeof params.time !== 'undefined') road.time = params.time;
      if (typeof params.duration !== 'undefined') road.duration = params.duration;
      Storage.set('file_view', viewed);
      var line = $('.time-line[data-hash="' + params.hash + '"]').toggleClass('hide', params.percent ? false : true);
      $('> div', line).css({
        width: params.percent + '%'
      });
      $('.time-line-details[data-hash="' + params.hash + '"]').each(function () {
        var f = format(road);
        $(this).find('[a="t"]').text(f.time);
        $(this).find('[a="p"]').text(f.percent);
        $(this).find('[a="d"]').text(f.duration); // $(this).toggleClass('hide', road.duration ? false : true)
      }); // if (!params.received) Socket.send('timeline', {params})
    }

    function view$1(hash) {
      var viewed = Storage.cache('file_view', 10000, {}),
          curent = typeof viewed[hash] !== 'undefined' ? viewed[hash] : 0;
      var road = {
        percent: 0,
        time: 0,
        duration: 0
      };

      if (_typeof(curent) == 'object') {
        road.percent = curent.percent;
        road.time = curent.time;
        road.duration = curent.duration;
      } else {
        road.percent = curent || 0;
      }

      return {
        hash: hash,
        percent: road.percent,
        time: road.time,
        duration: road.duration,
        handler: function handler(percent, time, duration) {
          return update$4({
            hash: hash,
            percent: percent,
            time: time,
            duration: duration
          });
        }
      };
    }

    function render$4(params) {
      var line = Template$1.get('timeline', params);
      line.toggleClass('hide', params.percent ? false : true);
      return line;
    }

    function details(params) {
      var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var line = Template$1.get('timeline_details', format(params));
      if (str) line.prepend(str);
      line.attr('data-hash', params.hash); // line.toggleClass('hide', params.duration ? false : true)

      return line;
    }

    function secondsToTime(sec_num) {
      var hours = Math.trunc(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      return (hours ? hours + 'ч. ' : '') + minutes + 'м.';
    }

    function format(params) {
      var road = {
        percent: params.percent + '%',
        time: secondsToTime(params.time),
        duration: secondsToTime(params.duration)
      };
      return road;
    }

    var Timeline = {
      render: render$4,
      update: update$4,
      view: view$1,
      details: details,
      resetForMovie: resetForMovie,
      format: format
    };

    var socket;
    var ping;

    var _uid = Utils.uid();

    var _devices = [];
    var listener$6 = start$4();

    function connect$1() {
      clearInterval(ping);

      try {
        socket = new WebSocket('wss://cub.rip:8443');
      } catch (e) {
        console.log('Socket', 'not working');
        return;
      }

      socket.addEventListener('open', function (event) {
        //console.log('Socket','open')
        send('start', {});
        ping = setInterval(function () {
          send('ping', {});
        }, 5000);
      });
      socket.addEventListener('close', function (event) {
        //console.log('Socket','close', event.code)
        setTimeout(connect$1, 5000);
      });
      socket.addEventListener('error', function (event) {
        console.log('Socket', 'error', event.message, event.code);
        socket.close();
      }, false);
      socket.addEventListener('message', function (event) {
        var result = JSON.parse(event.data);

        if (result.method == 'devices') {
          _devices = result.data;
        } else if (result.method == 'open') {
          Controller.toContent();
          Activity$1.push(result.data);
        } else if (result.method == 'timeline') {
          result.data.received = true; //чтоб снова не остправлять и не зациклить

          Timeline.update(result.data);
        } else if (result.method == 'bookmarks') {
          Account.update();
        } else if (result.method == 'other' && result.data.submethod == 'play') {
          Controller.toContent();
          Player.play(result.data.object.player);
          Player.playlist(result.data.object.playlist);
        }

        listener$6.send('message', result);
      });
    }

    function send(method, data) {
      var name_devise = Platform.get() ? Platform.get() : navigator.userAgent.toLowerCase().indexOf('mobile') > -1 ? 'mobile' : navigator.userAgent.toLowerCase().indexOf('x11') > -1 ? 'chrome' : 'other';
      data.device_id = _uid;
      data.name = Utils.capitalizeFirstLetter(name_devise) + ' - ' + Storage.field('device_name');
      data.method = method;
      data.version = 1;
      data.account = Storage.get('account', '{}');
      if (socket.readyState == 1) socket.send(JSON.stringify(data));
    }

    var Socket = {
      listener: listener$6,
      init: connect$1,
      send: send,
      uid: function uid() {
        return _uid;
      },
      devices: function devices() {
        return _devices;
      }
    };

    new create$p();

    var WorkerArray = /*#__PURE__*/function () {
      function WorkerArray(field) {
        _classCallCheck(this, WorkerArray);

        this.field = field;
        this.empty = [];
        this.data = [];
        this.limit = 3000;
      }

      _createClass(WorkerArray, [{
        key: "init",
        value: function init() {
          var _this = this;

          this.update(function () {
            Storage.listener.follow('change', function (e) {
              if (_this.field == e.name) {
                try {
                  _this.save(e.value);
                } catch (e) {
                  console.log('StorageWorker', _this.field, e.message);
                }
              }
            });
          });
        }
      }, {
        key: "parse",
        value: function parse(from) {
          var to = Storage.cache(this.field, this.limit, Arrays.clone(this.empty));
          this.filter(from, to);
          localStorage.setItem(this.field, JSON.stringify(to));
          this.data = to;
        }
      }, {
        key: "filter",
        value: function filter(from, to) {
          from.forEach(function (a) {
            if (to.indexOf(a) == -1) to.push(a);
          });
        }
      }, {
        key: "update",
        value: function update(call) {

          Account.canSync();

          if (call) call();
        }
      }, {
        key: "send",
        value: function send(id, value) {
          if (this.field !== 'online_view' && !Account.hasPremium()) return; //console.log('StorageWorker','send:',this.field, id,value)

          var str = JSON.stringify(value);

          if (str.length < 10000) {
            Socket.send('storage', {
              params: {
                id: id,
                name: this.field,
                value: value
              }
            });
          }
        }
      }, {
        key: "save",
        value: function save(value) {
          var _this3 = this;

          var uniq = value.filter(function (a) {
            return _this3.data.indexOf(a) == -1;
          });
          uniq.forEach(function (val) {
            _this3.data.push(val);

            _this3.send(null, val);
          });
        }
      }]);

      return WorkerArray;
    }();

    var WorkerFilterID = /*#__PURE__*/function (_WorkerArray) {
      _inherits(WorkerFilterID, _WorkerArray);

      var _super = _createSuper(WorkerFilterID);

      function WorkerFilterID() {
        _classCallCheck(this, WorkerFilterID);

        return _super.apply(this, arguments);
      }

      _createClass(WorkerFilterID, [{
        key: "filter",
        value: function filter(from, to) {
          from.forEach(function (a) {
            var find = to.find(function (b) {
              return b.id == a.id;
            });
            if (!find) to.push(a);else {
              to[to.indexOf(find)] = a;
            }
          });
        }
      }, {
        key: "save",
        value: function save(value) {
          var _this4 = this;

          var uniq = [];
          value.forEach(function (val) {
            var find = _this4.data.find(function (a) {
              return a.id == val.id;
            });

            if (!find) {
              _this4.data.push(val);

              uniq.push(val);
            } else if (JSON.stringify(val) !== JSON.stringify(find)) {
              _this4.data[_this4.data.indexOf(find)] = val;
              uniq.push(val);
            }
          });
          uniq.forEach(function (val) {
            _this4.send(null, val);
          });
        }
      }]);

      return WorkerFilterID;
    }(WorkerArray);

    var WorkerObject = /*#__PURE__*/function (_WorkerArray2) {
      _inherits(WorkerObject, _WorkerArray2);

      var _super2 = _createSuper(WorkerObject);

      function WorkerObject(params) {
        var _this5;

        _classCallCheck(this, WorkerObject);

        _this5 = _super2.call(this, params);
        _this5.data = {};
        _this5.empty = {};
        return _this5;
      }

      _createClass(WorkerObject, [{
        key: "filter",
        value: function filter(from, to) {
          for (var id in from) {
            to[id] = from[id];
          }
        }
      }, {
        key: "save",
        value: function save(value) {
          var _this6 = this;

          var uniq = [];

          for (var id in value) {
            var a = value[id];
            var b = this.data[id];

            if (!this.data[id]) {
              this.data[id] = a;
              uniq.push(id);
            } else {
              a = JSON.stringify(a);
              b = JSON.stringify(b);

              if (a !== b) {
                this.data[id] = value[id];
                uniq.push(id);
              }
            }
          }

          uniq.forEach(function (id) {
            _this6.send(id, value[id]);
          });
        }
      }]);

      return WorkerObject;
    }(WorkerArray);

    var Workers = {
      online_view: WorkerArray,
      torrents_view: WorkerArray,
      search_history: WorkerArray,
      timetable: WorkerFilterID,
      recomends_list: WorkerFilterID,
      quality_scan: WorkerFilterID,
      online_choice_videocdn: WorkerObject,
      online_choice_filmix: WorkerObject,
      online_choice_kinobase: WorkerObject,
      online_choice_cdnmovies: WorkerObject,
      online_choice_rezka: WorkerObject,
      online_last_balanser: WorkerObject
    };

    var where;
    var data$4 = {};

    function init$c() {
      data$4 = Storage.get('notice', '{}');
    } //Utils.parseTime(item.time).short


    function getNotice(call) {
      Account.notice(function (result) {
        if (result.length) {
          var items = [];
          result.forEach(function (item) {
            var data = JSON.parse(item.data);
            var desc = Lang.translate('notice_new_quality') + '<div class="notice__footer"><div>' + Lang.translate('notice_quality') + ' - <b>' + data.card.quality + '</b></div></div>';

            if (data.card.seasons) {
              var k = [];

              for (var i in data.card.seasons) {
                k.push(i);
              }

              var s = k.pop();
              desc = Lang.translate('notice_new_episode') + '<div class="notice__footer"><div>S - <b>' + s + '</b></div><div>E - <b>' + data.card.seasons[s] + '</b></div>' + (data.voice ? '<div>' + data.voice + '</div>' : '') + '</div>';
            }

            items.push({
              time: item.time || new Date(item.date).getTime(),
              title: data.card.title || data.card.name,
              descr: desc,
              card: data.card
            });
          });
          var all = items;
          all.sort(function (a, b) {
            var t_a = a.time,
                t_b = b.time;
            if (t_a > t_b) return -1;else if (t_a < t_b) return 1;else return 0;
          });
          call(all);
        } else call([]);
      });
    }

    function open$2() {
      getNotice(function (notice) {
        var html = $('<div></div>');
        notice.forEach(function (notice_item) {
          var element = Arrays.clone(notice_item);
          element.time = Utils.parseTime(element.time)["short"];
          var item = Template$1.get(element.card ? 'notice_card' : 'notice', element);

          if (element.card) {
            var img = item.find('img')[0];
            var poster_size = Storage.field('poster_size');

            img.onload = function () {};

            img.onerror = function (e) {
              img.src = './img/img_broken.svg';
            };

            img.src = element.card.poster ? element.card.poster : element.card.img ? element.card.img : Utils.protocol() + 'imagetmdb.cubnotrip.top/t/p/' + poster_size + '/' + element.card.poster_path;
            item.on('hover:enter', function () {
              Modal.close();
              Activity$1.push({
                url: '',
                component: 'full',
                id: element.card.id,
                method: element.card.seasons ? 'tv' : 'movie',
                card: element.card,
                source: 'cub'
              });
            });
          }

          html.append(item);
        });

        if (!notice.length) {
          html.append('<div class="selector about">' + Lang.translate(Account.working() ? 'notice_none_account' : 'notice_none') + '</div>');
        }

        Modal.open({
          title: Lang.translate('title_notice'),
          size: 'medium',
          html: html,
          onBack: function onBack() {
            Modal.close();
            Controller.toggle('head');
          }
        });
        data$4.time = maxtime(notice);
        Storage.set('notice', data$4);
        icon(notice);
      });
    }

    function maxtime(notice) {
      var max = 0;
      notice.forEach(function (element) {
        max = Math.max(max, element.time);
      });
      return max;
    }

    function any(notice) {
      return maxtime(notice) > data$4.time;
    }

    function icon(notice) {
      where.find('.notice--icon').toggleClass('active', any(notice));
    }

    function start$3(html) {
      where = html;
      getNotice(icon);
    }

    var Notice = {
      open: open$2,
      start: start$3,
      init: init$c
    };

    var broken_images = 0;

    function proxy(name) {
      var proxy = Storage.field(name);

      if (proxy.length > 0 && proxy.charAt(proxy.length - 1) == '/') {
        proxy = proxy.substring(0, proxy.length - 1);
      }

      return Utils.checkHttp(proxy);
    }

    function api$1(url) {
      var base = Utils.protocol() + 'api.themoviedb.org/3/' + url;
      return Storage.field('proxy_tmdb') && Storage.field('tmdb_proxy_api') ? proxy('tmdb_proxy_api') + '/' + base : base;
    }

    function image(url) {
      var base = Utils.protocol() + 'image.tmdb.org/' + url;
      return Storage.field('proxy_tmdb') && Storage.field('tmdb_proxy_image') ? proxy('tmdb_proxy_image') + '/' + base : base;
    }

    function broken() {
      broken_images++;

      if (broken_images > 50) {
        broken_images = 0;
        if (Storage.field('tmdb_proxy_image') && Storage.field('proxy_tmdb_auto')) Storage.set('proxy_tmdb', true);
      }
    }

    function key() {
      return '4ef0d7355d9ffb5151e987764708ce96';
    }

    var TMDBApi = {
      api: api$1,
      key: key,
      image: image,
      broken: broken
    };

    var data$3 = [];
    var token = '3i40G5TSECmLF77oAqnEgbx61ZWaOYaE';
    var network$7 = new create$p();
    var videocdn = 'http://cdn.svetacdn.in/api/short?api_token=' + token;
    var object$1 = false;
    /**
     * Запуск
     */

    function init$b() {
      data$3 = Storage.cache('quality_scan', 100, []);
      data$3.filter(function (elem) {
        return !elem.title;
      }).forEach(function (elem) {
        Arrays.remove(data$3, elem);
      });
      setInterval(extract$2, 60 * 1000);
    }
    /**
     * Добавить карточку для парсинга
     * @param {[{id:integer, title:string, imdb_id:string}]} elems - карточки
     */


    function add$8(elems) {
      if (!Storage.field('card_quality')) return;
      elems.filter(function (elem) {
        return !(elem.number_of_seasons || elem.seasons);
      }).forEach(function (elem) {
        var id = data$3.filter(function (a) {
          return a.id == elem.id;
        });

        if (!id.length && elem.title && typeof elem.id == 'number') {
          data$3.push({
            id: elem.id,
            title: elem.title,
            imdb_id: elem.imdb_id
          });
        }
      });
      Storage.set('quality_scan', data$3);
    }
    /**
     * Начать парсить качество
     * @param {{id:integer, title:string, imdb_id:string}} itm - карточка
     */


    function search$5(itm) {
      var url = 'http://cdn.svetacdn.in/api/';
      var type = itm.iframe_src.split('/').slice(-2)[0];
      if (type == 'movie') type = 'movies';
      url += type;
      url = Lampa.Utils.addUrlComponent(url, 'api_token=' + token);
      url = Lampa.Utils.addUrlComponent(url, itm.imdb_id ? 'imdb_id=' + encodeURIComponent(itm.imdb_id) : 'title=' + encodeURIComponent(itm.title));
      url = Lampa.Utils.addUrlComponent(url, 'field=' + encodeURIComponent('global'));
      network$7.timeout(4000);
      network$7.silent(url, function (found) {
        var results = found.data.filter(function (elem) {
          return elem.id == itm.id;
        });
        var qualitys = ['ts', 'camrip', 'webdl', 'dvdrip', 'hdrip', 'bd'];
        var index = 0;

        if (results.length && results[0].media) {
          results[0].media.map(function (m) {
            index = Math.max(index, qualitys.indexOf(m.source_quality));
            object$1.quality = qualitys[index];
            Socket.send('quality', {
              card_id: object$1.id,
              quality: object$1.quality
            });
          });
        }

        save$4();
      }, save$4);
    }
    /**
     * Найти фильм по imdb_id или титлу
     * @param {string} imdb_id
     * @param {string} query
     */


    function req(imdb_id, query) {
      var url = videocdn + '&' + (imdb_id ? 'imdb_id=' + encodeURIComponent(imdb_id) : 'title=' + encodeURIComponent(query));
      network$7.timeout(1000 * 15);
      network$7.silent(url, function (json) {
        if (json.data && json.data.length) {
          if (object$1.imdb_id) {
            var imdb = json.data.filter(function (elem) {
              return elem.imdb_id == object$1.imdb_id;
            });
            if (imdb.length) json.data = imdb;
          }

          if (json.data.length) {
            return search$5(json.data[0]);
          } else {
            Arrays.remove(data$3, object$1);
            Storage.set('quality_scan', data$3);
          }
        }

        save$4();
      }, save$4);
    }
    /**
     * Получить карточку которую нужно парсить
     */


    function extract$2() {
      if (!Storage.field('card_quality')) return;
      if (Player.opened()) return;
      var ids = data$3.filter(function (e) {
        return !e.scaned && (e.scaned_time || 0) + 60 * 60 * 12 * 1000 < Date.now();
      });

      if (ids.length) {
        object$1 = ids[0];

        if (object$1.title) {
          if (object$1.imdb_id) {
            req(object$1.imdb_id);
          } else {
            network$7.silent(TMDBApi.api('movie/' + object$1.id + '/external_ids?api_key=' + TMDBApi.key() + '&language=ru'), function (ttid) {
              req(ttid.imdb_id, object$1.title);
            }, function () {
              Arrays.remove(data$3, object$1);
              Storage.set('quality_scan', data$3);
            });
          }
        } else {
          Arrays.remove(data$3, object$1);
        }
      } else {
        data$3.forEach(function (a) {
          return a.scaned = 0;
        });
      }

      Storage.set('quality_scan', data$3);
    }
    /**
     * Сохранить состояние
     */


    function save$4() {
      if (object$1) {
        object$1.scaned = 1;
        object$1.scaned_time = Date.now();
        Storage.set('quality_scan', data$3);
      }
    }
    /**
     * Получить качество фильма если есть
     * @param {{id:integer}} elem - карточка
     * @returns {string}
     */


    function get$b(elem) {
      var fid = data$3.filter(function (e) {
        return e.id == elem.id;
      });
      return (fid.length ? fid[0] : {}).quality;
    }

    var VideoQuality = {
      init: init$b,
      get: get$b,
      add: add$8
    };

    function status(need) {
      this.data = {};
      this.work = 0;
      this.need = need;
      this.complited = false;

      this.check = function () {
        if (this.work >= this.need && !this.complited) {
          this.complited = true;
          this.onComplite(this.data);
        }
      };

      this.append = function (name, json) {
        this.work++;
        this.data[name] = json;
        this.check();
      };

      this.error = function () {
        this.work++;
        this.check();
      };
    }

    var data$2 = [];
    /**
     * Запуск
     */

    function init$a() {
      data$2 = Storage.cache('recomends_scan', 100, []);
      Favorite.get({
        type: 'history'
      }).forEach(function (elem) {
        if (['cub', 'tmdb'].indexOf(elem.source) >= 0) {
          var id = data$2.filter(function (a) {
            return a.id == elem.id;
          });

          if (!id.length) {
            data$2.push({
              id: elem.id,
              tv: elem.number_of_seasons || elem.seasons
            });
          }
        }
      });
      Storage.set('recomends_scan', data$2);
      setInterval(search$4, 120 * 1000);
    }

    function search$4() {
      if (Player.opened()) return;
      var ids = data$2.filter(function (e) {
        return !e.scan;
      });

      if (ids.length) {
        var elem = ids[0];
        elem.scan = 1;
        TMDB.get((elem.tv ? 'tv' : 'movie') + '/' + elem.id + '/recommendations', {}, function (json) {
          if (json.results && json.results.length) {
            var recomend = Storage.cache('recomends_list', 200, []);
            var favorite = Favorite.get({
              type: 'history'
            });
            json.results.forEach(function (e) {
              if (!recomend.filter(function (r) {
                return r.id == e.id;
              }).length && !favorite.filter(function (h) {
                return h.id == e.id;
              }).length) {
                recomend.push(e);
              }
            });
            Storage.set('recomends_list', recomend);
          }
        });
      } else {
        data$2.forEach(function (a) {
          return a.scan = 0;
        });
      }

      Storage.set('recomends_scan', data$2);
    }

    function get$a(type) {
      var all = Storage.get('recomends_list', '[]');
      return all.filter(function (e) {
        return type == 'tv' ? e.number_of_seasons || e.first_air_date : !(e.number_of_seasons || e.first_air_date);
      }).reverse();
    }

    var Recomends = {
      init: init$a,
      get: get$a
    };

    var network$6 = new create$p();
    var menu_list$2 = [];

    function url$2(u) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      u = add$7(u, 'api_key=' + TMDBApi.key());
      u = add$7(u, 'language=' + Storage.field('tmdb_lang'));
      if (params.genres) u = add$7(u, 'with_genres=' + params.genres);
      if (params.page) u = add$7(u, 'page=' + params.page);
      if (params.query) u = add$7(u, 'query=' + params.query);

      if (params.filter) {
        for (var i in params.filter) {
          u = add$7(u, i + '=' + params.filter[i]);
        }
      }

      return TMDBApi.api(u);
    }

    function add$7(u, params) {
      return u + (/\?/.test(u) ? '&' : '?') + params;
    }

    function img$2(src, size) {
      var poster_size = Storage.field('poster_size');
      var baseimg = 't/p/' + poster_size + '/';
      var path = baseimg;
      if (size) path = path.replace(new RegExp(poster_size, 'g'), size);
      return src ? TMDBApi.image(path + src) : '';
    }

    function find$1(find) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var finded;

      var filtred = function filtred(items) {
        for (var i = 0; i < items.length; i++) {
          var item = items[i];

          if (params.original_title == item.original_title || params.title == item.title) {
            finded = item;
            break;
          }
        }
      };

      if (find.movie && find.movie.results.length) filtred(find.movie.results);
      if (find.tv && find.tv.results.length && !finded) filtred(find.tv.results);
      return finded;
    }

    function main$4() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var status$1 = new status(8);

      status$1.onComplite = function () {
        var fulldata = [];
        if (status$1.data.wath) fulldata.push(status$1.data.wath);
        if (status$1.data.trend_day) fulldata.push(status$1.data.trend_day);
        if (status$1.data.trend_week) fulldata.push(status$1.data.trend_week);
        if (status$1.data.upcoming) fulldata.push(status$1.data.upcoming);
        if (status$1.data.popular) fulldata.push(status$1.data.popular);
        if (status$1.data.popular_tv) fulldata.push(status$1.data.popular_tv);
        if (status$1.data.top) fulldata.push(status$1.data.top);
        if (status$1.data.top_tv) fulldata.push(status$1.data.top_tv);
        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, json) {
        json.title = title;
        status$1.append(name, json);
      };

      get$9('movie/now_playing', params, function (json) {
        append(Lang.translate('title_now_watch'), 'wath', json);
        VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      get$9('trending/movie/day', params, function (json) {
        append(Lang.translate('title_trend_day'), 'trend_day', json);
      }, status$1.error.bind(status$1));
      get$9('trending/movie/week', params, function (json) {
        append(Lang.translate('title_trend_week'), 'trend_week', json);
      }, status$1.error.bind(status$1));
      get$9('movie/upcoming', params, function (json) {
        append(Lang.translate('title_upcoming'), 'upcoming', json);
      }, status$1.error.bind(status$1));
      get$9('movie/popular', params, function (json) {
        append(Lang.translate('title_popular_movie'), 'popular', json);
        VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      get$9('tv/popular', params, function (json) {
        append(Lang.translate('title_popular_tv'), 'popular_tv', json);
      }, status$1.error.bind(status$1));
      get$9('movie/top_rated', params, function (json) {
        append(Lang.translate('title_top_movie'), 'top', json);
      }, status$1.error.bind(status$1));
      get$9('tv/top_rated', params, function (json) {
        append(Lang.translate('title_top_tv'), 'top_tv', json);
      }, status$1.error.bind(status$1));
    }

    function category$4() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var show = ['movie', 'tv'].indexOf(params.url) > -1 && !params.genres;
      var quality = ['movie'].indexOf(params.url) > -1 && !params.genres;
      var books = show ? Favorite.continues(params.url) : [];
      var recomend = show ? Arrays.shuffle(Recomends.get(params.url)).slice(0, 19) : [];
      var status$1 = new status(6);

      status$1.onComplite = function () {
        var fulldata = [];
        if (books.length) fulldata.push({
          results: books,
          title: params.url == 'tv' ? Lang.translate('title_continue') : Lang.translate('title_watched')
        });
        if (recomend.length) fulldata.push({
          results: recomend,
          title: Lang.translate('title_recomend_watch')
        });
        if (status$1.data["continue"] && status$1.data["continue"].results && status$1.data["continue"].results.length) fulldata.push(status$1.data["continue"]);
        if (status$1.data.wath && status$1.data.wath.results && status$1.data.wath.results.length) fulldata.push(status$1.data.wath);
        if (status$1.data.popular && status$1.data.popular.results && status$1.data.popular.results.length) fulldata.push(status$1.data.popular);
        if (status$1.data["new"] && status$1.data["new"].results && status$1.data["new"].results.length) fulldata.push(status$1.data["new"]);
        if (status$1.data.tv_today && status$1.data.tv_today.results && status$1.data.tv_today.results.length) fulldata.push(status$1.data.tv_today);
        if (status$1.data.tv_air && status$1.data.tv_air.results && status$1.data.tv_air.results.length) fulldata.push(status$1.data.tv_air);
        if (status$1.data.top && status$1.data.top.results && status$1.data.top.results.length) fulldata.push(status$1.data.top);
        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, json) {
        json.title = title;
        status$1.append(name, json);
      };

      get$9(params.url + '/now_playing', params, function (json) {
        append(Lang.translate('title_now_watch'), 'wath', json);
        if (quality) VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      get$9(params.url + '/popular', params, function (json) {
        append(Lang.translate('title_popular'), 'popular', json);
        if (quality) VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      var date = new Date();
      var nparams = Arrays.clone(params);
      nparams.filter = {
        sort_by: 'release_date.desc',
        year: date.getFullYear(),
        first_air_date_year: date.getFullYear(),
        'vote_average.gte': 7
      };
      get$9('discover/' + params.url, nparams, function (json) {
        json.filter = nparams.filter;
        append(Lang.translate('title_new'), 'new', json);
      }, status$1.error.bind(status$1));
      get$9(params.url + '/airing_today', params, function (json) {
        append(Lang.translate('title_tv_today'), 'tv_today', json);
      }, status$1.error.bind(status$1));
      get$9(params.url + '/on_the_air', params, function (json) {
        append(Lang.translate('title_this_week'), 'tv_air', json);
      }, status$1.error.bind(status$1));
      get$9(params.url + '/top_rated', params, function (json) {
        append(Lang.translate('title_in_top'), 'top', json);
      }, status$1.error.bind(status$1));
    }

    function full$5() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var status$1 = new status(7);
      status$1.onComplite = oncomplite;
      get$9(params.method + '/' + params.id + '?append_to_response=content_ratings,release_dates', params, function (json) {
        json.source = 'tmdb';

        if (params.method == 'tv') {
          var season = Utils.countSeasons(json);
          get$9('tv/' + json.id + '/season/' + season, {}, function (ep) {
            status$1.append('episodes', ep);
          }, status$1.error.bind(status$1));
        } else status$1.need--;

        if (json.belongs_to_collection) {
          get$9('collection/' + json.belongs_to_collection.id, {}, function (collection) {
            collection.results = collection.parts.slice(0, 19);
            status$1.append('collection', collection);
          }, status$1.error.bind(status$1));
        } else status$1.need--;

        status$1.append('movie', json);
      }, function () {
        status$1.need -= 2;
        status$1.error();
      });

      if (Storage.field('light_version')) {
        status$1.need -= 3;
      } else {
        get$9(params.method + '/' + params.id + '/credits', params, function (json) {
          status$1.append('persons', json);
        }, status$1.error.bind(status$1));
        get$9(params.method + '/' + params.id + '/recommendations', params, function (json) {
          status$1.append('recomend', json);
        }, status$1.error.bind(status$1));
        get$9(params.method + '/' + params.id + '/similar', params, function (json) {
          status$1.append('simular', json);
        }, status$1.error.bind(status$1));
      }

      get$9(params.method + '/' + params.id + '/videos', params, function (json) {
        status$1.append('videos', json);
      }, status$1.error.bind(status$1));
    }

    function list$5() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var u = url$2(params.url, params);
      network$6.silent(u, oncomplite, onerror);
    }

    function get$9(method) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var oncomplite = arguments.length > 2 ? arguments[2] : undefined;
      var onerror = arguments.length > 3 ? arguments[3] : undefined;
      var u = url$2(method, params);
      network$6.silent(u, function (json) {
        json.url = method;
        oncomplite(json);
      }, onerror);
    }

    function search$3() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var status$1 = new status(2);

      status$1.onComplite = function (data) {
        var items = [];
        if (data.movie && data.movie.results.length) items.push(data.movie);
        if (data.tv && data.tv.results.length) items.push(data.tv);
        oncomplite(items);
      };

      get$9('search/movie', params, function (json) {
        json.title = Lang.translate('menu_movies');
        json.type = 'movie';
        status$1.append('movie', json);
      }, status$1.error.bind(status$1));
      get$9('search/tv', params, function (json) {
        json.title = Lang.translate('menu_tv');
        json.type = 'tv';
        status$1.append('tv', json);
      }, status$1.error.bind(status$1));
    }

    function discovery() {
      return {
        title: 'TMDB',
        search: search$3,
        params: {
          align_left: true,
          object: {
            source: 'tmdb'
          }
        },
        onMore: function onMore(params) {
          Activity$1.push({
            url: 'search/' + params.data.type,
            title: Lang.translate('search') + ' - ' + params.query,
            component: 'category_full',
            page: 2,
            query: encodeURIComponent(params.query),
            source: 'tmdb'
          });
        },
        onCancel: network$6.clear.bind(network$6)
      };
    }

    function person$4() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;

      var sortCredits = function sortCredits(credits) {
        return credits.map(function (a) {
          a.year = parseInt(((a.release_date || a.first_air_date || '0000') + '').slice(0, 4));
          return a;
        }).sort(function (a, b) {
          return b.vote_average - a.vote_average && b.vote_count - a.vote_count;
        }); //сортируем по оценке и кол-ву голосов (чтобы отсечь мусор с 1-2 оценками)
      };

      var convert = function convert(credits, person) {
        credits.crew.forEach(function (a) {
          a.department = a.department == 'Production' ? Lang.translate('full_production') : a.department == 'Directing' ? Lang.translate('full_directing') : a.department;
        });
        var cast = sortCredits(credits.cast),
            crew = sortCredits(credits.crew),
            tv = sortCredits(cast.filter(function (media) {
          return media.media_type === 'tv';
        })),
            movie = sortCredits(cast.filter(function (media) {
          return media.media_type === 'movie';
        })),
            knownFor; //Наиболее известные работы человека
        //1. Группируем все работы по департаментам (Актер, Режиссер, Сценарист и т.д.)

        knownFor = Arrays.groupBy(crew, 'department');
        var actorGender = person.gender === 1 ? Lang.translate('title_actress') : Lang.translate('title_actor');
        if (movie.length > 0) knownFor["".concat(actorGender, " - ") + Lang.translate('menu_movies')] = movie;
        if (tv.length > 0) knownFor["".concat(actorGender, " - ") + Lang.translate('menu_tv')] = tv; //2. Для каждого департамента суммируем кол-ва голосов (вроде бы сам TMDB таким образом определяет knownFor для людей)

        knownFor = Object.entries(knownFor).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              depIdx = _ref2[0],
              dep = _ref2[1];

          //убираем дубликаты (человек может быть указан в одном департаменте несколько раз на разных должностях (job))
          var set = {},
              credits = dep.filter(function (credit) {
            return set.hasOwnProperty(credit.original_title || credit.original_name) ? false : credit.original_title ? set[credit.original_title] = true : set[credit.original_name] = true;
          });
          return {
            name: depIdx,
            credits: credits,
            vote_count: dep.reduce(function (a, b) {
              return a + b.vote_count;
            }, 0)
          }; //3. Сортируем департаменты по кол-ву голосов
        }).sort(function (a, b) {
          return b.vote_count - a.vote_count;
        });
        return {
          raw: credits,
          cast: cast,
          crew: crew,
          tv: tv,
          movie: movie,
          knownFor: knownFor
        };
      };

      var status$1 = new status(2);

      status$1.onComplite = function () {
        var fulldata = {};
        if (status$1.data.person) fulldata.person = status$1.data.person;
        if (status$1.data.credits) fulldata.credits = convert(status$1.data.credits, status$1.data.person);
        oncomplite(fulldata);
      };

      get$9('person/' + params.id, params, function (json) {
        status$1.append('person', json);
      }, status$1.error.bind(status$1));
      get$9('person/' + params.id + '/combined_credits', params, function (json) {
        status$1.append('credits', json);
      }, status$1.error.bind(status$1));
    }

    function menu$4() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      if (menu_list$2.length) oncomplite(menu_list$2);else {
        var u = url$2('genre/movie/list', params);
        network$6.silent(u, function (j) {
          j.genres.forEach(function (g) {
            menu_list$2.push({
              title: g.name,
              id: g.id
            });
          });
          oncomplite(menu_list$2);
        });
      }
    }

    function menuCategory$2(params, oncomplite) {
      var menu = [];

      if (params.action !== 'tv') {
        menu.push({
          title: Lang.translate('title_now_watch'),
          url: params.action + '/now_playing'
        });
      }

      menu.push({
        title: Lang.translate('title_popular'),
        url: params.action + '/popular'
      });
      var date = new Date();
      var query = [];
      query.push('sort_by=release_date.desc');
      query.push('year=' + date.getFullYear());
      query.push('first_air_date_year=' + date.getFullYear());
      query.push('vote_average.gte=7');
      menu.push({
        title: Lang.translate('title_new'),
        url: 'discover/' + params.action + '?' + query.join('&')
      });

      if (params.action == 'tv') {
        menu.push({
          title: Lang.translate('title_tv_today'),
          url: params.action + '/airing_today'
        });
        menu.push({
          title: Lang.translate('title_this_week'),
          url: params.action + '/on_the_air'
        });
      }

      menu.push({
        title: Lang.translate('title_in_top'),
        url: params.action + '/top_rated'
      });
      oncomplite(menu);
    }

    function external_ids() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      get$9('tv/' + params.id + '/external_ids', oncomplite, onerror);
    }

    function company$1() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var u = url$2('company/' + params.id, params);
      network$6.silent(u, oncomplite, onerror);
    }

    function seasons$4(tv, from, oncomplite) {
      var status$1 = new status(from.length);
      status$1.onComplite = oncomplite;
      from.forEach(function (season) {
        get$9('tv/' + tv.id + '/season/' + season, {}, function (json) {
          status$1.append('' + season, json);
        }, status$1.error.bind(status$1));
      });
    }

    function screensavers(oncomplite, onerror) {
      get$9('trending/all/week', {
        page: Math.round(Math.random() * 30)
      }, function (json) {
        oncomplite(json.results.filter(function (entry) {
          return entry.backdrop_path && !entry.adult;
        }));
      }, onerror);
    }

    function clear$7() {
      network$6.clear();
    }

    var TMDB = {
      main: main$4,
      menu: menu$4,
      img: img$2,
      full: full$5,
      list: list$5,
      category: category$4,
      search: search$3,
      clear: clear$7,
      company: company$1,
      person: person$4,
      seasons: seasons$4,
      find: find$1,
      screensavers: screensavers,
      external_ids: external_ids,
      get: get$9,
      menuCategory: menuCategory$2,
      discovery: discovery
    };

    var data$1 = [];
    var object = false;
    /**
     * Запуск
     */

    function init$9() {
      data$1 = Storage.cache('timetable', 100, []);
      setInterval(extract$1, 1000 * 60 * 2);
      setInterval(favorites, 1000 * 60 * 10);
      Favorite.listener.follow('add,added', function (e) {
        if (e.card.number_of_seasons) update$3(e.card);
      });
      Favorite.listener.follow('remove', function (e) {
        if (e.card.number_of_seasons && e.method == 'id') {
          var find = data$1.find(function (a) {
            return a.id == e.card.id;
          });

          if (find) {
            Arrays.remove(data$1, find);
            Storage.set('timetable', data$1);
          }
        }
      });
    }
    /**
     * Добавить карточки к парсингу
     * @param {[{id:integer,number_of_seasons:integer}]} elems - карточки
     */


    function add$6(elems) {
      elems.filter(function (elem) {
        return elem.number_of_seasons;
      }).forEach(function (elem) {
        var id = data$1.filter(function (a) {
          return a.id == elem.id;
        });

        if (!id.length) {
          data$1.push({
            id: elem.id,
            season: elem.number_of_seasons,
            episodes: []
          });
        }
      });
      Storage.set('timetable', data$1);
    }
    /**
     * Добавить из закладок
     */


    function favorites() {
      add$6(Favorite.get({
        type: 'book'
      }));
      add$6(Favorite.get({
        type: 'like'
      }));
      add$6(Favorite.get({
        type: 'wath'
      }));
    }

    function filter(episodes) {
      var filtred = [];
      var fileds = ['air_date', 'season_number', 'episode_number', 'name', 'still_path'];
      episodes.forEach(function (episode) {
        var item = {};
        fileds.forEach(function (field) {
          if (typeof episode[field] !== 'undefined') item[field] = episode[field];
        });
        filtred.push(item);
      });
      /*
      filtred = filtred.filter(episode=>{
          let create = new Date(episode.air_date)
          let today  = new Date()
              today.setHours(0,0,0,0)
           return create.getTime() >= today.getTime() ? true : false
      })
      */

      return filtred;
    }
    /**
     * Парсим карточку
     */


    function parse() {
      if (Favorite.check(object).any) {
        TMDB.get('tv/' + object.id + '/season/' + object.season, {}, function (ep) {
          if (ep.episodes) {
            object.episodes = filter(ep.episodes);
            save$3();
          } else {
            console.log('request', 'Episodes is undefined: ' + JSON.stringify(object) + ' : ' + JSON.stringify(ep));
          }
        }, save$3);
      } else {
        Arrays.remove(data$1, object); //очистить из расписания если больше нету в закладках

        save$3();
      }
    }
    /**
     * Получить карточку для парсинга
     */


    function extract$1() {
      try {
        if (Player.opened()) return;
        var ids = data$1.filter(function (e) {
          return !e.scaned && (e.scaned_time || 0) + 60 * 60 * 12 * 1000 < Date.now();
        });

        if (ids.length) {
          object = ids[0];
          parse();
        } else {
          data$1.forEach(function (a) {
            return a.scaned = 0;
          });
        }

        Storage.set('timetable', data$1);
      } catch (e) {
        console.log('extract', e);
      }
    }
    /**
     * Сохранить состояние
     */


    function save$3() {
      if (object) {
        object.scaned = 1;
        object.scaned_time = Date.now();
        Storage.set('timetable', data$1);
      }
    }
    /**
     * Получить эпизоды для карточки если есть
     * @param {{id:integer}} elem - карточка
     * @returns {array}
     */


    function get$8(elem) {
      var fid = data$1.filter(function (e) {
        return e.id == elem.id;
      });
      return (fid.length ? fid[0] : {}).episodes || [];
    }
    /**
     * Добавить карточку в парсинг самостоятельно
     * @param {{id:integer,number_of_seasons:integer}} elem - карточка
     */


    function update$3(elem) {
      if (elem.number_of_seasons && Favorite.check(elem).any) {
        var id = data$1.filter(function (a) {
          return a.id == elem.id;
        });
        TMDB.clear();

        if (!id.length) {
          var item = {
            id: elem.id,
            season: Utils.countSeasons(elem),
            episodes: []
          };
          data$1.push(item);
          Storage.set('timetable', data$1);
          object = item;
        } else object = id[0];

        parse();
      }
    }
    /**
     * Получить все данные
     * @returns {[{id:integer,season:integer,episodes:[]}]}
     */


    function all$2() {
      return data$1;
    }

    var TimeTable = {
      init: init$9,
      get: get$8,
      add: add$6,
      all: all$2,
      update: update$3
    };

    /**
     * Карточка
     * @param {object} data
     * @param {{isparser:boolean, card_small:boolean, card_category:boolean, card_collection:boolean, card_wide:true}} params
     */

    function Card(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      Arrays.extend(data, {
        title: data.name,
        original_title: data.original_name,
        release_date: data.first_air_date
      });
      data.release_year = ((data.release_date || '0000') + '').slice(0, 4);
      /**
       * Загрузить шаблон
       */

      this.build = function () {
        this.card = Template$1.get(params.isparser ? 'card_parser' : 'card', data);
        this.img = this.card.find('img')[0] || {};
        this.card.card_data = data;

        if (data.first_air_date) {
          this.card.find('.card__view').append('<div class="card__type"></div>');
          this.card.find('.card__type').text(data.first_air_date ? 'TV' : 'MOV');
          this.card.addClass(data.first_air_date ? 'card--tv' : 'card--movie');
        }

        if (params.card_small) {
          this.card.addClass('card--small');

          if (!Storage.field('light_version')) {
            this.card.find('.card__title').remove();
            this.card.find('.card__age').remove();
          }
        }

        if (params.card_category) {
          this.card.addClass('card--category');
          this.card.find('.card__age').remove();
        }

        if (params.card_collection) {
          this.card.addClass('card--collection');
          this.card.find('.card__age').remove();
        }

        if (params.card_wide) {
          this.card.addClass('card--wide');
          data.poster = data.cover;
          if (data.promo) this.card.append('<div class="card__promo"><div class="card__promo-text">' + data.promo + '</div></div>');
          if (Storage.field('light_version')) this.card.find('.card__title').remove();
          this.card.find('.card__age').remove();
        }

        if (data.release_year == '0000') {
          this.card.find('.card__age').remove();
        }

        this.card.data('update', this.update.bind(this));
        this.update();
      };
      /**
       * Загрузить картинку
       */


      this.image = function () {
        var _this = this;

        this.img.onload = function () {
          _this.card.addClass('card--loaded');
        };

        this.img.onerror = function () {
          TMDBApi.broken();
          _this.img.src = './img/img_broken.svg';
        };
      };
      /**
       * Добавить иконку
       * @param {string} name
       */


      this.addicon = function (name) {
        this.card.find('.card__icons-inner').append('<div class="card__icon icon--' + name + '"></div>');
      };
      /**
       * Обносить состояние карточки
       */


      this.update = function () {
        var quality = !data.first_air_date && Storage.field('card_quality') ? VideoQuality.get(data) : false;
        this.card.find('.card__quality,.card-watched,.card__new-episode').remove();

        if (quality) {
          this.card.find('.card__view').append('<div class="card__quality"><div>' + quality + '</div></div>');
        }

        this.watched_checked = false;
        this.favorite();

        if (Account.working()) {
          var notices = Storage.get('account_notice', []).filter(function (n) {
            return n.card_id == data.id;
          });

          if (notices.length) {
            var notice = notices[0];

            if (Utils.parseTime(notice.date).full == Utils.parseTime(Date.now()).full && notice.method !== 'movie') {
              this.card.find('.card__view').append('<div class="card__new-episode"><div>' + Lang.translate('card_new_episode') + '</div></div>');
            }
          }
        }

        if (this.card.hasClass('focus')) this.watched();
      };
      /**
       * Какие серии просмотрено
       */


      this.watched = function () {
        if (!Storage.field('card_episodes')) return;

        if (!this.watched_checked) {
          var episodes = TimeTable.get(data);
          var viewed;
          episodes.forEach(function (ep) {
            var hash = Utils.hash([ep.season_number, ep.episode_number, data.original_title].join(''));
            var view = Timeline.view(hash);
            if (view.percent) viewed = {
              ep: ep,
              view: view
            };
          });

          if (viewed) {
            var next = episodes.slice(episodes.indexOf(viewed.ep)).filter(function (ep) {
              var date = new Date(ep.air_date).getTime();
              return date < Date.now();
            }).slice(0, 5);
            var wrap = Template$1.get('card_watched', {});
            next.forEach(function (ep) {
              var item = $('<div class="card-watched__item"><span>' + ep.episode_number + ' - ' + (ep.name || Lang.translate('noname')) + '</span></div>');
              if (ep == viewed.ep) item.append(Timeline.render(viewed.view));
              wrap.find('.card-watched__body').append(item);
            });
            this.watched_wrap = wrap;
            this.card.find('.card__view').prepend(wrap);
          }

          this.watched_checked = true;
        }

        if (this.watched_wrap) {
          this.watched_wrap.toggleClass('reverce--position', this.card.offset().left > window.innerWidth / 2 ? true : false);
        }
      };
      /**
       * Обновить иконки на закладки
       */


      this.favorite = function () {
        var status = Favorite.check(data);
        this.card.find('.card__icon').remove();
        if (status.book) this.addicon('book');
        if (status.like) this.addicon('like');
        if (status.wath) this.addicon('wath');
        if (status.history) this.addicon('history');
      };
      /**
       * Вызвали меню
       * @param {object} target
       * @param {object} data
       */


      this.onMenu = function (target, data) {
        var _this2 = this;

        var enabled = Controller.enabled().name;
        var status = Favorite.check(data);
        Select.show({
          title: Lang.translate('title_action'),
          items: [{
            title: status.book ? Lang.translate('card_book_remove') : Lang.translate('card_book_add'),
            subtitle: Lang.translate('card_book_descr'),
            where: 'book'
          }, {
            title: status.like ? Lang.translate('card_like_remove') : Lang.translate('card_like_add'),
            subtitle: Lang.translate('card_like_descr'),
            where: 'like'
          }, {
            title: status.wath ? Lang.translate('card_wath_remove') : Lang.translate('card_wath_add'),
            subtitle: Lang.translate('card_wath_descr'),
            where: 'wath'
          }, {
            title: status.history ? Lang.translate('card_history_remove') : Lang.translate('card_history_add'),
            subtitle: Lang.translate('card_history_descr'),
            where: 'history'
          }],
          onBack: function onBack() {
            Controller.toggle(enabled);
          },
          onSelect: function onSelect(a) {
            if (params.object) data.source = params.object.source;
            Favorite.toggle(a.where, data);

            _this2.favorite();

            Controller.toggle(enabled);
          }
        });
      };
      /**
       * Создать
       */


      this.create = function () {
        var _this3 = this;

        this.build();
        this.card.on('hover:focus', function (e, is_mouse) {
          _this3.watched();

          _this3.onFocus(e.target, data, is_mouse);
        }).on('hover:enter', function (e) {
          _this3.onEnter(e.target, data);
        }).on('hover:long', function (e) {
          _this3.onMenu(e.target, data);
        });
        this.image();
      };
      /**
       * Загружать картинку если видна карточка
       */


      this.visible = function () {
        if (this.visibled) return;
        if (data.poster_path) this.img.src = Api.img(data.poster_path);else if (data.poster) this.img.src = data.poster;else if (data.img) this.img.src = data.img;else this.img.src = './img/img_broken.svg';
        this.visibled = true;
      };
      /**
       * Уничтожить
       */


      this.destroy = function () {
        this.img.onerror = function () {};

        this.img.onload = function () {};

        this.img.src = '';
        this.card.remove();
        this.card = null;
        this.img = null;
      };
      /**
       * Рендер
       * @returns {object}
       */


      this.render = function () {
        return this.card;
      };
    }

    function init$8() {
      var timer;
      $(window).on('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(update$2, 100);
      });
      toggleClasses();
      Storage.listener.follow('change', function (event) {
        if (event.name == 'interface_size') update$2();
        if (event.name == 'animation' || event.name == 'mask') toggleClasses();
      });
      var body = $('body');
      var mouse_timer;
      $(window).on('mousemove', function () {
        clearTimeout(mouse_timer);
        mouse_timer = setTimeout(function () {
          if (typeof nw !== 'undefined') body.toggleClass('no--cursor', true);
        }, 3000);
        body.toggleClass('no--cursor', false);
      });
    }

    function size() {
      var sl = Storage.field('interface_size');
      var sz = {
        normal: 1,
        small: 0.9,
        bigger: 1.1
      };
      var fs = sz[sl];
      $('body').css({
        fontSize: Math.max(window.innerWidth / 84.17 * fs, 10.6) + 'px'
      }).removeClass('size--small size--normal size--bigger').addClass('size--' + sl);
    }

    function update$2() {
      size();
      var wrap = $('.wrap__left');
      if (!wrap.length) return;
      var left = wrap[0].getBoundingClientRect();
      $('.layer--width').css('width', window.innerWidth - (Storage.field('light_version') && window.innerWidth >= 767 ? left.width : 0));
      var head = $('.head')[0].getBoundingClientRect();
      $('.layer--wheight').each(function () {
        var elem = $(this),
            heig = window.innerHeight - head.height;

        if (elem.data('mheight')) {
          heig -= elem.data('mheight')[0].getBoundingClientRect().height;
        }

        elem.css('height', heig);
      });
      $('.layer--height').each(function () {
        var elem = $(this),
            heig = window.innerHeight;

        if (elem.data('mheight')) {
          heig -= elem.data('mheight')[0].getBoundingClientRect().height;
        }

        elem.css('height', heig);
      });
    }

    function toggleClasses() {
      $('body').toggleClass('no--animation', !Storage.field('animation'));
      $('body').toggleClass('no--mask', !Storage.field('mask'));
    }

    var Layer = {
      update: update$2,
      init: init$8
    };

    /* eslint-disable no-bitwise -- used for calculations */

    /* eslint-disable unicorn/prefer-query-selector -- aiming at
      backward-compatibility */

    /**
     * StackBlur - a fast almost Gaussian Blur For Canvas
     *
     * In case you find this class useful - especially in commercial projects -
     * I am not totally unhappy for a small donation to my PayPal account
     * mario@quasimondo.de
     *
     * Or support me on flattr:
     * {@link https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript}.
     *
     * @module StackBlur
     * @author Mario Klingemann
     * Contact: mario@quasimondo.com
     * Website: {@link http://www.quasimondo.com/StackBlurForCanvas/StackBlurDemo.html}
     * Twitter: @quasimondo
     *
     * @copyright (c) 2010 Mario Klingemann
     *
     * Permission is hereby granted, free of charge, to any person
     * obtaining a copy of this software and associated documentation
     * files (the "Software"), to deal in the Software without
     * restriction, including without limitation the rights to use,
     * copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the
     * Software is furnished to do so, subject to the following
     * conditions:
     *
     * The above copyright notice and this permission notice shall be
     * included in all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     * OTHER DEALINGS IN THE SOFTWARE.
     */
    var mulTable = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
    var shgTable = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
    /**
     * @param {string|HTMLImageElement} img
     * @param {string|HTMLCanvasElement} canvas
     * @param {Float} radius
     * @param {boolean} blurAlphaChannel
     * @param {boolean} useOffset
     * @param {boolean} skipStyles
     * @returns {undefined}
     */

    function processImage(img, canvas, radius, blurAlphaChannel, useOffset, skipStyles) {
      if (typeof img === 'string') {
        img = document.getElementById(img);
      }

      if (!img || !('naturalWidth' in img)) {
        return;
      }

      var dimensionType = useOffset ? 'offset' : 'natural';
      var w = img[dimensionType + 'Width'];
      var h = img[dimensionType + 'Height'];

      if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
      }

      if (!canvas || !('getContext' in canvas)) {
        return;
      }

      if (!skipStyles) {
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
      }

      canvas.width = w;
      canvas.height = h;
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, w, h);
      context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);

      if (isNaN(radius) || radius < 1) {
        return;
      }

      if (blurAlphaChannel) {
        processCanvasRGBA(canvas, 0, 0, w, h, radius);
      } else {
        processCanvasRGB(canvas, 0, 0, w, h, radius);
      }
    }
    /**
     * @param {string|HTMLCanvasElement} canvas
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @throws {Error|TypeError}
     * @returns {ImageData} See {@link https://html.spec.whatwg.org/multipage/canvas.html#imagedata}
     */


    function getImageDataFromCanvas(canvas, topX, topY, width, height) {
      if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
      }

      if (!canvas || _typeof(canvas) !== 'object' || !('getContext' in canvas)) ;

      var context = canvas.getContext('2d');

      try {
        return context.getImageData(topX, topY, width, height);
      } catch (e) {//throw new Error('unable to access image data: ' + e);
      }
    }
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @param {Float} radius
     * @returns {undefined}
     */


    function processCanvasRGBA(canvas, topX, topY, width, height, radius) {
      if (isNaN(radius) || radius < 1) {
        return;
      }

      radius |= 0;
      var imageData = getImageDataFromCanvas(canvas, topX, topY, width, height);

      if (imageData) {
        imageData = processImageDataRGBA(imageData, topX, topY, width, height, radius);

        try {
          canvas.getContext('2d').putImageData(imageData, topX, topY);
        } catch (e) {}
      }
    }
    /**
     * @param {ImageData} imageData
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @param {Float} radius
     * @returns {ImageData}
     */


    function processImageDataRGBA(imageData, topX, topY, width, height, radius) {
      var pixels = imageData ? imageData.data : [];
      var div = 2 * radius + 1; // const w4 = width << 2;

      var widthMinus1 = width - 1;
      var heightMinus1 = height - 1;
      var radiusPlus1 = radius + 1;
      var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
      var stackStart = new BlurStack();
      var stack = stackStart;
      var stackEnd;

      for (var i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();

        if (i === radiusPlus1) {
          stackEnd = stack;
        }
      }

      stack.next = stackStart;
      var stackIn = null,
          stackOut = null,
          yw = 0,
          yi = 0;
      var mulSum = mulTable[radius];
      var shgSum = shgTable[radius];

      for (var y = 0; y < height; y++) {
        stack = stackStart;
        var pr = pixels[yi],
            pg = pixels[yi + 1],
            pb = pixels[yi + 2],
            pa = pixels[yi + 3];

        for (var _i = 0; _i < radiusPlus1; _i++) {
          stack.r = pr;
          stack.g = pg;
          stack.b = pb;
          stack.a = pa;
          stack = stack.next;
        }

        var rInSum = 0,
            gInSum = 0,
            bInSum = 0,
            aInSum = 0,
            rOutSum = radiusPlus1 * pr,
            gOutSum = radiusPlus1 * pg,
            bOutSum = radiusPlus1 * pb,
            aOutSum = radiusPlus1 * pa,
            rSum = sumFactor * pr,
            gSum = sumFactor * pg,
            bSum = sumFactor * pb,
            aSum = sumFactor * pa;

        for (var _i2 = 1; _i2 < radiusPlus1; _i2++) {
          var p = yi + ((widthMinus1 < _i2 ? widthMinus1 : _i2) << 2);
          var r = pixels[p],
              g = pixels[p + 1],
              b = pixels[p + 2],
              a = pixels[p + 3];
          var rbs = radiusPlus1 - _i2;
          rSum += (stack.r = r) * rbs;
          gSum += (stack.g = g) * rbs;
          bSum += (stack.b = b) * rbs;
          aSum += (stack.a = a) * rbs;
          rInSum += r;
          gInSum += g;
          bInSum += b;
          aInSum += a;
          stack = stack.next;
        }

        stackIn = stackStart;
        stackOut = stackEnd;

        for (var x = 0; x < width; x++) {
          var paInitial = aSum * mulSum >> shgSum;
          pixels[yi + 3] = paInitial;

          if (paInitial !== 0) {
            var _a2 = 255 / paInitial;

            pixels[yi] = (rSum * mulSum >> shgSum) * _a2;
            pixels[yi + 1] = (gSum * mulSum >> shgSum) * _a2;
            pixels[yi + 2] = (bSum * mulSum >> shgSum) * _a2;
          } else {
            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
          }

          rSum -= rOutSum;
          gSum -= gOutSum;
          bSum -= bOutSum;
          aSum -= aOutSum;
          rOutSum -= stackIn.r;
          gOutSum -= stackIn.g;
          bOutSum -= stackIn.b;
          aOutSum -= stackIn.a;

          var _p = x + radius + 1;

          _p = yw + (_p < widthMinus1 ? _p : widthMinus1) << 2;
          rInSum += stackIn.r = pixels[_p];
          gInSum += stackIn.g = pixels[_p + 1];
          bInSum += stackIn.b = pixels[_p + 2];
          aInSum += stackIn.a = pixels[_p + 3];
          rSum += rInSum;
          gSum += gInSum;
          bSum += bInSum;
          aSum += aInSum;
          stackIn = stackIn.next;
          var _stackOut = stackOut,
              _r = _stackOut.r,
              _g = _stackOut.g,
              _b = _stackOut.b,
              _a = _stackOut.a;
          rOutSum += _r;
          gOutSum += _g;
          bOutSum += _b;
          aOutSum += _a;
          rInSum -= _r;
          gInSum -= _g;
          bInSum -= _b;
          aInSum -= _a;
          stackOut = stackOut.next;
          yi += 4;
        }

        yw += width;
      }

      for (var _x = 0; _x < width; _x++) {
        yi = _x << 2;

        var _pr = pixels[yi],
            _pg = pixels[yi + 1],
            _pb = pixels[yi + 2],
            _pa = pixels[yi + 3],
            _rOutSum = radiusPlus1 * _pr,
            _gOutSum = radiusPlus1 * _pg,
            _bOutSum = radiusPlus1 * _pb,
            _aOutSum = radiusPlus1 * _pa,
            _rSum = sumFactor * _pr,
            _gSum = sumFactor * _pg,
            _bSum = sumFactor * _pb,
            _aSum = sumFactor * _pa;

        stack = stackStart;

        for (var _i3 = 0; _i3 < radiusPlus1; _i3++) {
          stack.r = _pr;
          stack.g = _pg;
          stack.b = _pb;
          stack.a = _pa;
          stack = stack.next;
        }

        var yp = width;
        var _gInSum = 0,
            _bInSum = 0,
            _aInSum = 0,
            _rInSum = 0;

        for (var _i4 = 1; _i4 <= radius; _i4++) {
          yi = yp + _x << 2;

          var _rbs = radiusPlus1 - _i4;

          _rSum += (stack.r = _pr = pixels[yi]) * _rbs;
          _gSum += (stack.g = _pg = pixels[yi + 1]) * _rbs;
          _bSum += (stack.b = _pb = pixels[yi + 2]) * _rbs;
          _aSum += (stack.a = _pa = pixels[yi + 3]) * _rbs;
          _rInSum += _pr;
          _gInSum += _pg;
          _bInSum += _pb;
          _aInSum += _pa;
          stack = stack.next;

          if (_i4 < heightMinus1) {
            yp += width;
          }
        }

        yi = _x;
        stackIn = stackStart;
        stackOut = stackEnd;

        for (var _y = 0; _y < height; _y++) {
          var _p2 = yi << 2;

          pixels[_p2 + 3] = _pa = _aSum * mulSum >> shgSum;

          if (_pa > 0) {
            _pa = 255 / _pa;
            pixels[_p2] = (_rSum * mulSum >> shgSum) * _pa;
            pixels[_p2 + 1] = (_gSum * mulSum >> shgSum) * _pa;
            pixels[_p2 + 2] = (_bSum * mulSum >> shgSum) * _pa;
          } else {
            pixels[_p2] = pixels[_p2 + 1] = pixels[_p2 + 2] = 0;
          }

          _rSum -= _rOutSum;
          _gSum -= _gOutSum;
          _bSum -= _bOutSum;
          _aSum -= _aOutSum;
          _rOutSum -= stackIn.r;
          _gOutSum -= stackIn.g;
          _bOutSum -= stackIn.b;
          _aOutSum -= stackIn.a;
          _p2 = _x + ((_p2 = _y + radiusPlus1) < heightMinus1 ? _p2 : heightMinus1) * width << 2;
          _rSum += _rInSum += stackIn.r = pixels[_p2];
          _gSum += _gInSum += stackIn.g = pixels[_p2 + 1];
          _bSum += _bInSum += stackIn.b = pixels[_p2 + 2];
          _aSum += _aInSum += stackIn.a = pixels[_p2 + 3];
          stackIn = stackIn.next;
          _rOutSum += _pr = stackOut.r;
          _gOutSum += _pg = stackOut.g;
          _bOutSum += _pb = stackOut.b;
          _aOutSum += _pa = stackOut.a;
          _rInSum -= _pr;
          _gInSum -= _pg;
          _bInSum -= _pb;
          _aInSum -= _pa;
          stackOut = stackOut.next;
          yi += width;
        }
      }

      return imageData;
    }
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @param {Float} radius
     * @returns {undefined}
     */


    function processCanvasRGB(canvas, topX, topY, width, height, radius) {
      if (isNaN(radius) || radius < 1) {
        return;
      }

      radius |= 0;
      var imageData = getImageDataFromCanvas(canvas, topX, topY, width, height);
      imageData = processImageDataRGB(imageData, topX, topY, width, height, radius);

      try {
        canvas.getContext('2d').putImageData(imageData, topX, topY);
      } catch (e) {}
    }
    /**
     * @param {ImageData} imageData
     * @param {Integer} topX
     * @param {Integer} topY
     * @param {Integer} width
     * @param {Integer} height
     * @param {Float} radius
     * @returns {ImageData}
     */


    function processImageDataRGB(imageData, topX, topY, width, height, radius) {
      var pixels = imageData ? imageData.data : [];
      var div = 2 * radius + 1; // const w4 = width << 2;

      var widthMinus1 = width - 1;
      var heightMinus1 = height - 1;
      var radiusPlus1 = radius + 1;
      var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
      var stackStart = new BlurStack();
      var stack = stackStart;
      var stackEnd;

      for (var i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();

        if (i === radiusPlus1) {
          stackEnd = stack;
        }
      }

      stack.next = stackStart;
      var stackIn = null;
      var stackOut = null;
      var mulSum = mulTable[radius];
      var shgSum = shgTable[radius];
      var p, rbs;
      var yw = 0,
          yi = 0;

      for (var y = 0; y < height; y++) {
        var pr = pixels[yi],
            pg = pixels[yi + 1],
            pb = pixels[yi + 2],
            rOutSum = radiusPlus1 * pr,
            gOutSum = radiusPlus1 * pg,
            bOutSum = radiusPlus1 * pb,
            rSum = sumFactor * pr,
            gSum = sumFactor * pg,
            bSum = sumFactor * pb;
        stack = stackStart;

        for (var _i5 = 0; _i5 < radiusPlus1; _i5++) {
          stack.r = pr;
          stack.g = pg;
          stack.b = pb;
          stack = stack.next;
        }

        var rInSum = 0,
            gInSum = 0,
            bInSum = 0;

        for (var _i6 = 1; _i6 < radiusPlus1; _i6++) {
          p = yi + ((widthMinus1 < _i6 ? widthMinus1 : _i6) << 2);
          rSum += (stack.r = pr = pixels[p]) * (rbs = radiusPlus1 - _i6);
          gSum += (stack.g = pg = pixels[p + 1]) * rbs;
          bSum += (stack.b = pb = pixels[p + 2]) * rbs;
          rInSum += pr;
          gInSum += pg;
          bInSum += pb;
          stack = stack.next;
        }

        stackIn = stackStart;
        stackOut = stackEnd;

        for (var x = 0; x < width; x++) {
          pixels[yi] = rSum * mulSum >> shgSum;
          pixels[yi + 1] = gSum * mulSum >> shgSum;
          pixels[yi + 2] = bSum * mulSum >> shgSum;
          rSum -= rOutSum;
          gSum -= gOutSum;
          bSum -= bOutSum;
          rOutSum -= stackIn.r;
          gOutSum -= stackIn.g;
          bOutSum -= stackIn.b;
          p = yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1) << 2;
          rInSum += stackIn.r = pixels[p];
          gInSum += stackIn.g = pixels[p + 1];
          bInSum += stackIn.b = pixels[p + 2];
          rSum += rInSum;
          gSum += gInSum;
          bSum += bInSum;
          stackIn = stackIn.next;
          rOutSum += pr = stackOut.r;
          gOutSum += pg = stackOut.g;
          bOutSum += pb = stackOut.b;
          rInSum -= pr;
          gInSum -= pg;
          bInSum -= pb;
          stackOut = stackOut.next;
          yi += 4;
        }

        yw += width;
      }

      for (var _x2 = 0; _x2 < width; _x2++) {
        yi = _x2 << 2;

        var _pr2 = pixels[yi],
            _pg2 = pixels[yi + 1],
            _pb2 = pixels[yi + 2],
            _rOutSum2 = radiusPlus1 * _pr2,
            _gOutSum2 = radiusPlus1 * _pg2,
            _bOutSum2 = radiusPlus1 * _pb2,
            _rSum2 = sumFactor * _pr2,
            _gSum2 = sumFactor * _pg2,
            _bSum2 = sumFactor * _pb2;

        stack = stackStart;

        for (var _i7 = 0; _i7 < radiusPlus1; _i7++) {
          stack.r = _pr2;
          stack.g = _pg2;
          stack.b = _pb2;
          stack = stack.next;
        }

        var _rInSum2 = 0,
            _gInSum2 = 0,
            _bInSum2 = 0;

        for (var _i8 = 1, yp = width; _i8 <= radius; _i8++) {
          yi = yp + _x2 << 2;
          _rSum2 += (stack.r = _pr2 = pixels[yi]) * (rbs = radiusPlus1 - _i8);
          _gSum2 += (stack.g = _pg2 = pixels[yi + 1]) * rbs;
          _bSum2 += (stack.b = _pb2 = pixels[yi + 2]) * rbs;
          _rInSum2 += _pr2;
          _gInSum2 += _pg2;
          _bInSum2 += _pb2;
          stack = stack.next;

          if (_i8 < heightMinus1) {
            yp += width;
          }
        }

        yi = _x2;
        stackIn = stackStart;
        stackOut = stackEnd;

        for (var _y2 = 0; _y2 < height; _y2++) {
          p = yi << 2;
          pixels[p] = _rSum2 * mulSum >> shgSum;
          pixels[p + 1] = _gSum2 * mulSum >> shgSum;
          pixels[p + 2] = _bSum2 * mulSum >> shgSum;
          _rSum2 -= _rOutSum2;
          _gSum2 -= _gOutSum2;
          _bSum2 -= _bOutSum2;
          _rOutSum2 -= stackIn.r;
          _gOutSum2 -= stackIn.g;
          _bOutSum2 -= stackIn.b;
          p = _x2 + ((p = _y2 + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width << 2;
          _rSum2 += _rInSum2 += stackIn.r = pixels[p];
          _gSum2 += _gInSum2 += stackIn.g = pixels[p + 1];
          _bSum2 += _bInSum2 += stackIn.b = pixels[p + 2];
          stackIn = stackIn.next;
          _rOutSum2 += _pr2 = stackOut.r;
          _gOutSum2 += _pg2 = stackOut.g;
          _bOutSum2 += _pb2 = stackOut.b;
          _rInSum2 -= _pr2;
          _gInSum2 -= _pg2;
          _bInSum2 -= _pb2;
          stackOut = stackOut.next;
          yi += width;
        }
      }

      return imageData;
    }
    /**
     *
     */


    var BlurStack = /*#__PURE__*/_createClass(
    /**
     * Set properties.
     */
    function BlurStack() {
      _classCallCheck(this, BlurStack);

      this.r = 0;
      this.g = 0;
      this.b = 0;
      this.a = 0;
      this.next = null;
    });
    var Blur = {
      /**
       * @function module:StackBlur.image
       * @see module:StackBlur~processImage
       */
      image: processImage,

      /**
       * @function module:StackBlur.canvasRGBA
       * @see module:StackBlur~processCanvasRGBA
       */
      canvasRGBA: processCanvasRGBA,

      /**
       * @function module:StackBlur.canvasRGB
       * @see module:StackBlur~processCanvasRGB
       */
      canvasRGB: processCanvasRGB,

      /**
       * @function module:StackBlur.imageDataRGBA
       * @see module:StackBlur~processImageDataRGBA
       */
      imageDataRGBA: processImageDataRGBA,

      /**
       * @function module:StackBlur.imageDataRGB
       * @see module:StackBlur~processImageDataRGB
       */
      imageDataRGB: processImageDataRGB
    };

    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.width = 30;
    canvas.height = 17;

    function extract(img_data) {
      var data = img_data.data,
          colors = [];

      for (var i = 0, n = data.length; i < n; i += 4) {
        colors.push([data[i], data[i + 1], data[i + 2]]);
      }

      return colors;
    }

    function palette(palette) {
      var colors = {
        bright: [0, 0, 0],
        average: [127, 127, 127],
        dark: [255, 255, 255]
      };
      var ar = 0,
          ag = 0,
          ab = 0,
          at = palette.length;
      var bg = 0,
          dk = 765;

      for (var i = 0; i < palette.length; i++) {
        var p = palette[i],
            a = p[0] + p[1] + p[2];
        ar += p[0];
        ag += p[1];
        ab += p[2];

        if (a > bg) {
          bg = a;
          colors.bright = p;
        }

        if (a < dk) {
          dk = a;
          colors.dark = p;
        }
      }

      colors.average = [Math.round(ar / at), Math.round(ag / at), Math.round(ab / at)];
      return colors;
    }

    function rgba(c) {
      var o = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      return 'rgba(' + c.join(',') + ',' + o + ')';
    }

    function tone(c) {
      var o = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var s = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 30;
      var l = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 80;
      var hls = rgbToHsl(c[0], c[1], c[2]);
      var rgb = hslToRgb(hls[0], Math.min(s, hls[1]), l);
      return rgba(rgb, o);
    }
    /**
     * Converts an RGB color value to HSL.
     *
     * @param   {number}  r       The red color value
     * @param   {number}  g       The green color value
     * @param   {number}  b       The blue color value
     * @return  {Array}           The HSL representation
     */


    function rgbToHsl(r, g, b) {
      var rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
      rabs = r / 255;
      gabs = g / 255;
      babs = b / 255;
      v = Math.max(rabs, gabs, babs), diff = v - Math.min(rabs, gabs, babs);

      diffc = function diffc(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };

      percentRoundFn = function percentRoundFn(num) {
        return Math.round(num * 100) / 100;
      };

      if (diff == 0) {
        h = s = 0;
      } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
          h = bb - gg;
        } else if (gabs === v) {
          h = 1 / 3 + rr - bb;
        } else if (babs === v) {
          h = 2 / 3 + gg - rr;
        }

        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }

      return [Math.round(h * 360), percentRoundFn(s * 100), percentRoundFn(v * 100)];
    }
    /**
     * Converts an HSL color value to RGB.
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */


    function hslToRgb(h, s, l) {
      s /= 100;
      l /= 100;
      var C = (1 - Math.abs(2 * l - 1)) * s;
      var hue = h / 60;
      var X = C * (1 - Math.abs(hue % 2 - 1));
      var r = 0,
          g = 0,
          b = 0;

      if (hue >= 0 && hue < 1) {
        r = C;
        g = X;
      } else if (hue >= 1 && hue < 2) {
        r = X;
        g = C;
      } else if (hue >= 2 && hue < 3) {
        g = C;
        b = X;
      } else if (hue >= 3 && hue < 4) {
        g = X;
        b = C;
      } else if (hue >= 4 && hue < 5) {
        r = X;
        b = C;
      } else {
        r = C;
        b = X;
      }

      var m = l - C / 2;
      r += m;
      g += m;
      b += m;
      r *= 255.0;
      g *= 255.0;
      b *= 255.0;
      return [Math.round(r), Math.round(g), Math.round(b)];
    }

    function reset(width, height) {
      canvas.width = width;
      canvas.height = height;
    }

    function get$7(img) {
      reset(30, 17);
      var ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
      var nw = img.width * ratio,
          nh = img.height * ratio;
      ctx.drawImage(img, -(nw - canvas.width) / 2, -(nh - canvas.height) / 2, nw, nh);
      return extract(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    function blur$1(img) {
      reset(200, 130);
      var ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
      var nw = img.width * ratio,
          nh = img.height * ratio;
      ctx.drawImage(img, -(nw - canvas.width) / 2, -(nh - canvas.height) / 2, nw, nh);
      Blur.canvasRGB(canvas, 0, 0, canvas.width, canvas.height, 80);
      var nimg = new Image();

      try {
        nimg.src = canvas.toDataURL();
      } catch (e) {}

      return nimg;
    }

    var Color = {
      get: get$7,
      extract: extract,
      palette: palette,
      rgba: rgba,
      blur: blur$1,
      tone: tone,
      rgbToHsl: rgbToHsl,
      hslToRgb: hslToRgb
    };

    var html$5 = $("\n    <div class=\"background\">\n        <canvas class=\"background__one\"></canvas>\n        <canvas class=\"background__two\"></canvas>\n    </div>");
    var background$1 = {
      one: {
        canvas: $('.background__one', html$5),
        ctx: $('.background__one', html$5)[0].getContext('2d')
      },
      two: {
        canvas: $('.background__two', html$5),
        ctx: $('.background__two', html$5)[0].getContext('2d')
      }
    };
    var view = 'one';
    var src = '';
    var loaded = {};
    var bokeh = {
      c: [],
      h: [],
      d: true
    };
    var timer$1;
    var timer_resize;
    var timer_change;
    /**
     * Запуск
     */

    function init$7() {
      Storage.listener.follow('change', function (event) {
        if (event.name == 'background' || event.name == 'background_type') resize();
      });
      var u = Platform.any() ? 'https://yumata.github.io/lampa/' : './';

      for (var i = 1; i <= 6; i++) {
        var im = new Image();
        im.src = u + 'img/bokeh-h/' + i + '.png';
        bokeh.h.push(im);
      }

      for (var _i = 1; _i <= 6; _i++) {
        var _im = new Image();

        _im.src = u + 'img/bokeh/' + _i + '.png';
        bokeh.c.push(_im);
      }

      $(window).on('resize', resize);
    }
    /**
     * Получить активный фон
     * @returns {{canvas:object, ctx: class}}
     */


    function bg() {
      clearTimeout(timer_change);
      var visible = html$5.find('canvas.visible');
      timer_change = setTimeout(function () {
        visible.removeClass('visible');
      }, 400);
      view = view == 'one' ? 'two' : 'one';
      return background$1[view];
    }
    /**
     * Рисовать
     * @param {object} data
     * @param {object} item - фон
     * @param {boolean} noimage
     */


    function draw(data, item, noimage) {
      if (!Storage.get('background', 'true') || noimage) {
        background$1.one.canvas.removeClass('visible');
        background$1.two.canvas.removeClass('visible');
        return;
      }

      item.canvas[0].width = window.innerWidth;
      item.canvas[0].height = window.innerHeight;
      var palette = data.palette;
      var type = Storage.field('background_type');
      blur(data, item, function () {
        if (type == 'complex' && bokeh.d) {
          var bright = Color.rgbToHsl(palette.average[0], palette.average[1], palette.average[2]);
          item.ctx.globalAlpha = bright[2] > 30 ? bright[2] / 100 * 0.6 : 0.4;
          item.ctx.globalCompositeOperation = bright[2] > 30 ? 'color-dodge' : 'screen';

          for (var i = 0; i < 10; i++) {
            var bp = Math.round(Math.random() * (bokeh.c.length - 1));
            var im = bright[2] > 30 ? bokeh.h[bp] : bokeh.c[bp];
            var xp = window.innerWidth * Math.random(),
                yp = window.innerHeight / 2 * Math.random() + window.innerHeight / 2,
                sz = Math.max(window.innerHeight / 8, window.innerHeight / 5 * Math.random()) * 0.01,
                nw = im.width * sz,
                nh = im.height * sz;

            try {
              item.ctx.drawImage(im, xp - nw / 2, yp - nw / 2, nw, nh);
            } catch (e) {}
          }
        }

        item.ctx.globalAlpha = type == 'poster' ? 0.7 : 0.6;
        item.ctx.globalCompositeOperation = 'multiply';
        var angle = 90 * Math.PI / 180,
            x2 = item.canvas[0].width * Math.cos(angle),
            y2 = item.canvas[0].height * Math.sin(angle);
        var gradient = item.ctx.createLinearGradient(0, 0, x2, y2);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        item.ctx.fillStyle = gradient;
        item.ctx.fillRect(0, 0, item.canvas[0].width, item.canvas[0].height);
        item.canvas.addClass('visible');
      });
    }
    /**
     * Размыть картинку
     * @param {object} data
     * @param {object} item - фон
     * @param {function} complite
     */


    function blur(data, item, complite) {
      var img = data.img.width > 1000 ? data.img : Color.blur(data.img);
      setTimeout(function () {
        var ratio = Math.max(item.canvas[0].width / img.width, item.canvas[0].height / img.height);
        var nw = img.width * ratio,
            nh = img.height * ratio;
        item.ctx.globalAlpha = data.img.width > 1000 ? bokeh.d ? 0.7 : 0.2 : 1;
        item.ctx.drawImage(img, -(nw - item.canvas[0].width) / 2, -(nh - item.canvas[0].height) / 2, nw, nh);
        complite();
      }, 100);
    }
    /**
     * Обновить если изменился размер окна
     */


    function resize() {
      clearTimeout(timer_resize);
      html$5.find('canvas').removeClass('visible');
      background$1.one.canvas.width(window.innerWidth);
      background$1.one.canvas.height(window.innerHeight);
      background$1.two.canvas.width(window.innerWidth);
      background$1.two.canvas.height(window.innerHeight);
      timer_resize = setTimeout(function () {
        if (loaded[src]) draw(loaded[src], background$1[view]);
      }, 200);
    }
    /**
     * Максимум картинок в памяти
     */


    function limit$1() {
      var a = Arrays.getKeys(loaded);

      if (a.length > 30) {
        var u = a.slice(0, 1);
        delete loaded[u];
      }
    }
    /**
     * Загрузить картинку в память
     */


    function load() {
      if (loaded[src]) {
        draw(loaded[src], bg());
      } else if (src) {
        limit$1();
        var cache_src = src;
        var colors;
        var img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = function () {
          try {
            colors = Color.get(img);
          } catch (e) {
            colors = [[200, 200, 200], [100, 100, 100], [10, 10, 10]];
          }

          loaded[cache_src] = {
            img: img,
            palette: Color.palette(colors)
          };
          draw(loaded[cache_src], bg());
        };

        img.onerror = function () {
          draw(false, false, true);
        };

        img.src = src;
      }
    }
    /**
     * Изменить картинку
     * @param {string} url
     */


    function change() {
      var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      if (url == src || Storage.field('light_version')) return;
      bokeh.d = true;
      if (url) src = url;
      clearTimeout(timer$1);
      timer$1 = setTimeout(function () {
        if (url) load();else draw(false, false, true);
      }, 1000);
    }
    /**
     * Изменить немедленно без ожидания
     * @param {string} url
     */


    function immediately() {
      var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      if (Storage.field('light_version')) return;
      if (url) src = url;
      clearTimeout(timer$1);
      bokeh.d = false;
      if (url) load();else draw(false, false, true);
    }
    /**
     * Рендер
     * @returns {object}
     */


    function render$3() {
      return html$5;
    }

    var Background = {
      render: render$3,
      change: change,
      update: resize,
      init: init$7,
      immediately: immediately
    };

    function create$j() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var card = Template$1.get('more');

      if (params.card_small) {
        card.addClass('card-more--small');
      }

      this.create = function () {
        var _this = this;

        card.on('hover:focus', function (e) {
          _this.onFocus(e.target);
        }).on('hover:enter', function (e) {
          _this.onEnter(e.target);
        });
      };

      this.render = function () {
        return card;
      };

      this.destroy = function () {
        card.remove();
        card = null;
      };
    }

    function create$i(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var content = Template$1.get('items_line', {
        title: data.title
      });
      var body = content.find('.items-line__body');
      var scroll = new create$o({
        horizontal: true,
        step: params.wide ? 600 : 300
      });
      var viewall = Storage.field('card_views_type') == 'view' || Storage.field('navigation_type') == 'mouse';
      var light = Storage.field('light_version') && window.innerWidth >= 767;
      var items = [];
      var active = 0;
      var more;
      var last;

      this.create = function () {
        scroll.render().find('.scroll__body').addClass('items-cards');
        content.find('.items-line__title').text(data.title);
        this.bind();
        body.append(scroll.render());
      };

      this.bind = function () {
        data.results.slice(0, viewall ? light ? 6 : data.results.length : 8).forEach(this.append.bind(this));
        if ((data.results.length >= 20 || data.more) && !params.nomore) this.more();
        this.visible();
        Layer.update();
      };

      this.append = function (element) {
        var _this = this;

        if (element.ready) return;
        element.ready = true;
        var card = new Card(element, params);
        card.create();

        card.onFocus = function (target, card_data, is_mouse) {
          last = target;
          active = items.indexOf(card);
          if (!viewall && !light) data.results.slice(0, active + 5).forEach(_this.append.bind(_this));

          if (more) {
            more.render().detach();
            scroll.append(more.render());
          }

          if (!is_mouse) scroll.update(items[active].render(), params.align_left ? false : true);

          _this.visible();

          if (!data.noimage) Background.change(Utils.cardImgBackground(card_data));
          if (_this.onFocus) _this.onFocus(card_data);
        };

        card.onEnter = function (target, card_data) {
          if (_this.onEnter) _this.onEnter(target, card_data);
          if (_this.onSelect) return _this.onSelect(target, card_data);
          if (!element.source) element.source = params.object.source;
          Activity$1.push({
            url: element.url,
            component: 'full',
            id: element.id,
            method: card_data.name ? 'tv' : 'movie',
            card: element,
            source: element.source || params.object.source
          });
        };

        if (params.card_events) {
          for (var i in params.card_events) {
            card[i] = params.card_events[i];
          }
        }

        scroll.append(card.render());
        items.push(card);
      };

      this.more = function () {
        var _this2 = this;

        more = new create$j(params);
        more.create();

        var onmore = function onmore() {
          if (_this2.onEnter) _this2.onEnter();

          if (_this2.onMore) {
            _this2.onMore();
          } else {
            Activity$1.push({
              url: data.url,
              title: Lang.translate('title_category'),
              component: 'category_full',
              page: light ? 1 : 2,
              genres: params.genres,
              filter: data.filter,
              source: params.object.source
            });
          }
        };

        more.onFocus = function (target) {
          last = target;
          scroll.update(more.render(), params.align_left ? false : true);
          if (_this2.onFocusMore) _this2.onFocusMore();
        };

        more.onEnter = function () {
          onmore();
        };

        var button = $('<div class="items-line__more selector">' + Lang.translate('more') + '</div>');
        button.on('hover:enter', function () {
          onmore();
        });
        content.find('.items-line__head').append(button);
        scroll.append(more.render());
      };

      this.visible = function () {
        var vis = items;
        if (!viewall) vis = items.slice(active, active + 8);
        vis.forEach(function (item) {
          item.visible();
        });
      };

      this.toggle = function () {
        var _this3 = this;

        Controller.add('items_line', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(items.length ? last : false, scroll.render());

            _this3.visible();
          },
          right: function right() {
            Navigator.move('right');
            Controller.enable('items_line');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else if (_this3.onLeft) _this3.onLeft();else Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('items_line');
      };

      this.render = function () {
        return content;
      };

      this.destroy = function () {
        Arrays.destroy(items);
        scroll.destroy();
        content.remove();
        if (more) more.destroy();
        items = null;
        more = null;
      };
    }

    function create$h(source) {
      var timer,
          html = $('<div></div>'),
          items = [],
          active = 0,
          query;
      this.listener = start$4();

      this.create = function () {
        this.empty();
      };

      this.empty = function () {
        html.empty().append($('<div class="search-looking"><div class="search-looking__text">' + Lang.translate(query ? 'search_nofound' : 'search_start_typing') + '</div></div>'));
      };

      this.loading = function () {
        this.listener.send('start');
        html.empty().append($('<div><div class="broadcast__text">' + Lang.translate('search_searching') + '</div><div class="broadcast__scan"><div></div></div></div>'));
      };

      this.cancel = function () {
        if (source.onCancel) source.onCancel();
      };

      this.search = function (value, immediately) {
        var _this = this;

        clearTimeout(timer);

        if (value.length >= 2) {
          timer = setTimeout(function () {
            if (query == value) return;
            query = value;

            _this.loading();

            source.search({
              query: encodeURIComponent(value)
            }, function (data) {
              _this.clear();

              if (data.length > 0) {
                html.empty();
                data.forEach(_this.build.bind(_this));
              }

              _this.listener.send('finded', {
                count: data.length
              });
            });
          }, immediately ? 10 : 2500);
        } else {
          query = value;
          this.clear();
        }
      };

      this.build = function (data) {
        var _this2 = this;

        data.noimage = true;
        var line = new create$i(data, source.params);
        line.onDown = this.down.bind(this);
        line.onUp = this.up.bind(this);
        line.onBack = this.back.bind(this);

        line.onLeft = function () {};

        line.onMore = function () {
          if (source.onMore) source.onMore({
            data: data,
            line: line,
            query: query
          }, function () {
            _this2.listener.send('select');
          });
        };

        if (source.onSelect) {
          line.onSelect = function (e, element) {
            source.onSelect({
              data: data,
              line: line,
              query: query,
              element: element
            }, function () {
              _this2.listener.send('back');
            });
          };
        } else {
          line.onEnter = function () {
            _this2.listener.send('select');
          };
        }

        if (source.onRender) source.onRender(line);
        line.create();
        items.push(line);
        html.append(line.render());

        if (Storage.field('navigation_type') === 'mouse') {
          line.render().on('mouseenter touchstart', function () {
            if (!line.activated) {
              line.activated = true;
              active = items.indexOf(line);
              line.toggle();
            }
          });
        }
      };

      this.any = function () {
        return items.length;
      };

      this.back = function () {
        this.listener.send('back');
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        items[active].toggle();
        this.listener.send('toggle', {
          element: items[active].render()
        });
      };

      this.up = function () {
        active--;
        if (active < 0) this.listener.send('up');

        if (active < 0) {
          active = 0;
        } else {
          items[active].toggle();
          this.listener.send('toggle', {
            element: items[active].render()
          });
        }
      };

      this.clear = function () {
        this.empty();
        active = 0;
        Arrays.destroy(items);
        items = [];
      };

      this.toggle = function () {
        var _this3 = this;

        Controller.add('search_results', {
          invisible: true,
          toggle: function toggle() {
            Controller.collectionSet(html);

            if (items.length) {
              items[active].toggle();

              _this3.listener.send('toggle', {
                element: items[active].render()
              });
            }
          },
          back: function back() {
            _this3.listener.send('back');
          }
        });
        Controller.toggle('search_results');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        clearTimeout(timer);
        this.clear();
        this.listener.destroy();
      };
    }

    function create$g() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var scroll, last, active;
      var html = $('<div></div>'),
          results = [];
      this.listener = start$4();

      this.create = function () {
        scroll = new create$o({
          over: true,
          mask: false,
          horizontal: true
        });
        var sources = params.sources || Api.availableDiscovery();
        sources.forEach(this.build.bind(this));

        if (!params.sources) {
          params.additional.forEach(this.build.bind(this));
        }

        this.enable(results[0]);

        if (results.length < 2) {
          scroll.render().addClass('hide');
          html.addClass('search__results-offset');
        }
      };

      this.enable = function (result) {
        if (active) active.render().detach();
        active = result;
        html.empty().append(result.render());
        scroll.render().find('.search-source').removeClass('active').eq(results.indexOf(result)).addClass('active');
      };

      this.build = function (source) {
        var _this = this;

        var tab = $('<div class="search-source selector"><div class="search-source__tab">' + source.title + '</div><div class="search-source__count">0</div></div>');
        var result = new create$h(source);
        result.create();
        result.listener.follow('start', function () {
          tab.addClass('search-source--loading');
          tab.find('.search-source__count').html('&nbsp;');
        });
        result.listener.follow('finded', function (e) {
          tab.removeClass('search-source--loading');
          tab.find('.search-source__count').text(e.count);
        });
        result.listener.follow('up', function (e) {
          if (results.length < 2) _this.listener.send('up');else _this.toggle();
        });
        result.listener.follow('select', this.listener.send.bind(this.listener, 'select'));
        result.listener.follow('back', this.listener.send.bind(this.listener, 'back'));
        result.listener.follow('toggle', function (e) {
          _this.listener.send('toggle', {
            source: source,
            result: e.result,
            element: e.element
          });
        });
        tab.on('hover:enter', function () {
          _this.enable(result);
        }).on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target));
        });
        scroll.append(tab);
        results.push(result);
      };

      this.toggle = function (from_search) {
        var _this2 = this;

        Controller.add('search_sources', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last, scroll.render());
            if (from_search && results.length < 2 && active.any()) active.toggle();
          },
          up: function up() {
            _this2.listener.send('up');
          },
          down: function down() {
            if (active.any()) active.toggle();
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            Navigator.move('left');
          },
          back: function back() {
            _this2.listener.send('back');
          }
        });
        Controller.toggle('search_sources');
      };

      this.search = function (query, immediately) {
        results.forEach(function (result) {
          return result.cancel();
        });
        results.forEach(function (result) {
          result.search(query, immediately);
        });
      };

      this.tabs = function () {
        return scroll.render();
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        scroll.destroy();
        results.forEach(function (result) {
          return result.cancel();
        });
        this.listener.destroy();
      };
    }

    function create$f() {
      var scroll,
          last,
          keys = [];
      this.listener = start$4();

      this.create = function () {
        var _this = this;

        scroll = new create$o({
          over: true,
          mask: false,
          horizontal: true
        });
        keys = Storage.get('search_history', '[]');
        keys.forEach(function (key) {
          _this.append(key);
        });
        if (!keys.length) scroll.append('<div class="selector search-history-empty">' + Lang.translate('search_empty') + '</div>');
      };

      this.append = function (value) {
        var _this2 = this;

        var key = $('<div class="search-history-key selector"><div><span>' + value + '</span></div></div>');
        key.on('hover:enter', function () {
          _this2.listener.send('enter', {
            value: value
          });
        }).on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        }).on('hover:long', function () {
          var selc = scroll.render().find('.selector');
          Arrays.remove(keys, value);
          Storage.set('search_history', keys);
          var index = selc.index(key);
          if (index > 0) last = selc.eq(index - 1)[0];else if (selc[index + 1]) last = selc.eq(index + 1)[0];
          key.remove();
          if (selc.length - 1 <= 0) last = false;
          Controller.collectionFocus(last, scroll.render());
        });
        scroll.append(key);
      };

      this.add = function (value) {
        if (keys.indexOf(value) == -1) {
          Arrays.insert(keys, 0, value);
          if (keys.length > 10) keys = keys.slice(0, 10);
          Storage.set('search_history', keys);
        }
      };

      this.toggle = function () {
        var _this3 = this;

        Controller.add('search_history', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last, scroll.render());
          },
          up: function up() {
            _this3.listener.send('up');
          },
          down: function down() {
            _this3.listener.send('down');
          },
          right: function right() {
            Navigator.move('right');
          },
          back: function back() {
            _this3.listener.send('back');
          },
          left: function left() {
            Navigator.move('left');
          }
        });
        Controller.toggle('search_history');
      };

      this.any = function () {
        return keys.length;
      };

      this.render = function () {
        return scroll.render();
      };

      this.destroy = function () {
        scroll.destroy();
        this.listener.destroy();
        keys = null;
        last = null;
      };
    }

    var html$4 = $('<div class="main-search"></div>'),
        search$2,
        history,
        sources$1,
        keyboard$1,
        scroll,
        input$1 = '',
        params = {},
        additional = [];

    function open$1() {
      var use_params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      params = use_params;
      $('body').toggleClass('ambience--enable', true);
      create$e();
      toggle$3();
    }

    function toggle$3() {
      Controller.add('search', {
        invisible: true,
        toggle: function toggle() {
          keyboard$1.toggle();
        },
        back: destroy$1
      });
      Controller.toggle('search');
    }

    function scrollTo(element) {
      scroll.update(element ? element : search$2.find('.search__input'), true);
    }

    function create$e() {
      search$2 = Template$1.get('search');
      scroll = new create$o({
        step: 300
      });
      scroll.height();
      scroll.render().addClass('search');
      scroll.append(search$2);
      html$4.append(scroll.render());
      if (Storage.field('keyboard_type') !== 'lampa') search$2.find('.search__input').hide();
      createKeyboard();
      createHistory();
      createSources();

      if (Storage.field('navigation_type') === 'mouse') {
        search$2.find('[data-area]').on('mouseenter touchstart', function () {
          var area = $(this).data('area');
          if (area === 'history') history.toggle();else if (area === 'sources') sources$1.toggle();
        });
      }

      keyboard$1.value(input$1);
      sources$1.search(input$1, true);
    }

    function createSources() {
      sources$1 = new create$g({
        sources: params.sources,
        additional: additional
      });
      sources$1.create();
      sources$1.listener.follow('back', destroy$1);
      sources$1.listener.follow('up', function () {
        if (history.any()) history.toggle();else keyboard$1.toggle();
        scrollTo();
      });
      sources$1.listener.follow('toggle', function (e) {
        scrollTo(e.element);
      });
      sources$1.listener.follow('select', function (e) {
        if (input$1) history.add(input$1);
        destroy$1();
      });
      search$2.find('.search__sources').append(sources$1.tabs());
      search$2.find('.search__results').append(sources$1.render());
    }

    function createHistory() {
      history = new create$f();
      history.create();
      history.listener.follow('down', function () {
        sources$1.toggle(true);
      });
      history.listener.follow('up', function () {
        keyboard$1.toggle();
      });
      history.listener.follow('enter', function (event) {
        keyboard$1.value(event.value);
        sources$1.search(event.value, true);
      });
      history.listener.follow('back', destroy$1);
      search$2.find('.search__history').append(history.render());
    }

    function createKeyboard() {
      keyboard$1 = new create({
        layout: 'search'
      });
      keyboard$1.create();
      keyboard$1.listener.follow('change', function (event) {
        input$1 = event.value.trim();

        if (input$1) {
          search$2.find('.search__input').text(input$1);
          sources$1.search(input$1);
        } else {
          search$2.find('.search__input').text(Lang.translate('search_input') + '...');
        }
      });
      keyboard$1.listener.follow('down', function () {
        if (history.any()) history.toggle();else sources$1.toggle();
      });
      keyboard$1.listener.follow('hover', function () {
        sources$1.search(input$1);
      });
      keyboard$1.listener.follow('back', destroy$1);
    }

    function addSource(source) {
      additional.push(source);
    }

    function removeSource(source) {
      Arrays.remove(additional, source);
    }

    function render$2() {
      return html$4;
    }

    function destroy$1() {
      keyboard$1.destroy();
      history.destroy();
      sources$1.destroy();
      search$2.remove();
      html$4.empty();
      if (params.onBack) params.onBack();else Controller.toggle('content');
      $('body').toggleClass('ambience--enable', false);
      params = {};
    }

    var Search = {
      open: open$1,
      render: render$2,
      addSource: addSource,
      removeSource: removeSource
    };

    var html$3;
    var last$1;
    var activi = false;

    function init$6() {
      html$3 = Template$1.get('head');
      Utils.time(html$3);
      Notice.start(html$3);
      html$3.find('.selector').data('controller', 'head').on('hover:focus', function (event) {
        last$1 = event.target;
      });
      html$3.find('.open--settings').on('hover:enter', function () {
        Controller.toggle('settings');
      });
      html$3.find('.open--notice').on('hover:enter', function () {
        Notice.open();
      });
      html$3.find('.open--search').on('hover:enter', function () {
        Search.open();
      });
      html$3.find('.head__logo-icon').on('click', function () {
        Controller.toggle('menu');
      });
      Storage.listener.follow('change', function (e) {
        if (e.name == 'account') {
          html$3.find('.open--profile').toggleClass('hide', e.value.token ? false : true);
        }
      });
      html$3.find('.full-screen').on('hover:enter', function () {
        Utils.toggleFullscreen();
      }).toggleClass('hide', Platform.tv() || Platform.is('android') || !Utils.canFullScreen());
      Controller.add('head', {
        toggle: function toggle() {
          Controller.collectionSet(html$3);
          Controller.collectionFocus(last$1, html$3);
        },
        right: function right() {
          Navigator.move('right');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
        },
        down: function down() {
          Controller.toggle('content');
        },
        back: function back() {
          Activity$1.backward();
        }
      });
      var timer;
      var broadcast = html$3.find('.open--broadcast').hide();
      broadcast.on('hover:enter', function () {
        Broadcast.open({
          type: 'card',
          object: Activity$1.extractObject(activi)
        });
      });
      Lampa.Listener.follow('activity', function (e) {
        if (e.type == 'start') activi = e.object;
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (activi) {
            if (activi.component !== 'full') {
              broadcast.hide();
              activi = false;
            }
          }
        }, 1000);

        if (e.type == 'start' && e.component == 'full') {
          broadcast.show();
          activi = e.object;
        }
      });
    }

    function title(title) {
      html$3.find('.head__title').text(title ? title : '');
    }

    function render$1() {
      return html$3;
    }

    var Head = {
      render: render$1,
      title: title,
      init: init$6
    };

    var callback_cancel, controller_enabled, loader, timer;

    function start$2(on_cancel) {
      callback_cancel = on_cancel;
      controller_enabled = Controller.enabled().name;
      loader = $("<div class=\"loading-layer\">\n        <div class=\"loading-layer__box\">\n            <div class=\"loading-layer__text\">".concat(Lang.translate('loading'), "</div>\n            <div class=\"loading-layer__ico\"></div>\n        </div>\n    </div>"));
      loader.on('click', cancel);
      clearTimeout(timer);
      timer = setTimeout(function () {
        $('body').append(loader);
      }, 500);
      toggle$2();
    }

    function toggle$2() {
      Controller.add('loading', {
        invisible: true,
        toggle: function toggle() {},
        back: cancel,
        up: cancel,
        down: cancel,
        left: cancel,
        right: cancel
      });
      Controller.toggle('loading');
    }

    function cancel() {
      if (callback_cancel) callback_cancel();
    }

    function stop() {
      if (loader) loader.remove();
      clearTimeout(timer);
      if (controller_enabled) Controller.toggle(controller_enabled);
    }

    var Loading = {
      start: start$2,
      stop: stop
    };

    var body$1;
    var network$5 = new create$p();
    var api = Utils.protocol() + 'cubnotrip.top/api/';
    var listener$5 = start$4();
    var notice_load = {
      time: 0,
      data: []
    };
    var bookmarks = [];
    /**
     * Запуск
     */

    function init$5() {
      Settings.listener.follow('open', function (e) {
        body$1 = null;

        if (e.name == 'account') {
          body$1 = e.body;
          renderPanel();
          check$1();
        }
      });
      Storage.listener.follow('change', function (e) {
        if (e.name == 'account_email' || e.name == 'account_password') {
          signin();
          if (e.name == 'account_password') Storage.set('account_password', '', true);
        }

        if (e.name == 'account') updateProfileIcon();
      });
      Favorite.listener.follow('add,added', function (e) {
        save$2('add', e.where, e.card);
      });
      Favorite.listener.follow('remove', function (e) {
        if (e.method == 'id') save$2('remove', e.where, e.card);
      });
      Head.render().find('.head__body .open--profile').on('hover:enter', function () {
        showProfiles('head');
      });
      updateBookmarks(Storage.get('account_bookmarks', '[]'));
      update$1();
      timelines();
      storage();
      getUser();
      updateProfileIcon();
    }

    function updateProfileIcon() {
      var account = Storage.get('account', '{}');
      var button = Head.render().find('.head__body .open--profile').toggleClass('hide', !Boolean(account.token));

      if (account.token) {
        var img = button.find('img')[0];

        img.onerror = function () {
          img.src = './img/img_load.svg';
        };

        img.src = 'https://cubnotrip.top/img/profiles/' + (account.profile.icon || 'f_1') + '.png';
      }
    }

    function getUser() {
      var account = Storage.get('account', '{}');

      if (account.token && Storage.field('account_use')) {
        network$5.silent(api + 'users/get', function (result) {
          Storage.set('account_user', JSON.stringify(result.user));
        }, false, false, {
          headers: {
            token: account.token
          }
        });
      }
    }

    function hasPremium() {
      var user = Storage.get('account_user', '{}');
      return user.id ? Utils.countDays(Date.now(), user.premium) : 0;
    }

    function timelines() {
      var account = Storage.get('account', '{}');

      if (account.token && Storage.field('account_use')) {
        network$5.silent(api + 'timeline/all', function (result) {
          var viewed = Storage.cache('file_view', 10000, {});

          for (var i in result.timelines) {
            var time = result.timelines[i];
            viewed[i] = time;
            Arrays.extend(viewed[i], {
              duration: 0,
              time: 0,
              percent: 0
            });
            delete viewed[i].hash;
          }

          Storage.set('file_view', viewed);
        }, false, false, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      }
    }

    function storage() {
      for (var key in Workers) {
        var worker = new Workers[key](key);
        worker.init();
      }
    }

    function save$2(method, type, card) {
      var account = Storage.get('account', '{}');

      if (account.token && Storage.field('account_use')) {
        var list = Storage.get('account_bookmarks', '[]');
        var find = list.find(function (elem) {
          return elem.card_id == card.id && elem.type == type;
        });
        network$5.clear();
        network$5.silent(api + 'bookmarks/' + method, update$1, false, {
          type: type,
          data: JSON.stringify(card),
          card_id: card.id,
          id: find ? find.id : 0
        }, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });

        if (method == 'remove') {
          if (find) Arrays.remove(list, find);
        } else {
          list.push({
            id: 0,
            card_id: card.id,
            type: type,
            data: JSON.stringify(card),
            profile: account.profile.id
          });
        }

        Socket.send('bookmarks', {});
        updateBookmarks(list);
      }
    }

    function clear$6(where) {
      var account = Storage.get('account', '{}');

      if (account.token) {
        network$5.silent(api + 'bookmarks/clear', function (result) {
          if (result.secuses) update$1();
        }, false, {
          type: 'group',
          group: where
        }, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      }
    }

    function update$1(call) {
      var account = Storage.get('account', '{}');

      if (account.token) {
        network$5.silent(api + 'bookmarks/all?full=1', function (result) {
          if (result.secuses) {
            updateBookmarks(result.bookmarks);
            if (call && typeof call == 'function') call();
          }
        }, function () {
          if (call && typeof call == 'function') call();
        }, false, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      } else {
        updateBookmarks([]);
      }
    }

    function plugins(call) {
      var account = Storage.get('account', '{}');

      if (account.token) {
        network$5.timeout(3000);
        network$5.silent(api + 'plugins/all', function (result) {
          if (result.secuses) {
            Storage.set('account_plugins', result.plugins);
            call(result.plugins);
          } else {
            call(Storage.get('account_plugins', '[]'));
          }
        }, function () {
          call(Storage.get('account_plugins', '[]'));
        }, false, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      } else {
        call([]);
      }
    }

    function extensions(call) {
      var account = Storage.get('account', '{}');
      var headers = {};

      if (account.token) {
        headers = {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        };
      }

      network$5.timeout(5000);
      network$5.silent(api + 'extensions/list', function (result) {
        if (result.secuses) {
          Storage.set('account_extensions', result);
          call(result);
        } else {
          call(Storage.get('account_extensions', '{}'));
        }
      }, function () {
        call(Storage.get('account_extensions', '{}'));
      }, false, headers);
    }

    function pluginsStatus(plugin, status) {
      var account = Storage.get('account', '{}');

      if (account.token) {
        network$5.silent(api + 'plugins/status', false, false, {
          id: plugin.id,
          status: status
        }, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      }
    }
    /**
     * Статус
     */


    function renderStatus(name) {
      var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      if (body$1) {
        body$1.find('.settings--account-status .settings-param__value').text(name);
        body$1.find('.settings--account-status .settings-param__descr').text(value);
      }
    }

    function renderPanel() {
      if (body$1) {
        var account = Storage.get('account', '{}');
        var signed = account.token ? true : false;
        body$1.find('.settings--account-signin').toggleClass('hide', signed);
        body$1.find('.settings--account-user').toggleClass('hide', !signed);
        body$1.find('.settings--account-premium').toggleClass('selectbox-item--checked', Boolean(hasPremium()));
        body$1.find('.settings-param__label').toggleClass('hide', !Boolean(hasPremium()));

        if (!hasPremium()) {
          body$1.find('.selectbox-item').on('hover:enter', showCubPremium);
        }

        body$1.find('.settings--account-device-add').on('hover:enter', addDevice);

        if (account.token) {
          body$1.find('.settings--account-user-info .settings-param__value').text(account.email);
          body$1.find('.settings--account-user-profile .settings-param__value').text(account.profile.name);
          body$1.find('.settings--account-user-out').on('hover:enter', function () {
            Storage.set('account', {});
            Settings.update();
            update$1();
          });
          body$1.find('.settings--account-user-sync').on('hover:enter', function () {
            account = Storage.get('account', '{}');
            Select.show({
              title: Lang.translate('settings_cub_sync'),
              items: [{
                title: Lang.translate('confirm'),
                subtitle: Lang.translate('account_sync_to_profile') + ' (' + account.profile.name + ')',
                confirm: true
              }, {
                title: Lang.translate('cancel')
              }],
              onSelect: function onSelect(a) {
                if (a.confirm) {
                  var file = new File([localStorage.getItem('favorite') || '{}'], "bookmarks.json", {
                    type: "text/plain"
                  });
                  var formData = new FormData($('<form></form>')[0]);
                  formData.append("file", file, "bookmarks.json");
                  var loader = $('<div class="broadcast__scan" style="margin: 1em 0 0 0"><div></div></div>');
                  body$1.find('.settings--account-user-sync').append(loader);
                  $.ajax({
                    url: api + 'bookmarks/sync',
                    type: 'POST',
                    data: formData,
                    async: true,
                    cache: false,
                    contentType: false,
                    enctype: 'multipart/form-data',
                    processData: false,
                    headers: {
                      token: account.token,
                      profile: account.profile.id
                    },
                    success: function success(j) {
                      if (j.secuses) {
                        Noty.show(Lang.translate('account_sync_secuses'));
                        update$1();
                        loader.remove();
                      }
                    },
                    error: function error() {
                      Noty.show(Lang.translate('account_export_fail'));
                      loader.remove();
                    }
                  });
                }

                Controller.toggle('settings_component');
              },
              onBack: function onBack() {
                Controller.toggle('settings_component');
              }
            });
          });
          body$1.find('.settings--account-user-backup').on('hover:enter', backup);
          profile();
        } else check$1();
      }
    }

    function addDevice() {
      var displayModal = function displayModal() {
        var html = Template$1.get('account_add_device');
        html.find('.simple-button').on('hover:enter', function () {
          Modal.close();
          Input.edit({
            free: true,
            title: Lang.translate('account_code_enter'),
            nosave: true,
            value: ''
          }, function (new_value) {
            var code = parseInt(new_value);

            if (new_value && new_value.length == 6 && !isNaN(code)) {
              Loading.start(function () {
                network$5.clear();
                Loading.stop();
              });
              network$5.clear();
              network$5.silent(api + 'device/add', function (result) {
                Loading.stop();
                Storage.set('account', result, true);
                Storage.set('account_email', result.email, true);
                window.location.reload();
              }, function () {
                Loading.stop();
                Noty.show(Lang.translate('account_code_error'));
              }, {
                code: code
              });
            } else {
              displayModal();
              Noty.show(Lang.translate('account_code_wrong'));
            }
          });
        });
        Modal.open({
          title: '',
          html: html,
          size: 'small',
          onBack: function onBack() {
            Modal.close();
            Controller.toggle('settings_component');
          }
        });
      };

      displayModal();
    }

    function profile() {
      var account = Storage.get('account', '{}');
      body$1.find('.settings--account-user-profile .settings-param__value').text(account.profile.name);
      body$1.find('.settings--account-user-profile').on('hover:enter', function () {
        showProfiles('settings_component');
      });
    }

    function showProfiles(controller) {
      var account = Storage.get('account', '{}');
      Loading.start(function () {
        network$5.clear();
        Loading.stop();
      });
      network$5.clear();
      network$5.silent(api + 'profiles/all', function (result) {
        Loading.stop();

        if (result.secuses) {
          var items = Arrays.clone(result.profiles);
          Select.show({
            title: Lang.translate('account_profiles'),
            items: items.map(function (elem, index) {
              elem.title = elem.name;
              elem.template = 'selectbox_icon';
              elem.icon = '<img src="https://cubnotrip.top/img/profiles/' + elem.icon + '.png" />';
              elem.index = index;
              elem.selected = account.profile.id == elem.id;
              return elem;
            }),
            onSelect: function onSelect(a) {
              account.profile = result.profiles[a.index];
              Storage.set('account', account);
              if (body$1) body$1.find('.settings--account-user-profile .settings-param__value').text(a.name);
              notice_load.time = 0;
              Controller.toggle(controller);
              update$1();
            },
            onBack: function onBack() {
              Controller.toggle(controller);
            }
          });
        } else {
          Noty.show(result.text);
        }
      }, function () {
        Loading.stop();
        Noty.show(Lang.translate('account_profiles_empty'));
      }, false, {
        headers: {
          token: account.token
        }
      });
    }

    function check$1() {
      var account = Storage.get('account', '{}');

      if (account.token) {
        renderStatus(Lang.translate('account_authorized'), Lang.translate('account_logged_in') + ' ' + account.email);
      } else {
        renderStatus(Lang.translate('account_login_failed'), Lang.translate('account_login_wait'));
      }
    }

    function working() {
      return Storage.get('account', '{}').token && Storage.field('account_use');
    }

    function canSync() {
      return working() ? Storage.get('account', '{}') : false;
    }

    function get$6(params) {
      return bookmarks.filter(function (elem) {
        return elem.type == params.type;
      }).map(function (elem) {
        return elem.data;
      });
    }

    function all$1() {
      return bookmarks.map(function (elem) {
        return elem.data;
      });
    }

    function updateBookmarks(rows) {
      Storage.set('account_bookmarks', rows);
      bookmarks = rows.reverse().map(function (elem) {
        elem.data = JSON.parse(elem.data);
        return elem;
      });
      listener$5.send('update_bookmarks', {
        rows: rows,
        bookmarks: bookmarks
      });
    }
    /**
     * Проверка авторизации
     */


    function signin() {
      var email = (Storage.value('account_email', '') + '').trim();
      var password = (Storage.value('account_password', '') + '').trim();

      if (email && password) {
        network$5.clear();
        network$5.silent(api + 'users/signin', function (result) {
          if (result.secuses) {
            Storage.set('account', {
              email: email,
              token: result.user.token,
              id: result.user.id,
              profile: {
                name: Lang.translate('account_profile_main'),
                id: 0
              }
            });
            Settings.update();
            update$1();
            getUser();
          } else {
            renderStatus(Lang.translate('title_error'), result.text);
          }
        }, function () {
          renderStatus(Lang.translate('title_error'), Lang.translate('network_noconnect'));
        }, {
          email: email,
          password: password
        });
      }
    }

    function notice(call) {
      var account = Storage.get('account', '{}');

      if (account.token) {
        if (notice_load.time + 1000 * 60 * 10 < Date.now()) {
          network$5.timeout(1000);
          network$5.silent(api + 'notice/all', function (result) {
            if (result.secuses) {
              notice_load.time = Date.now();
              notice_load.data = result.notice;
              Storage.set('account_notice', result.notice);
              call(result.notice);
            } else call([]);
          }, function () {
            call([]);
          }, false, {
            headers: {
              token: account.token,
              profile: account.profile.id
            }
          });
        } else call(notice_load.data);
      } else call([]);
    }

    function torrentViewed(data) {
      network$5.timeout(5000);
      network$5.silent(api + 'torrent/viewing', false, false, data);
    }

    function torrentPopular(data, secuses, error) {
      network$5.timeout(5000);
      network$5.silent(api + 'torrent/popular', secuses, error, data);
    }

    function backup() {
      var account = Storage.get('account', '{}');

      if (account.token) {
        Select.show({
          title: Lang.translate('settings_cub_backup'),
          items: [{
            title: Lang.translate('settings_cub_backup_export'),
            "export": true,
            selected: true
          }, {
            title: Lang.translate('settings_cub_backup_import'),
            "import": true
          }, {
            title: Lang.translate('cancel')
          }],
          onSelect: function onSelect(a) {
            if (a["export"]) {
              Select.show({
                title: Lang.translate('sure'),
                items: [{
                  title: Lang.translate('confirm'),
                  "export": true,
                  selected: true
                }, {
                  title: Lang.translate('cancel')
                }],
                onSelect: function onSelect(a) {
                  if (a["export"]) {
                    var file = new File([JSON.stringify(localStorage)], "backup.json", {
                      type: "text/plain"
                    });
                    var formData = new FormData($('<form></form>')[0]);
                    formData.append("file", file, "backup.json");
                    var loader = $('<div class="broadcast__scan" style="margin: 1em 0 0 0"><div></div></div>');
                    body$1.find('.settings--account-user-backup').append(loader);
                    $.ajax({
                      url: api + 'users/backup/export',
                      type: 'POST',
                      data: formData,
                      async: true,
                      cache: false,
                      contentType: false,
                      enctype: 'multipart/form-data',
                      processData: false,
                      headers: {
                        token: account.token
                      },
                      success: function success(j) {
                        if (j.secuses) {
                          if (j.limited) showLimitedAccount();else Noty.show(Lang.translate('account_export_secuses'));
                        } else Noty.show(Lang.translate('account_export_fail'));

                        loader.remove();
                      },
                      error: function error() {
                        Noty.show(Lang.translate('account_export_fail'));
                        loader.remove();
                      }
                    });
                  }

                  Controller.toggle('settings_component');
                },
                onBack: function onBack() {
                  Controller.toggle('settings_component');
                }
              });
            } else if (a["import"]) {
              network$5.silent(api + 'users/backup/import', function (data) {
                if (data.data) {
                  var keys = Arrays.getKeys(data.data);

                  for (var i in data.data) {
                    localStorage.setItem(i, data.data[i]);
                  }

                  Noty.show(Lang.translate('account_import_secuses') + ' - ' + Lang.translate('account_imported') + ' (' + keys.length + ') - ' + Lang.translate('account_reload_after'));
                  setTimeout(function () {
                    window.location.reload();
                  }, 5000);
                } else Noty.show(Lang.translate('nodata'));
              }, function () {
                Noty.show(Lang.translate('account_import_fail'));
              }, false, {
                headers: {
                  token: account.token
                }
              });
              Controller.toggle('settings_component');
            } else {
              Controller.toggle('settings_component');
            }
          },
          onBack: function onBack() {
            Controller.toggle('settings_component');
          }
        });
      }
    }

    function subscribes(params, secuses, error) {
      var account = canSync();

      if (account) {
        network$5.silent(api + 'notifications/all', function (result) {
          secuses({
            results: result.notifications.map(function (r) {
              return Arrays.decodeJson(r.card, {});
            })
          });
        }, error, false, {
          headers: {
            token: account.token,
            profile: account.profile.id
          }
        });
      } else error();
    }

    function showModal(template_name) {
      var enabled = Controller.enabled().name;
      Modal.open({
        title: '',
        html: Template$1.get(template_name),
        onBack: function onBack() {
          Modal.close();
          Controller.toggle(enabled);
        }
      });
    }

    function showNoAccount() {
      showModal('account');
    }

    function showLimitedAccount() {
      showModal('account_limited');
    }

    function showCubPremium() {
      var enabled = Controller.enabled().name;
      Modal.open({
        title: '',
        html: Template$1.get('cub_premium'),
        onBack: function onBack() {
          Modal.close();
          Controller.toggle(enabled);
        }
      });
      Modal.render().addClass('modal--cub-premium').find('.modal__content').before('<div class="modal__icon"><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32"><path d="m2.837 20.977q-.912-5.931-1.825-11.862a.99.99 0 0 1 1.572-.942l5.686 4.264a1.358 1.358 0 0 0 1.945-.333l4.734-7.104a1.263 1.263 0 0 1 2.1 0l4.734 7.1a1.358 1.358 0 0 0 1.945.333l5.686-4.264a.99.99 0 0 1 1.572.942q-.913 5.931-1.825 11.862z" fill="#D8C39A"></svg></div>');
    }

    function subscribeToTranslation() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var call = arguments.length > 1 ? arguments[1] : undefined;
      var error = arguments.length > 2 ? arguments[2] : undefined;
      var account = canSync();

      if (account && params.voice) {
        network$5.timeout(5000);
        network$5.silent(api + 'notifications/add', function (result) {
          if (result.limited) showLimitedAccount();else if (call) call();
        }, function () {
          if (error) error();
        }, {
          voice: params.voice,
          data: JSON.stringify(params.card),
          episode: params.episode,
          season: params.season
        }, {
          headers: {
            token: account.token
          }
        });
      } else if (error) error();
    }

    var Account = {
      listener: listener$5,
      init: init$5,
      working: working,
      canSync: canSync,
      get: get$6,
      all: all$1,
      plugins: plugins,
      notice: notice,
      pluginsStatus: pluginsStatus,
      showProfiles: showProfiles,
      torrentViewed: torrentViewed,
      torrentPopular: torrentPopular,
      clear: clear$6,
      update: update$1,
      network: network$5,
      backup: backup,
      extensions: extensions,
      subscribeToTranslation: subscribeToTranslation,
      subscribes: subscribes,
      showNoAccount: showNoAccount,
      showCubPremium: showCubPremium,
      showLimitedAccount: showLimitedAccount,
      hasPremium: hasPremium
    };

    var data = {};
    var listener$4 = start$4();

    function save$1() {
      Storage.set('favorite', data);
    }
    /**
     * Добавить
     * @param {String} where
     * @param {Object} card
     */


    function add$5(where, card, limit) {
      read();

      if (data[where].indexOf(card.id) < 0) {
        Arrays.insert(data[where], 0, card.id);
        listener$4.send('add', {
          where: where,
          card: card
        });
        if (!search$1(card.id)) data.card.push(card);

        if (limit) {
          var excess = data[where].slice(limit);

          for (var i = excess.length - 1; i >= 0; i--) {
            remove(where, {
              id: excess[i]
            });
          }
        }

        save$1();
      } else {
        Arrays.remove(data[where], card.id);
        Arrays.insert(data[where], 0, card.id);
        save$1();
        listener$4.send('added', {
          where: where,
          card: card
        });
      }
    }
    /**
     * Удалить
     * @param {String} where
     * @param {Object} card
     */


    function remove(where, card) {
      read();
      Arrays.remove(data[where], card.id);
      listener$4.send('remove', {
        where: where,
        card: card,
        method: 'id'
      });

      for (var i = data.card.length - 1; i >= 0; i--) {
        var element = data.card[i];

        if (!check(element).any) {
          Arrays.remove(data.card, element);
          listener$4.send('remove', {
            where: where,
            card: element,
            method: 'card'
          });
        }
      }

      save$1();
    }
    /**
     * Найти
     * @param {Int} id
     * @returns Object
     */


    function search$1(id) {
      var found;

      for (var index = 0; index < data.card.length; index++) {
        var element = data.card[index];

        if (element.id == id) {
          found = element;
          break;
        }
      }

      return found;
    }
    /**
     * Переключить
     * @param {String} where
     * @param {Object} card
     */


    function toggle$1(where, card) {
      read();
      var find = cloud(card);
      if (find[where]) remove(where, card);else add$5(where, card);
      return find[where] ? false : true;
    }
    /**
     * Проверить
     * @param {Object} card
     * @returns Object
     */


    function check(card) {
      var result = {
        like: data.like.indexOf(card.id) > -1,
        wath: data.wath.indexOf(card.id) > -1,
        book: data.book.indexOf(card.id) > -1,
        history: data.history.indexOf(card.id) > -1,
        any: true
      };
      if (!result.like && !result.wath && !result.book && !result.history) result.any = false;
      return result;
    }

    function cloud(card) {
      if (Account.working()) {
        var list = {
          like: Account.get({
            type: 'like'
          }),
          wath: Account.get({
            type: 'wath'
          }),
          book: Account.get({
            type: 'book'
          }),
          history: Account.get({
            type: 'history'
          })
        };
        var result = {
          like: list.like.find(function (elem) {
            return elem.id == card.id;
          }) ? true : false,
          wath: list.wath.find(function (elem) {
            return elem.id == card.id;
          }) ? true : false,
          book: list.book.find(function (elem) {
            return elem.id == card.id;
          }) ? true : false,
          history: list.history.find(function (elem) {
            return elem.id == card.id;
          }) ? true : false,
          any: true
        };
        if (!result.like && !result.wath && !result.book && !result.history) result.any = false;
        return result;
      } else return check(card);
    }
    /**
     * Получить списаок по типу
     * @param {String} params.type - тип
     * @returns Object
     */


    function get$5(params) {
      if (Account.working()) {
        return Account.get(params);
      } else {
        read();
        var result = [];
        var ids = data[params.type];
        ids.forEach(function (id) {
          for (var i = 0; i < data.card.length; i++) {
            var card = data.card[i];
            if (card.id == id) result.push(card);
          }
        });
        return result;
      }
    }
    /**
     * Очистить
     * @param {String} where
     * @param {Object} card
     */


    function clear$5(where, card) {
      read();

      if (Account.working()) {
        Account.clear(where);
      } else {
        if (card) remove(where, card);else {
          for (var i = data[where].length - 1; i >= 0; i--) {
            var _card = search$1(data[where][i]);

            if (_card) remove(where, _card);
          }
        }
      }
    }
    /**
     * Считать последние данные
     */


    function read() {
      data = Storage.get('favorite', '{}');
      Arrays.extend(data, {
        like: [],
        wath: [],
        book: [],
        card: [],
        history: []
      });
    }
    /**
     * Получить весь список что есть
     */


    function full$4() {
      Arrays.extend(data, {
        like: [],
        wath: [],
        book: [],
        card: [],
        history: []
      });
      return data;
    }

    function continues(type) {
      return Arrays.clone(get$5({
        type: 'history'
      }).filter(function (e) {
        return type == 'tv' ? e.number_of_seasons || e.first_air_date : !(e.number_of_seasons || e.first_air_date);
      }).slice(0, 19)).map(function (e) {
        e.check_new_episode = true;
        return e;
      });
    }
    /**
     * Запуск
     */


    function init$4() {
      read();
    }

    var Favorite = {
      listener: listener$4,
      check: cloud,
      add: add$5,
      remove: remove,
      toggle: toggle$1,
      get: get$5,
      init: init$4,
      clear: clear$5,
      continues: continues,
      full: full$4
    };

    var prox$1 = 'http://proxy.cubnotrip.top/img/';
    var baseurl$2 = 'https://ctx.playfamily.ru/screenapi/v1/noauth/';
    var network$4 = new create$p();
    var menu_list$1 = [];

    function img$1(element) {
      var need = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'PORTRAIT';
      var size = arguments.length > 2 ? arguments[2] : undefined;

      if (element.basicCovers && element.basicCovers.items.length) {
        for (var index = 0; index < element.basicCovers.items.length; index++) {
          var _img = element.basicCovers.items[index];
          if (_img.imageType == need) return prox$1 + _img.url + '?width=' + (size ? size : need == 'COVER' ? 800 : 300) + '&scale=1&quality=80&mediaType=jpeg';
        }

        return prox$1 + element.basicCovers.items[0].url + '?width=500&scale=1&quality=80&mediaType=jpeg';
      }

      return '';
    }

    function tocard$1(element) {
      return {
        url: element.alias,
        id: element.id,
        title: element.name,
        original_title: element.originalName,
        release_date: '0000',
        vote_average: element.kinopoiskRating || element.okkoRating || 0,
        poster: img$1(element),
        cover: img$1(element, 'COVER'),
        promo: element.promoText,
        description: element.description
      };
    }

    function collections$2(params, oncomplite, onerror) {
      var frm = 20 * (params.page - 1);
      var uri = baseurl$2 + 'collection/web/1?elementAlias=' + (params.url || 'collections_web') + '&elementType=COLLECTION&limit=20&offset=' + frm + '&withInnerCollections=true&includeProductsForUpsale=false&filter=%7B%22sortType%22%3A%22RANK%22%2C%22sortOrder%22%3A%22ASC%22%2C%22useSvodFilter%22%3Afalse%2C%22genres%22%3A%5B%5D%2C%22yearsRange%22%3Anull%2C%22rating%22%3Anull%7D';
      network$4["native"](uri, function (json) {
        var result = {
          results: [],
          total_pages: 0,
          page: params.page
        };

        if (json.element) {
          json.element.collectionItems.items.forEach(function (elem) {
            var element = elem.element;
            var item = {
              url: element.alias,
              id: element.id,
              title: element.name,
              poster: prox$1 + (element.basicCovers && element.basicCovers.items.length ? element.basicCovers.items[0].url + '?width=300&scale=1&quality=80&mediaType=jpeg' : 'https://www.ivi.ru/images/stubs/collection_preview_stub.jpeg')
            };
            if (params.url) item = tocard$1(element);
            result.results.push(item);
          });
          result.total_pages = Math.round(json.element.collectionItems.totalSize / 20);
        }

        oncomplite(result);
      }, onerror);
    }

    function persons$1(element) {
      var data = [];

      if (element.actors) {
        element.actors.items.forEach(function (elem) {
          var item = elem.element;
          data.push({
            url: item.alias,
            name: item.name,
            character: item.originalName
          });
        });
      }

      return data.length ? {
        cast: data
      } : false;
    }

    function genres$2(element) {
      return element.genres.items.map(function (elem) {
        elem.element.url = elem.element.alias;
        return elem.element;
      });
    }

    function countries$1(element) {
      return element.countries.items.map(function (elem) {
        return elem.element;
      });
    }

    function date(element) {
      var d = new Date(element.worldReleaseDate || element || 0);
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }

    function seasonsCount$1(element) {
      var data = {
        seasons: 0,
        episodes: 0
      };

      if (element.children) {
        data.seasons = element.children.totalSize;
        element.children.items.forEach(function (elem) {
          data.episodes += elem.element.children ? elem.element.children.totalSize : 0;
        });
      }

      return data;
    }

    function seasonsDetails(element) {
      var data = {};

      if (element.children) {
        element.children.items.forEach(function (elem, sn) {
          var episodes = [];

          if (elem.element.children) {
            elem.element.children.items.forEach(function (episode, en) {
              episodes.push({
                name: episode.element.name,
                img: img$1(episode.element, 'COVER'),
                air_date: date(episode.element.releaseSaleDate || 0),
                episode_number: en + 1
              });
            });
          }

          data['' + (sn + 1)] = {
            name: elem.element.name,
            air_date: date(elem.element.worldReleaseDate || 0),
            episodes: episodes
          };
        });
        return data;
      }
    }

    function similar$1(element) {
      var data = [];
      element.similar.items.forEach(function (elem) {
        data.push(tocard$1(elem.element));
      });
      return data.length ? {
        results: data
      } : false;
    }

    function seasons$3(tv, from, oncomplite, onerror) {
      oncomplite(tv.seasons || {});
    }

    function menu$3(params, oncomplite) {
      if (!menu_list$1.length) {
        network$4.timeout(1000);
        network$4["native"](baseurl$2 + 'collection/web/1?elementAlias=action&elementType=GENRE&limit=20&offset=0&withInnerCollections=false&includeProductsForUpsale=false&filter=null', function (json) {
          if (json.uiScreenInfo && json.uiScreenInfo.webMain) {
            json.uiScreenInfo.webMain.forEach(function (element) {
              menu_list$1.push({
                title: element.name,
                id: element.alias
              });
            });
            oncomplite(menu_list$1);
          }
        });
      } else {
        oncomplite(menu_list$1);
      }
    }

    function videos$1(element) {
      var data = [];
      var qa = 0;
      element.trailers.items.forEach(function (item) {
        var media = item.media;

        if (media.width > qa && media.mimeType == 'mp4/ts') {
          qa = media.width;
          data.push({
            name: data.length + 1 + ' / ' + item.language,
            url: item.url,
            player: true
          });
        }
      });
      return data.length ? {
        results: data
      } : false;
    }

    function list$4(params, oncomplite, onerror) {
      var frm = 20 * (params.page - 1);
      network$4["native"](baseurl$2 + 'collection/web/1?elementAlias=' + (params.url || params.id) + '&elementType=' + (params.type || 'GENRE') + '&limit=20&offset=' + frm + '&withInnerCollections=false&includeProductsForUpsale=false&filter=null', function (json) {
        var items = [];

        if (json.element && json.element.collectionItems) {
          json.element.collectionItems.items.forEach(function (elem) {
            items.push(tocard$1(elem.element));
          });
          oncomplite({
            results: items,
            total_pages: Math.round(json.element.collectionItems.totalSize / 20)
          });
        } else {
          onerror();
        }
      }, onerror);
    }

    function person$3(params, oncomplite, onerror) {
      network$4["native"](baseurl$2 + 'collection/web/1?elementAlias=' + params.url + '&elementType=PERSON&limit=60&offset=0&withInnerCollections=false&includeProductsForUpsale=false&filter=null', function (json) {
        var data = {
          movie: {
            results: []
          }
        };

        if (json.element && json.element.collectionItems) {
          json.element.collectionItems.items.forEach(function (elem) {
            data.movie.results.push(tocard$1(elem.element));
          });
          data.person = {
            name: json.element.name,
            biography: '',
            img: '',
            place_of_birth: '',
            birthday: '----'
          };
          oncomplite(data);
        } else {
          onerror();
        }
      }, onerror);
    }

    function main$3(params, oncomplite, onerror) {
      network$4["native"](baseurl$2 + 'mainpage/web/1', function (json) {
        var element = json.element;
        var fulldata = [];

        if (element) {
          var blocks = json.element.collectionItems.items;

          if (blocks) {
            blocks.forEach(function (el) {
              if (el.element && el.element.alias === "web_featured") {
                var slides = {
                  title: Lang.translate('title_new'),
                  results: [],
                  wide: true,
                  nomore: true
                };
                el.element.collectionItems.items.forEach(function (elem) {
                  slides.results.push(tocard$1(elem.element));
                });
                fulldata.push(slides);
              } else if (el.element && el.element.alias && el.element.name && el.element.description) {
                var line = {
                  title: el.element.name,
                  url: el.element.alias,
                  results: [],
                  more: true
                };

                if (el.element.collectionItems) {
                  el.element.collectionItems.items.forEach(function (elem) {
                    line.results.push(tocard$1(elem.element));
                  });
                  fulldata.push(line);
                }
              }
            });
          }
        }

        if (fulldata.length) oncomplite(fulldata);else onerror();
      }, onerror);
    }

    function category$3(params, oncomplite, onerror) {
      var status$1 = new status(7);
      var books = Favorite.continues(params.url);

      status$1.onComplite = function () {
        var fulldata = [];
        if (books.length) fulldata.push({
          results: books,
          title: params.url == 'tv' ? Lang.translate('title_continue') : Lang.translate('title_watched')
        });
        if (status$1.data["new"] && status$1.data["new"].results.length) fulldata.push(status$1.data["new"]);
        if (status$1.data.top && status$1.data.top.results.length) fulldata.push(status$1.data.top);
        if (status$1.data.three && status$1.data.three.results.length) fulldata.push(status$1.data.three);
        if (status$1.data.four && status$1.data.four.results.length) fulldata.push(status$1.data.four);
        if (status$1.data.five && status$1.data.five.results.length) fulldata.push(status$1.data.five);
        if (status$1.data.six && status$1.data.six.results.length) fulldata.push(status$1.data.six);
        if (status$1.data.seven && status$1.data.seven.results.length) fulldata.push(status$1.data.seven);
        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, id, json) {
        json.title = title;
        json.url = id;
        status$1.append(name, json);
      };

      if (params.url == 'movie') {
        list$4({
          url: 'Novelty',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('title_new'), 'new', 'Novelty', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'topfilms',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_top_new'), 'top', 'topfilms', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'comedy-plus-horror-movies',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_comedy_horror'), 'three', 'comedy-plus-horror-movies', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'collection_maniacs',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_collection_maniacs'), 'four', 'collection_maniacs', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'witches',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_witches'), 'five', 'witches', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'zombies',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_zombies'), 'six', 'zombies', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'Russian-17490',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_ru'), 'seven', 'Russian-17490', json);
        }, status$1.error.bind(status$1));
      } else {
        list$4({
          url: 'Serials',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('title_new'), 'new', 'Serials', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'horror-serial-all-svod',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_horror_serial'), 'top', 'horror-serial-all-svod', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'series-about-serial-killers',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_serial_killers'), 'three', 'series-about-serial-killers', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'black-humor-serial-all-svod',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_humor_serial'), 'four', 'black-humor-serial-all-svod', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'legkiye-serialy-all-svod',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_legkiye_serialy'), 'five', 'legkiye-serialy-all-svod', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'comedy-serial-all-svod',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_comedy_serial'), 'six', 'comedy-serial-all-svod', json);
        }, status$1.error.bind(status$1));
        list$4({
          url: 'russian_tvseries',
          type: 'COLLECTION',
          page: 1
        }, function (json) {
          append(Lang.translate('okko_ru_tv'), 'seven', 'russian_tvseries', json);
        }, status$1.error.bind(status$1));
      }
    }

    function full$3(params, oncomplite, onerror) {
      var data = {};
      network$4["native"](baseurl$2 + 'moviecard/web/1?elementAlias=' + params.url + '&elementType=MOVIE', function (json) {
        var element = json.element;

        if (element) {
          data.persons = persons$1(element);
          data.simular = similar$1(element);
          data.videos = videos$1(element);
          data.movie = {
            id: element.id,
            url: element.alias,
            source: 'okko',
            title: element.name,
            original_title: element.originalName,
            name: element.type == 'SERIAL' ? element.name : '',
            original_name: element.type == 'SERIAL' ? element.originalName : '',
            overview: element.description,
            img: img$1(element),
            runtime: (element.duration || 0) / 1000 / 60,
            genres: genres$2(element),
            vote_average: element.imdbRating || element.kinopoiskRating || 0,
            production_companies: [],
            production_countries: countries$1(element),
            budget: element.budget && element.budget.value ? element.budget.value : 0,
            release_date: date(element),
            number_of_seasons: seasonsCount$1(element).seasons,
            number_of_episodes: seasonsCount$1(element).episodes,
            seasons: seasonsDetails(element),
            first_air_date: element.type == 'SERIAL' ? date(element) : '',
            restrict: parseInt(element.ageAccessType || '0'),
            background_image: img$1(element, 'COVER', 1200)
          };
        }

        oncomplite(data);
      }, onerror);
    }

    var OKKO = {
      main: main$3,
      full: full$3,
      collections: collections$2,
      seasons: seasons$3,
      list: list$4,
      person: person$3,
      menu: menu$3,
      category: category$3,
      clear: network$4.clear
    };

    var prox = 'http://proxy.cubnotrip.top/img/';
    var prox_api = '';
    var baseurl$1 = prox_api + 'https://api.ivi.ru/mobileapi/';
    var network$3 = new create$p();
    var menu_list = [];

    function tocard(element) {
      return {
        url: element.hru,
        id: element.id,
        title: element.title,
        original_title: element.orig_title,
        release_date: element.release_date || element.ivi_pseudo_release_date || element.ivi_release_date || (element.year ? element.year + '' : element.years ? element.years[0] + '' : '0000'),
        vote_average: element.ivi_rating_10 || 0,
        poster: img(element),
        year: element.year,
        years: element.years,
        background_image: background(element)
      };
    }

    function entities(url, oncomplite, onerror) {
      network$3["native"](prox_api + 'https://www.ivi.ru/' + url, function (str) {
        var parse = parse = str.match(/window.__INITIAL_STATE__ = (\{.*?\});<\/script>/);
        var json = {};

        try {
          json = parse && eval('(' + parse[1] + ')');
        } catch (e) {}

        if (json.entities) {
          if (!menu_list.length) {
            for (var i in json.entities.genres) {
              var item = json.entities.genres[i];
              menu_list.push({
                title: item.title + ' (' + item.catalogue_count + ')',
                id: item.id
              });
            }
          }

          oncomplite(json.entities, json);
        } else onerror();
      }, onerror, false, {
        dataType: 'text'
      });
    }

    function find(json, id) {
      var found;

      for (var i in json.content) {
        if (i == id) found = json.content[i];
      }

      return found;
    }

    function img(element) {
      var posters = element.poster_originals || element.posters;
      return posters && posters[0] ? prox + (posters[0].path || posters[0].url) + '/300x456/' : '';
    }

    function background(element) {
      var images = (element.promo_images || []).filter(function (i) {
        return i.content_format.indexOf('BackgroundImage') == 0;
      });
      return images.length ? prox + images[0].url : '';
    }

    function genres$1(element, json) {
      var data = [];
      element.genres.forEach(function (id) {
        var genre = json.genres[id];

        if (genre) {
          data.push({
            id: genre.id,
            name: genre.title
          });
        }
      });
      return data;
    }

    function countries(element, json) {
      var data = [];

      if (element.country && json.countries[element.country]) {
        data.push({
          name: json.countries[element.country].title
        });
      }

      return data;
    }

    function persons(json) {
      var data = [];

      if (json.persons && json.persons.info) {
        for (var i in json.persons.info) {
          var _person = json.persons.info[i],
              images = Arrays.getValues(_person.images || {});

          if (_person.profession_types[0] == 6) {
            data.push({
              name: _person.name,
              character: Lang.translate('title_actor'),
              id: _person.id,
              img: images.length ? prox + images[0].path : ''
            });
          }
        }
      }

      return data.length ? {
        cast: data
      } : false;
    }

    function similar(element, json) {
      var data = [];

      if (json.content) {
        for (var i in json.content) {
          var item = json.content[i];
          if (element !== item) data.push(tocard(item));
        }

        data.sort(function (a, b) {
          var ay = a.year || (a.years ? a.years[0] : 0);
          var by = b.year || (b.years ? b.years[0] : 0);
          return by - ay;
        });
      }

      return data.length ? {
        results: data
      } : false;
    }

    function videos(element) {
      var data = [];

      if (element.additional_data) {
        element.additional_data.forEach(function (atach) {
          if (atach.data_type == 'trailer' && atach.files) {
            atach.files.forEach(function (file) {
              if (file.content_format == 'MP4-HD1080') {
                data.push({
                  name: atach.title,
                  url: file.url,
                  player: true
                });
              }
            });
          }
        });
      }

      return data.length ? {
        results: data
      } : false;
    }

    function seasonsCount(element) {
      var data = {
        seasons: 0,
        episodes: 0
      };

      if (element.seasons) {
        data.seasons = element.seasons.length;

        for (var i in element.seasons_content_total) {
          data.episodes += element.seasons_content_total[i];
        }
      }

      return data;
    }

    function seasons$2(tv, from, oncomplite, onerror) {
      var status$1 = new status(from.length);
      status$1.onComplite = oncomplite;
      from.forEach(function (season) {
        network$3["native"](baseurl$1 + 'videofromcompilation/v5/?id=' + tv.id + '&season=' + season + '&from=0&to=60&fake=1&mark_as_purchased=1&app_version=870&session=66674cdb8528557407669760_1650471651-0EALRgbYRksN8Hfc5UthGeg', function (json) {
          if (json.result) {
            var episodes = [];
            json.result.forEach(function (elem) {
              episodes.push({
                name: elem.title,
                img: elem.promo_images && elem.promo_images.length ? prox + elem.promo_images[0].url + '/300x240/' : '',
                air_date: elem.release_date || elem.ivi_pseudo_release_date || elem.ivi_release_date || (elem.year ? elem.year + '' : elem.years ? elem.years[0] + '' : '0000'),
                episode_number: elem.episode
              });
            });
            status$1.append('' + season, {
              episodes: episodes
            });
          } else status$1.error();
        }, status$1.error.bind(status$1));
      });
    }

    function comments(json) {
      var data = [];

      if (json.comments) {
        for (var i in json.comments) {
          var com = json.comments[i];
          com.text = com.text.replace(/\\[n|r|t]/g, '');
          data.push(com);
        }
      }

      return data.length ? data : false;
    }

    function menu$2(params, oncomplite) {
      if (!menu_list.length) {
        network$3.timeout(1000);
        entities('', function () {
          oncomplite(menu_list);
        });
      } else oncomplite(menu_list);
    }

    function full$2(params, oncomplite, onerror) {
      entities('watch/' + (params.url || params.id), function (json, all) {
        var data = {};
        var element = find(json, params.id);

        if (element) {
          data.persons = persons(json);
          data.simular = similar(element, json);
          data.videos = videos(element);
          data.comments = comments(json);
          data.movie = {
            id: element.id,
            url: element.hru,
            source: 'ivi',
            title: element.title,
            original_title: element.orig_title,
            name: element.seasons ? element.title : '',
            original_name: element.seasons ? element.orig_title : '',
            overview: element.description.replace(/\\[n|r|t]/g, ''),
            img: img(element),
            runtime: element.duration_minutes,
            genres: genres$1(element, json),
            vote_average: parseFloat(element.ivi_rating_10 || element.imdb_rating || element.kp_rating || '0'),
            production_companies: [],
            production_countries: countries(element, json),
            budget: element.budget || 0,
            release_date: element.release_date || element.ivi_pseudo_release_date || element.ivi_release_date || '0000',
            number_of_seasons: seasonsCount(element).seasons,
            number_of_episodes: seasonsCount(element).episodes,
            first_air_date: element.seasons ? element.release_date || element.ivi_pseudo_release_date || element.ivi_release_date || '0000' : '',
            background_image: background(element),
            restrict: element.restrict,
            imdb_rating: parseFloat(element.imdb_rating || '0.0').toFixed(1),
            kp_rating: parseFloat(element.kp_rating || '0.0').toFixed(1)
          };
        }

        oncomplite(data);
      }, onerror);
    }

    function person$2(params, oncomplite, onerror) {
      entities('person/' + (params.url || params.id), function (json, all) {
        var data = {};

        if (all.pages && all.pages.personPage) {
          var element = all.pages.personPage.person.info,
              images = Arrays.getValues(element.images || {});
          data.person = {
            name: element.name,
            biography: element.bio,
            img: images.length ? prox + images[0].path : '',
            place_of_birth: element.eng_title,
            birthday: '----'
          };
          data.movie = similar(element, json);
        }

        oncomplite(data);
      }, onerror);
    }

    function list$3(params, oncomplite, onerror) {
      var fr = 20 * (params.page - 1),
          to = fr + 19;
      var url = baseurl$1 + 'catalogue/v5/?genre=' + params.genres + '&from=' + fr + '&to=' + to + '&withpreorderable=true';
      if (!params.genres) url = baseurl$1 + 'collection/catalog/v5/?id=' + params.url + '&withpreorderable=true&fake=false&from=' + fr + '&to=' + to + '&sort=priority_in_collection&fields=id%2Civi_pseudo_release_date%2Crelease_date%2Corig_title%2Ctitle%2Cfake%2Cpreorderable%2Cavailable_in_countries%2Chru%2Cposter_originals%2Crating%2Ccontent_paid_types%2Ccompilation_hru%2Ckind%2Cadditional_data%2Crestrict%2Chd_available%2Chd_available_all%2C3d_available%2C3d_available_all%2Cuhd_available%2Cuhd_available_all%2Chdr10_available%2Chdr10_available_all%2Cdv_available%2Cdv_available_all%2Cfullhd_available%2Cfullhd_available_all%2Chdr10plus_available%2Chdr10plus_available_all%2Chas_5_1%2Cshields%2Cseasons_count%2Cseasons_content_total%2Cseasons%2Cepisodes%2Cseasons_description%2Civi_rating_10_count%2Cseasons_extra_info%2Ccount%2Cgenres%2Cyears%2Civi_rating_10%2Crating%2Ccountry%2Cduration_minutes%2Cyear&app_version=870';
      network$3["native"](url, function (json) {
        var items = [];

        if (json.result) {
          json.result.forEach(function (element) {
            items.push(tocard(element));
          });
        }

        oncomplite({
          results: items,
          total_pages: Math.round(json.count / 20)
        });
      }, onerror);
    }

    function category$2(params, oncomplite, onerror) {
      var status$1 = new status(params.url == 'movie' ? 4 : 5);
      var books = Favorite.continues(params.url);

      status$1.onComplite = function () {
        var fulldata = [];
        if (books.length) fulldata.push({
          results: books,
          title: params.url == 'tv' ? Lang.translate('title_continue') : Lang.translate('title_watched')
        });
        if (status$1.data["new"] && status$1.data["new"].results.length) fulldata.push(status$1.data["new"]);
        if (status$1.data.best && status$1.data.best.results.length) fulldata.push(status$1.data.best);
        if (status$1.data.rus && status$1.data.rus.results.length) fulldata.push(status$1.data.rus);
        if (status$1.data.popular && status$1.data.popular.results.length) fulldata.push(status$1.data.popular);
        if (status$1.data.ivi && status$1.data.ivi.results.length) fulldata.push(status$1.data.ivi);
        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, id, json) {
        json.title = title;
        json.url = id;

        if (json.results.results) {
          json.results = json.results.results;
        }

        status$1.append(name, json);
      };

      if (params.url == 'movie') {
        collections$1({
          id: '8258'
        }, function (json) {
          append(Lang.translate('ivi_premieres'), 'new', '8258', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '942'
        }, function (json) {
          append(Lang.translate('ivi_best'), 'best', '942', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '11512'
        }, function (json) {
          append(Lang.translate('ivi_popular'), 'popular', '11512', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '8448'
        }, function (json) {
          append(Lang.translate('ivi_choice'), 'ivi', '8448', {
            results: json
          });
        }, status$1.error.bind(status$1));
      } else {
        collections$1({
          id: '1984'
        }, function (json) {
          append(Lang.translate('ivi_new'), 'new', '1984', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '1712'
        }, function (json) {
          append(Lang.translate('ivi_foreign'), 'best', '1712', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '935'
        }, function (json) {
          append(Lang.translate('ivi_ru'), 'rus', '935', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '12839'
        }, function (json) {
          append(Lang.translate('ivi_popular'), 'popular', '12839', {
            results: json
          });
        }, status$1.error.bind(status$1));
        collections$1({
          id: '1057'
        }, function (json) {
          append(Lang.translate('ivi_choice'), 'ivi', '1057', {
            results: json
          });
        }, status$1.error.bind(status$1));
      }
    }

    function main$2(params, oncomplite, onerror) {
      var status$1 = new status(13);

      status$1.onComplite = function () {
        var fulldata = [];

        for (var i = 1; i <= 13; i++) {
          var n = i + '';
          if (status$1.data[n] && status$1.data[n].results.length) fulldata.push(status$1.data[n]);
        }

        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, id, json) {
        json.title = title;
        json.url = id;

        if (json.results.results) {
          json.results = json.results.results;
        }

        status$1.append(name, json);
      };

      collections$1({
        id: '4655'
      }, function (json) {
        append(Lang.translate('ivi_recomend'), '1', '4655', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '2460'
      }, function (json) {
        append(Lang.translate('ivi_for_famaly'), '2', '2460', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '917'
      }, function (json) {
        append(Lang.translate('ivi_triller'), '3', '917', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1327'
      }, function (json) {
        append(Lang.translate('ivi_advance'), '4', '1327', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1246'
      }, function (json) {
        append(Lang.translate('ivi_detective'), '5', '1246', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1335'
      }, function (json) {
        append(Lang.translate('ivi_crime_comedy'), '6', '1335', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1411'
      }, function (json) {
        append(Lang.translate('ivi_romantic'), '7', '1411', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '73'
      }, function (json) {
        append(Lang.translate('ivi_crime_dramas'), '8', '73', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1413'
      }, function (json) {
        append(Lang.translate('ivi_fantastic_dramas'), '9', '1413', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '62'
      }, function (json) {
        append(Lang.translate('ivi_military_dramas'), '10', '62', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '1418'
      }, function (json) {
        append(Lang.translate('ivi_mistic'), '11', '1418', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '4495'
      }, function (json) {
        append(Lang.translate('ivi_foreign_series'), '12', '4495', {
          results: json
        });
      }, status$1.error.bind(status$1));
      collections$1({
        id: '217'
      }, function (json) {
        append(Lang.translate('ivi_historical_series'), '13', '217', {
          results: json
        });
      }, status$1.error.bind(status$1));
    }

    function collections$1(params, oncomplite, onerror) {
      var fr = 20 * (params.page - 1),
          to = fr + 19;
      var uri = baseurl$1 + 'collections/v5/?app_version=870&from=' + fr + '&tags_exclude=goodmovies&to=' + to;
      if (params.id) uri = baseurl$1 + 'collection/catalog/v5/?id=' + params.id + '&withpreorderable=true&fake=false&from=' + fr + '&to=' + to + '&sort=priority_in_collection&fields=id%2Civi_pseudo_release_date%2Crelease_date%2Corig_title%2Ctitle%2Cfake%2Cpreorderable%2Cavailable_in_countries%2Chru%2Cposter_originals%2Crating%2Ccontent_paid_types%2Ccompilation_hru%2Ckind%2Cadditional_data%2Crestrict%2Chd_available%2Chd_available_all%2C3d_available%2C3d_available_all%2Cuhd_available%2Cuhd_available_all%2Chdr10_available%2Chdr10_available_all%2Cdv_available%2Cdv_available_all%2Cfullhd_available%2Cfullhd_available_all%2Chdr10plus_available%2Chdr10plus_available_all%2Chas_5_1%2Cshields%2Cseasons_count%2Cseasons_content_total%2Cseasons%2Cepisodes%2Cseasons_description%2Civi_rating_10_count%2Cseasons_extra_info%2Ccount%2Cgenres%2Cyears%2Civi_rating_10%2Crating%2Ccountry%2Cduration_minutes%2Cyear&app_version=870';
      network$3.timeout(15000);
      network$3["native"](uri, function (json) {
        var result = {
          results: [],
          total_pages: 0,
          page: params.page
        };

        if (json.result) {
          json.result.forEach(function (element) {
            var item = {
              id: element.id,
              url: element.hru,
              title: element.title,
              poster: prox + (element.images && element.images.length ? element.images[0].path : 'https://www.ivi.ru/images/stubs/collection_preview_stub.jpeg')
            };
            if (params.id) item = tocard(element);
            result.results.push(item);
          });
          result.total_pages = Math.round(json.count / 20);
        }

        oncomplite(result);
      }, onerror);
    }

    var IVI = {
      collections: collections$1,
      full: full$2,
      main: main$2,
      person: person$2,
      list: list$3,
      category: category$2,
      menu: menu$2,
      seasons: seasons$2,
      clear: network$3.clear
    };

    var baseurl = Utils.protocol() + 'tmdb.cubnotrip.top/';
    var network$2 = new create$p();

    function url$1(u) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (params.genres) u = add$4(u, 'genre=' + params.genres);
      if (params.page) u = add$4(u, 'page=' + params.page);
      if (params.query) u = add$4(u, 'query=' + params.query);

      if (params.filter) {
        for (var i in params.filter) {
          u = add$4(u, i + '=' + params.filter[i]);
        }
      }

      return baseurl + u;
    }

    function add$4(u, params) {
      return u + (/\?/.test(u) ? '&' : '?') + params;
    }

    function get$4(method) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var oncomplite = arguments.length > 2 ? arguments[2] : undefined;
      var onerror = arguments.length > 3 ? arguments[3] : undefined;
      var u = url$1(method, params);
      network$2.silent(u, function (json) {
        json.url = method;
        oncomplite(json);
      }, onerror);
    }

    function list$2() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var u = url$1(params.url, params);
      network$2.silent(u, oncomplite, onerror);
    }

    function main$1() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var status$1 = new status(11);

      status$1.onComplite = function () {
        var fulldata = [];
        var data = status$1.data;

        for (var i = 1; i <= 11; i++) {
          var ipx = 's' + i;
          if (data[ipx] && data[ipx].results.length) fulldata.push(data[ipx]);
        }

        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, json) {
        json.title = title;
        status$1.append(name, json);
      };

      get$4('?sort=now_playing', params, function (json) {
        append(Lang.translate('title_now_watch'), 's1', json);
        VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      get$4('?sort=latest', params, function (json) {
        append(Lang.translate('title_latest'), 's2', json);
      }, status$1.error.bind(status$1));
      get$4('movie/now', params, function (json) {
        append(Lang.translate('menu_movies'), 's3', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=16', params, function (json) {
        append(Lang.translate('menu_multmovie'), 's4', json);
      }, status$1.error.bind(status$1));
      get$4('tv/now', params, function (json) {
        append(Lang.translate('menu_tv'), 's5', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=12', params, function (json) {
        append(Lang.translate('filter_genre_ad'), 's6', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=35', params, function (json) {
        append(Lang.translate('filter_genre_cm'), 's7', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=10751', params, function (json) {
        append(Lang.translate('filter_genre_fm'), 's8', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=27', params, function (json) {
        append(Lang.translate('filter_genre_ho'), 's9', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=878', params, function (json) {
        append(Lang.translate('filter_genre_fa'), 's10', json);
      }, status$1.error.bind(status$1));
      get$4('?sort=now&genre=53', params, function (json) {
        append(Lang.translate('filter_genre_tr'), 's11', json);
      }, status$1.error.bind(status$1));
    }

    function category$1() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var total = 6;
      if (params.url !== 'tv') total--;
      var show = ['movie', 'tv'].indexOf(params.url) > -1 && !params.genres;
      var quality = ['movie'].indexOf(params.url) > -1 && !params.genres;
      var books = show ? Favorite.continues(params.url) : [];
      var recomend = show ? Arrays.shuffle(Recomends.get(params.url)).slice(0, 19) : [];
      var status$1 = new status(total);

      status$1.onComplite = function () {
        var fulldata = [];
        var data = status$1.data;
        if (books.length) fulldata.push({
          results: books,
          title: params.url == 'tv' ? Lang.translate('title_continue') : Lang.translate('title_watched')
        });
        if (recomend.length) fulldata.push({
          results: recomend,
          title: Lang.translate('title_recomend_watch')
        });

        for (var i = 1; i <= total + 1; i++) {
          var ipx = 's' + i;
          if (data[ipx] && data[ipx].results.length) fulldata.push(data[ipx]);
        }

        if (fulldata.length) oncomplite(fulldata);else onerror();
      };

      var append = function append(title, name, json) {
        json.title = title;
        status$1.append(name, json);
      };

      get$4('?cat=' + params.url + '&sort=now_playing', params, function (json) {
        append(Lang.translate('title_now_watch'), 's1', json);
        if (quality) VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));

      if (params.url == 'tv') {
        get$4('?cat=' + params.url + '&sort=update', params, function (json) {
          append(Lang.translate('title_new_episodes'), 's2', json);
        }, status$1.error.bind(status$1));
      }

      get$4('?cat=' + params.url + '&sort=top', params, function (json) {
        append(Lang.translate('title_popular'), 's3', json);
        if (quality) VideoQuality.add(json.results);
      }, status$1.error.bind(status$1));
      get$4('?cat=' + params.url + '&sort=latest', params, function (json) {
        append(Lang.translate('title_latest'), 's4', json);
      }, status$1.error.bind(status$1));
      get$4('?cat=' + params.url + '&sort=now', params, function (json) {
        append(Lang.translate('title_new_this_year'), 's5', json);
      }, status$1.error.bind(status$1));
      get$4('?cat=' + params.url + '&sort=latest&vote=7', params, function (json) {
        append(Lang.translate('title_hight_voite'), 's6', json);
      }, status$1.error.bind(status$1));
    }

    function full$1(params, oncomplite, onerror) {
      var status$1 = new status(7);
      status$1.onComplite = oncomplite;
      get$4('3/' + params.method + '/' + params.id + '?api_key=' + TMDBApi.key() + '&append_to_response=content_ratings,release_dates&language=' + Storage.field('tmdb_lang'), params, function (json) {
        json.source = 'tmdb';

        if (params.method == 'tv') {
          var season = Utils.countSeasons(json);
          TMDB.get('tv/' + json.id + '/season/' + season, {}, function (ep) {
            status$1.append('episodes', ep);
          }, status$1.error.bind(status$1));
        } else status$1.need--;

        if (json.belongs_to_collection) {
          TMDB.get('collection/' + json.belongs_to_collection.id, {}, function (collection) {
            collection.results = collection.parts.slice(0, 19);
            status$1.append('collection', collection);
          }, status$1.error.bind(status$1));
        } else status$1.need--;

        status$1.append('movie', json);
      }, function () {
        status$1.need -= 2;
        status$1.error();
      });

      if (Storage.field('light_version')) {
        status$1.need -= 3;
      } else {
        TMDB.get(params.method + '/' + params.id + '/credits', params, function (json) {
          status$1.append('persons', json);
        }, status$1.error.bind(status$1));
        TMDB.get(params.method + '/' + params.id + '/recommendations', params, function (json) {
          status$1.append('recomend', json);
        }, status$1.error.bind(status$1));
        TMDB.get(params.method + '/' + params.id + '/similar', params, function (json) {
          status$1.append('simular', json);
        }, status$1.error.bind(status$1));
      }

      TMDB.get(params.method + '/' + params.id + '/videos', params, function (json) {
        status$1.append('videos', json);
      }, status$1.error.bind(status$1));
    }

    function menuCategory$1(params, oncomplite) {
      var menu = [];
      menu.push({
        title: Lang.translate('title_now_watch'),
        url: '?cat=' + params.action + '&sort=now_playing'
      });

      if (params.action == 'tv') {
        menu.push({
          title: Lang.translate('title_new_episodes'),
          url: '?cat=' + params.action + '&sort=update'
        });
      }

      menu.push({
        title: Lang.translate('title_popular'),
        url: '?cat=' + params.action + '&sort=top'
      });
      menu.push({
        title: Lang.translate('title_latest'),
        url: '?cat=' + params.action + '&sort=latest'
      });
      menu.push({
        title: Lang.translate('title_new_this_year'),
        url: '?cat=' + params.action + '&sort=now'
      });
      menu.push({
        title: Lang.translate('title_hight_voite'),
        url: '?cat=' + params.action + '&sort=latest&vote=7'
      });
      oncomplite(menu);
    }

    function person$1(params, oncomplite, onerror) {
      TMDB.person(params, oncomplite, onerror);
    }

    function menu$1(params, oncomplite) {
      TMDB.menu(params, oncomplite);
    }

    function seasons$1(tv, from, oncomplite) {
      TMDB.seasons(tv, from, oncomplite);
    }

    function clear$4() {
      network$2.clear();
    }

    var CUB = {
      main: main$1,
      menu: menu$1,
      full: full$1,
      list: list$2,
      category: category$1,
      clear: clear$4,
      person: person$1,
      seasons: seasons$1,
      menuCategory: menuCategory$1
    };

    var html$2 = $("<div class=\"helper\">\n    <div class=\"helper__body\">\n        <div class=\"helper__ico\">\n            <svg height=\"173\" viewBox=\"0 0 180 173\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n            <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M126 3C126 18.464 109.435 31 89 31C68.5655 31 52 18.464 52 3C52 2.4505 52.0209 1.90466 52.0622 1.36298C21.3146 15.6761 0 46.8489 0 83C0 132.706 40.2944 173 90 173C139.706 173 180 132.706 180 83C180 46.0344 157.714 14.2739 125.845 0.421326C125.948 1.27051 126 2.13062 126 3ZM88.5 169C125.779 169 156 141.466 156 107.5C156 84.6425 142.314 64.6974 122 54.0966C116.6 51.2787 110.733 55.1047 104.529 59.1496C99.3914 62.4998 94.0231 66 88.5 66C82.9769 66 77.6086 62.4998 72.4707 59.1496C66.2673 55.1047 60.3995 51.2787 55 54.0966C34.6864 64.6974 21 84.6425 21 107.5C21 141.466 51.2208 169 88.5 169Z\" fill=\"white\"/>\n            <path d=\"M133 121.5C133 143.315 114.196 161 91 161C67.804 161 49 143.315 49 121.5C49 99.6848 67.804 116.5 91 116.5C114.196 116.5 133 99.6848 133 121.5Z\" fill=\"white\"/>\n            <path d=\"M72 81C72 89.8366 66.1797 97 59 97C51.8203 97 46 89.8366 46 81C46 72.1634 51.8203 65 59 65C66.1797 65 72 72.1634 72 81Z\" fill=\"white\"/>\n            <path d=\"M131 81C131 89.8366 125.18 97 118 97C110.82 97 105 89.8366 105 81C105 72.1634 110.82 65 118 65C125.18 65 131 72.1634 131 81Z\" fill=\"white\"/>\n            </svg>\n        </div>\n        <div class=\"helper__text\"></div>\n    </div>\n</div>");
    var body = html$2.find('.helper__text'),
        time;
    var memorys = {};
    var remember = 1000 * 60 * 60 * 14;

    function show$1(name, text, elem) {
      if (!Storage.field('helper')) return;
      var help = memorys[name];

      if (!help) {
        help = {
          time: 0,
          count: 0
        };
        if (_typeof(memorys) !== 'object') memorys = {}; //хз, вылазит ошибка, что в переменную true нельзя записать значение, откуда там true хз

        memorys[name] = help;
      }

      if (help.time + remember < Date.now() && help.count < 3) {
        help.time = Date.now();
        help.count++;
        Storage.set('helper', memorys);
        clearTimeout(time);
        time = setTimeout(function () {
          html$2.removeClass('helper--visible');
        }, 10000);
        body.html(text);
        html$2.addClass('helper--visible');

        if (elem) {
          var blink = $('<div class="helper-blink"></div>');
          elem.append(blink);
          setTimeout(function () {
            blink.remove();
          }, 3000);
        }
      }
    }

    function init$3() {
      memorys = Storage.cache('helper', 300, {});
      Settings.listener.follow('open', function (e) {
        if (e.name == 'more') {
          e.body.find('.helper--start-again').on('hover:enter', function () {
            memorys = {};
            Storage.set('helper', memorys);
            Noty.show(Lang.translate('helper_cleared'));
          });
        }
      });
      $('body').append(html$2);
    }

    var Helper = {
      show: show$1,
      init: init$3
    };

    var SERVER = {};
    var timers = {};
    var callback$1;
    var callback_back;
    var formats = ['asf', 'wmv', 'divx', 'avi', 'mp4', 'm4v', 'mov', '3gp', '3g2', 'mkv', 'trp', 'tp', 'mts', 'mpg', 'mpeg', 'dat', 'vob', 'rm', 'rmvb', 'm2ts', 'ts'];

    function start$1(element, movie) {
      SERVER.object = element;
      if (movie) SERVER.movie = movie;

      if (!Storage.field('internal_torrclient')) {
        Android.openTorrent(SERVER);
        if (movie && movie.id) Favorite.add('history', movie, 100);
        if (callback$1) callback$1();
      } else if (Torserver.url()) {
        loading();
        connect();
      } else install();
    }

    function open(hash, movie) {
      SERVER.hash = hash;
      if (movie) SERVER.movie = movie;

      if (!Storage.field('internal_torrclient')) {
        Android.playHash(SERVER);
        if (callback$1) callback$1();
      } else if (Torserver.url()) {
        loading();
        files();
      } else install();
    }

    function loading() {
      Modal.open({
        title: '',
        html: Template$1.get('modal_loading'),
        size: 'large',
        mask: true,
        onBack: function onBack() {
          Modal.close();
          close();
        }
      });
    }

    function connect() {
      Torserver.connected(function () {
        hash();
      }, function (echo) {
        Torserver.error();
      });
    }

    function hash() {
      Torserver.hash({
        title: SERVER.object.title,
        link: SERVER.object.MagnetUri || SERVER.object.Link,
        poster: SERVER.object.poster,
        data: {
          lampa: true,
          movie: SERVER.movie
        }
      }, function (json) {
        SERVER.hash = json.hash;
        files();
      }, function (echo) {
        //Torserver.error()
        var jac = Storage.field('parser_torrent_type') == 'jackett';
        var tpl = Template$1.get('torrent_nohash', {
          title: Lang.translate('title_error'),
          text: Lang.translate('torrent_parser_no_hash'),
          url: SERVER.object.MagnetUri || SERVER.object.Link,
          echo: echo
        });
        if (jac) tpl.find('.is--torlook').remove();else tpl.find('.is--jackett').remove();
        Modal.update(tpl);
      });
    }

    function files() {
      var repeat = 0;
      timers.files = setInterval(function () {
        repeat++;
        Torserver.files(SERVER.hash, function (json) {
          if (json.file_stats) {
            clearInterval(timers.files);
            show(json.file_stats);
          }
        });

        if (repeat >= 45) {
          Modal.update(Template$1.get('error', {
            title: Lang.translate('title_error'),
            text: Lang.translate('torrent_parser_timeout')
          }));
          Torserver.clear();
          Torserver.drop(SERVER.hash);
        }
      }, 2000);
    }

    function install() {
      Modal.open({
        title: '',
        html: Template$1.get('torrent_install', {}),
        size: 'large',
        onBack: function onBack() {
          Modal.close();
          Controller.toggle('content');
        }
      });
    }

    function show(files) {
      var plays = files.filter(function (a) {
        var exe = a.path.split('.').pop().toLowerCase();
        return formats.indexOf(exe) >= 0;
      });
      var active = Activity$1.active(),
          movie = active.movie || SERVER.movie || {}; // let seasons = []
      //
      // plays.forEach(element => {
      //     let info = Torserver.parse(element.path, movie)
      //
      //     if (info.serial && info.season && seasons.indexOf(info.season) == -1) {
      //         seasons.push(info.season)
      //     }
      // })
      // if (seasons.length) {
      //     Api.seasons(movie, seasons, (data) => {
      //         list(plays, {
      //             movie: movie,
      //             seasons: data,
      //             files: files
      //         })
      //     })
      // } else {

      Torserver.viewed(SERVER.hash, function onSuccess(json) {
        list$1(plays, {
          movie: movie,
          viewedFiles: json,
          files: files
        });
      }, function onFailure() {
        Noty.show('Torrent detail are not loaded.');
        list$1(plays, {
          movie: movie,
          viewedFiles: [],
          files: files
        });
      }); // }
    }

    function parseSubs(path, files) {
      var name = path.split('/').pop().split('.').slice(0, -1).join('.');
      var index = -1;
      var subtitles = files.filter(function (a) {
        var _short = a.path.split('/').pop();

        var issub = ['srt', 'vtt'].indexOf(a.path.split('.').pop().toLowerCase()) >= 0;
        return _short.indexOf(name) >= 0 && issub;
      }).map(function (a) {
        index++;
        return {
          label: '',
          url: Torserver.stream(a.path, SERVER.hash, a.id),
          index: index
        };
      });
      return subtitles.length ? subtitles : false;
    }

    function list$1(items, params) {
      var html = $('<div class="torrent-files"></div>');
      var playlist = [];
      var lastViewedElement;
      items.forEach(function (element, index) {
        // let exe = element.path.split('.').pop().toLowerCase()
        // let info = Torserver.parse(element.path, params.movie, formats_individual.indexOf(exe) >= 0)
        var view;
        var find = params.viewedFiles.find(function (el) {
          return el.file_index === index + 1;
        });

        if (find) {
          view = {
            hash: Utils.hash(element.path),
            percent: 50,
            time: 50,
            duration: 100,
            handler: function handler(percent, time, duration) {}
          };
        } else {
          view = {
            hash: Utils.hash(element.path),
            percent: 0,
            time: 0,
            duration: 0,
            handler: function handler(percent, time, duration) {}
          };
        }

        var item;

        var viewed = function viewed(viewing) {// Account.torrentViewed({
          //     object: SERVER.object,
          //     viewing,
          //     card: SERVER.movie
          // })
        };

        Arrays.extend(element, {
          // season: info.season,
          // episode: info.episode,
          title: Utils.pathToNormalTitle(element.path),
          size: Utils.bytesToSize(element.length),
          url: Torserver.stream(element.path, SERVER.hash, element.id),
          torrent_hash: SERVER.hash,
          timeline: view,
          // air_date: '--',
          // img: './img/img_broken.svg',
          // exe: exe,
          viewed: viewed
        }); // if (params.seasons) {
        //     let episodes = params.seasons[info.season]
        //
        //     element.title = info.episode + ' / ' + Utils.pathToNormalTitle(element.path, false)
        //     element.fname = element.title
        //
        //     if (episodes) {
        //         let episode = episodes.episodes.filter((a) => {
        //             return a.episode_number == info.episode
        //         })[0]
        //
        //         if (episode) {
        //             element.title = info.episode + ' / ' + episode.name
        //             element.air_date = episode.air_date
        //             element.fname = episode.name
        //
        //             if (episode.still_path) element.img = Api.img(episode.still_path)
        //             else if (episode.img) element.img = episode.img
        //         }
        //     }
        //
        //     item = Template.get('torrent_file_serial', element)
        // } else {

        item = Template$1.get('torrent_file', element);

        if (find) {
          lastViewedElement = item[0];
        } // if (params.movie.title) element.title = params.movie.title
        // }


        item.append(Timeline.render(view));
        element.subtitles = parseSubs(element.path, params.files);
        playlist.push(element);
        item.on('hover:enter', function () {
          if (params.movie.id) Favorite.add('history', params.movie, 100);

          if (Platform.is('android') && playlist.length > 1) {
            var trim_playlist = [];
            playlist.forEach(function (elem) {
              trim_playlist.push({
                title: elem.title,
                url: elem.url,
                timeline: elem.timeline
              });
            });
            element.playlist = trim_playlist;
          }

          if (Platform.is('android')) {
            Lampa.Player.runas('android');
          }

          Player.play(element);
          Player.callback(function () {
            html.remove();
            show(params.files);
            Controller.toggle('modal');
          });
          Player.playlist(playlist);
          Player.stat(element.url);

          if (callback$1) {
            callback$1();
            callback$1 = false;
          }
        }).on('hover:long', function () {
          var enabled = Controller.enabled().name;
          var menu = [{
            title: Lang.translate('time_reset'),
            timeclear: true
          }];

          if (Platform.is('webos')) {
            menu.push({
              title: Lang.translate('player_lauch') + ' - WebOS',
              player: 'webos'
            });
          }

          if (Platform.is('android')) {
            menu.push({
              title: Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }

          menu.push({
            title: Lang.translate('player_lauch') + ' - Lampa',
            player: 'lampa'
          });

          if (!Platform.tv()) {
            menu.push({
              title: Lang.translate('copy_link'),
              link: true
            });
          }

          Select.show({
            title: Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.timeclear) {
                // view.percent = 0
                // view.time = 0
                // view.duration = 0
                //
                // element.timeline = view
                //
                // Timeline.update(view)
                Torserver.resetViewed(SERVER.hash, function onSuccess() {
                  html.remove();
                  show(params.files);
                }, function onFailure() {
                  Noty.show('Torrent reset failed.');
                });
              }

              if (a.link) {
                Utils.copyTextToClipboard(element.url.replace('&preload', '&play'), function () {
                  Noty.show(Lang.translate('copy_secuses'));
                }, function () {
                  Noty.show(Lang.translate('copy_error'));
                });
              }

              Controller.toggle(enabled);

              if (a.player) {
                Player.runas(a.player);
                item.trigger('hover:enter');
              }
            }
          });
        }).on('hover:focus', function () {
          Helper.show('torrents_view', Lang.translate('helper_torrents_view'), item);
        });
        html.append(item);
      });
      if (items.length == 0) html = Template$1.get('error', {
        title: Lang.translate('empty_title'),
        text: Lang.translate('torrent_parser_nofiles')
      });else Modal.title('');
      Modal.update(html, lastViewedElement);
    }

    function opened(call) {
      callback$1 = call;
    }

    function back$3(call) {
      callback_back = call;
    }

    function close() {
      Torserver.drop(SERVER.hash);
      Torserver.clear();
      clearInterval(timers.files);

      if (callback_back) {
        callback_back();
      } else {
        Controller.toggle('content');
      }

      callback_back = false;
      SERVER = {};
    }

    var Torrent = {
      start: start$1,
      open: open,
      opened: opened,
      back: back$3
    };

    var url;
    var network$1 = new create$p();

    function init$2() {
      var source = {
        title: Lang.translate('title_parser'),
        search: function search(params, oncomplite) {
          get$3({
            search: decodeURIComponent(params.query),
            other: true,
            from_search: true,
            movie: {
              genres: [],
              title: decodeURIComponent(params.query),
              original_title: decodeURIComponent(params.query),
              number_of_seasons: 0
            }
          }, function (json) {
            json.title = Lang.translate('title_parser');
            json.results = json.Results.slice(0, 20);
            json.Results = null;
            json.results.forEach(function (element) {
              element.Title = Utils.shortText(element.Title, 110);
            });
            oncomplite([json]);
          }, function () {
            oncomplite([]);
          });
        },
        onCancel: function onCancel() {
          network$1.clear();
        },
        params: {
          align_left: true,
          isparser: true,
          card_events: {
            onMenu: function onMenu() {}
          }
        },
        onMore: function onMore(params, close) {
          close();
          Activity$1.push({
            url: '',
            title: Lang.translate('title_torrents'),
            component: 'torrents',
            search: params.query,
            movie: {
              title: params.query,
              original_title: '',
              img: './img/img_broken.svg',
              genres: []
            },
            page: 1
          });
        },
        onSelect: function onSelect(params, close) {
          if (params.element.reguest && !params.element.MagnetUri) {
            marnet(params.element, function () {
              Modal.close();
              Torrent.start(params.element, {
                title: params.element.Title
              });
              Torrent.back(params.line.toggle.bind(params.line));
            }, function (text) {
              Modal.update(Template.get('error', {
                title: Lang.translate('title_error'),
                text: text
              }));
            });
            Modal.open({
              title: '',
              html: Template.get('modal_pending', {
                text: Lang.translate('torrent_get_magnet')
              }),
              onBack: function onBack() {
                Modal.close();
                params.line.toggle();
              }
            });
          } else {
            Torrent.start(params.element, {
              title: params.element.Title
            });
            Torrent.back(params.line.toggle.bind(params.line));
          }
        }
      };
      Storage.listener.follow('change', function (e) {
        if (e.name == 'parse_in_search') {
          Search.removeSource(source);
          if (Storage.field('parse_in_search')) Search.addSource(source);
        }
      });

      if (Storage.field('parse_in_search')) {
        Search.addSource(source);
      }
    }

    function get$3() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;

      function complite(data) {
        popular(params.movie, data, {}, oncomplite);
      }

      function error(e) {
        var data = {
          Results: []
        };
        popular(params.movie, data, {
          nolimit: true
        }, function () {
          if (data.Results.length) oncomplite(data);else onerror(e);
        });
      }

      if (Storage.field('parser_torrent_type') == 'jackett') {
        if (Storage.field('jackett_url')) {
          url = Utils.checkHttp(Storage.field('jackett_url'));
          var ignore = params.from_search && !url.match(/\d+\.\d+\.\d+/g);
          if (ignore) error('');else {
            jackett(params, complite, function () {
              error(''); // torlook(params, complite, error)
            });
          }
        } else {
          error(Lang.translate('torrent_parser_set_link') + ': Jackett');
        }
      } else {
        if (Storage.get('native')) {
          torlook(params, complite, error);
        } else if (Storage.field('torlook_parse_type') == 'site' && Storage.field('parser_website_url')) {
          url = Utils.checkHttp(Storage.field('parser_website_url'));
          torlook(params, complite, error);
        } else if (Storage.field('torlook_parse_type') == 'native') {
          torlook(params, complite, error);
        } else error(Lang.translate('torrent_parser_set_link') + ': TorLook');
      }
    }

    function popular(card, data, params, call) {
      Account.torrentPopular({
        card: card
      }, function (result) {
        var torrents = result.result.torrents.filter(function (t) {
          return t.viewing_request > (params.nolimit ? 0 : 3);
        });
        torrents.sort(function (a, b) {
          return b.viewing_average - a.viewing_average;
        });
        torrents.forEach(function (t) {
          delete t.viewed;
        });
        data.Results = data.Results.concat(params.nolimit ? torrents : torrents.slice(0, 3));
        call(data);
      }, function () {
        call(data);
      });
    }

    function viewed(hash) {
      var view = Storage.cache('torrents_view', 5000, []);
      return view.indexOf(hash) > -1;
    }

    function torlook() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      torlookApi(params, oncomplite, onerror);
    }

    function torlookApi() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      network$1.timeout(1000 * Storage.field('parse_timeout'));
      var s = 'https://api.torlook.info/api.php?key=4JuCSML44FoEsmqK&s=';
      var q = (params.search + '').replace(/( )/g, "+").toLowerCase();
      var u = Storage.get('native') || Storage.field('torlook_parse_type') == 'native' ? s + encodeURIComponent(q) : url.replace('{q}', encodeURIComponent(s + encodeURIComponent(q)));
      network$1["native"](u, function (json) {
        if (json.error) onerror(Lang.translate('torrent_parser_request_error'));else {
          var data = {
            Results: []
          };

          if (json.data) {
            json.data.forEach(function (elem) {
              var item = {};
              item.Title = elem.title;
              item.Tracker = elem.tracker;
              item.Size = parseInt(elem.size);
              item.size = Utils.bytesToSize(item.Size);
              item.PublishDate = parseInt(elem.date) * 1000;
              item.Seeders = parseInt(elem.seeders);
              item.Peers = parseInt(elem.leechers);
              item.PublisTime = parseInt(elem.date) * 1000;
              item.hash = Utils.hash(elem.title);
              item.MagnetUri = elem.magnet;
              item.viewed = viewed(item.hash);
              if (elem.magnet) data.Results.push(item);
            });
          }

          oncomplite(data);
        }
      }, function (a, c) {
        onerror(Lang.translate('torrent_parser_no_responce'));
      });
    }

    function jackett() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      network$1.timeout(1000 * Storage.field('parse_timeout'));
      var proxy = 'https://cr-jgp4.onrender.com/';

      if (Platform.is('android')) {
        proxy = '';
      }

      var u = proxy + url + '/api/v2.0/indexers/all/results?apikey=' + Storage.field('jackett_key') + '&Query=' + encodeURIComponent(params.search);
      var genres = params.movie.genres.map(function (a) {
        return a.name;
      });

      if (!params.clarification) {
        u = Utils.addUrlComponent(u, 'title=' + encodeURIComponent(params.movie.title));
        u = Utils.addUrlComponent(u, 'title_original=' + encodeURIComponent(params.movie.original_title));
      }

      u = Utils.addUrlComponent(u, 'year=' + encodeURIComponent(((params.movie.release_date || params.movie.first_air_date || '0000') + '').slice(0, 4)));
      u = Utils.addUrlComponent(u, 'is_serial=' + (params.movie.first_air_date || params.movie.last_air_date ? '2' : params.other ? '0' : '1'));
      u = Utils.addUrlComponent(u, 'genres=' + encodeURIComponent(genres.join(',')));
      u = Utils.addUrlComponent(u, 'Category[]=' + (params.movie.number_of_seasons > 0 ? 5000 : 2000) + (params.movie.original_language == 'ja' ? ',5070' : ''));
      network$1["native"](u, function (json) {
        json.Results.forEach(function (element) {
          element.PublisTime = Utils.strToTime(element.PublishDate);
          element.hash = Utils.hash(element.Title);
          element.viewed = viewed(element.hash);
          element.size = Utils.bytesToSize(element.Size);
        });
        oncomplite(json);
      }, function (a, c) {
        onerror(network$1.errorDecode(a, c));
        onerror(Lang.translate('torrent_parser_no_responce'));
      }, null, {
        headers: {
          'my_origin': 'http://lampa.mx',
          'my_referer': 'http://lampa.mx'
        }
      });
    }

    function marnet(element, oncomplite, onerror) {
      network$1.timeout(1000 * 15);
      var s = Utils.checkHttp(Storage.field('torlook_site')) + '/';
      var u = Storage.get('native') || Storage.field('torlook_parse_type') == 'native' ? s + element.reguest : url.replace('{q}', encodeURIComponent(s + element.reguest));
      network$1["native"](u, function (html) {
        var math = html.match(/magnet:(.*?)'/);

        if (math && math[1]) {
          element.MagnetUri = 'magnet:' + math[1];
          oncomplite();
        } else {
          onerror(Lang.translate('torrent_parser_magnet_error'));
        }
      }, function (a, c) {
        onerror(network$1.errorDecode(a, c));
      }, false, {
        dataType: 'text'
      });
    }

    function clear$3() {
      network$1.clear();
    }

    var Parser = {
      init: init$2,
      get: get$3,
      torlook: torlook,
      jackett: jackett,
      marnet: marnet,
      clear: clear$3
    };

    /**
     * Источники
     */

    var sources = {
      ivi: IVI,
      okko: OKKO,
      tmdb: TMDB,
      cub: CUB
    };
    /**
     * Чтоб не переписали их
     */

    Object.defineProperty(sources, 'ivi', {
      get: function get() {
        return IVI;
      }
    });
    Object.defineProperty(sources, 'okko', {
      get: function get() {
        return OKKO;
      }
    });
    Object.defineProperty(sources, 'tmdb', {
      get: function get() {
        return TMDB;
      }
    });
    Object.defineProperty(sources, 'cub', {
      get: function get() {
        return CUB;
      }
    });
    var network = new create$p();
    /**
     * Получить источник
     * @param {{source:string}} params
     * @returns {class}
     */

    function source(params) {
      return params.source && sources[params.source] ? sources[params.source] : sources.tmdb;
    }

    function availableDiscovery() {
      var list = [];

      for (var key in sources) {
        console.log('Api', 'discovery check:', key, sources[key].discovery ? true : false, _typeof(sources[key].discovery));
        if (sources[key].discovery) list.push(sources[key].discovery());
      }

      return list;
    }
    /**
     * Главная страница
     * @param {{source:string}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function main() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      source(params).main(params, oncomplite, onerror);
    }
    /**
     * Категория
     * @param {{url:string, source:string}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function category() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      source(params).category(params, oncomplite, onerror);
    }
    /**
     * Просмотр карточки
     * @param {{id:string, source:string, method:string, card:{}}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function full() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      source(params).full(params, oncomplite, onerror);
    }
    /**
     * Главный поиск
     * @param {{query:string}} params
     * @param {function} oncomplite
     */


    function search() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      TMDB.search(params, function (json) {
        var result = {
          movie: json.find(function (a) {
            return a.type == 'movie';
          }),
          tv: json.find(function (a) {
            return a.type == 'tv';
          })
        };
        oncomplite(result);
      }, function () {
        oncomplite({});
      });
    }
    /**
     * Что-то старое, надо проверить
     * @param {object} params
     * @param {function} oncomplite
     */


    function menuCategory() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      source(params).menuCategory(params, oncomplite);
    }
    /**
     * Информация об актёре
     * @param {{id:integer, source:string}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function person() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      source(params).person(params, oncomplite, onerror);
    }
    /**
     * Жанры
     * @param {object} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function genres() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      TMDB.genres(params, oncomplite, onerror);
    }
    /**
     * Компания
     * @param {{id:integer}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function company() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      TMDB.company(params, oncomplite, onerror);
    }
    /**
     * Полная категори
     * @param {{page:integer, url:string, source:string}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function list() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      source(params).list(params, oncomplite, onerror);
    }
    /**
     * Получить список категорий для каталога в меню
     * @param {{source:string}} params
     * @param {function} oncomplite
     */


    function menu() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      source(params).menu(params, oncomplite);
    }
    /**
     * Сезоны
     * @param {{id:integer, source:string}} tv
     * @param {[1,2,3]} from - список сезонов 1,3,4...
     * @param {function} oncomplite
     */


    function seasons(tv, from, oncomplite) {
      source(tv).seasons(tv, from, oncomplite);
    }
    /**
     * Коллекции
     * @param {object} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function collections(params, oncomplite, onerror) {
      source(params).collections(params, oncomplite, onerror);
    }
    /**
     * Закладки
     * @param {{page:integer, type:string}} params
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function favorite() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var oncomplite = arguments.length > 1 ? arguments[1] : undefined;
      var onerror = arguments.length > 2 ? arguments[2] : undefined;
      var data = {};
      data.results = Favorite.get(params);
      data.total_pages = Math.ceil(data.results.length / 20);
      data.page = Math.min(params.page, data.total_pages);
      var offset = data.page - 1;
      data.results = data.results.slice(20 * offset, 20 * offset + 20);
      if (data.results.length) oncomplite(data);else onerror();
    }
    /**
     * Релизы
     * @param {function} oncomplite
     * @param {function} onerror
     */


    function relise(oncomplite, onerror) {
      network.silent(Utils.protocol() + 'tmdb.cubnotrip.top?sort=releases&results=200', function (json) {
        json.results.forEach(function (item) {
          item.tmdbID = item.id;
        });
        oncomplite(json.results);
      }, onerror);
    }
    /**
     * Очистить
     */


    function clear$2() {
      for (var i in sources) {
        sources[i].clear();
      }

      network.clear();
    }

    var Api = {
      main: main,
      img: TMDB.img,
      full: full,
      list: list,
      genres: genres,
      category: category,
      search: search,
      clear: clear$2,
      company: company,
      person: person,
      favorite: favorite,
      seasons: seasons,
      screensavers: TMDB.screensavers,
      relise: relise,
      menu: menu,
      collections: collections,
      menuCategory: menuCategory,
      sources: sources,
      availableDiscovery: availableDiscovery
    };

    function create$d() {
      var html;

      this.create = function () {
        html = Template$1.get('info');
      };

      this.update = function (data) {
        // let create = ((data.release_date || data.first_air_date || '0000') + '').slice(0, 4)
        // let vote = parseFloat((data.vote_average || 0) + '').toFixed(1)
        //
        $('.head__selected').text(data.title); // html.find('.info__title').text(data.title)
        // html.find('.info__title-original').text((create == '0000' ? '' : create + ' - ') + data.original_title)
        // html.find('.info__rate span').text(vote)
        // html.find('.info__rate').toggleClass('hide', !(vote > 0))
        //
        // html.find('.info__icon').removeClass('active')
        //
        // if (!nofavorite) {
        //     let status = Favorite.check(data)
        //
        //     $('.icon--book', html).toggleClass('active', status.book)
        //     $('.icon--like', html).toggleClass('active', status.like)
        //     $('.icon--wath', html).toggleClass('active', status.wath)
        // }
        //
        // html.find('.info__right').toggleClass('hide', nofavorite)
      };

      this.render = function () {
        return html;
      };

      this.empty = function () {
        this.update({
          title: Lang.translate('more'),
          original_title: Lang.translate('more_results'),
          vote_average: 0
        }, true);
      };

      this.destroy = function () {
        html.remove();
        $('.head__selected').text('');
        html = null;
      };
    }

    function create$c() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      Arrays.extend(params, {
        title: Lang.translate('empty_title_two'),
        descr: Lang.translate('empty_text_two')
      });
      var html = Template$1.get('empty', params);

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(html);
            Controller.collectionFocus(false, html);
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            Navigator.move('right');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.render = function (add) {
        if (add) html.append(add);
        return html;
      };
    }

    function component$g(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        scroll_by_item: true
      });
      var items = [];
      var html = $('<div></div>');
      var active = 0;
      var info;
      var lezydata;
      var viewall = Storage.field('card_views_type') == 'view' || Storage.field('navigation_type') == 'mouse';

      this.create = function () {};

      this.empty = function () {
        var empty = new create$c();
        html.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.build = function (data) {
        var _this = this;

        lezydata = data;

        if (Storage.field('light_version') && window.innerWidth >= 767) {
          scroll.minus();
          html.append(scroll.render());

          scroll.onWheel = function (step) {
            if (step > 0) _this.down();else _this.up();
          };
        } else {
          info = new create$d();
          info.create();
          scroll.minus();
          html.append(scroll.render());
        }

        data.slice(0, viewall ? data.length : 2).forEach(this.append.bind(this));
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.append = function (element) {
        if (element.ready) return;
        element.ready = true;
        var item = new create$i(element, {
          url: element.url,
          card_small: true,
          genres: object.genres,
          object: object,
          card_wide: element.wide,
          nomore: element.nomore
        });
        item.create();
        item.onDown = this.down.bind(this);
        item.onUp = this.up.bind(this);
        item.onBack = this.back.bind(this);

        if (info) {
          item.onFocus = info.update;
          item.onFocusMore = info.empty.bind(info);
          scroll.append(item.render());
        } else {
          item.wrap = $('<div></div>');
          scroll.append(item.wrap);
        }

        items.push(item);
      };

      this.back = function () {
        Activity$1.backward();
      };

      this.detach = function () {
        if (!info) {
          items.forEach(function (item) {
            item.render().detach();
          });
          items.slice(active, active + 2).forEach(function (item) {
            item.wrap.append(item.render());
          });
        }
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        if (!viewall) lezydata.slice(0, active + 2).forEach(this.append.bind(this));
        this.detach();
        items[active].toggle();
        scroll.update(items[active].render());
      };

      this.up = function () {
        active--;

        if (active < 0) {
          active = 0;
          this.detach();
          Controller.toggle('head');
        } else {
          this.detach();
          items[active].toggle();
        }

        scroll.update(items[active].render());
      };

      this.start = function () {
        var _this2 = this;

        Controller.add('content', {
          toggle: function toggle() {
            if (items.length) {
              _this2.detach();

              items[active].toggle();
            }
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: this.back
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        if (info) info.destroy();
        html.remove();
        items = null;
        network = null;
        lezydata = null;
      };
    }

    function component$f(object) {
      var comp = new component$g(object);

      comp.create = function () {
        this.activity.loader(true);
        Api.main(object, this.build.bind(this), this.empty.bind(this));
        return this.render();
      };

      return comp;
    }

    function Event() {
      var ids = {};
      var evokes = {};

      function callback(data) {
        if (data.method == 'callback' && ids[data.callback_name] == data.callback_id) {
          evokes[data.callback_id](data);

          evokes[data.callback_id] = function () {};
        }
      }

      this.call = function (method, params, call) {
        if (!ids[method]) ids[method] = Utils.uid(10);
        params.callback_id = ids[method];
        params.callback_name = method;
        evokes[params.callback_id] = call;
        Socket.send('callback', params);
      };

      this.cancel = function (method) {
        if (ids[method]) {
          evokes[ids[method]] = function () {};
        }
      };

      this.destroy = function () {
        Socket.listener.remove('message', callback);

        for (var i in evokes) {
          evokes[i] = function () {};
        }
      };

      Socket.listener.follow('message', callback);
    }

    function create$b(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var html;
      var last;
      var tbtn;

      var follow = function follow(e) {
        if (e.name == 'parser_use') {
          var status = Storage.get('parser_use');
          tbtn.toggleClass('selector', status).toggleClass('hide', !status);
        }
      };

      var buttons_scroll = new create$o({
        horizontal: true,
        nopadding: false
      });
      var load_images = {
        poster: {},
        background: {}
      };
      var event = new Event();
      Arrays.extend(data.movie, {
        title: data.movie.name,
        original_title: data.movie.original_name,
        runtime: 0,
        img: data.movie.poster_path ? Api.img(data.movie.poster_path, Storage.field('poster_size')).replace(/\/w200/, '/w500') : 'img/img_broken.svg'
      });

      this.create = function () {
        var _this = this;

        var genres;

        if (data.movie.genres) {
          genres = data.movie.genres.slice(0, 3).map(function (a) {
            return Utils.capitalizeFirstLetter(a.name);
          }).join(', ');
        } else {
          genres = '---';
        }

        html = Template$1.get('full_start', {
          title: data.movie.title,
          original_title: data.movie.original_title,
          descr: Utils.substr(data.movie.overview || Lang.translate('full_notext'), 420),
          time: Utils.secondsToTime(data.movie.runtime * 60, true),
          genres: Utils.substr(genres, 30),
          r_themovie: parseFloat((data.movie.vote_average || 0) + '').toFixed(1),
          seasons: Utils.countSeasons(data.movie),
          episodes: data.movie.number_of_episodes
        });
        var year = ((data.movie.release_date || data.movie.first_air_date) + '').slice(0, 4);
        var quality = !data.movie.first_air_date ? VideoQuality.get(data.movie) : false;

        if (year) {
          html.find('.tag--year').removeClass('hide').find('> div').text(year);
        }

        if (quality) {
          html.find('.tag--quality').removeClass('hide').find('> div').text(quality);
        }

        if (data.movie.number_of_seasons) {
          html.find('.is--serial').removeClass('hide');
        }

        if (data.movie.imdb_rating) {
          html.find('.rate--imdb').removeClass('hide').find('> div').eq(0).text(data.movie.imdb_rating);
        }

        if (data.movie.kp_rating) {
          html.find('.rate--kp').removeClass('hide').find('> div').eq(0).text(data.movie.kp_rating);
        }

        if (!(data.movie.source == 'tmdb' || data.movie.source == 'cub')) html.find('.info__rate').eq(0).find('> div').text(data.movie.source.toUpperCase());else if (data.movie.number_of_seasons) {
          html.find('.icon--subscribe').removeClass('hide');
          this.subscribed();
        }
        $('.full-start__buttons-scroll', html).append(buttons_scroll.render());
        buttons_scroll.append($('.full-start__buttons', html));
        if (!data.movie.runtime) $('.tag--time', html).remove();

        if (data.movie.next_episode_to_air) {
          var air = new Date(data.movie.next_episode_to_air.air_date);
          var now = Date.now();
          var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
          if (day > 0) $('.tag--episode', html).removeClass('hide').find('div').text(Lang.translate('full_next_episode') + ': ' + Utils.parseTime(data.movie.next_episode_to_air.air_date)["short"] + ' / ' + Lang.translate('full_episode_days_left') + ': ' + day);
        }

        tbtn = html.find('.view--torrent');
        tbtn.on('hover:enter', function () {
          var year = ((data.movie.first_air_date || data.movie.release_date || '0000') + '').slice(0, 4);
          var combinations = {
            'df': data.movie.original_title,
            'df_year': data.movie.original_title + ' ' + year,
            'df_lg': data.movie.original_title + ' ' + data.movie.title,
            'df_lg_year': data.movie.original_title + ' ' + data.movie.title + ' ' + year,
            'lg': data.movie.title,
            'lg_year': data.movie.title + ' ' + year,
            'lg_df': data.movie.title + ' ' + data.movie.original_title,
            'lg_df_year': data.movie.title + ' ' + data.movie.original_title + ' ' + year
          };
          Activity$1.push({
            url: '',
            title: Lang.translate('title_torrents'),
            component: 'torrents',
            search: combinations[Storage.field('parse_lang')],
            search_one: data.movie.title,
            search_two: data.movie.original_title,
            movie: data.movie,
            page: 1
          });
        });
        html.find('.info__icon').not('[data-type="subscribe"]').on('hover:enter', function (e) {
          var type = $(e.target).data('type');
          params.object.card = data.movie;
          params.object.card.source = params.object.source;
          Favorite.toggle(type, params.object.card);

          _this.favorite();
        });

        if (data.videos && data.videos.results.length) {
          html.find('.view--trailer').on('hover:enter', function () {
            var items = [];
            data.videos.results.forEach(function (element) {
              items.push({
                title: element.name,
                subtitle: element.official ? Lang.translate('full_trailer_official') : Lang.translate('full_trailer_no_official'),
                id: element.key,
                player: element.player,
                url: element.url
              });
            });
          });
        } else {
          html.find('.view--trailer').remove();
        }

        Storage.listener.follow('change', follow);
        follow({
          name: 'parser_use'
        });
        this.favorite();
        this.loadPoster();
        this.loadBackground();
        this.translations();
        this.parsePG();
      };

      this.subscribed = function () {
        event.call('subscribed', {
          card_id: data.movie.id
        }, function (result) {
          if (result.result) {
            html.find('.icon--subscribe').data('voice', result.result).addClass('active');
          }
        });
      };

      this.translations = function () {
        var _this2 = this;

        var button = html.find('.icon--subscribe');
        button.on('hover:enter', function () {
          Loading.start(function () {
            event.cancel('translations');
            Loading.stop();
          });
          event.call('translations', {
            card_id: data.movie.id,
            imdb_id: data.movie.imdb_id,
            season: Utils.countSeasons(data.movie)
          }, function (result) {
            Loading.stop();

            if (!result.result) {
              result.result = {
                voice: {},
                subscribe: ''
              };
            }

            var items = [];
            var subscribed = result.result.subscribe || button.data('voice');

            if (subscribed) {
              items.push({
                title: Lang.translate('title_unsubscribe'),
                subtitle: subscribed,
                unsubscribe: true
              });
            }

            for (var voice in result.result.voice) {
              items.push({
                title: voice + ' - ' + result.result.voice[voice],
                voice: voice,
                ghost: voice !== result.result.subscribe,
                episode: result.result.voice[voice]
              });
            }

            if (items.length) {
              Select.show({
                title: Lang.translate('title_subscribe'),
                items: items,
                onSelect: function onSelect(a) {
                  _this2.toggle();

                  if (a.unsubscribe) {
                    event.call('unsubscribe', {
                      card_id: data.movie.id
                    }, function (result) {
                      if (result.result) {
                        button.removeClass('active').data('voice', '');
                      }
                    });
                  } else if (Account.working()) {
                    Account.subscribeToTranslation({
                      card: data.movie,
                      season: Utils.countSeasons(data.movie),
                      episode: a.episode,
                      voice: a.voice
                    }, function () {
                      Noty.show(Lang.translate('subscribe_success'));
                      button.addClass('active').data('voice', a.voice);
                    }, function () {
                      Noty.show(Lang.translate('subscribe_error'));
                    });
                  } else {
                    Account.showNoAccount();
                  }
                },
                onBack: function onBack() {
                  Controller.toggle('full_start');
                }
              });
            } else Noty.show(Lang.translate('subscribe_noinfo'));
          });
        });
      };

      this.parsePG = function () {
        var pg;
        var cd = Storage.field('language');

        if (data.movie.content_ratings) {
          try {
            var find = data.movie.content_ratings.results.find(function (a) {
              return a.iso_3166_1 == cd.toUpperCase();
            });
            if (!find) find = data.movie.content_ratings.results.find(function (a) {
              return a.iso_3166_1 == 'US';
            });
            if (find) pg = Utils.decodePG(find.rating);
          } catch (e) {}
        }

        if (data.movie.release_dates && !pg) {
          var _find = data.movie.release_dates.results.find(function (a) {
            return a.iso_3166_1 == cd.toUpperCase() && a.release_dates.find(function (a) {
              return a.certification;
            });
          });

          if (!_find) _find = data.movie.release_dates.results.find(function (a) {
            return a.iso_3166_1 == 'US' && a.release_dates.find(function (a) {
              return a.certification;
            });
          });
          if (!_find) _find = data.movie.release_dates.results.find(function (a) {
            return a.release_dates.find(function (a) {
              return a.certification;
            });
          });

          if (_find) {
            var release_date = _find.release_dates.find(function (a) {
              return a.certification;
            });

            pg = Utils.decodePG(release_date === null || release_date === void 0 ? void 0 : release_date.certification);
          }
        }

        if (data.movie.restrict) pg = data.movie.restrict + '+';

        if (pg) {
          try {
            data.movie.pg = parseInt(pg.replace("+", ''));
          } catch (e) {}

          html.find('.full-start__pg').removeClass('hide').text(pg);
        }
      };

      this.loadPoster = function () {
        load_images.poster = html.find('.full-start__img')[0] || {};

        load_images.poster.onerror = function (e) {
          load_images.poster.src = './img/img_broken.svg';
        };

        var poster;

        if (window.innerWidth <= 400) {
          if (data.movie.backdrop_path) poster = Api.img(data.movie.backdrop_path, 'original');else if (data.movie.background_image) poster = data.movie.background_image;
        }

        if (poster) html.find('.full-start__poster').addClass('background--poster');
        load_images.poster.src = poster || data.movie.img;
      };

      this.loadBackground = function () {
        var background = data.movie.backdrop_path ? Api.img(data.movie.backdrop_path, 'original') : data.movie.background_image ? data.movie.background_image : '';

        if (window.innerWidth > 790 && background && !Storage.field('light_version') && Storage.field('background_type') !== 'poster') {
          load_images.background = html.find('.full-start__background')[0] || {};

          load_images.background.onload = function (e) {
            html.find('.full-start__background').addClass('loaded');
          };

          load_images.background.src = background;
        } else html.find('.full-start__background').remove();
      };

      this.groupButtons = function () {
        buttons_scroll.render().find('.selector').on('hover:focus', function () {
          last = $(this)[0];
          buttons_scroll.update($(this), false);
        });
      };

      this.favorite = function () {
        var status = Favorite.check(params.object.card);
        $('.info__icon', html).removeClass('active');
        $('.icon--book', html).toggleClass('active', status.book);
        $('.icon--like', html).toggleClass('active', status.like);
        $('.icon--wath', html).toggleClass('active', status.wath);
      };

      this.toggleBackground = function () {
        var uri = data.movie.poster_path ? Api.img(data.movie.poster_path, 'w200') : data.movie.poster || data.movie.img || '';
        var pos = window.innerWidth > 400 && Storage.field('background_type') == 'poster';

        if (Storage.field('background')) {
          if (data.movie.backdrop_path) uri = Api.img(data.movie.backdrop_path, pos ? 'original' : 'w200');else if (data.movie.background_image && pos) uri = data.movie.background_image;
        }

        if (uri) Background.immediately(uri);
      };

      this.toggle = function () {
        var _this3 = this;

        Controller.add('full_start', {
          toggle: function toggle() {
            var btns = html.find('.full-start__buttons > *').filter(function () {
              return $(this).is(':visible');
            });
            Controller.collectionSet(_this3.render());
            Controller.collectionFocus(last || (btns.length ? btns.eq(0)[0] : false), _this3.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');else _this3.onDown();
          },
          up: function up() {
            var inbuttons = _this3.render().find('.full-start__buttons .focus').length;

            if (Navigator.canmove('up')) Navigator.move('up');else if (inbuttons) {
              Navigator.focus(_this3.render().find('.full-start__left .selector')[0]);
            } else _this3.onUp();
          },
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_start');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        last = null;
        buttons_scroll.destroy();
        event.destroy();

        load_images.poster.onerror = function () {};

        load_images.background.onload = function () {};

        html.remove();
        Storage.listener.remove('change', follow);
      };
    }

    function create$a(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var html, body, last;

      this.create = function () {
        html = Template$1.get('items_line', {
          title: Lang.translate('full_detail')
        });
        var genres = '---';

        if (data.movie.genres) {
          genres = data.movie.genres.map(function (a) {
            return '<div class="full-descr__tag selector" data-genre="' + a.id + '" data-url="' + a.url + '">' + Utils.capitalizeFirstLetter(a.name) + '</div>';
          }).join('');
        }

        var companies = '---';

        if (data.movie.production_companies) {
          companies = data.movie.production_companies.map(function (a) {
            return '<div class="full-descr__tag selector" data-company="' + a.id + '">' + Utils.capitalizeFirstLetter(a.name) + '</div>';
          }).join('');
        }

        var countries = '---';

        if (data.movie.production_countries) {
          countries = data.movie.production_countries.map(function (a) {
            return a.name;
          }).join(', ');
        }

        body = Template$1.get('full_descr', {
          text: (data.movie.overview || Lang.translate('full_notext')) + '<br><br>',
          genres: genres,
          companies: companies,
          relise: data.movie.release_date || data.movie.first_air_date,
          budget: '$ ' + Utils.numberWithSpaces(data.movie.budget || 0),
          countries: countries
        });
        if (!genres) $('.full--genres', body).remove();
        if (!companies) $('.full--companies', body).remove();
        body.find('.selector').on('hover:enter', function (e) {
          var item = $(e.target);

          if (item.data('genre')) {
            var tmdb = params.object.source == 'tmdb' || params.object.source == 'cub';
            Activity$1.push({
              url: tmdb ? 'movie' : item.data('url'),
              component: tmdb ? 'category' : 'category_full',
              genres: item.data('genre'),
              source: params.object.source,
              page: 1
            });
          }

          if (item.data('company')) {
            Api.clear();
            Modal.open({
              title: Lang.translate('title_company'),
              html: Template$1.get('modal_loading'),
              size: 'medium',
              onBack: function onBack() {
                Modal.close();
                Controller.toggle('full_descr');
              }
            });
            Api.company({
              id: item.data('company')
            }, function (json) {
              if (Controller.enabled().name == 'modal') {
                Arrays.empty(json, {
                  homepage: '---',
                  origin_country: '---',
                  headquarters: '---'
                });
                Modal.update(Template$1.get('company', json));
              }
            }, function () {});
          }
        }).on('hover:focus', function (e) {
          last = e.target;
        });
        html.find('.items-line__body').append(body);
      };

      this.toggle = function () {
        var _this = this;

        Controller.add('full_descr', {
          toggle: function toggle() {
            Controller.collectionSet(_this.render());
            Controller.collectionFocus(last, _this.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');else _this.onDown();
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else _this.onUp();
          },
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_descr');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        body.remove();
        html.remove();
        html = null;
        body = null;
      };
    }

    function create$9(persons, params) {
      var html, scroll, last;

      this.create = function () {
        html = Template$1.get('items_line', {
          title: params.title || Lang.translate('title_actors')
        });
        scroll = new create$o({
          horizontal: true,
          scroll_by_item: true
        });
        scroll.render().find('.scroll__body').addClass('full-persons');
        html.find('.items-line__body').append(scroll.render());
        persons.forEach(function (element) {
          var person = Template$1.get('full_person', {
            name: element.name,
            role: element.character || element.job,
            img: element.profile_path ? Api.img(element.profile_path) : element.img || './img/actor.svg'
          });
          person.on('hover:focus', function (e) {
            last = e.target;
            scroll.update($(e.target), true);
          }).on('hover:enter', function () {
            Activity$1.push({
              url: element.url,
              title: Lang.translate('title_person'),
              component: 'actor',
              id: element.id,
              source: params.object.source
            });
          });
          scroll.append(person);
        });
      };

      this.toggle = function () {
        var _this = this;

        Controller.add('full_descr', {
          toggle: function toggle() {
            Controller.collectionSet(_this.render());
            Controller.collectionFocus(last, _this.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_descr');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        scroll.destroy();
        html.remove();
        html = null;
      };
    }

    function create$8(data) {
      var html, scroll, last;

      this.create = function () {
        html = Template$1.get('items_line', {
          title: Lang.translate('title_comments')
        });
        scroll = new create$o({
          horizontal: true
        });
        scroll.render().find('.scroll__body').addClass('full-reviews');
        html.find('.items-line__body').append(scroll.render());
        data.comments.slice(0, 50).forEach(function (element) {
          element.text = element.text + '';
          element.text = element.text.length > 200 ? element.text.slice(0, 200) + '...' : element.text;
          var review = Template$1.get('full_review', element);
          review.on('hover:focus', function (e) {
            last = e.target;
            scroll.update($(e.target), true);
          });
          scroll.append(review);
        });
      };

      this.toggle = function () {
        var _this = this;

        Controller.add('full_reviews', {
          toggle: function toggle() {
            Controller.collectionSet(_this.render());
            Controller.collectionFocus(last, _this.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_reviews');
      };

      this.render = function () {
        return html;
      };
    }

    function create$7(data) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var html, scroll, last;

      this.create = function () {
        html = Template$1.get('items_line', {
          title: Lang.translate('full_series_release')
        });
        scroll = new create$o({
          horizontal: true,
          scroll_by_item: true
        });
        scroll.render().find('.scroll__body').addClass('full-episodes');
        html.find('.items-line__body').append(scroll.render());
        var movie_title = params.title;
        data.reverse().forEach(function (element) {
          element.date = element.air_date ? Utils.parseTime(element.air_date).full : '----';
          var episode = Template$1.get('full_episode', element);
          var hash = Utils.hash([element.season_number, element.episode_number, movie_title].join(''));
          var view = Timeline.view(hash);
          if (view.percent) episode.append(Timeline.render(view));

          if (element.plus) {
            episode.addClass('full-episode--next');
          } else {
            var img = episode.find('img')[0];

            img.onerror = function (e) {
              img.src = './img/img_broken.svg';
            };

            if (element.still_path) img.src = Api.img(element.still_path, 'w200');else img.src = './img/img_broken.svg';
          }

          episode.on('hover:focus', function (e) {
            last = e.target;
            scroll.update($(e.target), true);
          }).on('hover:enter', function () {
            if (element.overview) {
              Modal.open({
                title: element.name,
                html: $('<div class="about"><div class="selector">' + element.overview + '</div></div>'),
                onBack: function onBack() {
                  Modal.close();
                  Controller.toggle('content');
                },
                onSelect: function onSelect() {
                  Modal.close();
                  Controller.toggle('content');
                }
              });
            }
          });
          scroll.append(episode);
        });
      };

      this.toggle = function () {
        var _this = this;

        Controller.add('full_episodes', {
          toggle: function toggle() {
            Controller.collectionSet(_this.render());
            Controller.collectionFocus(last, _this.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_episodes');
      };

      this.render = function () {
        return html;
      };
    }

    var components$1 = {
      start: create$b,
      descr: create$a,
      persons: create$9,
      recomend: create$i,
      simular: create$i,
      comments: create$8,
      episodes: create$7
    };

    function component$e(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 400,
        scroll_by_item: false
      });
      var items = [];
      var active = 0;
      scroll.render().addClass('layer--wheight');

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Api.full(object, function (data) {
          _this.activity.loader(false);

          if (data.movie) {
            Lampa.Listener.send('full', {
              type: 'start',
              object: object,
              data: data
            });

            _this.build('start', data);

            if (data.episodes && data.episodes.episodes) {
              var today = new Date();
              var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
              var time = new Date(date).getTime();
              var plus = false;
              var cameout = data.episodes.episodes.filter(function (e) {
                var air = new Date(e.air_date).getTime();
                if (air <= time) return true;else if (!plus) {
                  plus = true;
                  e.plus = true;
                  return true;
                }
                return false;
              });
              if (cameout.length) _this.build('episodes', cameout, {
                title: data.movie.original_title
              });
            }

            _this.build('descr', data);

            if (data.persons && data.persons.crew && data.persons.crew.length) {
              var directors = data.persons.crew.filter(function (member) {
                return member.job === 'Director';
              });

              if (directors.length) {
                _this.build('persons', directors, {
                  title: Lang.translate('title_producer')
                });
              }
            }

            if (data.persons && data.persons.cast && data.persons.cast.length) _this.build('persons', data.persons.cast);
            if (data.comments && data.comments.length) _this.build('comments', data);

            if (data.collection && data.collection.results.length) {
              data.collection.title = Lang.translate('title_collection');
              data.collection.noimage = true;

              _this.build('recomend', data.collection);
            }

            if (data.recomend && data.recomend.results.length) {
              data.recomend.title = Lang.translate('title_recomendations');
              data.recomend.noimage = true;

              _this.build('recomend', data.recomend);
            }

            if (data.simular && data.simular.results.length) {
              data.simular.title = Lang.translate('title_similar');
              data.simular.noimage = true;

              _this.build('simular', data.simular);
            }

            TimeTable.update(data.movie);
            Lampa.Listener.send('full', {
              type: 'complite',
              object: object,
              data: data
            });
            items[0].groupButtons();

            _this.activity.toggle();
          } else {
            _this.empty();
          }
        }, this.empty.bind(this));
        return this.render();
      };

      this.empty = function () {
        var empty = new create$c();
        scroll.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.build = function (name, data, params) {
        var item = new components$1[name](data, _objectSpread2({
          object: object,
          nomore: true
        }, params));
        item.onDown = this.down;
        item.onUp = this.up;
        item.onBack = this.back;
        item.create();
        items.push(item);
        Lampa.Listener.send('full', {
          type: 'build',
          name: name,
          body: item.render()
        });
        scroll.append(item.render());
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        items[active].toggle();
        scroll.update(items[active].render());
      };

      this.up = function () {
        active--;

        if (active < 0) {
          active = 0;
          Controller.toggle('head');
        } else {
          items[active].toggle();
        }

        scroll.update(items[active].render());
      };

      this.back = function () {
        Activity$1.backward();
      };

      this.start = function () {
        if (items.length && Activity$1.active().activity == this.activity) items[0].toggleBackground();
        Controller.add('content', {
          toggle: function toggle() {
            if (items.length) {
              items[active].toggle();
            }
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return scroll.render();
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        items = null;
        network = null;
      };
    }

    function component$d(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var total_pages = 0;
      var info;
      var last;
      var waitload;

      this.create = function () {};

      this.empty = function () {
        var empty = new create$c();
        scroll.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.next = function () {
        var _this = this;

        if (waitload) return;

        if (object.page < 15 && object.page < total_pages) {
          waitload = true;
          object.page++;
          Api.list(object, function (result) {
            _this.append(result, true);

            waitload = false; //Controller.enable('content')
          }, function () {});
        }
      };

      this.append = function (data, append) {
        var _this2 = this;

        data.results.forEach(function (element) {
          var card = new Card(element, {
            card_category: true,
            object: object
          });
          card.create();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), true);
            Background.change(Utils.cardImgBackground(card_data));

            if (info) {
              info.update(card_data);
              if (scroll.isEnd()) _this2.next();
            }
          };

          card.onEnter = function (target, card_data) {
            Activity$1.push({
              url: card_data.url,
              component: 'full',
              id: element.id,
              method: card_data.name ? 'tv' : 'movie',
              card: element,
              source: object.source
            });
          };

          card.visible();
          body.append(card.render());
          items.push(card);
          if (append) Controller.collectionAppend(card.render());
        });
      };

      this.build = function (data) {
        if (data.results.length) {
          total_pages = data.total_pages;

          if (Storage.field('light_version') && window.innerWidth >= 767) {
            scroll.minus();
            html.append(scroll.render());
          } else {
            info = new create$d();
            info.create();
            scroll.minus();
            html.append(scroll.render());
          }

          this.append(data);
          if (!info && items.length) this.back();
          if (total_pages > data.page && !info && items.length) this.more();
          scroll.append(body);
          this.activity.loader(false);
          this.activity.toggle();
        } else {
          html.append(scroll.render());
          this.empty();
        }
      };

      this.more = function () {
        var more = $('<div class="selector" style="width: 100%; height: 5px"></div>');
        more.on('hover:focus', function (e) {
          Controller.collectionFocus(last || false, scroll.render());
          var next = Arrays.clone(object);
          delete next.activity;
          next.page++;
          Activity$1.push(next);
        });
        body.append(more);
      };

      this.back = function () {
        last = items[0].render()[0];
        var more = $('<div class="selector" style="width: 100%; height: 5px"></div>');
        more.on('hover:focus', function (e) {
          if (object.page > 1) {
            Activity$1.backward();
          } else {
            Controller.toggle('head');
          }
        });
        body.prepend(more);
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        if (info) info.destroy();
        html.remove();
        body.remove();
        network = null;
        items = null;
        html = null;
        body = null;
        info = null;
      };
    }

    function component$c(object) {
      var comp = new component$d(object);

      comp.create = function () {
        Api.list(object, this.build.bind(this), this.empty.bind(this));
      };

      return comp;
    }

    function component$b(object) {
      var comp = new component$g(object);

      comp.create = function () {
        this.activity.loader(true);
        Api.category(object, this.build.bind(this), this.empty.bind(this));
        return this.render();
      };

      return comp;
    }

    function create$6(data) {
      var html;
      var last;

      this.create = function () {
        html = Template$1.get('person_start', {
          name: data.name,
          birthday: data.birthday,
          descr: Utils.substr(data.biography, 1020),
          img: data.profile_path ? Api.img(data.profile_path) : data.img || 'img/img_broken.svg',
          place: data.place_of_birth
        });
      };

      this.toggle = function () {
        var _this = this;

        Controller.add('full_start', {
          toggle: function toggle() {
            Controller.collectionSet(_this.render());
            Controller.collectionFocus(last, _this.render());
          },
          right: function right() {
            Navigator.move('right');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          down: this.onDown,
          up: this.onUp,
          gone: function gone() {},
          back: this.onBack
        });
        Controller.toggle('full_start');
      };

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        last = null;
        html.remove();
      };
    }

    var components = {
      start: create$6,
      line: create$i
    };

    function component$a(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        scroll_by_item: true
      });
      var items = [];
      var active = 0;
      scroll.render().addClass('layer--wheight');

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Api.person(object, function (data) {
          _this.activity.loader(false);

          if (data.person) {
            _this.build('start', data.person);

            if (data.credits && data.credits.knownFor && data.credits.knownFor.length > 0) {
              for (var i = 0; i < Math.min(data.credits.knownFor.length, 3); i++) {
                var departament = data.credits.knownFor[i];

                _this.build('line', {
                  title: departament.name,
                  noimage: true,
                  results: departament.credits
                });
              }
            } else {
              //для обратной совместимости с иви и окко
              if (data.movie && data.movie.results.length) {
                data.movie.title = Lang.translate('menu_movies');
                data.movie.noimage = true;

                _this.build('line', data.movie);
              }

              if (data.tv && data.tv.results.length) {
                data.tv.title = Lang.translate('menu_tv');
                data.tv.noimage = true;

                _this.build('line', data.tv);
              }
            }

            _this.activity.toggle();
          } else {
            _this.empty();
          }
        }, this.empty.bind(this));
        return this.render();
      };

      this.empty = function () {
        var empty = new create$c();
        scroll.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.build = function (name, data) {
        var item = new components[name](data, {
          object: object,
          nomore: true
        });
        item.onDown = this.down;
        item.onUp = this.up;
        item.onBack = this.back;
        item.create();
        items.push(item);
        scroll.append(item.render());
      };

      this.down = function () {
        active++;
        active = Math.min(active, items.length - 1);
        items[active].toggle();
        scroll.update(items[active].render());
      };

      this.up = function () {
        active--;

        if (active < 0) {
          active = 0;
          Controller.toggle('head');
        } else {
          items[active].toggle();
        }

        scroll.update(items[active].render());
      };

      this.back = function () {
        Activity$1.backward();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            if (items.length) {
              items[active].toggle();
            }
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return scroll.render();
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        items = null;
        network = null;
      };
    }

    function component$9(object) {
      var _this = this;

      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var total_pages = 0;
      var info;
      var last;
      var waitload;
      var timer_offer;
      var need_update = false;
      var time_update = Date.now();

      var update = function update(e) {
        if (e.name == 'account') {
          need_update = true;

          _this.again();
        }
      };

      this.again = function () {
        if (Lampa.Activity.active().activity == this.activity && need_update && time_update < Date.now() - 1000) {
          time_update = Date.now();
          setTimeout(function () {
            object.page = 1;
            Activity$1.replace(object);
          }, 0);
        }
      };

      this.create = function () {
        this.activity.loader(true);

        if (Account.working()) {
          Account.network.timeout(5000);
          Account.update(this.display.bind(this));
        } else this.display();

        return this.render();
      };

      this.display = function () {
        Api.favorite(object, this.build.bind(this), this.empty.bind(this));
        Storage.listener.follow('change', update); //Account.listener.follow('update_bookmarks',update)
      };

      this.offer = function () {
        if (!Account.working()) {
          var shw = Storage.get('favotite_offer', 'false');

          if (!shw) {
            timer_offer = setTimeout(function () {
              var tpl = Template$1.get('torrent_install', {});
              Storage.set('favotite_offer', 'true');
              tpl.find('.torrent-install__title').text(Lang.translate('fav_sync_title'));
              tpl.find('.torrent-install__descr').html(Lang.translate('fav_sync_text'));
              tpl.find('.torrent-install__label').remove();
              tpl.find('.torrent-install__links').html('<div class="torrent-install__link"><div>' + Lang.translate('fav_sync_site') + '</div><div>cub.rip</div></div>');
              tpl.find('.torrent-install__left img').attr('src', 'https://yumata.github.io/lampa/img/ili/bookmarks.png');
              Modal.open({
                title: '',
                html: tpl,
                size: 'large',
                onBack: function onBack() {
                  Modal.close();
                  Controller.toggle('content');
                }
              });
            }, 5000);
          }
        }
      };

      this.empty = function () {
        var empty = new create$c();
        html.append(empty.render());
        _this.start = empty.start;

        _this.activity.loader(false);

        _this.activity.toggle();
      };

      this.next = function () {
        var _this2 = this;

        if (waitload) return;

        if (object.page < 15 && object.page < total_pages) {
          waitload = true;
          object.page++;
          Api.favorite(object, function (result) {
            _this2.append(result, true);

            waitload = false;
          }, function () {});
        }
      };

      this.append = function (data, append) {
        var _this3 = this;

        data.results.forEach(function (element) {
          var card = new Card(element, {
            card_small: true,
            card_category: true
          });
          card.create();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), false);
            Background.change(Utils.cardImgBackground(card_data));

            if (info) {
              info.update(card_data);
              if (scroll.isEnd()) _this3.next();
            }
          };

          card.onEnter = function (target, card_data) {
            Activity$1.push({
              url: card_data.url,
              component: 'full',
              id: element.id,
              method: card_data.name ? 'tv' : 'movie',
              card: element,
              source: card_data.source || 'tmdb'
            });
          };

          if (object.type == 'history') {
            card.onMenu = function (target, card_data) {
              var enabled = Controller.enabled().name;
              Select.show({
                title: Lang.translate('title_action'),
                items: [{
                  title: Lang.translate('fav_remove_title'),
                  subtitle: Lang.translate('fav_remove_descr'),
                  one: true
                }, {
                  title: Lang.translate('fav_clear_title'),
                  subtitle: Lang.translate('fav_clear_descr'),
                  all: true
                }, {
                  title: Lang.translate('fav_clear_label_title'),
                  subtitle: Lang.translate('fav_clear_label_descr'),
                  label: true
                }, {
                  title: Lang.translate('fav_clear_time_title'),
                  subtitle: Lang.translate('fav_clear_time_descr'),
                  timecode: true
                }],
                onBack: function onBack() {
                  Controller.toggle(enabled);
                },
                onSelect: function onSelect(a) {
                  if (a.all) {
                    Favorite.clear('history');

                    _this3.clear();

                    html.empty();

                    _this3.empty();
                  } else if (a.label) {
                    Storage.set('online_view', []);
                    Storage.set('torrents_view', []);
                    Noty.show(Lang.translate('fav_label_cleared'));
                  } else if (a.timecode) {
                    Storage.set('file_view', {});
                    Noty.show(Lang.translate('fav_time_cleared'));
                  } else {
                    Favorite.remove('history', card_data);
                    var index = items.indexOf(card);
                    if (index > 0) last = items[index - 1].render()[0];else if (items[index + 1]) last = items[index + 1].render()[0];
                    Arrays.remove(items, card);
                    card.destroy();

                    if (!items.length) {
                      _this3.clear();

                      html.empty();

                      _this3.empty();
                    }
                  }

                  Controller.toggle(enabled);
                }
              });
            };
          }

          card.visible();
          body.append(card.render());
          if (append) Controller.collectionAppend(card.render());
          items.push(card);
        });
      };

      this.build = function (data) {
        total_pages = data.total_pages;

        if (Storage.field('light_version')) {
          scroll.minus();
          html.append(scroll.render());
        } else {
          info = new create$d();
          info.create();
          scroll.minus();
          html.append(scroll.render());
        }

        this.append(data);
        if (total_pages > data.page && !info) this.more();
        scroll.append(body);
        this.activity.loader(false);
        this.activity.toggle();
        this.offer();
      };

      this.more = function () {
        var more = $('<div class="category-full__more selector"><span>' + Lang.translate('show_more') + '</span></div>');
        more.on('hover:focus', function (e) {
          Controller.collectionFocus(last || false, scroll.render());
          var next = Arrays.clone(object);
          delete next.activity;
          next.page++;
          Activity$1.push(next);
        });
        body.append(more);
      };

      this.start = function () {
        var _this4 = this;

        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());

            _this4.again();
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.clear = function () {
        network.clear();
        Arrays.destroy(items);
        items = [];
        if (scroll) scroll.destroy();
        if (info) info.destroy();
        scroll = null;
        info = null;
      };

      this.destroy = function () {
        this.clear();
        html.remove();
        body.remove();
        clearTimeout(timer_offer);
        Storage.listener.remove('change', update); //Account.listener.remove('update_bookmarks',update)

        network = null;
        items = null;
        html = null;
        body = null;
        info = null;
      };
    }

    function create$5() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var html = Template$1.get('files', params.movie);
      html.addClass('layer--width');

      if (params.movie.id) {
        html.find('.selector').on('hover:enter', function () {
          if (Activity$1.all().length > 1) {
            Activity$1.back();
          } else {
            Activity$1.push({
              url: params.movie.url,
              component: 'full',
              id: params.movie.id,
              method: params.movie.name ? 'tv' : 'movie',
              card: params.movie,
              source: params.movie.source
            });
          }
        });
      } else {
        html.find('.selector').removeClass('selector');
      }

      this.render = function () {
        return html;
      };

      this.append = function (add) {
        html.find('.files__body').append(add);
      };

      this.destroy = function () {
        html.remove();
        html = null;
      };

      this.clear = function () {
        html.find('.files__body').empty();
      };
    }

    function create$4() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var search = Template$1.get('search_box');
      var input = '';

      function destroy() {
        $('body').toggleClass('ambience--enable', false);
        keyboard.destroy();
        search.remove();
        search = null;
      }

      function back() {
        destroy();
        params.onBack();
      }

      function enter() {
        destroy();
        params.onSearch(input);
      }

      function change(text) {
        input = text.trim();

        if (input) {
          search.find('.search-box__input').text(input);
        } else {
          search.find('.search-box__input').text(Lang.translate('search_input') + '...');
        }
      }

      if (Storage.field('keyboard_type') !== 'lampa') search.find('.search-box__input').hide();
      $('body').append(search);
      $('body').toggleClass('ambience--enable', true);
      var keyboard = new create({
        layout: 'clarify'
      });
      keyboard.create();
      keyboard.listener.follow('change', function (event) {
        change(event.value);
      });
      keyboard.listener.follow('back', back);
      keyboard.listener.follow('enter', enter);
      keyboard.value(params.input);
      change(params.input);
      keyboard.toggle();
    }

    function create$3() {
      var _this2 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var line = Template$1.get('filter').addClass('torrent-filter');
      var empty = $('<div class="empty__footer"><div class="simple-button selector">' + Lang.translate('filter_clarify_two') + '</div></div>');
      var data = {
        sort: [],
        filter: []
      };
      var similars = [];
      var buttons_scroll = new create$o({
        horizontal: true,
        nopadding: true
      });

      function selectSearch() {
        var _this = this;

        var search = [];
        var year = ((params.movie ? params.movie.first_air_date || params.movie.release_date : '0000') + '').slice(0, 4);
        search.push({
          title: Lang.translate('filter_set_name'),
          query: ''
        });
        search.push({
          title: Lang.translate('filter_combinations'),
          separator: true
        });

        if (similars.length) {
          similars.forEach(function (sim) {
            search.push({
              title: sim,
              query: sim
            });
          });
        } else {
          var combinations = [];

          if (params.search_one) {
            combinations.push(params.search_one);
            combinations.push(params.search_one + ' ' + year);

            if (params.search_two) {
              combinations.push(params.search_one + ' ' + params.search_two);
              combinations.push(params.search_one + ' ' + params.search_two + ' ' + year);
            }
          }

          if (params.search_two) {
            combinations.push(params.search_two);
            combinations.push(params.search_two + ' ' + year);

            if (params.search_one) {
              combinations.push(params.search_two + ' ' + params.search_one);
              combinations.push(params.search_two + ' ' + params.search_one + ' ' + year);
            }
          }

          combinations.forEach(function (word) {
            search.push({
              title: word,
              query: word
            });
          });
        }

        search.forEach(function (elem) {
          elem.selected = elem.query == params.search;
        });
        Select.show({
          title: Lang.translate('filter_clarify'),
          items: search,
          onBack: this.onBack,
          onSelect: function onSelect(a) {
            if (!a.query) {
              new create$4({
                input: params.search,
                onSearch: _this.onSearch,
                onBack: _this.onBack
              });
            } else {
              _this.onSearch(a.query);
            }
          }
        });
      }

      empty.on('hover:enter', selectSearch.bind(this));
      line.find('.filter--search').on('hover:enter', selectSearch.bind(this));
      line.find('.filter--sort').on('hover:enter', function () {
        _this2.show(Lang.translate('filter_sorted'), 'sort');
      });
      line.find('.filter--filter').on('hover:enter', function () {
        _this2.show(Lang.translate('filter_filtred'), 'filter');
      });
      buttons_scroll.append(line);

      this.show = function (title, type) {
        var _this3 = this;

        var where = data[type];
        Select.show({
          title: title,
          items: where,
          onBack: this.onBack,
          onSelect: function onSelect(a) {
            _this3.selected(where, a);

            if (a.items) {
              Select.show({
                title: a.title,
                items: a.items,
                onBack: function onBack() {
                  _this3.show(title, type);
                },
                onSelect: function onSelect(b) {
                  _this3.selected(a.items, b);

                  _this3.onSelect(type, a, b);

                  _this3.show(title, type);
                },
                onCheck: function onCheck(b) {
                  _this3.onCheck(type, a, b);
                }
              });
            } else {
              _this3.onSelect(type, a);
            }
          }
        });
      };

      this.selected = function (items, a) {
        items.forEach(function (element) {
          element.selected = false;
        });
        a.selected = true;
      };

      this.render = function () {
        return buttons_scroll.render();
      };

      this.append = function (add) {
        html.find('.files__body').append(add);
      };

      this.empty = function () {
        return empty;
      };

      this.toggle = function () {
        line.find('.filter--sort').toggleClass('selector', data.sort.length ? true : false).toggleClass('hide', data.sort.length ? false : true);
        line.find('.filter--filter').toggleClass('selector', data.filter.length ? true : false).toggleClass('hide', data.filter.length ? false : true);
      };

      this.set = function (type, items) {
        data[type] = items;
        this.toggle();
      };

      this.get = function (type) {
        return data[type];
      };

      this.similar = function (sim) {
        similars = sim;
        return empty;
      };

      this.sort = function (items, by) {
        items.sort(function (c, b) {
          if (c[by] < b[by]) return 1;
          if (c[by] > b[by]) return -1;
          return 0;
        });
      };

      this.chosen = function (type, select) {
        line.find('.filter--' + type + ' > div').text(Utils.substr(select.join(', '), 50)).toggleClass('hide', select.length ? false : true);
      };

      this.destroy = function () {
        empty.remove();
        line.remove();
        buttons_scroll.destroy();
        empty = null;
        line = null;
        data = null;
      };
    }

    function component$8(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true
      });
      var files = new create$5(object);
      var filter = new create$3(object);
      var results = [];
      var filtred = [];
      var total_pages = 1;
      var count = 0;
      var last;
      var last_filter;
      var filter_items = {
        quality: [Lang.translate('torrent_parser_any_one'), '4k', '1080p', '720p'],
        hdr: [Lang.translate('torrent_parser_no_choice'), Lang.translate('torrent_parser_yes'), Lang.translate('torrent_parser_no')],
        sub: [Lang.translate('torrent_parser_no_choice'), Lang.translate('torrent_parser_yes'), Lang.translate('torrent_parser_no')],
        voice: [],
        tracker: [Lang.translate('torrent_parser_any_two')],
        year: [Lang.translate('torrent_parser_any_two')]
      };
      var filter_translate = {
        quality: Lang.translate('torrent_parser_quality'),
        hdr: 'HDR',
        sub: Lang.translate('torrent_parser_subs'),
        voice: Lang.translate('torrent_parser_voice'),
        tracker: Lang.translate('torrent_parser_tracker'),
        year: Lang.translate('torrent_parser_year'),
        season: Lang.translate('torrent_parser_season')
      };
      var filter_multiple = ['quality', 'voice', 'tracker', 'season'];
      var sort_translate = {
        Seeders: Lang.translate('torrent_parser_sort_by_seeders'),
        Size: Lang.translate('torrent_parser_sort_by_size'),
        Title: Lang.translate('torrent_parser_sort_by_name'),
        Tracker: Lang.translate('torrent_parser_sort_by_tracker'),
        PublisTime: Lang.translate('torrent_parser_sort_by_date'),
        viewed: Lang.translate('torrent_parser_sort_by_viewed')
      };
      var i = 20,
          y = new Date().getFullYear();

      while (i--) {
        filter_items.year.push(y - (19 - i) + '');
      }

      var viewed = Storage.cache('torrents_view', 5000, []);
      var finded_seasons = [];
      var finded_seasons_full = [];
      var voices = ["Laci", "Kerob", "LE-Production", "Parovoz Production", "Paradox", "Omskbird", "LostFilm", "Причудики", "BaibaKo", "NewStudio", "AlexFilm", "FocusStudio", "Gears Media", "Jaskier", "ViruseProject", "Кубик в Кубе", "IdeaFilm", "Sunshine Studio", "Ozz.tv", "Hamster Studio", "Сербин", "To4ka", "Кравец", "Victory-Films", "SNK-TV", "GladiolusTV", "Jetvis Studio", "ApofysTeam", "ColdFilm", "Agatha Studdio", "KinoView", "Jimmy J.", "Shadow Dub Project", "Amedia", "Red Media", "Selena International", "Гоблин", "Universal Russia", "Kiitos", "Paramount Comedy", "Кураж-Бамбей", "Студия Пиратского Дубляжа", "Чадов", "Карповский", "RecentFilms", "Первый канал", "Alternative Production", "NEON Studio", "Колобок", "Дольский", "Синема УС", "Гаврилов", "Живов", "SDI Media", "Алексеев", "GreenРай Studio", "Михалев", "Есарев", "Визгунов", "Либергал", "Кузнецов", "Санаев", "ДТВ", "Дохалов", "Sunshine Studio", "Горчаков", "LevshaFilm", "CasStudio", "Володарский", "ColdFilm", "Шварко", "Карцев", "ETV+", "ВГТРК", "Gravi-TV", "1001cinema", "Zone Vision Studio", "Хихикающий доктор", "Murzilka", "turok1990", "FOX", "STEPonee", "Elrom", "Колобок", "HighHopes", "SoftBox", "GreenРай Studio", "NovaFilm", "Четыре в квадрате", "Greb&Creative", "MUZOBOZ", "ZM-Show", "RecentFilms", "Kerems13", "Hamster Studio", "New Dream Media", "Игмар", "Котов", "DeadLine Studio", "Jetvis Studio", "РенТВ", "Андрей Питерский", "Fox Life", "Рыбин", "Trdlo.studio", "Studio Victory Аsia", "Ozeon", "НТВ", "CP Digital", "AniLibria", "STEPonee", "Levelin", "FanStudio", "Cmert", "Интерфильм", "SunshineStudio", "Kulzvuk Studio", "Кашкин", "Вартан Дохалов", "Немахов", "Sedorelli", "СТС", "Яроцкий", "ICG", "ТВЦ", "Штейн", "AzOnFilm", "SorzTeam", "Гаевский", "Мудров", "Воробьев Сергей", "Студия Райдо", "DeeAFilm Studio", "zamez", "ViruseProject", "Иванов", "STEPonee", "РенТВ", "СВ-Дубль", "BadBajo", "Комедия ТВ", "Мастер Тэйп", "5-й канал СПб", "SDI Media", "Гланц", "Ох! Студия", "СВ-Кадр", "2x2", "Котова", "Позитив", "RusFilm", "Назаров", "XDUB Dorama", "Реальный перевод", "Kansai", "Sound-Group", "Николай Дроздов", "ZEE TV", "Ozz.tv", "MTV", "Сыендук", "GoldTeam", "Белов", "Dream Records", "Яковлев", "Vano", "SilverSnow", "Lord32x", "Filiza Studio", "Sony Sci-Fi", "Flux-Team", "NewStation", "XDUB Dorama", "Hamster Studio", "Dream Records", "DexterTV", "ColdFilm", "Good People", "RusFilm", "Levelin", "AniDUB", "SHIZA Project", "AniLibria.TV", "StudioBand", "AniMedia", "Kansai", "Onibaku", "JWA Project", "MC Entertainment", "Oni", "Jade", "Ancord", "ANIvoice", "Nika Lenina", "Bars MacAdams", "JAM", "Anika", "Berial", "Kobayashi", "Cuba77", "RiZZ_fisher", "OSLIKt", "Lupin", "Ryc99", "Nazel & Freya", "Trina_D", "JeFerSon", "Vulpes Vulpes", "Hamster", "KinoGolos", "Fox Crime", "Денис Шадинский", "AniFilm", "Rain Death", "LostFilm", "New Records", "Ancord", "Первый ТВЧ", "RG.Paravozik", "Profix Media", "Tycoon", "RealFake", "HDrezka", "Jimmy J.", "AlexFilm", "Discovery", "Viasat History", "AniMedia", "JAM", "HiWayGrope", "Ancord", "СВ-Дубль", "Tycoon", "SHIZA Project", "GREEN TEA", "STEPonee", "AlphaProject", "AnimeReactor", "Animegroup", "Shachiburi", "Persona99", "3df voice", "CactusTeam", "AniMaunt", "AniMedia", "AnimeReactor", "ShinkaDan", "Jaskier", "ShowJet", "RAIM", "RusFilm", "Victory-Films", "АрхиТеатр", "Project Web Mania", "ko136", "КураСгречей", "AMS", "СВ-Студия", "Храм Дорам ТВ", "TurkStar", "Медведев", "Рябов", "BukeDub", "FilmGate", "FilmsClub", "Sony Turbo", "ТВЦ", "AXN Sci-Fi", "NovaFilm", "DIVA Universal", "Курдов", "Неоклассика", "fiendover", "SomeWax", "Логинофф", "Cartoon Network", "Sony Turbo", "Loginoff", "CrezaStudio", "Воротилин", "LakeFilms", "Andy", "CP Digital", "XDUB Dorama + Колобок", "SDI Media", "KosharaSerials", "Екатеринбург Арт", "Julia Prosenuk", "АРК-ТВ Studio", "Т.О Друзей", "Anifilm", "Animedub", "AlphaProject", "Paramount Channel", "Кириллица", "AniPLague", "Видеосервис", "JoyStudio", "HighHopes", "TVShows", "AniFilm", "GostFilm", "West Video", "Формат AB", "Film Prestige", "West Video", "Екатеринбург Арт", "SovetRomantica", "РуФилмс", "AveBrasil", "Greb&Creative", "BTI Studios", "Пифагор", "Eurochannel", "NewStudio", "Кармен Видео", "Кошкин", "Кравец", "Rainbow World", "Воротилин", "Варус-Видео", "ClubFATE", "HiWay Grope", "Banyan Studio", "Mallorn Studio", "Asian Miracle Group", "Эй Би Видео", "AniStar", "Korean Craze", "LakeFilms", "Невафильм", "Hallmark", "Netflix", "Mallorn Studio", "Sony Channel", "East Dream", "Bonsai Studio", "Lucky Production", "Octopus", "TUMBLER Studio", "CrazyCatStudio", "Amber", "Train Studio", "Анастасия Гайдаржи", "Мадлен Дюваль", "Fox Life", "Sound Film", "Cowabunga Studio", "Фильмэкспорт", "VO-Production", "Sound Film", "Nickelodeon", "MixFilm", "GreenРай Studio", "Sound-Group", "Back Board Cinema", "Кирилл Сагач", "Bonsai Studio", "Stevie", "OnisFilms", "MaxMeister", "Syfy Universal", "TUMBLER Studio", "NewStation", "Neo-Sound", "Муравский", "IdeaFilm", "Рутилов", "Тимофеев", "Лагута", "Дьяконов", "Zone Vision Studio", "Onibaku", "AniMaunt", "Voice Project", "AniStar", "Пифагор", "VoicePower", "StudioFilms", "Elysium", "AniStar", "BeniAffet", "Selena International", "Paul Bunyan", "CoralMedia", "Кондор", "Игмар", "ViP Premiere", "FireDub", "AveTurk", "Sony Sci-Fi", "Янкелевич", "Киреев", "Багичев", "2x2", "Лексикон", "Нота", "Arisu", "Superbit", "AveDorama", "VideoBIZ", "Киномания", "DDV", "Alternative Production", "WestFilm", "Анастасия Гайдаржи + Андрей Юрченко", "Киномания", "Agatha Studdio", "GreenРай Studio", "VSI Moscow", "Horizon Studio", "Flarrow Films", "Amazing Dubbing", "Asian Miracle Group", "Видеопродакшн", "VGM Studio", "FocusX", "CBS Drama", "NovaFilm", "Novamedia", "East Dream", "Дасевич", "Анатолий Гусев", "Twister", "Морозов", "NewComers", "kubik&ko", "DeMon", "Анатолий Ашмарин", "Inter Video", "Пронин", "AMC", "Велес", "Volume-6 Studio", "Хоррор Мэйкер", "Ghostface", "Sephiroth", "Акира", "Деваль Видео", "RussianGuy27", "neko64", "Shaman", "Franek Monk", "Ворон", "Andre1288", "Selena International", "GalVid", "Другое кино", "Студия NLS", "Sam2007", "HaseRiLLoPaW", "Севастьянов", "D.I.M.", "Марченко", "Журавлев", "Н-Кино", "Lazer Video", "SesDizi", "Red Media", "Рудой", "Товбин", "Сергей Дидок", "Хуан Рохас", "binjak", "Карусель", "Lizard Cinema", "Варус-Видео", "Акцент", "RG.Paravozik", "Max Nabokov", "Barin101", "Васька Куролесов", "Фортуна-Фильм", "Amalgama", "AnyFilm", "Студия Райдо", "Козлов", "Zoomvision Studio", "Пифагор", "Urasiko", "VIP Serial HD", "НСТ", "Кинолюкс", "Project Web Mania", "Завгородний", "AB-Video", "Twister", "Universal Channel", "Wakanim", "SnowRecords", "С.Р.И", "Старый Бильбо", "Ozz.tv", "Mystery Film", "РенТВ", "Латышев", "Ващенко", "Лайко", "Сонотек", "Psychotronic", "DIVA Universal", "Gremlin Creative Studio", "Нева-1", "Максим Жолобов", "Good People", "Мобильное телевидение", "Lazer Video", "IVI", "DoubleRec", "Milvus", "RedDiamond Studio", "Astana TV", "Никитин", "КТК", "D2Lab", "НСТ", "DoubleRec", "Black Street Records", "Останкино", "TatamiFilm", "Видеобаза", "Crunchyroll", "Novamedia", "RedRussian1337", "КонтентикOFF", "Creative Sound", "HelloMickey Production", "Пирамида", "CLS Media", "Сонькин", "Мастер Тэйп", "Garsu Pasaulis", "DDV", "IdeaFilm", "Gold Cinema", "Че!", "Нарышкин", "Intra Communications", "OnisFilms", "XDUB Dorama", "Кипарис", "Королёв", "visanti-vasaer", "Готлиб", "Paramount Channel", "СТС", "диктор CDV", "Pazl Voice", "Прямостанов", "Zerzia", "НТВ", "MGM", "Дьяков", "Вольга", "АРК-ТВ Studio", "Дубровин", "МИР", "Netflix", "Jetix", "Кипарис", "RUSCICO", "Seoul Bay", "Филонов", "Махонько", "Строев", "Саня Белый", "Говинда Рага", "Ошурков", "Horror Maker", "Хлопушка", "Хрусталев", "Антонов Николай", "Золотухин", "АрхиАзия", "Попов", "Ultradox", "Мост-Видео", "Альтера Парс", "Огородников", "Твин", "Хабар", "AimaksaLTV", "ТНТ", "FDV", "3df voice", "The Kitchen Russia", "Ульпаней Эльром", "Видеоимпульс", "GoodTime Media", "Alezan", "True Dubbing Studio", "FDV", "Карусель", "Интер", "Contentica", "Мельница", "RealFake", "ИДДК", "Инфо-фильм", "Мьюзик-трейд", "Кирдин | Stalk", "ДиоНиК", "Стасюк", "TV1000", "Hallmark", "Тоникс Медиа", "Бессонов", "Gears Media", "Бахурани", "NewDub", "Cinema Prestige", "Набиев", "New Dream Media", "ТВ3", "Малиновский Сергей", "Superbit", "Кенс Матвей", "LE-Production", "Voiz", "Светла", "Cinema Prestige", "JAM", "LDV", "Videogram", "Индия ТВ", "RedDiamond Studio", "Герусов", "Элегия фильм", "Nastia", "Семыкина Юлия", "Электричка", "Штамп Дмитрий", "Пятница", "Oneinchnales", "Gravi-TV", "D2Lab", "Кинопремьера", "Бусов Глеб", "LE-Production", "1001cinema", "Amazing Dubbing", "Emslie", "1+1", "100 ТВ", "1001 cinema", "2+2", "2х2", "3df voice", "4u2ges", "5 канал", "A. Lazarchuk", "AAA-Sound", "AB-Video", "AdiSound", "ALEKS KV", "AlexFilm", "AlphaProject", "Alternative Production", "Amalgam", "AMC", "Amedia", "AMS", "Andy", "AniLibria", "AniMedia", "Animegroup", "Animereactor", "AnimeSpace Team", "Anistar", "AniUA", "AniWayt", "Anything-group", "AOS", "Arasi project", "ARRU Workshop", "AuraFilm", "AvePremier", "AveTurk", "AXN Sci-Fi", "Azazel", "AzOnFilm", "BadBajo", "BadCatStudio", "BBC Saint-Petersburg", "BD CEE", "Black Street Records", "Bonsai Studio", "Boльгa", "Brain Production", "BraveSound", "BTI Studios", "Bubble Dubbing Company", "Byako Records", "Cactus Team", "Cartoon Network", "CBS Drama", "CDV", "Cinema Prestige", "CinemaSET GROUP", "CinemaTone", "ColdFilm", "Contentica", "CP Digital", "CPIG", "Crunchyroll", "Cuba77", "D1", "D2lab", "datynet", "DDV", "DeadLine", "DeadSno", "DeMon", "den904", "Description", "DexterTV", "Dice", "Discovery", "DniproFilm", "DoubleRec", "DreamRecords", "DVD Classic", "East Dream", "Eladiel", "Elegia", "ELEKTRI4KA", "Elrom", "ELYSIUM", "Epic Team", "eraserhead", "erogg", "Eurochannel", "Extrabit", "F-TRAIN", "Family Fan Edition", "FDV", "FiliZa Studio", "Film Prestige", "FilmGate", "FilmsClub", "FireDub", "Flarrow Films", "Flux-Team", "FocusStudio", "FOX", "Fox Crime", "Fox Russia", "FoxLife", "Foxlight", "Franek Monk", "Gala Voices", "Garsu Pasaulis", "Gears Media", "Gemini", "General Film", "GetSmart", "Gezell Studio", "Gits", "GladiolusTV", "GoldTeam", "Good People", "Goodtime Media", "GoodVideo", "GostFilm", "Gramalant", "Gravi-TV", "GREEN TEA", "GreenРай Studio", "Gremlin Creative Studio", "Hallmark", "HamsterStudio", "HiWay Grope", "Horizon Studio", "hungry_inri", "ICG", "ICTV", "IdeaFilm", "IgVin &amp; Solncekleshka", "ImageArt", "INTERFILM", "Ivnet Cinema", "IНТЕР", "Jakob Bellmann", "JAM", "Janetta", "Jaskier", "JeFerSon", "jept", "JetiX", "Jetvis", "JimmyJ", "KANSAI", "KIHO", "kiitos", "KinoGolos", "Kinomania", "KosharaSerials", "Kолобок", "L0cDoG", "LakeFilms", "LDV", "LE-Production", "LeDoyen", "LevshaFilm", "LeXiKC", "Liga HQ", "Line", "Lisitz", "Lizard Cinema Trade", "Lord32x", "lord666", "LostFilm", "Lucky Production", "Macross", "madrid", "Mallorn Studio", "Marclail", "Max Nabokov", "MC Entertainment", "MCA", "McElroy", "Mega-Anime", "Melodic Voice Studio", "metalrus", "MGM", "MifSnaiper", "Mikail", "Milirina", "MiraiDub", "MOYGOLOS", "MrRose", "MTV", "Murzilka", "MUZOBOZ", "National Geographic", "NemFilm", "Neoclassica", "NEON Studio", "New Dream Media", "NewComers", "NewStation", "NewStudio", "Nice-Media", "Nickelodeon", "No-Future", "NovaFilm", "Novamedia", "Octopus", "Oghra-Brown", "OMSKBIRD", "Onibaku", "OnisFilms", "OpenDub", "OSLIKt", "Ozz TV", "PaDet", "Paramount Comedy", "Paramount Pictures", "Parovoz Production", "PashaUp", "Paul Bunyan", "Pazl Voice", "PCB Translate", "Persona99", "PiratVoice", "Postmodern", "Profix Media", "Project Web Mania", "Prolix", "QTV", "R5", "Radamant", "RainDeath", "RATTLEBOX", "RealFake", "Reanimedia", "Rebel Voice", "RecentFilms", "Red Media", "RedDiamond Studio", "RedDog", "RedRussian1337", "Renegade Team", "RG Paravozik", "RinGo", "RoxMarty", "Rumble", "RUSCICO", "RusFilm", "RussianGuy27", "Saint Sound", "SakuraNight", "Satkur", "Sawyer888", "Sci-Fi Russia", "SDI Media", "Selena", "seqw0", "SesDizi", "SGEV", "Shachiburi", "SHIZA", "ShowJet", "Sky Voices", "SkyeFilmTV", "SmallFilm", "SmallFilm", "SNK-TV", "SnowRecords", "SOFTBOX", "SOLDLUCK2", "Solod", "SomeWax", "Sony Channel", "Sony Turbo", "Sound Film", "SpaceDust", "ssvss", "st.Elrom", "STEPonee", "SunshineStudio", "Superbit", "Suzaku", "sweet couple", "TatamiFilm", "TB5", "TF-AniGroup", "The Kitchen Russia", "The Mike Rec.", "Timecraft", "To4kaTV", "Tori", "Total DVD", "TrainStudio", "Troy", "True Dubbing Studio", "TUMBLER Studio", "turok1990", "TV 1000", "TVShows", "Twister", "Twix", "Tycoon", "Ultradox", "Universal Russia", "VashMax2", "VendettA", "VHS", "VicTeam", "VictoryFilms", "Video-BIZ", "Videogram", "ViruseProject", "visanti-vasaer", "VIZ Media", "VO-production", "Voice Project Studio", "VoicePower", "VSI Moscow", "VulpesVulpes", "Wakanim", "Wayland team", "WestFilm", "WiaDUB", "WVoice", "XL Media", "XvidClub Studio", "zamez", "ZEE TV", "Zendos", "ZM-SHOW", "Zone Studio", "Zone Vision", "Агапов", "Акопян", "Алексеев", "Артемьев", "Багичев", "Бессонов", "Васильев", "Васильцев", "Гаврилов", "Герусов", "Готлиб", "Григорьев", "Дасевич", "Дольский", "Карповский", "Кашкин", "Киреев", "Клюквин", "Костюкевич", "Матвеев", "Михалев", "Мишин", "Мудров", "Пронин", "Савченко", "Смирнов", "Тимофеев", "Толстобров", "Чуев", "Шуваев", "Яковлев", "ААА-sound", "АБыГДе", "Акалит", "Акира", "Альянс", "Амальгама", "АМС", "АнВад", "Анубис", "Anubis", "Арк-ТВ", "АРК-ТВ Studio", "Б. Федоров", "Бибиков", "Бигыч", "Бойков", "Абдулов", "Белов", "Вихров", "Воронцов", "Горчаков", "Данилов", "Дохалов", "Котов", "Кошкин", "Назаров", "Попов", "Рукин", "Рутилов", "Варус Видео", "Васька Куролесов", "Ващенко С.", "Векшин", "Велес", "Весельчак", "Видеоимпульс", "Витя «говорун»", "Войсовер", "Вольга", "Ворон", "Воротилин", "Г. Либергал", "Г. Румянцев", "Гей Кино Гид", "ГКГ", "Глуховский", "Гризли", "Гундос", "Деньщиков", "Есарев", "Нурмухаметов", "Пучков", "Стасюк", "Шадинский", "Штамп", "sf@irat", "Держиморда", "Домашний", "ДТВ", "Дьяконов", "Е. Гаевский", "Е. Гранкин", "Е. Лурье", "Е. Рудой", "Е. Хрусталёв", "ЕА Синема", "Екатеринбург Арт", "Живаго", "Жучков", "З Ранку До Ночі", "Завгородний", "Зебуро", "Зереницын", "И. Еремеев", "И. Клушин", "И. Сафронов", "И. Степанов", "ИГМ", "Игмар", "ИДДК", "Имидж-Арт", "Инис", "Ирэн", "Ист-Вест", "К. Поздняков", "К. Филонов", "К9", "Карапетян", "Кармен Видео", "Карусель", "Квадрат Малевича", "Килька", "Кипарис", "Королев", "Котова", "Кравец", "Кубик в Кубе", "Кураж-Бамбей", "Л. Володарский", "Лазер Видео", "ЛанселаП", "Лапшин", "Лексикон", "Ленфильм", "Леша Прапорщик", "Лизард", "Люсьена", "Заугаров", "Иванов", "Иванова и П. Пашут", "Латышев", "Ошурков", "Чадов", "Яроцкий", "Максим Логинофф", "Малиновский", "Марченко", "Мастер Тэйп", "Махонько", "Машинский", "Медиа-Комплекс", "Мельница", "Мика Бондарик", "Миняев", "Мительман", "Мост Видео", "Мосфильм", "Муравский", "Мьюзик-трейд", "Н-Кино", "Н. Антонов", "Н. Дроздов", "Н. Золотухин", "Н.Севастьянов seva1988", "Набиев", "Наталья Гурзо", "НЕВА 1", "Невафильм", "НеЗупиняйПродакшн", "Неоклассика", "Несмертельное оружие", "НЛО-TV", "Новий", "Новый диск", "Новый Дубляж", "Новый Канал", "Нота", "НСТ", "НТВ", "НТН", "Оверлорд", "Огородников", "Омикрон", "Гланц", "Карцев", "Морозов", "Прямостанов", "Санаев", "Парадиз", "Пепелац", "Первый канал ОРТ", "Переводман", "Перец", "Петербургский дубляж", "Петербуржец", "Пирамида", "Пифагор", "Позитив-Мультимедиа", "Прайд Продакшн", "Премьер Видео", "Премьер Мультимедиа", "Причудики", "Р. Янкелевич", "Райдо", "Ракурс", "РенТВ", "Россия", "РТР", "Русский дубляж", "Русский Репортаж", "РуФилмс", "Рыжий пес", "С. Визгунов", "С. Дьяков", "С. Казаков", "С. Кузнецов", "С. Кузьмичёв", "С. Лебедев", "С. Макашов", "С. Рябов", "С. Щегольков", "С.Р.И.", "Сolumbia Service", "Самарский", "СВ Студия", "СВ-Дубль", "Светла", "Селена Интернешнл", "Синема Трейд", "Синема УС", "Синта Рурони", "Синхрон", "Советский", "Сокуров", "Солодухин", "Сонотек", "Сонькин", "Союз Видео", "Союзмультфильм", "СПД - Сладкая парочка", "Строев", "СТС", "Студии Суверенного Лепрозория", "Студия «Стартрек»", "KOleso", "Студия Горького", "Студия Колобок", "Студия Пиратского Дубляжа", "Студия Райдо", "Студия Трёх", "Гуртом", "Супербит", "Сыендук", "Так Треба Продакшн", "ТВ XXI век", "ТВ СПб", "ТВ-3", "ТВ6", "ТВИН", "ТВЦ", "ТВЧ 1", "ТНТ", "ТО Друзей", "Толмачев", "Точка Zрения", "Трамвай-фильм", "ТРК", "Уолт Дисней Компани", "Хихидок", "Хлопушка", "Цікава Ідея", "Четыре в квадрате", "Швецов", "Штамп", "Штейн", "Ю. Живов", "Ю. Немахов", "Ю. Сербин", "Ю. Товбин", "Я. Беллманн"];
      scroll.minus();
      scroll.body().addClass('torrent-list');

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Background.immediately(Utils.cardImgBackground(object.movie));
        Parser.get(object, function (data) {
          results = data;

          _this.build();

          _this.activity.loader(false);

          _this.activity.toggle();
        }, function (text) {
          _this.empty(Lang.translate('torrent_error_connect') + ': ' + text);
        });

        filter.onSearch = function (value) {
          Activity$1.replace({
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
        return this.render();
      };

      this.empty = function (descr) {
        var empty = new create$c({
          descr: descr
        });
        files.append(empty.render(filter.empty()));
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.listEmpty = function () {
        scroll.append(Template$1.get('list_empty'));
      };

      this.buildSorted = function () {
        var need = Storage.get('torrents_sort', 'Seeders');
        var select = [{
          title: Lang.translate('torrent_parser_sort_by_seeders'),
          sort: 'Seeders'
        }, {
          title: Lang.translate('torrent_parser_sort_by_size'),
          sort: 'Size'
        }, {
          title: Lang.translate('torrent_parser_sort_by_name'),
          sort: 'Title'
        }, {
          title: Lang.translate('torrent_parser_sort_by_tracker'),
          sort: 'Tracker'
        }, {
          title: Lang.translate('torrent_parser_sort_by_date'),
          sort: 'PublisTime'
        }, {
          title: Lang.translate('torrent_parser_sort_by_viewed'),
          sort: 'viewed'
        }];
        select.forEach(function (element) {
          if (element.sort == need) element.selected = true;
        });
        filter.sort(results.Results, need);
        this.sortWithPopular();
        filter.set('sort', select);
        this.selectedSort();
      };

      this.sortWithPopular = function () {
        var popular = [];
        var other = [];
        results.Results.forEach(function (a) {
          if (a.viewing_request) popular.push(a);else other.push(a);
        });
        popular.sort(function (a, b) {
          return b.viewing_average - a.viewing_average;
        });
        results.Results = popular.concat(other);
      };

      this.buildFilterd = function () {
        var need = Storage.get('torrents_filter', '{}');
        var select = [];

        var add = function add(type, title) {
          var items = filter_items[type];
          var subitems = [];
          var multiple = filter_multiple.indexOf(type) >= 0;
          var value = need[type];
          if (multiple) value = Arrays.toArray(value);
          items.forEach(function (name, i) {
            subitems.push({
              title: name,
              selected: multiple ? i == 0 : value == i,
              checked: multiple && value.indexOf(name) >= 0,
              checkbox: multiple && i > 0,
              index: i
            });
          });
          select.push({
            title: title,
            subtitle: multiple ? value.length ? value.join(', ') : items[0] : typeof value == 'undefined' ? items[0] : items[value],
            items: subitems,
            stype: type
          });
        };

        filter_items.voice = [Lang.translate('torrent_parser_any_two'), Lang.translate('torrent_parser_voice_dubbing'), Lang.translate('torrent_parser_voice_polyphonic'), Lang.translate('torrent_parser_voice_two'), Lang.translate('torrent_parser_voice_amateur')];
        filter_items.tracker = [Lang.translate('torrent_parser_any_two')];
        filter_items.season = [Lang.translate('torrent_parser_any_two')];
        results.Results.forEach(function (element) {
          var title = element.Title.toLowerCase(),
              tracker = element.Tracker;

          for (var _i = 0; _i < voices.length; _i++) {
            var voice = voices[_i].toLowerCase();

            if (title.indexOf(voice) >= 0) {
              if (filter_items.voice.indexOf(voices[_i]) == -1) filter_items.voice.push(voices[_i]);
            }
          }

          if (filter_items.tracker.indexOf(tracker) === -1) filter_items.tracker.push(tracker);
          var season = title.match(/.?s\[(\d+)-\].?|.?s(\d+).?|.?\((\d+) сезон.?|.?season (\d+),.?/);

          if (season) {
            season = season.filter(function (c) {
              return c;
            });

            if (season.length > 1) {
              var orig = season[1];
              var number = parseInt(orig) + '';

              if (number && finded_seasons.indexOf(number) == -1) {
                finded_seasons.push(number);
                finded_seasons_full.push(orig);
              }
            }
          }
        });
        finded_seasons_full.sort(function (a, b) {
          var ac = parseInt(a);
          var bc = parseInt(b);
          if (ac > bc) return 1;else if (ac < bc) return -1;else return 0;
        });
        finded_seasons.sort(function (a, b) {
          var ac = parseInt(a);
          var bc = parseInt(b);
          if (ac > bc) return 1;else if (ac < bc) return -1;else return 0;
        });
        if (finded_seasons.length) filter_items.season = filter_items.season.concat(finded_seasons); //надо очистить от отсутствующих ключей

        need.voice = Arrays.removeNoIncludes(Arrays.toArray(need.voice), filter_items.voice);
        need.tracker = Arrays.removeNoIncludes(Arrays.toArray(need.tracker), filter_items.tracker);
        need.season = Arrays.removeNoIncludes(Arrays.toArray(need.season), filter_items.season);
        Storage.set('torrents_filter', need);
        select.push({
          title: Lang.translate('torrent_parser_reset'),
          reset: true
        });
        add('quality', Lang.translate('torrent_parser_quality'));
        add('hdr', 'HDR');
        add('sub', Lang.translate('torrent_parser_subs'));
        add('voice', Lang.translate('torrent_parser_voice'));
        add('season', Lang.translate('torrent_parser_season'));
        add('tracker', Lang.translate('torrent_parser_tracker'));
        add('year', Lang.translate('torrent_parser_year'));
        filter.set('filter', select);
        this.selectedFilter();
      };

      this.selectedFilter = function () {
        var need = Storage.get('torrents_filter', '{}'),
            select = [];

        for (var _i2 in need) {
          if (need[_i2]) {
            if (Arrays.isArray(need[_i2])) {
              if (need[_i2].length) select.push(filter_translate[_i2] + ':' + need[_i2].join(', '));
            } else {
              select.push(filter_translate[_i2] + ': ' + filter_items[_i2][need[_i2]]);
            }
          }
        }

        filter.chosen('filter', select);
      };

      this.selectedSort = function () {
        var select = Storage.get('torrents_sort', 'Seeders');
        filter.chosen('sort', [sort_translate[select]]);
      };

      this.build = function () {
        var _this2 = this;

        this.buildSorted();
        this.buildFilterd();
        this.filtred();

        filter.onSelect = function (type, a, b) {
          if (type == 'sort') {
            Storage.set('torrents_sort', a.sort);
            filter.sort(results.Results, a.sort);

            _this2.sortWithPopular();
          } else {
            if (a.reset) {
              Storage.set('torrents_filter', '{}');

              _this2.buildFilterd();
            } else {
              var filter_data = Storage.get('torrents_filter', '{}');
              filter_data[a.stype] = filter_multiple.indexOf(a.stype) >= 0 ? [] : b.index;
              a.subtitle = b.title;
              Storage.set('torrents_filter', filter_data);
            }
          }

          _this2.applyFilter();

          _this2.start();
        };

        filter.onCheck = function (type, a, b) {
          var data = Storage.get('torrents_filter', '{}'),
              need = Arrays.toArray(data[a.stype]);
          if (b.checked && need.indexOf(b.title)) need.push(b.title);else if (!b.checked) Arrays.remove(need, b.title);
          data[a.stype] = need;
          Storage.set('torrents_filter', data);
          a.subtitle = need.join(', ');

          _this2.applyFilter();
        };

        if (results.Results.length) this.showResults();else {
          this.empty(Lang.translate('torrent_parser_empty'));
        }
      };

      this.applyFilter = function () {
        this.filtred();
        this.selectedFilter();
        this.selectedSort();
        this.reset();
        this.showResults();
        last = scroll.render().find('.torrent-item:eq(0)')[0];
      };

      this.filtred = function () {
        var filter_data = Storage.get('torrents_filter', '{}');
        var filter_any = false;

        for (var _i3 in filter_data) {
          var filr = filter_data[_i3];

          if (filr) {
            if (Arrays.isArray(filr)) {
              if (filr.length) filter_any = true;
            } else filter_any = true;
          }
        }

        filtred = results.Results.filter(function (element) {
          if (filter_any) {
            var passed = false,
                nopass = false,
                title = element.Title.toLowerCase(),
                tracker = element.Tracker;
            var qua = Arrays.toArray(filter_data.quality),
                hdr = filter_data.hdr,
                sub = filter_data.sub,
                voi = Arrays.toArray(filter_data.voice),
                tra = Arrays.toArray(filter_data.tracker),
                ses = Arrays.toArray(filter_data.season),
                yer = filter_data.year;

            var test = function test(search, test_index) {
              var regex = new RegExp(search);
              return test_index ? title.indexOf(search) >= 0 : regex.test(title);
            };

            var check = function check(search, invert) {
              if (test(search)) {
                if (invert) nopass = true;else passed = true;
              } else {
                if (invert) passed = true;else nopass = true;
              }
            };

            var includes = function includes(type, arr) {
              if (!arr.length) return;
              var any = false;
              arr.forEach(function (a) {
                if (type == 'quality') {
                  if (a == '4k' && test('(4k|uhd)[ |\\]|,|$]|2160[pр]|ultrahd')) any = true;
                  if (a == '1080p' && test('fullhd|1080[pр]')) any = true;
                  if (a == '720p' && test('720[pр]')) any = true;
                }

                if (type == 'voice') {
                  var p = filter_items.voice.indexOf(a);

                  if (p == 1) {
                    if (test('дублирован|дубляж|  apple| dub| d[,| |$]|[,|\\s]дб[,|\\s|$]')) any = true;
                  } else if (p == 2) {
                    if (test('многоголос| p[,| |$]|[,|\\s](лм|пм)[,|\\s|$]')) any = true;
                  } else if (p == 3) {
                    if (test('двухголос|двуголос| l2[,| |$]|[,|\\s](лд|пд)[,|\\s|$]')) any = true;
                  } else if (p == 4) {
                    if (test('любитель|авторский| l1[,| |$]|[,|\\s](ло|ап)[,|\\s|$]')) any = true;
                  } else if (test(a.toLowerCase(), true)) any = true;
                }

                if (type == 'tracker') {
                  if (tracker.toLowerCase() == a.toLowerCase()) any = true;
                }

                if (type == 'season') {
                  var pad = function pad(n) {
                    return n < 10 && n != '01' ? '0' + n : n;
                  };

                  var _i4 = finded_seasons.indexOf(a);

                  var f = finded_seasons_full[_i4];
                  var SES1 = title.match(/\[s(\d+)-(\d+)\]/);
                  var SES2 = title.match(/season (\d+)-(\d+)/);
                  var SES3 = title.match(/season (\d+) - (\d+).?/);
                  var SES4 = title.match(/сезон: (\d+)-(\d+) \/.?/);
                  if (Array.isArray(SES1) && (f >= SES1[1] && f <= SES1[2] || pad(f) >= SES1[1] && pad(f) <= SES1[2] || f >= pad(SES1[1]) && f <= pad(SES1[2]))) any = true;
                  if (Array.isArray(SES2) && (f >= SES2[1] && f <= SES2[2] || pad(f) >= SES2[1] && pad(f) <= SES2[2] || f >= pad(SES2[1]) && f <= pad(SES2[2]))) any = true;
                  if (Array.isArray(SES3) && (f >= SES3[1] && f <= SES3[2] || pad(f) >= SES3[1] && pad(f) <= SES3[2] || f >= pad(SES3[1]) && f <= pad(SES3[2]))) any = true;
                  if (Array.isArray(SES4) && (f >= SES4[1] && f <= SES4[2] || pad(f) >= SES4[1] && pad(f) <= SES4[2] || f >= pad(SES4[1]) && f <= pad(SES4[2]))) any = true;
                  if (test('.?\\[0' + f + 'x0.?|.?\\[s' + f + '-.?|.?-' + f + '\\].?|.?\\[s0' + f + '\\].?|.?\\[s' + f + '\\].?|.?s' + f + 'e.?|.?s' + f + '-.?|.?сезон: ' + f + ' .?|.?сезон:' + f + '.?|сезон ' + f + ',.?|\\[' + f + ' сезон.?|.?\\(' + f + ' сезон.?|.?season ' + f + '.?')) any = true;
                }
              });
              if (any) passed = true;else nopass = true;
            };

            includes('quality', qua);
            includes('voice', voi);
            includes('tracker', tra);
            includes('season', ses);

            if (hdr) {
              if (hdr == 1) check('[\\[| ]hdr[10| |\\]|,|$]');else check('[\\[| ]hdr[10| |\\]|,|$]', true);
            }

            if (sub) {
              if (sub == 1) check(' sub|[,|\\s]ст[,|\\s|$]');else check(' sub|[,|\\s]ст[,|\\s|$]', true);
            }

            if (yer) {
              check(filter_items.year[yer]);
            }

            return nopass ? false : passed;
          } else return true;
        });
      };

      this.showResults = function () {
        total_pages = Math.ceil(filtred.length / 20);
        filter.render();
        scroll.append(filter.render());

        if (filtred.length) {
          this.append(filtred.slice(0, 20));
        } else {
          this.listEmpty();
        }

        files.append(scroll.render());
      };

      this.reset = function () {
        last = false;
        filter.render().detach();
        scroll.clear();
      };

      this.next = function () {
        if (object.page < 15 && object.page < total_pages) {
          object.page++;
          var offset = (object.page - 1) * 20;
          this.append(filtred.slice(offset, offset + 20));
          Controller.enable('content');
        }
      };

      this.loadMagnet = function (element, call) {
        var _this3 = this;

        Parser.marnet(element, function () {
          Modal.close();
          element.poster = object.movie.img;

          _this3.start();

          if (call) call();else Torrent.start(element, object.movie);
        }, function (text) {
          Modal.update(Template$1.get('error', {
            title: Lang.translate('title_error'),
            text: text
          }));
        });
        Modal.open({
          title: '',
          html: Template$1.get('modal_pending', {
            text: Lang.translate('torrent_get_magnet')
          }),
          onBack: function onBack() {
            Modal.close();
            network.clear();
            Controller.toggle('content');
          }
        });
      };

      this.mark = function (element, item, add) {
        if (add) {
          if (viewed.indexOf(element.hash) == -1) {
            viewed.push(element.hash);
            item.append('<div class="torrent-item__viewed">' + Template$1.get('icon_star', {}, true) + '</div>');
          }
        } else {
          element.viewed = true;
          Arrays.remove(viewed, element.hash);
          item.find('.torrent-item__viewed').remove();
        }

        element.viewed = add;
        Storage.set('torrents_view', viewed);
      };

      this.addToBase = function (element) {
        Torserver.add({
          poster: object.movie.img,
          title: object.movie.title + ' / ' + object.movie.original_title,
          link: element.MagnetUri || element.Link,
          data: {
            lampa: true,
            movie: object.movie
          }
        }, function () {
          Noty.show(object.movie.title + ' - ' + Lang.translate('torrent_parser_added_to_mytorrents'));
        });
      };

      this.append = function (items) {
        var _this4 = this;

        items.forEach(function (element) {
          count++;
          var date = Utils.parseTime(element.PublishDate);
          var pose = count;
          var bitrate = object.movie.runtime ? Utils.calcBitrate(element.Size, object.movie.runtime) : 0;
          Arrays.extend(element, {
            title: element.Title,
            date: date.full,
            tracker: element.Tracker,
            bitrate: bitrate,
            size: element.Size ? Utils.bytesToSize(element.Size) : element.size,
            seeds: element.Seeders,
            grabs: element.Peers
          });
          var item = Template$1.get('torrent', element);
          if (!bitrate) item.find('.bitrate').remove();
          if (element.viewed) item.append('<div class="torrent-item__viewed">' + Template$1.get('icon_star', {}, true) + '</div>');

          if (element.viewing_request) {
            item.addClass('torrent-item--popular');
            var time_min = Infinity;
            var time_max = 0;
            var time_avr = Utils.secondsToTimeHuman(element.viewing_average);
            element.viewing_times.forEach(function (m) {
              time_min = Math.min(time_min, m);
              time_max = Math.max(time_max, m);
            });
            time_min = Utils.secondsToTimeHuman(time_min);
            time_max = Utils.secondsToTimeHuman(time_max);
            var details = $("<div class=\"torrent-item__stat\">\n                    <div>\u0421\u0440\u0435\u0434\u043D\u0435\u0435: ".concat(time_avr, "</div>\n                    <div>\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435: ").concat(time_min, "</div>\n                    <div>\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435: ").concat(time_max, "</div>\n                    <div>\u0417\u0430\u043F\u0440\u043E\u0441\u043E\u0432: ").concat(element.viewing_request, "</div>\n                </div>"));
            item.append(details);
          }

          item.on('hover:focus', function (e) {
            last = e.target;
            scroll.update($(e.target), true);
            if (pose > object.page * 20 - 4) _this4.next();
            Helper.show('torrents', Lang.translate('helper_torrents'), item);
          }).on('hover:enter', function () {
            Torrent.opened(function () {
              _this4.mark(element, item, true);
            });

            if (element.reguest && !element.MagnetUri) {
              _this4.loadMagnet(element);
            } else {
              element.poster = object.movie.img;

              _this4.start();

              Torrent.start(element, object.movie);
            }
          }).on('hover:long', function () {
            var enabled = Controller.enabled().name;
            Select.show({
              title: Lang.translate('title_action'),
              items: [{
                title: Lang.translate('torrent_parser_add_to_mytorrents'),
                tomy: true
              }, {
                title: Lang.translate('torrent_parser_label_title'),
                subtitle: Lang.translate('torrent_parser_label_descr'),
                mark: true
              }, {
                title: Lang.translate('torrent_parser_label_cancel_title'),
                subtitle: Lang.translate('torrent_parser_label_cancel_descr')
              }],
              onBack: function onBack() {
                Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                if (a.tomy) {
                  if (element.reguest && !element.MagnetUri) {
                    _this4.loadMagnet(element, function () {
                      _this4.addToBase(element);
                    });
                  } else _this4.addToBase(element);
                } else if (a.mark) {
                  _this4.mark(element, item, true);
                } else {
                  _this4.mark(element, item, false);
                }

                Controller.toggle(enabled);
              }
            });
          });
          scroll.append(item);
        });
      };

      this.back = function () {
        Activity$1.backward();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render(), files.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          up: function up() {
            if (Navigator.canmove('up')) {
              if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
                Controller.collectionFocus(last_filter, scroll.render());
              } else Navigator.move('up');
            } else Controller.toggle('head');
          },
          down: function down() {
            Navigator.move('down');
          },
          right: function right() {
            if (Navigator.canmove('right')) Navigator.move('right');else filter.render().find('.filter--filter').trigger('hover:enter');
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          back: this.back
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return files.render();
      };

      this.destroy = function () {
        network.clear();
        Parser.clear();
        files.destroy();
        scroll.destroy();
        results = null;
        network = null;
      };
    }

    function component$7(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var total_pages = 0;
      var last;
      var torrents = [];

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Torserver.my(this.build.bind(this), function () {
          var empty = new create$c();
          html.append(empty.render());
          _this.start = empty.start;

          _this.activity.loader(false);

          _this.activity.toggle();
        });
        return this.render();
      };

      this.next = function () {
        if (object.page < 15 && object.page < total_pages) {
          object.page++;
          var offset = object.page - 1;
          this.append(torrents.slice(20 * offset, 20 * offset + 20), true);
        }
      };

      this.append = function (data, append) {
        var _this2 = this;

        data.forEach(function (element) {
          element.title = element.title.replace('[LAMPA] ', '');
          var item_data = Arrays.decodeJson(element.data, {});
          var card = new Card(element, {
            card_category: true
          });
          card.create();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), true);
            Background.change(item_data.movie ? Utils.cardImgBackground(item_data.movie) : element.poster);
            if (scroll.isEnd()) _this2.next();
          };

          card.onEnter = function (target, card_data) {
            _this2.start();

            Torrent.open(card_data.hash, item_data.lampa && item_data.movie ? item_data.movie : false);
          };

          card.onMenu = function (target, card_data) {
            var enabled = Controller.enabled().name;
            Select.show({
              title: Lang.translate('title_action'),
              items: [{
                title: Lang.translate('torrent_remove_title'),
                subtitle: Lang.translate('torrent_remove_descr')
              }],
              onBack: function onBack() {
                Controller.toggle(enabled);
              },
              onSelect: function onSelect(a) {
                Torserver.remove(card_data.hash);
                Arrays.remove(items, card);
                card.destroy();
                last = false;
                Controller.toggle(enabled);
              }
            });
          };

          card.visible();
          body.append(card.render());
          if (append) Controller.collectionAppend(card.render());
          items.push(card);
        });
      };

      this.build = function (data) {
        torrents = data;
        total_pages = Math.ceil(torrents.length / 20);
        scroll.minus();
        this.append(torrents.slice(0, 20));
        scroll.append(body);
        html.append(scroll.render());
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        html.remove();
        body.remove();
        network = null;
        items = null;
        html = null;
        body = null;
      };
    }

    function component$6(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var total_pages = 0;
      var info;
      var last;
      var relises = [];

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Api.relise(this.build.bind(this), function () {
          var empty = new create$c();
          html.append(empty.render());
          _this.start = empty.start;

          _this.activity.loader(false);

          _this.activity.toggle();
        });
        return this.render();
      };

      this.next = function () {
        if (object.page < 15 && object.page < total_pages) {
          object.page++;
          var offset = object.page - 1;
          this.append(relises.slice(20 * offset, 20 * offset + 20), true);
        }
      };

      this.append = function (data, append) {
        var _this2 = this;

        data.forEach(function (element) {
          var card = new Card(element, {
            card_category: true,
            card_type: true
          });
          card.create();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), true);

            if (info) {
              info.update(card_data);
              Background.change(Utils.cardImgBackground(card_data));
              if (scroll.isEnd()) _this2.next();
            }
          };

          card.onEnter = function (target, card_data) {
            if (card_data.tmdbID) {
              card_data.id = card_data.tmdbID;
              Activity$1.push({
                url: '',
                component: 'full',
                id: card_data.tmdbID,
                method: card_data.name ? 'tv' : 'movie',
                card: card_data
              });
            } else {
              Modal.open({
                title: '',
                html: Template$1.get('modal_loading'),
                size: 'small',
                mask: true,
                onBack: function onBack() {
                  Modal.close();
                  Api.clear();
                  Controller.toggle('content');
                }
              });
              Api.search({
                query: encodeURIComponent(card_data.original_title)
              }, function (find) {
                Modal.close();
                var finded = TMDB.find(find, card_data);

                if (finded) {
                  Activity$1.push({
                    url: '',
                    component: 'full',
                    id: finded.id,
                    method: finded.name ? 'tv' : 'movie',
                    card: finded
                  });
                } else {
                  Noty.show(Lang.translate('nofind_movie'));
                  Controller.toggle('content');
                }
              }, function () {
                Modal.close();
                Noty.show(Lang.translate('nofind_movie'));
                Controller.toggle('content');
              });
            }
          };

          card.onMenu = function () {};

          card.visible();
          body.append(card.render());
          if (append) Controller.collectionAppend(card.render());
          items.push(card);
        });
      };

      this.build = function (data) {
        relises = data;
        total_pages = Math.ceil(relises.length / 20);

        if (Storage.field('light_version')) {
          scroll.minus();
          html.append(scroll.render());
        } else {
          info = new create$d();
          info.create();
          scroll.minus();
          html.append(scroll.render());
        }

        var start = (object.page - 1) * 20;
        this.append(relises.slice(start, start + 20));
        if (total_pages > object.page && !info) this.more();
        scroll.append(body);
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.more = function () {
        var more = $('<div class="category-full__more selector"><span>' + Lang.translate('show_more') + '</span></div>');
        more.on('hover:focus', function (e) {
          Controller.collectionFocus(last || false, scroll.render());
          var next = Arrays.clone(object);
          delete next.activity;
          next.page++;
          Activity$1.push(next);
        });
        body.append(more);
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        html.remove();
        body.remove();
        if (info) info.destroy();
        network = null;
        items = null;
        html = null;
        body = null;
        info = null;
      };
    }

    function component$5(object) {
      var network = new create$p();
      var scroll = new create$o({
        mask: true,
        over: true,
        step: 250,
        end_ratio: 2
      });
      var items = [];
      var html = $('<div></div>');
      var body = $('<div class="category-full"></div>');
      var last;
      var collections = [];
      var waitload;

      this.create = function () {
        var _this = this;

        this.activity.loader(true);
        Api.collections(object, this.build.bind(this), function () {
          var empty = new create$c();
          html.append(empty.render());
          _this.start = empty.start;

          _this.activity.loader(false);

          _this.activity.toggle();
        });
        return this.render();
      };

      this.next = function () {
        var _this2 = this;

        if (waitload) return;

        if (object.page < 30) {
          waitload = true;
          object.page++;
          Api.collections(object, function (result) {
            _this2.append(result.results, true);

            if (result.results.length) waitload = false;
          }, function () {});
        }
      };

      this.append = function (data, append) {
        var _this3 = this;

        data.forEach(function (element) {
          var card = new Card(element, {
            card_collection: true,
            object: object
          });
          card.create();

          card.onFocus = function (target, card_data) {
            last = target;
            scroll.update(card.render(), true);
            Background.change(Utils.cardImgBackground(card_data));
            if (scroll.isEnd()) _this3.next();
          };

          card.onEnter = function (target, card_data) {
            Activity$1.push({
              url: card_data.url,
              id: card_data.id,
              title: Lang.translate('title_collections') + ' - ' + card_data.title,
              component: 'collections_view',
              source: object.source,
              page: 1
            });
          };

          card.onMenu = function (target, card_data) {};

          card.visible();
          body.append(card.render());
          if (append) Controller.collectionAppend(card.render());
          items.push(card);
        });
      };

      this.build = function (data) {
        collections = data.results;
        scroll.minus();
        this.append(collections.slice(0, 20));
        scroll.append(body);
        html.append(scroll.render());
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: function back() {
            Activity$1.backward();
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        network.clear();
        Arrays.destroy(items);
        scroll.destroy();
        html.remove();
        body.remove();
        network = null;
        items = null;
        html = null;
        body = null;
      };
    }

    function component$4(object) {
      var comp = new component$d(object);

      comp.create = function () {
        Api.collections(object, this.build.bind(this), this.empty.bind(this));
      };

      return comp;
    }

    function component$3(object) {
      var html = $('<div></div>');
      var empty = new create$c();

      this.create = function () {
        html.append(empty.render());
        this.start = empty.start;
        this.activity.loader(false);
        this.activity.toggle();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(empty.render());
            Controller.collectionFocus(false, empty.render());
          }
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        html.remove();
      };
    }

    function component$2(object) {
      var _this = this;

      var scroll = new create$o({
        mask: true,
        over: true
      });
      var html = $('<div></div>');
      var body = $('<div class="timetable"></div>');
      var cards = Favorite.full().card;
      var table = TimeTable.all();
      var last;

      this.create = function () {
        if (Account.working()) cards = Account.all();

        if (table.length) {
          var date_max = 0;
          var date_now = new Date();
          var date_end = new Date();
          var date_one = 24 * 60 * 60 * 1000;
          table.forEach(function (elem) {
            elem.episodes.forEach(function (ep) {
              var air = new Date(ep.air_date);
              var tim = air.getTime();

              if (date_max < tim) {
                date_max = tim;
                date_end = air;
              }
            });
          });
          var date_dif = Math.min(30, Math.round(Math.abs((date_now - date_end) / date_one)));

          if (date_dif > 0) {
            for (var i = 0; i < date_dif; i++) {
              this.append(date_now);
              date_now.setDate(date_now.getDate() + 1);
            }

            scroll.minus();
            scroll.append(body);
            html.append(scroll.render());
          } else this.empty();
        } else this.empty();

        this.activity.loader(false);
        this.activity.toggle();
        return this.render();
      };

      this.empty = function () {
        var empty = new create$c({
          descr: Lang.translate('timetable_empty')
        });
        html.append(empty.render());
        _this.start = empty.start;

        _this.activity.loader(false);

        _this.activity.toggle();
      };

      this.append = function (date) {
        var item = $("\n            <div class=\"timetable__item selector\">\n                <div class=\"timetable__inner\">\n                    <div class=\"timetable__date\"></div>\n                    <div class=\"timetable__body\"></div>\n                </div>\n            </div>\n        ");
        var air_date = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        var air_epis = [];
        var day_week = Utils.parseTime(date.getTime());
        var weeks = [Lang.translate('week_7'), Lang.translate('week_1'), Lang.translate('week_2'), Lang.translate('week_3'), Lang.translate('week_4'), Lang.translate('week_5'), Lang.translate('week_6')];
        table.forEach(function (elem) {
          elem.episodes.forEach(function (ep) {
            var card = cards.find(function (card) {
              return card.id == elem.id;
            });

            if (ep.air_date == air_date && card) {
              air_epis.push({
                episode: ep,
                card: cards.find(function (card) {
                  return card.id == elem.id;
                })
              });
            }
          });
        });

        if (air_epis.length) {
          air_epis.slice(0, 3).forEach(function (elem) {
            item.find('.timetable__body').append('<div><span style="background-color: ' + Utils.stringToHslColor(elem.card.name, 50, 50) + '"></span>' + elem.card.name + '</div>');
          });

          if (air_epis.length > 3) {
            item.find('.timetable__body').append('<div>+' + (air_epis.length - 3) + '</div>');
          }

          if (air_epis.length == 1) {
            var preview = $('<div class="timetable__preview"><img><div>' + (air_epis[0].episode.name || Lang.translate('noname')) + '</div></div>');
            Utils.imgLoad(preview.find('img'), Utils.protocol() + 'imagetmdb.cub.watch/t/p/w200/' + air_epis[0].episode.still_path, false, function () {
              preview.find('img').remove();
            });
            item.find('.timetable__body').prepend(preview);
          }

          item.addClass('timetable__item--any');
        }

        item.find('.timetable__date').text(day_week["short"] + ' - ' + weeks[date.getDay()] + '.');
        item.on('hover:focus', function () {
          last = $(this)[0];
          scroll.update($(this));
        }).on('hover:enter', function () {
          var modal = $('<div></div>');
          air_epis.forEach(function (elem) {
            var noty = Template$1.get('notice_card', {
              time: air_date,
              title: elem.card.name,
              descr: Lang.translate('full_season') + ' - <b>' + elem.episode.season_number + '</b><br>' + Lang.translate('full_episode') + ' - <b>' + elem.episode.episode_number + '</b>'
            });
            Utils.imgLoad(noty.find('img'), elem.card.poster ? elem.card.poster : elem.card.img ? elem.card.img : Utils.protocol() + 'imagetmdb.cub.watch/t/p/w200/' + elem.card.poster_path);
            noty.on('hover:enter', function () {
              Modal.close();
              Activity$1.push({
                url: '',
                component: 'full',
                id: elem.card.id,
                method: 'tv',
                card: elem.card,
                source: elem.card.source
              });
            });
            modal.append(noty);
          });
          Modal.open({
            title: Lang.translate('menu_tv'),
            size: 'medium',
            html: modal,
            onBack: function onBack() {
              Modal.close();
              Controller.toggle('content');
            }
          });
        });
        body.append(item);
      };

      this.back = function () {
        Activity$1.backward();
      };

      this.start = function () {
        Controller.add('content', {
          toggle: function toggle() {
            Controller.collectionSet(scroll.render());
            Controller.collectionFocus(last || false, scroll.render());
          },
          left: function left() {
            if (Navigator.canmove('left')) Navigator.move('left');else Controller.toggle('menu');
          },
          right: function right() {
            Navigator.move('right');
          },
          up: function up() {
            if (Navigator.canmove('up')) Navigator.move('up');else Controller.toggle('head');
          },
          down: function down() {
            if (Navigator.canmove('down')) Navigator.move('down');
          },
          back: this.back
        });
        Controller.toggle('content');
      };

      this.pause = function () {};

      this.stop = function () {};

      this.render = function () {
        return html;
      };

      this.destroy = function () {
        scroll.destroy();
        html.remove();
      };
    }

    function component$1(object) {
      var comp = new component$d(object);

      comp.create = function () {
        this.activity.loader(true);
        Account.subscribes(object, this.build.bind(this), this.empty.bind(this));
        return this.render();
      };

      return comp;
    }

    var component = {
      main: component$f,
      full: component$e,
      category: component$b,
      category_full: component$c,
      actor: component$a,
      favorite: component$9,
      torrents: component$8,
      mytorrents: component$7,
      relise: component$6,
      collections: component$5,
      collections_view: component$4,
      nocomponent: component$3,
      timetable: component$2,
      subscribes: component$1
    };
    /**
     * Создать компонент
     * @param {{component:string}} object
     * @returns
     */

    function create$2(object) {
      if (component[object.component]) {
        try {
          return new component[object.component](object);
        } catch (e) {
          return new component.nocomponent(object);
        }
      } else {
        return new component.nocomponent(object);
      }
    }
    /**
     * Добавить
     * @param {string} name
     * @param {class} comp
     */


    function add$3(name, comp) {
      component[name] = comp;
    }
    /**
     * Получить компонент
     * @param {string} name
     * @returns {class}
     */


    function get$2(name) {
      return component[name];
    }

    var Component = {
      create: create$2,
      add: add$3,
      get: get$2
    };

    var listener$3 = start$4();
    var activites = [];
    var callback = false;
    var fullout = false;
    var content;
    var slides;
    var maxsave;

    function Activity(component) {
      var slide = Template$1.get('activity');
      var body = slide.find('.activity__body');
      this.stoped = false;
      this.started = false;
      /**
       * Добовляет активити в список активитис
       */

      this.append = function () {
        slides.append(slide);
      };
      /**
       * Создает новую активность
       */


      this.create = function () {
        try {
          component.create(body);
          body.append(component.render());
        } catch (e) {}
      };
      /**
       * Показывает загрузку
       * @param {boolean} status
       */


      this.loader = function (status) {
        slide.toggleClass('activity--load', status);

        if (!status) {
          setTimeout(function () {
            Controller.updateSelects();
          }, 10);
        }
      };
      /**
       * Создает повторно
       */


      this.restart = function () {
        this.append();
        this.stoped = false;
        component.start();
      };
      /**
       * Стартуем активную активность
       */


      this.start = function () {
        this.started = true;
        Controller.add('content', {
          invisible: true,
          toggle: function toggle() {},
          left: function left() {
            Controller.toggle('menu');
          },
          up: function up() {
            Controller.toggle('head');
          },
          back: function back() {
            Activity.backward();
          }
        });
        Controller.toggle('content');
        if (this.stoped) this.restart();else component.start();
      };
      /**
       * Пауза
       */


      this.pause = function () {
        this.started = false;
        component.pause();
      };
      /**
       * Включаем активность если она активна
       */


      this.toggle = function () {
        if (this.started) this.start();
      };
      /**
       * Стоп
       */


      this.stop = function () {
        this.started = false;
        if (this.stoped) return;
        this.stoped = true;
        component.stop();
        slide.detach();
      };
      /**
       * Рендер
       */


      this.render = function () {
        return slide;
      };
      /**
       * Получить класс компонента
       */


      this.component = function () {
        return component;
      };
      /**
       * Уничтожаем активность
       */


      this.destroy = function () {
        component.destroy(); //после create работает долгий запрос и затем вызывается build, однако уже было вызвано destroy и возникают ошибки, поэтому заодно чистим функцию build и empty

        for (var f in component) {
          if (typeof component[f] == 'function') {
            component[f] = function () {};
          }
        }

        slide.remove();
      };

      this.append();
    }
    /**
     * Запуск
     */


    function init$1() {
      content = Template$1.get('activitys');
      slides = content.find('.activitys__slides');
      maxsave = Storage.get('pages_save_total', 5);
      empty();
      var wait = true;
      setTimeout(function () {
        wait = false;
      }, 1500);
      window.addEventListener('popstate', function () {
        if (fullout || wait) return;
        empty();
        listener$3.send('popstate', {
          count: activites.length
        });
        if (callback) callback();else {
          backward();
        }
      });
      Storage.listener.follow('change', function (event) {
        if (event.name == 'pages_save_total') maxsave = Storage.get('pages_save_total', 5);
      });
    }
    /**
     * Лимит активностей, уничтожать если больше maxsave
     */


    function limit() {
      var curent = active$1();
      if (curent && curent.activity) curent.activity.pause();
      var tree_stop = activites.slice(-2);
      if (tree_stop.length > 1 && tree_stop[0].activity) tree_stop[0].activity.stop();
      var tree_destroy = activites.slice(-maxsave);

      if (tree_destroy.length > maxsave - 1) {
        var first = tree_destroy[0];

        if (first.activity) {
          first.activity.destroy();
          first.activity = null;
        }
      }
    }
    /**
     * Добавить новую активность
     * @param {{component:string}} object
     */


    function push(object) {
      limit();
      create$1(object);
      activites.push(object);
      start(object);
    }
    /**
     * Создать новую активность
     * @param {{component:string}} object
     */


    function create$1(object) {
      var comp = Component.create(object);
      object.activity = new Activity(comp);
      comp.activity = object.activity;
      Lampa.Listener.send('activity', {
        component: object.component,
        type: 'init',
        object: object
      });
      object.activity.create();
      Lampa.Listener.send('activity', {
        component: object.component,
        type: 'create',
        object: object
      });
    }
    /**
     * Вызов обратно пользователем
     */


    function back$2() {
      window.history.back();
    }
    /**
     * Получить активную активность
     * @returns {object}
     */


    function active$1() {
      return activites[activites.length - 1];
    }
    /**
     * Создат пустую историю
     */


    function empty() {
      window.history.pushState(null, null, window.location.pathname);
    }
    /**
     * Получить все активности
     * @returns {[{component:string, activity:class}]}
     */


    function all() {
      return activites;
    }
    /**
     * Получить рендеры всех активностей
     * @returns {array}
     */


    function renderLayers() {
      var result = [];
      all().forEach(function (item) {
        if (item.activity) result.push(item.activity.render());
      });
      return result;
    }
    /**
     * Обработать событие назад
     */


    function backward() {
      callback = false;
      listener$3.send('backward', {
        count: activites.length
      });
      if (activites.length == 1) return;
      slides.find('>div').removeClass('activity--active');
      var curent = activites.pop();

      if (curent) {
        setTimeout(function () {
          curent.activity.destroy();
          Lampa.Listener.send('activity', {
            component: curent.component,
            type: 'destroy',
            object: curent
          });
        }, 200);
      }

      var previous_tree = activites.slice(-maxsave);

      if (previous_tree.length > maxsave - 1) {
        create$1(previous_tree[0]);
      }

      previous_tree = activites.slice(-1)[0];

      if (previous_tree) {
        if (previous_tree.activity) {
          start(previous_tree);
          Lampa.Listener.send('activity', {
            component: previous_tree.component,
            type: 'archive',
            object: previous_tree
          });
        } else {
          create$1(previous_tree);
          start(previous_tree);
        }
      }
    }
    /**
     * Сохранить активность в память
     * @param {{component:string, activity:class}} object
     */


    function save(object) {
      var saved = {};

      for (var i in object) {
        if (i !== 'activity') saved[i] = object[i];
      }

      Storage.set('activity', saved);
    }
    /**
     * Получить данные активности
     * @param {{component:string, activity:class}} object
     * @returns {{component:string}}
     */


    function extractObject(object) {
      var saved = {};

      for (var i in object) {
        if (i !== 'activity') saved[i] = object[i];
      }

      return saved;
    }
    /**
     * Активируем следующию активность
     * @param {{component:string, activity:class}} object
     */


    function start(object) {
      save(object);
      object.activity.start();
      slides.find('> div').removeClass('activity--active');
      object.activity.render().addClass('activity--active');
      Head.title(object.title);
      Lampa.Listener.send('activity', {
        component: object.component,
        type: 'start',
        object: object
      });
    }
    /**
     * С какой активности начать запуск лампы
     */


    function last() {
      var active = Storage.get('activity', 'false');
      var start_from = Storage.field("start_page");

      if (window.start_deep_link) {
        push(window.start_deep_link);
      } else if (active && start_from === "last") {
        if (active.page) active.page = 1;
        push(active);
      } else {
        var _start_from$split = start_from.split('@'),
            _start_from$split2 = _slicedToArray(_start_from$split, 2),
            action = _start_from$split2[0],
            type = _start_from$split2[1];

        if (action == 'favorite') {
          push({
            url: '',
            title: type == 'book' ? Lang.translate('title_book') : type == 'like' ? Lang.translate('title_like') : type == 'history' ? Lang.translate('title_history') : Lang.translate('title_wath'),
            component: 'favorite',
            type: type,
            page: 1
          });
        } else if (action == 'mytorrents') {
          push({
            url: '',
            title: Lang.translate('title_mytorrents'),
            component: 'mytorrents',
            page: 1
          });
        } else {
          push({
            url: '',
            title: Lang.translate('title_main') + ' - ' + Storage.field('source').toUpperCase(),
            component: 'main',
            source: Storage.field('source'),
            page: 1
          });
        }
      }
    }
    /**
     * Рендер
     * @returns {object}
     */


    function render() {
      return content;
    }
    /**
     * Подключить обратный вызов при изменени истории
     * @param {*} call
     */


    function call(call) {
      callback = call;
    }
    /**
     * Выход из лампы
     */


    function out() {
      fullout = true;
      back$2();

      for (var i = 0; i < window.history.length; i++) {
        back$2();
      }

      setTimeout(function () {
        fullout = false;
        empty();
      }, 100);
    }
    /**
     * Заменить активную активность
     * @param {object} replace
     */


    function replace() {
      var replace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var object = extractObject(active$1());

      for (var i in replace) {
        object[i] = replace[i];
      }

      active$1().activity.destroy();
      activites.pop();
      push(object);
    }

    var Activity$1 = {
      init: init$1,
      listener: listener$3,
      push: push,
      back: back$2,
      render: render,
      backward: backward,
      call: call,
      last: last,
      out: out,
      replace: replace,
      active: active$1,
      all: all,
      extractObject: extractObject,
      renderLayers: renderLayers
    };

    var listener$2 = start$4();
    var active;
    var active_name = '';
    var controlls = {};
    var selects;
    var select_active;
    /**
     * Добавить контроллер
     * @param {String} name
     * @param {Object} calls
     */

    function add$2(name, calls) {
      controlls[name] = calls;
    }
    /**
     * Запустить функцию
     * @param {String} name
     * @param {Object} params
     */


    function run(name, params) {
      if (active) {
        if (active[name]) {
          if (typeof active[name] == 'function') active[name](params);else if (typeof active[name] == 'string') {
            run(active[name], params);
          }
        }
      }
    }
    /**
     * Двигать
     * @param {String} direction
     */


    function move(direction) {
      run(direction);
    }
    /**
     * Вызов enter
     */


    function enter() {
      if (active && active.enter) run('enter');else if (select_active) {
        select_active.trigger('hover:enter');
      }
    }
    /**
     * Вызов long
     */


    function _long() {
      if (active && active["long"]) run('long');else if (select_active) {
        select_active.trigger('hover:long');
      }
    }
    /**
     * Завершить
     */


    function finish() {
      run('finish');
    }
    /**
     * Нажали назад
     */


    function back$1() {
      run('back');
    }
    /**
     * Переключить контроллер
     * @param {String} name
     */


    function toggle(name) {
      if (active && active.gone) active.gone(name);

      if (controlls[name]) {
        active = controlls[name];
        active_name = name;
        Activity$1.call(function () {
          run('back');
        });
        if (active.toggle) active.toggle(); //updateSelects()

        listener$2.send('toggle', {
          name: name
        });
      }
    }

    function bindMouseOrTouch(name) {
      selects.on(name + '.hover', function (e) {
        if ($(this).hasClass('selector')) {
          if (name == 'touchstart') $('.selector').removeClass('focus enter');
          selects.removeClass('focus enter').data('ismouse', false);
          $(this).addClass('focus').data('ismouse', true).trigger('hover:focus', [true]);
          var silent = Navigator.silent;
          Navigator.silent = true;
          Navigator.focus($(this)[0]);
          Navigator.silent = silent;
        }
      });
      if (name == 'mouseenter') selects.on('mouseleave.hover', function () {
        $(this).removeClass('focus');
      });
    }

    function bindMouseAndTouchLong() {
      selects.each(function () {
        var selector = $(this);
        var position = 0;
        var timer;

        var trigger = function trigger() {
          clearTimeout(timer);
          timer = setTimeout(function () {
            var time = selector.data('long-time') || 0;

            if (time + 100 < Date.now()) {
              var mutation = Math.abs(position - (selector.offset().top + selector.offset().left));
              if (mutation < 30) selector.trigger('hover:long', [true]);
            }

            selector.data('long-time', Date.now());
          }, 800);
          position = selector.offset().top + selector.offset().left;
        };

        selector.on('mousedown.hover touchstart.hover', trigger).on('mouseout.hover mouseup.hover touchend.hover touchmove.hover', function (e) {
          clearTimeout(timer);
        });
      });
    }

    function updateSelects(cuctom) {
      selects = cuctom || $('.selector');
      selects.unbind('.hover');

      if (Storage.field('navigation_type') == 'mouse') {
        selects.on('click.hover', function (e) {
          var time = $(this).data('click-time') || 0; //ну хз, 2 раза клик срабатывает, нашел такое решение:

          if (time + 100 < Date.now()) {
            selects.removeClass('focus enter');
            if (e.keyCode !== 13) $(this).addClass('focus').trigger('hover:enter', [true]);
          }

          $(this).data('click-time', Date.now());
        });
        bindMouseOrTouch('mouseenter');
        bindMouseAndTouchLong();
      }

      bindMouseOrTouch('touchstart');
    }

    function enable(name) {
      if (active_name == name) toggle(name);
    }

    function clearSelects() {
      select_active = false;
      if (selects) selects.removeClass('focus enter'); //if(selects) selects.unbind('.hover')
    }
    /**
     * Вызвать событие
     * @param {String} name
     * @param {Object} params
     */


    function trigger$1(name, params) {
      run(name, params);
    }
    /**
     * Фокус на элементе
     * @param {Object} target
     */


    function focus(target) {
      if (selects) selects.removeClass('focus enter').data('ismouse', false);
      $(target).addClass('focus').trigger('hover:focus');
      select_active = $(target);
    }

    function collectionSet(html, append) {
      var selectors = html.find('.selector');
      var colection = selectors.toArray();

      if (append) {
        selectors = $.merge(selectors, append.find('.selector'));
        colection = colection.concat(append.find('.selector').toArray());
      }

      if (colection.length || active.invisible) {
        clearSelects();
        Navigator.setCollection(colection);
        updateSelects(selectors);
      }
    }

    function collectionAppend(append) {
      var old_selects = selects;
      updateSelects(append);
      append.each(function () {
        Navigator.add($(this)[0]);
      });
      selects = old_selects;
      $.merge(old_selects, append);
    }

    function collectionFocus(target, html) {
      if (target) {
        Navigator.focus(target);
      } else {
        var colection = html.find('.selector').not('.hide').toArray();
        if (colection.length) Navigator.focus(colection[0]);
      }
    }

    function enabled() {
      return {
        name: active_name,
        controller: active
      };
    }

    function toContent() {
      var trys = 0;
      Screensaver.stopSlideshow();

      var go = function go() {
        var contrl = enabled();
        var any = parseInt([$('body').hasClass('settings--open') ? 1 : 0, $('body').hasClass('selectbox--open') ? 1 : 0, $('.modal,.player,.search-box,.search').length ? 1 : 0].join(''));
        trys++;

        if (any) {
          if (contrl.controller.back) contrl.controller.back();
          if (trys < 10) go();
        }
      };

      go();
    }

    function clear$1() {
      clearSelects();
      Navigator.setCollection([]);
    }

    var Controller = {
      listener: listener$2,
      add: add$2,
      move: move,
      enter: enter,
      finish: finish,
      toggle: toggle,
      trigger: trigger$1,
      back: back$1,
      focus: focus,
      collectionSet: collectionSet,
      collectionFocus: collectionFocus,
      collectionAppend: collectionAppend,
      enable: enable,
      enabled: enabled,
      clear: clear$1,
      "long": _long,
      updateSelects: updateSelects,
      toContent: toContent
    };

    var layers = {
      search: {
        'sim': ['{MIC} {ABC} 1 2 3 4 5 6 7 8 9 0 {BKSP}', '{LANG} - + _ : ( ) [ ] . / {SPACE}'],
        'en': ['{MIC} q w e r t y u i o p {BKSP}', '{LANG} a s d f g h j k l', '{SIM} z x c v b n m . {SPACE}'],
        'uk': ['{MIC} й ц у к е н г ш щ з х ї {BKSP}', '{LANG} ф і в а п р о л д ж є', '{SIM} я ч с м и т ь б ю . {SPACE}'],
        'default': ['{MIC} й ц у к е н г ш щ з х ъ {BKSP}', '{LANG} ё ф ы в а п р о л д ж э', '{SIM} я ч с м и т ь б ю . {SPACE}']
      },
      clarify: {
        'en': ['1 2 3 4 5 6 7 8 9 0 - {BKSP}', 'q w e r t y u i o p', 'a s d f g h j k l', 'z x c v b n m .', '{MIC} {LANG} {SPACE} {SEARCH}'],
        'uk': ['1 2 3 4 5 6 7 8 9 0 - {BKSP}', 'й ц у к е н г ш щ з х ї', 'ф і в а п р о л д ж є', 'я ч с м и т ь б ю .', '{MIC} {LANG} {SPACE} {SEARCH}'],
        'default': ['1 2 3 4 5 6 7 8 9 0 - {BKSP}', 'й ц у к е н г ш щ з х ъ', 'ф ы в а п р о л д ж э', 'я ч с м и т ь б ю .', '{MIC} {LANG} {SPACE} {SEARCH}']
      },
      "default": {
        'en': ['{SIM} 1 2 3 4 5 6 7 8 9 0 - + = {BKSP}', '{LANG} q w e r t y u i o p', 'a s d f g h j k l / {ENTER}', '{SHIFT} z x c v b n m , . : http://', '{SPACE}'],
        'uk': ['{SIM} 1 2 3 4 5 6 7 8 9 0 - + = {BKSP}', '{LANG} й ц у к е н г ш щ з х ї', 'ф і в а п р о л д ж є {ENTER}', '{SHIFT} я ч с м и т ь б ю . : http://', '{SPACE}'],
        'sim': ['{ABC} 1 2 3 4 5 6 7 8 9 0 - + = {BKSP}', '{LANG} ! @ # $ % ^ & * ( ) [ ]', '- _ = + \\ | [ ] { }', '; : \' " , . < > / ?', '{SPACE}'],
        'default': ['{SIM} 1 2 3 4 5 6 7 8 9 0 - + = {BKSP}', '{LANG} й ц у к е н г ш щ з х ъ', 'ф ы в а п р о л д ж э {ENTER}', '{SHIFT} я ч с м и т ь б ю , . : http://', '{SPACE}']
      }
    };

    function add$1(name, layout) {
      layers[name] = layout;
    }

    function addLang(name, code, layout) {
      layers[name][code] = layout;
    }

    function get$1(name) {
      return layers[name];
    }

    var Layers = {
      add: add$1,
      addLang: addLang,
      get: get$1
    };

    function create() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _keyClass = window.SimpleKeyboard["default"],
          _keyBord;

      var last;
      var recognition;
      var simple = Storage.field('keyboard_type') !== 'lampa';
      var input;
      var last_value;
      var height = window.innerHeight;
      this.listener = start$4();

      this.create = function () {
        var _this = this;

        if (simple) {
          input = $('<input type="text" class="simple-keyboard-input selector" placeholder="' + Lang.translate('search_input') + '..." />');
          var time_blur = 0;
          var time_focus = 0;
          var stated, ended;
          input.on('keyup change input keypress', function (e) {
            var now_value = input.val();

            if (last_value !== now_value) {
              last_value = now_value;
              stated = ended = false;

              _this.listener.send('change', {
                value: now_value
              });
            }
          });
          input.on('blur', function () {
            Keypad.enable();
            time_blur = Date.now();
          });
          input.on('focus', function () {
            Keypad.disable();
            time_focus = Date.now();
          });
          input.on('keyup', function (e) {
            if (time_focus + 1000 > Date.now()) return;
            var keys = [13, 65376, 29443, 117, 65385, 461, 27];
            var valu = input.val();
            var cart = e.target.selectionStart;

            if (keys.indexOf(e.keyCode) >= 0) {
              e.preventDefault();
              console.log('Keyboard', 'blur key:', e.keyCode, 'value:', valu);
              input.blur();
            }

            if (e.keyCode == 13 || e.keyCode == 65376) _this.listener.send('enter');

            if (e.keyCode == 37 && cart == 0 && height == window.innerHeight) {
              if (stated) input.blur(), _this.listener.send('left');
              stated = true;
              ended = false;
            }

            if (e.keyCode == 39 && cart >= valu.length && height == window.innerHeight) {
              if (ended) input.blur(), _this.listener.send('right');
              ended = true;
              stated = false;
            }

            if (e.keyCode == 40) {
              if (height == window.innerHeight) input.blur(), _this.listener.send('down');
            }

            if (e.keyCode == 38) {
              if (height == window.innerHeight) input.blur(), _this.listener.send('up');
            }
          });
          input.on('hover:focus', function () {
            input.focus();
          });
          input.on('hover:enter', function () {
            if (time_blur + 1000 < Date.now()) input.focus();
          });
          $('.simple-keyboard').append(input);
        } else {
          var layout = typeof params.layout == 'string' ? Layers.get(params.layout) : params.layout || Layers.get('default');
          _keyBord = new _keyClass({
            display: {
              '{BKSP}': '&nbsp;',
              '{ENTER}': '&nbsp;',
              '{SHIFT}': '&nbsp;',
              '{SPACE}': '&nbsp;',
              '{LANG}': '&nbsp;',
              '{ABC}': 'Aa',
              '{SIM}': '#+',
              '{SEARCH}': Lang.translate('search'),
              '{MIC}': "<svg viewBox=\"0 0 24 31\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <rect x=\"5\" width=\"14\" height=\"23\" rx=\"7\" fill=\"currentColor\"/>\n                        <path d=\"M3.39272 18.4429C3.08504 17.6737 2.21209 17.2996 1.44291 17.6073C0.673739 17.915 0.299615 18.7879 0.607285 19.5571L3.39272 18.4429ZM23.3927 19.5571C23.7004 18.7879 23.3263 17.915 22.5571 17.6073C21.7879 17.2996 20.915 17.6737 20.6073 18.4429L23.3927 19.5571ZM0.607285 19.5571C2.85606 25.179 7.44515 27.5 12 27.5V24.5C8.55485 24.5 5.14394 22.821 3.39272 18.4429L0.607285 19.5571ZM12 27.5C16.5549 27.5 21.1439 25.179 23.3927 19.5571L20.6073 18.4429C18.8561 22.821 15.4451 24.5 12 24.5V27.5Z\" fill=\"currentColor\"/>\n                        <rect x=\"10\" y=\"25\" width=\"4\" height=\"6\" rx=\"2\" fill=\"currentColor\"/>\n                        </svg>"
            },
            layout: layout,
            onChange: function onChange(value) {
              _this.listener.send('change', {
                value: value
              });
            },
            onKeyPress: function onKeyPress(button) {
              if (button === "{SHIFT}" || button === "{SIM}" || button === "{ABC}") _this._handle(button);else if (button === '{MIC}') {
                if (Platform.is('android')) {
                  Android.voiceStart();
                  window.voiceResult = _this.value.bind(_this);
                } else if (recognition) {
                  try {
                    if (recognition.record) recognition.stop();else recognition.start();
                  } catch (e) {
                    recognition.stop();
                  }
                }
              } else if (button === '{LANG}') {
                var codes = Lang.codes();
                var items = [];

                var select_code = _keyBord.options.layoutName.split('-')[0];

                items.push({
                  title: codes.ru,
                  value: 'default',
                  selected: select_code == 'default'
                });
                Arrays.getKeys(codes).forEach(function (code) {
                  if (layout[code]) {
                    items.push({
                      title: codes[code],
                      value: code,
                      selected: select_code == code
                    });
                  }
                });
                setTimeout(function () {
                  Select.show({
                    title: Lang.translate('title_choice_language'),
                    items: items,
                    onSelect: function onSelect(item) {
                      Select.hide();
                      Storage.set('keyboard_default_lang', item.value);
                      var shifted = _keyBord.options.layoutName.split('-')[1] == 'shift';
                      var new_layout = item.value + (shifted ? '-shift' : '');

                      _this.shifted(!shifted, new_layout, item.value);

                      _keyBord.setOptions({
                        layoutName: new_layout
                      });

                      last = false;
                      _keyBord.options.lastLayerSelect = _keyBord.options.layoutName;
                      Controller.toggle('keybord');
                      $('.simple-keyboard').attr('shifted', Boolean(shifted));
                      Controller.collectionFocus($('.simple-keyboard [data-skbtn="{LANG}"]')[0], $('.simple-keyboard'));
                    },
                    onBack: function onBack() {
                      Select.hide();
                      Controller.toggle('keybord');
                    }
                  });
                }, 300);
              } else if (button === '{SPACE}') {
                _this.value(_keyBord.getInput() + ' ');
              } else if (button === '{BKSP}') {
                _this.value(_keyBord.getInput().slice(0, -1));
              } else if (button === '{ENTER}' || button === '{SEARCH}') {
                _this.listener.send('enter');
              }
            }
          });
          var lang = Storage.get('keyboard_default_lang', Storage.get('language', 'ru'));

          _keyBord.setOptions({
            layoutName: lang == 'ru' ? 'default' : Arrays.getKeys(layout).indexOf(lang) >= 0 ? lang : layout.en ? 'en' : 'default'
          });

          this.speechRecognition();
        }
      };

      this.speechRecognition = function () {
        var _this2 = this;

        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        console.log('Speech', 'status:', SpeechRecognition ? true : false);

        if (SpeechRecognition) {
          recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.addEventListener("start", function () {
            console.log('Speech', 'start');
            $('.simple-keyboard [data-skbtn="{mic}"]').css('color', 'red');
            recognition.record = true;
            Noty.show(Lang.translate('keyboard_listen'));
          });
          recognition.addEventListener("end", function () {
            console.log('Speech', 'end');
            $('.simple-keyboard [data-skbtn="{mic}"]').css('color', 'white');
            recognition.record = false;
          });
          recognition.addEventListener("result", function (event) {
            console.log('Speech', 'result:', event.resultIndex, event.results[event.resultIndex]);
            var current = event.resultIndex;
            var transcript = event.results[current][0].transcript;
            console.log('Speech', 'transcript:', transcript);

            if (transcript.toLowerCase().trim() === "stop recording") {
              recognition.stop();
            } else {
              if (transcript.toLowerCase().trim() === "reset input") {
                _this2.value('');
              } else {
                _this2.value(transcript);
              }
            }
          });
          recognition.addEventListener("error", function (event) {
            console.log('Speech', 'error:', event);

            if (event.error == 'not-allowed') {
              Noty.show(Lang.translate('keyboard_nomic'));
            }

            recognition.stop();
          });
        } else {
          $('.simple-keyboard [data-skbtn="{mic}"]').css('opacity', '0.3');
        }
      };

      this.value = function (value) {
        if (simple) input.val(value);else _keyBord.setInput(value);
        last_value = value;
        this.listener.send('change', {
          value: value
        });
      };

      this._layout = function () {
        var _this3 = this;

        var keys = $('.simple-keyboard .hg-button').addClass('selector');
        Controller.collectionSet($('.simple-keyboard'));
        Controller.collectionFocus(last || keys[0], $('.simple-keyboard'));
        $('.simple-keyboard .hg-button:not(.binded)').on('hover:enter', function (e, click) {
          Controller.collectionFocus($(this)[0]);
          if (!click) _keyBord.handleButtonClicked($(this).attr('data-skbtn'), e);
        }).on('hover:focus', function (e) {
          last = e.target;

          _this3.listener.send('hover', {
            button: e.target
          });
        });
        keys.addClass('binded');
      };

      this.shifted = function (shifted, layout, code) {
        if (!(shifted && _keyBord.options.layout[layout])) {
          var shift_layer = Arrays.clone(_keyBord.options.layout[code]);
          shift_layer = shift_layer.map(function (button) {
            return button.toUpperCase();
          });
          _keyBord.options.layout[layout] = shift_layer;
        }
      };

      this._handle = function (button) {
        var current_layout = _keyBord.options.layoutName,
            layout = 'default',
            focus;
        var shifted = current_layout.split('-')[1] == 'shift';
        var code = current_layout.split('-')[0];
        $('.simple-keyboard').attr('shifted', Boolean(!shifted));

        if (button == '{SHIFT}') {
          if (shifted) layout = code;else layout = code + '-shift';
          this.shifted(shifted, layout, code);
        } else if (button == '{SIM}') {
          layout = 'sim';
          focus = '{ABC}';
          _keyBord.options.lastLayerSelect = current_layout;
        } else if (button == '{ABC}') {
          layout = _keyBord.options.lastLayerSelect || 'default';
          focus = '{SIM}';
        }

        _keyBord.setOptions({
          layoutName: layout
        });

        last = false;
        Controller.toggle('keybord');
        Controller.collectionFocus($('.simple-keyboard [data-skbtn="' + (focus || button) + '"]')[0], $('.simple-keyboard'));
      };

      this.toggle = function () {
        var _this4 = this;

        Controller.add('keybord', {
          toggle: function toggle() {
            if (simple) {
              Controller.collectionSet($('.simple-keyboard'));
              Controller.collectionFocus(false, $('.simple-keyboard'));
            } else _this4._layout();
          },
          up: function up() {
            if (!Navigator.canmove('up')) {
              _this4.listener.send('up');
            } else Navigator.move('up');
          },
          down: function down() {
            if (!Navigator.canmove('down')) {
              _this4.listener.send('down');
            } else Navigator.move('down');
          },
          left: function left() {
            if (!Navigator.canmove('left')) {
              _this4.listener.send('left');
            } else Navigator.move('left');
          },
          right: function right() {
            if (!Navigator.canmove('right')) {
              _this4.listener.send('right');
            } else Navigator.move('right');
          },
          back: function back() {
            _this4.listener.send('back');
          }
        });
        Controller.toggle('keybord');
      };

      this.destroy = function () {
        try {
          if (simple) {
            input.remove();
          } else _keyBord.destroy();
        } catch (e) {}

        this.listener.destroy();
        Keypad.enable();
      };
    }

    var html$1, keyboard, input;
    /**
     * Заустить редактор
     * @param {{title:string, value:string, free:boolean, nosave:boolean}} params
     * @param {function} call
     */

    function edit(params, call) {
      html$1 = Template$1.get('settings_input');
      input = html$1.find('.settings-input__input');
      if (Storage.field('keyboard_type') !== 'lampa') input.hide();
      $('body').append(html$1);
      keyboard = new create();
      keyboard.listener.follow('change', function (event) {
        input.text(event.value.trim());
      });
      keyboard.listener.follow('enter', function (event) {
        var val = input.text();
        back();
        call(val);
      });
      html$1.toggleClass('settings-input--free', params.free ? true : false);
      $('.settings-input__links', html$1).toggleClass('hide', params.nosave ? true : false);
      if (params.title) html$1.find('.settings-input__content').prepend('<div class="settings-input__title">' + params.title + '</div>');
      keyboard.listener.follow('down', function (event) {
        if (params.nosave) return;
        var members = Storage.get('setting_member', []);
        var links = [];
        links.push({
          title: (members.indexOf(input.text()) == -1 ? Lang.translate('settings_add') : Lang.translate('settings_remove')) + ' ' + Lang.translate('settings_this_value'),
          subtitle: input.text(),
          add: true
        });
        members.forEach(function (link) {
          links.push({
            title: link,
            subtitle: Lang.translate('settings_user_links'),
            url: link,
            member: true
          });
        });
        links = links.concat([{
          title: '127.0.0.1:8090',
          subtitle: Lang.translate('settings_for_local'),
          url: '127.0.0.1:8090'
        }]);
        Select.show({
          title: Lang.translate('title_links'),
          items: links,
          onSelect: function onSelect(a) {
            if (a.add) {
              if (members.indexOf(a.subtitle) == -1) {
                Arrays.insert(members, 0, a.subtitle);
                Noty.show(Lang.translate('settings_added') + ' (' + a.subtitle + ')');
              } else {
                Arrays.remove(members, a.subtitle);
                Noty.show(Lang.translate('settings_removed') + ' (' + a.subtitle + ')');
              }

              Storage.set('setting_member', members);
            } else {
              keyboard.value(a.url);
            }

            keyboard.toggle();
          },
          onLong: function onLong(a, elem) {
            if (a.member) {
              Arrays.remove(members, a.url);
              Noty.show(Lang.translate('settings_removed') + ' (' + a.url + ')');
              Storage.set('setting_member', members);
              $(elem).css({
                opacity: 0.4
              });
            }
          },
          onBack: function onBack() {
            keyboard.toggle();
          }
        });
      });
      keyboard.listener.follow('back', function () {
        var val = input.text();
        back();
        call(val);
      });
      keyboard.create();
      keyboard.value(params.value);
      keyboard.toggle();
      Helper.show('keyboard', Lang.translate('helper_keyboard'));
    }
    /**
     * Назад
     */


    function back() {
      destroy();
      Controller.toggle('settings_component');
    }
    /**
     * Уничтожить
     */


    function destroy() {
      keyboard.destroy();
      html$1.remove();
      html$1 = null;
      keyboard = null;
      input = null;
    }

    var Input = {
      edit: edit
    };

    var values = {};
    var defaults = {};
    var listener$1 = start$4();
    /**
     * Запуск
     */

    function init() {
      if (Platform.is('tizen')) {
        select('player', {
          'inner': '#{settings_param_player_inner}',
          'tizen': 'Tizen'
        }, 'tizen');
      }

      if (Platform.is('orsay')) {
        select('player', {
          'inner': '#{settings_param_player_inner}',
          'orsay': 'Orsay'
        }, 'inner');
      } else if (Platform.is('webos')) {
        select('player', {
          'inner': '#{settings_param_player_inner}',
          'webos': 'WebOS'
        }, 'inner');
      } else if (Platform.is('android')) {
        select('player', {
          'inner': '#{settings_param_player_inner}',
          'android': 'Android'
        }, 'inner');
        trigger('internal_torrclient', false);
      } else if (Platform.desktop()) {
        select('player', {
          'inner': '#{settings_param_player_inner}',
          'other': '#{settings_param_player_outside}'
        }, 'inner');
      } //язык и комбинации для поиска


      var langcode = Storage.get('language', 'ru');
      var langname = Lang.codes()[langcode];
      var selector = {
        'df': '#{settings_param_torrent_lang_orig}',
        'df_year': '#{settings_param_torrent_lang_orig} + #{torrent_parser_year}',
        'df_lg': '#{settings_param_torrent_lang_orig} + ' + langname,
        'df_lg_year': '#{settings_param_torrent_lang_orig} + ' + langname + ' + #{torrent_parser_year}',
        'lg': langname,
        'lg_year': langname + ' + #{torrent_parser_year}',
        'lg_df': langname + ' + #{settings_param_torrent_lang_orig}',
        'lg_df_year': langname + ' + #{settings_param_torrent_lang_orig} + #{torrent_parser_year}'
      };
      if (Arrays.getKeys(selector).indexOf(Storage.get('parse_lang', 'df')) == -1) Storage.set('parse_lang', 'df');
      select('parse_lang', selector, 'df');
      select('tmdb_lang', Lang.codes(), 'ru');
    }
    /**
     * Переключатель
     * @param {string} name - название
     * @param {boolean} value_default - значение по дефолту
     */


    function trigger(name, value_default) {
      values[name] = {
        'true': '#{settings_param_yes}',
        'false': '#{settings_param_no}'
      };
      defaults[name] = value_default;
    }
    /**
     * Выбрать
     * @param {string} name - название
     * @param {{key:string}} select_data - значение
     * @param {string} select_default_value - значение по дефолту
     */


    function select(name, select_data, select_default_value) {
      values[name] = select_data;
      defaults[name] = select_default_value;
    }
    /**
     * Биндит события на элемент
     * @param {object} elems
     */


    function bind(elems) {
      elems.on('hover:enter', function (event) {
        var elem = $(event.target);
        var type = elem.data('type');
        var name = elem.data('name');
        var onChange = elem.data('onChange');

        if (type == 'toggle') {
          var params = values[name];
          var keys = Arrays.isArray(params) ? params : Arrays.getKeys(params),
              value = Storage.get(name, defaults[name]) + '',
              position = keys.indexOf(value);
          position++;
          if (position >= keys.length) position = 0;
          position = Math.max(0, Math.min(keys.length - 1, position));
          value = keys[position];
          Storage.set(name, value);
          update(elem, elems);
          if (onChange) onChange(value);
        }

        if (type == 'input') {
          Input.edit({
            elem: elem,
            name: name,
            value: elem.data('string') ? window.localStorage.getItem(name) || defaults[name] : Storage.get(name, defaults[name]) + ''
          }, function (new_value) {
            Storage.set(name, new_value);
            update(elem, elems);
            if (onChange) onChange(new_value);
          });
        }

        if (type == 'button') {
          listener$1.send('button', {
            name: name
          });
        }

        if (type == 'add') {
          Input.edit({
            value: ''
          }, function (new_value) {
            if (new_value && Storage.add(name, new_value)) {
              displayAddItem(elem, new_value);
              listener$1.send('update_scroll');
            }
          });
        }

        if (type == 'select') {
          var _params = values[name];

          var _value = Storage.get(name, defaults[name]) + '';

          var items = [];

          for (var i in _params) {
            items.push({
              title: Lang.translate(_params[i]),
              value: i,
              selected: i == _value
            });
          }

          var enabled = Controller.enabled().name;
          Select.show({
            title: Lang.translate('title_choice'),
            items: items,
            onBack: function onBack() {
              Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              Storage.set(name, a.value);
              update(elem, elems);
              Controller.toggle(enabled);
              if (onChange) onChange(a.value);
            }
          });
        }
      }).each(function () {
        if (!$(this).data('static')) update($(this), elems);
      });

      if (elems.eq(0).data('type') == 'add') {
        displayAddList(elems.eq(0));
      }
    }
    /**
     * Добавить дополнительное полу
     * @param {object} elem
     * @param {object} element
     */


    function displayAddItem(elem, element) {
      var name = elem.data('name');
      var item = $('<div class="settings-param selector"><div class="settings-param__name">' + element + '</div>' + '</div>');
      item.on('hover:long', function () {
        var list = Storage.get(name, '[]');
        Arrays.remove(list, element);
        Storage.set(name, list);
        item.css({
          opacity: 0.5
        });
      });
      elem.after(item);
    }
    /**
     * Вывести дополнительные поля
     * @param {object} elem
     */


    function displayAddList(elem) {
      var list = Storage.get(elem.data('name'), '[]');
      list.forEach(function (element) {
        displayAddItem(elem, element);
      });
      listener$1.send('update_scroll');
    }
    /**
     * Обновляет значения на элементе
     * @param {object} elem
     */


    function update(elem, elems) {
      var name = elem.data('name');
      var key = elem.data('string') ? window.localStorage.getItem(name) || defaults[name] : Storage.get(name, defaults[name] + '');
      var val = typeof values[name] == 'string' ? key : values[name][key] || values[name][defaults[name]];
      var plr = elem.attr('placeholder');
      if (!val && plr) val = plr;
      elem.find('.settings-param__value').text(Lang.translate(val));
      var children = elem.data('children');

      if (children) {
        var parent = elems.filter('[data-parent="' + children + '"]');
        parent.toggleClass('hide', !Storage.field(name));
      }
    }
    /**
     * Получить значение параметра
     * @param {string} name
     * @returns *
     */


    function field$1(name) {
      return Storage.get(name, defaults[name] + '');
    }
    /**
     * Добовляем селекторы
     */


    select('interface_size', {
      'small': '#{settings_param_interface_size_small}',
      'normal': '#{settings_param_interface_size_normal}'
    }, 'normal');
    select('poster_size', {
      'w200': '#{settings_param_poster_quality_low}',
      'w300': '#{settings_param_poster_quality_average}',
      'w500': '#{settings_param_poster_quality_high}'
    }, 'w200');
    select('parser_torrent_type', {
      'jackett': 'Jackett',
      'torlook': 'Torlook'
    }, 'jackett');
    select('torlook_parse_type', {
      'native': '#{settings_param_parse_directly}',
      'site': '#{settings_param_parse_api}'
    }, 'native');
    select('background_type', {
      'complex': '#{settings_param_background_complex}',
      'simple': '#{settings_param_background_simple}',
      'poster': '#{settings_param_background_image}'
    }, 'simple');
    select('pages_save_total', {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5'
    }, '5');
    select('player', {
      'inner': '#{settings_param_player_inner}'
    }, 'inner');
    select('torrserver_use_link', {
      'one': '#{settings_param_link_use_one}',
      'two': '#{settings_param_link_use_two}'
    }, 'one');
    select('subtitles_size', {
      'small': '#{settings_param_subtitles_size_small}',
      'normal': '#{settings_param_subtitles_size_normal}',
      'large': '#{settings_param_subtitles_size_bigger}'
    }, 'normal');
    select('screensaver_type', {
      'nature': '#{settings_param_screensaver_nature}',
      'chrome': 'ChromeCast'
    }, 'chrome');
    select('parse_lang', {
      'df': '#{settings_param_torrent_lang_orig}'
    }, 'df');
    select('parse_timeout', {
      '15': '15',
      '30': '30',
      '60': '60'
    }, '15');
    select('player_timecode', {
      'again': '#{settings_param_player_timecode_again}',
      'continue': '#{settings_param_player_timecode_continue}',
      'ask': '#{settings_param_player_timecode_ask}'
    }, 'continue');
    select('player_scale_method', {
      'transform': 'Transform',
      'calculate': '#{settings_param_player_scale_method}'
    }, 'transform');
    select('player_hls_method', {
      'application': '#{settings_param_player_hls_app}',
      'hlsjs': '#{settings_param_player_hls_js}'
    }, 'hlsjs');
    select('source', {
      'tmdb': 'TMDB',
      'ivi': 'IVI',
      'okko': 'OKKO',
      'cub': 'CUB'
    }, 'tmdb');
    select('start_page', {
      'main': '#{title_main}',
      'favorite@book': '#{title_book}',
      'favorite@like': '#{title_like}',
      'favorite@wath': '#{title_wath}',
      'favorite@history': '#{title_history}',
      'mytorrents': '#{title_mytorrents}',
      'last': '#{title_last}'
    }, 'last');
    select('scroll_type', {
      'css': 'CSS',
      'js': 'Javascript'
    }, 'css');
    select('card_views_type', {
      'preload': '#{settings_param_card_view_load}',
      'view': '#{settings_param_card_view_all}'
    }, 'preload');
    select('navigation_type', {
      'controll': '#{settings_param_navigation_remote}',
      'mouse': '#{settings_param_navigation_mouse}'
    }, 'mouse');
    select('keyboard_type', {
      'lampa': '#{settings_param_keyboard_lampa}',
      'integrate': '#{settings_param_keyboard_system}'
    }, 'integrate');
    select('time_offset', {
      'n-10': '-10',
      'n-9': '-9',
      'n-8': '-8',
      'n-7': '-7',
      'n-6': '-6',
      'n-5': '-5',
      'n-4': '-4',
      'n-3': '-3',
      'n-2': '-2',
      'n-1': '-1',
      'n0': '0',
      'n1': '1',
      'n2': '2',
      'n3': '3',
      'n4': '4',
      'n5': '5',
      'n6': '6',
      'n7': '7',
      'n8': '8',
      'n9': '9',
      'n10': '10'
    }, 'n0');
    select('video_quality_default', {
      '480': '480p',
      '720': '720p',
      '1080': '1080p',
      '1440': '1440p',
      '2160': '2160p'
    }, '1080');
    /**
     * Добовляем триггеры
     */

    trigger('animation', true);
    trigger('background', true);
    trigger('torrserver_savedb', false);
    trigger('torrserver_preload', false);
    trigger('parser_use', true);
    trigger('cloud_use', false);
    trigger('account_use', false);
    trigger('torrserver_auth', false);
    trigger('mask', false);
    trigger('playlist_next', true);
    trigger('internal_torrclient', true);
    trigger('subtitles_stroke', true);
    trigger('subtitles_backdrop', false);
    trigger('screensaver', false);
    trigger('proxy_tmdb', true);
    trigger('proxy_tmdb_auto', true);
    trigger('proxy_other', true);
    trigger('parse_in_search', false);
    trigger('subtitles_start', false);
    trigger('helper', false);
    trigger('light_version', false);
    trigger('player_normalization', false);
    trigger('card_quality', false);
    trigger('card_episodes', false);
    /**
     * Добовляем поля
     */

    select('jackett_url', '', 'jacred.ru');
    select('jackett_key', '', '');
    select('torrserver_url', '', '');
    select('torrserver_url_two', '', '');
    select('torrserver_login', '', '');
    select('torrserver_password', '', '');
    select('parser_website_url', '', '');
    select('torlook_site', '', 'w41.torlook.info');
    select('cloud_token', '', '');
    select('account_email', '', '');
    select('account_password', '', '');
    select('device_name', '', 'Lampa');
    select('player_nw_path', '', 'C:/Program Files/VideoLAN/VLC/vlc.exe');
    select('tmdb_proxy_api', '', 'https://cr-jgp4.onrender.com');
    select('tmdb_proxy_image', '', 'https://cr-jgp4.onrender.com');
    var Params = {
      listener: listener$1,
      init: init,
      bind: bind,
      update: update,
      field: field$1,
      select: select,
      trigger: trigger
    };

    var listener = start$4();

    function get(name, empty) {
      var value = window.localStorage.getItem(name) || empty || '';
      var convert = parseInt(value);
      if (!isNaN(convert) && /^\d+$/.test(value)) return convert;

      if (value == 'true' || value == 'false') {
        return value == 'true' ? true : false;
      }

      try {
        value = JSON.parse(value);
      } catch (error) {}

      return value;
    }

    function value(name, empty) {
      return window.localStorage.getItem(name) || empty || '';
    }

    function set(name, value, nolisten) {
      try {
        if (Arrays.isObject(value) || Arrays.isArray(value)) {
          var str = JSON.stringify(value);
          window.localStorage.setItem(name, str);
        } else {
          window.localStorage.setItem(name, value);
        }
      } catch (e) {}

      if (!nolisten) listener.send('change', {
        name: name,
        value: value
      });
    }

    function add(name, new_value) {
      var list = get(name, '[]');

      if (list.indexOf(new_value) == -1) {
        list.push(new_value);
        set(name, list);
        listener.send('add', {
          name: name,
          value: new_value
        });
        return true;
      }
    }

    function field(name) {
      return Params.field(name);
    }

    function setCached(name, max, id, updateValueFn) {
      var cached = Lampa.Storage.cache(name, max, {});
      var oldValue = cached[id];

      if (oldValue === undefined) {
        oldValue = {};
      }

      cached[id] = updateValueFn(oldValue);
      set(name, cached);
    }

    function cache(name, max, empty) {
      var result = get(name, JSON.stringify(empty));

      if (Arrays.isObject(empty)) {
        var keys = Arrays.getKeys(result);

        if (keys.length > max) {
          var remv = keys.slice(0, keys.length - max);
          remv.forEach(function (k) {
            delete result[k];
          });
          set(name, result);
        }
      } else if (result.length > max) {
        result = result.slice(result.length - max);
        set(name, result);
      }

      return result;
    }

    var Storage = {
      listener: listener,
      get: get,
      set: set,
      field: field,
      cache: cache,
      add: add,
      setCached: setCached,
      value: value
    };

    function xXamster(component) {
      var network = new Lampa.Reguest(); // let proxy = ''
      // let proxy = 'https://cors.fx666.workers.dev/'

      var proxy = 'https://vi1pr.netlify.app/pr/';
      var baseUrl = proxy + 'https://ru.xhamster.com';
      var durationMapping = {
        'any': '',
        '10+ min': '&min-duration=10',
        '20+ min': 'min-duration=20'
      };
      var qualityMapping = {
        'any': '',
        '720p+': '&quality=720p',
        '1080p+': '&quality=1080p'
      };

      this.loadItemDetails = function (item, onComplete, onError) {
        network.silent(proxy + item.detailsUrl, function (respData) {
          var match = respData.match(/"url":".{20,400}?\.m3u8.{0,300}?"/g);

          if (!match) {
            Lampa.Noty.show('Video not found');
            onError();
            return;
          }

          var filter = match.filter(function (itm) {
            return !itm.includes('video-b.xhcdn.com');
          });

          if (!filter.length) {
            onError();
            Lampa.Noty.show('Video URL not found');
            return;
          }

          item.qualities = {};
          var hlsDetailsUrl = JSON.parse('{' + filter[0] + '}').url;
          item.url = hlsDetailsUrl; // var preferably = Lampa.Storage.get('video_quality_default');
          // if (preferably && item.qualities[preferably + 'p']) {
          //     item.url = item.qualities[preferably + 'p'];
          // } else {
          //     item.url = item.qualities[Object.keys(item.qualities)[Object.keys(item.qualities).length - 1]]
          // }

          onComplete(item);
        }, function (a, c) {
          console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
          Lampa.Noty.show('Error loading videoDetails');
          onError();
        }, false, {
          dataType: 'text',
          headers: {
            'my_Origin': 'https://ru.xhamster.com',
            'my_Referer': 'https://ru.xhamster.com',
            'my_User-Agent': 'lampa'
          }
        });
      };

      this.getItems = function (page, filterItems, onComplete, onError) {
        var title = filterItems.find(function (item) {
          return item.titleInput;
        }).subtitle;
        var durationFilter = filterItems.find(function (item) {
          return item.durationItem;
        }).items.find(function (item) {
          return item.selected;
        }).duration;
        var qualityFilter = filterItems.find(function (item) {
          return item.qualityItem;
        }).items.find(function (item) {
          return item.selected;
        }).quality;
        var url = baseUrl;

        if (title) {
          url += '/search/' + encodeURIComponent(title);
          url += '?page=' + page;
          url += durationMapping[durationFilter] + qualityMapping[qualityFilter];
        } else {
          url += '/search/joymii?page=' + page;
        }

        network.silent(url, function (respData) {
          var resultItems = [];

          try {
            var respDataFixed = respData.replace(/\n/g, '');
            var match = respDataFixed.match(/(<div class="thumb-list.*)?<\/div>[ ]*?<\/div>[ ]*?<.{0,50}?pager-section/);

            if (match) {
              var rootDiv = document.createElement("div");
              rootDiv.innerHTML = match[1];
              var videoElements = rootDiv.querySelectorAll("div.thumb-list > div.video-thumb--type-video");
              videoElements.forEach(function (element) {
                var item = buildItem(element);

                if ((qualityFilter === 'any' || item.quality && extractNumber(item.quality) >= extractNumber(qualityFilter)) && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                  resultItems.push(item);
                }
              });
              rootDiv.remove();
            } else {
              if (!respDataFixed.includes('Sorry, no video found for this query')) {
                console.log('xxx', "xHamster: Error parsing video list: no match");
                Lampa.Noty.show("xHamster: Error parsing video list: no match"); // onError();
              }
            }
          } catch (e) {
            console.log('xxx', "xHamster: Error parsing video list: " + e);
            Lampa.Noty.show('xHamster: Error parsing video list'); // onError();
          }

          onComplete(resultItems);
        }, function (a, c) {
          console.log('xxx', "Error loading video list: " + network.errorDecode(a, c));
          Lampa.Noty.show('Error loading video list');
          onComplete([]);
        }, false, {
          dataType: 'text',
          headers: {
            'my_Origin': 'https://ru.xhamster.com',
            'my_Referer': 'https://ru.xhamster.com',
            'my_sec-ch-ua-mobile': '?0',
            'my_sec-ch-ua-platform': 'Windows',
            // 'my_Cookie': 'settings=eyJpc1dlYnBTdXBwb3J0ZWQiOnRydWUsImlzV2VibVN1cHBvcnRlZCI6dHJ1ZSwiZXh0RGV0ZWN0ZWRWMiI6bnVsbCwibW9tZW50c0lzSGlkZGVuIjpudWxsLCJ0cnVzdFVSTHMiOlsicnUueGhhbXN0ZXIuY29tIl0sImlzU2lkZWJhckhpZGRlbiI6bnVsbCwiZXhwaXJlcyI6eyJ0cnVzdFVSTHMiOjE3ODAxNTc3MzJ9LCJ0c1Nwb3RDb3VudGVycyI6W3sic3BvdCI6Im1hc3Rlcl9jdWJlIiwidGltZSI6MTc4MDE1MDUzMiwiY291bnQiOjF9LHsic3BvdCI6Im1hc3Rlcl9mb290ZXIiLCJ0aW1lIjoxNzgwMTUwNTMyLCJjb3VudCI6MX1dfQ%3D%3D; _cfg=d8a7a65a0fd32bb3a48d70e99295f60d; x_csrf_token=1; cookie_accept_v2=%7B%22e%22%3A1%2C%22f%22%3A1%2C%22t%22%3A1%2C%22a%22%3A1%7D; parental-control=yes',
            'my_User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:151.0) Gecko/20100101 Firefox/151.0'
          }
        });
      };

      function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
      }

      function buildItem(element) {
        var _element$querySelecto, _element$querySelecto2, _element$querySelecto3, _element$querySelecto4;

        var item = {};
        item.name = (_element$querySelecto = element.querySelector("a.video-thumb-info__name")) === null || _element$querySelecto === void 0 ? void 0 : _element$querySelecto.getAttribute('title');
        item.picture = (_element$querySelecto2 = element.querySelector("img.thumb-image-container__image")) === null || _element$querySelecto2 === void 0 ? void 0 : _element$querySelecto2.getAttribute('src'); // item.picture = 'https://vi1pr.netlify.app/pr/' + element.querySelector("img.thumb-image-container__image")?.getAttribute('src')

        var href = element.querySelector("a.thumb-image-container").href;

        if (href.startsWith('http')) {
          href = href.replace(/^.*\/\/[^\/]+/, '');
        }

        item.detailsUrl = baseUrl + '/' + href;
        var timeAsText = (_element$querySelecto3 = element.querySelector("div[data-role=\"video-duration\"]")) === null || _element$querySelecto3 === void 0 ? void 0 : _element$querySelecto3.textContent;

        if (timeAsText) {
          var match = timeAsText.trim().match(/(^|:)(\d{2}):/);

          if (match) {
            item.time = parseInt(match[2]) + 'm';
          }
        }

        var qualityTxt = (_element$querySelecto4 = element.querySelector(".thumb-image-container__duration > i")) === null || _element$querySelecto4 === void 0 ? void 0 : _element$querySelecto4.getAttribute('class');
        item.quality = qualityTxt !== null && qualityTxt !== void 0 && qualityTxt.includes("--uhd") ? '2160p' : "1080p";
        item.sourceName = 'xxamster';
        return item;
      }
    }

    function XxxBookmarks(component) {
      this.getItems = function (page, filterItems, onComplete, onError) {
        onComplete(Lampa.Storage.get('xxx_bookmarks').map(function (item) {
          item.isBookmark = true;
          return item;
        }));
      };
    }

    (function () {

      function xXx(object) {
        var _thisComponent = this;

        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
          mask: true,
          over: true
        });
        var lastFocusedCard;
        var lastCardInList;
        var html = $('<div></div>');
        var body = $('<div class="category-full"></div>');
        var filterXxx = new Lampa.Filter(object);
        var globalSearchElement = $('.open--search');
        var filterItems; // let filter = this.buildXxxFilter();

        var spankBang = new SpankBang(_thisComponent);
        new Xvideos(_thisComponent);
        new xXamster(_thisComponent);
        var xxxBookmarks = new XxxBookmarks(_thisComponent);
        var sourcesByName = {
          "spankBang": spankBang,
          // "xvideos": xvideos,
          // "xxamster": xxamster,
          "xxxBookmarks": xxxBookmarks
        };

        this.create = function () {
          Lampa.Background.immediately('');
          this.buildXxxFilter();
          this.loadPage(1, function onComplete(items) {
            scroll.minus();
            html.append(scroll.render());
            scroll.append(body);

            _thisComponent.clear();

            _thisComponent.appendItems(items);

            _thisComponent.activity.toggle(); // Lampa.Controller.enable('content');

          });
          return this.render();
        };

        this.loadPage = function (pageNum, onComplete) {
          var counter = 0;
          var itemsBySource = [];
          var items = [];

          _thisComponent.activity.loader(true);

          var filteredSourcesNames = filterItems.find(function (item) {
            return item.sourcesItem;
          }).items.filter(function (item) {
            return item.checked;
          }).map(function (item) {
            return item.name;
          });
          var filteredSources = filteredSourcesNames.map(function (item) {
            return sourcesByName[item];
          }).filter(function (s) {
            return s !== undefined;
          });

          var load = function load(onComplete, onError) {
            var source = filteredSources[counter];
            source.getItems(pageNum, filterItems, function onSuccess(itemsFromSource) {
              itemsBySource.push({
                items: itemsFromSource
              });
              counter++;

              if (counter < filteredSources.length) {
                load(onComplete, onError);
              } else {
                var _loop = function _loop(i) {
                  itemsBySource.forEach(function (entry) {
                    var item = entry.items[i];

                    if (item) {
                      items.push(item);
                    }
                  });
                };

                for (var i = 0; i < 50; i++) {
                  _loop(i);
                }

                if (items.length) {
                  onComplete(items);
                } else {
                  onError();
                }

                _thisComponent.activity.loader(false);
              }
            }, onError);
          };

          load(onComplete, function onError() {
            _thisComponent.clear();

            var empty = Lampa.Template.get('list_empty');
            empty.css('padding-left', '0.75em');
            body.append(empty);

            _thisComponent.activity.toggle(); // Lampa.Controller.enable('content');

          });
        };

        this.appendItems = function (items) {
          items.forEach(function (item) {
            var card = Lampa.Template.get('card', {
              title: item.name
            });
            card.addClass('card--collection');
            card.find('.card__img').attr('src', item.picture);
            card.find('.card__age').remove();
            if (item.quality) card.find('.card__view').append('<div class="card__quality"><div>' + item.quality + '</div></div>');
            if (item.time) card.find('.card__view').append('<div class="card__type">' + item.time + '</div>');
            card.on('hover:focus', function () {
              lastFocusedCard = card[0];
              scroll.update(card, true); // var maxrow = Math.ceil(cards.length / 7) - 1;
              // if (Math.ceil(cards.indexOf(card) / 7) >= maxrow) _thisComponent.next();
            });
            card.on('hover:enter', function () {
              // if (!wait_parse_video) {
              _thisComponent.activity.loader(true);

              sourcesByName[item.sourceName].loadItemDetails(item, function onComplete(element) {
                var video = {
                  title: element.name,
                  url: element.url,
                  quality: element.qualities
                };
                Lampa.Player.play(video);
                Lampa.Player.playlist([video]); // wait_parse_video = false

                _thisComponent.activity.loader(false);
              }, function onError() {
                _thisComponent.activity.loader(false);
              }); // }
              // wait_parse_video = true;
            });
            card.on('hover:long', function () {
              function show() {
                var enabled = Lampa.Controller.enabled().name;
                var menu = [];

                if (item.isBookmark) {
                  menu.push({
                    title: Lampa.Lang.translate('card_book_remove'),
                    bookmarkRemove: true
                  });
                } else {
                  menu.push({
                    title: Lampa.Lang.translate('card_book_add'),
                    bookmarkAdd: true
                  });
                }

                menu.push({
                  title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
                  player: 'lampa'
                });

                if (Lampa.Platform.is('android')) {
                  menu.push({
                    title: Lampa.Lang.translate('player_lauch') + ' - Android',
                    player: 'android'
                  });
                } else {
                  menu.push({
                    title: Lampa.Lang.translate('player_lauch') + ' - External',
                    player: 'other'
                  });
                }

                Lampa.Select.show({
                  title: Lampa.Lang.translate('title_action'),
                  items: menu,
                  onBack: function onBack() {
                    Lampa.Controller.toggle(enabled);
                  },
                  onSelect: function onSelect(a) {
                    Lampa.Controller.toggle(enabled);

                    if (a.player) {
                      Lampa.Player.runas(a.player);
                      card.trigger('hover:enter');
                    }

                    if (a.bookmarkRemove) {
                      var bookmarks = Lampa.Storage.get('xxx_bookmarks', []);
                      Lampa.Storage.set('xxx_bookmarks', bookmarks.filter(function (bookmark) {
                        return bookmark.detailsUrl !== item.detailsUrl;
                      }));
                      Lampa.Noty.show(Lampa.Lang.translate('settings_removed'));
                      search();
                    }

                    if (a.bookmarkAdd) {
                      Lampa.Storage.add('xxx_bookmarks', item);
                      Lampa.Noty.show(Lampa.Lang.translate('settings_added'));
                    }
                  }
                });
              }

              show();
            });
            body.append(card);
            lastCardInList = card;
          });

          if (items.length > 10) {
            var loadMoreCard = Lampa.Template.get('card', {
              title: "Load more..."
            });
            loadMoreCard.addClass('card--collection');
            loadMoreCard.find('.card__age').remove();
            loadMoreCard.on('hover:enter', function () {
              _thisComponent.activity.loader(true);

              lastFocusedCard = lastCardInList[0];
              scroll.update(loadMoreCard, true);
              object.page++;

              _thisComponent.loadPage(object.page, function onComplete(items) {
                _thisComponent.appendItems(items);

                Lampa.Controller.collectionFocus(lastFocusedCard || false, scroll.render());

                _thisComponent.activity.loader(false);

                Lampa.Controller.enable('content');
              });

              loadMoreCard.remove();
            });
            body.append(loadMoreCard);
          }
        };

        this.clear = function () {
          object.page = 1;
          lastFocusedCard = false; // thisItems = [];

          body.empty();
          scroll.reset();
          this.activity.loader(false);
        };

        this.buildXxxFilter = function () {
          var onGlobalSearch = findEventHandlers("hover:enter", '.open--search')[0].events[0].handler;
          globalSearchElement.unbind('hover:enter');
          globalSearchElement.on('hover:enter', function () {
            if (Lampa.Activity.active().component === 'xxx') {
              filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
            } else {
              onGlobalSearch();
            }
          });
          globalSearchElement.addClass('focus');
          filterXxx.render().find('.torrent-filter').empty();
          filterXxx.render().removeClass('scroll--nopadding'); // .find('.filter--search,.filter--sort').remove();

          filterXxx.render().find('.selector').on('hover:focus', function (e) {
            lastFocusedCard = e.target;
          });

          filterXxx.onCheck = function (type, a, b) {
            b.checked = b.checked;
            var title = [];

            if (a.items) {
              a.items.forEach(function (a) {
                if (a.selected || a.checked) title.push(a.title);
              });
            }

            a.subtitle = title.length ? title.join(', ') : Lampa.Lang.translate('nochoice');
          };

          filterXxx.onSelect = function (type, a, b) {
            if (a.search) {
              search();
            } else if (a.titleInput) {
              Lampa.Input.edit({
                value: a.subtitle,
                title: a.title,
                free: true,
                nosave: true
              }, function (t) {
                a.subtitle = t;
                filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
              });
            } else {
              var title = [];

              if (a.items) {
                a.items.forEach(function (a) {
                  if (a.selected || a.checked) title.push(a.title);
                });
              }

              a.subtitle = title.length ? title.join(', ') : Lampa.Lang.translate('nochoice');
            }
          };

          filterXxx.onBack = function () {
            Lampa.Controller.toggle('content');
          };

          filterItems = _thisComponent.buildFilterItems();
          filterXxx.set('filter', filterItems);
        };

        function search(item) {
          _thisComponent.loadPage(1, function onComplete(items) {
            // scroll.minus();
            // html.append(scroll.render());
            // scroll.append(body);
            _thisComponent.clear();

            _thisComponent.appendItems(items);

            _thisComponent.activity.toggle(); // Lampa.Controller.enable('content');


            setTimeout(Lampa.Select.close, 10);
          });
        }

        this.buildFilterItems = function () {
          var data = {};
          data.sources = {
            title: '#{settings_rest_source}',
            sourcesItem: true,
            subtitle: 'All',
            items: [{
              title: 'SpankBang',
              checked: true,
              checkbox: true,
              name: 'spankBang'
            }, {
              title: 'Xvideos',
              checked: true,
              checkbox: true,
              name: 'xvideos'
            }, {
              title: 'xXamster',
              checked: true,
              checkbox: true,
              name: 'xxamster'
            }, {
              title: '#{title_book}',
              checkbox: true,
              checked: false,
              name: 'xxxBookmarks'
            }]
          };
          data.qualities = {
            title: '#{player_quality}',
            qualityItem: true,
            subtitle: '720p+',
            items: [{
              title: '#{torrent_parser_any_one}',
              quality: 'any'
            }, {
              title: '720p+',
              selected: true,
              quality: '720p+'
            }, {
              title: '1080p+',
              quality: '1080p+'
            }]
          };
          data.durations = {
            title: '#{xxx_duration}',
            durationItem: true,
            subtitle: '10+ min',
            items: [{
              title: '#{torrent_parser_any_one}',
              duration: 'any'
            }, {
              title: '10+ min',
              selected: true,
              duration: '10+ min'
            }, {
              title: '20+ min',
              duration: '20+ min'
            }]
          };
          var items = [{
            title: Lampa.Lang.translate('search_start'),
            search: true
          }, {
            title: Lampa.Lang.translate('filter_set_name'),
            titleInput: true,
            subtitle: ''
          }, data.sources, data.qualities, data.durations];
          items.forEach(function (itm) {
            itm.title = Lampa.Lang.translate(itm.title);
            if (itm.subtitle) itm.subtitle = Lampa.Lang.translate(itm.subtitle);

            if (itm.items) {
              itm.items.forEach(function (inr) {
                inr.title = Lampa.Lang.translate(inr.title);
              });
            }
          });
          return items;
        };

        this.start = function () {
          Lampa.Controller.add('content', {
            toggle: function toggle() {
              Lampa.Controller.collectionSet(scroll.render());
              Lampa.Controller.collectionFocus(lastFocusedCard || false, scroll.render());
            },
            left: function left() {
              if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
            },
            right: function right() {
              if (Navigator.canmove('right')) Navigator.move('right');else filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
            },
            up: function up() {
              if (Navigator.canmove('up')) Navigator.move('up');else Lampa.Controller.toggle('head');
            },
            down: function down() {
              if (Navigator.canmove('down')) Navigator.move('down');
            },
            back: function back() {
              Lampa.Activity.backward();
            }
          });
          Lampa.Controller.toggle('content');
        };

        this.pause = function () {};

        this.stop = function () {};

        this.render = function () {
          return html;
        };

        this.destroy = function () {
          network.clear();
          network = null;
          scroll.destroy();
          html.remove();
          lastCardInList = [];
        };
      }

      var findEventHandlers = function findEventHandlers(eventType, jqSelector) {
        var results = [];
        var $ = jQuery; // to avoid conflict between others frameworks like Mootools

        var arrayIntersection = function arrayIntersection(array1, array2) {
          return $(array1).filter(function (index, element) {
            return $.inArray(element, $(array2)) !== -1;
          });
        };

        var haveCommonElements = function haveCommonElements(array1, array2) {
          return arrayIntersection(array1, array2).length !== 0;
        };

        var addEventHandlerInfo = function addEventHandlerInfo(element, event, $elementsCovered) {
          var extendedEvent = event;

          if ($elementsCovered !== void 0 && $elementsCovered !== null) {
            $.extend(extendedEvent, {
              targets: $elementsCovered.toArray()
            });
          }

          var eventInfo;
          var eventsInfo = $.grep(results, function (evInfo, index) {
            return element === evInfo.element;
          });

          if (eventsInfo.length === 0) {
            eventInfo = {
              element: element,
              events: [extendedEvent]
            };
            results.push(eventInfo);
          } else {
            eventInfo = eventsInfo[0];
            eventInfo.events.push(extendedEvent);
          }
        };

        var $elementsToWatch = $(jqSelector);
        if (jqSelector === "*") //* does not include document and we might be interested in handlers registered there
          $elementsToWatch = $elementsToWatch.add(document);
        var $allElements = $("*").add(document);
        $.each($allElements, function (elementIndex, element) {
          var allElementEvents = $._data(element, "events");

          if (allElementEvents !== void 0 && allElementEvents[eventType] !== void 0) {
            var eventContainer = allElementEvents[eventType];
            $.each(eventContainer, function (eventIndex, event) {
              var isDelegateEvent = event.selector !== void 0 && event.selector !== null;
              var $elementsCovered;

              if (isDelegateEvent) {
                $elementsCovered = $(event.selector, element); //only look at children of the element, since those are the only ones the handler covers
              } else {
                $elementsCovered = $(element); //just itself
              }

              if (haveCommonElements($elementsCovered, $elementsToWatch)) {
                addEventHandlerInfo(element, event, $elementsCovered);
              }
            });
          }
        });
        return results;
      };

      function startPlugin() {
        window.plugin_xxx_ready = true;
        Lampa.Lang.add({
          xxx_duration: {
            ru: 'Длительность',
            en: 'Duration'
          }
        });
        Lampa.Component.add('xxx', xXx);
        Lampa.Listener.follow("app", function (e) {
          if (e.type == "ready") {
            var ico = "<svg width=\"200\" height=\"243\" viewBox=\"0 0 200 243\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M187.714 130.727C206.862 90.1515 158.991 64.2019 100.983 64.2019C42.9759 64.2019 -4.33044 91.5669 10.875 130.727C26.0805 169.888 63.2501 235.469 100.983 234.997C138.716 234.526 168.566 171.303 187.714 130.727Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M102.11 62.3146C109.995 39.6677 127.46 28.816 169.692 24.0979C172.514 56.1811 135.338 64.2018 102.11 62.3146Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M90.8467 62.7863C90.2285 34.5178 66.0667 25.0419 31.7127 33.063C28.8904 65.1461 68.8826 62.7863 90.8467 62.7863Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M100.421 58.5402C115.627 39.6677 127.447 13.7181 85.2149 9C82.3926 41.0832 83.5258 35.4214 100.421 58.5402Z\" stroke=\"white\" stroke-width=\"15\"/><rect x=\"39.0341\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"90.8467\" y=\"92.0388\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"140.407\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"116.753\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"64.9404\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"93.0994\" y=\"176.021\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/></svg>";
            var menu_item = $("<li class=\"menu__item selector focus\" data-action=\"xXx\"><div class=\"menu__ico\">" + ico + "</div><div class=\"menu__text\">xXx</div></li>");
            menu_item.on("hover:enter", function () {
              var xXx_entered = Storage.get('xXx_entered');

              if (xXx_entered === "1") {
                Lampa.Activity.push({
                  url: '',
                  title: 'xXx',
                  component: 'xxx',
                  page: 1
                });
              } else {
                Lampa.Input.edit({
                  value: "",
                  title: "Введите пароль доступа",
                  free: !0
                }, function (t) {
                  if ("..." == t) {
                    // Storage.set('xXx_entered', "1")
                    Lampa.Activity.push({
                      url: '',
                      title: 'xXx',
                      component: 'xxx',
                      page: 1
                    });
                  } else {
                    Lampa.Controller.toggle("menu");
                  }
                });
              }
            });
            $(".menu .menu__list").eq(0).append(menu_item);
          }
        });
      }

      if (!window.plugin_xxx_ready) startPlugin();
    })();

})();
