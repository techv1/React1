const https = require('https');

const videoId = '8iVkz1E3i4Y';
const embedUrl = `https://www.eporner.com/embed/${videoId}/`;

function transformHash(hex) {
    let result = '';
    for (let i = 0; i < 32; i += 8) {
        const chunk = hex.substring(i, i + 8);
        result += parseInt(chunk, 16).toString(36);
    }
    return result;
}

async function run() {
    console.log(`Targeting ID: ${videoId}`);
    console.log(`Embed URL: ${embedUrl}`);

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': embedUrl
    };

    try {
        console.log('Step 1: Fetching embed page...');
        const response = await fetch(embedUrl, { headers });
        const text = await response.text();

        console.log('Step 2: Extracting hex hash...');
        // Look for hash: "..." or hash = "..."
        const hashMatch = text.match(/hash\s*[:=]\s*["']([\da-f]{32})["']/i);
        
        if (!hashMatch) {
            console.error('Could not find hash in page source.');
            // Dump a bit of the page for debugging
            console.log('Page snippet:', text.substring(0, 500));
            return;
        }

        const hexHash = hashMatch[1];
        console.log(`Hex Hash found: ${hexHash}`);

        console.log('Step 3: Transforming hash...');
        const transformedHash = transformHash(hexHash);
        console.log(`Transformed Hash (Base36): ${transformedHash}`);

        console.log('Step 4: Calling XHR API...');
        const params = new URLSearchParams({
            hash: transformedHash,
            domain: 'www.eporner.com',
            fallback: 'false',
            embed: 'true',
            supportedFormats: 'hls,mp4',
            _: Date.now().toString()
        });

        const apiUrl = `https://www.eporner.com/xhr/video/${videoId}?${params.toString()}`;
        console.log(`XHR URL: ${apiUrl}`);

        const apiRes = await fetch(apiUrl, { headers });
        if (!apiRes.ok) {
            console.error(`API request failed with status ${apiRes.status}`);
            const errorText = await apiRes.text();
            console.log('Error response:', errorText);
            return;
        }

        const data = await apiRes.json();
        console.log('Step 5: API Response received.');
        
        if (data.sources && data.sources.hls && (data.sources.hls.src || (data.sources.hls.auto && data.sources.hls.auto.src))) {
            const m3u8Url = data.sources.hls.src || data.sources.hls.auto.src;
            console.log('\nSUCCESS! Master m3u8 URL found:');
            console.log(m3u8Url);
            
            console.log('\n--- Testing with CURL ---');
            console.log(`Run this command to test access:`);
            console.log(`curl -I "${m3u8Url}" -H "Referer: ${embedUrl}"`);
        } else {
            console.log('No HLS source found in API response.');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

run();
