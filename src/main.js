"use strict";

if (!CSS.escape) {
	CSS.escape = function(s) {
		return s.replace(/[~!@$%^&*\(\)+=,./';:"?><\[\]\\\{\}|`#]/g, "\\$&");
	}
}

if (!RegExp.escape) {
	RegExp.escape = function(s) {
		return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
}

function t(w) {
	if ((t.language in t.languages) && (w in t.languages[t.language])) {
		return t.languages[t.language][w]["message"];
		
	} else if (("en" in t.languages) && (w in t.languages["en"])) {
		return t.languages["en"][w]["message"];
	}
	
	return t.missing(w);
}
t.availableLanguages = [];
t.language = "en";
t.languages = {};
t.missing = function(w) {
	return "-" + w;
}
t.load = function (lng, callback) {
	if (!t.availableLanguages.length 
		&& (typeof chrome != undefined)
		&& chrome.runtime
		&& chrome.runtime.getPackageDirectoryEntry
	) {
		chrome.runtime.getPackageDirectoryEntry(function(fs) {
			fs.getDirectory("_locales", {create: false}, function(dir) {
				var dr = dir.createReader();
				var rd = function(entries) {
					var i = entries.length;
					
					while (i--) {
						if (entries[i].isDirectory) {
							t.availableLanguages.push(entries[i].name);
						}
					}
					
					if (!entries.length) {
						return t.load(lng, callback);
					}
					
					dr.readEntries(rd);
				}
				
				dr.readEntries(rd);
			});
		});
		
		return t;
	}
	
	if (!lng || lng == "auto" || t.availableLanguages.indexOf(lng) == -1) {
		lng = navigator.language.replace("-", "_");
		
		if (t.availableLanguages.indexOf(lng) == -1) {
			lng = lng.split("_")[0];
			lng = ((t.availableLanguages.indexOf(lng) == -1)? "en" : lng);
		}
	}
	
	t.language = lng;
	
	if (t.languages[lng]) {
		callback && callback();
	} else {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "_locales/" + lng + "/messages.json", true);
		xhr.overrideMimeType("application/json");
		xhr.addEventListener("loadend", function() {
			if (this.response) {
				t.languages[lng] = this.response;
				callback && callback();
			}
		});
		xhr.addEventListener("error", function(ev) {
			alert("Failed to load language : " + lng);
			!("en" in t.languages) && t.load("en", callback);
		});
		xhr.responseType = "json";
		xhr.send();
	}
	
	return t;
}
t.node = function (target) {
	var nodes = document.evaluate(
		"descendant-or-self::*[@data-lang or @*[contains(name(), 'data-lang-')]]",
		(target || document),
		null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	
	for (var i = 0, node; node = nodes.snapshotItem(i); i++) {
		var atts = document.evaluate(
			"@data-lang | @*[starts-with(name(), 'data-lang-')]",
			node,
			null,
			XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		
		for (var ii = 0, att, attn; att = atts.snapshotItem(ii); ii++) {
			if (att.name == "data-lang") {
				node.textContent = t(att.value);
				
			} else {
				node.setAttribute(att.name.substr(10), t(att.value));
			}
		}
	}
	
	return t;
}

function ce() {
	var a = arguments, e = document.createElement(a[0]), l = a.length;
	
	for (var i = 1, c = l + ~l % 2; i < c; i += 2) {
		e.setAttribute(a[i], a[i + 1]);
	}
	
	return ((!(l % 2) && a[l - 1].appendChild(e)) || e);
}

function q(s, t) {
	return Array.prototype.slice.call((t || document).querySelectorAll(s));
}

function tabSelect(id) {
	var tab = document.getElementById(id.replace("#", ""));
	
	if (tab) {
		var xpath = document.evaluate(
			"//div[@id='" + tab.id
			+ "']/ancestor-or-self::*[contains(concat(' ', @class, ' '), ' tab ')]/../div[contains(concat(' ', @class, ' '), ' tab ')]",
			document,
			null,
			XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		
		for (var i = 0, isDescendant  = false, el; el = xpath.snapshotItem(i); i++) {
			isDescendant = el.contains(tab);
			el.classList[((isDescendant)? "add" : "remove")]("tab-selected");
			
			if (el.id) {
				var nodes = document.querySelectorAll("a[href$=\"#" + CSS.escape(el.id) + "\"]" + ((isDescendant)? "" : ".tab-selected" ));
				
				for (var ii = 0, el2; el2 = nodes[ii]; ii++ ) {
					el2.classList[((isDescendant)? "add" : "remove")]("tab-selected");
				}
			}
		}
		
		return true;
	}
	
	return false;
}

function versionCompare(ver, vers) {
	if (Array.isArray(vers)) {
		if ((ver == "") || !vers.length || ((ver == "0") && (!vers[0] || (vers[0] == "0")))) {
			return 1;
		}
		
		for (var i = 0, l = vers.length, ver1, ver2; i < l; i +=2) {
			if ((ver == vers[i]) || (ver == vers[i + 1])) {
				return 1;
				
			} else if (versionCompare(ver, vers[i]) < 0) {
				return -1;
				
			} else if ((vers[i + 1] == "+") || !vers[i + 1]) {
				return 1;
			}
			
			if (versionCompare(ver, vers[i + 1]) <= 0) {
				return 1;
				
			} else if ((i + 2 == l)) {
				return -1;
			}
		}
		
		return 1;
		
	} else {
		var rx = /(\.0)+[^\.]*$/, sa = (ver + "").replace(rx, "").split("."), sb = (vers + "").replace(rx, "").split(".");
		
		for (var i = 0, l = Math.min(sa.length, sb.length), c; i < l; i++) {
			c = parseInt(sa[i], 10) - parseInt(sb[i], 10);
			
			if (c !== 0) {
				return c;
			}
		}
	
		return sa.length - sb.length;
	}
}

function getBrowserInfo() {
	var ua = navigator.userAgent;
	var t = (ua.match(/(chrome|gecko(?=\/))\/?\s*(\d[\S]+)/i) || []);
	var m = (ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d[\S]+)/i) || []); 
	var br = {name : "", version : "", engine : ("" + t[1]).toLowerCase(), engineVersion : t[2]};
	
	if (m[1] == "Chrome") {
		t = ua.match(/\b(OPR|vivaldi)\/(\d[\S]+)/i);
		
		if (t != null) {
			br.name = ((t[1] == "OPR")? "opera" : ("" + t[1]).toLowerCase());
			br.version = t[2];
			return br;
		}
		
	} else if (/trident/i.test(m[1])) { 
		br.name = "ie"
		br.version = ((/\brv[ :]+(\d[\S]+)/g.exec(ua) || [])[1] || "");
		return br;
	}
	
	m = ((m[2])? [m[1], m[2]]: [navigator.appName, navigator.appVersion, '-?']);
	t = ua.match(/version\/(\d[\S]+)/i);
	
	if (t != null) {
		m.splice(1, 1, t[1]);
	}
	
	br.name = ("" + m[0]).toLowerCase();
	br.version = m[1];
	
	return br;
}

var mlWatcher = new function() {
	var self = this, loaded = {}, timer = 0, callbacks = [], ids = [];
	
	var onLoaded = function(id) {
		if (id) {
			ids.push(id);
			clearTimeout(timer);
			timer = setTimeout(onLoaded, 20);
			return;
		}
		
		var i = ids.length;
		
		while (i--) {
			var ii = callbacks.length, idx = 0;
			
			while (ii--) {
				idx = callbacks[ii].indexOf(ids[i]);
				
				if (idx != -1) {
					callbacks[ii].splice(idx, 1);
					
					if (callbacks[ii].length == 1) {
						callbacks[ii][0]();
						callbacks.splice(ii, 1);
					}
				}
			}
		}
		
		ids.length = 0;
	}
	
	this.setItem = function(id, v) {
		loaded[id] = +v;
		onLoaded(id);
	}
	
	this.getItem = function(id) {
		return ((loaded[id] == undefined)? -1 : loaded[id]);
	}
	
	this.onItemsDone = function() {
		var args = [];
		
		for (var i = 0, l = arguments.length - 1; i < l; i++) {
			if (self.getItem(arguments[i]) == -1) {
				args.push(arguments[i]);
			} 
		}
		
		if (args.length) {
			callbacks.push([arguments[arguments.length - 1]].concat(args));
			
		} else {
			arguments[arguments.length - 1]();
		}
	}
	
	this.watchLoad = function(obj, id) {
		if (loaded[id] == undefined) {
			var watchLoad = function(ev) {
				obj.removeEventListener(ev.type, watchLoad, true);
				self.setItem(id, +(ev.type == "load" || ev.type == "DOMContentLoaded"));
			}
			loaded[t] = -1;
			
			if (obj instanceof HTMLDocument) {
				if ((obj.readyState != "interactive") && (obj.readyState != "complete")) {
					obj.addEventListener("DOMContentLoaded", watchLoad, true);
					
				} else {
					mlWatcher.setItem("DOMContentLoaded", 1);
				}
				
			} else if (obj instanceof Window || obj instanceof XMLHttpRequest || obj instanceof HTMLElement) {
				obj.addEventListener("load", watchLoad, true);
				!(obj instanceof Window) && obj.addEventListener("error", watchLoad, true);
			}
		}
		
		return obj;
	}
}

;(function() {
	var sx, sy, iss = false;
	document.addEventListener("click", function(ev) {
		if (ev.target.hash) {
			if (location.hash == ev.target.hash) {
				ev.preventDefault();
				
			} else {
				iss = true, sx = window.scrollX, sy = window.scrollY;
			}
		}
	}, true);
	window.addEventListener("hashchange", function(ev) {
		iss && window.scroll(sx, sy);
		iss = false;
		ev.preventDefault();
	}, true);
})();