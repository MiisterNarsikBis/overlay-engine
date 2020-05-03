# Overlay Engine

Système d‘incrustation dynamique et administrable pour stream live.

* Gestion d'une **grille des programme** pour affichage auto du nom de l‘**émission courante** + **curseur de progression** + **Horloge**
* Affichage d'un **logo**
* Sélection des **tweets** à afficher, relatifs à un hashtag ou un compte
* Sélection des **commentaires** à afficher, relatifs à une vidéo Facebook Live
* Affichage des **réactions** relatives à une vidéo Facebook Live
* **Bandeau de news** *telex* administrable
* Affichage auto du **titre/artiste** à chaque début de chanson (+ mode manuel)

## Historique

Ce projet a été créé à la base pour le compte d'une radio rock parisienne en 2015, qui l'a exploité plusieurs années ([vidéo 1](https://www.youtube.com/watch?v=jHVS-8zpo2s), [video 2](https://www.youtube.com/watch?v=q2kgZQjWs1M), [vidéo 3](https://www.youtube.com/watch?v=kBs-sjqsGXU)). Il a été libéré et utilisé pour la diffusion vidéo live de l'émission couvrant la cérémonie des Oscars 2020 le 9 février 2020 sur [BLP Radio](http://www.blpradio.fr) à la [MJC Boby Lapointe](http://www.mjcvillebon.org) de Villebon-sur-Yvette (). Depuis il sert d'habillage pour les streams Live de l'[association AD'HOC](https://www.adhocmusic.com), conjointement avec le projet [dynamic-background](https://github.com/aerogus/dynamic-background) pour générer un fond dynamique..

![Incrustation de l'habillage dans le mélangeur vidéo](/doc/live.jpg)

## Description

* Un serveur : `/app/server.js`
  * Application node.js / socket.io. Réceptif à divers messages envoyé par websocket

* Une webapp "habillage" : `/`
  * Simple page web en full HD (1920x1080 non responsive) affichée dans un navigateur plein écran dont la sortie vidéo
  doit être envoyée au mélangeur vidéo.
  la couleur de chromakey est #00ff00 (vert), elle est appliquée à la balise <body>
  note: OBS peut bypasser cette valeur pour la rendre transparente.

![Habillage](/doc/habillage.jpg)

* Une webapp "console d‘administration" : `/admin`
  * Prévisualisation live de l'habillage
  * Gestion (ajout/suppression) de messages telex
  * Gestion (ajout) du titre/artiste en mode manuel

![Administration](/doc/admin.jpg)

* Une webapp "social wall" : `/wall`
  * derniers tweets des critères (track+lang) sélectionnés 
  * bouton ON AIR pour affichage sur l‘habillage

![Social Wall](/doc/wall.jpg)

## Installation

### dev

```
git clone https://github.com/aerogus/overlay-engine.git
cd overlay-engine
cp settings.json.dist settings.json
vi settings.json
npm install
npm start
```

Pour les messages sociaux twitter, vous devez avoir un compte sur cette plateforme, avoir créé une "app"
et récupéré vos identifiants `CONSUMER_KEY`, `CONSUMER_SECRET`, `TOKEN_KEY` et `ACCESS_TOKEN_SECRET` et les saisir dans `settings.json`.

Les webapps sont sur http://localhost, http://localhost/admin et http://localhost/wall

### prod (sous Debian GNU/Linux avec systemd)

- ex raspberry pi avec sortie HDMI vers mélangeur vidéo
- à l'allumage, doit lancer direct l'app d'habillage (Firefox plein écran, ou app electron)
- cable ethernet direct vers PC d'admin

```
cd /var/www
git clone https://github.com/aerogus/overlay-engine.git .
cd overlay-engine
cp settings.json.dist settings.json
vi settings.json
npm install
cp *.service /etc/systemd/system
systemctl daemon-reload
systemctl enable overlay-engine-server
systemctl start overlay-engine-server
crontab crontab
```

### Récupération de l'émission courante (obligatoire)

Par crontab, l'app `app/watch-show.js` est lancé toutes les minutes.

### Récupération du titre/artiste en cours (optionnel)

```
systemctl enable overlay-engine-watch-song
systemctl start overlay-engine-watch-song
```

L'app `app/watch-song.js` doit être adaptée, spécifier le fichier source des données et le parser correctement.

### Récupération des commentaires et réactions d'un Facebook Live (optionnel)

Pour récupérer en temps réel les commentaires et réactions d'un Facebook Live, il vous faut créer une app Facebook.

* Créer une app FB sur https://developers.facebook.com/
* Récupérer l'identifiant d'app + la clé secrète dans "Paramètres" / "Général"
* L'app doit être "en ligne" (pas "en développement")

```
systemctl start overlay-engine-watch-fb-comments@1234
systemctl start overlay-engine-watch-fb-reactions@1234
```

L'app `app/watch-fb-comments.js` prend 1 paramètre (1234), l'id de la vidéo facebook live
L'app `app/watch-fb-reactions.js` prend 1 paramètre (1234), l'id de la vidéo facebook live

éditer dans `settings.json` la valeur de `settings.facebook.APP_ID` et `settings.facebook.APP_SECRET`.

### Récupération des tweets (optionnel)

éditer dans `settings.json` la valeur de `settings.twitter.TRACKS` avec les hashtags et les comptes à suivre, séparés par des virgules. Ex: "@twitter,#twitter,#music"

puis

```
systemctl enable overlay-engine-watch-twitter
systemctl start overlay-engine-watch-twitter
```

## Type de messages websocket

* Tous les messages clients sont techniquemt émis vers le serveur, le tableau ci-dessous est une vue simplifiée des échanges principaux
* Les clients n'écoutent que les messages qui les intéressent
* @TODO un schéma + visuel :)

Nom     | Expéditeur         | Destinataire | Description
------- | ------------------ | ------------ | -----------
TWI     | watch-twitter      | server       | Message issu de la stream API twitter
FBL_COM | watch-fb-comments  | server       | Commentaire issu d'un Facebook Live
FBL_REA | watch-fb-reactions | server       | Réaction issu d'un Facebook Live
SOC     | server             | wall         | Message social, format commun multi source
SOC_AIR | wall               | habillage    | Afficher le message social modéré
SOC_REA | server             | habillage    | Afficher les réactions des réseaux sociaux
ZIK     | watch-title        | habillage    | Info de début de nouvelle chanson, mode auto
ZIK     | admin              | habillage    | Info de début de nouvelle chanson, mode manuel
EMI     | watch-show         | habillage    | Infos sur l'émission courante
TLX     | admin              | habillage    | ajoute un message telex + broadcaste tous les messages telex
TLX_DEL | admin              | server       | efface un message telex + broadcaste tous les messages telex
DMP     | client             | client       | client demandant le dump mémoire du serveur
