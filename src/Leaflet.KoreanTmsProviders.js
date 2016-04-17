
(function () {
	'use strict';

	L.Proj.CRS.TMS.Naver = new L.Proj.CRS.TMS(
			'EPSG:5179',
			'+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  			//[90112, 1192896, 1990673, 2761664],
  			[90112, 1192896, 614400, 1717184],
  			{
  				resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25]
  			}
   		);

	L.Proj.CRS.TMS.VWorld = new L.Proj.CRS.TMS(
			'EPSG:900913',
			'+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
  			//[-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  			//[-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  			[-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  			{
  				resolutions: [156543.0339, 78271.517, 39135.7585, 19567.8793, 9783.93965, 4891.96983, 2445.98492, 1222.99246, 611.49623, 305.748115, 152.874058, 76.437029, 38.2185145, 19.1092573, 9.55462865, 4.77731433, 2.38865717, 1.19432859, 0.5971643, 0.29858215, 0.14929108]
  				//resolutions: [156543.0339, 78271.517, 39135.7585, 19567.8793, 9783.93965, 2445.98492, 2445.98492, 1222.99246, 611.49623, 305.748115, 152.874058, 76.437029, 38.2185145, 19.1092573, 9.55462865, 4.77731433, 2.38865717, 1.19432859, 0.5971643, 0.29858215, 0.14929108]
  			}
   		);

	L.Proj.CRS.TMS.NgiiMap = new L.Proj.CRS.TMS(
			'EPSG:5179',
			'+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  			//[90112, 1192896, 1990673, 2761664],
  			//[-200000.0, -28024123.62 , 31824123.62, 4000000.0],
  			[-200000.0, -28024123.6 , 31824123.6, 4000000.0],
  			{
  			    // Level: 6 ~ 19
  				resolutions: [0,1,2,3,4,5, 1954.597389, 977.2986945, 488.6493473, 244.3246736, 122.1623368, 61.08116841, 30.5405842, 15.2702921, 7.635146051, 3.817573025, 1.908786513, 0.954393256, 0.477196628, 0.238598314]
  			}
   		);


	L.Proj.TileLayer.TMS.Provider = L.Proj.TileLayer.TMS.extend({
		initialize: function (arg, crs, options) {
			var providers = L.Proj.TileLayer.TMS.Provider.providers;
			var parts = arg.split('.');
			var providerName = parts[0];
			var variantName = parts[1];

			if (!providers[providerName]) {
				throw 'No such provider (' + providerName + ')';
			}

			var provider = {
				url: providers[providerName].url,
				crs: providers[providerName].crs,
				options: providers[providerName].options
			};

			// Just for NGII Map
			if (providerName == "NgiiMap") {
			    this.getTileUrl = function(tilePoint) {
                    var zoom = this._map.getZoom(),
                        gridHeight = Math.ceil(
                        (this.crs.projectedBounds[3] - this.crs.projectedBounds[1]) /
                        this._projectedTileSize(zoom));
                    var z = this._getZoomForUrl();

                    return L.Util.template(this._url, L.Util.extend({
                        s: this._getSubdomain(tilePoint),
                        z: z>9 ? z : "0"+z,  // padding 0
                        x: tilePoint.x,
                        y: gridHeight - tilePoint.y - 1
                    }, this.options));
                }
			}

			// overwrite values in provider from variant.
			if (variantName && 'variants' in providers[providerName]) {
				if (!(variantName in providers[providerName].variants)) {
					throw 'No such name in provider (' + variantName + ')';
				}
				var variant = providers[providerName].variants[variantName];
				provider = {
					url: variant.url || provider.url,
					crs: variant.crs || provider.crs,
					options: L.Util.extend({}, provider.options, variant.options)
				};
			} else if (typeof provider.url === 'function') {
				provider.url = provider.url(parts.splice(1).join('.'));
			}

			// replace attribution placeholders with their values from toplevel provider attribution,
			// recursively
			var attributionReplacer = function (attr) {
				if (attr.indexOf('{attribution.') === -1) {
					return attr;
				}
				return attr.replace(/\{attribution.(\w*)\}/,
					function (match, attributionName) {
						return attributionReplacer(providers[attributionName].options.attribution);
					}
				);
			};
			provider.options.attribution = attributionReplacer(provider.options.attribution);

			// Compute final options combining provider options with any user overrides
			var layerOpts = L.Util.extend({}, provider.options, options);
			L.Proj.TileLayer.TMS.prototype.initialize.call(this, provider.url, provider.crs, layerOpts);

		}
	});

	/**
	 * Definition of providers.
	 * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
	 */

	//jshint maxlen:220
	L.Proj.TileLayer.TMS.Provider.providers = {

		NaverMap: {
			url: 'http://onetile{s}.map.naver.net/get/29/0/0/{z}/{x}/{y}/bl_vc_bg/ol_vc_an',
			crs: L.Proj.CRS.TMS.Naver, 
			options: {
				maxZoom: 13, 
				minZoom: 0,
				zoomOffset: 1,
				subdomains: '1234',
				continuousWorld: true,
				attribution: 'Map data &copy; <a href="http://map.naver.com">NaverMap</a>'
			},
			variants: {
				Street: {},
				Satellite: {
					url: 'http://onetile{s}.map.naver.net/get/29/0/0/{z}/{x}/{y}/bl_st_bg/ol_st_an'
				}, 
				Cadastral: {
					url: 'http://onetile{s}.map.naver.net/get/29/0/0/{z}/{x}/{y}/bl_vc_bg/ol_lp_cn',
					options: {
						opacity: 0.75
					}
				},
				Hybrid: {
					url: 'http://onetile{s}.map.naver.net/get/29/0/0/{z}/{x}/{y}/bl_st_bg/ol_st_rd/ol_st_an'
				}

			}

		},		
		VWorld: {
			url: 'http://xdworld.vworld.kr:8080/2d/Base/201310/{z}/{x}/{y}.png',
			//crs: L.Proj.CRS.TMS.EPSG900913, //new Proj4js.Proj('EPSG:900913'),//
			crs: L.Proj.CRS.TMS.VWorld, 
			options: {
				maxZoom: 18, 
				minZoom: 6,
				tms: true, 
				subdomains: 'abc',
				continuousWorld: true,
				attribution: 'Map data &copy; <a href="http://map.vworld.kr">VWorld</a>'
			},
			variants: {
				Street: {},
				Satellite: {
					url: 'http://xdworld.vworld.kr:8080/2d/Satellite/201301/{z}/{x}/{y}.jpeg'
				},
				Hybrid: {
					url:  'http://xdworld.vworld.kr:8080/2d/Hybrid/201310/{z}/{x}/{y}.png'
				}

			}
		},
		NgiiMap: {
            url: 'http://emap.ngii.go.kr/proxy/proxyTile.jsp?URL=http://210.117.198.62:8081/korean_map_tile/L{z}/{x}/{y}.png',
			//url: 'http://localhost/base_map_tile/L{z}/{x}/{y}.png',
			crs: L.Proj.CRS.TMS.NgiiMap,
			options: {
				maxZoom: 19,
				minZoom: 6,
				zoomOffset: 0,
				subdomains: '1234',
				continuousWorld: true,
				attribution: '<a href="#" style="color: blue; font-family: Shanti, NanumGothic, \'Nanum Gothic\', Arial, sans-serif; text-decoration: none; font-weight: bold;"> 바로e맵 ⓒ2015</a>'
			},
			variants: {
				Normal: {},
				LowColor: {
					url: 'http://emap.ngii.go.kr/proxy/proxyTile.jsp?URL=http://210.117.198.63:8081/color_map_tile/L{z}/{x}/{y}.png'
				},
				White: {
					url: 'http://emap.ngii.go.kr/proxy/proxyTile.jsp?URL=http://210.117.198.61:80/white_map_tile/L{z}/{x}/{y}.png'
				},
				LowView: {
					url: 'http://emap.ngii.go.kr/proxy/proxyTile.jsp?URL=http://210.117.198.63:8081/lowV_map_tile/L{z}/{x}/{y}.png'
				},
				English: {
					url: 'http://emap.ngii.go.kr/proxy/proxyTile.jsp?URL=http://210.117.198.62:8081/english_map_tile/L{z}/{x}/{y}.png'
				}

			}
		}
	};

	
	L.Proj.TileLayer.TMS.provider = function (provider, crs, options) {
		return new L.Proj.TileLayer.TMS.Provider(provider, crs, options);
	};

	L.Control.Layers.Provided = L.Control.Layers.extend({
		initialize: function (base, overlay, options) {
			var first;

			var labelFormatter = function (label) {
				return label.replace(/\./g, ': ').replace(/([a-z])([A-Z])/g, '$1 $2');
			};

			if (base.length) {
				(function () {
					var out = {},
					    len = base.length,
					    i = 0;

					while (i < len) {
						if (typeof base[i] === 'string') {
							if (i === 0) {
								first = L.tileLayer.provider(base[0]);
								out[labelFormatter(base[i])] = first;
							} else {
								out[labelFormatter(base[i])] = L.tileLayer.provider(base[i]);
							}
						}
						i++;
					}
					base = out;
				}());
				this._first = first;
			}

			if (overlay && overlay.length) {
				(function () {
					var out = {},
					    len = overlay.length,
					    i = 0;

					while (i < len) {
						if (typeof base[i] === 'string') {
							out[labelFormatter(overlay[i])] = L.tileLayer.provider(overlay[i]);
						}
						i++;
					}
					overlay = out;
				}());
			}
			L.Control.Layers.prototype.initialize.call(this, base, overlay, options);
		},
		onAdd: function (map) {
			this._first.addTo(map);
			return L.Control.Layers.prototype.onAdd.call(this, map);
		}
	});
	

	L.control.layers.provided = function (baseLayers, overlays, options) {
		return new L.Control.Layers.Provided(baseLayers, overlays, options);
	};
	
}());

