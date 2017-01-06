/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("Dimension.js");

if (!Mozilla) var Mozilla = {"name": "Mozilla", "edges": []};

var pastWeek = {"gt": {"build.date": Date.today().subtract(Duration.MONTH).unix()}};

Dimension.addEdges(false, Mozilla, [{
	"name": "Builds", "index": "jobs", "edges": [
		{
			"name": "Branch",
			"field": "build.branch",
				"partitions": [
				{"name": "Try", "value": "try", "ordering": 0, "esfilter": {"term": {"build.branch": "try"}}},
				{"name": "Inbound", "value": "mozilla-inbound", "ordering": 0, "esfilter": {"term": {"build.branch": "mozilla-inbound"}}},
				{"name": "Central", "value": "mozilla-central", "ordering": 0, "esfilter": {"term": {"build.branch": "mozilla-central"}}},
				{"name": "Autoland", "value": "autoland", "ordering": 0, "esfilter": {"term": {"build.branch": "autoland"}}}
			]
		},
		{
			"name": "Type",
			"field": "build.type",
			"partitions": [
				{
					"name": "OPT",
					"ordering": 2,
					"style": {"color": "#f9cb9c"},
					"value": "opt",
					"esfilter": {
						"or": [
							{"term": {"build.type": "opt"}},
							{"and":[
								{"prefix": {"build.platform": "android"}},
								{"missing": "build.type"}
							]}
						]
					}
				},
				{"name": "Standard", "ordering": 0, "esfilter": {"missing": "build.type"}},
				{"name": "PGO", "ordering": 1, "style": {"color": "#f9cb9c"}, "value": "pgo", "esfilter": {"term": {"build.type": "pgo"}}},
				{"name": "Debug", "ordering": 3, "style": {"color": "#f6b26b"}, "value": "debug", "esfilter": {"term": {"build.type": "debug"}}}
			]
		},
		{"name": "Product", "field": "build.product",
			"partitions": [
				{
					"name": "Firefox",
					"style": {"color": "#de4815"},
					"value": "firefox",
					"esfilter": {"or":[
						{"term": {"build.product": "firefox"}},
						{"missing": "build.product"}
					]}
				}
			]
		},
		{
			"name": "BB_Platform",
			"field": "build.platform",

			"partitions": [
				{
					"name": "Android",
					"style": {"color": "#de4815"},
					"value": "android",
					"esfilter": {
						"and": [
							{"prefix": {"build.platform": "android"}},
							{
								"or": [
									{"term": {"build.product": "mobile"}},
									{"missing": "build.product"}
								]
							}
						]
					}
				},
				{
					"name": "Linux32", "style": {"color": "#de4815"}, "value": "linux32", "esfilter": {
					"and": [
						{"term": {"build.platform": "linux32"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Linux64", "style": {"color": "#de4815"}, "value": "linux64", "esfilter": {
					"and": [
						{"term": {"build.platform": "linux64"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "OSX64", "style": {"color": "#a4c739"}, "value": "macosx64", "esfilter": {
					"and": [
						{"term": {"build.platform": "macosx64"}},
						{"term": {"build.product": "firefox"}}
					]
				}

				},
				{
					"name": "WINNT 5.2", "style": {"color": "#de4815"}, "value": "win5", "esfilter": {
					"and": [
						{"prefix": {"build.name": "WINNT 5.2"}},
						{"term": {"build.product": "firefox"}}
					]
				}

				},
				{
					"name": "WINNT 6.1 x86-64", "style": {"color": "#de4815"}, "value": "win6", "esfilter": {
					"and": [
						{"prefix": {"build.name": "WINNT 6.1 x86-64"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows XP 32-bit", "style": {"color": "#de4815"}, "value": "winxp", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows XP 32-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows 7 32-bit", "style": {"color": "#de4815"}, "value": "win732", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows 7 32-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows 7 VM 32-bit", "style": {"color": "#de4815"}, "value": "win732vm", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows 7 VM 32-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows 7 VM-GFX 32-bit", "style": {"color": "#de4815"}, "value": "win732gfx", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows 7 VM-GFX 32-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows 8 64-bit", "style": {"color": "#de4815"}, "value": "win864", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows 8 64-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				},
				{
					"name": "Windows 10 64-bit", "style": {"color": "#de4815"}, "value": "win1064", "esfilter": {
					"and": [
						{"prefix": {"build.name": "Windows 10 64-bit"}},
						{"term": {"build.product": "firefox"}}
					]
				}
				}
			],
			"esfilter": {"not": {"contains": {"run.key": "br-haz"}}}
		},
		//{
		//	"name": "Platform",
		//	"field": "build.platform",
        //
		//	"partitions": [
		//		{"name": "Linux32", "style": {"color": "#de4815"}, "value": "linux32", "esfilter": {"term": {"build.platform": "linux32"}}},
		//		{"name": "Linux64", "style": {"color": "#de4815"}, "value": "linux64", "esfilter": {"term": {"build.platform": "linux64"}}},
		//		{"name": "OSX64", "style": {"color": "#a4c739"}, "value": "macosx64", "esfilter": {"term": {"build.platform": "macosx64"}}},
		//		{"name": "win32", "style": {"color": "#de4815"}, "value": "win32", "esfilter": {"term": {"build.platform": "win32"}}},
		//		{"name": "win64", "style": {"color": "#de4815"}, "value": "win64", "esfilter": {"term": {"build.platform": "win64"}}}
		//	],
		//	"esfilter": {"not": {"contains": {"run.key": "br-haz"}}}
		//},
		{
			"name": "TC_Platform",
			"field": "build.platform",
			"partitions": [
				{"name": "android 4.0", "style": {"color": "#de4815"}, "value": "android40", "esfilter": {"term": {"build.platform": "android-4-0-armv7-api15"}}},
				{"name": "android 4.3", "style": {"color": "#de4815"}, "value": "android43", "esfilter": {"term": {"build.platform": "android-4-3-armv7-api15"}}},
				{"name": "Linux32", "style": {"color": "#de4815"}, "value": "linux32", "esfilter": {"term": {"build.platform": "linux32"}}},
				{"name": "Linux64", "style": {"color": "#de4815"}, "value": "linux64", "esfilter": {"term": {"build.platform": "linux64"}}},
				//{"name": "OSX 10.10", "style": {"color": "#a4c739"}, "value": "macos1010", "esfilter": {"term": {"build.platform": "osx-10-10"}}},
				{"name": "OSX 10.7", "style": {"color": "#a4c739"}, "value": "macos107", "esfilter": {"term": {"build.platform": "osx-10-7"}}},
				{"name": "Windows32", "style": {"color": "#136bab"}, "value": "win32", "esfilter": {"term": {"build.platform": "win32"}}},
				{"name": "Windows64", "style": {"color": "#136bab"}, "value": "win64", "esfilter": {"term": {"build.platform": "win64"}}},
				{"name": "windowsxp", "style": {"color": "#136bab"}, "value": "winxp", "esfilter": {"term": {"build.platform": "windowsxp"}}},
				{"name": "windows7-32", "style": {"color": "#136bab"}, "value": "win732", "esfilter": {"term": {"build.platform": "windows7-32"}}},
				{"name": "windows7-32-vm", "style": {"color": "#136bab"}, "value": "win732vn", "esfilter": {"term": {"build.platform": "windows7-32-vm"}}},
				{"name": "windows8-64", "style": {"color": "#136bab"}, "value": "win864", "esfilter": {"term": {"build.platform":"windows8-64" }}},
				{"name": "windows10-64", "style": {"color": "#136bab"}, "value": "win1064", "esfilter": {"term": {"build.platform": "windows10-64"}}},
				{"name": "windows10-64-vm", "style": {"color": "#136bab"}, "value": "win1064vm", "esfilter": {"term": {"build.platform": "windows10-64-vm"}}},
				{"name": "windows2012-32", "style": {"color": "#136bab"}, "value": "win1232", "esfilter": {"in": {"build.platform": ["windows-2012-32", "windows2012-32"]}}},
				{"name": "windows2012-64", "style": {"color": "#136bab"}, "value": "win2164", "esfilter": {"term": {"build.platform":"windows2012-64" }}}
			],
			"esfilter": {"not": {"contains": {"run.key": "br-haz"}}}
		},
		{"name": "Product", "field": "build.product",
			"partitions": [
				{"name": "Firefox", "style": {"color": "#de4815"}, "value": "firefox", "esfilter": {"term": {"build.product": "firefox"}}}
			]
		},
		{
			"name": "Test",
			"field": "run.suite",
			"partitions": [
				{"name": "androidx86-set", "value": "androidx86-set", "esfilter": {"term": {"run.suite": "androidx86-set"}}},
				{"name": "chromez", "value": "chromez", "esfilter": {"term": {"run.suite": "chromez"}}},
				{"name": "chromez-osx", "value": "chromez-osx", "esfilter": {"term": {"run.suite": "chromez-osx"}}},
				{"name": "cpp_gtest", "value": "cpp_gtest", "esfilter": {"term": {"run.suite": "cpp_gtest"}}},
				{"name": "cppunit", "value": "cppunit", "esfilter": {"term": {"run.suite": "cppunit"}}},
				{"name": "crashtest", "value": "crashtest", "esfilter": {"term": {"run.suite": "crashtest"}}},
				{"name": "dromaeojs", "value": "dromaeojs", "esfilter": {"term": {"run.suite": "dromaeojs"}}},
				{"name": "g1", "value": "g1", "esfilter": {"term": {"run.suite": "g1"}}},
				{"name": "g2", "value": "g2", "esfilter": {"term": {"run.suite": "g2"}}},
				{"name": "g2-osx", "value": "g2-osx", "esfilter": {"term": {"run.suite": "g2-osx"}}},
				{"name": "g3", "value": "g3", "esfilter": {"term": {"run.suite": "g3"}}},
				{"name": "g4", "value": "g4", "esfilter": {"term": {"run.suite": "g4"}}},
				{"name": "gaia-build-unit", "value": "gaia-build-unit", "esfilter": {"term": {"run.suite": "gaia-build-unit"}}},
				{"name": "gaia-integration", "value": "gaia-integration", "esfilter": {"term": {"run.suite": "gaia-integration"}}},
				{"name": "gaia-js-integration", "value": "gaia-js-integration", "esfilter": {"term": {"run.suite": "gaia-js-integration"}}},
				{"name": "gaia-linter", "value": "gaia-linter", "esfilter": {"term": {"run.suite": "gaia-linter"}}},
				{"name": "gaia-unit", "value": "gaia-unit", "esfilter": {"term": {"run.suite": "gaia-unit"}}},
				{"name": "gtest", "value": "gtest", "esfilter": {"term": {"run.suite": "gtest"}}},
				{"name": "jittest", "value": "jittest", "esfilter": {"term": {"run.suite": "jittest"}}},
				{"name": "jsreftest", "value": "jsreftest", "esfilter": {"term": {"run.suite": "jsreftest"}}},
				{"name": "luciddream", "value": "luciddream", "esfilter": {"term": {"run.suite": "luciddream"}}},
				{"name": "marionette", "value": "marionette", "esfilter": {"term": {"run.suite": "marionette"}}},
				{"name": "marionette-webapi", "value": "marionette-webapi", "esfilter": {"term": {"run.suite": "marionette-webapi"}}},
				{"name": "media-tests", "value": "media-tests", "esfilter": {"term": {"run.suite": "media-tests"}}},
				{"name": "media-youtube-tests", "value": "media-youtube-tests", "esfilter": {"term": {"run.suite": "media-youtube-tests"}}},
				{"name": "mochitest", "value": "mochitest", "esfilter": {"term": {"run.suite": "mochitest"}}},
				{"name": "mochitest-a11y", "value": "mochitest-a11y", "esfilter": {"term": {"run.suite": "mochitest-a11y"}}},
				{"name": "mochitest-browser-chrome", "value": "mochitest-browser-chrome", "esfilter": {"term": {"run.suite": "mochitest-browser-chrome"}}},
				{"name": "mochitest-browser-screenshots", "value": "mochitest-browser-screenshots", "esfilter": {"term": {"run.suite": "mochitest-browser-screenshots"}}},
				{"name": "mochitest-chrome", "value": "mochitest-chrome", "esfilter": {"term": {"run.suite": "mochitest-chrome"}}},
				{"name": "mochitest-clipboard", "value": "mochitest-clipboard", "esfilter": {"term": {"run.suite": "mochitest-clipboard"}}},
				{"name": "mochitest-debug", "value": "mochitest-debug", "esfilter": {"term": {"run.suite": "mochitest-debug"}}},
				{"name": "mochitest-devtools-chrome", "value": "mochitest-devtools-chrome", "esfilter": {"term": {"run.suite": "mochitest-devtools-chrome"}}},
				{"name": "mochitest-gl", "value": "mochitest-gl", "esfilter": {"term": {"run.suite": "mochitest-gl"}}},
				{"name": "mochitest-gpu", "value": "mochitest-gpu", "esfilter": {"term": {"run.suite": "mochitest-gpu"}}},
				{"name": "mochitest-jetpack", "value": "mochitest-jetpack", "esfilter": {"term": {"run.suite": "mochitest-jetpack"}}},
				{"name": "mochitest-media", "value": "mochitest-media", "esfilter": {"term": {"run.suite": "mochitest-media"}}},
				{"name": "mochitest-oop", "value": "mochitest-oop", "esfilter": {"term": {"run.suite": "mochitest-oop"}}},
				{"name": "mochitest-other", "value": "mochitest-other", "esfilter": {"term": {"run.suite": "mochitest-other"}}},
				{"name": "mochitest-push", "value": "mochitest-push", "esfilter": {"term": {"run.suite": "mochitest-push"}}},
				{"name": "mozbase", "value": "mozbase", "esfilter": {"term": {"run.suite": "mozbase"}}},
				{"name": "mozmill", "value": "mozmill", "esfilter": {"term": {"run.suite": "mozmill"}}},
				{"name": "other", "value": "other", "esfilter": {"term": {"run.suite": "other"}}},
				{"name": "other-osx", "value": "other-osx", "esfilter": {"term": {"run.suite": "other-osx"}}},
				{"name": "other_l64", "value": "other_l64", "esfilter": {"term": {"run.suite": "other_l64"}}},
				{"name": "other_nol64", "value": "other_nol64", "esfilter": {"term": {"run.suite": "other_nol64"}}},
				{"name": "plain-reftest", "value": "plain-reftest", "esfilter": {"term": {"run.suite": "plain-reftest"}}},
				{"name": "reftest", "value": "reftest", "esfilter": {"term": {"run.suite": "reftest"}}},
				{"name": "reftest-no-accel", "value": "reftest-no-accel", "esfilter": {"term": {"run.suite": "reftest-no-accel"}}},
				{"name": "reftest-sanity-oop", "value": "reftest-sanity-oop", "esfilter": {"term": {"run.suite": "reftest-sanity-oop"}}},
				{"name": "remote-tp4m_nochrome", "value": "remote-tp4m_nochrome", "esfilter": {"term": {"run.suite": "remote-tp4m_nochrome"}}},
				{"name": "remote-trobocheck2", "value": "remote-trobocheck2", "esfilter": {"term": {"run.suite": "remote-trobocheck2"}}},
				{"name": "remote-tsvgx", "value": "remote-tsvgx", "esfilter": {"term": {"run.suite": "remote-tsvgx"}}},
				{"name": "robocop", "value": "robocop", "esfilter": {"term": {"run.suite": "robocop"}}},
				{"name": "svgr", "value": "svgr", "esfilter": {"term": {"run.suite": "svgr"}}},
				{"name": "svgr-osx", "value": "svgr-osx", "esfilter": {"term": {"run.suite": "svgr-osx"}}},
				{"name": "tp5o", "value": "tp5o", "esfilter": {"term": {"run.suite": "tp5o"}}},
				{"name": "tp5o-osx", "value": "tp5o-osx", "esfilter": {"term": {"run.suite": "tp5o-osx"}}},
				{"name": "web-platform-tests", "value": "web-platform-tests", "esfilter": {"term": {"run.suite": "web-platform-tests"}}},
				{"name": "web-platform-tests-reftests", "value": "web-platform-tests-reftests", "esfilter": {"term": {"run.suite": "web-platform-tests-reftests"}}},
				{"name": "webapprt-chrome", "value": "webapprt-chrome", "esfilter": {"term": {"run.suite": "webapprt-chrome"}}},
				{"name": "xpcshell", "value": "xpcshell", "esfilter": {"term": {"run.suite": "xpcshell"}}},
				{"name": "xperf", "value": "xperf", "esfilter": {"term": {"run.suite": "xperf"}}}
			],
			"esfilter": {"not": {"contains": {"run.key": "br-haz"}}}
		},

		{
			"name": "TC_Test",
			"partitions": [
				{"name": "cppunittest", "value": "cppunittest", "esfilter": {"term": {"run.suite.fullname": "cppunittest"}}},
				{"name": "crashtest", "value": "crashtest", "esfilter": {"term": {"run.suite.fullname": "crashtest"}}},
				{"name": "external-media-tests", "value": "external-media-tests", "esfilter": {"term": {"run.suite.fullname": "external-media-tests"}}},
				{"name": "firefox-ui-functional local", "value": "firefox-ui-functional local", "esfilter": {"term": {"run.suite.fullname": "firefox-ui-functional local"}}},
				{"name": "firefox-ui-functional remote", "value": "firefox-ui-functional remote", "esfilter": {"term": {"run.suite.fullname": "firefox-ui-functional remote"}}},
				{"name": "gtest", "value": "gtest", "esfilter": {"term": {"run.suite.fullname": "gtest"}}},
				{"name": "jittest", "value": "jittest", "esfilter": {"term": {"run.suite.fullname": "jittest"}}},
				{"name": "marionette", "value": "marionette", "esfilter": {"term": {"run.suite.fullname": "marionette"}}},
				{"name": "mochitest-a11y", "value": "mochitest-a11y", "esfilter": {"term": {"run.suite.fullname": "mochitest-a11y"}}},
				{"name": "mochitest-browser-chrome", "value": "mochitest-browser-chrome", "esfilter": {"term": {"run.suite.fullname": "mochitest-browser-chrome"}}},
				{"name": "mochitest-chrome", "value": "mochitest-chrome", "esfilter": {"term": {"run.suite.fullname": "mochitest-chrome"}}},
				{"name": "mochitest-devtools-chrome", "value": "mochitest-devtools-chrome", "esfilter": {"term": {"run.suite.fullname": "mochitest-devtools-chrome"}}},
				{"name": "mochitest-gl", "value": "mochitest-gl", "esfilter": {"term": {"run.suite.fullname": "mochitest-gl"}}},
				{"name": "mochitest-jetpack-package", "value": "mochitest-jetpack-package", "esfilter": {"term": {"run.suite.fullname": "mochitest-jetpack-package"}}},
				{"name": "mochitest-media", "value": "mochitest-media", "esfilter": {"term": {"run.suite.fullname": "mochitest-media"}}},
				{"name": "mochitest-plain", "value": "mochitest-plain", "esfilter": {"term": {"run.suite.fullname": "mochitest-plain"}}},
				{"name": "mochitest-plain-clipboard", "value": "mochitest-plain-clipboard", "esfilter": {"term": {"run.suite.fullname": "mochitest-plain-clipboard"}}},
				{"name": "mochitest-plain-clipboard,chrome-clipboard,browser-chrome-clipboard,jetpack-package-clipboard", "value": "mochitest-plain-clipboard,chrome-clipboard,browser-chrome-clipboard,jetpack-package-clipboard", "esfilter": {"term": {"run.suite.fullname": "mochitest-plain-clipboard,chrome-clipboard,browser-chrome-clipboard,jetpack-package-clipboard"}}},
				{"name": "mochitest-plain-gpu", "value": "mochitest-plain-gpu", "esfilter": {"term": {"run.suite.fullname": "mochitest-plain-gpu"}}},
				{"name": "mochitest-plain-gpu,chrome-gpu,browser-chrome-gpu", "value": "mochitest-plain-gpu,chrome-gpu,browser-chrome-gpu", "esfilter": {"term": {"run.suite.fullname": "mochitest-plain-gpu,chrome-gpu,browser-chrome-gpu"}}},
				{"name": "reftest", "value": "reftest", "esfilter": {"term": {"run.suite.fullname": "reftest"}}},
				{"name": "reftest-crashtest", "value": "reftest-crashtest", "esfilter": {"term": {"run.suite.fullname": "reftest-crashtest"}}},
				{"name": "reftest-jsreftest", "value": "reftest-jsreftest", "esfilter": {"term": {"run.suite.fullname": "reftest-jsreftest"}}},
				{"name": "reftest-no-accel", "value": "reftest-no-accel", "esfilter": {"term": {"run.suite.fullname": "reftest-no-accel"}}},
				{"name": "reftest-stylo", "value": "reftest-stylo", "esfilter": {"term": {"run.suite.fullname": "reftest-stylo"}}},
				{"name": "robocop", "value": "robocop", "esfilter": {"term": {"run.suite.fullname": "robocop"}}},
				{"name": "web-platform-tests", "value": "web-platform-tests", "esfilter": {"term": {"run.suite.fullname": "web-platform-tests"}}},
				{"name": "web-platform-tests-reftests", "value": "web-platform-tests-reftests", "esfilter": {"term": {"run.suite.fullname": "web-platform-tests-reftests"}}},
				{"name": "web-platform-tests-wdspec", "value": "web-platform-tests-wdspec", "esfilter": {"term": {"run.suite.fullname": "web-platform-tests-wdspec"}}},
				{"name": "xpcshell", "value": "xpcshell", "esfilter": {"term": {"run.suite.fullname": "xpcshell"}}}
			]
		}



	]
}]);


