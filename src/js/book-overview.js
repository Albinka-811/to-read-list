export class BookOverview {
    container = null;
    EMPTY_DATA_PLACEHOLDER = 'NO DATA';

    constructor (container) {
        this.container = document.getElementById(container);
    }

    createDescriptionRaw (title, value) {
        return `
            <div class="book-details-body-text">
                ${ title }
                <p class="book-details-body-text__value">${ value ?? this.EMPTY_DATA_PLACEHOLDER }</p>
            </div>
        `;
    }

    render (bookInfo) {

        this.container.innerHTML = `
           <h2 class="book-details-title">${ bookInfo.title }</h2> 
           <h3 class="book-details-author">${ bookInfo.author_name?.join(' ') ?? this.EMPTY_DATA_PLACEHOLDER }</h3>
            
            <div class="book-details-body">
                <div class="book-details-body-text">Languages available: ${ bookInfo.language?.join(', ') ?? this.EMPTY_DATA_PLACEHOLDER }</div>
                
                ${ this.createDescriptionRaw('First publish year:', bookInfo.publish_year?.[0]) }
                ${ this.createDescriptionRaw('Years published:', bookInfo.publish_year?.join(', ')) }
                ${ this.createDescriptionRaw('Full text available:', bookInfo.text) }
            </div>
        `;
    }
}
