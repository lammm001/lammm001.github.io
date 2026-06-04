import Xvideos from "./xvideos";
import SpankBang from "./spankbang";
import Storage from "../../src/utils/storage";
import xXamster from "./xXamster";
import XxxBookmarks from "./xxxBookmarks";

(function () {
    'use strict';

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
        var wait_parse_video = false;
        var filterXxx = new Lampa.Filter(object);
        let globalSearchElement = $('.open--search');

        let filterItems;
        // let filter = this.buildXxxFilter();

        let spankBang = new SpankBang(_thisComponent);
        let xvideos = new Xvideos(_thisComponent);
        let xxamster = new xXamster(_thisComponent);
        let xxxBookmarks = new XxxBookmarks(_thisComponent);
        let sourcesByName = {
            "spankBang": spankBang,
            // "xvideos": xvideos,
            // "xxamster": xxamster,
            "xxxBookmarks": xxxBookmarks
        }

        this.create = function () {
            Lampa.Background.immediately('');
            this.buildXxxFilter()

            this.loadPage(1, function onComplete(items) {
                scroll.minus();
                html.append(scroll.render());
                scroll.append(body);

                _thisComponent.clear();
                _thisComponent.appendItems(items)

                _thisComponent.activity.toggle();
                // Lampa.Controller.enable('content');
            });
            return this.render();
        };

        this.loadPage = function (pageNum, onComplete) {
            let counter = 0;
            let itemsBySource = []
            let items = []
            _thisComponent.activity.loader(true)
            let filteredSourcesNames = filterItems.find(item => item.sourcesItem).items.filter(item => item.checked)
                .map(item => item.name);
            let filteredSources = filteredSourcesNames.map(item => sourcesByName[item]).filter(s => s !== undefined);
            const load = function (onComplete, onError) {
                let source = filteredSources[counter];
                source.getItems(pageNum, filterItems, function onSuccess(itemsFromSource) {
                    itemsBySource.push({items: itemsFromSource});
                    counter++;
                    if (counter < filteredSources.length) {
                        load(onComplete, onError);
                    } else {
                        for (let i = 0; i < 50; i++) {
                            itemsBySource.forEach(entry => {
                                let item = entry.items[i];
                                if (item) {
                                    items.push(item);
                                }
                            })
                        }
                        if (items.length) {
                            onComplete(items);
                        } else {
                            onError()
                        }
                        _thisComponent.activity.loader(false)
                    }
                }, onError);
            }
            load(onComplete,
                function onError() {
                    _thisComponent.clear();

                    var empty = Lampa.Template.get('list_empty');
                    empty.css('padding-left', '0.75em');
                    body.append(empty);

                    _thisComponent.activity.toggle();
                    // Lampa.Controller.enable('content');
                });
        }

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
                    scroll.update(card, true);
                    // var maxrow = Math.ceil(cards.length / 7) - 1;
                    // if (Math.ceil(cards.indexOf(card) / 7) >= maxrow) _thisComponent.next();
                });
                card.on('hover:enter', function () {
                    // if (!wait_parse_video) {
                    _thisComponent.activity.loader(true)
                    sourcesByName[item.sourceName].loadItemDetails(item, function onComplete(element) {
                        var video = {
                            title: element.name,
                            url: element.url,
                            quality: element.qualities
                        };
                        Lampa.Player.play(video);
                        Lampa.Player.playlist([video]);
                        // wait_parse_video = false
                        _thisComponent.activity.loader(false)
                    }, function onError() {
                        _thisComponent.activity.loader(false)
                    });
                    // }
                    // wait_parse_video = true;
                });

                card.on('hover:long', function () {
                    function show() {
                        var enabled = Lampa.Controller.enabled().name;
                        var menu = []
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
                                    let bookmarks = Lampa.Storage.get('xxx_bookmarks', []);
                                    Lampa.Storage.set('xxx_bookmarks',
                                        bookmarks.filter(bookmark => bookmark.detailsUrl !== item.detailsUrl))
                                    Lampa.Noty.show(Lampa.Lang.translate('settings_removed'));
                                    search();
                                }
                                if (a.bookmarkAdd) {
                                    Lampa.Storage.add('xxx_bookmarks', item)
                                    Lampa.Noty.show(Lampa.Lang.translate('settings_added'));
                                }
                            }
                        });
                    }

                    show();
                })
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
                    _thisComponent.activity.loader(true)
                    lastFocusedCard = lastCardInList[0];
                    scroll.update(loadMoreCard, true);
                    object.page++;
                    _thisComponent.loadPage(object.page, function onComplete(items) {
                        _thisComponent.appendItems(items)
                        Lampa.Controller.collectionFocus(lastFocusedCard || false, scroll.render());
                        _thisComponent.activity.loader(false)
                        Lampa.Controller.enable('content');
                    });
                    loadMoreCard.remove();
                });
                body.append(loadMoreCard);
            }
        };

        this.clear = function () {
            wait_parse_video = false;
            object.page = 1;
            lastFocusedCard = false;
            // thisItems = [];
            body.empty();
            scroll.reset();
            this.activity.loader(false);
        };

        this.buildXxxFilter = function () {
            let onGlobalSearch = findEventHandlers("hover:enter", '.open--search')[0].events[0].handler;
            globalSearchElement.unbind('hover:enter');
            globalSearchElement.on('hover:enter', () => {
                if (Lampa.Activity.active().component === 'xxx') {
                    filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
                } else {
                    onGlobalSearch();
                }
            });
            globalSearchElement.addClass('focus')
            filterXxx.render().find('.torrent-filter').empty();
            filterXxx.render().removeClass('scroll--nopadding')
            // .find('.filter--search,.filter--sort').remove();
            filterXxx.render().find('.selector').on('hover:focus', function (e) {
                lastFocusedCard = e.target;
            });
            filterXxx.onCheck = function (type, a, b) {
                b.checked = b.checked
                let title = []
                if (a.items) {
                    a.items.forEach((a) => {
                        if (a.selected || a.checked) title.push(a.title)
                    })
                }
                a.subtitle = title.length ? title.join(', ') : Lampa.Lang.translate('nochoice')
            }
            filterXxx.onSelect = function (type, a, b) {
                if (a.search) {
                    search()
                } else if (a.titleInput) {
                    Lampa.Input.edit({
                        value: a.subtitle,
                        title: a.title,
                        free: true,
                        nosave: true
                    }, function (t) {
                        a.subtitle = t
                        filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
                    });
                } else {
                    let title = []
                    if (a.items) {
                        a.items.forEach((a) => {
                            if (a.selected || a.checked) title.push(a.title)
                        })
                    }
                    a.subtitle = title.length ? title.join(', ') : Lampa.Lang.translate('nochoice')
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
                _thisComponent.appendItems(items)

                _thisComponent.activity.toggle();
                // Lampa.Controller.enable('content');
                setTimeout(Lampa.Select.close, 10);
            });
        }

        this.buildFilterItems = function () {
            let data = {};
            data.sources = {
                title: '#{settings_rest_source}',
                sourcesItem: true,
                subtitle: 'All',
                items: [
                    {
                        title: 'SpankBang',
                        checked: true,
                        checkbox: true,
                        name: 'spankBang'
                    },
                    {
                        title: 'Xvideos',
                        checked: true,
                        checkbox: true,
                        name: 'xvideos'
                    },
                    {
                        title: 'xXamster',
                        checked: true,
                        checkbox: true,
                        name: 'xxamster'
                    },
                    {
                        title: '#{title_book}',
                        checkbox: true,
                        checked: false,
                        name: 'xxxBookmarks'
                    }
                ]
            }
            data.qualities = {
                title: '#{player_quality}',
                qualityItem: true,
                subtitle: '720p+',
                items: [
                    {
                        title: '#{torrent_parser_any_one}',
                        quality: 'any'
                    },
                    {
                        title: '720p+',
                        selected: true,
                        quality: '720p+'
                    },
                    {
                        title: '1080p+',
                        quality: '1080p+'
                    }
                ]
            }
            data.durations = {
                title: '#{xxx_duration}',
                durationItem: true,
                subtitle: '10+ min',
                items: [
                    {
                        title: '#{torrent_parser_any_one}',
                        duration: 'any'
                    },
                    {
                        title: '10+ min',
                        selected: true,
                        duration: '10+ min'
                    },
                    {
                        title: '20+ min',
                        duration: '20+ min'
                    }
                ]
            }
            let items = [{
                title: Lampa.Lang.translate('search_start'),
                search: true,
            }, {
                title: Lampa.Lang.translate('filter_set_name'),
                titleInput: true,
                subtitle: ''
            }, data.sources, data.qualities, data.durations]

            items.forEach(itm => {
                itm.title = Lampa.Lang.translate(itm.title)

                if (itm.subtitle) itm.subtitle = Lampa.Lang.translate(itm.subtitle)

                if (itm.items) {
                    itm.items.forEach(inr => {
                        inr.title = Lampa.Lang.translate(inr.title)
                    })
                }
            })
            return items;
        }


        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function toggle() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(lastFocusedCard || false, scroll.render());
                },
                left: function left() {
                    if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu');
                },
                right: function right() {
                    if (Navigator.canmove('right')) Navigator.move('right');
                    else filterXxx.show(Lampa.Lang.translate('title_filter'), 'filter');
                },
                up: function up() {
                    if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head');
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

        this.pause = function () {
        };

        this.stop = function () {
        };

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            network.clear();
            network = null
            scroll.destroy();
            html.remove();
            lastCardInList = [];
        };
    }

    var findEventHandlers = function (eventType, jqSelector) {
        var results = [];
        var $ = jQuery;// to avoid conflict between others frameworks like Mootools

        var arrayIntersection = function (array1, array2) {
            return $(array1).filter(function (index, element) {
                return $.inArray(element, $(array2)) !== -1;
            });
        };

        var haveCommonElements = function (array1, array2) {
            return arrayIntersection(array1, array2).length !== 0;
        };


        var addEventHandlerInfo = function (element, event, $elementsCovered) {
            var extendedEvent = event;
            if ($elementsCovered !== void 0 && $elementsCovered !== null) {
                $.extend(extendedEvent, {targets: $elementsCovered.toArray()});
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
        if (jqSelector === "*")//* does not include document and we might be interested in handlers registered there
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
            },
        });

        Lampa.Component.add('xxx', xXx);

        Lampa.Listener.follow("app", function (e) {
            if (e.type == "ready") {
                var ico = "<svg width=\"200\" height=\"243\" viewBox=\"0 0 200 243\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M187.714 130.727C206.862 90.1515 158.991 64.2019 100.983 64.2019C42.9759 64.2019 -4.33044 91.5669 10.875 130.727C26.0805 169.888 63.2501 235.469 100.983 234.997C138.716 234.526 168.566 171.303 187.714 130.727Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M102.11 62.3146C109.995 39.6677 127.46 28.816 169.692 24.0979C172.514 56.1811 135.338 64.2018 102.11 62.3146Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M90.8467 62.7863C90.2285 34.5178 66.0667 25.0419 31.7127 33.063C28.8904 65.1461 68.8826 62.7863 90.8467 62.7863Z\" stroke=\"white\" stroke-width=\"15\"/><path d=\"M100.421 58.5402C115.627 39.6677 127.447 13.7181 85.2149 9C82.3926 41.0832 83.5258 35.4214 100.421 58.5402Z\" stroke=\"white\" stroke-width=\"15\"/><rect x=\"39.0341\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"90.8467\" y=\"92.0388\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"140.407\" y=\"98.644\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"116.753\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"64.9404\" y=\"139.22\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/><rect x=\"93.0994\" y=\"176.021\" width=\"19.1481\" height=\"30.1959\" rx=\"9.57407\" fill=\"white\"/></svg>";

                var menu_item = $(
                    "<li class=\"menu__item selector focus\" data-action=\"xXx\"><div class=\"menu__ico\">" + ico +
                    "</div><div class=\"menu__text\">xXx</div></li>");

                menu_item.on("hover:enter", function () {
                    let xXx_entered = Storage.get('xXx_entered');
                    if (xXx_entered === "1") {
                        Lampa.Activity.push({
                            url: '',
                            title: 'xXx',
                            component: 'xxx',
                            page: 1
                        })
                    } else {
                        Lampa.Input.edit({value: "", title: "Введите пароль доступа", free: !0}, function (t) {
                            if ("..." == t) {
                                // Storage.set('xXx_entered', "1")
                                Lampa.Activity.push({
                                    url: '',
                                    title: 'xXx',
                                    component: 'xxx',
                                    page: 1
                                })
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
