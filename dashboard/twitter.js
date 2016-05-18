/* jshint -W106 */
(function () {
	'use strict';

	const tweetsContainer = document.getElementById('tweets');
	const tweets = nodecg.Replicant('tweets');
	const disabledCover = document.getElementById('cover');
	const empty = document.getElementById('empty');
	const layoutName = disabledCover.querySelector('.layoutName');

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

	const layoutState = nodecg.Replicant('layoutState');
	layoutState.on('change', newVal => {
		if (newVal.page === 'open') {
			layoutName.innerHTML = newVal.currentLayout;
			switch (newVal.currentLayout) {
				case '4x3_4':
					layoutName.innerHTML = '3x2_4, 4x3_4';
				/* falls through */
				case 'ds':
					disabledCover.reason = 'badLayout';
					break;
				default:
					disabledCover.reason = null;
			}
		} else {
			disabledCover.reason = newVal.page;
		}
	});
})();
