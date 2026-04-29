// =============================
// Mapa inicial 
// =============================

var map = L.map('map').setView([6.605, -75.426], 16); //coordenadas y zoom

// =============================
// Mapas bases
// =============================

var baseLayers = {
    imagery: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri' }
  
    ),
    osmDE: OpenStreetMap_DE = L.tileLayer(
    'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }
),
};

// Capa base inicial
baseLayers.imagery.addTo(map);

// =============================
// Configuración de mapas en formato GeoJSON
// Agrega nuevas capas de ArcGIS aquí
// =============================

var capasConfig = [
    { key: 'Centro poblado', nombre: 'Centro poblado', url: 'data/C_P_Hoyorrico.geojson' },
    { key: 'Veredas corregimiento', nombre: 'Veredas corregimiento', url: 'data/Veredas_C_Hoyorrico.json' },
    { key: 'Terrenos Hoyorrico', nombre: 'Terrenos Hoyorrico', url: 'data/u_clc_terreno.json' },
    { key: 'Vias centro poblado', nombre: 'Vias centro poblado', url: 'data/Vias_C_P.json' },
    { key: 'Construcciones Hoyorrico', nombre: 'Construcciones Hoyorrico', url: 'data/u_clc_Construcciones.json'},
    { key: 'Parcelacion centro poblado', nombre: 'Parcelaciones centro poblado', url: 'data/Parcelacion_C_PHoyorrico.json' },
    
    // ===== AÑO 2010 =====
    { key: 'Construcciones 2010', nombre: 'Contrucciones nuevas año 2010', url: 'data/Identificacion_construcciones_2010.json', grupo: 'Cartografía Año 2010' },
    
    // ===== AÑO 2018 =====
    { key: 'Construcciones 2018', nombre: 'Contrucciones nuevas año 2018', url: 'data/Identificacion_construcciones_2018.json', grupo: 'Cartografía Año 2018' },
    { key: 'Suelo Expansión 2018', nombre: 'Suelo expansión 2018', url: 'data/Suelo_Expansion_2018.json', grupo: 'Cartografía Año 2018' },
   
    // ===== AÑO 2025 =====
    { key: 'Construcciones 2025', nombre: 'Contrucciones nuevas año 2025', url: 'data/Identificacion_construcciones_2025.json', grupo: 'Cartografía Año 2025' },
    { key: 'Cobertura', nombre: 'Area de estudio', url: 'data/Cobertura_330m.json', grupo: 'Cartografía Año 2025' },
    { key: 'Suelo Expansión 2025', nombre: 'Suelo expansión 2025', url: 'data/Suelo_Expansion_2025.json', grupo: 'Cartografía Año 2025' },
];

// Almacenes generales de las capas
var capasGeoJSON = {};  // guarda los datos GeoJSON
var capasLeaflet = {};  // guarda las capas Leaflet

// Grupo padre para capas geográficas
var grupoCapasGeograficas = L.layerGroup().addTo(map);

// =============================
// Popups atributos de las capas
// =============================



function popupDesdeAtributos(feature) {
    if (!feature.properties) return 'Sin atributos';

    let html = '';
    let tieneDatos = false;

    for (let campo in feature.properties) {
        let valor = feature.properties[campo];

        // ❌ eliminar nulos, vacíos y ceros
        if (
            valor === null ||
            valor === undefined ||
            valor === '' ||
            valor === 0
        ) {
            continue;
        }

        // ✅ formatear números (áreas, longitudes, etc.)
        if (typeof valor === 'number') {
            valor = valor.toFixed(3);
        }

        html += `<b>${campo}:</b> ${valor}<br>`;
        tieneDatos = true;
    }

    return tieneDatos ? html : 'Sin atributos relevantes';
}


// =============================
// Configuración de estilo por capas
// =============================

function obtenerEstiloPorCapa(key) {
    const estilos = {
        'Centro poblado': {
            color: '#ffc400',
            weight: 2,
            fillOpacity: 0.0
        },
        'Veredas corregimiento': {
            color: '#bbff00',
            weight: 0.5,
            fillOpacity: 0.0
        },
        'Construcciones Hoyorrico': {
            color: '#ff0000',
            weight: .8,
            fillColor: '#ffffff',
            fillOpacity: 0.6
        },
        'Parcelacion centro poblado': {
            color: '#5f5f5f',
            weight: 1,
            fillOpacity: 0.0
        },
    
        'Suelo Expansión 2025': {
            color: '#9172b4',
            weight: 1,
            fillOpacity: 0.6
        },

        'Suelo Expansión 2018': {
            color: '#b47272',
            weight: 1,
            fillOpacity: 0.6
        },

        'Terrenos Hoyorrico': {
            color: '#e58f1e',
            weight: .5,
            fillOpacity: 0.0
        },

         'Vias centro poblado': {
            color: '#c300ff',
            weight: 2,
            fillOpacity: 0.0
        },

        'Cobertura': {
            color: '#a4a1a1',
            fillColor: '#bbbb31',
            weight: 1,
            fillOpacity: 0.3,
            dashArray: '7' //Linea punteada
        },

        
        'Construcciones 2010': {
            color: '#0055ff',
            fillColor: '#0055ff' 
        },

        'Construcciones 2018': {
            color: '#9900ff',
            fillColor: '#9900ff'
        },


        'Construcciones 2025': {
          color: '#ff6f00',
          fillColor: '#ff6f00'
        }

    };

    return estilos[key] || {
        color: '#333',
        weight: 1,
        fillOpacity: 0.2
    };
}

// =============================
// CARGAR CAPAS (CON PUNTOS ROJOS)
// =============================

function cargarCapa(config) {
    fetch(config.url)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            capasGeoJSON[config.key] = data;
            var layer;

            // =============================
            // MODIFICACIÓN: CAPA PUNTOS ROJOS
            // =============================

            if (config.key === 'Construcciones 2010') {
                layer = L.geoJSON(data, {
                    // Si el GeoJSON trae polígonos, calculamos el centro para poner el punto
                    coordsToLatLng: function(coords) {
                        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                            var lat = 0, lng = 0, cont = 0;
                            coords[0].forEach(function(c) {
                                lng += c[0];
                                lat += c[1];
                                cont++;
                            });
                            return L.latLng(lat / cont, lng / cont);
                        }
                        return L.latLng(coords[1], coords[0]);
                    },
                    // Definimos el estilo de punto rojo
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: '#0055ff', // Rojo
                            color: '#FFFFFF',     // Borde blanco para contraste
                            weight: 1.5,
                            opacity: 1,
                            fillOpacity: 1
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(popupDesdeAtributos(feature));
                    }
                });
            } else {


            if (config.key === 'Construcciones 2018') {
                layer = L.geoJSON(data, {
                    // Si el GeoJSON trae polígonos, calculamos el centro para poner el punto
                    coordsToLatLng: function(coords) {
                        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                            var lat = 0, lng = 0, cont = 0;
                            coords[0].forEach(function(c) {
                                lng += c[0];
                                lat += c[1];
                                cont++;
                            });
                            return L.latLng(lat / cont, lng / cont);
                        }
                        return L.latLng(coords[1], coords[0]);
                    },
                    // Definimos el estilo de punto rojo
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: '#9900ff', // Morado
                            color: '#FFFFFF',     // Borde blanco para contraste
                            weight: 1.5,
                            opacity: 1,
                            fillOpacity: 1
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(popupDesdeAtributos(feature));
                    }
                });
            } else 

            if (config.key === 'Construcciones 2025') {
                layer = L.geoJSON(data, {
                    // Si el GeoJSON trae polígonos, calculamos el centro para poner el punto
                    coordsToLatLng: function(coords) {
                        if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                            var lat = 0, lng = 0, cont = 0;
                            coords[0].forEach(function(c) {
                                lng += c[0];
                                lat += c[1];
                                cont++;
                            });
                            return L.latLng(lat / cont, lng / cont);
                        }
                        return L.latLng(coords[1], coords[0]);
                    },
                    // Definimos el estilo de punto rojo
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 4,
                            fillColor: '#ff6f00', // Rojo
                            color: '#FFFFFF',     // Borde blanco para contraste
                            weight: 1.5,
                            opacity: 1,
                            fillOpacity: 1
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        layer.bindPopup(popupDesdeAtributos(feature));
                    }
                });
            } else 
                // =============================
                //Capas / Color de capas
                // =============================
                layer = L.geoJSON(data, {
    style: function(feature) {
        // Aquí llamamos a tu función de estilos usando la key de la capa
        return obtenerEstiloPorCapa(config.key);
    },
    onEachFeature: function(feature, layer) {
        layer.bindPopup(popupDesdeAtributos(feature));
    }

});


            }
                 
                // =============================
                // Control de capas
                // =============================

            capasLeaflet[config.key] = layer;
            // grupoCapasGeograficas.addLayer(layer);
            actualizarTreeControl();
        })
        .catch(function(error) {
            console.error('Error al cargar ' + config.url + ':', error);
        });
}


// =============================
// SELECTOR DE CAPAS PARA TABLA / DASHBOARD
// =============================

function poblarSelectorCapas() {
    var selector = document.getElementById('selectorCapa');
    selector.innerHTML = '';

    capasConfig.forEach(function(capa) {
        var option = document.createElement('option');
        option.value = capa.key;
        option.textContent = capa.nombre;
        selector.appendChild(option);
    });
}

function obtenerCapaSeleccionada() {
    var key = document.getElementById('selectorCapa').value;
    var config = capasConfig.find(function(c) { return c.key === key; });

    if (!config || !capasGeoJSON[key]) return null;

    return {
        key: key,
        data: capasGeoJSON[key],
        titulo: config.nombre
    };
}

// =============================
// CONTROL DE CAPAS AGRUPADO
// Requiere Leaflet.Control.Layers.Tree
// =============================
var treeControl = null;

function actualizarTreeControl() {
    if (treeControl) {
        treeControl.remove();
    }

    var baseTree = {
        label: '<b>Tipo de Mapa Base</b>', // Titilo de mapas bases
        selectAllCheckbox: false,
        collapsed: true,
        children: [
            { label: 'Imagen satelital', layer: baseLayers.imagery },
            { label: 'Mapa basico', layer: baseLayers.osmDE }
        ]
    };

    // =============================
    // Organizar capas por año
    // =============================

var grupos = {};

capasConfig.forEach(function(capa) {

    // Si no tiene grupo, se asigna "General"
    var grupo = capa.grupo || 'Capas cartográficas';

    if (!grupos[grupo]) {
        grupos[grupo] = [];
    }

    if (capasLeaflet[capa.key]) {
        grupos[grupo].push({
            label: obtenerSimboloHTML(capa.key) + capa.nombre,
            layer: capasLeaflet[capa.key]
        });
    }
});

// Construcción del árbol

var overlaysTree = {
    label: '<b>Capas geográficas</b>',
    selectAllCheckbox: false,
    collapsed: true,
    children: Object.keys(grupos).map(function(grupo) {
        return {
            label: grupo,
            selectAllCheckbox: true,
            children: grupos[grupo]
        };
    })
};

    treeControl = L.control.layers.tree(baseTree, overlaysTree, {
    collapsed: false,
    position: 'topright' // se mantiene pero luego lo movemos
}).addTo(map);

// mover al panel derecho

setTimeout(function () {
    var control = document.querySelector('.leaflet-control-layers');
    var panel = document.getElementById('panelInferior');
    
    if (control && panel) {
        panel.prepend(control); // lo mete dentro del panel
        control.style.position = 'relative';
        control.style.top = '0';
        control.style.left = '0';
        control.style.width = '100%';
    }
}, 500);
}

// =============================
// Tabla de atributos
// =============================

function mostrarTablaAtributos(geojson, titulo) {
    var contenedor = document.getElementById('tablaContenido');

    if (!geojson || !geojson.features || geojson.features.length === 0) {
        contenedor.innerHTML = '<p>No hay datos para mostrar.</p>';
        return;
    }

    if (!geojson.features[0].properties) {
        contenedor.innerHTML = '<p>No hay atributos disponibles.</p>';
        return;
    }

    

var campos = Object.keys(geojson.features[0].properties).filter(function(campo) {
    return geojson.features.some(function(feature) {
        const valor = feature.properties[campo];
        return (
            valor !== null &&
            valor !== undefined &&
            valor !== '' &&
            valor !== 0
        );
    });
});



    var html = '<h3>Tabla de atributos - ' + titulo + '</h3>';
    html += '<table><thead><tr>';

    campos.forEach(function(campo) {
        html += '<th>' + campo + '</th>';
    });

    html += '</tr></thead><tbody>';

    geojson.features.forEach(function(feature) {
        html += '<tr>';
        campos.forEach(function(campo) {
           
var valor = '';
if (feature.properties) {
    let v = feature.properties[campo];

    if (
        v !== null &&
        v !== undefined &&
        v !== '' &&
        v !== 0
    ) {
        if (typeof v === 'number') {
            valor = v.toFixed(3); // ✅ 3 decimales
        } else {
            valor = v;
        }
    }
}

html += '<td>' + valor + '</td>';

        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    contenedor.innerHTML = html;
}

// =============================
// Muestra Dashboard
// =============================

function mostrarDashboard(geojson, titulo) {
    var contenedor = document.getElementById('dashboardContenido');

    if (!geojson || !geojson.features || geojson.features.length === 0) {
        contenedor.innerHTML = '<p>No hay datos para resumir.</p>';
        return;
    }

    var totalRegistros = geojson.features.length;
    var totalCampos = geojson.features[0].properties
        ? Object.keys(geojson.features[0].properties).length
        : 0;

    var html = '<h3>Dashboard básico - ' + titulo + '</h3>';
    html += '<p><b>Total de registros:</b> ' + totalRegistros + '</p>';
    html += '<p><b>Total de campos:</b> ' + totalCampos + '</p>';

    contenedor.innerHTML = html;
}

// =============================
// Abre el panel grande
// =============================

function expandirPanel(idPanel) {
    var panel = document.getElementById(idPanel);
    var contenedor = document.getElementById('panelInferior');
    var panelConsulta = document.getElementById('panelConsulta');

    var left = panelConsulta.offsetLeft + panelConsulta.offsetWidth + 20;
    var top = 10;
    var width = contenedor.clientWidth - left - 10;
    var height = contenedor.clientHeight - 20;

    if (width < 250) width = 250;
    if (height < 140) height = 140;

    panel.style.left = '0';
    panel.style.top = '10px';
    panel.style.width = '100%';
    panel.style.height = 'auto';
}

// =============================
// Abre y cierra los paneles con botonoes
// =============================

function toggleDashboard() {
    var panel = document.getElementById('dashboard');
    var capa = obtenerCapaSeleccionada();

    if (panel.style.display === 'none' || panel.style.display === '') {
        //expandirPanel('dashboard');

        if (capa && capa.data) {
            mostrarDashboard(capa.data, capa.titulo);
        } else {
            document.getElementById('dashboardContenido').innerHTML = '<p>No hay datos cargados para esa capa.</p>';
        }

        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

function toggleTabla() {
    var panel = document.getElementById('tablaAtributos');
    var capa = obtenerCapaSeleccionada();

    if (panel.style.display === 'none' || panel.style.display === '') {

        if (capa && capa.data) {
            mostrarTablaAtributos(capa.data, capa.titulo);
        } else {
            document.getElementById('tablaContenido').innerHTML = '<p>No hay datos cargados para esa capa.</p>';
        }

        panel.style.display = 'block';

    } else {
        panel.style.display = 'none';
    }
}

// =============================
// ACTUALIZAR TABLA / DASHBOARD
// CUANDO CAMBIA LA CAPA
// =============================

document.getElementById('selectorCapa').addEventListener('change', function() {
    var capa = obtenerCapaSeleccionada();

    var panelDashboard = document.getElementById('dashboard');
    if (panelDashboard.style.display !== 'none' && capa && capa.data) {
        mostrarDashboard(capa.data, capa.titulo);
    }

    var panelTabla = document.getElementById('tablaAtributos');
    if (panelTabla.style.display !== 'none' && capa && capa.data) {
        mostrarTablaAtributos(capa.data, capa.titulo);
    }
});

// =============================
// INICIO
// =============================

poblarSelectorCapas();
capasConfig.forEach(cargarCapa);

function toggleAcordeon(header) {
    var item = header.parentElement;
    var body = header.nextElementSibling;

    if (item.classList.contains("active")) {
        item.classList.remove("active");
        body.style.display = "none";
    } else {
        item.classList.add("active");
        body.style.display = "block";
    }
}

document.querySelectorAll('.acordeon-body').forEach(function(body) {
    body.style.display = 'none';
});


// =============================
// GRUPO DE DIBUJOS (NO GIS)
// =============================
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// =============================
//ATEO DE NÚMEROS
// =============================
function formatearNumero(valor) {
    return Number(valor).toLocaleString('es-CO', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    });
}

// =============================
// CÁLCULOS SIG BÁSICOS
// =============================

// Longitud de línea (m)
function calcularLongitud(latlngs) {
    let total = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
        total += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    return total;
}

// Perímetro (m)
function calcularPerimetro(latlngs) {
    let total = 0;
    for (let i = 0; i < latlngs.length; i++) {
        let siguiente = (i + 1) % latlngs.length;
        total += latlngs[i].distanceTo(latlngs[siguiente]);
    }
    return total;
}

// Área en m² (aprox. para visor)
function calcularAreaMapa(latlngs) {
    return L.GeometryUtil.geodesicArea(latlngs);
}


//=============================
// CONTROL DE DIBUJO
// =============================
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        remove: true
    },
    draw: {
        polygon: {
            shapeOptions: { color: 'green', fillOpacity: 0.4 }
        },
        polyline: {
            shapeOptions: { color: 'orange' }
        },
        rectangle: {
            shapeOptions: { color: 'red', fillOpacity: 0.4 }
        },
        circle: {
            shapeOptions: { color: 'purple', fillOpacity: 0.3 }
        },
        marker: true,
        circlemarker: false
    }
});

map.addControl(drawControl);


// HERRAMIENTA DE MEDICIÓN
// =============================
var measureControl = new L.Control.Measure({
    position: 'topleft',
    primaryLengthUnit: 'meters',
    secondaryLengthUnit: 'kilometers',
    primaryAreaUnit: 'sqmeters',
    secondaryAreaUnit: 'hectares',
    activeColor: '#db4a29',
    completedColor: '#9b2d14'
});

measureControl.addTo(map);


// =============================
// crear función de simbología
// =============================

function obtenerSimboloHTML(key) {
    const estilo = obtenerEstiloPorCapa(key);

    // Detectar tipo básico (puedes mejorar esto luego)
    if (key.includes("Construcciones 20")) {
        // polígono
        return `<span style="
            display:inline-block;
            width:10px;
            height:10px;
            background:${estilo.fillColor || estilo.color};
            border-radius:50%;
            margin-right:6px;
        "></span>`;
    }

    if (key.includes("Vias")) {
        // línea
        return `<span style="
            display:inline-block;
            width:16px;
            height:2px;
            background:${estilo.color};
            margin-right:6px;
        "></span>`;
    }

    // polígono
    return `<span style="
        display:inline-block;
        width:12px;
        height:12px;
        background:${estilo.fillColor || estilo.color};
        border:1px solid ${estilo.color};
        margin-right:6px;
    "></span>`;
}

// =============================
// EVENTO: CUANDO SE CREA UN DIBUJO
// =============================
map.on(L.Draw.Event.CREATED, function (e) {
    var layer = e.layer;
    var tipo = e.layerType;

    drawnItems.addLayer(layer);

    crearPopupDibujo(layer, tipo);
});


//=============================
// POPUP SEGÚN TIPO DE DIBUJO
// =============================
function crearPopupDibujo(layer, tipo) {
    let html = '';

    if (tipo === 'marker') {
        let coord = layer.getLatLng();
        html =
            `<b>Punto</b><br>` +
            `Latitud: ${formatearNumero(coord.lat)}<br>` +
            `Longitud: ${formatearNumero(coord.lng)}`;
    }

    if (tipo === 'polyline') {
        let longitud = calcularLongitud(layer.getLatLngs());
        html =
            `<b>Línea</b><br>` +
            `Longitud: ${formatearNumero(longitud)} m`;
    }

    if (tipo === 'polygon' || tipo === 'rectangle') {
        let latlngs = layer.getLatLngs()[0];
        let area = calcularAreaMapa(latlngs);
        let perimetro = calcularPerimetro(latlngs);

        html =
            `<b>${tipo === 'polygon' ? 'Polígono' : 'Rectángulo'}</b><br>` +
            `Área: ${formatearNumero(area)} m²<br>` +
            `Perímetro: ${formatearNumero(perimetro)} m`;
    }

    if (tipo === 'circle') {
        let radio = layer.getRadius();
        let area = Math.PI * Math.pow(radio, 2);

        html =
            `<b>Círculo</b><br>` +
            `Radio: ${formatearNumero(radio)} m<br>` +
            `Área: ${formatearNumero(area)} m²`;
    }

    layer.bindPopup(html).openPopup();
}