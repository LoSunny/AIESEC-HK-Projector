document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver((mutationsList, observer) => {
        const gotitBtn = [...document.querySelectorAll('button > span')].find(el => el.innerText === 'Got it');
        if (gotitBtn != null) {
            observer.disconnect();
            gotitBtn.parentElement.click();
        }
    }).observe(document.body, {attributes: true, childList: true, subtree: true});
});
