import Define from './utils/define'
import Manifest from './utils/manifest'
import Lang from './utils/lang'
import Platform from './utils/platform'
import Orsay from './utils/orsay'
import Render from './interaction/render'
import Keypad from './interaction/keypad'
import Activity from './interaction/activity'
import Controller from './interaction/controller'
import Layer from './utils/layer'
import Select from './interaction/select'
import Favorite from './utils/favorite'
import Background from './interaction/background'
import Notice from './interaction/notice'
import Head from './components/head'
import Menu from './components/menu'
import Utils from './utils/math'
import Console from './interaction/console'
import Params from './components/settings/params'
import Input from './components/settings/input'
import Screensaver from './interaction/screensaver'
import Android from './utils/android'
import Subscribe from './utils/subscribe'
import Storage from './utils/storage'
import Template from './interaction/template'
import Component from './interaction/component'
import Reguest from './utils/reguest'
import Filter from './interaction/filter'
import Files from './interaction/files'
import Scroll from './interaction/scroll'
import Empty from './interaction/empty'
import Arrays from './utils/arrays'
import Noty from './interaction/noty'
import Player from './interaction/player'
import PlayerVideo from './interaction/player/video'
import PlayerPanel from './interaction/player/panel'
import PlayerInfo from './interaction/player/info'
import PlayerPlaylist from './interaction/player/playlist'
import Timeline from './interaction/timeline'
import Settings from './components/settings'
import SettingsApi from './components/settings/api'
import Modal from './interaction/modal'
import Api from './interaction/api'
import Cloud from './utils/cloud'
import Info from './interaction/info'
import Card from './interaction/card'
import Account from './utils/account'
import Plugins from './utils/plugins'
import Socket from './utils/socket'
import Recomends from './utils/recomend'
import VideoQuality from './utils/video_quality'
import TimeTable from './utils/timetable'
import Broadcast from './interaction/broadcast'
import Helper from './interaction/helper'
import Tizen from './utils/tizen'
import InteractionMain from './interaction/items/main'
import InteractionCategory from './interaction/items/category'
import InteractionLine from './interaction/items/line'
import Status from './utils/status'
import LangChoice from './interaction/lang'
import Extensions from './interaction/extensions'
import Iframe from './interaction/iframe'
import Parser from './utils/api/parser'
import TMDB from './utils/tmdb'
import Base64 from './utils/base64'
import Loading from './interaction/loading'
import Speedtest from './interaction/speedtest'

window.Lampa = {
    Listener: Subscribe(),
    Lang,
    Subscribe,
    Storage,
    Platform,
    Utils,
    Params,
    Menu,
    Head,
    Notice,
    Background,
    Favorite,
    Select,
    Controller,
    Activity,
    Keypad,
    Template,
    Component,
    Reguest,
    Filter,
    Files,
    Scroll,
    Empty,
    Arrays,
    Noty,
    Player,
    PlayerVideo,
    PlayerInfo,
    PlayerPanel,
    PlayerPlaylist,
    Timeline,
    Modal,
    Api,
    Cloud,
    Settings,
    SettingsApi,
    Android,
    Card,
    Info,
    Account,
    Socket,
    Input,
    Screensaver,
    Recomends,
    VideoQuality,
    TimeTable,
    Broadcast,
    Helper,
    InteractionMain,
    InteractionCategory,
    InteractionLine,
    Status,
    Plugins,
    Extensions,
    Tizen,
    Layer,
    Console,
    Iframe,
    Parser,
    Manifest,
    TMDB,
    Base64,
    Speedtest,
    Loading
}

function prepareApp() {
    if (window.prepared_app) return

    Console.init()

    Keypad.init()

    Layer.init()

    /** Передаем фокус в контроллер */

    Navigator.follow('focus', (event) => {
        Controller.focus(event.elem)
    })

//зачем хардкодить цсс?

    /** Start - для orsay одни стили, для других другие */
    // let old_css = $('link[href="css/app.css"]')
    //
    // if (Platform.is('orsay')) {
    //     Orsay.init()
    //
    //     Utils.putStyle([
    //         'http://lampa.mx/css/app.css?v' + Manifest.css_version
    //     ], () => {
    //         old_css.remove()
    //     })
    // } else if (old_css.length) {
    //     Utils.putStyle([
    //         'https://yumata.github.io/lampa/css/app.css?v' + Manifest.css_version
    //     ], () => {
    //         old_css.remove()
    //     })
    // }

    Layer.update()

    window.prepared_app = true
}

function startApp() {
    if (window.appready) return

    let start_time = 0

    /** Стартуем */

    Lampa.Listener.send('app', {type: 'start'})

    /** Инициализируем классы */

    Settings.init()
    Select.init()
    Platform.init()
    Params.init()
    Favorite.init()
    Background.init()
    Notice.init()
    Head.init()
    Menu.init()
    Activity.init()
    Screensaver.init()
    Cloud.init()
    Account.init()
    Extensions.init()
    Plugins.init()
    Socket.init()
    Recomends.init()
    VideoQuality.init()
    TimeTable.init()
    Helper.init()
    Tizen.init()
    Player.init()
    Iframe.init()
    Parser.init()
    Speedtest.init()

    /** Надо зачиcтить, не хорошо светить пароль ;) */

    Storage.set('account_password', '')

    /** Следим за переключением контроллера */

    Controller.listener.follow('toggle', () => {
        Layer.update()
    })

    /** Чтоб не писали по 100 раз */

    if (!Storage.get('parser_torrent_type')) Storage.set('parser_torrent_type', 'jackett')

    /** Выход из приложения */

    console.log('App', 'screen size:', window.innerWidth + 'px / ' + window.innerHeight + 'px')
    console.log('App', 'user agent:', navigator.userAgent)

    Activity.listener.follow('backward', (event) => {
        if (!start_time) start_time = Date.now()

        if (event.count == 1 && Date.now() > start_time + (1000 * 2)) {
            let enabled = Controller.enabled()

            Select.show({
                title: Lang.translate('title_out'),
                items: [
                    {
                        title: Lang.translate('title_out_confirm'),
                        out: true
                    },
                    {
                        title: Lang.translate('cancel')
                    }
                ],
                onSelect: (a) => {
                    if (a.out) {
                        Activity.out()

                        Controller.toggle(enabled.name)

                        if (Platform.is('tizen')) tizen.application.getCurrentApplication().exit()
                        if (Platform.is('webos')) window.close()
                        if (Platform.is('android')) Android.exit()
                        //пока не используем, нужно разобраться почему вызывается активити при загрузке главной
                        if (Platform.is('orsay')) Orsay.exit()
                    } else {
                        Controller.toggle(enabled.name)
                    }
                },
                onBack: () => {
                    Controller.toggle(enabled.name)
                }
            })
        }
    })
    window.localStorage.setItem('remove_white_and_demo', 'true')

    /** Ренедрим лампу */

    Render.app()

    /** Обновляем слои */

    Layer.update()

    /** Активируем последнию активность */

    Activity.last()

    /** Гасим свет :D */

    setTimeout(() => {
        Keypad.enable()

        Screensaver.enable()

        $('.welcome').fadeOut(500, () => {
            $(this).remove()
        })
    }, 1000)


    /** Если это тач дивайс */

    if (Utils.isTouchDevice()) $('body').addClass('touch-device')

    /** End */

    /** Start - если это андроид */

    if (Platform.is('android')) {
        Params.listener.follow('button', (e) => {
            if (e.name === 'reset_player') {
                Android.resetDefaultPlayer()
            }
        })

        Favorite.listener.follow('add,added,remove', (e) => {
            Android.updateChannel(e.where)
        })
    }

    /** End */

    /** Start - записываем популярные фильмы */

    // Favorite.listener.follow('add,added', (e) => {
    //     if (e.where == 'history' && e.card.id) {
    //         $.get(Utils.protocol() + 'tmdb.cub.watch/watch?id=' + e.card.id + '&cat=' + (e.card.original_name ? 'tv' : 'movie'))
    //     }
    // })

    /** End */

    /** Start - следим за переключением в лайт версию и обновляем интерфейс */

    Storage.listener.follow('change', (e) => {
        if (e.name == 'light_version') {
            $('body').toggleClass('light--version', Storage.field('light_version'))

            Layer.update()
        }

        if (e.name == 'keyboard_type') {
            $('body').toggleClass('system--keyboard', Storage.field('keyboard_type') == 'lampa' ? false : true)
        }
    })

    /** End */

    /** Start - проверка статуса для торрента */

    let torrent_net = new Reguest()

    function check(name) {
        let item = $('[data-name="' + name + '"]').find('.settings-param__status').removeClass('active error wait').addClass('wait')
        let url = Storage.get(name)

        if (url) {
            torrent_net.timeout(10000)

            torrent_net.native(Utils.checkHttp(Storage.get(name)), () => {
                item.removeClass('wait').addClass('active')
            }, (a, c) => {
                Noty.show(torrent_net.errorDecode(a, c) + ' - ' + url)
                item.removeClass('wait').addClass('error')
            }, false, {
                dataType: 'text'
            })
        }
    }

    Storage.listener.follow('change', function (e) {
        if (e.name == 'torrserver_url') check(e.name)
        if (e.name == 'torrserver_url_two') check(e.name)
        if (e.name == 'torrserver_use_link') check(e.value == 'one' ? 'torrserver_url' : 'torrserver_url_two')
    })

    Settings.listener.follow('open', function (e) {
        if (e.name == 'server') {
            check(Storage.field('torrserver_use_link') == 'one' ? 'torrserver_url' : 'torrserver_url_two')
        } else torrent_net.clear()

        if (e.name == 'interface') {
            $('.settings-param:eq(0)', e.body).on('hover:enter', () => {
                LangChoice.open((code) => {
                    Modal.open({
                        title: '',
                        html: $('<div class="about"><div class="selector">' + Lang.translate('settings_interface_lang_reload') + '</div></div>'),
                        onBack: () => {
                            window.location.reload()
                        },
                        onSelect: () => {
                            window.location.reload()
                        }
                    })

                    Storage.set('language', code, true)
                    Storage.set('tmdb_lang', code, true)
                }, () => {
                    Controller.toggle('settings_component')
                })
            }).find('.settings-param__value').text(Lang.translate(Lang.codes()[Storage.get('language', 'ru')]))
        }
    })

    /** End */

    /** Добавляем класс платформы */

    $('body').addClass('platform--' + Platform.get())

    /** Включаем лайт версию если было включено */

    $('body').toggleClass('light--version', Storage.field('light_version')).toggleClass('system--keyboard', Storage.field('keyboard_type') == 'lampa' ? false : true)

    /** Добавляем hls плагин */

    Utils.putScript([window.location.protocol == 'file:' ? 'https://yumata.github.io/lampa/vender/hls/hls.js' : './vender/hls/hls.js'], () => {
    })

    /** Сообщаем о готовности */

    Lampa.Listener.send('app', {type: 'ready'})

    /** Меню готово */

    Menu.ready()

    /** Лампа полностью готова */

    window.appready = true

    /** Start - активация режима GOD, жмем 🠔🠔 🠕🠕 🠖🠖 🠗🠗 */

    let mask = [37, 37, 38, 38, 39, 39, 40, 40],
        psdg = -1

    Keypad.listener.follow('keydown', (e) => {
        if (e.code == 37 && psdg < 0) {
            psdg = 0
        }

        if (psdg >= 0 && mask[psdg] == e.code) psdg++
        else psdg = -1

        if (psdg == 8) {
            psdg = -1

            console.log('God', 'enabled')

            Noty.show('God enabled')

            window.god_enabled = true
        }
    })

    /** Быстрый доступ к закладкам через кнопки */

    let color_keys = {
        '406': 'history',
        '405': 'wath',
        '404': 'like',
        '403': 'book',
    }

    Keypad.listener.follow('keydown', (e) => {
        if (!Player.opened()) {
            if (color_keys[e.code]) {
                let type = color_keys[e.code]

                Activity.push({
                    url: '',
                    title: type == 'book' ? Lang.translate('title_book') : type == 'like' ? Lang.translate('title_like') : type == 'history' ? Lang.translate('title_history') : Lang.translate('title_wath'),
                    component: 'favorite',
                    type: type,
                    page: 1
                })
            }
        }
    })

    /** Обновление состояния карточек каждые 5 минут */

    let last_card_update = Date.now()
    let lets_card_update = () => {
        if (last_card_update < Date.now() - 1000 * 60 * 5) {
            last_card_update = Date.now()

            Activity.renderLayers().forEach((layer) => {
                $('.card', layer).each(function () {
                    let update = $(this).data('update')

                    if (typeof update == 'function') update()
                })
            })
        }
    }

    setInterval(() => {
        if (!Player.opened()) lets_card_update()
    }, 1000 * 60)

    Player.listener.follow('destroy', () => {
        setTimeout(lets_card_update, 1000)
    })

    Lampa.Listener.follow('activity', (e) => {
        if (e.type == 'archive' && e.object.activity) {
            let update = $('.card.focus', e.object.activity.render()).eq(0).data('update')

            if (typeof update == 'function') update()
        }
    })

    setTimeout(function () {
        const firstFocusable = document.querySelector(
            'button, a, input, [tabindex="0"]'
        );
        if (firstFocusable) {
            firstFocusable.focus();
        }
        // Navigator.follow('focus', (event) => {
        //     Controller.focus(event.elem)
        // })
    }, 1000)

    /** End */
}

prepareApp()

if (Storage.get('language')) {
    /** Принудительно стартовать */
    Keypad.disable()

    setTimeout(startApp, 10000 * 5)

    /** Загружаем плагины и стартуем лампу */

    Plugins.load(startApp)
} else {
    LangChoice.open((code) => {
        Storage.set('language', code, true)
        Storage.set('tmdb_lang', code, true)

        Keypad.disable()

        setTimeout(startApp, 1000 * 5)

        Plugins.load(startApp)
    })

    Keypad.enable()
}
