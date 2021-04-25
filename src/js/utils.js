export class Utils {
    static trim (text, length) {
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
