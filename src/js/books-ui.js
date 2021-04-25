'use strict';

import { Utils } from './utils';

export class BooksUI {
    api = null;
    bookmarks = null;
    bookOverview = null;

    searchMeta = {
        currentPage: 1,
        phase: null,
        target: 'q',
    }

    elements = {
        searchInput: null,
        searchResult: null,
        searchFooter: null,
        searchTypeSelector: null,
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

    booksCollection = [];
    selectedBook = {
        data: null,
        element: null,
    };

    constructor (api, bookOverview, bookmarks) {
        this.api = api;
        this.bookmarks = bookmarks;
        this.bookOverview = bookOverview;

        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.searchResult = document.getElementById('searchResult');
        this.elements.searchFooter = document.getElementById('search-footer');
        this.elements.searchTypeSelector = document.getElementById('searchTypeSelect');

        this.initializeEvensListeners();
    }

    initializeEvensListeners () {
        this.elements.searchInput.addEventListener('keydown', this.findBooks.bind(this));
        this.elements.searchResult.addEventListener('click', this.showBookDetails.bind(this));
        this.elements.searchResult.addEventListener('scroll', this.handleSearchListScroll.bind(this), { passive: true })
        this.elements.searchTypeSelector.addEventListener('change', this.changeSearchTarget.bind(this));
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
            </p>
        `;
    }

    showBookDetails (event) {
        const targetElement = Utils.detectEventTarget(event.path, 'book-short-info');
        const key = targetElement?.id;
        const selectedBook = this.booksCollection.find(item => item.key === key);

        if (!selectedBook) {
            return;
        }

        this.selectedBook.element?.classList.remove('book-short-info--selected');

        this.selectedBook.element = targetElement;
        this.selectedBook.data = selectedBook;

        this.selectedBook.element.classList.add('book-short-info--selected');

        this.bookmarks.setCandidate(this.selectedBook.data);
        this.bookOverview.render(this.selectedBook.data);
    }
}
