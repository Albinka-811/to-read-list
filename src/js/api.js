'use strict';

export class API {
    BASE_URL = null;
    queries = {};

    constructor (url) {
        this.BASE_URL = url;
    }

    generateURL () {
        let queriesString = '';

        for (let key in this.queries) {
            queriesString += `${key}=${this.queries[key]}&`;
        }

        return this.BASE_URL + '?' + queriesString.slice(0, -1);
    }

    addQuery (name, value) {
        this.queries[name] = value;
    }

    removeQuery(name) {
        delete this.queries[name];
    }

    clearQueries () {
        this.queries = {};
    }

    async search() {
        const result = await fetch(this.generateURL());
        return await result.json();
    }
}
