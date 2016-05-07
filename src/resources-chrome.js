"use strict";

var PATHS_DEFAULT;


/*	[about:uri] = {
		browserName: "0: no support", "1: support", "version string to compare. Ex: 20.5", [Array of versions string to compare. Ex: ["25.4", "30.9", "35", "40"]]
		browserName + "Scheme": boolean // If the scheme part should be replaced. Ex: Replace "chrome://" to "vivaldi://"
		chromeIsDebug: boolean // Debugging purposes only URI. Need to paste the URL in the addressbar.
	}
	
	URLs are checked in this order : browserName > engineName.
*/
var INTERNAL_PAGES = {
	"chrome:about"										: {chrome: "0", opera: "1", vivaldi: "1", vivaldiScheme: true},
	"chrome:about/credits"								: {chrome: "0", opera: "1"},
	"chrome:about/eula"									: {chrome: "0", opera: "1"},
	"chrome:about/privacy"								: {chrome: "0", opera: "1"},
	"chrome:about/thanks"								: {chrome: "0", opera: "1"},
	"chrome:accessibility"								: null,
	"chrome:activity"									: {chrome: "0", opera: "1"},
	"chrome:app-list"									: {opera: "0"},
	"chrome:appcache-internals"							: null,
	"chrome:apps"										: {opera: "0"},
	"chrome:blob-internals"								: null,
	"chrome:bookmarks"									: {opera: "25"},
	"chrome:browserjs"									: {chrome: "0", opera: "1"},
	"chrome:cache"										: {opera: "0"},
	"chrome:chrome"										: {opera: "0"},
	"chrome:chrome-signin"								: {opera: "0"},
	"chrome:chrome-urls"								: {opera: "0"},
	"chrome:components"									: {opera: "0"},
	"chrome:conflicts"									: {opera: "0"},
	"chrome:copresence"									: {opera: "0"},
	"chrome:crashes"									: {opera: "0"},
	"chrome:credits"									: {opera: "0"},
	"chrome:device-log"									: {opera: "0"},
	"chrome:devices"									: {opera: "0"},
	"chrome:discards"									: {opera: "0"},
	"chrome:dns"										: {opera: "0"},
	"chrome:domain-reliability-internals"				: {opera: "0"},
	"chrome:downloads"									: null,
	"chrome:extensions"									: null,
	"chrome:extensions/packExtension"					: {chrome: "0", opera: "1"},
	"chrome:flags"										: null,
	"chrome:flash"										: {opera: "0"},
	"chrome:gcm-internals"								: {opera: "0"},
	"chrome:gpu"										: null,
	"chrome:help"										: {opera: "0"},
	"chrome:histograms"									: null,
	"chrome:history"									: null,
	"chrome:identity-internals"							: {opera: "0"},
	"chrome:indexeddb-internals"						: null,
	"chrome:inspect"									: null,
	"chrome:instant"									: {opera: "0"},
	"chrome:interstitials"								: {opera: "0"},
	"chrome:invalidations"								: {opera: "0"},
	"chrome:local-state"								: {opera: "0"},
	"chrome:media-internals"							: null,
	"chrome:memory"										: {opera: "0"},
	"chrome:memory-internals"							: {opera: "0"},
	"chrome:nacl"										: {vivaldi: "0", opera: "0"},
	"chrome:net-internals"								: {opera: "20"},
	"chrome:network-errors"								: null,
	"chrome:newtab"										: null,
	"chrome:omnibox"									: {opera: "0"},
	"chrome:password-manager-internals"					: {opera: "0"},
	"chrome:plugins"									: null,
	"chrome:policy"										: {opera: "0"},
	"chrome:predictors"									: {opera: "0"},
	"chrome:print"										: null,
	"chrome:profiler"									: null,
	"chrome:quota-internals"							: {opera: "0"},
	"chrome:remote-debug"								: {chrome: "0", opera: "1"},
	"chrome:serviceworker-internals"					: null,
	"chrome:settings"									: null,
	"chrome:settings/acceptlanguages"					: {opera: "19"},
	"chrome:settings/addressbar"						: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/all"								: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/appearance"						: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/autofill"							: null,
	"chrome:settings/bookmarks"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/clearBrowserData"					: null,
	"chrome:settings/configureCommands"					: {chrome: "0"},
	"chrome:settings/content"							: {opera: "0"},
	"chrome:settings/contentExceptions#cookies"			: null,
	"chrome:settings/contentExceptions#fullscreen"		: null,
	"chrome:settings/contentExceptions#images"			: null,
	"chrome:settings/contentExceptions#javascript"		: null,
	"chrome:settings/contentExceptions#keygen"			: null,
	"chrome:settings/contentExceptions#location"		: null,	
	"chrome:settings/contentExceptions#media-stream"	: {opera: "19"},
	"chrome:settings/contentExceptions#media-stream-camera": null,
	"chrome:settings/contentExceptions#media-stream-mic": null,
	"chrome:settings/contentExceptions#midi-sysex"		: null,
	"chrome:settings/contentExceptions#mouselock"		: null,
	"chrome:settings/contentExceptions#multiple-automatic-downloads": null,
	"chrome:settings/contentExceptions#notifications"	: null,
	"chrome:settings/contentExceptions#plugins"			: null,
	"chrome:settings/contentExceptions#popups"			: null,
	"chrome:settings/contentExceptions#ppapi-broker"	: null,
	"chrome:settings/contentExceptions#usb-devices"		: null,
	"chrome:settings/contentExceptions#zoomlevels"		: null,
	"chrome:settings/cookies"							: null,
	"chrome:settings/createProfile"						: {opera: "0"},
	"chrome:settings/downloads"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/editDictionary"					: null,
	"chrome:settings/fonts"								: {opera: "19"},
	"chrome:settings/handlers"							: null,
	"chrome:settings/importData"						: {opera: "26"},
	"chrome:settings/keyboard"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/languages"							: null,
	"chrome:settings/manageProfile"						: {opera: "0"},
	"chrome:settings/mouse"								: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/network"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/panel"								: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/passwords"							: null,
	"chrome:settings/privacy"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/qc"								: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/resetProfileSettings"				: {opera: "0"},
	"chrome:settings/search"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/searchEngines"						: null,
	"chrome:settings/start-page"						: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/startup"							: null,
	"chrome:settings/tabs"								: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:settings/webpages"							: {chrome: "0", vivaldi: "1", vivaldiScheme: true},
	"chrome:signin-internals"							: {opera: "0"},
	"chrome:startpage/news"								: {chrome: "0", opera: "1"},
	"chrome:suggestions"								: {opera: "0"},
	"chrome:sync-internals"								: null,
	"chrome:syncfs-internals"							: {opera: "0"},
	"chrome:system"										: {opera: "0"},
	"chrome:terms"										: {opera: "0"},
	"chrome:themes"										: {chrome: "0", opera: "1"},
	"chrome:thumbnails"									: {opera: "0"},
	"chrome:tracing"									: {opera: "19"},
	"chrome:translate-internals"						: {opera: "0"},
	"chrome:user-actions"								: {opera: "0"},
	"chrome:user-manager"								: {opera: "0"},
	"chrome:version"									: {opera: "0"},
	"chrome:view-http-cache"							: null,
	"chrome:webrtc-internals"							: null,
	"chrome:webrtc-logs"								: {opera: "0"},
	/*"chrome:profile-signin-confirmation"				: {opera: "0"},*/
	/*"chrome:make-metro"								: {opera: "0"},*/
	/*"chrome:sync-confirmation"						: {opera: "0"},*/
	"chrome:badcastcrash"								: {chromeIsDebug: true},
	"chrome:crash"										: {chromeIsDebug: true},
	"chrome:crashdump"									: {chromeIsDebug: true},
	"chrome:gpuclean"									: {chromeIsDebug: true},
	"chrome:gpucrash"									: {chromeIsDebug: true},
	"chrome:gpuhang"									: {chromeIsDebug: true},
	"chrome:hang"										: {chromeIsDebug: true},
	"chrome:inducebrowsercrashforrealz"					: {chromeIsDebug: true},
	"chrome:kill"										: {chromeIsDebug: true},
	"chrome:ppapiflashcrash"							: {chromeIsDebug: true},
	"chrome:ppapiflashhang"								: {chromeIsDebug: true},
	"chrome:quit"										: {chromeIsDebug: true, opera: "0", vivaldi: "0"},
	"chrome:restart"									: {chromeIsDebug: true, opera: "0", vivaldi: "0"},
	"chrome:shorthang"									: {chromeIsDebug: true}
}

switch (BROWSER_INFO.name.toLowerCase()) {
	case "opera":
		PATHS_DEFAULT = [
			"/chrome%3Abookmarks",
			"/#separator-01",
			"/chrome%3Adownloads",
			"/chrome%3Ahistory",
			"/chrome%3Asettings/",
			"/chrome%3Asettings/chrome%3Asettings"
		];

		Object.keys(INTERNAL_PAGES).some(function(v) {
			if (v.indexOf("chrome:settings/") === 0) {
				PATHS_DEFAULT.push("/chrome%3Asettings/" + encodeURIComponent(v));
			}
		});

		PATHS_DEFAULT.push(
			"/chrome%3Athemes",
			"/chrome%3Aextensions",
			"/chrome%3Aplugins"
		);

		PATHS_DEFAULT.push(
			"/More/",
			"/More/chrome%3Aactivity",
			"/More/chrome%3Aview-http-cache",
			"/More/chrome%3Agpu",
			"/More/chrome%3Asettings%2FimportData",
			"/#separator-02",
			"/chrome%3Aflags",
			"/chrome%3Asettings%2FclearBrowserData",
			"/#separator-03",
			"/chrome%3Aabout/",
			"/chrome%3Aabout/chrome%3Aabout"
		);

		Object.keys(INTERNAL_PAGES).forEach(function(v) {
			if (v.indexOf("chrome:about/") !== -1) {
				PATHS_DEFAULT.push("/chrome%3Aabout/" + encodeURIComponent(v));
			}
		});
		break;
	default :
		PATHS_DEFAULT = [
			"/chrome%3Ahistory",
			"/chrome%3Adownloads",
			"/chrome%3Abookmarks",
			"/#separator-01",
			"/chrome%3Asettings/",
			"/chrome%3Asettings/chrome%3Asettings"
		];

		Object.keys(INTERNAL_PAGES).some(function(v) {
			if (v.indexOf("chrome:settings/") === 0) {
				PATHS_DEFAULT.push("/chrome%3Asettings/" + encodeURIComponent(v));
			}
		});

		PATHS_DEFAULT.push(
			"/chrome%3Athemes",
			"/chrome%3Aextensions",
			"/chrome%3Aplugins"
		);

		PATHS_DEFAULT.push(
			"/More/",
			"/More/chrome%3Aview-http-cache",
			"/More/chrome%3Agpu",
			"/More/chrome%3Asettings%2FimportData",
			"/More/chrome%3Amemory",
			"/#separator-02",
			"/chrome%3Aflags",
			"/chrome%3Asettings%2FclearBrowserData",
			"/#separator-03",
			"/chrome%3Aabout/",
			"/chrome%3Aabout/chrome%3Ahelp",
			"/chrome%3Aabout/chrome%3Acredits",
			"/chrome%3Aabout/chrome%3Aterms",
			"/chrome%3Aabout/chrome%3Asystem",
			"/chrome%3Aabout/chrome%3Aversion"
		);
		break;
}