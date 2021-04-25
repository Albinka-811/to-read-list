export class LocaleStorage {
    constructor () {}

    set (name, value) {
        return window.localStorage.setItem(name, JSON.stringify(value));
    }

    get (name) {
        return window.localStorage.getItem(name);
    }

    hasKey (name) {
        return Object.keys(window.localStorage).some((key) => key === name);
    }

    getAll () {
        const bookmarks = [];

        for (let key of Object.keys(window.localStorage)) {
            bookmarks.push(JSON.parse(this.get(key)));
        }

        return bookmarks;
    }

    delete (name) {
        return window.localStorage.removeItem(name);
    }
}
