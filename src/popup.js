"use strict";

var OPTS = {language: "auto"}, DEV = (location.search.indexOf("dev") > -1);
var PATHS_DEFAULT, INTERNAL_PAGES, PATHS = [], PATHS_REMOVED = [], BROWSER_INFO = getBrowserInfo();
var doc = document;

mlWatcher.watchLoad(doc, "DOMContentLoaded")
.head.appendChild(mlWatcher.watchLoad(ce("script", "src", "resources-" + BROWSER_INFO.engine + ".js"), "engine.js"));

chrome.storage.local.get(["opts", "paths", "pathsRemoved"], function(storageData) { 
	PATHS = storageData.paths || [], PATHS_REMOVED = storageData.pathsRemoved || [];
	
	storageData.opts && Object.keys(OPTS).forEach(function(key) {
		if (typeof storageData.opts[key] != "undefined") {
			OPTS[key] = storageData.opts[key];
		}
	});
	
	t.load("en", function() {
		t.load(OPTS.language, function() {
			mlWatcher.setItem("translation", 1);
		});
	});
	
	mlWatcher.onItemsDone("engine.js", function() {
		//Merge new default paths with saved ones
		for (var i = 0, l = PATHS_DEFAULT.length, pathsParent, idx; i < l; i++) {
			if ((PATHS.indexOf(PATHS_DEFAULT[i]) === -1) && (PATHS_REMOVED.indexOf(PATHS_DEFAULT[i]) === -1)) {
				pathsParent = PATHS_DEFAULT[i].match(/(.*\/)?[^/]+\/?$/);
				//Fix missing parent paths
				if (pathsParent) {
					idx = PATHS.indexOf(pathsParent[1]);
					
					if (idx === -1) {
						while (pathsParent) {
							if (idx === -1) {
								PATHS.splice(i, 0, pathsParent[1]);
							}
							
							pathsParent = pathsParent[1].match(/(.*\/)?[^/]+\/?$/);
							
							if (pathsParent) {
								idx = PATHS.indexOf(pathsParent[1]);
							}
						}
					}
				}
				
				PATHS.splice(i, 0, PATHS_DEFAULT[i]);
			}
		}
		
		if (!DEV) {
			//Filter non compatible version
			var ipsRemove = [];
			
			for (var a = Object.keys(INTERNAL_PAGES), i = a.length, ip; i--;) {
				ip = INTERNAL_PAGES[a[i]];
				
				if (ip) {
					var ipVer = ip[BROWSER_INFO.name], rem = false;
					
					if (ipVer !== undefined) {
						rem = ((ipVer === "0") || ((ipVer !== "1") && (versionCompare(BROWSER_INFO.version, ipVer) < 0)));
						
					} else if(ip[BROWSER_INFO.engine] !== undefined) {
						ipVer = ip[BROWSER_INFO.engine];
						rem = ((ipVer === "0") || ((ipVer !== "1") && (versionCompare(BROWSER_INFO.engineVersion, ipVer) < 0)));
					}
					
					if (rem) {
						ipsRemove.push(RegExp.escape(encodeURIComponent(a[i])));
						delete INTERNAL_PAGES[a[i]];
					}
				}
			}
			
			//Removes non compatible version from PATHS
			for (var i = ipsRemove.length && PATHS.length, rxp = RegExp("\\/(" + ipsRemove.join("|") + ")$"); i--;) {
				rxp.test(PATHS[i]) && PATHS.splice(i, 1);
			}
		}
		
		setTimeout(mlWatcher.setItem, 0, "storage", 1);
	});
	
});

mlWatcher.onItemsDone("translation", "storage", "DOMContentLoaded", function() {
	var ui = {
		"favorites"		: {done: false, ui: doc.getElementById("favorites")},
		"o-favorites"	: {done: false, ui: doc.getElementById("o-favorites")},
		"all-items"		: {done: false, ui: doc.getElementById("all-items")},
		"o-all-items"	: {done: false, ui: doc.getElementById("o-all-items")}
	};
	var eventActions 	= {
		"click.form.action": function(ev, type) {
			if (type == "reset") {
				chrome.storage.local.clear(location.reload.bind(location));
				
			} else if (type == "ip-edit-save") {
				var path = doc.body.getAttribute("data-path-edit");
				var pathNew = ipPathRename(
					path,
					doc.getElementById("o-item-edit-input").value.trim(),
					PATHS,
					PATHS_DEFAULT, 
					PATHS_REMOVED
				);
				
				if (pathNew) {
					var elT = ui["o-favorites"].ui.querySelector("[data-path=\"" + CSS.escape(path) + "\"]:not(.ip-group-active)");
					elT && elT.parentNode.replaceChild(uiItemCreate(ipPathToObject(pathNew)), elT);
					chrome.storage.local.set({"paths": PATHS, "pathsRemoved": PATHS_REMOVED});
				}
				
				doc.body.removeAttribute("data-path-edit");
				
			} else if (type == "ip-edit-close") {
				doc.body.removeAttribute("data-path-edit");
			}
		},
		"click.uiitem.click": function(ev, type, path) {
			if (type == "group") {
				uiItemsShow(ev.target.parentNode, path, PATHS);
				
			} else if (type == "item" && ev.button < 2 && !doc.body.classList.contains("onconfig")) {
				if (ev.target.classList.contains("ip-type-debug")) {
					var ta = ce("textarea", "style", "position: absolute; top: -1000px;", doc.documentElement);
					ta.textContent = ev.target.href;
					ta.select();
					doc.execCommand("copy");
					ta.parentNode.removeChild(ta);
					
				} else {
					if (!DEV) {
						chrome.tabs.create({"url": ev.target.href});
						
					} else {
						//DEV mode updates the next tab
						chrome.tabs.query({active: true}, function(tabs) {
							(tabs.length) && chrome.tabs.query({index: tabs[0].index + 1}, function(tabs) {
								if (tabs.length) {
									chrome.tabs.update(tabs[0].id, {"url": ev.target.href, active: true});
									
								} else {
									chrome.tabs.create({"url": ev.target.href});
								}
							});
						});
					}
				}
			}
			
			return true;
		},
		"change.language.switch": function(ev) {
			OPTS.language = ev.target.value;
			
			t.load(OPTS.language, function() {
				t.node(doc);
			});
			chrome.storage.local.set({"opts": OPTS});
		}
	}
	
	function ipPathRemove(path, paths, pathsDefault, pathsRemoved) {
		var idx = paths.indexOf(path);
		
		if (idx > -1) {
			if (path.indexOf("/", path.length - 1) > -1) {
				for (var i = paths.length; i--;) {
					if (paths[i].indexOf(path) === 0) {
						if ((pathsDefault.indexOf(paths[i]) > -1) && (pathsRemoved.indexOf(paths[i]) == -1)) {
							pathsRemoved.push(paths[i]);
						}
						
						paths.splice(i, 1);
					}
				}
				
			} else {
				if ((pathsDefault.indexOf(path) > -1) && (pathsRemoved.indexOf(path) == -1)) {
					pathsRemoved.push(path);
				}
				
				paths.splice(idx, 1);
			}
		}
	}

	function ipPathGetParent(path) {
		return ((path == "/")? "/" : (path.match(/(.*\/)?[^/]+\/?$/) || [])[1]);
	}

	function ipPathAdd(path, pathParent, pathTarget, isAfter, paths, pathsDefault, pathsRemoved) {
		var pathNew = pathParent + path.match(/[^/]+\/?$/)[0];
		
		if ((paths.indexOf(pathNew) === -1) && (paths.indexOf(pathParent) > -1)) {
			var idx = -1;
			
			if (pathTarget && (pathParent != pathTarget)) {
				idx = paths.indexOf(pathTarget);
			}
			
			if (idx == -1) {
				idx = paths.indexOf(pathParent);
				isAfter = true;
			}
			
			paths.splice(((isAfter)? idx + 1 : idx), 0, pathNew);
			
			if (pathsRemoved.indexOf(pathNew) > -1) {
				pathsRemoved.splice(pathsRemoved.indexOf(pathNew), 1);
			}
			
			return pathNew;
		}
		
		return "";
	}

	function ipPathMove(path, pathParent, pathTarget, isAfter, paths, pathsDefault, pathsRemoved) {
		if ((path != pathParent) && (paths.indexOf(path) > -1) && (paths.indexOf(pathParent) > -1)) {
			var pathToMove = pathParent + paths.splice(paths.indexOf(path), 1)[0].match(/[^/]+\/?$/)[0];
			var isNotToSame = ipPathGetParent(path) != pathParent;
			
			if (paths.indexOf(pathToMove) > -1) {
				pathToMove = paths.splice(paths.indexOf(pathToMove), 1)[0];
			}
			
			var idx = -1;
			
			if (pathTarget && (pathParent != pathTarget)) {
				idx = paths.indexOf(pathTarget);
			}
			
			if (idx == -1) {
				idx = paths.indexOf(pathParent);
				isAfter = true;
			}
			
			paths.splice(((isAfter)? idx + 1 : idx), 0, pathToMove);
			
			if (isNotToSame && (pathsDefault.indexOf(path) > -1) && (pathsRemoved.indexOf(path) == -1)) {
				pathsRemoved.push(path);
			}
			
			if (isNotToSame && path.indexOf("/", path.length - 1) > -1) {
				for (var i = paths.length; i--;) {
					if (paths[i].indexOf(path) === 0) {
						var pathNew = paths[i].replace(path, pathToMove);
						
						if (isNotToSame && (pathsDefault.indexOf(paths[i]) > -1) && (pathsRemoved.indexOf(paths[i]) == -1)) {
							pathsRemoved.push(paths[i]);
						}
						
						if (paths.indexOf(pathNew) > -1) {
							paths.splice(i, 1);
							
						} else {
							paths[i] = pathNew;
						}
					}
				}
			}
		}
	}

	function ipPathRename(path, pathNewName, paths, pathsDefault, pathsRemoved) {
		if (pathNewName && (path.indexOf("/", path.length - 1) > -1) && (paths.indexOf(path) > -1)) {
			var pathNew = ipPathGetParent(path) + "@" + encodeURIComponent(pathNewName) + "/";
			
			if (paths.indexOf(pathNew) === -1) {
				for (var i = paths.length; i--;) {
					if (paths[i].indexOf(path) === 0) {
						if ((pathsDefault.indexOf(paths[i]) > -1) && (pathsRemoved.indexOf(paths[i]) == -1)) {
							pathsRemoved.push(paths[i]);
						}
						
						paths[i] = paths[i].replace(path, pathNew);
					}
				}
				
				return pathNew;
			}
		}
		
		return "";
	}
	
	function ipPathToObject(path) {
		if (path == "/") {
			return {type: "group", name: "", path: "/", uri: ""};
		} else {
			var mp = path.match(/(.*\/)([^/]+)(\/)?$/), obj = null;
			
			if (mp) {
				var obj = {
					type: ((mp[3])? "group" : ((mp[2][0] == "#")? "separator" : "item")),
					name: mp[2],
					path: path
				};
				obj.uri = ((obj.type == "item")? decodeURIComponent(mp[2]) : "");
			}
			return obj;
		}
	}
	
	function uiItemCreate(ipItem) {
		var uiItem = ce("a", "class", "ip-item ip-type-" + ipItem.type, "data-path", ipItem.path, "draggable", "true");
		
		if (ipItem.type == "separator") {
			ce("div", "class", "ip-label", uiItem).textContent = ".".repeat(20);
			
		} else {
			var uiItemLabel = ce("div", "class", "ip-label", uiItem), uri = decodeURIComponent(ipItem.name);
			uiItem.setAttribute("data-evt-click", "uiitem.click|" + ipItem.type + "|" + ipItem.path);
			
			if ((ipItem.type == "group") && (ipItem.name[0] == "@")) {
				uiItemLabel.textContent = uri.substring(1);
				
			} else {
				uiItemLabel.setAttribute("data-lang", "about_" + uri.replace(/.+:/, "").replace(/\W/g, "_").toLowerCase());
			}
			
			if (ipItem.type == "item") {
				var isDebug = false, changeScheme = false;
				
				if (INTERNAL_PAGES[uri]) {
					if (INTERNAL_PAGES[uri][BROWSER_INFO.name + "IsDebug"] !== undefined) {
						isDebug = INTERNAL_PAGES[uri][BROWSER_INFO.name + "IsDebug"];
						
					} else if(INTERNAL_PAGES[uri][BROWSER_INFO.engine + "IsDebug"] !== undefined) {
						isDebug = INTERNAL_PAGES[uri][BROWSER_INFO.engine + "IsDebug"];
					}
					
					if (INTERNAL_PAGES[uri][BROWSER_INFO.name + "Scheme"] !== undefined) {
						changeScheme = INTERNAL_PAGES[uri][BROWSER_INFO.name + "Scheme"];
						
					} else if(INTERNAL_PAGES[uri][BROWSER_INFO.engine + "Scheme"] !== undefined) {
						changeScheme = INTERNAL_PAGES[uri][BROWSER_INFO.engine + "Scheme"];
					}
					
					isDebug && uiItem.classList.add("ip-type-debug");
				}
				
				//FIXME: test icon + change scheme working
				uiItem.href = ((changeScheme)? ipItem.uri.replace(/.+:/, BROWSER_INFO.name + "://") : ipItem.uri);
				uiItem.style.backgroundImage = "url(\"chrome://favicon/size/16/" + uri.replace(/.+:/g, "chrome:") + "\")";
				ce("div", "class", "ip-desc", uiItem).textContent = uiItem.href;
			}
		}
		
		return uiItem;
	}
	
	function uiItemsShow(target, path, paths) {
		var isRx = (path && path.constructor == RegExp);
		var rx = ((isRx)? path : RegExp("^" + RegExp.escape(path || "/") + "[^/]+/?$"));
		target.innerHTML = "";
		
		if (!isRx && (path != "/")) {
			var bItem = target.appendChild(uiItemCreate(ipPathToObject(ipPathGetParent(path))));
			var lb = bItem.querySelector(".ip-label");
			lb.textContent = "..";
			lb.removeAttribute("data-lang");
			bItem.classList.add("ip-group-active");
			bItem.removeAttribute("draggable");
		}
		
		for (var i = 0, l = paths.length; i < l; i++) {
			if (rx.test(paths[i])) {
				target.appendChild(uiItemCreate(ipPathToObject(paths[i])));
			}
		}
		
		target.setAttribute("data-path-current", ((isRx)? "/" : path));
		t.node(target);
		target.scrollTop = 0;
	}
	
	function uiToggleConfigMode(enable) {
		var evs = ["dragstart", "dragenter", "dragover", "dragleave", "drop", "dragend"], i = evs.length;
		handleDrag.path = "";
		handleDrag.isFavs = false;
		
		while (i--) {
			doc.body[(enable)? "addEventListener" : "removeEventListener"](evs[i], handleDrag, true);
		}
		
		doc.body.classList[enable? "add" : "remove"]("onconfig");
		
		if (enable && !ui["o-favorites"].done) {
			uiItemsShow(ui["o-favorites"].ui, "/", PATHS);
			uiItemsShow(
				ui["o-all-items"].ui,
				"/",
				["/Group/", "/#01"].concat(Object.keys(INTERNAL_PAGES).map(function(key) {
					return "/" + encodeURIComponent(key);
				}))
			);
			
			var ipg 				= ui["o-all-items"].ui.querySelector(".ip-type-group");
			ui["o-favorites"].done 	= true;
			ui["o-all-items"].done 	= true;
			ipg.removeAttribute("data-evt-click");
		}
	}
	
	function uiTabChange() {
		if (location.hash != "#options" && doc.body.classList.contains("onconfig")) {
			uiToggleConfigMode(false);
			
		} else if (location.hash == "#options" && !doc.body.classList.contains("onconfig")) {
			uiToggleConfigMode(true);
		}
		
		if (!location.hash || location.hash == "#favorites") {
			uiItemsShow(ui["favorites"].ui, "/", PATHS);
			
		} else if (location.hash == "#all-items" && !ui["all-items"].done) {
			uiItemsShow(ui["all-items"].ui, /.*/, Object.keys(INTERNAL_PAGES).map(function(key) {
				return "/" + encodeURIComponent(key);
			}));
			ui["all-items"].done = true;
		}
		
		tabSelect(location.hash || "#favorites");
	}
	
	function openGroupOnTimer(el) {
		openGroupOnTimer.timer && clearTimeout(openGroupOnTimer.timer);
		
		if (openGroupOnTimer.el) {
			openGroupOnTimer.el.classList.remove("ip-group-opening");
		}
		
		openGroupOnTimer.el = el;
		
		if (el) {
			el.classList.add("ip-group-opening");
			openGroupOnTimer.timer = setTimeout(function() {
				openGroupOnTimer(null)
				uiItemsShow(ui["o-favorites"].ui, el.getAttribute("data-path"), PATHS);
			}, 2000);
		}
	}
	
	function handleDrag(ev) {
		var et		= ev.target, me = handleDrag;
		me.path		= me.path || "";
		me.isFavs	= me.isFavs || false;
		
		if ("dragstart" == ev.type) {
			if ((et instanceof HTMLElement && et.draggable) && et.classList.contains("ip-item")) {
				ev.dataTransfer.effectAllowed = "all";
				me.path		= et.getAttribute("data-path");
				me.isFavs	= ui["o-favorites"].ui.contains(et);
				
				ev.dataTransfer.setDragImage(ce("img", "src", "data:image/svg+xml;charset=utf-8,"
					+ "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"300px\" height=\"30px\">"
					+ "<text x=\"10\" y=\"10\" style=\"font: menu; font-weight: bold; font-size: 12px;\">"
					+ et.querySelector(".ip-label").textContent
					+ "</text></svg>"), 0, 0);
				ev.dataTransfer.setData("text/plain", me.path);
				doc.body.classList.add("ondrag");
				me.isFavs && doc.body.classList.add("ondrag-favorites");
				me.isFavs && et.classList.contains("ip-type-group") && doc.body.classList.add("ondrag-favorites-group");
			}
			
		} else if (me.path) {
			if ("dragenter" == ev.type) {
				openGroupOnTimer((ui["o-favorites"].ui.contains(et) && et.classList.contains("ip-type-group")
				&& (et.getAttribute("data-path") != me.path))? et : null);
				
			} else if ("dragover" == ev.type) {
				ev.preventDefault();
				
				if ((et.id == "o-item-delete") || (et.id == "o-item-edit")) {
					ev.dataTransfer.dropEffect = "move";
					et.classList.add("drag-hover-up");
					
				} else {
					var isToFav = ui["o-favorites"].ui.contains(et);
					ev.dataTransfer.dropEffect = ((isToFav && me.isFavs)
						? "move"
						: ((isToFav && !me.isFavs)? "copy": "none")
					);
					
					if ((et == ui["o-favorites"].ui) || et.classList.contains("ip-group-active")) {
						var etL = ui["o-favorites"].ui.lastElementChild;
						etL && !etL.classList.contains("ip-group-active") && etL.classList.add("drag-hover-down");
						
					} else if (isToFav && et.classList.contains("ip-item")) {
						et.classList.remove("drag-hover-up", "drag-hover-down");
						et.classList.add("drag-hover-" + ((ev.offsetY / et.offsetHeight * 100 > 50)? "down" : "up"));
					}
				}
				
			} else if ("dragleave" == ev.type) {
				if ((et == ui["o-favorites"].ui) || et.classList.contains("ip-group-active")) {
					q(".drag-hover-up, .drag-hover-down", ui["o-favorites"].ui).forEach(function(el) {
						el.classList.remove("drag-hover-up", "drag-hover-down");
					});
					
				} else {
					et.classList.remove("drag-hover-up", "drag-hover-down");
				}
				
				;(openGroupOnTimer.el == et) && openGroupOnTimer(null);
			} else if (("drop" == ev.type) || ("dragend" == ev.type)) {
				if ("drop" == ev.type && et.getAttribute("data-path") != me.path) {
					ui["o-favorites"].ui.style.pointerEvents = "none";
					
					if (et.id == "o-item-delete") {
						var elT = ui["o-favorites"].ui.querySelector("[data-path=\"" + CSS.escape(me.path) + "\"]:not(.ip-group-active)");
						elT && elT.classList.add("remove-node");
						ipPathRemove(me.path, PATHS, PATHS_DEFAULT, PATHS_REMOVED);
						chrome.storage.local.set({"paths": PATHS, "pathsRemoved": PATHS_REMOVED});
						
					} else if (et.id == "o-item-edit") {
						var inp = doc.getElementById("o-item-edit-input");
						var val = me.path.match(/\/([^\/]+)\/$/)[1];
						inp.value = ((val[0] == "@")
							? decodeURIComponent(val.substring(1))
							: t("about_" + decodeURIComponent(val).replace(/.+:/, "").replace(/\W/g, "_").toLowerCase())
						);
						doc.body.setAttribute("data-path-edit", me.path);
						inp.focus();
						
					} else {
						var isMove		= doc.body.classList.contains("ondrag-favorites");
						var isAfter		= true;
						var ipSource	= ipPathToObject(me.path);
						var pathCurrent	= (ui["o-favorites"].ui.getAttribute("data-path-current") || "/");
						var pathNew		= pathCurrent + ((!isMove && (ipSource.type == "separator"))
							? "#separator-" + Math.random().toString(36).substr(2)
							: ipSource.name + ((ipSource.type == "group")? "/" : "")
						);
						
						if ((isMove && (me.path == pathNew)) || PATHS.indexOf(pathNew) === -1) {
							if (isMove) {
								var elRemove = ui["o-favorites"].ui
								.querySelector("[data-path=\"" + CSS.escape(me.path) + "\"]:not(.ip-group-active)");
								
								elRemove && elRemove.classList.add("remove-node");
							}
							
							var elTarget	= doc.querySelector("#o-favorites .drag-hover-up, #o-favorites .drag-hover-down");
							var pathTarget	= elTarget && elTarget.getAttribute("data-path");
							var uiItem		= uiItemCreate(ipPathToObject(pathNew));
							uiItem.classList.add("anime-node");
							t.node(uiItem);
							
							if (!elTarget) {
								ui["o-favorites"].ui.appendChild(uiItem);
								
							} else {
								isAfter = !elTarget.classList.contains("drag-hover-up");
								ui["o-favorites"].ui.insertBefore(uiItem, ((isAfter)? elTarget.nextElementSibling : elTarget));
							}
							
							if (isMove) {
								ipPathMove(
									me.path,
									pathCurrent,
									pathTarget || "", ((pathTarget)? isAfter : true),
									PATHS,
									PATHS_DEFAULT, PATHS_REMOVED
								);
								
							} else {
								ipPathAdd(
									pathNew,
									pathCurrent,
									pathTarget || "", ((pathTarget)? isAfter : true),
									PATHS,
									PATHS_DEFAULT, PATHS_REMOVED
								);
							}
							
							chrome.storage.local.set({"paths": PATHS, "pathsRemoved": PATHS_REMOVED});
						}
					}
				}
				
				if (("drop" == ev.type) || (("dragend" == ev.type) && (ev.dataTransfer.dropEffect == "none"))) {
					me.path = "";
					me.isFavs = false;
					
					openGroupOnTimer(null);
					setTimeout(function() {
						ui["o-favorites"].ui.style.pointerEvents = "";
					}, 500);
					
					q(".drag-hover-up, .drag-hover-down").forEach(function(el){
						el.classList.remove("drag-hover-up", "drag-hover-down");
					});
					
					doc.body.classList.remove("ondrag", "ondrag-favorites", "ondrag-favorites-group");
				}
			} 
		}
	}
	
	function handleEvents(ev) {
		var action = ev.target.getAttribute("data-evt-" + ev.type);
		
		if (action) {
			var params = action.split("|");
			var fnc = eventActions[ev.type + "." + params[0]];
			
			if (fnc) {
				params[0] = ev;
				
				if (fnc.apply(fnc, params)) {
					ev.preventDefault();
				}
			}
		}
	}
	
	doc.body.addEventListener("animationend", function(ev) {
		if (ev.animationName == "anime-node") {
			ev.target.classList.remove("anime-node");
			ev.target.classList.contains("remove-node") && ev.target.remove();
		}
	}, false);
	
	t.availableLanguages.sort().forEach(function(key) {
		this.options.add(new Option(key.replace("_", "-").toUpperCase(), key));
	}, doc.getElementById("select-language"));
	
	Object.keys(OPTS).forEach(function(key) {
		q("input[name='" + key + "'], select[name='" + key + "']").forEach(function(el) {
			if (el.getAttribute("type") == "radio" ) {
				el.checked = (el.value == OPTS[key]);
			} else {
				el.checked = OPTS[key];
				el.value = OPTS[key];
			}
		});
	});
	
	doc.getElementById("about-version").textContent = chrome.runtime.getManifest().version;
	doc.querySelector("#header .logo-text h1").textContent = BROWSER_INFO.name;
	doc.styleSheets[0].insertRule(
		".fa { font-family: FontAwesome, " + window.getComputedStyle(doc.documentElement).fontFamily + "; }",
		doc.styleSheets[0].cssRules.length
	);
	
	t.node(doc);
	uiTabChange();
	
	for (
		var a = Object.keys(eventActions), i = a.length;
		i--;
		doc.body.addEventListener(a[i].substring(0, a[i].indexOf(".")), handleEvents, true)
	);
	
	window.addEventListener("hashchange", function(ev) {
		ev.preventDefault();
		uiTabChange();
	}, true);
});