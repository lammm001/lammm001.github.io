function SpankBang(component) {
    var network = new Lampa.Reguest();
    let proxy = ''
    // let proxy = 'https://cr1.lammm.deno.net/'
    const baseUrl = proxy + 'https://spankbang.com';
    const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:151.0) Gecko/20100101 Firefox/151.0';
    let cookie = 'coc=PL; cor=ENG; coe=ww; cookie_consent=eyJ1dWlkIjoiYmNmYmMwY2YtODZiNy00YWY2LWFiNTQtMmM2YWYyYjU0NGZjIiwidGltZXN0YW1wIjoxNzgxMjUzNDI3NDE0LCJjYXRlZ29yaWVzIjp7ImVzc2VudGlhbCI6dHJ1ZSwiZnVuY3Rpb25hbCI6dHJ1ZSwiYW5hbHl0aWNzIjp0cnVlLCJ0YXJnZXRpbmciOnRydWV9LCJ2ZXJzaW9uIjoidjEuMCIsInVzZXJfaWQiOjB9; cookie_consent_required=1; show_cookie_consent_modal=1; cfc_ok=00|2|ww|spankbang|master|0; av=simple:True:True; sb_session=eyJfcGVybWFuZW50Ijp0cnVlLCJ1c2VyIjp7ImlkIjowfX0.aivFMw.Svfl-e1JAZFH86AS4a28fWSZfEM; backend_version=main; __cf_bm=bHo.CcBJuzTcOPuXoYBq1Vnk1YSSUpv3W1xyr3iiurM-1781253420.1287293-1.0.1.1-mSmfsfIA9AOtIpRHKdUhUC7bUuXFBsGcAmqAAJPrtZM79uJIKILVTPez01TBGQx6R.fUkQsUCjgZKrFLULUuMYzs2z7RXTzbOB3luSn0lkCcRaAvATtuHL2iBtTObutD; media_layout=six-col; cf_clearance=tUnGZBUZmw5j9WXtsF2qI51i3Hu_bLudZYCo90vY1aw-1781253420-1.2.1.1-Cy.bNBXwp5Hzutgbc1HDFqsaycqRibsaJCfUMagEGPER_gKV89iWQpWDlUQ2fSqxAEy_4h2Kt2_Rqzhsh8BvJnuRkyldiOUZews.oAptJbN_VrvsOIJalmIc3UH1sKnzOGPPQdqFjU6pxGHSktDQYBqhwMGcOuyhPPFyTm.X3Ck7ax9.bZCksvD9xaymiTSNOW6HPJ6HPITeKdyVKaSGFiMBxIw40zOwknTVggG6bUoqRi8.Oo.7ablWaS8CqAm369KchDo9EGnQ9.sKxACEVklqagIThylfPJ_uNvwFjuN_BWFHsi6Rho8ZFyz81SB9gd8K1WJzdSW4h.znkOTOuA; age_pass=1'
    let durationMapping = {
        'any': '',
        '10+ min': '&d=10',
        '20+ min': '&d=20',
    }
    let qualityMapping = {
        'any': '',
        '720p+': '&q=hd',
        '1080p+': '&q=fhd',
    }

    this.getItems = function (page, filterItems, onComplete, onError) {
        let title = filterItems.find(item => item.titleInput).subtitle;
        let durationFilter = filterItems.find(item => item.durationItem).items.find(item => item.selected).duration;
        let qualityFilter = filterItems.find(item => item.qualityItem).items.find(item => item.selected).quality;
        let url = baseUrl;
        if (title) {
            url += '/s/' + encodeURIComponent(title)
        } else {
            url += '/ci/channel/nubile+films'
        }
        url += '/' + page;
        url += '/?o=all' + durationMapping[durationFilter] + qualityMapping[qualityFilter]
        // 'https://cors.nb557.workers.dev:8443/'+
        network.native(url, (respData) => {
            // network.native(url, (respData) => {
            const resultItems = [];
            try {
                let respDataFixed = respData.replace(/\n/g, '')

                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(respData, 'text/html');
                let videoElements = htmlDoc.querySelectorAll('[data-testid="main"] [x-data="videoList"] div[data-id]');
                // let match = respDataFixed.match(/<div class="results results_search">(<div class="video-list.*)<.* class="paginat/);
                // if (!match) {
                //     match = respDataFixed.match(/p>(<div class="video-list.*)<div class="pagination"/);
                // }
                if (videoElements.length) {
                    // var rootDiv = document.createElement("div");
                    // rootDiv.innerHTML = match[1];
                    // let videoElements = rootDiv.querySelectorAll("div[data-id][id]")
                    videoElements.forEach(function (element) {
                        let item = buildItem(element);
                        let itemQuality = item.quality;
                        if (itemQuality === 'HD') {
                            itemQuality = '1080p'
                        } else if (itemQuality === '4K') {
                            itemQuality = '2160p'
                        }
                        if ((qualityFilter === 'any' || itemQuality && extractNumber(itemQuality) >= extractNumber(qualityFilter))
                            && (durationFilter === 'any' || item.time && extractNumber(item.time) >= extractNumber(durationFilter))) {
                            resultItems.push(item);
                        }
                    });
                    // rootDiv.remove()
                } else {
                    if (!respDataFixed.includes('<div id="search_empty">')) {
                        console.log('xxx', "Spank: Error parsing video list: no match");
                        Lampa.Noty.show('Spank: Error parsing video list');
                        // onError();
                    }
                }
            } catch (e) {
                console.log('xxx', "Spank: Error parsing video list: " + e);
                Lampa.Noty.show('Spank: Error parsing video list');
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
                // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                // 'sec-ch-ua-mobile': '?1',
                // 'Host': 'spankbang.com',
                // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:151.0) Gecko/20100101 Firefox/151.0',
                // 'Accept-Language': 'en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7,en-RU;q=0.6,de-DE;q=0.5,de;q=0.4',
                // 'Accept-Encoding': 'gzip, deflate, br, zstd',
                // 'Alt-Used': 'spankbang.com',
                // 'TE': 'trailers',
                'User-Agent': agent,
                'Cookie': cookie
            }
        });
    }

    this.loadItemDetails = function (item, onComplete, onError) {
        network.native(item.detailsUrl, (respData) => {
            try {
                let match = respData.replace(/\n/g, '')
                    .match(/var stream_data = (.*);\n?.*var live_keywords/);

                let dataJson = JSON.parse(match[1].replace(/'/g, '"'));
                item.qualities = {};
                let p320 = dataJson['320p'];
                if (p320 && p320[0]) {
                    item.qualities['320p'] = p320[0];
                }
                let p480 = dataJson['480p'];
                if (p480 && p480[0]) {
                    item.qualities['480p'] = p480[0];
                }
                let p720 = dataJson['720p'];
                if (p720 && p720[0]) {
                    item.qualities['720p'] = p720[0];
                }
                let p1080 = dataJson['1080p'];
                if (p1080 && p1080[0]) {
                    item.qualities['1080p'] = p1080[0];
                }
                let p2160 = dataJson['4k'];
                if (p2160 && p2160[0]) {
                    item.qualities['2160p'] = p2160[0];
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
            component.empty(network.errorDecode(a, c));
            console.log('xxx', "Error loading videoDetails: " + network.errorDecode(a, c));
            Lampa.Noty.show('Error loading videoDetails');
            onError();
        }, false, {
            dataType: 'text',
            headers: {
                'User-Agent': agent,
                'Cookie': cookie
                // 'my_Referer': 'https://spankbang.com',
                // 'my_Cookie': cookie
            }
        });
    }

    function extractNumber(string) {
        var thenum = string.replace(/^\D+/g, '');
        return parseInt(thenum);
    }

    function buildItem(element) {
        const item = {};
        item.name = element.querySelector('a > picture > img').getAttribute('alt')
        item.picture = proxy + element.querySelector('a > picture > img')?.getAttribute('src')
        item.time = element.querySelector('div[data-testid="video-item-length"]')?.textContent
        // item.quality = element.querySelector('a[x-data="videoItem"] .left-2')?.textContent
        item.quality = "1080p"
        let href = element.querySelector('a').href;
        if (href.startsWith('http')) {
            href = href.replace(/^.*\/\/[^\/]+/, '')
        }
        let detailsUrl = baseUrl + '/' + href
        item.detailsUrl = detailsUrl;
        item.sourceName = 'spankBang';
        return item;
    }
}


export default SpankBang
