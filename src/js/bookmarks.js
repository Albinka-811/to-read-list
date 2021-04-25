import { LocaleStorage } from './locale-storage';
import { Utils } from './utils';

export class Bookmarks {
    localeStorage = null;
    elements = {
        bookmarksList: null,
        bookmarksListMeta: null,
        addToBookmarkButton: null,
    }
    candidateBook = null;

    constructor () {
        this.localeStorage = new LocaleStorage();

        this.elements.bookmarksList = document.getElementById('bookmarksList');
        this.elements.bookmarksListMeta = document.getElementById('bookmarksListMeta');
        this.elements.addToBookmarkButton = document.getElementById('addToBookmarkButton');

        this.initializeEvensListeners();
        this.showBookmarks();
    }

    initializeEvensListeners () {
        this.elements.bookmarksList.addEventListener('click', this.removeBookmark.bind(this));
        this.elements.bookmarksList.addEventListener('click', this.markAsReady.bind(this));
        this.elements.addToBookmarkButton.addEventListener('click', this.saveToBookmarks.bind(this))
    }

    setCandidate (book) {
        this.candidateBook = book;
        this.updateAddBookmarkButtonState();
    }

    updateAddBookmarkButtonState () {
        if (this.candidateBook) {
            this.elements.addToBookmarkButton.removeAttribute('hidden');
        } else {
            this.elements.addToBookmarkButton.setAttribute('hidden', true);
        }

        if (this.localeStorage.hasKey(this.candidateBook?.key)) {
            this.elements.addToBookmarkButton.setAttribute('disabled', true);
        } else {
            this.elements.addToBookmarkButton.removeAttribute('disabled');
        }
    }

    updateBookmarksMeta (allCount, readyCount) {
        this.elements.bookmarksListMeta.innerHTML = `
            <span class="bookmarks-header-info__count">${allCount} books</span>
            <span class="bookmarks-header-info__read">${readyCount} read</span>
        `;
    }

    saveToBookmarks () {
        this.localeStorage.set(this.candidateBook.key, this.candidateBook);
        this.updateAddBookmarkButtonState();
        this.showBookmarks();
    }

    markAsReady (event) {
        const targetElement = Utils.detectEventTarget(event.path, 'bookmarks-list-item__mark-saved');
        const key = targetElement ? targetElement.parentElement.id : null;

        if (key) {
            const bookmark = JSON.parse(this.localeStorage.get(key));
            bookmark.isReady = true;

            this.localeStorage.set(key, bookmark);
            this.showBookmarks();
        }
    }

    removeBookmark (event) {
        const targetElement = Utils.detectEventTarget(event.path, 'bookmarks-list-item__remove');
        const key = targetElement ? targetElement.parentElement.id : null;

        if (key) {
            this.localeStorage.delete(key);
            this.showBookmarks();
        }
    }

    showBookmarks () {
        this.elements.bookmarksList.innerHTML = '';

        const bookmarks = this.localeStorage.getAll();
        const isReadyBooks = [];
        const isInProgressBooks = [];

        bookmarks.forEach((book) => book.isReady ? isReadyBooks.push(book) : isInProgressBooks.push(book));
        this.updateBookmarksMeta(bookmarks.length, isReadyBooks.length);

        if (isInProgressBooks.length) {
            this.renderBookmarks(this.elements.bookmarksList, isInProgressBooks);
        }

        if (isReadyBooks.length) {
            this.renderBookmarks(this.elements.bookmarksList, isReadyBooks, 'Finished books');
        }
    }

    renderBookmarks (container, bookmarks, sectionTitle) {
        if (sectionTitle) {
            const title = document.createElement('h4');
            title.innerText = sectionTitle;

            container.append(title);
        }

        for (let book of bookmarks) {
            const div = document.createElement('div');
            div.setAttribute('id', book.key);
            div.classList.add('bookmarks-list-item');
            div.classList.toggle('bookmarks-list-item--ready', !!book.isReady);

            div.innerHTML = ` 
                <p class="bookmarks-list-item_title">${ Utils.trim(book.title, 50) }</p>
                <p class="bookmarks-list-item__author">${ book.author_name }</p>
                
                <button class="bookmarks-list-item__button bookmarks-list-item__mark-saved">Mark as read</button>
                <button class="bookmarks-list-item__button bookmarks-list-item__remove">Remove</button>
            `;

            container.append(div);
        }
    }
}
