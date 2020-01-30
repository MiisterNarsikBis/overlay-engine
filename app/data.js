/**
 * Gestion du stockage des données en mémoire
 */

'use strict';

let sha1 = require('sha1')
  , request = require('request-json')
  , log = require('./log')
  , settings = require('./settings');

module.exports = {

  /**
   * État des micros
   * @var bool
   */
  mic: false,

  /**
   * État de la publicité
   * @var bool
   */
  pub: false,

  /**
   * État du mode maintenance
   * @var bool
   */
  maintenance: false,

  /**
   * État du mode always on
   * @var bool
   */
  always: false,

  /**
   * Nom de l'écran courant
   * @var string
   */
  screen: 'music',

  /**
   * Objet musique / pige courante
   * @var object
   */
  music: {
    artist: 'BLP Radio',
    title: 'La Webradio du Nord Essonne',
    img: '/img/default-artiste.jpg',
    length: 10000 // 10 sec
  },

  /**
   * Objet musique au démarrage de la pub
   * @var object
   */
  music_pon: {
    artist: 'DANS UN INSTANT',
    title: 'LE RETOUR DU ROCK',
    img: 'https://www.ouifm.fr/wp-content/uploads/artistes/default.jpg',
    length: 180000 // moyenne de 3 min
  },

  /**
   * Objet musique à la fin de la pub
   * /!\ POF est souvent envoyé après ZIK
   * @var object
   */
  music_pof: {
    artist: 'ROCK RADIO',
    title: 'OUI FM',
    img: 'https://www.ouifm.fr/wp-content/uploads/artistes/default.jpg',
    length: 10000 // 10 sec
  },

  /**
   * Objet show / émission courante
   * @var object
   */
  show: {
    title: 'Rock non Stop',
    color: '#f7303c',
    color_alt: '#ffffff',
    hashtag: 'ouifm',
    horaire: '0H-24H',
    start: '',
    end: ''
  },

  /**
   * nombre de messages sociaux à stocker
   * @var int
   */
  MAX_SOCIAL: 30,

  /**
   * Liste des messages sociaux
   * @var array d'objets .avatar, .name, .network, .message
   */
  social: [{
    avatar: 'https://pbs.twimg.com/profile_images/831548575125483522/k9Kukioo.jpg',
    name: 'Clément Potier @clem_oui_fm',
    network: 'twitter',
    message: '@Arnold_Officiel @ouifm oui en effet, la protubérance nasale touche les 3 micros en même temps. Je tente de gérer ça avec la technique.'
  }, {
    avatar: 'https://pbs.twimg.com/profile_images/865634968659087361/AEPx1P71.jpg',
    name: 'Arnold @Arnold_Officiel',
    network: 'twitter',
    message: '@ouifm bonjour, j\'entends comme des petits coups sourds sur le micro dès que l\'animatrice s\'exprime. Comme si un nez heurtait la bonnette'
  }],

  /**
   * Liste des publicités (= sliders)
   * @var array d'objets .img
   */
  ads: [{
    img: '/img/ads/default.jpg'
  }, {
    img: '/img/ads/default.jpg'
  }, {
    img: '/img/ads/default.jpg'
  }],

  /**
   * nombre de news à stocker
   * @var int
   */
  MAX_NEWS: 30,

  /**
   * Liste des derniers articles du site
   * @var array d'objets .title
   */
  news: [{
    title: 'Toutes les semaines, JJBEN vous propose 1/2 heure de chroniques: séries TV, films, albums...'
  }, {
    title: 'Live spécial cérémonie des Oscars 2020 toute la nuit'
  }, {
    title: 'La webradio du Nord Essonne'
  }],

  /**
   * Chargement initial des données
   */
  load() {
    log('data.load');
    this.computeScreen();
  },

  /**
   * Ajoute une news au tableau
   * @var object news .title
   */
  addNews(news) {
    // ajoute une news au début du tableau
    this.news.unshift(news);

    // limite la taille du tableau, efface la plus ancienne news
    if (this.news.length > this.MAX_NEWS) {
      this.news.pop();
    }
  },

  /**
   * Ajoute un message social au tableau
   * @var object social .provider .message .avatar .date
   */
  addSocial(social) {
    // on identifie le message par un hash pour potentiellement le modérer
    social.key = sha1(JSON.stringify(social));

    // ajoute un message au début du tableau
    this.social.unshift(social);

    // limite la taille du tableau, efface le plus ancien messahe social
    if (this.social.length > this.MAX_SOCIAL) {
      this.social.pop();
    }
  },

  /**
   * Efface le message social du tableau, identifié par sa clé
   * @var string key
   */
  delSocial(key) {
    if (!this.social.length) {
      return;
    }

    this.social = this.social.filter(item => item.key !== key);
  },

  /**
   * Calcule l'écran à afficher en fonction des états et des impulsions
   * et met à jour data.screen
   *
   * @return bool true si screen à changé, false sinon
   */
  computeScreen() {
    let new_screen;
    if ((this.always || this.mic) && !this.maintenance) {
      new_screen = 'onair';
    } else if (this.pub) {
      new_screen = 'ads';
    } else {
      new_screen = 'music';
    }
    if (this.screen !== new_screen) {
      this.screen = new_screen;
      return true;
    }
    return false;
  },

  /**
   * Retourne l'ensemble des données
   *
   * @return object
   */
  dump() {
    return {
      mic: this.mic,
      pub: this.pub,
      maintenance: this.maintenance,
      always: this.always,
      screen: this.screen,
      music: this.music,
      show: this.show,
      social: this.social,
      ads: this.ads,
      news: this.news
    };
  }
};
