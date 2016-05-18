(function () {
	'use strict';

	const totalDisplay = document.getElementById('total');
	const total = nodecg.Replicant('total');
	total.on('change', newVal => {
		totalDisplay.innerText = newVal.formatted;
	});

	const toast = document.getElementById('toast');
	const update = document.getElementById('update');
	update.addEventListener('click', () => {
		update.setAttribute('disabled', 'true');
		nodecg.sendMessage('updateTotal', (err, updated) => {
			update.removeAttribute('disabled');

			if (err) {
				console.error(err.message);
				toast.text = 'Error updating total. Check console.';
				toast.show();
				return;
			}

			if (updated) {
				console.info('[agdq16-layouts] Total successfully updated');
				toast.text = 'Successfully updated total.';
				toast.show();
			} else {
				console.info('[agdq16-layouts] Total unchanged, not updated');
				toast.text = 'Total unchanged, not updated.';
				toast.show();
			}
		});
	});

	const totalInput = window.top.document.querySelector('#agdq16-layouts_edit-total iframe')
		.contentDocument.getElementById('input');
	document.getElementById('edit').addEventListener('click', () => {
		totalInput.value = total.value.raw;
	});
})();
