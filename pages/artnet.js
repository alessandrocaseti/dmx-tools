document.addEventListener('DOMContentLoaded', () => {
    if(isDesktop())
    {
        initializeArtNet();
    }
})

function initializeArtNet() 
{
	if (typeof require !== 'function') 
	{
		const logger = document.getElementById('artnet-logger');
		let controls = document.getElementById('artnet-controls');
		if (!controls && logger && logger.parentNode) 
		{
			controls = document.createElement('div');
			controls.id = 'artnet-controls';
				controls.innerHTML = `
					<button id="artnet-ipc-try">Start receiving</button>
					<span id="artnet-conn-badge" style="margin-left:8px; padding:2px 6px; border-radius:4px; background:#f88; color:#300;">NOT CONNECTED</span>
					<button id="artnet-toggle-logging" style="margin-left:8px;">Stop logging</button>
					<span id="artnet-status"></span>
					<span id="artnet-speed" style="margin-left:8px;">--</span>
					<button id="artnet-clear-logs" style="margin-left:4px;">Clear logs</button>
					<button id="artnet-toggle-view">Toggle Universe / Logs View</button>
				`;
			logger.parentNode.insertBefore(controls, logger);
			// ---- Universe view toggle (do NOT clear logs) ----
			(function() {
			const loggerEl = document.getElementById('artnet-logger');
			const controls = document.getElementById('artnet-controls');
			if (!controls || !loggerEl) return;

			// Ensure toggle button has a stable id (reuse existing Toggle button if present)
			let toggleBtn = document.getElementById('artnet-toggle-view');
			if (!toggleBtn) {
				toggleBtn = Array.from(controls.querySelectorAll('button')).find(b => /toggle\s+universe/i.test(b.textContent));
				if (toggleBtn) toggleBtn.id = 'artnet-toggle-view';
				else {
				toggleBtn = document.createElement('button');
				toggleBtn.id = 'artnet-toggle-view';
				toggleBtn.textContent = 'Show Universe';
				controls.appendChild(toggleBtn);
				}
			}

			// Create hidden universe panel (if not already present)
			if (!document.getElementById('artnet-universe')) {
				const uni = document.createElement('div');
				uni.id = 'artnet-universe';
				uni.style.display = 'none';
				uni.style.border = '1px dashed #666';
				uni.style.padding = '8px';
				uni.style.marginTop = '8px';
				uni.innerHTML = '<div class="universe-placeholder">Universe view placeholder</div>';
				if (loggerEl.parentNode) loggerEl.parentNode.insertBefore(uni, loggerEl.nextSibling);
			}

			// Toggle handler: only toggles visibility — does NOT clear logger contents
			toggleBtn.addEventListener('click', () => {
				const uni = document.getElementById('artnet-universe');
				const loggerEl = document.getElementById('artnet-logger');
				if (!uni || !loggerEl) return;
				const showingUniverse = uni.style.display !== 'none';
				if (showingUniverse) {
				uni.style.display = 'none';
				loggerEl.style.display = '';
				toggleBtn.textContent = 'Show Universe';
				} else {
				uni.style.display = '';
				loggerEl.style.display = 'none';
				toggleBtn.textContent = 'Show Logs';
				}
			});
			})();
		}

		const tryBtn = document.getElementById('artnet-ipc-try');
		const copyBtn = document.getElementById('artnet-ipc-copy');
		const status = document.getElementById('artnet-status');
		function setStatus(t) { if (status) status.textContent = t; }

		if (tryBtn) tryBtn.addEventListener('click', () => 
		{
			// toggle start/stop receiving via IPC
			window._artnetIPCRunning = window._artnetIPCRunning || false;
			if (!window._artnetIPCRunning) {
				setStatus('Attempting IPC start...');
				try {
					if (window.electronAPI && typeof window.electronAPI.startArtNet === 'function') {
						window.electronAPI.startArtNet(); setStatus('IPC: startArtNet() called');
					} else if (window.ipcRenderer && typeof window.ipcRenderer.send === 'function') {
						window.ipcRenderer.send('start-artnet'); setStatus('ipcRenderer: start-artnet sent');
					} else if (window.api && typeof window.api.startArtNet === 'function') {
						window.api.startArtNet(); setStatus('api.startArtNet() called');
					} else {
						setStatus('No IPC bridge found');
					}
				} catch (e) { setStatus('IPC attempt failed: ' + String(e)); }
				window._artnetIPCRunning = true;
				tryBtn.textContent = 'Stop receiving';
			} else {
				// stop receiving
				try {
					if (window.electronAPI && typeof window.electronAPI.stopArtNet === 'function') {
						window.electronAPI.stopArtNet();
					} else if (window.ipcRenderer && typeof window.ipcRenderer.send === 'function') {
						window.ipcRenderer.send('stop-artnet');
					} else if (window.api && typeof window.api.stopArtNet === 'function') {
						window.api.stopArtNet();
					}
				} catch (e) { /* ignore */ }
				window._artnetIPCRunning = false;
				tryBtn.textContent = 'Start receiving';
				// reset UI to uninitialized state
				setConnectionBadge('NOT CONNECTED', false);
				const speedElem = document.getElementById('artnet-speed'); if (speedElem) speedElem.textContent = '--';
				setStatus('Stopped');
				// reset counters and logging state
				window._artnetPackets = 0; window._artnetBytes = 0; window._artnetLastPackets = 0; window._artnetLastBytes = 0;
				window._artnetLoggingPaused = false;
				// restore logging toggle button text
				const ipcToggleBtn = document.getElementById('artnet-toggle-logging'); if (ipcToggleBtn) ipcToggleBtn.textContent = 'Stop logging';
				// stop speed updates
				if (window._artnetSpeedInterval) { clearInterval(window._artnetSpeedInterval); window._artnetSpeedInterval = null; }
			}
		});

		if (copyBtn) copyBtn.addEventListener('click', () => 
		{
			const msg = `To enable ArtNet in the desktop app, either:\n` +
				`1) Enable nodeIntegration in your BrowserWindow (not recommended):\n` +
				`   new BrowserWindow({ webPreferences: { nodeIntegration: true } })\n` +
				`2) Create a preload script exposing a startArtNet bridge:\n` +
				`   // preload.js\n` +
				`   const { contextBridge, ipcRenderer } = require('electron');\n` +
				`   contextBridge.exposeInMainWorld('electronAPI', { startArtNet: () => ipcRenderer.send('start-artnet') });\n` +
				`Then in main process handle 'start-artnet' to create a dgram socket and forward packets via IPC.`;
			alert(msg);
		});

		// If an IPC bridge is available, register to receive packets and status updates
		try 
		{
			// small helpers for the IPC branch (renderer without require)
			function fmtHex(buf, maxLen = 48) 
			{
				if (!buf) return '';
				const len = Math.min((buf.length || 0), maxLen);
				const parts = [];
				for (let i = 0; i < len; i++) parts.push((buf[i] || 0).toString(16).padStart(2, '0'));
				if ((buf.length || 0) > maxLen) parts.push('...');
				return parts.join(' ');
			}

			function addLog(html) 
			{
				if (!logger) return;
				if (window._artnetLoggingPaused) return;
				const entry = document.createElement('div');
				entry.className = 'artnet-entry';
				entry.innerHTML = html;
				logger.prepend(entry);
				while (logger.children.length > 200) logger.removeChild(logger.lastChild);
			}

			// logging controls & speed tracking (IPC renderer path)
			window._artnetLoggingPaused = false;
			window._artnetPackets = 0;
			window._artnetBytes = 0;
			window._artnetLastPackets = 0;
			window._artnetLastBytes = 0;
			window._artnetSpeedInterval = null;

			function setConnectionBadge(text, ok) 
			{
				const b = document.getElementById('artnet-conn-badge');
				if (!b) return;
				b.textContent = text;
				b.style.background = ok ? '#8f8' : '#f88';
				b.style.color = ok ? '#030' : '#300';
			}

			function startSpeedInterval() 
			{
				if (window._artnetSpeedInterval) return;
				window._artnetLastPackets = window._artnetPackets;
				window._artnetLastBytes = window._artnetBytes;
				window._artnetSpeedInterval = setInterval(() => 
				{
					const sp = window._artnetPackets - window._artnetLastPackets;
					const sb = window._artnetBytes - window._artnetLastBytes;
					window._artnetLastPackets = window._artnetPackets;
					window._artnetLastBytes = window._artnetBytes;
					const speedElem = document.getElementById('artnet-speed');
					if (speedElem) 
					{
						const mbps = (sb / 1024 / 1024).toFixed(3);
						speedElem.textContent = `${sp} pk/s ${mbps} MB/s`;
					}
				}, 1000);
			}

			function stopSpeedInterval() 
			{
				if (window._artnetSpeedInterval) { clearInterval(window._artnetSpeedInterval); window._artnetSpeedInterval = null; }
			}

			if (window.electronAPI && typeof window.electronAPI.onPacket === 'function') 
			{
				window.electronAPI.onPacket((packet) => 
				{
					try 
					{
						const now = new Date().toLocaleTimeString();
						const OPCODES = { 0x2000: 'OpPoll', 0x2100: 'OpPollReply', 0x5000: 'OpDmx' };
						const rinfo = (packet && packet.rinfo) ? packet.rinfo : { address: '', port: '' };
						const id = packet && packet.id ? packet.id : '';
						const opcode = packet && packet.opcode ? packet.opcode : 0;
						const opname = OPCODES[opcode] || 'Unknown';
						let html = `<div class="artnet-meta"><b>${now}</b> — <b>from</b>: ${rinfo.address}:${rinfo.port} — <b>${opname}</b> (0x${opcode.toString(16)})</div>`;
						if (packet && packet.type === 'dmx') 
						{
							const sequence = packet.sequence;
							const physical = packet.physical;
							const subUni = packet.subUni;
							const net = packet.net;
							const length = packet.length;
							const data = Uint8Array.from(packet.data || []);
							html += `<div class="artnet-body"><div><b>Seq</b>: ${sequence} <b>Physical</b>: ${physical} <b>SubUni</b>: ${subUni} <b>Net</b>: ${net} <b>Len</b>: ${length}</div>`;
							html += `<div class="artnet-data"><b>Data (hex)</b>: ${fmtHex(data, 96)}</div>`;
							const decVals = Array.from(data.slice(0, 24)).map((v) => v.toString());
							html += `<div class="artnet-data"><b>DMX</b>: ${decVals.join(', ')}${data.length > 24 ? ', ...' : ''}</div>`;
							html += `</div>`;
						} 
						else 
						{
							html += `<div class="artnet-body"><div><b>Header</b>: ${String(id).replace(/\0/g, '')} <b>Bytes</b>: ${packet.length || 0}</div>`;
							html += `<div class="artnet-data"><b>Raw (hex)</b>: ${packet.hex || ''}</div></div>`;
						}
						// update counters for speed display
						window._artnetPackets = (window._artnetPackets || 0) + 1;
						const bcount = (packet && packet.length) ? packet.length : (packet && packet.data ? packet.data.length : 0);
						window._artnetBytes = (window._artnetBytes || 0) + (bcount || 0);
						setConnectionBadge('OK', true);
						startSpeedInterval();
						addLog(html);
					} catch (e) { addLog(`<div class="artnet-meta">Error parsing IPC packet: ${String(e)}</div>`); }
				});
			}
			if (window.electronAPI && typeof window.electronAPI.onStatus === 'function') 
			{
				window.electronAPI.onStatus((st) => {
					setStatus(st && st.message ? st.message : String(st));
					if (st && st.connected) {
						setConnectionBadge('OK', true);
						startSpeedInterval();
					} else if (st && st.message && /bound|connected/i.test(st.message)) {
						setConnectionBadge('OK', true);
						startSpeedInterval();
					} else if (st && st.message && /error|failed/i.test(st.message)) {
						setConnectionBadge('Not connected', false);
						stopSpeedInterval();
					}
				});
			}

			// wire up IPC renderer logging controls
			const ipcToggle = document.getElementById('artnet-toggle-logging');
			const ipcClear = document.getElementById('artnet-clear-logs');
			if (ipcToggle) ipcToggle.addEventListener('click', () => 
			{
				window._artnetLoggingPaused = !window._artnetLoggingPaused;
				ipcToggle.textContent = window._artnetLoggingPaused ? 'Resume logging' : 'Stop logging';
			});
			if (ipcClear) ipcClear.addEventListener('click', () => 
			{
				if (logger) logger.innerHTML = '';
				window._artnetPackets = 0; window._artnetBytes = 0; window._artnetLastPackets = 0; window._artnetLastBytes = 0;
			});
		} catch (e) { console.warn('Failed to register IPC listeners', e); }

		return;
	}

	try 
	{
		const dgram = require('dgram');
		const os = require('os');

		let socket = null;
		const logger = document.getElementById('artnet-logger');
		if (!logger) console.warn('No artnet-logger element found in DOM');

		// Insert controls area if not present
		let controls = document.getElementById('artnet-controls');
		if (!controls && logger && logger.parentNode) 
		{
			controls = document.createElement('div');
			controls.id = 'artnet-controls';
			controls.innerHTML = `
					<label>Interface: <select id="artnet-iface"></select></label>
					<button id="artnet-bind">Bind</button>
					<button id="artnet-poll">Send Poll</button>
					<button id="artnet-refresh">Refresh</button>
					<span id="artnet-status"></span>
					<span id="artnet-conn-badge" style="margin-left:8px; padding:2px 6px; border-radius:4px; background:#f88; color:#300;">Not connected</span>
					<span id="artnet-speed" style="margin-left:8px;">--</span>
					<button id="artnet-toggle-logging" style="margin-left:8px;">Stop logging</button>
					<button id="artnet-clear-logs" style="margin-left:4px;">Clear logs</button>
				`;
			logger.parentNode.insertBefore(controls, logger);
		}

		const OPCODES = { 0x2000: 'OpPoll', 0x2100: 'OpPollReply', 0x5000: 'OpDmx' };

		function fmtHex(buf, maxLen = 48) 
		{
			const len = Math.min(buf.length, maxLen);
			const parts = [];
			for (let i = 0; i < len; i++) parts.push(buf[i].toString(16).padStart(2, '0'));
			if (buf.length > maxLen) parts.push('...');
			return parts.join(' ');
		}

		function addLog(html) 
		{
			if (!logger) return;
			if (window._artnetLoggingPaused) return;
			const entry = document.createElement('div');
			entry.className = 'artnet-entry';
			entry.innerHTML = html;
			logger.prepend(entry);
			while (logger.children.length > 200) logger.removeChild(logger.lastChild);
		}

		// logging controls & speed tracking (native socket path)
		window._artnetLoggingPaused = false;
		window._artnetPackets = 0;
		window._artnetBytes = 0;
		window._artnetLastPackets = 0;
		window._artnetLastBytes = 0;
		window._artnetSpeedInterval = null;

		function setConnectionBadge(text, ok) 
		{
			const b = document.getElementById('artnet-conn-badge');
			if (!b) return;
			b.textContent = text;
			b.style.background = ok ? '#8f8' : '#f88';
			b.style.color = ok ? '#030' : '#300';
		}

		function startSpeedInterval() 
		{
			if (window._artnetSpeedInterval) return;
			window._artnetLastPackets = window._artnetPackets;
			window._artnetLastBytes = window._artnetBytes;
			window._artnetSpeedInterval = setInterval(() => {
				const sp = window._artnetPackets - window._artnetLastPackets;
				const sb = window._artnetBytes - window._artnetLastBytes;
				window._artnetLastPackets = window._artnetPackets;
				window._artnetLastBytes = window._artnetBytes;
				const speedElem = document.getElementById('artnet-speed');
				if (speedElem) 
				{
					const mbps = (sb / 1024 / 1024).toFixed(3);
					speedElem.textContent = `${sp}/s ${mbps} MB/s`;
				}
			}, 1000);
		}

		function stopSpeedInterval() { if (window._artnetSpeedInterval) { clearInterval(window._artnetSpeedInterval); window._artnetSpeedInterval = null; } }

		function listInterfaces() 
		{
			const nets = os.networkInterfaces();
			const addrs = [];
			Object.keys(nets).forEach((name) => 
			{
				nets[name].forEach((info) => {
					if (info.family === 'IPv4') addrs.push({ name, address: info.address, internal: info.internal });
				});
			});
			// include wildcard and loopback
			addrs.unshift({ name: 'Any', address: '0.0.0.0', internal: false });
			addrs.push({ name: 'Loopback', address: '127.0.0.1', internal: true });
			return addrs;
		}

		function populateIfaceSelect() {
			const sel = document.getElementById('artnet-iface');
			if (!sel) return;
			const addrs = listInterfaces();
			sel.innerHTML = '';
			addrs.forEach((a) => {
				const opt = document.createElement('option');
				opt.value = a.address;
				opt.textContent = `${a.name} - ${a.address}${a.internal ? ' (internal)' : ''}`;
				sel.appendChild(opt);
			});
		}

		function createAndBind(bindAddr) {
			if (socket) {
				try { socket.close(); } catch (e) {}
			}
			socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

			socket.on('error', (err) => {
				addLog(`<div class="artnet-meta">Socket error: ${String(err)}</div>`);
				try { socket.close(); } catch (e) {}
				socket = null;
				setStatus('Socket error');
				setConnectionBadge('Not connected', false);
				stopSpeedInterval();
			});

			socket.on('message', (msg, rinfo) => {
				// update counters for speed display even if logging is paused
				window._artnetPackets = (window._artnetPackets || 0) + 1;
				window._artnetBytes = (window._artnetBytes || 0) + (msg && msg.length ? msg.length : 0);
				setConnectionBadge('OK', true);
				startSpeedInterval();
				try {
					if (window._artnetLoggingPaused) return;
					const now = new Date().toLocaleTimeString();
					const id = msg.slice(0, 8).toString('ascii');
					const opcode = msg.length >= 10 ? msg.readUInt16LE(8) : 0;
					const opname = OPCODES[opcode] || 'Unknown';

					let html = `<div class="artnet-meta"><b>${now}</b> — <b>from</b>: ${rinfo.address}:${rinfo.port} — <b>${opname}</b> (0x${opcode.toString(16)})</div>`;

					if (id === 'Art-Net\u0000' && opcode === 0x5000 && msg.length >= 18) {
						const sequence = msg[12];
						const physical = msg[13];
						const subUni = msg[14];
						const net = msg[15];
						const length = msg.readUInt16BE(16);
						const data = msg.slice(18, 18 + length);
						html += `<div class="artnet-body"><div><b>Seq</b>: ${sequence} <b>Physical</b>: ${physical} <b>SubUni</b>: ${subUni} <b>Net</b>: ${net} <b>Len</b>: ${length}</div>`;
						html += `<div class="artnet-data"><b>Data (hex)</b>: ${fmtHex(data, 96)}</div>`;
						const decVals = Array.from(data.slice(0, 24)).map((v) => v.toString());
						html += `<div class="artnet-data"><b>DMX</b>: ${decVals.join(', ')}${data.length > 24 ? ', ...' : ''}</div>`;
						html += `</div>`;
					} else {
						html += `<div class="artnet-body"><div><b>Header</b>: ${id.replace(/\0/g, '')} <b>Bytes</b>: ${msg.length}</div>`;
						html += `<div class="artnet-data"><b>Raw (hex)</b>: ${fmtHex(msg, 96)}</div></div>`;
					}

					addLog(html);
				} catch (e) {
					addLog(`<div class="artnet-meta">Error parsing packet: ${String(e)}</div>`);
				}
			});

			// Bind. On some platforms binding to 0.0.0.0 requires omitting address.
			const cb = () => {
				try { socket.setBroadcast(true); } catch (e) {}
				addLog(`<div class="artnet-meta">Bound ArtNet on ${bindAddr || '0.0.0.0'}:6454</div>`);
				setStatus(`Bound ${bindAddr || '0.0.0.0'}`);
				setConnectionBadge('OK', true);
				startSpeedInterval();
			};

			try {
				if (!bindAddr || bindAddr === '0.0.0.0') socket.bind(6454, cb);
				else socket.bind(6454, bindAddr, cb);
			} catch (e) {
				addLog(`<div class="artnet-meta">Bind failed: ${String(e)}</div>`);
				setStatus('Bind failed');
			}
		}

		function setStatus(text) {
			const s = document.getElementById('artnet-status');
			if (s) s.textContent = text;
		}

		function sendOpPoll() {
			if (!socket) return addLog('<div class="artnet-meta">No socket to send from</div>');
			const buf = Buffer.alloc(14);
			Buffer.from('Art-Net\0').copy(buf, 0);
			buf.writeUInt16LE(0x2000, 8); // OpPoll
			buf.writeUInt16BE(14, 10); // ProtVer
			// Send to broadcast
			const target = '255.255.255.255';
			socket.send(buf, 0, buf.length, 6454, target, (err) => {
				if (err) addLog(`<div class="artnet-meta">Send error: ${String(err)}</div>`);
				else addLog(`<div class="artnet-meta">Sent OpPoll to ${target}:6454</div>`);
			});
		}

		// Wire up UI
		populateIfaceSelect();
		const bindBtn = document.getElementById('artnet-bind');
		const pollBtn = document.getElementById('artnet-poll');
		const refreshBtn = document.getElementById('artnet-refresh');

		if (bindBtn) bindBtn.addEventListener('click', () => {
			const sel = document.getElementById('artnet-iface');
			const addr = sel ? sel.value : null;
			createAndBind(addr);
		});

		if (pollBtn) pollBtn.addEventListener('click', () => sendOpPoll());
		if (refreshBtn) refreshBtn.addEventListener('click', () => { populateIfaceSelect(); addLog('<div class="artnet-meta">Refreshed interfaces</div>'); });

		// Toggle / Clear logging buttons (native)
		const toggleBtn = document.getElementById('artnet-toggle-logging');
		const clearBtn = document.getElementById('artnet-clear-logs');
		if (toggleBtn) toggleBtn.addEventListener('click', () => {
			window._artnetLoggingPaused = !window._artnetLoggingPaused;
			toggleBtn.textContent = window._artnetLoggingPaused ? 'Resume logging' : 'Stop logging';
		});
		if (clearBtn) clearBtn.addEventListener('click', () => {
			if (logger) logger.innerHTML = '';
			window._artnetPackets = 0; window._artnetBytes = 0; window._artnetLastPackets = 0; window._artnetLastBytes = 0;
		});

		// initial bind
		createAndBind('0.0.0.0');

		window.addEventListener('beforeunload', () => {
			try { if (socket) socket.close(); } catch (e) {}
			stopSpeedInterval();
		});

	} catch (err) { console.error('ArtNet desktop module failed to initialize:', err) }
}