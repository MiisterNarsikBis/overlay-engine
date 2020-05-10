#!/usr/bin/env node

/**
 * Récupération des commentaires d'un FB Live
 *
 * Todo créer une app FB sur https://developers.facebook.com/
 * et récupérer l'identifiant d'app + la clé secrète dans "Paramètres" / "Général"
 * L'app doit être "en ligne" (pas "en développement")
 *
 * Usage:
 * npm start watch-fb-comments videoId
 */

'use strict';

const EventSource = require('eventsource')
  , request = require('request')
  , fs = require('fs')
  , io = require('socket.io-client')
  , sha1 = require('sha1');

const settings = require('./lib/settings')
  , log = require('./lib/log');

const AVATAR_PATH = __dirname + '/../public/img/avatars';

const socket = io(`ws://${settings.server.HOST}:${settings.server.PORT}`);

let videoId = '';
if (process.argv[2]) {
  videoId = process.argv[2];
} else {
  log('videoId manquant');
  process.exit(1);
}

log(`video ${videoId}`);

socket.on('connect_error', () => {
  log('connexion impossible, service overlay-engine-server bien lancé ?');
});

socket.on('connect', () => {
  log('connecté à overlay-engine-server');
  // url pour récupérer l'app access token
  const FB_APP_ACCESS_TOKEN_URL= `https://graph.facebook.com/oauth/access_token?client_id=${settings.facebook.APP_ID}&client_secret=${settings.facebook.APP_SECRET}&grant_type=client_credentials`;
  log(FB_APP_ACCESS_TOKEN_URL);
  request.get({url: FB_APP_ACCESS_TOKEN_URL, json: true}, (err, res, data) => {
    if (err) {
      log('Error:', err);
    } else {
      startWatching(videoId, data.access_token);
    }
  });
});

function startWatching(videoId, accessToken) {
  // Graph API URL
  const FB_LIVE_COMMENTS_URL = `https://streaming-graph.facebook.com/${videoId}/live_comments?access_token=${accessToken}&comment_rate=ten_per_second&fields=from{name,id},message`;
  log(FB_LIVE_COMMENTS_URL);
  var es = new EventSource(FB_LIVE_COMMENTS_URL);
  es.onerror = (err) => {
    console.log(err);
  };
  es.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if (!data.message) {
      return;
    }
    let social = {
      network: 'facebook',
      timestamp: new Date(),
      avatar: '',
      name: data.from.name,
      screen_name: data.from.name,
      text: data.message
    };

    // todo mise en cache car quota API vite atteint
    let AVATAR_FILE = `fb-${data.from.id}.jpg`;
    if (fs.existsSync(`${AVATAR_PATH}/${AVATAR_FILE}`)) {
      // avatar déjà en cache
      social.avatar = `/img/avatars/${AVATAR_FILE}`;
      log('avatar deja en cache');
      pushSocial(social);
    } else {
      const FB_AVATAR_URL = `https://graph.facebook.com/v7.0/${data.from.id}/picture?type=large`;
      log(`fetch avatar FB ${FB_AVATAR_URL}`);
      request.get(FB_AVATAR_URL, {encoding: 'binary'}, (err, res, body) => {
        if (!err) {
          fs.writeFileSync(`${AVATAR_PATH}/${AVATAR_FILE}`, body, 'binary');
          // mise en cache de l'avatar
          log('avatar récupéré ');
          social.avatar = `/img/avatars/${AVATAR_FILE}`;
        }
        pushSocial(social);
      });
    }

  };
}

function pushSocial(social) {
  social.key = sha1(JSON.stringify(social));
  socket.emit('FBL_COM', social);
  log('FBL_COM emitted:');
  log(social);
}