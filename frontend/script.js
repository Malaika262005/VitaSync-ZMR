document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL = "https://vitasync-zmr-production.up.railway.app";

  const defaultHospitals = [
    {
      hospital_name: "City Care Hospital",
      notes: "Located in Faisalabad. ICU, Oxygen, Emergency and Doctors available.",
      capabilities: { ICU: "Yes", Oxygen: "Yes", Doctor: "Yes", Surgery: "No" },
      trust_score: 88,
      coords: [31.418, 73.079],
    },
    {
      hospital_name: "LifeLine Medical Center",
      notes: "Located in Faisalabad. Oxygen, Emergency and Surgery available.",
      capabilities: { ICU: "No", Oxygen: "Yes", Doctor: "Yes", Surgery: "Yes" },
      trust_score: 67,
      coords: [31.425, 73.085],
    },
    {
      hospital_name: "Green Valley Hospital",
      notes: "Located in Faisalabad. Doctors and basic emergency available.",
      capabilities: { ICU: "No", Oxygen: "No", Doctor: "Yes", Surgery: "No" },
      trust_score: 43,
      coords: [31.405, 73.065],
    },
  ];

  const appContainer = document.querySelector(".app-container");
  const mapPanel = document.querySelector(".map-panel");

  const map = L.map("map").setView([31.41, 73.08], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let markers = [];

  function showMapOnlyForSearch(targetId) {
    if (targetId === "search") {
      mapPanel.style.display = "flex";
      appContainer.style.gridTemplateColumns = "265px 1fr 365px";

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    } else {
      mapPanel.style.display = "none";
      appContainer.style.gridTemplateColumns = "265px 1fr";
    }
  }

  function clearMarkers() {
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];
  }

  function addMarkers(hospitalList) {
    clearMarkers();

    hospitalList.forEach((hospital) => {
      if (hospital.coords) {
        const hospitalName =
          hospital.hospital_name || hospital.name || "Unknown Hospital";
        const score = hospital.trust_score || hospital.trust || 0;

        const marker = L.marker(hospital.coords)
          .addTo(map)
          .bindPopup(`
            <b>${hospitalName}</b><br>
            Trust Score: ${score}/100
          `);

        markers.push(marker);
      }
    });
  }

  function focusHospitalOnMap(hospitalName, location) {
    clearMarkers();

    const query =
      location && location !== "Location not available"
        ? `${hospitalName}, ${location}`
        : hospitalName;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.length === 0) {
          alert("Location not found");
          return;
        }

        const lat = data[0].lat;
        const lon = data[0].lon;

        map.setView([lat, lon], 14);

        const marker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`<b>${hospitalName}</b><br>${location}`)
          .openPopup();

        markers.push(marker);
      })
      .catch(() => {
        alert("Map error");
      });
  }

  addMarkers(defaultHospitals);

  const moduleBtns = document.querySelectorAll(".module-btn");
  const modules = document.querySelectorAll(".module");

  moduleBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");

      modules.forEach((module) => module.classList.remove("active"));
      moduleBtns.forEach((button) => button.classList.remove("active"));

      document.getElementById(targetId).classList.add("active");
      this.classList.add("active");

      showMapOnlyForSearch(targetId);
    });
  });

  const searchBtn = document.getElementById("search-btn");
  const searchBox = document.getElementById("search-box");
  const results = document.getElementById("results");

  function getScoreClass(score) {
    if (score >= 75) return "high";
    if (score >= 50) return "medium";
    return "low";
  }

  function getScoreColor(score) {
    if (score >= 75) return "#16a34a";
    if (score >= 50) return "#ca8a04";
    return "#ef4444";
  }

  function getCapabilities(hospital) {
    return hospital.capabilities || {};
  }

  function getCapabilityTags(capabilities) {
    const yesTags = Object.entries(capabilities)
      .filter(([key, value]) => String(value).toLowerCase() === "yes")
      .map(([key, value]) => `${key}: ${value}`);

    return yesTags.length ? yesTags : ["Capabilities: Limited data"];
  }

  function getLocationFromNotes(notes) {
    if (!notes) return "Location not available";

    let match = notes.match(/located at\s+([^.,]*)/i);
    if (match) return match[1].trim();

    match = notes.match(/located in\s+([^.,]*)/i);
    if (match) return match[1].trim();

    match = notes.match(/hospital in\s+([^.,]*)/i);
    if (match) return match[1].trim();

    return "Location not available";
  }

  function updateStats(hospitalList) {
    const totalHospitals = document.getElementById("total-hospitals");
    const icuPercent = document.getElementById("icu-percent");
    const oxygenPercent = document.getElementById("oxygen-percent");

    const total = hospitalList.length;

    const icuCount = hospitalList.filter((hospital) => {
      const capabilities = getCapabilities(hospital);
      return String(capabilities.ICU).toLowerCase() === "yes";
    }).length;

    const oxygenCount = hospitalList.filter((hospital) => {
      const capabilities = getCapabilities(hospital);
      return String(capabilities.Oxygen).toLowerCase() === "yes";
    }).length;

    totalHospitals.textContent = total;
    icuPercent.textContent = total
      ? `${Math.round((icuCount / total) * 100)}%`
      : "0%";
    oxygenPercent.textContent = total
      ? `${Math.round((oxygenCount / total) * 100)}%`
      : "0%";
  }

  function showHospitals(hospitalList) {
    updateStats(hospitalList);
    addMarkers(hospitalList);
    updateTrustSystem(hospitalList);
    updateReports(hospitalList);

    results.innerHTML = "";

    if (!hospitalList || hospitalList.length === 0) {
      results.innerHTML = `<p>No hospitals found.</p>`;
      return;
    }

    hospitalList.forEach((hospital, index) => {
      const hospitalName =
        hospital.hospital_name ||
        hospital.name ||
        hospital.Hospital ||
        hospital["Hospital Name"] ||
        "Unknown Hospital";

      const score =
        hospital.trust_score || hospital.trust || hospital.TrustScore || 0;

      const scoreClass = getScoreClass(score);
      const capabilities = getCapabilities(hospital);
      const capabilityTags = getCapabilityTags(capabilities);

      const location =
        hospital.location ||
        hospital.Location ||
        hospital.city ||
        hospital.City ||
        hospital.address ||
        hospital.Address ||
        getLocationFromNotes(hospital.notes);

      const recommendation = hospital.recommendation || "Not available";
      const matchScore = hospital.match_score ?? "N/A";

      const card = document.createElement("div");
      card.className = "hospital-card";
      card.style.animationDelay = `${index * 0.12}s`;

      card.addEventListener("click", function () {
        focusHospitalOnMap(hospitalName, location);
      });

      card.innerHTML = `
        <h3>${hospitalName}</h3>
        <p>${location}</p>

        <div class="tags">
          ${capabilityTags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
        </div>

        <p class="trust-score ${scoreClass}">
          Trust Score: ${score}/100
        </p>

        <p><strong>Recommendation:</strong> ${recommendation}</p>
        <p><strong>Match Score:</strong> ${matchScore}</p>
      `;

      results.appendChild(card);
    });
  }

  function updateTrustSystem(hospitals) {
    if (!hospitals || hospitals.length === 0) return;

    const best = hospitals[0];
    const score = best.trust_score || 0;
    const cap = best.capabilities || {};
    const scoreColor = getScoreColor(score);

    document.getElementById("trust-score-value").textContent = score;
    document.getElementById("trust-hospital-name").textContent =
      best.hospital_name || "Unknown";

    let level = "Low Reliability";
    let levelClass = "low";

    if (score >= 75) {
      level = "High Reliability";
      levelClass = "high";
    } else if (score >= 50) {
      level = "Moderate Reliability (Verification Recommended)";
      levelClass = "medium";
    }

    const levelEl = document.getElementById("trust-level");
    levelEl.textContent = level;
    levelEl.className = levelClass;

    const circle = document.querySelector(".score-circle");
    circle.style.background = `conic-gradient(${scoreColor} ${score}%, #e2e8f0 0)`;

    document.getElementById("icu-bar").style.width =
      cap.ICU === "Yes" ? "90%" : "20%";

    document.getElementById("oxygen-bar").style.width =
      cap.Oxygen === "Yes" ? "80%" : "25%";

    document.getElementById("emergency-bar").style.width =
      cap.Emergency === "Yes" ? "90%" : "30%";

    document.getElementById("insight-1").textContent =
      `AI Insight: ${best.hospital_name} has ${cap.ICU === "Yes" ? "strong ICU" : "limited ICU"} capability.`;

    document.getElementById("insight-2").textContent =
      `System: Emergency readiness is ${cap.Emergency === "Yes" ? "available" : "not fully confirmed"}.`;

    const warningText =
      best.warnings && best.warnings.length > 0
        ? best.warnings[0]
        : `Overall trust score is ${level.toLowerCase()}.`;

    document.getElementById("insight-3").textContent =
      `AI Insight: ${warningText}`;
  }

  function updateReports(hospitalList) {
    if (!hospitalList || hospitalList.length === 0) return;

    const total = hospitalList.length;

    const countCapability = (capability) => {
      return hospitalList.filter((hospital) => {
        const cap = hospital.capabilities || {};
        return String(cap[capability]).toLowerCase() === "yes";
      }).length;
    };

    const icuCount = countCapability("ICU");
    const oxygenCount = countCapability("Oxygen");
    const doctorCount = countCapability("Doctor");
    const surgeryCount = countCapability("Surgery");

    const highTrustCount = hospitalList.filter(
      (hospital) => (hospital.trust_score || 0) >= 75
    ).length;

    const averageTrust =
      hospitalList.reduce((sum, hospital) => {
        return sum + (hospital.trust_score || 0);
      }, 0) / total;

    document.getElementById("report-total").textContent = total;
    document.getElementById("report-icu").textContent =
      `${Math.round((icuCount / total) * 100)}%`;
    document.getElementById("report-oxygen").textContent =
      `${Math.round((oxygenCount / total) * 100)}%`;
    document.getElementById("report-doctor").textContent =
      `${Math.round((doctorCount / total) * 100)}%`;
    document.getElementById("report-surgery").textContent =
      `${Math.round((surgeryCount / total) * 100)}%`;
    document.getElementById("report-high-trust").textContent =
      `${Math.round((highTrustCount / total) * 100)}%`;
    document.getElementById("report-average-trust").textContent =
      Math.round(averageTrust);
  }

  function fetchHospitals(query, callback, errorCallback) {
    fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        const hospitalData = Array.isArray(data)
          ? data
          : data.results || data.hospitals || data.data || [];

        callback(hospitalData);
      })
      .catch((err) => {
        console.error("Backend Error:", err);
        errorCallback();
      });
  }

  searchBtn.addEventListener("click", function () {
    const query = searchBox.value.trim();

    results.innerHTML = `<p>Searching...</p>`;

    fetchHospitals(
      query,
      function (hospitalData) {
        showHospitals(hospitalData);
      },
      function () {
        results.innerHTML = `<p>Backend connection error. Make sure uvicorn server is running.</p>`;
      }
    );
  });

  searchBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchBtn.click();
    }
  });

  const aiBtn = document.getElementById("ai-btn");
  const aiInput = document.getElementById("ai-input");
  const aiOutput = document.getElementById("ai-output");

  aiBtn.addEventListener("click", function () {
    const input = aiInput.value.trim();

    if (!input) {
      aiOutput.innerHTML = "⚠ Please describe your symptoms first.";
      return;
    }

    aiOutput.innerHTML = "🔍 Analyzing your symptoms...";

    fetch(`${API_BASE_URL}/ai-advisor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input }),
    })
      .then((res) => res.json())
      .then((data) => {
        let color = "#16a34a";

        if (data.severity === "moderate") color = "#ca8a04";
        if (data.severity === "emergency") color = "#ef4444";

        let html = `
          <h3 style="color:${color}">
            ${
              data.severity === "emergency"
                ? "🚨 Emergency"
                : data.severity === "moderate"
                ? "⚠ Doctor Recommended"
                : "🟢 Mild Condition"
            }
          </h3>

          <p><strong>Severity:</strong> ${data.severity}</p>
          <p><strong>Doctor Needed:</strong> ${
            data.doctor_needed ? "Yes" : "No"
          }</p>

          <p><strong>Advice:</strong> ${data.advice}</p>
        `;

        if (data.recommended_hospitals && data.recommended_hospitals.length > 0) {
          html += `<h4>🏥 Recommended Hospitals:</h4>`;

          data.recommended_hospitals.forEach((h, i) => {
            html += `
              <p>
                <strong>${i + 1}. ${h.hospital_name}</strong><br>
                Trust: ${h.trust_score}/100<br>
                Recommendation: ${h.recommendation}
              </p>
            `;
          });

          updateTrustSystem(data.recommended_hospitals);
          updateReports(data.recommended_hospitals);
        } else {
          html += `
            <h4>💡 Helpful Tips:</h4>
            <ul>
              <li>Take proper rest.</li>
              <li>Drink enough water.</li>
              <li>Monitor your symptoms.</li>
              <li>If symptoms get worse, consult a doctor.</li>
            </ul>
          `;
        }

        html += `
          <p style="font-size:12px; color:#64748b;">
            ⚠ ${data.disclaimer}
          </p>
        `;

        aiOutput.innerHTML = html;
      })
      .catch(() => {
        aiOutput.innerHTML = "⚠ Backend error.";
      });
  });

  showMapOnlyForSearch("search");
  showHospitals(defaultHospitals);
});