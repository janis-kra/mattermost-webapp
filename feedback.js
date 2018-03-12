import UserStore from 'stores/user_store.jsx';

const STANDARD_STREAM = 'mattermost';
const STANDARD_URL = 'http://127.0.0.1:2113/streams';

function initFeedback(url, stream) {
    return createFeedbackFun(`${url || STANDARD_URL}/${stream || STANDARD_STREAM}`);
}

function createFeedbackFun(url) {
    return function feedback(data, eventType) {
        data.timestamp = Date.now();
        data.user = {id: UserStore.getCurrentId() || '1'};
        var xhr = new XMLHttpRequest();
        xhr.open('post', url);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.setRequestHeader('ES-EventType', eventType);
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
