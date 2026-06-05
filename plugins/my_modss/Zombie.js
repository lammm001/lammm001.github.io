function Zombie(_component, _params) {
    let component = _component
    let params = _params
    let network = new Lampa.Reguest();
    let corsProxy = 'https://cr.clash-corwin3.workers.dev/?'

    let choice = {
        season: 0,
        voice: 0,
        last_viewed: ''
    };
    let seasons = [];
    let origTitle;

    this.search = function (_params, kinopoiskId) {
        origTitle = params.movie.original_title || params.movie.original_name;

        network.silent('https://apilm.kinogram.best/embed/kp/' + kinopoiskId, function onComplete(respData) {
            try {
                let respDataFixed = respData.replace(/\n/g, '')
                let match = respDataFixed.match(/makePlayer\((\{.*?\})\);/);
                if (!match) {
                    Lampa.Noty.show('Video not found');
                    component.loading(false);
                    return
                }
                var obj = eval('(' + match[1] + ')');
                var jsonStr = JSON.stringify(obj);
                let videoDetailsJson = JSON.parse(jsonStr);
                if (videoDetailsJson.playlist) {
                    seasons = videoDetailsJson.playlist.seasons
                    getEpisodes()
                } else {
                    let videoItem = new VideoItem();
                    videoItem.title = videoDetailsJson.title
                    // videoItem.quality = '1080p'
                    videoItem.info = videoDetailsJson.source.audio.names.join(', ')
                    videoItem.url = videoDetailsJson.source.hls
                    videoItem.subtitles = videoDetailsJson.source.cc ? videoDetailsJson.source.cc.map(subs => {
                        return {
                            label: subs.name,
                            url: subs.url
                        };
                    }) : false
                    videoItem.audioTracks = videoDetailsJson.source.audio.names.map(function (name) {
                        return {
                            language: name
                        };
                    });
                    showVideoList([videoItem])
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
        }, null, {
            // headers: {
            //     'my_User-Agent': 'lampa'
            // },
            dataType: 'text'
        })
    }

    this.extendChoice = function (saved) {
        Lampa.Arrays.extend(choice, saved, true);
    }

    function getEpisodes() {
        // if(choice.season===0){
        //     choice.season = 1
        // }
        let season = seasons.find(s => s.season === (choice.season + 1));
        showVideoList(season.episodes.map(episode => {
            let videoItem = new VideoItem();
            videoItem.seasonNum = season.season
            videoItem.episodeNum = episode.episode
            videoItem.title = 'S' + videoItem.seasonNum + ' / E' + videoItem.episodeNum
            // videoItem.quality = '1080p'
            videoItem.subtitles = episode.cc ? episode.cc.map(subs => {
                return {
                    label: subs.name,
                    url: subs.url
                };
            }) : false
            videoItem.audioTracks = episode.audio.names.map(function (name) {
                return {
                    language: name
                };
            });
            videoItem.url = episode.hls
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

        let filter_items = {
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

            element.on('hover:enter', function () {
                choice.last_viewed = videoItem.episodeNum;
                if (params.movie.id) Lampa.Favorite.add('history', params.movie, 100);
                videoItem.playlist = videoItems
                videoItem.selectedSubsIdx = component.getSelectedSubsIdx(videoItem.subtitles);
                videoItem.translate = {
                    tracks: videoItem.audioTracks,
                    selectedIdx: component.getSelectedTrackIdx(videoItem.audioTracks)
                }
                Lampa.Player.play(videoItem);
                Lampa.Player.playlist(videoItems)
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
        selectedSubsIdx
        info
        videoId
        title
        url
        timeline
        quality
        qualitys
        playlist
        audioTracks
    }
}


export default Zombie
