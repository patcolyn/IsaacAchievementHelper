export default class Api {
    constructor(options) {
        this.steamAppId = options.steamAppId;
        this.proxy = options.proxy;
        this.URLs = {
            GetPlayerAchievements: 'https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/',
            GetPlayerSummaries: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
            ResolveVanityURL: 'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/'
        };
    }

    _formatParams(params) {
        return "?" + Object.entries(params)
            .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
            .join("&");
    }

    _get(url, params, callback) {
        return new Promise((resolve, reject) => {
            params.csurl = url;
            const req = new XMLHttpRequest();
            req.open("GET", this.proxy + this._formatParams(params));
            req.onload = () => {
                if (req.status === 200) {
                    const json = JSON.parse(req.response);
                    resolve(callback(json) || json);
                } else {
                    reject(new Error(req.statusText));
                }
            };
            req.onerror = () => reject(new Error("Network error"));
            req.send();
        });
    }

    getPlayerName(steamId) {
        return this._get(this.URLs.GetPlayerSummaries, { steamids: steamId }, data =>
            data.response.players[0]?.personaname || null
        );
    }

    getUserAchievements(steamId) {
        return this._get(this.URLs.GetPlayerAchievements, {
            appid: this.steamAppId,
            steamid: steamId
        }, data => data.playerstats.achievements || []);
    }

    resolveVanityURL(id) {
        return this._get(this.URLs.ResolveVanityURL, {
            appid: this.steamAppId,
            vanityurl: id
        }, data => data.response);
    }

    resolveSteamIdIfVanity(steamId) {
        return isNaN(steamId)
            ? this.resolveVanityURL(steamId).then(res => {
                if (res.success !== 42) return res.steamid;
                throw new Error("Vanity URL resolution failed");
            })
            : Promise.resolve(steamId);
    }
}
