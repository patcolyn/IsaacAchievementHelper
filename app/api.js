export default class Api {
    constructor(options) {
        this.steamAPIKey = options.steamAPIKey;
        this.steamAppId = options.steamAppId;
        //this.proxy = options.proxy;
        this.URLs = {
            GetPlayerSummaries: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
            GetOwnedGames: 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
            GetUserStatsForGame: 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/',
            ResolveVanityURL: 'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/'
        };
    }

    _formatParams(params) {
        params.key = this.steamAPIKey;
        return "?" + Object
                .keys(params)
                .map(key => key + "=" + params[key])
                .join("&")
    }

    _get(url, params, callback) {
        return new Promise((resolve, reject) => {
            const fullUrl = url + this._formatParams(params);
            fetch(fullUrl)
                .then(response => {
                    if (!response.ok) throw new Error(response.statusText);
                    return response.json();
                })
                .then(json => resolve(callback(json) || json))
                .catch(reject);
        });
    }


    /*
    _get(url, params, callback) {
        return new Promise((resolve, reject) => {
            let req = new XMLHttpRequest();
            params.csurl = url;
            req.open("GET", this.proxy + this._formatParams(params));
            req.onload = () => {
                if (req.status === 200) {
                    resolve(callback(JSON.parse(req.response)) || JSON.parse(req.response));
                } else {
                    reject(new Error(req.statusText));
                }
            };

            req.onerror = () => {
                reject(new Error("Network error"));
            };

            req.send();
        });
    }
    */

    getPlayerSummaries(id) {
        return this._get(this.URLs.GetPlayerSummaries, {
            steamids: id
        }, data => data.response);
    }

    getOwnedGames(id) {
        return this._get(this.URLs.GetOwnedGames, {
            steamid: id
        }, data => data.response);
    }

    getUserStatsForGame(id) {
        return this._get(this.URLs.GetUserStatsForGame, {
            appid: this.steamAppId,
            steamid: id
        }, data => data.playerstats);
    }

    resolveVanityURL(id) {
        return this._get(this.URLs.ResolveVanityURL, {
            appid: this.steamAppId,
            vanityurl: id
        }, data => data.response);
    }
}