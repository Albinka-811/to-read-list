export class BookOverview {
    container = null;

    constructor (container) {
        this.container = document.getElementById(container);
    }

    render (bookInfo) {
        const PLACEHOLDER = 'NO DATA';

        this.container.innerHTML = `
               <h2 class="book-details-title">${ bookInfo.title }</h2>
               <h3 class="book-details-author">${ bookInfo.author_name?.join(' ') ?? PLACEHOLDER }</h3>
            
            <div class="book-details-body">
                <div class="book-details-body-text">Languages available: ${ bookInfo?.language.join(', ') ?? PLACEHOLDER }</div>
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
}
