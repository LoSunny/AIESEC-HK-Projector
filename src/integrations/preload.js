document.addEventListener('DOMContentLoaded', () => {
    if (window.location.href.startsWith("https://www.canva.com/")) {
        console.log("Canva detected");
        fetch("https://cdn.jsdelivr.net/npm/sweetalert2@11").then(res => res.text()).then(eval).then(() => {
            let enlargeScreenPopup = false;
            const observer = new MutationObserver((mutationsList, observer) => {
                const spans = [...document.querySelectorAll('button > span')];
                const present = spans.find(el => el.innerText === 'Present');
                const signup = spans.find(el => el.innerText === 'Sign up');
                if (signup != null) {
                    observer.disconnect();
                    Swal.fire({
                        title: 'Login Required',
                        text: 'You need to sign in / sign up to use the presentation feature.',
                        icon: 'info',
                        confirmButtonText: 'Okay',
                    });
                } else if (present != null) {
                    observer.disconnect();
                    Swal.fire({
                        title: 'Presentation Mode',
                        icon: 'success',
                        toast: true,
                        position: 'top-start',
                        timer: 2500,
                    });
                    present.parentElement.click();
                    console.log("Enabling presentation mode, clicking presenter view button");
                    new MutationObserver((mutationsList, observer) => {
                        const btn = document.querySelector('button[aria-label="View your notes and upcoming slides"]');
                        if (btn != null) {
                            observer.disconnect();
                            btn.click();
                            console.log("Clicked presenter view button, clicking present btn");
                            new MutationObserver((mutationsList, observer) => {
                                const btn = [...document.querySelectorAll('button[type="submit"] > span')].find(el => el.textContent === 'Present');
                                if (btn != null && getComputedStyle(btn.parentElement).getPropertyValue('background-color') === 'rgb(139, 61, 255)') {
                                    observer.disconnect();
                                    btn.parentElement.click();
                                    console.log("Clicked present button, clicking close btn");
                                    new MutationObserver((mutationsList, observer) => {
                                        const btn = document.querySelector('button[aria-label="Close"]');
                                        if (btn != null) {
                                            observer.disconnect();
                                            setTimeout(() => document.querySelector('button[aria-label="Close"]').click(), 1000);
                                            console.log("Clicked close button, presentation mode enabled");
                                        }
                                    }).observe(document.body, {attributes: true, childList: true, subtree: true});
                                }
                            }).observe(document.body, {attributes: true, childList: true, subtree: true});
                        }
                    }).observe(document.body, {attributes: true, childList: true, subtree: true});
                } else if (document.querySelector('button[aria-label="Present"]') != null) {
                    if (!enlargeScreenPopup) {
                        enlargeScreenPopup = true;
                        Swal.fire({
                            title: 'Enlarge Screen',
                            text: 'Please enlarge your screen to enable presentation mode.',
                            icon: 'warning',
                            toast: true,
                            position: 'top-start',
                            timer: 5000,
                        }).then(() => {
                            setTimeout(() => enlargeScreenPopup = false, 1000);
                        });
                    }
                    console.log('Enlarge screen to enable presentation mode');
                }
            });
            observer.observe(document.body, {attributes: true, childList: true, subtree: true});
        });
    } else if (window.location.href.startsWith("https://docs.google.com/")) {
        console.log("Google Docs detected");
        const howeverEvent = new MouseEvent('mouseover', {'view': window, 'bubbles': true, 'cancelable': true});
        const mouseDownEvent = new MouseEvent('mousedown', {'view': window, 'bubbles': true, 'cancelable': true});
        const mouseUpEvent = new MouseEvent('mouseup', {'view': window, 'bubbles': true, 'cancelable': true});

        const observer = new MutationObserver(async (mutationsList, observer) => {
            if (document.querySelector('#punch-start-presentation-left') != null) {
                observer.disconnect();
                await new Promise(resolve => setTimeout(resolve, 1000));
                const dropdown = document.querySelector('#punch-start-presentation-left')
                dropdown.dispatchEvent(howeverEvent);
                await new Promise(resolve => setTimeout(resolve, 500));
                dropdown.dispatchEvent(mouseDownEvent);
                await new Promise(resolve => setTimeout(resolve, 500));
                dropdown.dispatchEvent(mouseUpEvent);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        });
        observer.observe(document.body, {attributes: true, childList: true, subtree: true});
    }
});
