const STANDARD_URL = 'http://127.0.0.1:2113/streams/mattermost-clicks';

function initFeedback(url) {
    return createFeedbackFun(url || STANDARD_URL);
}

function createFeedbackFun(url) {
    return function feedback(data) {
        data['@timestamp'] = new Date().toISOString();
        var xhr = new XMLHttpRequest();
        xhr.open('post', url);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.setRequestHeader('ES-EventType', 'UserClicked');
        xhr.setRequestHeader('ES-EventId', uuidv4());
        xhr.send(JSON.stringify(data));
    };
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export {
  initFeedback,
  uuidv4
};
