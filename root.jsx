// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {Router, Route} from 'react-router-dom';

// Import our styles
import 'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css';
import 'sass/styles.scss';
import 'katex/dist/katex.min.css';

import {browserHistory} from 'utils/browser_history';
import {makeAsyncComponent} from 'components/async_load';
import store from 'stores/redux_store.jsx';
import loadRoot from 'bundle-loader?lazy!components/root.jsx';

import {initFeedback} from './feedback';

const Root = makeAsyncComponent(loadRoot);
const feedback = initFeedback();

// This is for anything that needs to be done for ALL react components.
// This runs before we start to render anything.
function preRenderSetup(callwhendone) {
    window.onerror = (msg, url, line, column, stack) => {
        var l = {};
        l.level = 'ERROR';
        l.message = 'msg: ' + msg + ' row: ' + line + ' col: ' + column + ' stack: ' + stack + ' url: ' + url;

        const req = new XMLHttpRequest();
        req.open('POST', '/api/v3/general/log_client');
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(l));

        if (window.mm_config && window.mm_config.EnableDeveloper === 'true') {
            window.ErrorStore.storeLastError({type: 'developer', message: 'DEVELOPER MODE: A JavaScript error has occurred.  Please use the JavaScript console to capture and report the error (row: ' + line + ' col: ' + column + ').'});
            window.ErrorStore.emitChange();
        }
    };
    callwhendone();
}

function renderRootComponent() {
    ReactDOM.render((
        <Provider store={store}>
            <Router history={browserHistory}>
                <Route
                    path='/'
                    component={Root}
                />
            </Router>
        </Provider>
    ),
    document.getElementById('root'));
}

/**
 * Adds a function to be invoked onload appended to any existing onload
 * event handlers.
 *
 * @param   {function} fn onload event handler
 *
 */
function appendOnLoadEvent(fn) {
    if (window.attachEvent) {
        window.attachEvent('onload', fn);
    } else if (window.onload) {
        const curronload = window.onload;
        window.onload = (evt) => {
            curronload(evt);
            fn(evt);
        };
    } else {
        window.onload = fn;
    }
}

/**
 * @param {MouseEvent} e the mouse event that was clicked
 */
function clickTracker(e) {
    feedback({
        click: {
            x: e.x,
            y: e.y,
            target: {
                id: getMostSpecific('id', e.target),
                class: getMostSpecific('className', e.target),
                name: e.target.localName,
                text: e.target.textContent
            }
        },
        screen: {
            height: e.view.innerHeight,
            width: e.view.innerWidth
        },
        owner: e.target.ownerDocument.URL
    }, 'UserClicked');
}

/**
 * Get the desired attribute of the targeted node, or if the attribute is
 * not present, the attribute of one of its parent nodes
 * @param {EventTarget} target the targeted DOM node
 * @return the desired attribute, or undefined if neither the target nor
 * one of the parent nodes has this attribute
 */
function getMostSpecific(attribute, target) {
    let attr;
    let t = target;
    while (!attr && t) {
        if (t[attribute]) {
            attr = t[attribute];
        }
        t = t.parentNode;
    }
    return attr;
}

function clickTrackingSetup() {
    document.addEventListener('click', clickTracker);
}

let scrollEvents = [];
let scrollEventSendingInitiated = false;

/**
 * Batches all scroll events occuring within one second of the first event, then sends them as a combined WindowScrolled event
 * @param {WheelEvent} e the wheel event
 */
function scrollTracker(e) {
    scrollEvents.push(e);
    const owner = e.target.ownerDocument.URL;
    if (!scrollEventSendingInitiated) {
        scrollEventSendingInitiated = true;
        setTimeout(() => {
            const ms = scrollEvents[scrollEvents.length - 1].timeStamp - scrollEvents[0].timeStamp;
            const delta = scrollEvents.reduce((previous, current) => {
                return previous + Math.abs(current.deltaY);
            }, 0);
            scrollEvents = [];
            feedback({
                delta,
                owner,
                duration: ms / 1000 // send time in seconds
            }, 'WindowScrolled');
            scrollEventSendingInitiated = false;
        }, 1000);
    }
}

function scrollTrackingSetup() {
    document.addEventListener('wheel', scrollTracker);
}

function setupExperiment() {
    if (!localStorage.getItem('EXPERIMENT1_GROUP')) {
        const coinflip = Math.random();
        const group = coinflip <= 0.5 ? 'control' : 'treatment';
        localStorage.setItem('EXPERIMENT1_GROUP', group);
        console.log(`Group for experiment 1 set to ${group}`);
    } else {
        console.log(`User already has a group: ${localStorage.getItem('EXPERIMENT1_GROUP')}`);
    }
}

appendOnLoadEvent(() => {
    // Do the pre-render setup and call renderRootComponent when done
    preRenderSetup(renderRootComponent);
});
appendOnLoadEvent(clickTrackingSetup);
appendOnLoadEvent(scrollTrackingSetup);
appendOnLoadEvent(setupExperiment);
