function xXamster(component) {
    var network = new Lampa.Reguest();
    // let proxy = ''
    // let proxy = 'https://cors.fx666.workers.dev/'
    // let proxy = 'https://cr1.lammm.deno.net/'
    let proxy = ''
    const baseUrl = proxy + 'https://ru.xhamster.com';

    let durationMapping = {
        'any': '',
        '10+ min': '&min-duration=10',
        '20+ min': 'min-duration=20',
    }
    let qualityMapping = {
        'any': '',
        '720p+': '&quality=720p',
        '1080p+': '&quality=1080p',
    }
    this.loadItemDetails = function (item, onComplete, onError) {
        network.silent(proxy + item.detailsUrl, (respData) => {
            let match = respData.match(/<link rel="preload" href="(.{10,400}?\.m3u8)"/);
            if (!match) {
                Lampa.Noty.show('Video not found');
                onError()
                return
            }
            item.qualities = {};
            let hlsDetailsUrl = match[1];

            item.url = hlsDetailsUrl


            // var preferably = Lampa.Storage.get('video_quality_default');
            // if (preferably && item.qualities[preferably + 'p']) {
            //     item.url = item.qualities[preferably + 'p'];
            // } else {
            //     item.url = item.qualities[Object.keys(item.qualities)[Object.keys(item.qualities).length - 1]]
            // }
            onComplete(item)
        }, (a, c) => {
            console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
            Lampa.Noty.show('Error loading videoDetails');
            onError();
        }, false, {
            dataType: 'text',
            headers: {
                'x-cors-headers': JSON.stringify({
                    'User-Agent': 'lampa',
                    'Origin': 'https://ru.xhamster.com',
                    'Referer': 'https://ru.xhamster.com'
                })
            }
        });
    }

    this.getItems = function (page, filterItems, onComplete, onError) {
        let title = filterItems.find(item => item.titleInput).subtitle;
        let durationFilter = filterItems.find(item => item.durationItem).items.find(item => item.selected).duration;
        let qualityFilter = filterItems.find(item => item.qualityItem).items.find(item => item.selected).quality;


        let url = baseUrl;
        if (title) {
            url += '/search/' + encodeURIComponent(title)
            url += '?page=' + page
            url += durationMapping[durationFilter] + qualityMapping[qualityFilter]
        } else {
            url += '/search/joymii?page=' + page
        }

        network.silent(url, (respData) => {
            const resultItems = [];
            try {
                let respDataFixed = respData.replace(/\n/g, '')
                let match = respDataFixed.match(
                    /window\.initials=(.*?);<\/script>/);

                if (match) {
                    let initialsJson = JSON.parse(match[1]);

                    initialsJson.searchResult.videoThumbProps.forEach(function (element) {
                        let item = buildItem(element);
                        if ((qualityFilter === 'any' || item.quality && extractNumber(item.quality) >= extractNumber(qualityFilter))
                            && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                            resultItems.push(item);
                        }
                    });
                } else {
                    if (!respDataFixed.includes('Sorry, no video found for this query')) {
                        console.log('xxx', "xHamster: Error parsing video list: no match");
                        Lampa.Noty.show("xHamster: Error parsing video list: no match");
                        // onError();
                    }
                }
            } catch (e) {
                console.log('xxx', "xHamster: Error parsing video list: " + e);
                Lampa.Noty.show('xHamster: Error parsing video list');
                // onError();
            }
            onComplete(resultItems)
        }, (a, c) => {
            console.log('xxx', "Error loading video list: " + network.errorDecode(a, c));
            Lampa.Noty.show('Error loading video list');
            onComplete([])
        }, false, {
            dataType: 'text',
            headers: {
                'my_sec-ch-ua-mobile': '?0',
                'my_sec-ch-ua-platform': 'Windows',
                // 'my_Cookie': 'settings=eyJpc1dlYnBTdXBwb3J0ZWQiOnRydWUsImlzV2VibVN1cHBvcnRlZCI6dHJ1ZSwiZXh0RGV0ZWN0ZWRWMiI6bnVsbCwibW9tZW50c0lzSGlkZGVuIjpudWxsLCJ0cnVzdFVSTHMiOlsicnUueGhhbXN0ZXIuY29tIl0sImlzU2lkZWJhckhpZGRlbiI6bnVsbCwiZXhwaXJlcyI6eyJ0cnVzdFVSTHMiOjE3ODAxNTc3MzJ9LCJ0c1Nwb3RDb3VudGVycyI6W3sic3BvdCI6Im1hc3Rlcl9jdWJlIiwidGltZSI6MTc4MDE1MDUzMiwiY291bnQiOjF9LHsic3BvdCI6Im1hc3Rlcl9mb290ZXIiLCJ0aW1lIjoxNzgwMTUwNTMyLCJjb3VudCI6MX1dfQ%3D%3D; _cfg=d8a7a65a0fd32bb3a48d70e99295f60d; x_csrf_token=1; cookie_accept_v2=%7B%22e%22%3A1%2C%22f%22%3A1%2C%22t%22%3A1%2C%22a%22%3A1%7D; parental-control=yes',
                'x-cors-headers': JSON.stringify({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:151.0) Gecko/20100101 Firefox/151.0',
                    'Origin': 'https://ru.xhamster.com',
                    'Referer': 'https://ru.xhamster.com'
                })
            }
        });
    }

    function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
    }

    function buildItem(element) {
        const item = {};
        item.name = element.title
        item.picture = proxy + element.thumbURL
        // item.picture = 'https://cr1.lammm.deno.net/' + element.querySelector("img.thumb-image-container__image")?.getAttribute('src')

        // let href = element.pageURL;

        // if (href.startsWith('http')) {
        //     href = href.replace(/^.*\/\/[^\/]+/, '')
        // }
        // item.detailsUrl = baseUrl + '/' + href
        item.detailsUrl = element.pageURL;

        item.time = parseInt(element.duration / 60) + 'm'

        // let qualityTxt = element.querySelector(".thumb-image-container__duration > i")?.getAttribute('class');
        // item.quality = qualityTxt?.includes("--uhd") ? '2160p' : "1080p"
        item.quality = "1080p"
        item.sourceName = 'xxamster';
        return item;
    }
}


export default xXamster
