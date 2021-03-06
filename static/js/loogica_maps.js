define('loogica', ["domReady!", "jquery", "underscore",
         "backbone", "gmaps", "marker",
         "infobox"], function(doc, $, _, Backbone, google,
                              marker, infobox) {

    Region = Backbone.Model.extend({});

    RegioView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'render');
            _.bindAll(this, 'render_polygon');
            _.bindAll(this, 'fill_region');
            _.bindAll(this, 'show_name');
            this.model.bind('change', this.render);
            this.model.bind('fill_region', this.fill_region);
        },
        render: function() {
            var bounds = new google.maps.LatLngBounds();
            var polygons = this.model.get('polygons');

            this.model.gmaps_polygons = [];

            // If polygons is null we must create an dummy
            // polygon object with the coordinates in this
            // object root
            if (polygons == null) {
                polygons = [{coordinates: this.model.get('coordinates')}];
            }

            var self = this;
            _.each(polygons, function(polygon) {
                var gmap_polygon = self.render_polygon(polygon, bounds);
                self.model.gmaps_polygons.push(gmap_polygon);
            });

            this.model.bounds = bounds;
        },
        show_name: function() {
            var point_fix = this.model.get('name').length * 3;
            var marker = new MarkerWithLabel({
                map: window.map_router.map,
                raiseOnDrag: false,
                draggable: false,
                position: this.model.bounds.getCenter(),
                labelContent: this.model.get('name'),
                labelAnchor: new google.maps.Point(point_fix, 0),
                labelClass: "labels",
                labelStyle: {opacity: 0.75},
                icon: 'images.png'
            });
        },
        fill_region: function(color) {
            _.each(this.model.gmaps_polygons, function(polygon) {
                polygon.setOptions({ fillColor: color });
            });
        },
        toggle: function(color, visible) {
            _.each(this.model.gmaps_polygons, function(polygon) {
                polygon.setVisible(visible);
            });
        },
        render_polygon: function(polygon, bounds) {
            var coordinates = [];

            _.each(polygon.coordinates, function(coordinate) {
                var lat = coordinate[0];
                var lng = coordinate[1];
                var gmap_coordinate = new google.maps.LatLng(lat, lng);
                coordinates.push(gmap_coordinate);
                bounds.extend(gmap_coordinate);
            });


            var polygonOptions = {
                path: coordinates,
                strokeColor: "#FFFFFF",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#0000FF",
                fillOpacity: 0.6,
                clickable: true
            };

            var gmapspolygon = new google.maps.Polygon(polygonOptions);

            var self_model = this.model;
            google.maps.event.addListener(gmapspolygon, "mouseover",
                function () {
                    self_model.trigger("fill_region", '#000');
            });

            google.maps.event.addListener(gmapspolygon, "mouseout",
                function () {
                    self_model.trigger("fill_region", '#0000FF');
            });

            gmapspolygon.setMap(window.map_router.map);
            return gmapspolygon;
        }
    });

    Place = Backbone.Model.extend({});
    PlaceView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },
        render: function() {
            var lat = this.model.get('lat');
            var lng = this.model.get('lng');
            var myLatlng = new google.maps.LatLng(lat, lng);

            //XXX refatorar para algo melhor
            var _map = window.map_router.map;

            var marker = new google.maps.Marker({
                position: myLatlng,
                map: _map,
                title: this.model.get('name')
            });
        }
    });

    Map = Backbone.Model.extend({});
    MapView = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },
        render: function() {
            var map = new google.maps.Map(document.getElementById('map_canvas'),
                                          this.model.toJSON());
            return map;
        }
    });

    MapRouter = Backbone.Router.extend({
        routes: {
            'regioes' : 'regioes',
            'bairros' : 'bairros'
        },
        initialize: function() {
            var _map = {
                zoom: 11,
                center: new google.maps.LatLng(-22.9488441857552033,
                                               -43.358066177368164),
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                noClear: true,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                scaleControl: true,
                scaleControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP
                },
                panControl: false,
                streetViewControl: false,
                scrollwheel: false
            };
            var map = new Map(_map);
            map_view = new MapView({model:map});
            this.map = map_view.render();
        },
        regioes: function() {
            this.regions = [];
            var zs_map_polygons = [];
            var sepe_map_polygons = [];
            var jaca_map_polygons = [];
            var guanabara_map_polygons = [];

            if (this.neighborhoods) {
                _.each(this.neighborhoods, function(element) {
                    element.toggle(false);
                });
            }

            _.each(zona_sul, function(element) {
                zs_map_polygons.push(element);
            });

            var zs_region = new Region({
                name: "Zona Sul",
                polygons: zs_map_polygons
            });
            var zs_regionView = new RegioView({model: zs_region});
            zs_regionView.render();

            this.regions.push(zs_regionView);

            var zo = _.union(sepetiba, jaca);
            var zo_polygons = [];
            _.each(zo, function(element) {
                zo_polygons.push(element);
            });
            var zo_region = new Region({
                name: "Zona Oeste",
                polygons: zo_polygons
            });
            var zo_regionView = new RegioView({model: zo_region});
            zo_regionView.render();

            this.regions.push(zo_regionView);

           // _.each(sepetiba, function(element) {
           //     sepe_map_polygons.push(element);
           // });
           // var sepe_region = new Region({
           //     name: "Sepetiba",
           //     polygons: sepe_map_polygons
           // });
           // var sepe_regionView = new RegioView({model: sepe_region});
           // sepe_regionView.render();

           // _.each(jaca, function(element) {
           //     jaca_map_polygons.push(element);
           // });
           // var jaca_region = new Region({
           //     name: "Jacarepaguá",
           //     polygons: jaca_map_polygons
           // });
           // var jaca_regionView = new RegioView({model: jaca_region});
           // jaca_regionView.render();

            _.each(guanabara, function(element) {
                guanabara_map_polygons.push(element);
            });

            var guanabara_region = new Region({
                name: "Zona Norte",
                polygons: guanabara_map_polygons
            });
            var guanabara_regionView = new RegioView({model: guanabara_region});
            guanabara_regionView.render();

            this.regions.push(guanabara_regionView);

        },
        bairros: function() {
            this.neighborhoods = [];

            _.each(this.regions, function(element) {
                element.toggle(false);
            });

            var self = this;
            _.each(neighborhood, function(element) {
                var region = new Region(element);
                var regionView = new RegioView({model:region});
                regionView.render();
                self.neighborhoods.push(regionView);
            });

            var _project = {
                lat: -22.9488441857552033,
                lng: -43.358066177368164
            };
        },
        name: function () {
            _.each(this.regions, function(element) {
                element.show_name();
            });
        }
    });

    return {
        Region: Region,
        RegioView: RegioView,
        Place: Place,
        PlaceView: PlaceView,
        Map: Map,
        MapView: MapView,
        MapRouter: MapRouter
    };
});
