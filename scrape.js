const puppeteer = require('puppeteer');
const errors = [];

async function autoScroll(page) {
    await page.evaluate(async() => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

(async() => {
    // Launch and prepare browser
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 800
    });

    // Define list of Ads Libraries
    advertisers = [
        { library: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=1141574459190722&search_type=page&media_type=all' },
        { library: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=105850177891844&search_type=page&media_type=all' }
    ];

    // Loop through all advertisers
    for (let y = 0; y < advertisers.length; y++) {

        // Open Ad Library for this advertiser
        await page.goto(advertisers[y]['library'], { waitUntil: 'networkidle2' });
        page.bringToFront();
        try {
            await page.$('button[data-cookiebanner="accept_only_essential_button"]');
            await page.click('button[data-cookiebanner="accept_only_essential_button"]');
        } catch {
            errors.push('Cookie consent already applied.');
        }
        await delay(3000);
        await autoScroll(page);

        // Scrape the page
        let ads = await page.evaluate(() => {
            let data = [];
            let dates = [];
            let containers = document.querySelectorAll('div[role="none"] + hr + div');

            for (i = 0; i < containers.length; i++) {
                // Get image
                let image = containers[i].querySelector('a img') || null;
                image = (image != null) ? image.src : 'no image';
                if (image == 'no image') {
                    image = containers[i].querySelector('video') || null;
                    image = (image != null) ? image.getAttribute('poster') : 'no video';
                }

                // Get text
                let text = containers[i].querySelector('div[tabindex="0"] > div > div > span') || null;
                text = (text != null) ? text.innerText : null;
                if (text == null) {
                    text = containers[i].querySelector('span > div[tabindex="0"] > div > div') || null;
                    text = (text != null) ? text.innerText : null;
                }

                // Get link
                let link = containers[i].querySelector('a[href^="https://l.facebook.com/l.php"]') || null;
                link = (link != null) ? decodeURIComponent(containers[i].querySelector('a[href^="https://l.facebook.com/l.php"]').getAttribute('href').split('?')[1].split('&')[0].split('=')[1]) : null;

                // Get meta data
                let meta = containers[i].parentElement.firstElementChild.firstElementChild.firstElementChild.childNodes;

                let status = meta[0].textContent.toLowerCase();
                let dates = meta[1].textContent.trim();
                let startDate = null;
                let endDate = null;
                if (dates.substring(0, 7) == 'Started') {
                    startDate = dates.replace('Started running on ', '');
                } else {
                    startDate = dates.split(' - ')[0];
                    endDate = dates.split(' - ')[1];
                }

                let id = '';
                for (x = 1; x < meta.length; x++) {
                    if (meta[x].textContent.trim().substring(0, 2) == 'ID') {
                        id = meta[x].textContent.trim().replace('ID: ', '');
                        break;
                    }
                }

                data.push({
                    'image': image,
                    'text': text,
                    'link': link,
                    'status': status,
                    'adId': id,
                    'startDate': startDate,
                    'endDate': endDate
                });
            }
            return data;
        });

        let payload = ads;

        // Outputs all ads; replace with function to store in database
        console.log(payload);
    }
})();

/**
 * 
 * @param {*} page 
 * Helper function; renders all ads including those initially hidden by infinite scroll
 */
async function autoScroll(page) {
    await page.evaluate(async() => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 400;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 1000);
        });
    });
}