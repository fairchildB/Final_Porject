// Create the map and center on Oregon
var map = L.map('map').setView([44.0, -120.5], 7);

// Add a tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/breezy69/cm7z3rhps000k01sl35a94x3r/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYnJlZXp5NjkiLCJhIjoiY2xvaXlwMWxpMHB2cjJxcHFyeTMwNzk0NCJ9.R18DLRCA9p_SNX-6dtZZZg', {
    attribution: '&copy; <a href="https://www.mapbox.com">Mapbox</a>'
}).addTo(map);

// Initialize an empty layers object
var layers = {};

// URLs of the GeoJSON files (excluding Building Footprints)
var geojsonUrls = [
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/SM.geojson?v=1741035058274",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/M.geojson?v=1741035069680",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/L.geojson?v=1741035081255",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/XL.geojson?v=1741035092153",
    "https://cdn.glitch.global/6d24de68-ac4f-4f43-8ed0-ad2d3d06c61a/XXL.geojson?v=1741035102948"
];

// Define the correct order for the layer names
var layerNames = ['Small', 'Medium', 'Large', 'Extra-Large', 'Extra-Extra-Large'];

// Scenario data
var scenarioData = {
    'Small': { population: 19033, buildings: 12385 },
    'Medium': { population: 28192, buildings: 22590 },
    'Large': { population: 39755, buildings: 33918 },
    'Extra-Large': { population: 57095, buildings: 50267 },
    'Extra-Extra-Large': { population: 127723, buildings: 53941 }
};

// Scenario data
var roadData = {
    'Small': { length: 806.71 },
    'Medium': { length: 1136.05 },
    'Large': { length: 1532.56 },
    'Extra-Large': { length: 2033.44 },
    'Extra-Extra-Large': { length: 2164.54 }
};

// Initialize Chart.js with default "Small" scenario data
var ctx = document.getElementById('populationChart').getContext('2d');
var populationChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Population', 'Number of Buildings'],
        datasets: [{
            label: 'Small',
            data: [scenarioData['Small'].population, scenarioData['Small'].buildings],
            backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 159, 64, 0.2)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1
        }]
    },
    options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
    }
});

function updateChartData(label) {
    var populationValue = scenarioData[label].population;
    var buildingsValue = scenarioData[label].buildings;
    populationChart.data.datasets[0].label = label;
    populationChart.data.datasets[0].data = [populationValue, buildingsValue];
    populationChart.data.labels = ['Population', 'Number of Buildings'];
    populationChart.update();
    document.getElementById('scenarioName').innerText = label;
}

function createRadioButton(name, layer) {
    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'layerControl';
    radio.value = name;
    radio.onclick = function() {
        for (var key in layers) {
            if (layers[key] && key !== 'Choropleth' && key !== 'Roads' && key !== 'bridges') {
                map.removeLayer(layers[key]);
            }
        }
        layer.addTo(map);
        updateChartData(name);

        if (roadsCheckbox.checked) {
            loadRoadsLayer(name);
        }
        updateBridgeDisplay(name);
    };
    return radio;
}

var layerControlDiv = document.createElement('div');
layerControlDiv.className = 'layer-control';
map.getContainer().appendChild(layerControlDiv);

var layerSelectionDiv = document.createElement('div');
layerSelectionDiv.id = 'layerSelectionDiv';
map.getContainer().appendChild(layerSelectionDiv);

var choroplethCheckbox = document.createElement('input');
choroplethCheckbox.type = 'checkbox';
choroplethCheckbox.id = 'choroplethCheckbox';
choroplethCheckbox.onchange = function() {
    if (choroplethCheckbox.checked) {
        addChoroplethLayer();
    } else {
        removeChoroplethLayer();
    }
};
var choroplethLabel = document.createElement('label');
choroplethLabel.htmlFor = 'choroplethCheckbox';
choroplethLabel.textContent = 'Show Census Blocks';
layerSelectionDiv.appendChild(choroplethCheckbox);
layerSelectionDiv.appendChild(choroplethLabel);

function getChoroplethColor(d) {
    return d > 500 ? '#800026' : d > 400 ? '#BD0026' : d > 300 ? '#E31A1C' : d > 200 ? '#FC4E2A' : d > 100 ? '#FD8D3C' : d > 50 ? '#FEB24C' : d > 20 ? '#FED976' : '#FFEDA0';
}

function addChoroplethLayer() {
    fetch('https://cdn.glitch.me/ecc24017-de3b-4e2a-bfc9-fbbd2940efe6/CensusBlocks_E_FeaturesToJSO.geojson?v=1741221960959')
        .then(response => response.json())
        .then(data => {
            var choroplethLayer = L.geoJSON(data, {
                style: function(feature) {
                    var population = feature.properties.POP20;
                    return { fillColor: getChoroplethColor(population), weight: 1, color: 'black', fillOpacity: 0.7 };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.POP20) {
                        layer.bindPopup('Population: ' + feature.properties.POP20);
                    }
                }
            }).addTo(map);
            layers['Choropleth'] = choroplethLayer;
            legend.getContainer().style.display = 'block';
        });
}

function removeChoroplethLayer() {
    if (layers['Choropleth']) {
        map.removeLayer(layers['Choropleth']);
        delete layers['Choropleth'];
        legend.getContainer().style.display = 'none';
    }
}

var legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.style.display = 'none';

    var title = document.createElement('h4');
    title.textContent = 'Total Population';
    div.appendChild(title);

    var grades = [0, 100, 200, 300, 400];
    var labels = [];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + getChoroplethColor(grades[i] + 1) + '; width: 18px; height: 18px; display: inline-block; margin-right: 5px;"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    div.style.backgroundColor = 'white';
    div.style.border = '2px solid black';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';

    return div;
};

legend.addTo(map);

function fetchData(url, index) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            var layerName = layerNames[index];
            var layer = L.geoJSON(data, {
                style: { fillColor: '#000080', fillOpacity: 0.5, color: 'none', weight: 0 }
            });
            layers[layerName] = layer;

            var radio = createRadioButton(layerName, layer);
            var label = document.createElement('label');
            label.textContent = layerName;
            label.insertBefore(radio, label.firstChild);
            layerControlDiv.appendChild(label);

            if (index === 0) {
                radio.checked = true;
                layer.addTo(map);
                updateChartData(layerName);
            }

            if (index + 1 < geojsonUrls.length) {
                fetchData(geojsonUrls[index + 1], index + 1);
            }
        });
}

var roadsCheckbox = document.createElement('input');
roadsCheckbox.type = 'checkbox';
roadsCheckbox.id = 'roadsCheckbox';
roadsCheckbox.onchange = function() {
    const selectedScenario = document.querySelector('input[name="layerControl"]:checked').value;
    if (roadsCheckbox.checked) {
        loadRoadsLayer(selectedScenario);
    } else {
        removeRoadsLayer();
    }
};
var roadsLabel = document.createElement('label');
roadsLabel.htmlFor = 'roadsCheckbox';
roadsLabel.textContent = 'Show Roads';
layerSelectionDiv.appendChild(roadsCheckbox);
layerSelectionDiv.appendChild(roadsLabel);

function loadRoadsLayer(scenario) {
    const roadUrls = {
        'Small': 'https://cdn.glitch.global/ccef502e-1fb7-408f-a512-ada8615424bc/Roads_SM.geojson?v=1741887590552',
        'Medium': 'https://cdn.glitch.global/ccef502e-1fb7-408f-a512-ada8615424bc/Roads_M.geojson?v=1741887595345',
        'Large': 'https://cdn.glitch.global/ccef502e-1fb7-408f-a512-ada8615424bc/Roads_L.geojson?v=1741887601117',
        'Extra-Large': 'https://cdn.glitch.global/ccef502e-1fb7-408f-a512-ada8615424bc/Roads_XL.geojson?v=1741887607363',
        'Extra-Extra-Large': 'https://cdn.glitch.global/ccef502e-1fb7-408f-a512-ada8615424bc/Roads_XXL.geojson?v=1741887614971'
    };

    if (layers['Roads']) {
        map.removeLayer(layers['Roads']);
    }

    fetch(roadUrls[scenario])
        .then(response => response.json())
        .then(data => {
            const roadsLayer = L.geoJSON(data, {
                style: { color: 'yellow', weight: 2 },
                onEachFeature: function(feature, layer) {
                    const name = feature.properties.NAME || 'N/A';
                    const type = feature.properties.TYPE || 'N/A';
                    const roadOwner = feature.properties.ROADOWNER || 'N/A';
                    layer.bindPopup(`<strong>Name:</strong> ${name}<br><strong>Type:</strong> ${type}<br><strong>Road Owner:</strong> ${roadOwner}`);
                }
            }).addTo(map);

            layers['Roads'] = roadsLayer;
        });
}

function removeRoadsLayer() {
    if (layers['Roads']) {
        map.removeLayer(layers['Roads']);
        delete layers['Roads'];
    }
}

fetchData(geojsonUrls[0], 0);

async function fetchGeoJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
    }
    return response.json();
}

async function updateBridgeDisplay(selectedScenario) {
    try {
        const bridgesUrl = 'https://cdn.glitch.global/4f720013-28a5-46b1-961f-05ff4a2c0a13/bridges.geojson?v=1741892587258';
        const bridgesData = await fetchGeoJSON(bridgesUrl);

        const tsunamiPolygonUrl = geojsonUrls[layerNames.indexOf(selectedScenario)];
        const tsunamiPolygonData = await fetchGeoJSON(tsunamiPolygonUrl);

        if (layers['bridges']) {
            map.removeLayer(layers['bridges']);
            delete layers['bridges'];
        }

        if (bridgesCheckbox.checked) {
            const bridgeIcon = L.icon({
                iconUrl: 'https://cdn.glitch.global/2b11aa36-9f95-4830-8b40-12d6fd4b19af/icons8-bridge-40.png?v=1741980057603',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });

            const bridgesLayer = L.geoJSON(bridgesData, {
                pointToLayer: function(feature, latlng) {
                    const marker = L.marker(latlng, { icon: bridgeIcon });
                    marker.setOpacity(0);
                    return marker;
                },
                onEachFeature: function(feature, layer) {
                    const name = feature.properties.BRIDGE_NAM || 'N/A';
                    const type = feature.properties.OWNER || 'N/A';
                    const roadOwner = feature.properties.BRIDGE_CON || 'N/A';
                    layer.bindPopup(`<strong>Name:</strong> ${name}<br><strong>Owner:</strong> ${type}<br><strong> Condition:</strong> ${roadOwner}`);
                }
            }).addTo(map);

            layers['bridges'] = bridgesLayer;

            bridgesData.features.forEach(bridgeFeature => {
                const bridgePoint = turf.point([bridgeFeature.geometry.coordinates[0], bridgeFeature.geometry.coordinates[1]]);
                let isInside = false;

                tsunamiPolygonData.features.forEach(polygonFeature => {
                    if (turf.inside(bridgePoint, polygonFeature)) {
                        isInside = true;
                    }
                });

                if (isInside) {
                    bridgesLayer.eachLayer(layer => {
                        if (layer.feature === bridgeFeature) {
                            layer.setOpacity(1);
                            const element = layer.getElement();
                            if (element && element.querySelector('img')) {
                                element.querySelector('img').style.filter = 'brightness(100) saturate(100%) invert(18%) sepia(99%) saturate(7492%) hue-rotate(359deg) brightness(101%) contrast(107%)';
                            }
                        }
                    });
                }
            });
        }

        const bridgeCount = turf.pointsWithinPolygon(
            turf.featureCollection(bridgesData.features),
            tsunamiPolygonData
            ).features.length;const roadLength = roadData[selectedScenario].length;

            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `<p>${roadLength.toFixed(2)} miles of road, ${bridgeCount} bridges</p>`;
        
        } catch (error) {
            console.error('Error updating bridge display:', error);
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
        }
        
        if (document.querySelector('input[name="layerControl"]:checked')) {
        updateBridgeDisplay(document.querySelector('input[name="layerControl"]:checked').value);
        } else {
        updateBridgeDisplay("Small");
        }
        
        var bridgesCheckbox = document.createElement('input');
        bridgesCheckbox.type = 'checkbox';
        bridgesCheckbox.id = 'bridgesCheckbox';
        bridgesCheckbox.onchange = function() {
        const selectedScenario = document.querySelector('input[name="layerControl"]:checked').value;
        updateBridgeDisplay(selectedScenario);
        };
        var bridgesLabel = document.createElement('label');
        bridgesLabel.htmlFor = 'bridgesCheckbox';
        bridgesLabel.textContent = 'Show Bridges';
        layerSelectionDiv.appendChild(bridgesCheckbox);
        layerSelectionDiv.appendChild(bridgesLabel);
       
        
// Define a custom icon for the markers
const buoyIcon = L.icon({
    iconUrl: 'https://cdn.glitch.global/13b3bc19-3bac-42cd-9c03-9f4d575ef0d6/buoy.png?v=1742057592739',
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 16], // Anchor point of the icon
    popupAnchor: [0, -16] // Position of the popup
});

// Array of coordinates (latitude, longitude) and corresponding image URLs
const points = [
    { coords: [42.754, -124.839], imageUrl: 'https://www.ndbc.noaa.gov/buoycam.php?station=46015' },
    { coords: [44.669, -124.546], imageUrl: 'https://www.ndbc.noaa.gov/buoycam.php?station=46050' },
    { coords: [45.928, -125.815], imageUrl: 'https://www.ndbc.noaa.gov/buoycam.php?station=46089' },
    { coords: [46.163, -124.487], imageUrl: 'https://www.ndbc.noaa.gov/buoycam.php?station=46029' }
];

points.forEach(point => {
    L.marker(point.coords, { icon: buoyIcon }).addTo(map)
     .on('click', () => {
         // Update the buoyImage div with the selected buoy's image
         document.getElementById('buoyImage').innerHTML = `
             <img src="${point.imageUrl}" alt="Buoy Cam Image" style="max-width: 1000px; height: 250px;" />
         `;
     });
});

// Add a click event to the map to clear the buoyImage div when clicking off the markers
map.on('click', () => {
    document.getElementById('buoyImage').innerHTML = `
        <p>Click on a buoy marker to see the real-time image here. Click again to hide it.</p>
    `;
});