/* eslint-disable camelcase */
'use strict';

const path = require('path');
const app = require('express')();
const jEmoji = require('emoji');
const TwitterStream = require('twitter-stream-api');

module.exports = function (nodecg) {
	if (!nodecg.bundleConfig) {
		nodecg.log.error('cfg/agdq16-layouts.json was not found. Twitter integration will be disabled.');
		return;
	} else if (typeof nodecg.bundleConfig.twitter === 'undefined') {
		nodecg.log.error('"twitter" is not defined in cfg/agdq16-layouts.json! ' +
			'Twitter integration will be disabled.');
		return;
	}

	const TARGET_USER_ID = nodecg.bundleConfig.twitter.userId;

	// Create a route to serve the emoji lib
	app.get('/agdq16-layouts/emoji.png', (req, res) => {
		const emojiPNGPath = path.resolve(__dirname, '../../node_modules/emoji/lib/emoji.png');
		res.sendFile(emojiPNGPath);
	});
	app.get('/agdq16-layouts/emoji.css', (req, res) => {
		const emojiCSSPath = path.resolve(__dirname, '../../node_modules/emoji/lib/emoji.css');
		res.sendFile(emojiCSSPath);
	});
	app.get('/agdq16-layouts/twitter/shared.css', (req, res) => {
		const sharedCSSPath = path.resolve(__dirname, 'shared.css');
		res.sendFile(sharedCSSPath);
	});
	nodecg.mount(app);

	const tweets = nodecg.Replicant('tweets', {defaultValue: []});

	// Clear queue of tweets when currentRun changes
	nodecg.Replicant('currentRun').on('change', () => {
		tweets.value = [];
	});

	let userStream;

	function buildUserStream() {
		userStream = new TwitterStream({
			consumer_key: nodecg.bundleConfig.twitter.consumerKey,
			consumer_secret: nodecg.bundleConfig.twitter.consumerSecret,
			token: nodecg.bundleConfig.twitter.accessTokenKey,
			token_secret: nodecg.bundleConfig.twitter.accessTokenSecret
		});

		userStream.on('data', data => {
			// We discard quoted statuses because we can't show them.
			if (data.quoted_status) {
				return;
			}

			if (data.event) {
				switch (data.event) {
					case 'favorite':
						handleFavorite(data);
						break;
					case 'unfavorite':
						handleUnfavorite(data);
						break;
					default:
					// do nothing
				}
			} else if (data.delete) {
				handleDelete(data);
			} else if (data.retweeted_status) {
				handleRetweet(data);
			} else if (data.text) {
				handleStatus(data);
			}
		});

		userStream.on('error', error => {
			nodecg.log.error('[twitter]', error.stack);
		});

		userStream.on('connection success', () => {
			nodecg.log.info('[twitter] Connection success.');
		});

		userStream.on('connection aborted', () => {
			nodecg.log.error('[twitter] Connection aborted!');
		});

		userStream.on('connection error network', error => {
			nodecg.log.error('[twitter] Connection error network:', error.stack);
		});

		userStream.on('connection error stall', () => {
			nodecg.log.error('[twitter] Connection error stall!');
		});

		userStream.on('connection error http', httpStatusCode => {
			nodecg.log.error('[twitter] Connection error HTTP:', httpStatusCode);
		});

		userStream.on('connection rate limit', httpStatusCode => {
			nodecg.log.error('[twitter] Connection rate limit:', httpStatusCode);
		});

		userStream.on('connection error unknown', error => {
			nodecg.log.error('[twitter] Connection error unknown:', error.stack);
			userStream.close();
			userStream = new TwitterStream({
				consumer_key: nodecg.bundleConfig.twitter.consumerKey,
				consumer_secret: nodecg.bundleConfig.twitter.consumerSecret,
				token: nodecg.bundleConfig.twitter.accessTokenKey,
				token_secret: nodecg.bundleConfig.twitter.accessTokenSecret
			});
			userStream.stream('user', {thisCantBeNull: true});
		});

		userStream.stream('user', {thisCantBeNull: true});
	}

	function handleStatus(status) {
		if (status.user.id_str !== TARGET_USER_ID) {
			return;
		}

		// Filter out @ replies
		if (status.text.charAt(0) === '@') {
			return;
		}
		addTweet(status);
	}

	buildUserStream();

	function handleRetweet(retweet) {
		if (retweet.user.id_str !== TARGET_USER_ID) {
			return;
		}

		const retweetedStatus = retweet.retweeted_status;
		retweetedStatus.gdqRetweetId = retweet.id_str;
		addTweet(retweetedStatus);
	}

	function handleDelete(event) {
		removeTweetById(event.delete.status.id_str);
	}

	function handleFavorite(favorite) {
		if (favorite.source.id_str !== TARGET_USER_ID) {
			return;
		}

		addTweet(favorite.target_object);
	}

	function handleUnfavorite(unfavorite) {
		if (unfavorite.source.id_str !== TARGET_USER_ID) {
			return;
		}

		removeTweetById(unfavorite.target_object.id_str);
	}

	// Close and re-open the twitter connection every 90 minutes
	setInterval(() => {
		nodecg.log.info('[twitter] Restarting Twitter connection (done every 90 minutes).');
		userStream.close();
		buildUserStream();
	}, 90 * 60 * 1000);

	nodecg.listenFor('acceptTweet', tweet => {
		removeTweetById(tweet.id_str);
		nodecg.sendMessage('showTweet', tweet);
	});

	nodecg.listenFor('rejectTweet', removeTweetById);

	function addTweet(tweet) {
		// Parse pictures and add them to the tweet object as a simply array of URL strings.
		const imageUrls = [];
		if (tweet.extended_entities) {
			tweet.extended_entities.media.forEach(medium => {
				if (medium.type === 'photo') {
					imageUrls.push(`${medium.media_url}:large`);
					tweet.text = tweet.text.split(medium.url).join('');
				}
			});
			tweet.text.trim();
		}
		tweet.imageUrls = imageUrls;

		// Highlight the #SGDQ2016 hashtag
		const HASHTAG = '#SGDQ2016';
		const hashtag = '#sgdq2016';
		tweet.text = tweet.text.split(HASHTAG).join(`<span class="sgdqHashtag">${HASHTAG}</span>`);
		tweet.text = tweet.text.split(hashtag).join(`<span class="sgdqHashtag">${hashtag}</span>`);

		// Parse emoji in tweet body
		tweet.text = jEmoji.unifiedToHTML(tweet.text);

		// Add the tweet to the list
		tweets.value.push(tweet);
	}

	function removeTweetById(idToRemove) {
		if (typeof idToRemove !== 'string') {
			throw new Error('[twitter] Must provide a string ID when removing a tweet. ID provided was: ', idToRemove);
		}

		let removedTweet;
		tweets.value.some((tweet, index) => {
			if (tweet.id_str === idToRemove || tweet.gdqRetweetId === idToRemove) {
				tweets.value.splice(index, 1);
				removedTweet = true;
				return true;
			}

			return false;
		});
		return removedTweet;
	}
};
