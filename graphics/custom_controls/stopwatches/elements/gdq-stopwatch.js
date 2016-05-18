(function () {
	'use strict';

	Polymer({
		is: 'gdq-stopwatch',

		properties: {
			index: Number,
			running: {
				type: Boolean,
				value: false,
				readOnly: true,
				observer: 'runningChanged'
			},
			time: String,
			runner: String
		},

		runningChanged(newVal) {
			this.$.play.style.display = newVal ? 'none' : 'inline-block';
			this.$.pause.style.display = newVal ? 'inline-block' : 'none';
		},

		/*
		 * Lifecycle
		 */
		ready() {
			nodecg.Replicant('stopwatches').on('change', newVal => {
				if (!newVal) {
					return;
				} else if (!newVal[this.index]) {
					throw new Error('Index "%s" out of bounds (replicant length: %d',
						this.index, this.length);
				}

				const thisStopwatch = newVal[this.index];

				this.time = thisStopwatch.time;
				this.runner = thisStopwatch.runnerName;

				switch (thisStopwatch.state) {
					case 'paused':
						this.$.time.style.color = '#b67102';
						this.style.backgroundColor = '#E9C341';
						this.$.play.style.display = 'block';
						this.$.pause.style.display = 'none';
						this.$.finish.style.display = 'block';
						break;
					case 'finished':
						this.$.time.style.color = '#29813f';
						this.style.backgroundColor = '#9FD0AB';
						this.$.play.style.display = 'block';
						this.$.pause.style.display = 'block';
						this.$.finish.style.display = 'none';
						break;
					case 'running':
						this.$.time.style.color = 'black';
						this.style.backgroundColor = 'transparent';
						this.$.play.style.display = 'none';
						this.$.pause.style.display = 'block';
						this.$.finish.style.display = 'block';
						break;
					default:
						this.$.time.style.color = 'black';
						this.style.backgroundColor = 'transparent';
						this.$.play.style.display = 'block';
						this.$.pause.style.display = 'none';
						this.$.finish.style.display = 'block';
				}
			});

			nodecg.Replicant('currentRun').on('change', newVal => {
				if (!newVal) {
					return;
				}

				// Hide the entire element if there is no runner at this index.
				if (newVal.runners[this.index]) {
					this.removeAttribute('disabled');
				} else {
					this.setAttribute('disabled', true);
				}
			});
		},

		/*
		 * Events
		 */
		tapEdit() {
			const editDialog = document.getElementById('editDialog');
			window.setDialogInfo(this.index, this.runner, this.time);
			editDialog.open();
		},

		tapPlay() {
			nodecg.sendMessage('startTime', this.index);
		},

		tapPause() {
			nodecg.sendMessage('pauseTime', this.index);
		},

		tapFinish() {
			nodecg.sendMessage('finishTime', this.index);
		},

		tapReset() {
			const resetDialog = document.getElementById('resetDialog');
			window.setDialogInfo(this.index, this.runner);
			resetDialog.open();
		}
	});
})();
