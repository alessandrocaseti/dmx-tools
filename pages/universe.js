// Universe view: 16 columns x 32 rows (512 channels)
(() => {
	const COLS = 16;
	const ROWS = 32;
	const TOTAL = COLS * ROWS;

	let container;

	// Universe controller
	let currentUniverse = 1;
	const MAX_UNIVERSE = 1024;

	let universeController = null;
	let units = []; // expanded units derived from listaFixture
	let movedMap = {}; // unitId -> new start channel override

	function getLista() {
		if (typeof listaFixture !== 'undefined') return listaFixture;
		if (window && window.listaFixture) return window.listaFixture;
		return null;
	}

	function buildUnits() {
		units = [];
		let universo = 1;
		let canaleCorrente = 1;
		let id = 0;
		const lista = getLista();
		console.log('Universe: buildUnits - listaFixture present?', !!lista);
		console.log('Universe: listaFixture sample', lista && lista.slice && lista.slice(0,6));
		if (!lista) return;
		for (let fi = 0; fi < lista.length; fi++) {
			const f = lista[fi];
			for (let i = 1; i <= f.numero; i++) {
				if (canaleCorrente + f.canali - 1 > TOTAL) {
					universo++;
					canaleCorrente = 1;
				}
				units.push({
					unitId: id++,
					groupIndex: fi,
					instanceIndex: i - 1,
					nome: f.nome + (f.numero > 1 ? ` ${i}` : ''),
					tipo: f.tipo,
					canali: f.canali,
					colore: f.colore,
					universo: universo,
					canaleStart: canaleCorrente
				});
				canaleCorrente += f.canali;
			}
		}
	}

	function applyMoveToLista(unit, newStart) {
		if (!window.listaFixture || typeof window.listaFixture === 'undefined') return;
		const lista = window.listaFixture;
		const srcIdx = unit.groupIndex;
		if (srcIdx == null || srcIdx < 0 || srcIdx >= lista.length) return;
		const src = lista[srcIdx];

		// create a single-unit entry for the moved fixture
		const newEntry = { nome: src.nome, tipo: src.tipo, numero: 1, canali: src.canali, colore: src.colore };

		// remove one instance from source group (or remove the group entirely)
		if (src.numero > 1) {
			src.numero = src.numero - 1;
		} else {
			// remove the whole fixture entry
			lista.splice(srcIdx, 1);
		}

		// find insertion index based on channels to reach newStart
		let acc = 1;
		let insertIdx = lista.length;
		for (let i = 0; i < lista.length; i++) {
			const f = lista[i];
			const span = f.numero * f.canali;
			if (newStart <= acc + span - 1) {
				insertIdx = i;
				break;
			}
			acc += span;
		}

		lista.splice(insertIdx, 0, newEntry);
		updatePatch();
	}

	function channelToPos(channel) {
		const idx = channel - 1;
		const row = Math.floor(idx / COLS) + 1;
		const col = (idx % COLS) + 1;
		return { row, col };
	}

	function colorWithAlpha(col, alpha) {
		if (!col) return col;
		col = col.trim();
		if (col.startsWith('#')) {
			if (col.length === 4) {
				const r = parseInt(col[1] + col[1], 16);
				const g = parseInt(col[2] + col[2], 16);
				const b = parseInt(col[3] + col[3], 16);
				return `rgba(${r},${g},${b},${alpha})`;
			}
			if (col.length === 7) {
				const r = parseInt(col.substr(1, 2), 16);
				const g = parseInt(col.substr(3, 2), 16);
				const b = parseInt(col.substr(5, 2), 16);
				return `rgba(${r},${g},${b},${alpha})`;
			}
		}
		if (col.startsWith('rgb(')) {
			return col.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
		}
		if (col.startsWith('rgba(')) {
			const parts = col.slice(5, -1).split(',');
			parts[3] = String(alpha);
			return `rgba(${parts.join(',')})`;
		}
		return col;
	}

	
	function colorToRGB(col) {
		if (!col) return col;
		col = col.trim();
		if (col.startsWith('#')) {
			if (col.length === 4) {
				const r = parseInt(col[1] + col[1], 16);
				const g = parseInt(col[2] + col[2], 16);
				const b = parseInt(col[3] + col[3], 16);
				return `rgb(${r},${g},${b})`;
			}
			if (col.length === 7) {
				const r = parseInt(col.substr(1, 2), 16);
				const g = parseInt(col.substr(3, 2), 16);
				const b = parseInt(col.substr(5, 2), 16);
				return `rgb(${r},${g},${b})`;
			}
		}
		if (col.startsWith('rgb(') || col.startsWith('rgba(')) {
			const parts = col.slice(col.indexOf('(') + 1, -1).split(',');
			const r = parseInt(parts[0], 10);
			const g = parseInt(parts[1], 10);
			const b = parseInt(parts[2], 10);
			return `rgb(${r},${g},${b})`;
		}
		return col;
	}

	function parseColorToRGB(col) {
		if (!col) return null;
		col = col.trim();
		if (col.startsWith('#')) {
			if (col.length === 4) {
				return [parseInt(col[1] + col[1], 16), parseInt(col[2] + col[2], 16), parseInt(col[3] + col[3], 16)];
			}
			if (col.length === 7) {
				return [parseInt(col.substr(1, 2), 16), parseInt(col.substr(3, 2), 16), parseInt(col.substr(5, 2), 16)];
			}
		}
		if (col.startsWith('rgb(') || col.startsWith('rgba(')) {
			const parts = col.slice(col.indexOf('(') + 1, -1).split(',').map(p => p.trim());
			return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
		}
		return null;
	}

	function blendColorWithBackground(fgCol, alpha, bgCol = '#111') {
		const fg = parseColorToRGB(fgCol);
		const bg = parseColorToRGB(bgCol) || [17,17,17];
		if (!fg) return colorToRGB(bgCol);
		const a = Number(alpha);
		const r = Math.round(fg[0] * a + bg[0] * (1 - a));
		const g = Math.round(fg[1] * a + bg[1] * (1 - a));
		const b = Math.round(fg[2] * a + bg[2] * (1 - a));
		return `rgb(${r},${g},${b})`;
	}

	function clearGrid() {
		container.innerHTML = '';
	}

	function renderGrid() {
		clearGrid();
		console.log('Universe: rendering grid; units count=', units.length);
		// create cells
		const grid = document.createElement('div');
		grid.className = 'universeGridInner';

		for (let i = 1; i <= TOTAL; i++) {
			const cell = document.createElement('div');
			cell.className = 'universeCell';
			cell.dataset.channel = i;
			cell.textContent = i.toString().padStart(3, '0');
			grid.appendChild(cell);
		}

		container.appendChild(grid);

		// render fixtures for universe 1 as bounding rectangles and mark occupied cells
		const segLayer = document.createElement('div');
		segLayer.className = 'fixtureLayer';
		container.appendChild(segLayer);

		// clear previous occupied flags
		// (cells were just created, but keep the logic for re-render)
		const allCells = grid.querySelectorAll('.universeCell');
		allCells.forEach(c => c.classList.remove('occupied'));

		let segCount = 0;
		units.forEach(u => {
			const override = movedMap[u.unitId];
			const effectiveUniverse = override && override.universo ? override.universo : u.universo;
			if (effectiveUniverse !== currentUniverse) return;
			const start = override && override.canaleStart ? override.canaleStart : u.canaleStart;
			const end = start + u.canali - 1;

			// mark occupied cells
			for (let ch = start; ch <= end; ch++) {
				const cell = grid.querySelector(`.universeCell[data-channel='${ch}']`);
				if (cell) {
					cell.classList.add('occupied');
					cell.dataset.unitId = u.unitId;
				}
			}

			// compute bounding box (rows/cols of start and end)
			const startPos = channelToPos(start);
			const endPos = channelToPos(end);
			const rowStart = startPos.row;
			const rowEnd = endPos.row;
			// If fixture spans multiple rows, create one DOM segment per row
			let firstSegment = true;
			for (let row = rowStart; row <= rowEnd; row++) {
				const segColStart = (row === startPos.row) ? startPos.col : 1;
				const segColEnd = (row === endPos.row) ? endPos.col : COLS;
				const segStartChannel = (row === startPos.row) ? start : ((row - 1) * COLS + 1);
				const segEndChannel = (row === endPos.row) ? end : (row * COLS);

				const seg = document.createElement('div');
				seg.className = 'fixtureSegment';
				seg.style.gridRowStart = row;
				seg.style.gridRowEnd = row + 1;
				seg.style.gridColumnStart = segColStart;
				seg.style.gridColumnEnd = segColEnd + 1;
				seg.style.background = colorWithAlpha(u.colore, 0.25);
				seg.dataset.unitId = u.unitId; // same unit id for all parts
				if (firstSegment) 
				{
					const label = document.createElement('div');
					label.className = 'fixtureLabel';
					label.textContent = `${u.nome}`;
					label.style.background = blendColorWithBackground(u.colore, 0.5, '#000');
					seg.appendChild(label);
					/*seg.dataset.name = u.nome;*/
				}
				seg.title = `${u.nome} | Address: ${start.toString().padStart(3,'0')} - Total channels: ${u.canali}`;
				seg.dataset.start = segStartChannel;
				seg.dataset.end = segEndChannel;
				seg.dataset.channels = u.canali;
				makeDraggable(seg, u);
				segLayer.appendChild(seg);
				segCount++;
				firstSegment = false;
			}
		});
		console.log('Universe: placed segments=', segCount);
	}

	function canMoveUnitTo(unit, desiredStart) {
		const start = Math.max(1, Math.min(TOTAL - unit.canali + 1, desiredStart));
		const end = start + unit.canali - 1;
		if (start < 1 || end > TOTAL) return { valid: false, reason: `Address out of range (${start} - ${end})` };

		// determine target universe for this move: use currentUniverse (UI) unless
		// the unit already has an override specifying a universe
		const unitOverride = movedMap[unit.unitId];
		const targetUniverse = unitOverride && unitOverride.universo ? unitOverride.universo : currentUniverse;
		// check against other units (consider movedMap overrides)
		for (let i = 0; i < units.length; i++) {
			const u2 = units[i];
			if (u2.unitId === unit.unitId) continue; // allow overlap with self
			const override = movedMap[u2.unitId];
			const effectiveUniverse2 = override && override.universo ? override.universo : u2.universo;
			// only consider conflicts for units in the same universe as the target
			if (effectiveUniverse2 !== targetUniverse) continue;
			const s2 = override && override.canaleStart ? override.canaleStart : u2.canaleStart;
			const e2 = s2 + u2.canali - 1;
			if (!(s2 <= end && e2 >= start)) continue;
			return { valid: false, reason: `Channels ${s2.toString().padStart(3,'0')} - ${e2.toString().padStart(3,'0')} are already occupied by ${u2.nome}` };
		}
		return { valid: true };
	}

	function makeDraggable(el, unit) {
		el.style.touchAction = 'none';
		let dragging = false;
		let dragEl = null;

		function getCellAtPoint(x, y) {
			const elems = document.elementsFromPoint(x, y);
			for (let i = 0; i < elems.length; i++) {
				const e = elems[i];
				if (e && e.classList && e.classList.contains('universeCell')) return e;
			}
			return null;
		}

		el.addEventListener('pointerdown', (ev) => {
			ev.preventDefault();
			dragging = true;
			el.setPointerCapture(ev.pointerId);
			dragEl = el;
			dragEl.classList.add('dragging');
		});

			document.addEventListener('pointermove', (ev) => {
				if (!dragging || !dragEl) return;
				const target = getCellAtPoint(ev.clientX, ev.clientY);
			// clear previous highlight classes
			document.querySelectorAll('.universeCell.cellHighlightStart, .universeCell.cellHighlightRange, .universeCell.cellHighlightInvalid').forEach(c => {
				c.classList.remove('cellHighlightStart', 'cellHighlightRange', 'cellHighlightInvalid');
			});
				if (target) {
				const newChan = parseInt(target.dataset.channel, 10);
				const bounded = Math.max(1, Math.min(TOTAL - unit.canali + 1, newChan));
				const candidateStart = bounded;
				const candidateEnd = bounded + unit.canali - 1;
				// highlight range
				for (let ch = candidateStart; ch <= candidateEnd; ch++) {
					const cell = document.querySelector(`.universeCell[data-channel='${ch}']`);
					if (!cell) continue;
					if (ch === candidateStart) cell.classList.add('cellHighlightStart');
					else cell.classList.add('cellHighlightRange');
				}
				// mark invalid overlaps visually
				const check = canMoveUnitTo(unit, bounded);
				if (!check.valid) {
					// mark conflicting cells (if any)
					for (let ch = candidateStart; ch <= candidateEnd; ch++) {
						const cell = document.querySelector(`.universeCell[data-channel='${ch}']`);
						if (!cell) continue;
						cell.classList.add('cellHighlightInvalid');
					}
				}
			}
		});

			document.addEventListener('pointerup', (ev) => {
				if (!dragging) return;
				dragging = false;
				if (dragEl) dragEl.classList.remove('dragging');
				const target = getCellAtPoint(ev.clientX, ev.clientY);
				if (target) {
				const newChan = parseInt(target.dataset.channel, 10);
				const bounded = Math.max(1, Math.min(TOTAL - unit.canali + 1, newChan));
				const check = canMoveUnitTo(unit, bounded);
				if (!check.valid) {
					setCmdMessage(`Cannot move ${unit.nome}: ${check.reason}`, 'ERROR');
				} else {
					// record move for visual feedback
					movedMap[unit.unitId] = { canaleStart: bounded, universo: currentUniverse };
					// apply the move to the global patch list so updatePatch() reflects the change
					applyMoveToLista(unit, bounded);
					// rebuild units and UI
					buildUnits();
					renderGrid();
					setCmdMessage(`Moved ${unit.nome} to address ${bounded.toString().padStart(3,'0')}`, 'UPDATE');
				}
			}
			document.querySelectorAll('.universeCell.cellHighlightStart, .universeCell.cellHighlightRange, .universeCell.cellHighlightInvalid').forEach(c => c.classList.remove('cellHighlightStart', 'cellHighlightRange', 'cellHighlightInvalid'));
		});
	}

	function init() {
		container = document.querySelector('.universeGrid');
		if (!container) return;

		// Initialize universe controller and bind UI
		universeController = {
			setUniverse: (u) => {
				let v = parseInt(u);
				if (isNaN(v)) v = 1;
				if (v < 1) v = 1;
				if (v > MAX_UNIVERSE) v = MAX_UNIVERSE;
				currentUniverse = v;
				const input = document.getElementById('uniSelect');
				if (input) input.value = currentUniverse;
				// re-render grid with new universe
				buildUnits();
				renderGrid();
				updateUniverseButtons();
				setCmdMessage(`Universe set to ${currentUniverse}.`, 'UNIVERSE');
			},
			updateFromInput: () => {
				const input = document.getElementById('uniSelect');
				if (!input) return;
				let v = parseInt(input.value);
				if (isNaN(v)) v = 1;
				if (v < 1) v = 1;
				if (v > MAX_UNIVERSE) v = MAX_UNIVERSE;
				universeController.setUniverse(v);
			},
			incrementUniverse: () => {
				if (currentUniverse < MAX_UNIVERSE) universeController.setUniverse(currentUniverse + 1);
			},
			decrementUniverse: () => {
				if (currentUniverse > 1) universeController.setUniverse(currentUniverse - 1);
			}
		};

		function updateUniverseButtons() {
			const prev = document.getElementById('prevUniBtn');
			const next = document.getElementById('nextUniBtn');
			if (prev) prev.disabled = currentUniverse <= 1;
			if (next) next.disabled = currentUniverse >= MAX_UNIVERSE;
		}

		// Bind UI controls
		const uniInput = document.getElementById('uniSelect');
		if (uniInput) {
			uniInput.setAttribute('min', '1');
			uniInput.setAttribute('max', String(MAX_UNIVERSE));
			uniInput.value = currentUniverse;
			uniInput.addEventListener('input', () => { universeController.updateFromInput(); });
		}

		const prevBtn = document.getElementById('prevUniBtn');
		if (prevBtn) prevBtn.addEventListener('click', () => { universeController.decrementUniverse(); });
		const nextBtn = document.getElementById('nextUniBtn');
		if (nextBtn) nextBtn.addEventListener('click', () => { universeController.incrementUniverse(); });

		// Expose controller
		window.universeController = universeController;
		updateUniverseButtons();
		buildUnits();
		renderGrid();

		// re-render when patch is updated (button)
		document.getElementById('calcolaPatchBtn')?.addEventListener('click', () => {
			buildUnits();
			movedMap = {};
			renderGrid();
		});

		// watch listaFixture for changes and rebuild automatically
		let prevLen = (getLista() && getLista().length) || 0;
		setInterval(() => {
			const len = (getLista() && getLista().length) || 0;
			if (len !== prevLen) {
				prevLen = len;
				console.log('Universe: detected listaFixture length change ->', len);
				buildUnits();
				renderGrid();
			}
		}, 500);

		// also check visibility of the universe page and refresh when shown
		let wasVisible = false;
		setInterval(() => {
			const universeDiv = document.getElementById('universe');
			const isVisible = universeDiv && window.getComputedStyle(universeDiv).display !== 'none';
			if (isVisible && !wasVisible) {
				console.log('Universe: detected page shown -> rebuilding');
				buildUnits();
				renderGrid();
			}
			wasVisible = isVisible;
		}, 300);

		// expose helper to manually rebuild from console
		window.rebuildUniverse = function() { buildUnits(); renderGrid(); };

		// when navigating to universe, rebuild to reflect latest patch
		document.getElementById('universeNavButton')?.addEventListener('click', () => {
			buildUnits();
			renderGrid();
		});
	}

	document.addEventListener('DOMContentLoaded', init);
})();
