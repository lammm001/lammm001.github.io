function SpankBang(component) {
    var network = new Lampa.Reguest();
    // let proxy = ''
    // let proxy = 'https://vi1pr.netlify.app/pr/'
    let proxy = 'https://cr-jgp4.onrender.com/'
    const baseUrl = proxy + 'https://spankbang.com';
    let cookie = 'coe=ww; cookie_consent_required=1; show_cookie_consent_modal=1; age_pass=1; coc=PL; cor=Unknown; cfc_ok=00|2|ww|spankbang|master|0; av=simple:False:True; backend_version=main; _cfuvid=JQkhuxq5tUhWAr7SYBWKt287axcY00PKgwRwKE6S4P4-1780241291.6168897-1.0.1.1-hupyIZk_UUFjyAYSm0PJmKhy6btmP7iHigB.v0Xe2d0; sb_session=eyJfcGVybWFuZW50Ijp0cnVlLCJ1c2VyIjp7ImlkIjowfX0.ahxTjQ.Y83sNaldPrkAKvSr719jGVz1wcM; ana_vid=40e3da24135c8aa1951fb0101e27d0114fa33d862a85f7ead242a7b91380163e; ana_sid=40e3da24135c8aa1951fb0101e27d0114fa33d862a85f7ead242a7b91380163e; cf_clearance=_zDLdwOxuWpuMUu5Jtqo6L7yv3fUun6nrfURfN_u.T4-1780241299-1.2.1.1-SjMXkaP5Y6_Zlf4YWZukqzez2dfFtFk2aN8Yrlm1iaEF7n0Vuh4NrSaq7DNS2ZhSSub45VYHRBb.._0.AoVMoywJvswa4XnIk0VHpxoSk1iS7_fDfoijvHtt9vP5MRhaVWqT5RxqqKddE5RaoEECRMf.9ae1Wy15Q9SMijLTKtxcmkCK0O87AU4GbrRhh9tIlbaBtIQ.xlEcdz.DsXyH3fN4BqvYX0YAD_CA5uqUZOrkGxkgKjTXzfcOLyO1wURxDuuLTZuhIV2RjI55LJN9hrKuBvgLvuZkr9OlyYtMeMpvsENeC0MG3mumrMYSDVl1cSnfemSuivTCJe0VySJ8aA; __cf_bm=Hr2Yhi2o2Zar4M86H2Yl7nm7vUNHk7tsD09YMnYqQLI-1780241299.6080015-1.0.1.1-V2Nsrt_ri3_2D7NbvFliyEceNoUlk07VCP4O67DVN4jmZTzUbYISAA4n9TMDr8ZDS8QYaQERCMJcKsqKyJqfjU8rLHt1.KYA7jpxBm5gE.mjdDmwcetF2wEWY1gp1Tom; media_layout=four-col; cookie_consent=eyJ1dWlkIjoiY2Q4NjJlZmQtOTY3My00OWU1LWE2YmItYzBiYWFlMDc2YzZkIiwidGltZXN0YW1wIjoxNzgwMjQxMzM2NDE1LCJjYXRlZ29yaWVzIjp7ImVzc2VudGlhbCI6dHJ1ZSwiZnVuY3Rpb25hbCI6dHJ1ZSwiYW5hbHl0aWNzIjp0cnVlLCJ0YXJnZXRpbmciOnRydWV9LCJ2ZXJzaW9uIjoidjEuMCIsInVzZXJfaWQiOjB9\n'

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
                'my_User-Agent': 'PostmanRuntime/7.54.0',
                'my_Cookie': cookie
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
                'my_User-Agent': 'PostmanRuntime/7.54.0',
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
