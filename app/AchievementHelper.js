import Api from './api.js';

export default class AchievementHelper {
    constructor(options) {
        this.api = new Api(options.Api);

        this.lostMode = true;
        this.keeperMode = true;
        this.afterbirth = true;
        this.afterbirthplus = true;
        this.repentance = true;
        this.repentanceplus = true;
        this.userAchievements = [];

        this.tooltipImages = {
            AddedRep: "https://bindingofisaacrebirth.wiki.gg/images/f/f2/Dlc_r_indicator.png",
            AddedRepPlus: "https://bindingofisaacrebirth.wiki.gg/images/Dlc_r%2B_indicator.png",
        };

        $.expr[':'].nocontent = obj =>
            !($.trim($(obj).text()).length) && !$(obj).children().length;

        this._bindUI();
        this._initSteamId();
        this._loadDataAndUpdate();
    }

    _bindUI() {
        $('#loginManual').submit(e => {
            window.location.hash = $('#steamIdInput').val();
            e.preventDefault();
        });

        $('#steamIdInput').on('paste', () =>
            setTimeout(() => {
                window.location.hash = $('#steamIdInput').val();
            }, 250)
        );

        const toggle = (flag, selector, post = () => {}) => {
            $(selector).on('click', e => {
                e.preventDefault();
                this[flag] = !this[flag];
                $(e.target).toggleClass('active');
                post(e);
                this.updateAchievements();
            });
        };

        toggle('lostMode', '#lostMode');
        toggle('keeperMode', '#keeperMode', e => {
            if ($('#keeperMode').hasClass('active')) {
                this.afterbirth = true;
                $('#afterbirth').addClass('active');
            }
        });

        toggle('afterbirth', '#afterbirth', () => {
            if (!$('#afterbirth').hasClass('active')) {
                $('#keeperMode, #afterbirthplus, #repentance').removeClass('active');
                this.keeperMode = false;
                this.afterbirthplus = false;
                this.repentance = false;
                this.repentanceplus = false;
            }
        });

        toggle('afterbirthplus', '#afterbirthplus', () => {
            if ($('#afterbirthplus').hasClass('active')) {
                $('#afterbirth').addClass('active');
                this.afterbirth = true;
            } else {
                $('#repentance').removeClass('active');
                this.repentance = false;
                this.repentanceplus = false;
            }
        });

        toggle('repentance', '#repentance', () => {
            if ($('#repentance').hasClass('active')) {
                $('#afterbirth, #afterbirthplus').addClass('active');
                this.afterbirth = true;
                this.afterbirthplus = true;
                this.repentanceplus = true;
            }
        });

        toggle('repentanceplus', '#repentanceplus', () => {
            if ($('#repentanceplus').hasClass('active')) {
                $('#afterbirth, #afterbirthplus').addClass('active');
                this.afterbirth = true;
                this.afterbirthplus = true;
                this.repentanceplus = true;
            }
        });

        $(window).on('hashchange', () => {
            const hash = window.location.hash.substring(1);
            this.api.resolveSteamIdIfVanity(hash)
                .then(id => {
                    this.steamId = id;
                    if (window.location.hash.substring(1) !== id) {
                        window.location.hash = id;
                    }
                    this.update();
                })
                .catch(error => { throw new Error(error); });
        });
    }

    _initSteamId() {
        if (window.location.hash) {
            this.steamId = window.location.hash.match(/#(\w+)/)[1];
        } else if (window.steamId && !isNaN(window.steamId)) {
            this.steamId = window.steamId;
        }
    }

    _loadDataAndUpdate() {
        this.loadJsonData()
            .then(() => {
                if (this.steamId) this.update();
                else this.updateAchievements();
            })
            .catch(err => {
                console.error('Failed to load JSON data:', err);
                this.updateAchievements();
            });
    }

    async loadJsonData() {
        const fetchJson = async path => {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`Failed to fetch ${path}`);
            return res.json();
        };

        this.achievements = Object.values(await fetchJson('./app/data/achievements.json'));
        this.categories = await fetchJson('./app/data/categories.json');
    }

    updatePlayer() {
        this.api.getPlayerName(this.steamId)
            .then(name => {
                if (!name) throw new Error("Player name not found");
                $('#forPlayer').html(`for ${name}`);
                $('title').html(`The Binding of Isaac: Rebirth - Achievement Helper - ${name}`);
            })
            .catch(error => { throw new Error(error); });
    }

    createCategories() {
        this.categories.forEach(category => {
            $(`
                <div class="category category-${category.id}">
                    <h2>${category.name}</h2>
                    <div class="achievements"></div>
                </div>
            `).appendTo('#achievements');
        });
    }

    drawAchievements(achievements) {
        achievements.forEach(achievement => {
            const rawTitle = achievement.unlockedBy || achievement.description || '?';

            const title = rawTitle
                .replace(/\n/g, '<br>')
                .replace(/<img:(\w+)>/g, (_, key) => {
                    const url = this.tooltipImages[key];
                    return url
                    ? `<img src="${url}" alt="${key}" style="height:0.9em; vertical-align:baseline; margin:0 0px;">`
                    : '';


                });


            $('<a>')
                .attr({
                    href: `http://bindingofisaacrebirth.gamepedia.com/${achievement.displayName.replace(/ /g, '_')}`,
                    target: '_blank'
                })
                .html(
                    $('<img>')
                        .addClass("achievement")
                        .attr('src', achievement.icon)
                        .tooltipster({
                            content: $(`<span class="title">${achievement.displayName}</span><span class="unlockedby">${title}</span>`),
                            contentAsHTML: true,
                            delay: 75,
                            animation: 'fade',
                            animationDuration: 150,
                            theme: 'tooltipster-dark',
                            maxWidth: 260
                        })
                )
                .appendTo(`#achievements .category-${achievement.category} .achievements`);
        });
    }
        


    updateAchievements() {
        const filtered = this.achievements.filter(achievement => {
            const id = parseInt(achievement.name);
            if (!this.repentanceplus && id >= 637) return false;
            if (!this.repentance && (id >= 403 && id < 637)) return false;
            if (!this.afterbirthplus && (id >= 277 && id < 403)) return false;
            if (!this.afterbirth && (id >= 179 && id < 277)) return false;
            if (!this.lostMode && achievement.lost) return false;
            if (!this.keeperMode && achievement.keeper) return false;
            return true;
        });

        const total = filtered.length;
        const open = this.steamId
        ? filtered.filter(a => !this.userAchievements.some(u => u.apiname === a.id && u.achieved))
        : filtered;

        $('#achievements').find('div').remove();
        this.createCategories();
        this.drawAchievements(open);

        const unlocked = this.userAchievements.filter(u => u.achieved && filtered.some(a => a.id === u.apiname));

        $('#achievementsLeft').html(
        `${unlocked.length}/${total} (${Math.round(unlocked.length / total * 100)}%) - ${open.length} (${Math.round(open.length / total * 100)}%) achievements left`
        );

        $('#achievements .achievements:nocontent').parent().addClass('disabled');
    }


    update() {
        this.api.getUserAchievements(this.steamId)
            .then(achievements => {
                $('#achievements').show();
                $('#help').hide();
                this.userAchievements = achievements;
                this.updatePlayer();
                this.updateAchievements();
            })
            .catch(error => {
                $('#help').show();
                console.error('Update failed:', error);
                throw error;
            });
    }
}
