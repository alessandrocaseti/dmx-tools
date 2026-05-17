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
	let selectedUnits = new Set(); // unitId set for selection
	let selectMode = false;
	let selectingBox = null;
	let isSelectingRect = false;
	let selectStart = null;
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
		// expose current expanded units and movedMap to the global scope so other modules
		// (eg. the patch view) can read authoritative per-instance addresses and universes
		// This keeps the universe as the source-of-truth for addressing overrides.
		try {
			window.universeUnits = units.slice();
			window.universeMovedMap = Object.assign({}, movedMap);
			window.dispatchEvent(new Event('universeUpdated'));
		} catch (e) {
			// ignore if window is not available (should not happen in browser)
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
		// ensure selectingBox is present in DOM (renderGrid clears container.innerHTML earlier)
		if (selectingBox && container && !container.contains(selectingBox)) {
			container.appendChild(selectingBox);
		}
		// ensure selection box exists on top
		if (!selectingBox && container) {
			selectingBox = document.createElement('div');
			selectingBox.className = 'selectionBox';
				selectingBox.style.position = 'absolute';
				selectingBox.style.pointerEvents = 'none';
				selectingBox.style.border = '2px dashed yellow';
				selectingBox.style.background = 'rgba(255,255,0,0.08)';
			container.style.position = container.style.position || 'relative';
			container.appendChild(selectingBox);
		}

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
				// reflect existing selection visually
				if (selectedUnits.has(u.unitId)) {
					seg.classList.add('selectedFixture');
					seg.style.outline = '2px solid yellow';
				}
				// selection click handler
				seg.addEventListener('click', (ev) => {
					ev.stopPropagation();
					if (!selectMode) return;
					const uid = u.unitId;
					if (selectedUnits.has(uid)) {
						selectedUnits.delete(uid);
						seg.classList.remove('selectedFixture');
						seg.style.outline = '';
					} else {
						selectedUnits.add(uid);
						seg.classList.add('selectedFixture');
						seg.style.outline = '2px solid yellow';
					}
					updateSelectedList();
				});
				segLayer.appendChild(seg);
				segCount++;
				firstSegment = false;
			}
		});
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

		// apply vector shift to all units in currentUniverse
		universeController.applyVectorShift = (offset) => {
			if (!offset || isNaN(offset)) {
				setCmdMessage('Invalid vector offset.', 'ERROR');
				return;
			}
			offset = parseInt(offset, 10);
			// determine target units: selected if any, otherwise all units in current universe
			let shifting = [];
			if (selectedUnits.size > 0) {
				shifting = units.filter(u => selectedUnits.has(u.unitId));
			} else {
				shifting = units.filter(u => {
					const eff = (movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo;
					return eff === currentUniverse;
				});
			}
			if (shifting.length === 0) {
				setCmdMessage('No fixtures found in current universe to shift.', 'WARNING');
				return;
			}
			// compute proposed new ranges and validate
			const proposed = shifting.map(u => {
				const curStart = (movedMap[u.unitId] && movedMap[u.unitId].canaleStart) ? movedMap[u.unitId].canaleStart : u.canaleStart;
				return { unit: u, newStart: curStart + offset, newEnd: curStart + offset + u.canali - 1 };
			});
			// check bounds
			for (const p of proposed) {
				if (p.newStart < 1 || p.newEnd > TOTAL) {
					setCmdMessage(`Shift would move ${p.unit.nome} out of range (${p.newStart} - ${p.newEnd}).`, 'ERROR');
					return;
				}
			}
			// build occupied ranges for other units in the same universe (excluding shifting set)
			const others = units.filter(u2 => {
				const eff2 = (movedMap[u2.unitId] && movedMap[u2.unitId].universo) ? movedMap[u2.unitId].universo : u2.universo;
				return eff2 === currentUniverse && !shifting.some(s => s.unitId === u2.unitId);
			}).map(u2 => {
				const s = (movedMap[u2.unitId] && movedMap[u2.unitId].canaleStart) ? movedMap[u2.unitId].canaleStart : u2.canaleStart;
				return { start: s, end: s + u2.canali - 1, nome: u2.nome };
			});
			// check collisions
			for (const p of proposed) {
				for (const o of others) {
					if (!(p.newEnd < o.start || p.newStart > o.end)) {
						setCmdMessage(`Shift would conflict: ${p.unit.nome} (${p.newStart}-${p.newEnd}) overlaps ${o.nome} (${o.start}-${o.end}).`, 'ERROR');
						return;
					}
				}
			}
			// all good: apply movedMap overrides
			proposed.forEach(p => {
				movedMap[p.unit.unitId] = { canaleStart: p.newStart, universo: currentUniverse };
			});
			buildUnits();
			renderGrid();
			setCmdMessage(`Applied vector shift of ${offset} channels to ${proposed.length} fixture(s) in universe ${currentUniverse}.`, 'VECTOR SHIFT');
		};

		// cross-universe shift: move selected (or all in current) fixtures to a target universe.start
		universeController.crossUniverseShift = (targetUniverse, targetStart) => {
			let tu = parseInt(targetUniverse, 10);
			let ts = parseInt(targetStart, 10);
			if (isNaN(tu) || isNaN(ts)) { setCmdMessage('Invalid target universe or start address.', 'ERROR'); return; }
			if (tu < 1 || tu > MAX_UNIVERSE) { setCmdMessage('Target universe out of range.', 'ERROR'); return; }
			if (ts < 1 || ts > TOTAL) { setCmdMessage('Target start out of range (1 - ' + TOTAL + ').', 'ERROR'); return; }
			// determine targets: selected if any, otherwise all units in current universe
			let targets = [];
			if (selectedUnits.size > 0) targets = units.filter(u => selectedUnits.has(u.unitId));
			else targets = units.filter(u => {
				const eff = (movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo;
				return eff === currentUniverse;
			});
			if (targets.length === 0) { setCmdMessage('No fixtures found to shift.', 'WARNING'); return; }
			// sort by current start
			targets.sort((a,b) => {
				const sa = (movedMap[a.unitId] && movedMap[a.unitId].canaleStart) ? movedMap[a.unitId].canaleStart : a.canaleStart;
				const sb = (movedMap[b.unitId] && movedMap[b.unitId].canaleStart) ? movedMap[b.unitId].canaleStart : b.canaleStart;
				return sa - sb;
			});
			// compute proposed positions starting at ts
			let cur = ts;
			const proposed = [];
			for (let i = 0; i < targets.length; i++) {
				const u = targets[i];
				proposed.push({ unit: u, newStart: cur, newEnd: cur + u.canali - 1 });
				cur = cur + u.canali;
			}
			// validate bounds
			for (const p of proposed) {
				if (p.newStart < 1 || p.newEnd > TOTAL) { setCmdMessage(`Cross-universe shift would move ${p.unit.nome} out of range (${p.newStart} - ${p.newEnd}).`, 'ERROR'); return; }
			}
			// check collisions with existing fixtures in target universe (excluding moving units)
			const others = units.filter(u2 => {
				const eff2 = (movedMap[u2.unitId] && movedMap[u2.unitId].universo) ? movedMap[u2.unitId].universo : u2.universo;
				return eff2 === tu && !targets.some(t => t.unitId === u2.unitId);
			}).map(u2 => {
				const s = (movedMap[u2.unitId] && movedMap[u2.unitId].canaleStart) ? movedMap[u2.unitId].canaleStart : u2.canaleStart;
				return { start: s, end: s + u2.canali - 1, nome: u2.nome };
			});
			for (const p of proposed) {
				for (const o of others) {
					if (!(p.newEnd < o.start || p.newStart > o.end)) {
						setCmdMessage(`Cross-shift would conflict: ${p.unit.nome} (${p.newStart}-${p.newEnd}) overlaps ${o.nome} (${o.start}-${o.end}) in universe ${tu}.`, 'ERROR');
						return;
					}
				}
			}
			// apply movedMap overrides
			proposed.forEach(p => {
				movedMap[p.unit.unitId] = { canaleStart: p.newStart, universo: tu };
			});
			buildUnits();
			renderGrid();
			setCmdMessage(`Moved ${proposed.length} fixture(s) to universe ${tu} starting at ${ts}.`, 'CROSS SHIFT');
		};

		// toggle selection mode
		universeController.toggleSelectMode = () => {
			selectMode = !selectMode;
			const selDiv = document.getElementById('fixtureSelection');
			if (selectMode) {
				// show selection UI
				if (selDiv) selDiv.classList.add('visible');
				if (selectingBox) selectingBox.classList.add('visible');
				setCmdMessage('Selection enabled. Click fixtures or drag to select.', 'SELECT');
			} else {
				// hide selection UI and clear selection
				if (selDiv) selDiv.classList.remove('visible');
				if (selectingBox) selectingBox.classList.remove('visible');
				selectedUnits.clear();
				renderGrid();
				setCmdMessage('Selection disabled.', 'SELECT');
			}
			// refresh selected list display
			updateSelectedList();
		};

		// insert gaps of given size between selected fixtures (or all fixtures if none selected)
		universeController.insertGaps = (gapSize = 1) => {
			gapSize = parseInt(gapSize, 10) || 1;
			// choose target set
			let targets = [];
			if (selectedUnits.size > 0) targets = units.filter(u => selectedUnits.has(u.unitId));
			else targets = units.filter(u => ((movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo) === currentUniverse);
			if (targets.length === 0) { setCmdMessage('No fixtures to insert gaps for.', 'WARNING'); return; }
			// sort by current start
			targets.sort((a,b) => {
				const sa = (movedMap[a.unitId] && movedMap[a.unitId].canaleStart) ? movedMap[a.unitId].canaleStart : a.canaleStart;
				const sb = (movedMap[b.unitId] && movedMap[b.unitId].canaleStart) ? movedMap[b.unitId].canaleStart : b.canaleStart;
				return sa - sb;
			});
			// compute desired starts for targets (pack with gap)
			const base = (movedMap[targets[0].unitId] && movedMap[targets[0].unitId].canaleStart) ? movedMap[targets[0].unitId].canaleStart : targets[0].canaleStart;
			let cur = base;
			const proposed = [];
			for (let i=0;i<targets.length;i++){
				const u = targets[i];
				proposed.push({ unit: u, newStart: cur, newEnd: cur + u.canali - 1 });
				cur = cur + u.canali + gapSize;
			}
			// validate bounds
			for (const p of proposed) {
				if (p.newStart < 1 || p.newEnd > TOTAL) { setCmdMessage('Insert gaps would move ' + p.unit.nome + ' out of range.', 'ERROR'); return; }
			}
			// ensure no collisions with other units in same universe (we will shift others forward if needed)
			let others = units.filter(u => {
				const eff = (movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo;
				return eff === currentUniverse && !targets.some(t => t.unitId === u.unitId);
			});
			// apply proposed positions
			proposed.forEach(p => { movedMap[p.unit.unitId] = { canaleStart: p.newStart, universo: currentUniverse }; });
			// now, for each other unit, if it collides with any proposed, push it forward just enough
			others.sort((a,b) => { const sa=(movedMap[a.unitId]&&movedMap[a.unitId].canaleStart)?movedMap[a.unitId].canaleStart:a.canaleStart; const sb=(movedMap[b.unitId]&&movedMap[b.unitId].canaleStart)?movedMap[b.unitId].canaleStart:b.canaleStart; return sa-sb; });
			for (const o of others) {
				let s = (movedMap[o.unitId] && movedMap[o.unitId].canaleStart) ? movedMap[o.unitId].canaleStart : o.canaleStart;
				let e = s + o.canali -1;
				for (const p of proposed) {
					if (!(e < p.newStart || s > p.newEnd)) {
						// overlap -> move this other unit to just after p
						s = p.newEnd + 1;
						e = s + o.canali -1;
					}
				}
				if (e > TOTAL) { setCmdMessage('Cannot insert gaps: not enough space to move other fixtures.', 'ERROR'); return; }
				movedMap[o.unitId] = { canaleStart: s, universo: currentUniverse };
			}
			buildUnits(); renderGrid();
			setCmdMessage('Inserted gaps of ' + gapSize + ' channels for ' + proposed.length + ' fixture(s).', 'UPDATE');
		};

		// collapse gaps: pack selected or all fixtures contiguously starting at minimal start
		universeController.collapseGaps = () => {
			let targets = [];
			if (selectedUnits.size > 0) targets = units.filter(u => selectedUnits.has(u.unitId));
			else targets = units.filter(u => ((movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo) === currentUniverse);
			if (targets.length === 0) { setCmdMessage('No fixtures to collapse.', 'WARNING'); return; }
			// sort by start
			targets.sort((a,b) => {
				const sa = (movedMap[a.unitId] && movedMap[a.unitId].canaleStart) ? movedMap[a.unitId].canaleStart : a.canaleStart;
				const sb = (movedMap[b.unitId] && movedMap[b.unitId].canaleStart) ? movedMap[b.unitId].canaleStart : b.canaleStart;
				return sa - sb;
			});
			const base = (movedMap[targets[0].unitId] && movedMap[targets[0].unitId].canaleStart) ? movedMap[targets[0].unitId].canaleStart : targets[0].canaleStart;
			let cur = base;
			const proposed = [];
			for (let i=0;i<targets.length;i++){
				const u = targets[i];
				proposed.push({ unit: u, newStart: cur, newEnd: cur + u.canali -1 });
				cur = cur + u.canali;
			}
			// check for bounds
			for (const p of proposed) { if (p.newEnd > TOTAL) { setCmdMessage('Cannot collapse: would exceed universe size.', 'ERROR'); return; } }
			// ensure no collisions with non-targets; if non-targets overlap, abort to avoid unexpected large shifts
			const nonTargets = units.filter(u => ((movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo) === currentUniverse && !targets.some(t=>t.unitId===u.unitId));
			for (const nt of nonTargets) {
				const s = (movedMap[nt.unitId] && movedMap[nt.unitId].canaleStart) ? movedMap[nt.unitId].canaleStart : nt.canaleStart;
				const e = s + nt.canali -1;
				for (const p of proposed) {
					if (!(e < p.newStart || s > p.newEnd)) {
						setCmdMessage('Cannot collapse gaps because other fixtures would overlap selected ones. Select all fixtures or move blockers first.', 'ERROR');
						return;
					}
				}
			}
			// apply
			proposed.forEach(p => { movedMap[p.unit.unitId] = { canaleStart: p.newStart, universo: currentUniverse }; });
			buildUnits(); renderGrid();
			setCmdMessage('Collapsed gaps for ' + proposed.length + ' fixture(s).', 'UPDATE');
		};

		// shift so that the earliest fixture in currentUniverse starts at targetStart
		universeController.shiftFrom = (targetStart) => {
			let v = parseInt(targetStart, 10);
			if (isNaN(v)) {
				setCmdMessage('Invalid target start value.', 'ERROR');
				return;
			}
			if (v < 1 || v > TOTAL) {
				setCmdMessage('Target start out of range (1 - ' + TOTAL + ').', 'ERROR');
				return;
			}
			// determine target set for shiftFrom: selected if any, otherwise all units in current universe
			let inUniverse = [];
			if (selectedUnits.size > 0) {
				inUniverse = units.filter(u => selectedUnits.has(u.unitId));
			} else {
				inUniverse = units.filter(u => {
					const eff = (movedMap[u.unitId] && movedMap[u.unitId].universo) ? movedMap[u.unitId].universo : u.universo;
					return eff === currentUniverse;
				});
			}
			if (inUniverse.length === 0) { setCmdMessage('No fixtures found in current universe.', 'WARNING'); return; }
			const starts = inUniverse.map(u => (movedMap[u.unitId] && movedMap[u.unitId].canaleStart) ? movedMap[u.unitId].canaleStart : u.canaleStart);
			const minStart = Math.min.apply(null, starts);
			const offset = v - minStart;
			if (offset === 0) { setCmdMessage('Fixtures already start at ' + v + '.', 'WARNING'); return; }
			// delegate to applyVectorShift which will validate and apply
			universeController.applyVectorShift(offset);
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
		// clear selection helper
		universeController.clearSelection = () => {
			selectedUnits.clear();
			renderGrid();
			updateSelectedList();
			setCmdMessage('Selection cleared.', 'SELECT');
		};
		// helper to update selected list UI
		function updateSelectedList() {
			const el = document.getElementById('selectedFixturesList');
			if (!el) return;
			if (selectedUnits.size === 0) {
				el.innerHTML = '<span class="empty-message">No fixtures selected</span>';
				return;
			}
			const names = [];
			units.forEach(u => { if (selectedUnits.has(u.unitId)) names.push(u.nome); });
			el.textContent = names.slice(0,8).join(', ');
			if (names.length > 8) el.textContent += ' ... (' + names.length + ')';
		}
		window.universeController.updateSelectedList = updateSelectedList;

		// Pointer-based rectangular selection handlers
		function toLocal(e) { const r = container.getBoundingClientRect(); return { x: e.clientX - r.left + container.scrollLeft, y: e.clientY - r.top + container.scrollTop }; }
		container.addEventListener('pointerdown', (ev) => {
			if (!selectMode) return;
			// start rectangular selection only on left button
			if (ev.button !== 0) return;
			ev.preventDefault();
			isSelectingRect = true;
			selectStart = toLocal(ev);
			if (selectingBox) {
				selectingBox.style.left = selectStart.x + 'px';
				selectingBox.style.top = selectStart.y + 'px';
				selectingBox.style.width = '0px';
				selectingBox.style.height = '0px';
				selectingBox.classList.add('visible');
			}
			container.setPointerCapture(ev.pointerId);
		});

		document.addEventListener('pointermove', (ev) => {
			if (!isSelectingRect || !selectStart) return;
			const p = toLocal(ev);
			const x = Math.min(p.x, selectStart.x);
			const y = Math.min(p.y, selectStart.y);
			const w = Math.abs(p.x - selectStart.x);
			const h = Math.abs(p.y - selectStart.y);
			if (selectingBox) {
				selectingBox.style.left = x + 'px';
				selectingBox.style.top = y + 'px';
				selectingBox.style.width = w + 'px';
				selectingBox.style.height = h + 'px';
			}
		});

		document.addEventListener('pointerup', (ev) => {
			if (!isSelectingRect || !selectStart) return;
			isSelectingRect = false;
			if (selectingBox) selectingBox.classList.remove('visible');
			// compute selection rect in viewport coords
			const rect = { left: selectStart.x, top: selectStart.y, right: selectStart.x, bottom: selectStart.y };
			const p = toLocal(ev);
			rect.left = Math.min(selectStart.x, p.x);
			rect.top = Math.min(selectStart.y, p.y);
			rect.right = Math.max(selectStart.x, p.x);
			rect.bottom = Math.max(selectStart.y, p.y);
			// convert to absolute page coordinates for intersection checks
			const containerRect = container.getBoundingClientRect();
			const selAbs = { left: containerRect.left + rect.left - container.scrollLeft, top: containerRect.top + rect.top - container.scrollTop, right: containerRect.left + rect.right - container.scrollLeft, bottom: containerRect.top + rect.bottom - container.scrollTop };
			// find fixture segments that intersect
			const segs = container.querySelectorAll('.fixtureSegment');
			let any = false;
			segs.forEach(s => {
				const r = s.getBoundingClientRect();
				const intersects = !(r.right < selAbs.left || r.left > selAbs.right || r.bottom < selAbs.top || r.top > selAbs.bottom);
				if (intersects) {
					const uid = parseInt(s.dataset.unitId, 10);
					selectedUnits.add(uid);
					any = true;
				}
			});
			// reflect selection visually
			if (any) {
				renderGrid();
				updateSelectedList();
			} else {
				setCmdMessage('No fixtures selected by rectangle.', 'WARNING');
			}
			selectStart = null;
		});
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

		// ensure select button reflects mode when first init
		const selectBtn = document.getElementById('selectFixturesBtn');
		if (selectBtn) {
			// make it toggle 'active' class and inline styles when selectMode changes via controller
			const origToggle = universeController.toggleSelectMode;
			universeController.toggleSelectMode = () => {
				origToggle();
				if (selectMode) {
					selectBtn.classList.add('active');
					selectBtn.style.background = 'rgba(255,235,59,0.08)';
					selectBtn.style.border = '1px solid rgb(255,235,59)';
					selectBtn.style.color = 'rgb(255,235,59)';
					selectBtn.style.boxShadow = '0 0 8px #ffeb3b33';
				} else {
					selectBtn.classList.remove('active');
					selectBtn.style.background = '';
					selectBtn.style.border = '';
					selectBtn.style.color = '';
					selectBtn.style.boxShadow = '';
				}
			};
		}

		// export/print for Universe
		window.startUniverseExport = async function() {
			// ensure grid is up to date
			buildUnits();
			renderGrid();

			// inject temporary print-override so #universe (which is .web-only) is printed
			let css = document.getElementById('universePrintOverride');
			if (!css) {
				css = document.createElement('style');
				css.id = 'universePrintOverride';
				css.textContent = `@media print { #universe { display: block !important; } #universe .web-only { display: block !important; } }`;
				document.head.appendChild(css);
			}

			// populate same header fields used by patch export if present
			try {
				const evento = document.getElementById('evento')?.value || '';
				const luogo = document.getElementById('luogo')?.value || '';
				const autore = document.getElementById('autorePatch')?.value || '';
				if (document.getElementById('eventoPrint')) document.getElementById('eventoPrint').textContent = evento || 'Not specified';
				if (document.getElementById('luogoPrint')) document.getElementById('luogoPrint').textContent = luogo || 'Not specified';
				if (document.getElementById('autorePatchPrint')) document.getElementById('autorePatchPrint').textContent = autore || 'Not specified';
				if (typeof setStats === 'function') setStats();
			} catch (e) { /* ignore */ }

			// hide selection visuals for print
			if (selectingBox) selectingBox.classList.remove('visible');

			// request doc number like patch export if available
			if (typeof getSetDocNumber === 'function') {
				if(window.location.protocol.startsWith("http") && window.location.hostname !== "localhost" && window.location.href !== "http://127.0.0.1:5500/index.html") {
					await getSetDocNumber();
				} else {
					if (typeof simulateOverlay === 'function') await simulateOverlay();
				}
			}

			// cleanup helper
			const cleanup = () => {
				const el = document.getElementById('universePrintOverride');
				if (el && el.parentNode) el.parentNode.removeChild(el);
				window.removeEventListener('afterprint', cleanup);
			};
			window.addEventListener('afterprint', cleanup);

			// trigger print
			window.print();
			// fallback cleanup
			setTimeout(cleanup, 2000);
		};
	}

	document.addEventListener('DOMContentLoaded', init);
})();
