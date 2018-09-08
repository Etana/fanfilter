var $ = function (query, root) {
  if (query[0] == '<') {
    var t = document.createElement('div');
    t.innerHTML = query;
    return [...t.childNodes];
  }
  root = root || document;
  return [...root.querySelectorAll(query)];
};

var anchor = $('.tab-content,.z-list')[0];
var root = $('<div style="text-align: center"><input type="text" placeholder="enter filter such as needle -needle fav>20" style="width:80%"/></div>')[0];
anchor.parentNode.insertBefore(root, anchor);
var input = root.firstChild;
var filter_name = location.pathname.slice(0,13) === '/communities/' ? 'fanfilter_community' : 'fanfilter_story';
input.onchange = function () {
  treat_input(this.value);
  localStorage[filter_name] = this.value;
};
if (localStorage[filter_name] && /\S/.test(localStorage[filter_name])) {
  input.value = localStorage[filter_name];
  input.onchange();
}

function treat_input (input) {
    var criteria_shorthand = {
        "c": "char",
        "chapters": "chapter",
        "f": "fandom",
        "favs": "fav",
        "follows": "follow",
        "p": "published",
        "r": "rated",
        "rate": "rated",
        "rating": "rated",
        "reviews": "review",
        "s": "sort",
        "u": "updated",
        "w": "word",
        "words": "word",
    };
    function treat_token (content, criteria, op) {
        criteria = criteria || ":";
        var operator = criteria.slice(-1);
        criteria = criteria_shorthand[criteria.slice(0, -1)] || criteria.slice(0, -1);
        crit[op][criteria] = crit[op][criteria] || [];
        crit[op][criteria].push(content);
    }
    if (filter_name === 'fanfilter_community') {
        var sortingToId = {
            'staff': 1,
            'archive': 2,
            'followers': 3,
            'created': 4,
            'random': 99,
        };
    } else {
        var sortingToId = {
            'updated': 1,
            'published': 2,
            'review': 3,
            'fav': 4,
            'follow': 5,
        };
        if (location.pathname.startsWith('/community/')) {
            sortingToId.archived = 0;

        }
    }

    var crit = {'':{}, '-': {}, '~': {}};

    input = input.toLowerCase().replace(/(?:^|\s)([~-])?([a-z]+:)?"([^"]*)"/ig, function(_, op, criteria, content){
        treat_token(content, criteria, op || '');
        return ' ';
    });

    input.replace(/(?:^|\s)([~-])?([a-z]+:)?(\S+)/ig, function(_, op, criteria, content){
        treat_token(content, criteria, op || '');
    });
    // if we have not done any search, apply search for rated:all or sort:* options
    if (location.search === "" && $('select[name="sortid"], select[name="s"]').length) {
        new_search = {};
        if (crit[''].rated && crit[''].rated.includes('all') && $('select[name="censorid"] option[value="103"][selected],select[name="censorid"] option[value="3"][selected]').length) {
            new_search.r = 10;
        }
        if (crit[''].sort) {
            var sorting = crit[''].sort.slice(-1);
            var sortingId = sortingToId[criteria_shorthand[sorting] || sorting];
            if (sortingId !== undefined && ($('select[name="sortid"], select[name="s"]')[0]||{}).value != sortingId) {
                new_search.srt = sortingId;
            }
        }
        if (Object.keys(new_search).length) {
            if (filter_name === 'fanfilter_community') {
                if (new_search.srt && location.pathname.endsWith('/') && location.pathname.split('/').length === 5) {
                    location.pathname = location.pathname + (location.pathname.endsWith('/0/') ? '' : '0/' )+ new_search.srt + '/1/';
                    return;
                }
            } else {
                if (location.pathname.startsWith('/community/')) {
                    if (location.pathname.endsWith('/') && location.pathname.split('/').length === 5) {
                        location.pathname = location.pathname + (new_search.r && 99 || 3) + '/'+(new_search.srt || 0)+'/1/0/0/0/0/';
                        return;
                    }
                } else {
                    location.search = "?"+ Object.keys(new_search).map(k => k+'='+new_search[k]).join('&');
                    return;
                }
            }
        }
    }
    /* TODO: maybe optimize results per page by making an real search */
    var match_time = function (diff_days, term) {
        var factor = {
            w: 7,
            y: 365,
            m: 30,
        };
        var comp = (val, op) => val === op;
        if (term[0] === '<') {
            term = term.slice(1);
            comp = (val, op) => val < op;
        }
        if (term[0] === '>') {
            term = term.slice(1);
            comp = (val, op) => val > op;
        }
        var match = term.match(/^\s*(\d+)\s*([a-z]*)\s*$/i);
        var op = +match[1] * (factor[match[2].slice(0,1).toLowerCase()] || 1);
        return comp(diff_days, op);
    };
    var match_num = function (key, term, el) {
        var comp = (val, op) => val === op;
        if (term[0] === '<') {
            term = term.slice(1);
            comp = (val, op) => val < op;
        }
        if (term[0] === '>') {
            term = term.slice(1);
            comp = (val, op) => val > op;
        }
        var num = +($('.z-padtop2.xgray', el)[0].innerText.match(new RegExp('- '+key+': ([0-9,]+) -')) || ['', '0'])[1].replace(/,/g, '');
        return comp(num, term);
    };
    var criteria_accepted = {
        archive: function (term, el) {
            return match_num('Archive', term, el);
        },
        chapter: function (term, el) {
            return match_num('Chapters', term, el);
        },
        char: function (term, el) {
            var end_content = ($('.z-padtop2.xgray', el)[0].lastChild.nodeValue || "").slice(3);
            if (end_content.slice(-11) === " - Complete") {
                end_content = end_content.slice(0, -11);
            }
            return end_content.toLowerCase().indexOf(term) !== -1;
        },
        fandom: function (term, el) {
            var fandom = $('.z-padtop2.xgray', el)[0].firstChild.nodeValue.match(/^(.* - )?Rated: \S+ - \S+ - (\S+) /)[1];
            return fandom.toLowerCase().indexOf(term) !== -1;
        },
        fav: function (term, el) {
            return match_num('Favs', term, el);
        },
        follow: function (term, el) {
            return match_num('Follows', term, el);
        },
        followers: function (term, el) {
            return match_num('Followers', term, el);
        },
        genre: function (term, el) {
            var genre = $('.z-padtop2.xgray', el)[0].firstChild.nodeValue.match(/(?:^| - )Rated: \S+ - \S+ - (\S+) /)[1];
            return genre.toLowerCase().indexOf(term) !== -1;
        },
        is: function (term, el) {
            if (term === "complete") {
                return $('.z-padtop2.xgray', el)[0].lastChild.nodeValue.slice(-11) === " - Complete";
            }
            if (term === "crossover") {
                return $('.z-padtop2.xgray', el)[0].firstChild.nodeValue.slice(0, 12) === "Crossover - ";
            }
            if (term === "ongoing") {
                return !criteria_accepted.is('complete', el);
            }
            if (term === "yaoi") {
                var text = el.innerText.toLowerCase();
                var match = text.match(/(\bnot?-?|femm?e?s?-?)?\s*(?:yaoi|slashs?\b|boyxboy|boy love)/);
                return (!!match) && !match[1];
            }
            if (term === "yuri") {
                var text = el.innerText.toLowerCase();
                var match = text.match(/(\bnot?-?)?\s*(?:yuri|lesbian|femm?e?!?\s*-?slash|girl love|femalexfemale|girlxgirl|\bf\/f\b|\bofc\/ofc\b|girlxgirl)/);
                return (!!match) && !match[1];
            }
            return true;
        },
        lang: function (term, el) {
            var lang = $('.z-padtop2.xgray', el)[0].firstChild.nodeValue.match(/(?:^| - )Rated: \S+ - (\S+) /)[1];
            return lang.toLowerCase().indexOf(term) !== -1;
        },
        pair: function (term, el) {
            var end_content = ($('.z-padtop2.xgray', el)[0].lastChild.nodeValue||"").slice(3).toLowerCase();
            if (/^[<>]?[0-9]+$/.test(term)) {
                var comp = (val, op) => val === op;
                if (term[0] === '<') {
                    term = term.slice(1);
                    comp = (val, op) => val < op;
                }
                if (term[0] === '>') {
                    term = term.slice(1);
                    comp = (val, op) => val > op;
                }
                var pairs = end_content.match(/\[([^\]]+)\]/g) || []
                for (var pair in pairs) {
                    if (comp(pairs[pair].split(', ').length, term)) {
                        return true;
                    }
                }
            }
            return (end_content.match(/\[([^\]]+)\]/g) || []).filter(
                pairing => term.split('/').filter(
                    term => term.slice(0, 1) === '-' ? pairing.indexOf(term.slice(1)) !== -1 : pairing.indexOf(term) === -1
                ).length === 0
            ).length !== 0;
        },
        published: function (term, el) {
            var diff_days = (+new Date()/1000 - [...$('[data-xutime]', el)].slice(-1)[0].getAttribute('data-xutime'))/86400;
            return match_time(diff_days, term);
        },
        rated: function (term, el) {
            if (term === "all") {
                return true;
            }
            var rate = $('.z-padtop2.xgray', el)[0].firstChild.nodeValue.match(/(?:^| - )Rated: ([MKT]|K\+) -/)[1];
            return rate.toLowerCase() === term;
        },
        review: function (term, el) {
            return match_num('Reviews', term, el);
        },
        staff: function (term, el) {
            return match_num('Staff', term, el);
        },
        updated: function (term, el) {
            var diff_days = (+new Date()/1000 - [...$('[data-xutime]', el)][0].getAttribute('data-xutime'))/86400;
            return match_time(diff_days, term);
        },
        word: function (term, el) {
            return match_num('Words', term, el);
        },
        '': function (term, el) {
            var text = el.innerText.toLowerCase();
            return text.indexOf(term) !== -1;
        },
    };

    var rejecting = [[], new Set()];

    var try_reject = function (rejecting) {
        if (rejecting[0].length === 0) {
            return;
        }
        rejecting[0].forEach(e => e.style.display = 'none');
        var info = $('<div class="z-list reject" style="font-weight: bold; font-style: italic; text-align: center;1px #cdcdcd solid"/>');
        info.forEach(e => rejecting[0][0].parentNode.insertBefore(e, rejecting[0][0]));
        info.forEach(e => e.innerText = rejecting[0].length + ' hidden because did not match '+[...rejecting[1]].join(', '))
        rejecting[0] = [];
        rejecting[1].clear();
    };
    rejecting[0].forEach(e => e.style.display = 'none')
    $('.z-list.reject').forEach(e => e.remove())
    $('.z-list').forEach(e => e.style.display = '');
    $('.z-list').forEach(function (e) {
        var crit_nomatch = new Set();
        var any_nomatch = new Set();
        op_loop:
        for (var op in crit) {
            for (var criteria in crit[op]) {
                for (var term of crit[op][criteria]) {
                    try {
                        var result = (criteria_accepted[criteria] || function () { return true; })(term, e);
                        switch (op) {
                            case "~":
                                // result is ok if at least one ~ token is true
                                if (result) {
                                    any_nomatch.clear();
                                    continue op_loop;
                                }
                                any_nomatch.add(op + (criteria ? criteria + ':' : '') + term);
                                break;
                            case "-":
                                result = !result;
                            default:
                                if (!result) {
                                    crit_nomatch.add(op + (criteria ? criteria + ':' : '') + term);
                                }
                        }
                    } catch (err) {
                        console.log('[fanfilter]: error applying '+criteria+':'+term+' for '+e.firstElementChild.getAttribute('href')+' on '+location.href+' ('+err+')');
                    }
                }
            }
        }
        if (crit_nomatch.size || any_nomatch.size) {
            rejecting[0].push(e);
            rejecting[1] = new Set([...rejecting[1], ...crit_nomatch, ...any_nomatch]);
            return;
        }
        try_reject(rejecting);
    });
    try_reject(rejecting);
}
