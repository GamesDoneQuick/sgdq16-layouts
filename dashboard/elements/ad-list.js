(function () {
	const adListElements = document.getElementsByTagName('ad-list');
	const playImageButton = document.getElementById('play-image');
	const playVideoButton = document.getElementById('play-video');

	window.deselectAllAdLists = function () {
		for (let i = 0; i < adListElements.length; i++) {
			adListElements.item(i).deselect();
		}
		window.adListSelectedAd = null;
		playImageButton.setAttribute('disabled', 'true');
		playVideoButton.setAttribute('disabled', 'true');
	};

	Polymer({
		is: 'ad-list',

		properties: {
			ads: Array
		},

		deselect() {
			this.$.menu.select(-1);
		},

		_selectionChanged() {
			for (let i = 0; i < adListElements.length; i++) {
				if (adListElements.item(i) === this) {
					continue;
				}

				adListElements.item(i).deselect();
			}

			window.adListSelectedAd = this.$.menu.selectedItem.value;

			if (window.adListSelectedAd.type === 'image') {
				playImageButton.style.display = 'flex';
				playImageButton.removeAttribute('disabled');

				playVideoButton.style.display = 'none';
				window.checkVideoPlayButton();
			} else {
				playImageButton.style.display = 'none';
				playImageButton.setAttribute('disabled', 'true');

				playVideoButton.style.display = 'flex';
				window.checkVideoPlayButton();
			}
		}
	});
})();
