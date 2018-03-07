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
        "reviews": "review",
        "u": "updated",
        "w": "word",
        "words": "word",
    };
    function treat_token (content, criteria, neg) {
        criteria = criteria || ":";
        var operator = criteria.slice(-1);
        criteria = criteria_shorthand[criteria.slice(0, -1)] || criteria.slice(0, -1);
        var list = neg === "-" ? reject : accept;
        list[criteria] = list[criteria] || [];
        list[criteria].push(content);
    }

    var accept = {};
    var reject = {};

    input = input.toLowerCase().replace(/(?:^|\s)(-)?([a-z]+:)?"([^"]*)"/ig, function(_, neg, criteria, content){
        treat_token(content, criteria, neg);
        return ' ';
    });

    input.replace(/(?:^|\s)(-)?([a-z]+:)?(\S+)/ig, function(_, neg, criteria, content){
        treat_token(content, criteria, neg);
    });
    /*
     * TODO: optimize by making an expected search
    }*/
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
                var match = text.match(/(\bnot?-?)?\s*(?:yaoi|slashs?\b|boyxboy|boy love)/);
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
            return (end_content.match(/\[([^\]]+)\]/g) || []).filter(pairing => term.split('/').filter(term => pairing.indexOf(term) === -1).length === 0).length !== 0;
        },
        published: function (term, el) {
            var diff_days = (+new Date()/1000 - [...$('[data-xutime]', el)].slice(-1)[0].getAttribute('data-xutime'))/86400;
            return match_time(diff_days, term);
        },
        rated: function (term, el) {
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
        for (var list of [accept, reject]) {
            for (var criteria in list) {
                for (var term of list[criteria]) {
                    try {
                        if ((criteria_accepted[criteria] || function () { return list === accept })(term, e) !== (list === accept)) {
                            rejecting[0].push(e);
                            rejecting[1].add((list === accept ? '': '-') + (criteria ? criteria + ':' : '') + term);
                            return;
                        }
                    } catch (err) {
                        console.log('[fanfilter]: error applying '+criteria+':'+term+' for '+e.firstElementChild.getAttribute('href')+' on '+location.href+' ('+err+')');
                    }
                }
            }
        }
        try_reject(rejecting);
    });
    try_reject(rejecting);
}
