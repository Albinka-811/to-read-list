'use strict';

export class Utils {
    static trim (text, length) {
        if (!text) {
            return '';
        }

        const trimmed = text.slice(0, length);

        return trimmed.length === text.length ? trimmed : trimmed + '...'
    }

    static detectEventTarget (path, className) {
        let targetElement;

        for (let element of path) {
            if (element.classList && element.classList.contains(className)) {
                targetElement = element;
                break;
            }
        }

        return targetElement;
    }
}
