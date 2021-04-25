import 'regenerator-runtime/runtime';

import { API } from './api';
import { BookOverview } from './book-overview';
import { Bookmarks } from './bookmarks';
import { BooksUI } from './books-ui';

new BooksUI(
    new API('https://openlibrary.org/search.json'),
    new BookOverview('bookInfo'),
    new Bookmarks()
);
