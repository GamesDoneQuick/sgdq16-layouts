/* eslint-disable camelcase */
'use strict';

const path = require('path');
const TwitterStream = require('twitter-stream-api');

module.exports = function (nodecg) {
	if (Object.keys(nodecg.bundleConfig.twitter).length === 0) {
		nodecg.log.error('"twitter" is not defined in cfg/sgdq16-layouts.json! ' +
			'Twitter integration will be disabled.');
		return;
	}

	const TARGET_USER_ID = nodecg.bundleConfig.twitter.userId;
	const tweets = nodecg.Replicant('tweets', {defaultValue: []});

	// Clear queue of tweets when currentRun changes
	nodecg.Replicant('currentRun').on('change', () => {
		tweets.value = [];
	});

	let userStream;

	/**
	 * Builds the stream. Called once every 90 minutes because sometimes the stream just dies silently.
	 * @returns {undefined}
	 */
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
						if (data.source.id_str !== TARGET_USER_ID) {
							return;
						}

						addTweet(data.target_object);
						break;
					case 'unfavorite':
						if (data.source.id_str !== TARGET_USER_ID) {
							return;
						}

						removeTweetById(data.target_object.id_str);
						break;
					default:
					// do nothing
				}
			} else if (data.delete) {
				removeTweetById(data.delete.status.id_str);
			} else if (data.retweeted_status) {
				if (data.user.id_str !== TARGET_USER_ID) {
					return;
				}

				const retweetedStatus = data.retweeted_status;
				retweetedStatus.gdqRetweetId = data.id_str;
				addTweet(retweetedStatus);
			} else if (data.text) {
				if (data.user.id_str !== TARGET_USER_ID) {
					return;
				}

				// Filter out @ replies
				if (data.text.charAt(0) === '@') {
					return;
				}

				addTweet(data);
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

	buildUserStream();

	// Close and re-open the twitter connection every 90 minutes
	setInterval(() => {
		nodecg.log.info('[twitter] Restarting Twitter connection (done every 90 minutes).');
		userStream.close();
		buildUserStream();
	}, 90 * 60 * 1000);

	nodecg.listenFor('acceptTweet', tweet => {
		// TODO: uncomment this line
		// removeTweetById(tweet.id_str);
		nodecg.sendMessage('showTweet', tweet);
	});

	nodecg.listenFor('rejectTweet', removeTweetById);

	/**
	 * Adds a Tweet to the queue.
	 * @param {Object} tweet - The tweet to add.
	 * @returns {undefined}
	 */
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
		tweet.text = tweet.text.split(HASHTAG).join(`<span class="hashtag">${HASHTAG}</span>`);
		tweet.text = tweet.text.split(hashtag).join(`<span class="hashtag">${hashtag}</span>`);

		// Parse emoji in tweet body
		// tweet.text = jEmoji.unifiedToHTML(tweet.text);

		// Add the tweet to the list
		tweets.value.push(tweet);
	}

	/**
	 * Removes a Tweet (by id) from the queue.
	 * @param {String} idToRemove - The ID string of the Tweet to remove.
	 * @returns {Object} - The removed tweet. "Undefined" if tweet not found.
	 */
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
