import ytdl from '@distube/ytdl-core';

const url = "https://www.youtube.com/watch?v=H-XfCl-HpRM";

async function test() {
    console.log("Fetching info via ytdl-core...");
    try {
        const info = await ytdl.getInfo(url);
        const captions = info.player_response?.captions;
        const tracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (tracks && tracks.length) {
            console.log("✅ Found caption tracks:", tracks.length);
            const engTrack = tracks.find((t: any) => t.languageCode === 'en-US' || t.languageCode === 'en');

            if (engTrack) {
                console.log("English Track URL:", engTrack.baseUrl);
                const jsonUrl = engTrack.baseUrl + "&fmt=json3";
                console.log("Fetching JSON3 from:", jsonUrl);
                const response = await fetch(jsonUrl, {
                    headers: {
                        'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        'Referer': 'https://www.youtube.com/',
                        'Origin': 'https://www.youtube.com',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                });
                console.log("Response Status:", response.status, response.statusText);
                const xml = await response.text();
                console.log("XML Length:", xml.length);
                console.log("XML Content (First 500 chars):");
                console.log(xml.substring(0, 500));
            } else {
                console.log("No English track found. Available:", tracks.map((t: any) => t.languageCode));
            }
        } else {
            console.log("❌ No captions found in player_response");
        }
    } catch (e) {
        console.error("YTDL Error:", e);
    }
}

test();
