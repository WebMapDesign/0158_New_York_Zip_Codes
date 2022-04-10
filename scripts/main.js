const urlSheetBusinesses =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRszMoyhL682LKOslg7WIYYjAZHzdvDzKJQ-2uoIZNvXJ_vN46ldt4wxKDVPbgqSpMXoi4fSSaI2i3k/pub?output=csv";

let geojsonBusinesses = {
  type: "FeatureCollection",
  name: "points businesses",
  crs: {
    type: "name",
    properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
  },
  features: [],
};

let sheetData;
let sheetHeaders;

function getBusinesses() {
  Papa.parse(urlSheetBusinesses, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      sheetData = results.data;
      sheetHeaders = results.meta.fields;

      sheetData.forEach((obj1) => {
        let newPoint = {
          type: "Feature",
          properties: {
            ...obj1,
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(obj1["Longitude"]),
              parseFloat(obj1["Latitude"]),
            ],
          },
        };
        geojsonBusinesses["features"].push(newPoint);
      });

      drawMap();
    },
  });
}

getBusinesses();

function drawMap() {
  let map = L.map("map", {
    fullScreenControl: false,
  }).setView([40.7, -73.55], 9);

  L.easyButton(
    '<span class="star" style="padding:0px;">&starf;</span>',

    function (btn, map) {
      map.setView([40.7, -73.55], 9);
    },
    "Default View"
  ).addTo(map);

  let layerTilesOSM = new L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</a>',
    }
  ).addTo(map);

  let popupStyle = {
    closeButton: true,
  };

  const colorTiers = {
    1: "#40ed46",
    2: "#ffbf52",
    3: "#fa7d8c",
    4: "#fff200",
  };

  function styleZipCodes(feature) {
    return {
      color: "#000000",
      fillColor: colorTiers[feature.properties.tier],
      fillOpacity: 0.6,
      opacity: 1,
      weight: 0.5,
    };
  }

  function highlightFeature(e) {
    e.target.setStyle({
      color: "#000000",
      fillColor: "#222222",
      fillOpacity: 0.5,
      opacity: 1,
      weight: 0.5,
    });
  }

  let layerZipCodes;

  function resetHighlightZipCodes(e) {
    layerZipCodes.resetStyle(e.target);
  }

  function onEachFeatureZipCodes(feature, layer) {
    let tooltipContent = feature.properties.ZCTA5CE20;
    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: "center",
      className: "tooltip-style",
    });

    let popupContent =
      '<p class="popup-title">' +
      feature.properties.ZCTA5CE20 +
      "</p>" +
      '<p class="popup-text">Tier ' +
      feature.properties.tier +
      "</p>";

    layer.bindPopup(popupContent, popupStyle);
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlightZipCodes,
    });
  }

  function onEachFeaturePoint(feature, layer) {
    let popupContent = "";

    sheetHeaders
      .filter((header) => header !== "Longitude" && header !== "Latitude")
      .forEach((header) => {
        popupContent +=
          '<p class="popup-text">' +
          header.toUpperCase() +
          ': <span class="value">' +
          feature.properties[header] +
          "</span></p>";
      });

    layer.bindPopup(popupContent, {});
  }

  layerZipCodes = L.geoJSON(geojsonZipCodes, {
    style: styleZipCodes,
    onEachFeature: onEachFeatureZipCodes,
  }).addTo(map);

  let layerPoints = L.geoJson(geojsonBusinesses, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        color: "#000000",
        fillColor: "#ffffff",
        fillOpacity: 1,
        opacity: 1,
        radius: 7,
        weight: 3,
      });
    },
    onEachFeature: onEachFeaturePoint,
  });
  layerPoints.addTo(map);

  // ---------------LEGEND ---------------
  let legendAreas = L.control({ position: "bottomleft" });

  legendAreas.onAdd = function (map) {
    let div = L.DomUtil.create("div", "info legend legend-sales");

    div.innerHTML = "";

    for (const tier in colorTiers) {
      div.innerHTML += `<i style="background: ${colorTiers[tier]}"></i>Tier ${tier}<br>`;
    }

    return div;
  };

  legendAreas.addTo(map);
}
