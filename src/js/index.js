import 'regenerator-runtime/runtime';

import { API } from './api';
import { BooksUI } from './books-ui';
import { LocaleStorage } from './locale-storage';

new BooksUI(
    new API('https://openlibrary.org/search.json'),
    new LocaleStorage()
);
