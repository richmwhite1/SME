const url = "https://pipedapi.kavin.rocks/streams/H-XfCl-HpRM";

async function test() {
    console.log("Fetching Piped API...");
    const res = await fetch(url);
    const json: any = await res.json();
    const subtitles = json.subtitles;
    console.log("Subtitles found:", subtitles?.length);
    if (subtitles?.length) {
        const en = subtitles.find((s: any) => s.code === 'en');
        if (en) {
            console.log("English URL:", en.url);
            const txt = await fetch(en.url).then(r => r.text());
            console.log("Subtitle content preview:", txt.substring(0, 200));
        }
    }
}
test();
