function Xvideos(component) {
    var network = new Lampa.Reguest();
    // let proxy = ''
    // let proxy = 'https://cors.nb557.workers.dev/'
    let proxy = 'https://cr.clash-corwin3.workers.dev/?'
    const baseUrl = proxy + 'https://www.xvideos.com';

    let durationMapping = {
        'any': '',
        '10+ min': '&durf=10min_more',
        '20+ min': '&durf=20min_more',
    }
    let qualityMapping = {
        'any': '',
        '720p+': '&quality=hd',
        '1080p+': '&quality=1080P',
    }


    this.loadItemDetails = function (item, onComplete, onError) {
        network.silent(item.detailsUrl, (respData) => {
            let match = respData.match(/html5player.setVideoHLS\('(.*\/hls.m3u8.*)'\);/);
            if (!match) {
                Lampa.Noty.show('Video not found');
                onError()
                return
            }
            let hlsDetailsUrl = match[1];

            network.silent(hlsDetailsUrl, (respDt) => {
                try {
                    item.qualities = {};
                    let qualitiesBaseUrl = hlsDetailsUrl.split('hls.m3u8')[0];
                    let p360 = respDt.match(/hls-360p.*/);
                    if (p360) {
                        item.qualities['360p'] = qualitiesBaseUrl + p360[0];
                    }
                    let p480 = respDt.match(/hls-480p.*/);
                    if (p480) {
                        item.qualities['480p'] = qualitiesBaseUrl + p480[0];
                    }
                    let p720 = respDt.match(/hls-720p.*/);
                    if (p720) {
                        item.qualities['720p'] = qualitiesBaseUrl + p720[0];
                    }
                    let p1080 = respDt.match(/hls-1080p.*/);
                    if (p1080) {
                        item.qualities['1080p'] = qualitiesBaseUrl + p1080[0];
                    }
                    var preferably = Lampa.Storage.get('video_quality_default');
                    if (preferably && item.qualities[preferably + 'p']) {
                        item.url = item.qualities[preferably + 'p'];
                    } else {
                        item.url = item.qualities[Object.keys(item.qualities)[Object.keys(item.qualities).length - 1]]
                    }
                    onComplete(item)
                } catch (e) {
                    console.log('xxx', "Error parsing videoDetails: " + e);
                    Lampa.Noty.show('Error parsing videoDetails');
                    onError();
                }
            }, (a, c) => {
                console.log('xxx', "Error loading videoDetails2: " + network.errorDecode(a, c));
                Lampa.Noty.show('Error loading videoDetails2');
                onError();
            }, false, {
                dataType: 'text',
            });
        }, (a, c) => {
            console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
            Lampa.Noty.show('Error loading videoDetails');
            onError();
        }, false, {
            dataType: 'text',
        });
    };

    this.getItems = function (page, filterItems, onComplete, onError) {
        let title = filterItems.find(item => item.titleInput).subtitle;
        let durationFilter = filterItems.find(item => item.durationItem).items.find(item => item.selected).duration;
        let qualityFilter = filterItems.find(item => item.qualityItem).items.find(item => item.selected).quality;

        let pageQuery = page - 1;

        let url = baseUrl;
        if (title) {
            url += '?k=' + encodeURIComponent(title)
            if (pageQuery < 1) {
                pageQuery = ''
            }
            url += '&p=' + pageQuery
            url += durationMapping[durationFilter] + qualityMapping[qualityFilter]
        } else {
            if (pageQuery > 0) {
                url += '/best/' + getPrevMonth() + '/' + pageQuery;
            } else {
                url += '/best/' + getPrevMonth()
            }
        }

        network.silent(url, (respData) => {
            const resultItems = [];
            try {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(respData, 'text/html');
                let videoElements = htmlDoc.querySelectorAll('.mozaique > div[data-video] , .mozaique > div[data-id]');

                if (videoElements.length) {
                    videoElements.forEach(function (element) {
                        let item = buildItem(element);
                        if ((qualityFilter === 'any' || item.quality && extractNumber(item.quality) >= extractNumber(qualityFilter))
                            && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                            resultItems.push(item);
                        }
                    });
                } else {
                    if (!respData.includes('<h3>No video match with this search.</h3>')) {
                        console.log('xxx', "xVideos Error parsing video list: no match");
                        Lampa.Noty.show("xVideos Error parsing video list: no match");
                        // onError();
                    }
                }
            } catch (e) {
                console.log('xxx', "xVideos Error parsing video list: " + e);
                Lampa.Noty.show('xVideos Error parsing video list');
                // onError();
            }
            onComplete(resultItems)
        }, (a, c) => {
            console.log('xxx', "xVideos Error loading video list: " + network.errorDecode(a, c));
            Lampa.Noty.show('xVideos Error loading video list');
            onComplete([])
        }, false, {
            dataType: 'text',
        });
    }

    function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
    }

    function getPrevMonth() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // First, go to the 1st day of the current month
        const firstOfThisMonth = new Date(year, month, 1);

        // Subtract one day to get the last day of the previous month
        const lastOfPrevMonth = new Date(firstOfThisMonth - 1);

        // Pick the smaller of the original day and last day of prev month
        const newDay = Math.min(day, lastOfPrevMonth.getDate());

        return new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), newDay).toISOString().slice(0, 7);
    }

    function buildItem(element) {
        const item = {};
        item.name = element.querySelector(".thumb-under > p.title > a , .video-under .video-title a")?.childNodes[0].nodeValue
        item.picture = proxy + element.querySelector(".thumb-inside a > img[data-videoid] , .video-thumb a img")?.getAttribute('data-src')
        let href = element.querySelector(".thumb-inside a , a.thumb-link").href;
        if (href.startsWith('http')) {
            href = href.replace(/^.*\/\/[^\/]+/, '')
        }
        item.detailsUrl = baseUrl + '/' + href

        item.time = element.querySelector(".thumb-under > p.metadata span.duration, .video-under .video-metadata span.duration")?.textContent
        item.quality = element.querySelector(".thumb-inside a > span, .video-hd-mark")?.textContent

        item.sourceName = 'xvideos';
        return item;
    }
}


export default Xvideos
