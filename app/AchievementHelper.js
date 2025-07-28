import Api from './api.js';

export default class AchievementHelper {
    constructor(options) {
        this.api = new Api(options.Api);
        this.lostMode = true;
        this.keeperMode = true;
        this.afterbirth = true;
        this.afterbirthplus = true;
        this.repentance = true;
        this.userAchievements = [];

        $.expr[':'].nocontent = obj => {
            return !($.trim($(obj).text()).length) && !($(obj).children().length)
        };

        $('#loginManual').submit(e => {
            window.location.hash = $('#steamIdInput').val();
            e.preventDefault();
        });

        $('#steamIdInput').on('paste', () => {
            setTimeout(() => {
                window.location.hash = $('#steamIdInput').val();
            }, 250);
        });

        $('#lostMode').on('click', e => {
            e.preventDefault();
            this.lostMode = !this.lostMode;
            $(e.target).toggleClass('active');
            this.updateAchievements();
        });

        $('#keeperMode').on('click', e => {
            e.preventDefault();
            this.keeperMode = !this.keeperMode;
            $(e.target).toggleClass('active');

            if ($('#keeperMode').hasClass('active')) {
                this.afterbirth = true;
                $('#afterbirth').addClass('active');
            }

            this.updateAchievements();
        });

        $('#afterbirth').on('click', e => {
            e.preventDefault();
            this.afterbirth = !this.afterbirth;
            $(e.target).toggleClass('active');

            if (!$('#afterbirth').hasClass('active')) {
                $('#keeperMode').removeClass('active');
                $('#afterbirthplus').removeClass('active');
                $('#repentance').removeClass('active');
                this.afterbirthplus = false;
                this.repentance = false;
                this.keeperMode = false;
            }

            this.updateAchievements();
        });

        $('#afterbirthplus').on('click', e => {
            e.preventDefault();
            this.afterbirthplus = !this.afterbirthplus;
            $(e.target).toggleClass('active');

            if ($('#afterbirthplus').hasClass('active')) {
                $('#afterbirth').addClass('active');
                this.afterbirth = true;
            } else {
                $('#repentance').removeClass('active');
                this.repentance = false;
            }

            this.updateAchievements();
        });

        $('#repentance').on('click', e => {
            e.preventDefault();
            this.repentance = !this.repentance;
            $(e.target).toggleClass('active');

            if ($('#repentance').hasClass('active')) {
                $('#afterbirth').addClass('active');
                $('#afterbirthplus').addClass('active');
                this.afterbirth = true;
                this.afterbirthplus = true;
            }

            this.updateAchievements();
        });

        $(window).on('hashchange', () => {
            this.steamId = window.location.hash.substr(1);

            if (isNaN(this.steamId)) {
                this.api.resolveVanityURL(this.steamId)
                    .then(response => {
                        if (response.success !== 42) {
                            window.location.hash = response.steamid;
                        }
                    }).catch(error => {
                    throw new Error(error);
                });
            }

            this.update();
        });

        if (window.location.hash) {
            this.steamId = window.location.hash.match(/#(\w+)/)[1];
        } else if (window.steamId && (!isNaN(window.steamId))) {
            this.steamId = window.steamId;
        }

        this.loadJsonData()
            .then(() => {
                if (this.steamId) {
                    this.update();
                } else {
                    this.updateAchievements();
                }
            })
            .catch(err => {
                console.error('Failed to load JSON data:', err);
                this.updateAchievements();
            });
    }

    async loadJsonData() {
        const achievementsResponse = await fetch('./app/data/achievements.json');
        if (!achievementsResponse.ok) throw new Error('Failed to fetch achievements.json');
        this.achievements = await achievementsResponse.json();

        const categoriesResponse = await fetch('./app/data/categories.json');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.json');
        this.categories = await categoriesResponse.json();
    }

    updatePlayer() {
        this.api.getPlayerSummaries(this.steamId)
            .then(response => {
                $('#forPlayer').html(`for ${response.players[0].personaname}`);
                $('title').html(`The Binding of Isaac: Rebirth - Achievement Helper - ${response.players[0].personaname}`);
            }).catch(error => {
            throw new Error(error);
        });
    }

    updatePlaytime() {
        this.api.getOwnedGames(this.steamId)
            .then(response => {
                response.games.forEach(game => {

                    if (game.appid === this.api.steamAppId) {
                        $('#playtime').html(`playing ${Math.round(game.playtime_forever / 60)}h`);
                    }
                })
            }).catch(error => {
            throw new Error(error);
        });
    }

    createCategories() {
        this.categories.forEach(category => {
            $(`<div class="category category-${category.id}">`).html(`<h2>${category.name}</h2><div class="achievements"></div>`).appendTo('#achievements');
        });
    }

    drawAchievements(achievements) {
        achievements.forEach(achievement => {
            const title = achievement.unlockedBy || achievement.description || '?'
            $('<a>').attr('href', `http://bindingofisaacrebirth.gamepedia.com/${achievement.displayName.replace(/ /g, '_')}`).attr('target', '_blank').html(
                $('<img>').addClass("achievement").attr('src', achievement.icon)
                    .tooltipster({
                        content: $(`<span class="title">${achievement.displayName}</span><span>Unlocked by:</span><span class="unlockedby">${title}</span>`),
                        contentAsHTML: true
                    })
            ).appendTo($('#achievements').find(`.category-${achievement.category} .achievements`));
        });
    }

    updateAchievements() {
        const $achievements = $('#achievements');

        const filteredAchievements = this.achievements.filter(achievement => {
            return (!this.repentance) ? (parseInt(achievement.name) < 403) : true;
        }).filter(achievement => {
            return (!this.afterbirthplus) ? (parseInt(achievement.name) < 277) : true;
        }).filter(achievement => {
            return (!this.afterbirth) ? (parseInt(achievement.name) < 179) : true;
        }).filter(achievement => {
            return (!this.lostMode) ? (!achievement.lost) : true;
        }).filter(achievement => {
            return (!this.keeperMode) ? (!achievement.keeper) : true;
        });

        const achievementCount = filteredAchievements.length;
        let openAchievements;
        if (this.steamId) {
            openAchievements = filteredAchievements.filter(achievement => {
                return (!this.userAchievements.filter(userAchievement => {
                    return userAchievement.name === achievement.name;
                }).length);
            });
        }
        else {
            openAchievements = filteredAchievements;
        }


        $achievements.find('div').remove();
        this.createCategories();
        this.drawAchievements(openAchievements);


        $('#achievementsLeft').html(
            `${this.userAchievements.length}/${achievementCount} (${Math.round(this.userAchievements.length / achievementCount * 100)}%) - ${openAchievements.length} (${Math.round(openAchievements.length / achievementCount * 100)}%) achievements left `
        );

        $achievements.find('.achievements:nocontent').parent().addClass('disabled');
    }

    update() {
        this.api.getUserStatsForGame(this.steamId)
            .then(response => {
                $('#achievements').show();
                $('#help').hide();
                this.userAchievements = response.achievements || [];
                this.updatePlayer();
                this.updatePlaytime();
                this.updateAchievements();
            }).catch(error => {
                $('#help').show();
                throw new Error(error);
            });
    }
}
