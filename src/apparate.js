const fs = require('node:fs');
const p = require('node:path');

function getVideoId(url) {
    let urlTrimmed = url.split('=');
    urlTrimmed = urlTrimmed[1].split('&')[0];
    return urlTrimmed;
}

function getItag(formatsArr) {
    let bestQualityIndex = 0;
    let bestStream;
    formatsArr.forEach((tag) => {
        if (tag.mimeType.search('audio/webm') !== -1) {
            //Audio stream
            if (tag.bitrate > bestQualityIndex) {
                bestQualityIndex = tag.bitrate;
                bestStream = tag;
            }
        }
    })
    return bestStream;
}

function writeToPath(buffer, name, path, append=false) {
    var stream = fs.createWriteStream(p.join(path, name + '.webm'), append ? {flags: 'a'} : {});
    stream.write(Buffer.from(buffer));
    stream.end();
}

export async function apparateVideo(data) {
    let id = getVideoId(data.url);
    let httpRequest = {
        "videoId": id,
        "context": {
            "client": {
                "clientName": "ANDROID_TESTSUITE",
                "clientVersion": "1.9",
                "androidSdkVersion": 30,
                "hl": "en",
                "gl": "US",
                "utcOffsetMinutes": 0
            }
        }
    }
    let requestUrl = 'https://www.youtube.com/youtubei/v1/player';
    try {
        var response = await fetch(requestUrl, {method: 'POST', body: JSON.stringify(httpRequest)});
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        response = await response.json();
        let iTag = getItag(response.streamingData.adaptiveFormats);
        let range = Number(iTag.contentLength);
        if (range > 1000000) {
            //Break stream into parts
            let contentLength = iTag.contentLength;
            let i = 0;
            let request;
            let buffer;
            while (i < contentLength) {
                if (i + 999999 > contentLength) {
                    //append end
                    request = await fetch(iTag.url, {
                        method: 'GET',
                        headers: {
                            range: `bytes=${i}-${contentLength}`
                        }
                    });
                    buffer = await request.arrayBuffer();
                    //await window.api.send('writeFileAppend', {path: data.fileName === '' ? response.videoDetails.title : data.fileName, data: buffer});
                    writeToPath(buffer, data.fileName === '' ? response.videoDetails.title : data.fileName, data.path, true);
                }
                else {
                    //grab stream data
                    request = await fetch(iTag.url, {
                        method: 'GET',
                        headers: {
                            range: `bytes=${i}-${i+999999}`
                        }
                    });
                    buffer = await request.arrayBuffer();
                    //await window.api.send('writeFileAppend', {path: data.fileName === '' ? response.videoDetails.title : data.fileName, data: buffer});
                    writeToPath(buffer, data.fileName === '' ? response.videoDetails.title : data.fileName, data.path, true);
                }
                i += 1000000
            }
            
        }
        else {
            //Download direct
            let data = await fetch(iTag.url, {method: 'GET'});
            let buffer = await data.arrayBuffer()
            //window.api.send('writeFile', { path: data.fileName === '' ? response.videoDetails.title : data.fileName, data: data});
            writeToPath(buffer, data.fileName === '' ? response.videoDetails.title : data.fileName, data.path);
        }
        return 0;
    }
    catch (e) {
        return e.message;
    }
}