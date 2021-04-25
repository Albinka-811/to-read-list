'use strict';

import { Utils } from './utils';

export class BooksUI {
    api = null;
    localeStorage = null;

    searchMeta = {
        currentPage: 1,
        phase: null,
        target: 'q',
    }

    elements = {
        bookInfo: null,
        searchInput: null,
        searchResult: null,
        searchFooter: null,
        bookmarksList: null,
        bookmarksListMeta: null,
        searchTypeSelector: null,
        addToBookmarkButton: null,
    };

    scrollPagination = {
        timer: null,
        gapPercent: 0.3,
        debounceValue: 1000,
        isLoading: false,
    }
    searchDebounce = {
        timerValue: 1500,
        timer: null,
    }

    proxies = {
        bookOverview: null,
    }

    booksCollection = [];
    selectedBook = {
        data: null,
        element: null,
    };

    constructor (api, localeStorage) {
        this.api = api;
        this.localeStorage = localeStorage;

        this.elements.bookInfo = document.getElementById('bookInfo');
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.searchResult = document.getElementById('searchResult');
        this.elements.searchFooter = document.getElementById('search-footer');
        this.elements.bookmarksList = document.getElementById('bookmarksList');
        this.elements.bookmarksListMeta = document.getElementById('bookmarksListMeta');
        this.elements.searchTypeSelector = document.getElementById('searchTypeSelect');
        this.elements.addToBookmarkButton = document.getElementById('addToBookmarkButton');

        this.initializeEvensListeners();
        this.showBookmarks();
    }

    initializeEvensListeners () {
        this.elements.searchInput.addEventListener('keydown', this.findBooks.bind(this));
        this.elements.searchResult.addEventListener('click', this.showBookDetails.bind(this));
        this.elements.searchResult.addEventListener('scroll', this.handleSearchListScroll.bind(this), { passive: true })
        this.elements.searchTypeSelector.addEventListener('change', this.changeSearchTarget.bind(this));

        this.elements.bookmarksList.addEventListener('click', this.removeBookmark.bind(this));
        this.elements.bookmarksList.addEventListener('click', this.markAsReady.bind(this));
        this.elements.addToBookmarkButton.addEventListener('click', this.saveToBookmarks.bind(this))
    }

    changeSearchTarget ({ target }) {
        this.api.clearQueries();
        this.searchMeta.target = target.value;
    }

    async makeRequest (page) {
        this.api.addQuery(this.searchMeta.target, this.searchMeta.phase);
        this.api.addQuery('page', page);

        const { docs, start } = await this.api.search();

        return { docs, start };
    }

    findBooks () {
        clearTimeout(this.searchDebounce.timer);
        this.searchDebounce.timer = setTimeout(async () => {
            this.searchMeta.phase = this.elements.searchInput.value;

            if (!this.searchMeta.phase) {
                return;
            }

            this.clearSearchResult();
            const { docs, start } = await this.makeRequest(this.searchMeta.currentPage);
            this.booksCollection = docs;

            this.renderSearchResult(this.elements.searchResult, docs);
            this.renderSearchMeta(this.elements.searchFooter, {
                start,
                founded: this.booksCollection.length, // numFound from API doesn't make any sense for this field
                pageSize: 100, // API doesn't provide this info
            });
        }, this.searchDebounce.timerValue);
    }

    handleSearchListScroll ({ target }) {
        if (this.scrollPagination.isLoading) {
            return;
        }

        clearTimeout(this.scrollPagination.timer);
        this.scrollPagination.timer = setTimeout(() => {
            if (target.scrollHeight - target.scrollTop <= this.scrollPagination.gapPercent * target.scrollHeight) {
                this.fetchNextBooksPage();
            }
        }, this.scrollPagination.debounceValue);
    }

    async fetchNextBooksPage () {
        try {
            this.scrollPagination.isLoading = true;
            this.searchMeta.currentPage += 1;

            const { docs, start } = await this.makeRequest(this.searchMeta.currentPage);

            this.booksCollection.push(...docs);

            this.renderSearchResult(this.elements.searchResult, docs);
            this.renderSearchMeta(this.elements.searchFooter, {
                start,
                founded: this.booksCollection.length, // numFound from API doesn't make any sense for this field
                pageSize: 100, // API doesn't provide this info
            });
        } catch (e) {
            console.error(e);
        } finally {
            this.scrollPagination.isLoading = false;
        }

    }

    clearSearchResult () {
        this.booksCollection = [];
        this.elements.searchResult.innerHTML = '';
    };

    renderSearchResult (container, docsArray) {
        for (let book of docsArray) {
            const div = document.createElement('div');
            div.setAttribute('id', book.key);
            div.classList.add('book-short-info');
            div.innerHTML = `
                <p class="book-short-info__title">${ Utils.trim(book.title, 50) }</p>
                <p class="book-short-info__author">${ book.author_name }</p>
          `;

            container.append(div);
        }
    }

    renderSearchMeta (container, data) {
        container.innerHTML = `
        <p class="book-search-footer-founded">
            Found:
            <span class="book-search-footer-founded__value">${ data.founded }</span>
        </p>
        <p class="book-search-footer-start">
            Start:
            <span class="book-search-footer-start__value">${ data.start }</span>
        </p>
        <p class="book-search-footer-size">
            Page size:
            <span class="book-search-footer-size__value">${ data.pageSize }</span>
        </p>`;
    }

    showBookDetails (event) {
        const targetElement = Utils.detectEventTarget(event.path, 'book-short-info');
        const key = targetElement ? targetElement.id : null;
        const selectedBook = this.booksCollection.find(item => item.key === key);

        if (!selectedBook) {
            return;
        }

        this.selectedBook.element?.classList.remove('book-short-info--selected');

        this.selectedBook.element = targetElement;
        this.selectedBook.data = selectedBook;

        this.selectedBook.element.classList.add('book-short-info--selected');

        this.updateAddBookmarkButtonState();
        this.renderBookInfo(this.elements.bookInfo, this.selectedBook.data);
    }

    renderBookInfo (container, bookInfo) {
        const PLACEHOLDER = 'NO DATA';
        container.innerHTML = `
               <h2 class="book-details-title">${ bookInfo.title }</h2>
               <h3 class="book-details-author">${ bookInfo.author_name?.join(' ') ?? PLACEHOLDER }</h3>
            
            <div class="book-details-body">
                <div class="book-details-body-text">Languages available: ${
            bookInfo.language ? bookInfo.language.join(', ') : 'NO DATA'
        }
                </div>
                <div class="book-details-body-text">
                    First publish year: 
                    <p class="book-details-body-text__value">${ bookInfo.publish_year?.[0] ?? PLACEHOLDER }</p>
                </div>
                <div class="book-details-body-text">
                    Years published: 
                    <p class="book-details-body-text__value">${ bookInfo.publish_year?.join(', ') }</p>
                </div>
                <div class="book-details-body-text">
                    Full text available: 
                    <p class="book-details-body-text__value">${ bookInfo.text }</p>
                </div>
            </div>
        `;
    }

    updateAddBookmarkButtonState () {
        if (this.selectedBook.data) {
            this.elements.addToBookmarkButton.removeAttribute('hidden');
        } else {
            this.elements.addToBookmarkButton.setAttribute('hidden', true);
        }

        if (this.localeStorage.hasKey(this.selectedBook.data?.key)) {
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
        this.localeStorage.set(this.selectedBook.data.key, this.selectedBook.data);
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
