(function () {
	Polymer({
		is: 'ad-item',

		properties: {
			value: {
				type: Object,
				observer: '_valueChanged'
			},
			percentLoaded: {
				type: Number
			},
			loaded: {
				type: Boolean,
				value: false,
				observer: '_loadedChanged'
			}
		},

		_valueChanged(newVal) {
			this.setAttribute('filename', newVal.filename);
		},

		_loadedChanged(newVal) {
			if (newVal) {
				this.$.progressContainer.style.display = 'none';
			} else {
				this.$.progressContainer.style.display = 'flex';

				if (this.classList.contains('iron-selected')) {
					window.deselectAllAdLists();
				}
			}
		}
	});
})();
