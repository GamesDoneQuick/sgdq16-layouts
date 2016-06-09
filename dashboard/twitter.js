/* jshint -W106 */
(function () {
	'use strict';

	const tweetsContainer = document.getElementById('tweets');
	const tweets = nodecg.Replicant('tweets');
	const empty = document.getElementById('empty');

	tweets.on('change', newVal => {
		empty.style.display = newVal.length > 0 ? 'none' : 'flex';

		// Remove existing tweets from div
		while (tweetsContainer.firstChild) {
			tweetsContainer.removeChild(tweetsContainer.firstChild);
		}

		const sortedTweets = newVal.slice(0);
		sortedTweets.sort((a, b) => {
			return new Date(b.created_at) - new Date(a.created_at);
		});

		sortedTweets.forEach(tweet => {
			const tweetItem = document.createElement('tweet-item');
			tweetItem.value = tweet;
			tweetsContainer.appendChild(tweetItem);
		});
	});
})();
